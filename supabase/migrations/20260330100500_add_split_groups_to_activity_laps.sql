ALTER TABLE public.activity_laps
ADD COLUMN IF NOT EXISTS split_group text NOT NULL DEFAULT 'legacy',
ADD COLUMN IF NOT EXISTS split_distance_m integer,
ADD COLUMN IF NOT EXISTS split_group_order integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'activity_laps_split_group_check'
  ) THEN
    ALTER TABLE public.activity_laps
    ADD CONSTRAINT activity_laps_split_group_check
    CHECK (split_group IN ('legacy', 'custom', 'distance'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'activity_laps_split_distance_m_check'
  ) THEN
    ALTER TABLE public.activity_laps
    ADD CONSTRAINT activity_laps_split_distance_m_check
    CHECK (split_distance_m IS NULL OR split_distance_m > 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_laps_session_split_group_order
  ON public.activity_laps (session_id, split_group_order, lap_index);
