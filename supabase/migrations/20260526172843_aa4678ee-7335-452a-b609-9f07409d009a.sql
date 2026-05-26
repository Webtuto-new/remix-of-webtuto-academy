
-- ============ QUIZZES ============
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID,
  recording_id UUID,
  curriculum_id UUID,
  grade_id UUID,
  subject_id UUID,
  teacher_id UUID,
  time_limit_seconds INTEGER,
  passing_score INTEGER DEFAULT 60,
  max_attempts INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_live BOOLEAN NOT NULL DEFAULT false,
  shuffle_questions BOOLEAN NOT NULL DEFAULT true,
  show_correct_answers BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quizzes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published quizzes" ON public.quizzes
  FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage quizzes" ON public.quizzes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Tutors manage own quizzes" ON public.quizzes
  FOR ALL TO authenticated
  USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()))
  WITH CHECK (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));

CREATE TRIGGER quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ QUESTIONS ============
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq', -- mcq | true_false | short_answer
  points INTEGER NOT NULL DEFAULT 1,
  time_limit_seconds INTEGER DEFAULT 30,
  image_url TEXT,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read questions of published quizzes" ON public.quiz_questions
  FOR SELECT USING (quiz_id IN (SELECT id FROM quizzes WHERE is_published = true));
CREATE POLICY "Admins manage questions" ON public.quiz_questions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Tutors manage own quiz questions" ON public.quiz_questions
  FOR ALL TO authenticated
  USING (quiz_id IN (SELECT q.id FROM quizzes q JOIN teachers t ON q.teacher_id = t.id WHERE t.user_id = auth.uid()))
  WITH CHECK (quiz_id IN (SELECT q.id FROM quizzes q JOIN teachers t ON q.teacher_id = t.id WHERE t.user_id = auth.uid()));

-- ============ ANSWER OPTIONS ============
CREATE TABLE public.quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quiz_options TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_options TO authenticated;
GRANT ALL ON public.quiz_options TO service_role;

ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read options of published quizzes" ON public.quiz_options
  FOR SELECT USING (question_id IN (SELECT id FROM quiz_questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE is_published = true)));
CREATE POLICY "Admins manage options" ON public.quiz_options
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Tutors manage own quiz options" ON public.quiz_options
  FOR ALL TO authenticated
  USING (question_id IN (SELECT qq.id FROM quiz_questions qq JOIN quizzes q ON qq.quiz_id = q.id JOIN teachers t ON q.teacher_id = t.id WHERE t.user_id = auth.uid()))
  WITH CHECK (question_id IN (SELECT qq.id FROM quiz_questions qq JOIN quizzes q ON qq.quiz_id = q.id JOIN teachers t ON q.teacher_id = t.id WHERE t.user_id = auth.uid()));

-- ============ ATTEMPTS ============
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  time_taken_seconds INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own attempts" ON public.quiz_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own attempts" ON public.quiz_attempts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage attempts" ON public.quiz_attempts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Tutors read attempts on own quizzes" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (quiz_id IN (SELECT q.id FROM quizzes q JOIN teachers t ON q.teacher_id = t.id WHERE t.user_id = auth.uid()));
CREATE POLICY "Public read leaderboard attempts" ON public.quiz_attempts
  FOR SELECT TO anon USING (completed_at IS NOT NULL);

GRANT SELECT ON public.quiz_attempts TO anon;

-- ============ ATTEMPT ANSWERS ============
CREATE TABLE public.quiz_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL,
  question_id UUID NOT NULL,
  selected_option_id UUID,
  answer_text TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_earned INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempt_answers TO authenticated;
GRANT ALL ON public.quiz_attempt_answers TO service_role;

ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own attempt answers" ON public.quiz_attempt_answers
  FOR ALL TO authenticated
  USING (attempt_id IN (SELECT id FROM quiz_attempts WHERE user_id = auth.uid()))
  WITH CHECK (attempt_id IN (SELECT id FROM quiz_attempts WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage attempt answers" ON public.quiz_attempt_answers
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Tutors read attempt answers on own quizzes" ON public.quiz_attempt_answers
  FOR SELECT TO authenticated
  USING (attempt_id IN (SELECT a.id FROM quiz_attempts a JOIN quizzes q ON a.quiz_id = q.id JOIN teachers t ON q.teacher_id = t.id WHERE t.user_id = auth.uid()));

-- ============ INDEXES ============
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_options_question_id ON public.quiz_options(question_id);
CREATE INDEX idx_quiz_attempts_quiz_user ON public.quiz_attempts(quiz_id, user_id);
CREATE INDEX idx_quiz_attempt_answers_attempt ON public.quiz_attempt_answers(attempt_id);
CREATE INDEX idx_quizzes_class ON public.quizzes(class_id);
CREATE INDEX idx_quizzes_teacher ON public.quizzes(teacher_id);
