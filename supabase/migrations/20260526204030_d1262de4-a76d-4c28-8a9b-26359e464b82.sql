
ALTER TABLE public.quizzes
  ADD CONSTRAINT quizzes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL,
  ADD CONSTRAINT quizzes_curriculum_id_fkey FOREIGN KEY (curriculum_id) REFERENCES public.curriculums(id) ON DELETE SET NULL,
  ADD CONSTRAINT quizzes_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON DELETE SET NULL,
  ADD CONSTRAINT quizzes_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL,
  ADD CONSTRAINT quizzes_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL,
  ADD CONSTRAINT quizzes_recording_id_fkey FOREIGN KEY (recording_id) REFERENCES public.recordings(id) ON DELETE SET NULL;
