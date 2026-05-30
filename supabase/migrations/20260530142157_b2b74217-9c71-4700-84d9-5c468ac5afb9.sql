ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'male';
ALTER TABLE public.teachers ADD CONSTRAINT teachers_gender_check CHECK (gender IN ('male','female'));