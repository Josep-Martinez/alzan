-- Add load_type metadata to exercises.
-- Keep it as TEXT for now to support flexible imports (e.g. Numbers/CSV sources)
-- without breaking existing seeds. We can tighten it to enum in a follow-up migration.

ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS load_type TEXT;

COMMENT ON COLUMN public.exercises.load_type IS
  'Load classification for exercise execution/imports (e.g. bodyweight, external_load, assisted, mixed).';
