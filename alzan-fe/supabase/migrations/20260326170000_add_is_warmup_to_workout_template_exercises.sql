ALTER TABLE public.workout_template_exercises
ADD COLUMN IF NOT EXISTS is_warmup boolean NOT NULL DEFAULT false;
