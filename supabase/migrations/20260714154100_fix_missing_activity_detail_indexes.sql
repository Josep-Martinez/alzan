-- =============================================================================
-- Fix: add missing indexes on activity detail tables to prevent sequential scans
-- inside persist_wearable_activity_bundle, which caused statement timeouts
-- cascading into a full database outage (all requests returning HTTP 522).
--
-- Tables affected:
--   activity_streams          – DELETE … WHERE session_id = X AND source = …
--   activity_stream_samples   – DELETE … WHERE session_id = X AND source = …
--   activity_route_points     – DELETE … WHERE session_id = X
-- =============================================================================

-- activity_streams: used by persist_wearable_activity_bundle and absorb_and_delete_session
CREATE INDEX IF NOT EXISTS idx_activity_streams_session_source
ON public.activity_streams (session_id, source);

-- activity_stream_samples: used by persist_wearable_activity_bundle and absorb_and_delete_session
CREATE INDEX IF NOT EXISTS idx_activity_stream_samples_session_source
ON public.activity_stream_samples (session_id, source);

-- activity_route_points: used by persist_wearable_activity_bundle (DELETE … WHERE session_id = X)
-- The existing UNIQUE(session_id, point_index) helps lookups but a plain session_id
-- index is more efficient for bulk DELETE without a point_index filter.
CREATE INDEX IF NOT EXISTS idx_activity_route_points_session
ON public.activity_route_points (session_id);
