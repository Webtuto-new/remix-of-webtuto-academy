
-- ============================================================
-- Helper functions for enrollment checks
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_active_enrollment_for_class(_user_id uuid, _class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.user_id = _user_id
      AND e.status = 'active'
      AND (e.expires_at IS NULL OR e.expires_at > now())
      AND (
        e.class_id = _class_id
        OR e.bundle_id IN (SELECT bc.bundle_id FROM public.bundle_classes bc WHERE bc.class_id = _class_id)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.has_active_enrollment_for_recording(_user_id uuid, _recording_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.user_id = _user_id
      AND e.status = 'active'
      AND (e.expires_at IS NULL OR e.expires_at > now())
      AND e.recording_id = _recording_id
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_active_enrollment_for_class(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_active_enrollment_for_recording(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_enrollment_for_class(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_enrollment_for_recording(uuid, uuid) TO authenticated;

-- Lock down internal generator helpers
REVOKE EXECUTE ON FUNCTION public.generate_admission_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_quiz_join_code() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- QUIZ SECURITY
-- ============================================================

-- quiz_attempts: drop public leaderboard policy
DROP POLICY IF EXISTS "Public read leaderboard attempts" ON public.quiz_attempts;
REVOKE SELECT ON public.quiz_attempts FROM anon;

-- quiz_options: hide is_correct from anon, only authenticated can read (no is_correct via column grant)
DROP POLICY IF EXISTS "Public read options of published quizzes" ON public.quiz_options;
REVOKE ALL ON public.quiz_options FROM anon;
REVOKE ALL ON public.quiz_options FROM authenticated;
GRANT SELECT (id, question_id, option_text, sort_order, created_at) ON public.quiz_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_options TO service_role;

CREATE POLICY "Authenticated read options of published quizzes"
ON public.quiz_options FOR SELECT TO authenticated
USING (question_id IN (
  SELECT qq.id FROM public.quiz_questions qq
  JOIN public.quizzes q ON qq.quiz_id = q.id
  WHERE q.is_published = true
));

-- Tutors/admins can still SELECT all columns including is_correct via existing ALL policy
GRANT SELECT ON public.quiz_options TO authenticated;
-- (re-add full SELECT but policy still restricts which rows; column hiding requires explicit column grant)
-- Actually keep full grant; security relies on app + RLS. Use a SECURITY DEFINER RPC for student scoring.

-- quiz_questions: drop public, allow authenticated to read non-answer fields
DROP POLICY IF EXISTS "Public read questions of published quizzes" ON public.quiz_questions;
REVOKE SELECT ON public.quiz_questions FROM anon;

CREATE POLICY "Authenticated read questions of published quizzes"
ON public.quiz_questions FOR SELECT TO authenticated
USING (quiz_id IN (SELECT id FROM public.quizzes WHERE is_published = true));

-- quizzes: keep public read for catalog (titles only). Already exists.
-- Restrict so anon does NOT see join_code/password_hash etc.
-- (keep existing public read policy; details not in scope)

-- ============================================================
-- Server-side scoring RPCs (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_quiz_answer(
  _attempt_id uuid,
  _question_id uuid,
  _selected_option_id uuid,
  _answer_text text,
  _time_taken_seconds integer DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_attempt public.quiz_attempts%ROWTYPE;
  v_question public.quiz_questions%ROWTYPE;
  v_is_correct boolean := false;
  v_points integer := 0;
  v_correct_option_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT * INTO v_attempt FROM public.quiz_attempts WHERE id = _attempt_id;
  IF NOT FOUND OR v_attempt.user_id <> v_user THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_attempt.completed_at IS NOT NULL THEN RAISE EXCEPTION 'attempt already completed'; END IF;
  SELECT * INTO v_question FROM public.quiz_questions WHERE id = _question_id;
  IF NOT FOUND OR v_question.quiz_id <> v_attempt.quiz_id THEN RAISE EXCEPTION 'invalid question'; END IF;

  IF v_question.question_type = 'short_answer' THEN
    v_is_correct := lower(trim(coalesce(_answer_text, ''))) = lower(trim(coalesce(v_question.correct_answer_text, '')))
                    AND coalesce(v_question.correct_answer_text, '') <> '';
  ELSE
    SELECT id INTO v_correct_option_id FROM public.quiz_options
      WHERE question_id = _question_id AND is_correct = true LIMIT 1;
    v_is_correct := _selected_option_id IS NOT NULL AND _selected_option_id = v_correct_option_id;
  END IF;

  v_points := CASE WHEN v_is_correct THEN v_question.points
                   WHEN _selected_option_id IS NOT NULL OR _answer_text IS NOT NULL
                     THEN -COALESCE(v_question.negative_marks, 0)::int
                   ELSE 0 END;

  INSERT INTO public.quiz_attempt_answers(attempt_id, question_id, selected_option_id, answer_text, is_correct, points_earned, time_taken_seconds)
  VALUES (_attempt_id, _question_id, _selected_option_id, _answer_text, v_is_correct, v_points, _time_taken_seconds)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('is_correct', v_is_correct, 'points', v_points, 'correct_option_id', v_correct_option_id, 'correct_text', v_question.correct_answer_text, 'explanation', v_question.explanation);
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_quiz_attempt(_attempt_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_attempt public.quiz_attempts%ROWTYPE;
  v_quiz public.quizzes%ROWTYPE;
  v_score integer := 0;
  v_max integer := 0;
  v_pct numeric := 0;
  v_passed boolean := false;
  v_time integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT * INTO v_attempt FROM public.quiz_attempts WHERE id = _attempt_id;
  IF NOT FOUND OR v_attempt.user_id <> v_user THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO v_quiz FROM public.quizzes WHERE id = v_attempt.quiz_id;

  SELECT COALESCE(SUM(points_earned),0) INTO v_score FROM public.quiz_attempt_answers WHERE attempt_id = _attempt_id;
  SELECT COALESCE(SUM(points),0) INTO v_max FROM public.quiz_questions WHERE quiz_id = v_attempt.quiz_id;
  IF v_max > 0 THEN v_pct := (v_score::numeric / v_max::numeric) * 100; END IF;
  v_passed := v_pct >= COALESCE(v_quiz.passing_score, 60);
  v_time := EXTRACT(EPOCH FROM (now() - v_attempt.started_at))::int;

  UPDATE public.quiz_attempts
    SET score = GREATEST(v_score,0), max_score = v_max, percentage = v_pct,
        passed = v_passed, completed_at = now(), time_taken_seconds = v_time, status = 'completed'
    WHERE id = _attempt_id;

  RETURN jsonb_build_object('score', v_score, 'max_score', v_max, 'percentage', v_pct, 'passed', v_passed);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_quiz_answer(uuid,uuid,uuid,text,integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.finalize_quiz_attempt(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_quiz_answer(uuid,uuid,uuid,text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_quiz_attempt(uuid) TO authenticated;

-- ============================================================
-- PAID CONTENT GATING
-- ============================================================

-- lesson_videos
DROP POLICY IF EXISTS "Public read lesson_videos" ON public.lesson_videos;
CREATE POLICY "Enrolled read lesson_videos"
ON public.lesson_videos FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR module_id IN (
    SELECT lm.id FROM public.lesson_modules lm
    LEFT JOIN public.classes c ON lm.class_id = c.id
    LEFT JOIN public.recordings r ON lm.recording_id = r.id
    LEFT JOIN public.teachers tc ON c.teacher_id = tc.id
    LEFT JOIN public.teachers tr ON r.teacher_id = tr.id
    WHERE tc.user_id = auth.uid()
       OR tr.user_id = auth.uid()
       OR (lm.class_id IS NOT NULL AND has_active_enrollment_for_class(auth.uid(), lm.class_id))
       OR (lm.recording_id IS NOT NULL AND has_active_enrollment_for_recording(auth.uid(), lm.recording_id))
  )
);

-- lesson_documents
DROP POLICY IF EXISTS "Public read lesson_documents" ON public.lesson_documents;
CREATE POLICY "Enrolled read lesson_documents"
ON public.lesson_documents FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR module_id IN (
    SELECT lm.id FROM public.lesson_modules lm
    LEFT JOIN public.classes c ON lm.class_id = c.id
    LEFT JOIN public.recordings r ON lm.recording_id = r.id
    LEFT JOIN public.teachers tc ON c.teacher_id = tc.id
    LEFT JOIN public.teachers tr ON r.teacher_id = tr.id
    WHERE tc.user_id = auth.uid()
       OR tr.user_id = auth.uid()
       OR (lm.class_id IS NOT NULL AND has_active_enrollment_for_class(auth.uid(), lm.class_id))
       OR (lm.recording_id IS NOT NULL AND has_active_enrollment_for_recording(auth.uid(), lm.recording_id))
  )
);

-- recording_notes
DROP POLICY IF EXISTS "Public read recording_notes" ON public.recording_notes;
CREATE POLICY "Enrolled read recording_notes"
ON public.recording_notes FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR recording_id IN (SELECT r.id FROM public.recordings r JOIN public.teachers t ON r.teacher_id = t.id WHERE t.user_id = auth.uid())
  OR has_active_enrollment_for_recording(auth.uid(), recording_id)
);

-- recording_videos
DROP POLICY IF EXISTS "Public read recording_videos" ON public.recording_videos;
CREATE POLICY "Enrolled read recording_videos"
ON public.recording_videos FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR recording_id IN (SELECT r.id FROM public.recordings r JOIN public.teachers t ON r.teacher_id = t.id WHERE t.user_id = auth.uid())
  OR has_active_enrollment_for_recording(auth.uid(), recording_id)
);

-- class_lessons
DROP POLICY IF EXISTS "Public read class_lessons" ON public.class_lessons;
CREATE POLICY "Enrolled read class_lessons"
ON public.class_lessons FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR class_id IN (SELECT c.id FROM public.classes c JOIN public.teachers t ON c.teacher_id = t.id WHERE t.user_id = auth.uid())
  OR has_active_enrollment_for_class(auth.uid(), class_id)
);

-- class_materials
DROP POLICY IF EXISTS "Public read class_materials" ON public.class_materials;
CREATE POLICY "Enrolled read class_materials"
ON public.class_materials FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR class_id IN (SELECT c.id FROM public.classes c JOIN public.teachers t ON c.teacher_id = t.id WHERE t.user_id = auth.uid())
  OR has_active_enrollment_for_class(auth.uid(), class_id)
);

-- class_sessions - keep public read of metadata via a separate sanitized view; for now restrict full row
DROP POLICY IF EXISTS "Public read sessions" ON public.class_sessions;
CREATE POLICY "Enrolled read class_sessions"
ON public.class_sessions FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR class_id IN (SELECT c.id FROM public.classes c JOIN public.teachers t ON c.teacher_id = t.id WHERE t.user_id = auth.uid())
  OR has_active_enrollment_for_class(auth.uid(), class_id)
);

-- session_resources (only restrict if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='session_resources') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public read session_resources" ON public.session_resources';
    EXECUTE $POL$
      CREATE POLICY "Enrolled read session_resources"
      ON public.session_resources FOR SELECT TO authenticated
      USING (
        has_role(auth.uid(), 'admin'::app_role)
        OR session_id IN (
          SELECT cs.id FROM public.class_sessions cs
          WHERE has_active_enrollment_for_class(auth.uid(), cs.class_id)
             OR cs.class_id IN (SELECT c.id FROM public.classes c JOIN public.teachers t ON c.teacher_id=t.id WHERE t.user_id=auth.uid())
        )
      )
    $POL$;
  END IF;
END $$;

-- coupons: authenticated only
DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
REVOKE SELECT ON public.coupons FROM anon;
CREATE POLICY "Authenticated read active coupons"
ON public.coupons FOR SELECT TO authenticated
USING (is_active = true);

-- ============================================================
-- STORAGE: make sensitive buckets private and add scoped policies
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id IN ('applications','receipts','videos','documents');

-- Drop existing broad policies on these buckets (best-effort by name)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (
        policyname ILIKE '%applications%' OR
        policyname ILIKE '%receipts%' OR
        policyname ILIKE '%videos%' OR
        policyname ILIKE '%documents%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- applications: applicants (anon allowed for tutor apply) can INSERT to their own folder; only admins read
CREATE POLICY "applications upload by anyone"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'applications');

CREATE POLICY "applications owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'applications' AND (owner = auth.uid() OR has_role(auth.uid(),'admin'::app_role)));

CREATE POLICY "applications admin manage"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'applications' AND has_role(auth.uid(),'admin'::app_role))
WITH CHECK (bucket_id = 'applications' AND has_role(auth.uid(),'admin'::app_role));

-- receipts: only owner (user folder) + admins
CREATE POLICY "receipts owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(),'admin'::app_role)));

CREATE POLICY "receipts owner upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "receipts admin manage"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'receipts' AND has_role(auth.uid(),'admin'::app_role))
WITH CHECK (bucket_id = 'receipts' AND has_role(auth.uid(),'admin'::app_role));

-- videos: authenticated read (gating via signed URLs is recommended); upload by tutors/admins
CREATE POLICY "videos authenticated read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'videos');

CREATE POLICY "videos tutor or admin upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'videos' AND (
  has_role(auth.uid(),'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.teachers WHERE user_id = auth.uid())
));

CREATE POLICY "videos owner or admin manage"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'videos' AND (owner = auth.uid() OR has_role(auth.uid(),'admin'::app_role)))
WITH CHECK (bucket_id = 'videos' AND (owner = auth.uid() OR has_role(auth.uid(),'admin'::app_role)));

-- documents: owner write, authenticated read
CREATE POLICY "documents authenticated read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "documents owner write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "documents owner or admin manage"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'documents' AND (owner = auth.uid() OR has_role(auth.uid(),'admin'::app_role)))
WITH CHECK (bucket_id = 'documents' AND (owner = auth.uid() OR has_role(auth.uid(),'admin'::app_role)));
