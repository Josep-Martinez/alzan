-- Enforce a closed set of values for exercise load_type.
-- Allowed values come from current catalog/imports:
-- assisted, bodyweight, external, mixed

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'exercise_load_type'
  ) THEN
    CREATE TYPE public.exercise_load_type AS ENUM (
      'assisted',
      'bodyweight',
      'external',
      'mixed'
    );
  END IF;
END
$$;

ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS load_type public.exercise_load_type;

DO $$
BEGIN
  -- If the column exists but is not enum yet (e.g. TEXT from previous migration),
  -- convert safely and normalize values to lowercase.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exercises'
      AND column_name = 'load_type'
      AND udt_name <> 'exercise_load_type'
  ) THEN
    ALTER TABLE public.exercises
    ALTER COLUMN load_type TYPE public.exercise_load_type
    USING (
      CASE
        WHEN lower(trim(load_type::text)) IN ('assisted', 'bodyweight', 'external', 'mixed')
          THEN lower(trim(load_type::text))::public.exercise_load_type
        ELSE NULL
      END
    );
  END IF;
END
$$;

COMMENT ON COLUMN public.exercises.load_type IS
  'Load type for exercise: assisted | bodyweight | external | mixed.';
