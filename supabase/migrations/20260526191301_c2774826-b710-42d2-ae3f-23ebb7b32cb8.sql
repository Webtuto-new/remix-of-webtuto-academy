
-- ============================================================
-- Master Quiz Center: Phase 1 schema upgrade (additive only)
-- ============================================================

-- 1. Extend quizzes
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS quiz_mode text NOT NULL DEFAULT 'self_paced',
  ADD COLUMN IF NOT EXISTS syllabus text,
  ADD COLUMN IF NOT EXISTS chapter text,
  ADD COLUMN IF NOT EXISTS lesson text,
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS negative_marks_per_question numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shuffle_options boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_score_immediately boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_review boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_leaderboard boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS available_from timestamptz,
  ADD COLUMN IF NOT EXISTS available_until timestamptz,
  ADD COLUMN IF NOT EXISTS require_password boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS join_code text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

CREATE UNIQUE INDEX IF NOT EXISTS quizzes_join_code_unique
  ON public.quizzes(join_code) WHERE join_code IS NOT NULL;

-- 2. Extend quiz_questions
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS negative_marks numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_answer_text text;

-- 3. Extend quiz_attempts
ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS attempt_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS live_session_id uuid,
  ADD COLUMN IF NOT EXISTS rank integer;

-- 4. Helper: 6-char alphanumeric join code (no ambiguous chars)
CREATE OR REPLACE FUNCTION public.generate_quiz_join_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  exists_count int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    SELECT count(*) INTO exists_count FROM public.quizzes WHERE join_code = code;
    IF exists_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$;

-- 5. quiz_live_sessions
CREATE TABLE IF NOT EXISTS public.quiz_live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  host_user_id uuid NOT NULL,
  join_code text NOT NULL,
  password_hash text,
  status text NOT NULL DEFAULT 'waiting',
  current_question_id uuid,
  current_question_started_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_live_sessions_quiz_id_idx ON public.quiz_live_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_live_sessions_status_idx ON public.quiz_live_sessions(status);
CREATE UNIQUE INDEX IF NOT EXISTS quiz_live_sessions_join_code_unique
  ON public.quiz_live_sessions(join_code) WHERE status IN ('waiting','active','paused');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_live_sessions TO authenticated;
GRANT ALL ON public.quiz_live_sessions TO service_role;
ALTER TABLE public.quiz_live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage live sessions"
  ON public.quiz_live_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hosts manage own live sessions"
  ON public.quiz_live_sessions FOR ALL TO authenticated
  USING (host_user_id = auth.uid())
  WITH CHECK (host_user_id = auth.uid());

CREATE POLICY "Anyone authenticated reads active sessions"
  ON public.quiz_live_sessions FOR SELECT TO authenticated
  USING (status IN ('waiting','active','paused'));

-- 6. quiz_live_participants
CREATE TABLE IF NOT EXISTS public.quiz_live_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  UNIQUE (live_session_id, user_id)
);
CREATE INDEX IF NOT EXISTS quiz_live_participants_session_idx ON public.quiz_live_participants(live_session_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_live_participants TO authenticated;
GRANT ALL ON public.quiz_live_participants TO service_role;
ALTER TABLE public.quiz_live_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage live participants"
  ON public.quiz_live_participants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hosts read own session participants"
  ON public.quiz_live_participants FOR SELECT TO authenticated
  USING (live_session_id IN (
    SELECT id FROM public.quiz_live_sessions WHERE host_user_id = auth.uid()
  ));

CREATE POLICY "Users insert own participant row"
  ON public.quiz_live_participants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own participant rows"
  ON public.quiz_live_participants FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own participant rows"
  ON public.quiz_live_participants FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. quiz_imports (traceability for bulk paste / pdf imports)
CREATE TABLE IF NOT EXISTS public.quiz_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'paste',
  raw_text text,
  parsed_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_imports_quiz_idx ON public.quiz_imports(quiz_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_imports TO authenticated;
GRANT ALL ON public.quiz_imports TO service_role;
ALTER TABLE public.quiz_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage imports"
  ON public.quiz_imports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators manage own imports"
  ON public.quiz_imports FOR ALL TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- 8. Realtime publication for live tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_live_participants;
