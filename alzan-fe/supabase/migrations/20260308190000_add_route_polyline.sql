-- Migration: Add route_polyline column to activity_sessions
-- Purpose: Store GPS route as Google-encoded polyline string (same format as Strava)
-- Compact binary-safe text; ~5KB per 1,000 GPS points vs ~50KB raw JSON

ALTER TABLE public.activity_sessions
  ADD COLUMN IF NOT EXISTS route_polyline TEXT;

COMMENT ON COLUMN public.activity_sessions.route_polyline IS
  'Google-encoded polyline string representing the GPS route of the activity. '
  'Uses the standard polyline encoding algorithm (same as Strava, Google Maps). '
  'Decode with any polyline library to get lat/lon coordinate pairs.';
