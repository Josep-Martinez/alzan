-- Optimise persist_wearable_activity_bundle to accept compact payloads.
--
-- Stream-sample and route-point rows previously carried session_id, user_id,
-- source, source_channel, source_package, source_record_id, and raw_payload_id
-- on EVERY row.  For a 3 000-sample activity that meant ~21 000 redundant JSON
-- fields, inflating the payload to several MB and saturating the Postgres
-- connection pool.
--
-- This version injects those shared columns server-side from the RPC params
-- so the client only sends the per-row unique fields (stream_type, timestamp,
-- offset_s, value, unit for samples; point_index, timestamp, offset_s, lat,
-- lon, altitude_m, distance_m, speed_mps, accuracy fields for route points).
-- The net JSON size drops ~80 %, keeping the full transactional guarantee.

CREATE OR REPLACE FUNCTION public.persist_wearable_activity_bundle(
  p_user_id uuid,
  p_session_id uuid,
  p_session_payload jsonb,
  p_clear_provenance_session_id uuid,
  p_replace_laps boolean,
  p_laps jsonb,
  p_heart_rate_zones jsonb,
  p_streams jsonb,
  p_stream_samples jsonb,
  p_route_points jsonb,
  p_route_polyline text,
  p_provider_fields jsonb,
  p_raw_payload_id uuid,
  p_import_id uuid,
  p_job_id uuid,
  p_canonical_version integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing public.activity_sessions%ROWTYPE;
  v_session public.activity_sessions%ROWTYPE;
  v_provider_fields public.activity_provider_fields%ROWTYPE;
  v_source_channel text;
  v_source_package text;
  v_source_record_id text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':activity:' || p_session_id::text, 0));

  SELECT * INTO v_existing
  FROM public.activity_sessions
  WHERE id = p_session_id AND user_id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'WEARABLE_ACTIVITY_SESSION_NOT_FOUND';
  END IF;

  IF p_import_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.wearable_activity_imports activity_import
    JOIN public.wearable_sync_jobs sync_job ON sync_job.id = activity_import.job_id
    WHERE activity_import.id = p_import_id
      AND activity_import.user_id = p_user_id
      AND activity_import.job_id = p_job_id
      AND activity_import.status = 'processing'
      AND sync_job.user_id = p_user_id
      AND sync_job.status = 'running'
      AND sync_job.lease_expires_at > now()
  ) THEN
    RAISE EXCEPTION 'WEARABLE_ACTIVITY_IMPORT_LEASE_LOST';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      COALESCE(p_laps, '[]'::jsonb) ||
      COALESCE(p_heart_rate_zones, '[]'::jsonb) ||
      COALESCE(p_streams, '[]'::jsonb)
    ) AS item
    WHERE (item->>'session_id')::uuid IS DISTINCT FROM p_session_id
       OR (item ? 'user_id' AND (item->>'user_id')::uuid IS DISTINCT FROM p_user_id)
  ) THEN
    RAISE EXCEPTION 'WEARABLE_ACTIVITY_BUNDLE_OWNERSHIP_MISMATCH';
  END IF;

  IF p_provider_fields IS NULL
    OR (p_provider_fields->>'session_id')::uuid IS DISTINCT FROM p_session_id
    OR (p_provider_fields->>'user_id')::uuid IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'WEARABLE_ACTIVITY_BUNDLE_OWNERSHIP_MISMATCH';
  END IF;

  IF p_clear_provenance_session_id IS NOT NULL AND p_clear_provenance_session_id <> p_session_id THEN
    PERFORM 1
    FROM public.activity_sessions
    WHERE id = p_clear_provenance_session_id AND user_id = p_user_id
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'WEARABLE_ACTIVITY_PROVENANCE_SOURCE_NOT_FOUND'; END IF;

    UPDATE public.activity_sessions
    SET provider_activity_id = NULL, source_record_id = NULL, updated_at = now()
    WHERE id = p_clear_provenance_session_id;
  END IF;

  SELECT * INTO v_session
  FROM jsonb_populate_record(v_existing, p_session_payload);

  -- Read provenance columns from the session payload to inject into child rows.
  v_source_channel  := p_session_payload->>'source_channel';
  v_source_package  := p_session_payload->>'source_package';
  v_source_record_id := p_session_payload->>'source_record_id';

  UPDATE public.activity_sessions SET
    sport_type = v_session.sport_type,
    sport_subtype = v_session.sport_subtype,
    start_time = v_session.start_time,
    end_time = v_session.end_time,
    timezone = v_session.timezone,
    started_at_local = v_session.started_at_local,
    ended_at_local = v_session.ended_at_local,
    duration_s = v_session.duration_s,
    distance_m = v_session.distance_m,
    elev_gain_m = v_session.elev_gain_m,
    elev_loss_m = v_session.elev_loss_m,
    avg_heart_rate = v_session.avg_heart_rate,
    max_heart_rate = v_session.max_heart_rate,
    min_heart_rate = v_session.min_heart_rate,
    avg_speed_m_per_s = v_session.avg_speed_m_per_s,
    calories_kcal = v_session.calories_kcal,
    source = v_session.source,
    provider = v_session.provider,
    provider_activity_id = v_session.provider_activity_id,
    device_id = v_session.device_id,
    avg_cadence = v_session.avg_cadence,
    max_cadence = v_session.max_cadence,
    avg_power_w = v_session.avg_power_w,
    max_power_w = v_session.max_power_w,
    avg_temp_c = v_session.avg_temp_c,
    max_temp_c = v_session.max_temp_c,
    imported_at = v_session.imported_at,
    recovery_time_s = v_session.recovery_time_s,
    total_steps = v_session.total_steps,
    vo2_max = v_session.vo2_max,
    tss_hr = v_session.tss_hr,
    epoc = v_session.epoc,
    pte = v_session.pte,
    source_channel = v_session.source_channel,
    source_package = v_session.source_package,
    source_provider_key = v_session.source_provider_key,
    source_record_id = v_session.source_record_id,
    source_updated_at = v_session.source_updated_at,
    raw_payload_id = v_session.raw_payload_id,
    status = v_session.status,
    duplicate_of_session_id = v_session.duplicate_of_session_id,
    duplicate_score = v_session.duplicate_score,
    duplicate_resolution = v_session.duplicate_resolution,
    needs_strength_review = v_session.needs_strength_review,
    pending_watch_metrics = v_session.pending_watch_metrics,
    route_polyline = p_route_polyline,
    updated_at = now()
  WHERE id = p_session_id;

  IF p_replace_laps THEN
    DELETE FROM public.activity_laps WHERE session_id = p_session_id;
    INSERT INTO public.activity_laps (
      session_id, user_id, lap_index, lap_type, split_group, split_group_order,
      split_distance_m, distance_m, duration_s, avg_heart_rate, max_heart_rate,
      avg_pace_s_per_km, start_offset_s, end_offset_s
    )
    SELECT
      session_id, user_id, lap_index, lap_type, split_group, split_group_order,
      split_distance_m, distance_m, duration_s, avg_heart_rate, max_heart_rate,
      avg_pace_s_per_km, start_offset_s, end_offset_s
    FROM jsonb_populate_recordset(NULL::public.activity_laps, COALESCE(p_laps, '[]'::jsonb));
  END IF;

  DELETE FROM public.activity_heart_rate_zones WHERE session_id = p_session_id;
  INSERT INTO public.activity_heart_rate_zones (session_id, zone, duration_s, percentage)
  SELECT session_id, zone, duration_s, percentage
  FROM jsonb_populate_recordset(NULL::public.activity_heart_rate_zones, COALESCE(p_heart_rate_zones, '[]'::jsonb));

  DELETE FROM public.activity_streams WHERE session_id = p_session_id AND source = 'wearable_import';
  INSERT INTO public.activity_streams (
    session_id, user_id, stream_type, unit, sample_hz, source, source_channel,
    source_package, source_record_id, raw_payload_id, data
  )
  SELECT
    session_id, user_id, stream_type, unit, sample_hz, source, source_channel,
    source_package, source_record_id, raw_payload_id, data
  FROM jsonb_populate_recordset(NULL::public.activity_streams, COALESCE(p_streams, '[]'::jsonb));

  -- Stream samples: client sends compact rows (stream_type, timestamp, offset_s,
  -- value, unit); we inject the shared columns server-side.
  DELETE FROM public.activity_stream_samples WHERE session_id = p_session_id AND source = 'wearable_import';
  INSERT INTO public.activity_stream_samples (
    session_id, user_id, stream_type, timestamp, offset_s, value, unit, source,
    source_channel, source_package, source_record_id, raw_payload_id, raw_payload
  )
  SELECT
    p_session_id,
    p_user_id,
    (item->>'stream_type')::stream_type_enum,
    (item->>'timestamp')::timestamptz,
    (item->>'offset_s')::integer,
    (item->>'value')::numeric,
    item->>'unit',
    'wearable_import',
    v_source_channel,
    v_source_package,
    v_source_record_id,
    p_raw_payload_id,
    NULL
  FROM jsonb_array_elements(COALESCE(p_stream_samples, '[]'::jsonb)) AS item;

  -- Route points: client sends compact rows (point_index, timestamp, offset_s,
  -- lat, lon, altitude_m, distance_m, speed_mps, accuracy); we inject shared columns.
  DELETE FROM public.activity_route_points WHERE session_id = p_session_id;
  INSERT INTO public.activity_route_points (
    session_id, user_id, point_index, timestamp, offset_s, lat, lon, altitude_m,
    distance_m, speed_mps, horizontal_accuracy_m, vertical_accuracy_m, source,
    source_channel, source_package, source_record_id, raw_payload_id, raw_payload
  )
  SELECT
    p_session_id,
    p_user_id,
    (item->>'point_index')::integer,
    (item->>'timestamp')::timestamptz,
    (item->>'offset_s')::integer,
    (item->>'lat')::double precision,
    (item->>'lon')::double precision,
    (item->>'altitude_m')::numeric,
    (item->>'distance_m')::numeric,
    (item->>'speed_mps')::numeric,
    (item->>'horizontal_accuracy_m')::numeric,
    (item->>'vertical_accuracy_m')::numeric,
    'wearable_import',
    v_source_channel,
    v_source_package,
    v_source_record_id,
    p_raw_payload_id,
    NULL
  FROM jsonb_array_elements(COALESCE(p_route_points, '[]'::jsonb)) AS item;

  SELECT * INTO v_provider_fields
  FROM jsonb_populate_record(NULL::public.activity_provider_fields, p_provider_fields);
  INSERT INTO public.activity_provider_fields (
    session_id, user_id, provider, source_channel, source_package, fields, raw_metadata, updated_at
  ) VALUES (
    v_provider_fields.session_id, v_provider_fields.user_id, v_provider_fields.provider,
    v_provider_fields.source_channel, v_provider_fields.source_package, v_provider_fields.fields,
    v_provider_fields.raw_metadata, now()
  )
  ON CONFLICT (session_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    provider = EXCLUDED.provider,
    source_channel = EXCLUDED.source_channel,
    source_package = EXCLUDED.source_package,
    fields = EXCLUDED.fields,
    raw_metadata = EXCLUDED.raw_metadata,
    updated_at = now();

  IF p_raw_payload_id IS NOT NULL THEN
    UPDATE public.external_raw_payloads_v2
    SET related_table = 'activity_sessions', related_id = p_session_id, processed_at = now()
    WHERE id = p_raw_payload_id AND user_id = p_user_id;
  END IF;

  IF p_import_id IS NOT NULL THEN
    UPDATE public.wearable_activity_imports
    SET status = 'complete', session_id = p_session_id,
        canonical_version = p_canonical_version, last_error_code = NULL,
        reconciliation_status = 'pending', last_reconciliation_error = NULL,
        completed_at = now(), updated_at = now()
    WHERE id = p_import_id
      AND user_id = p_user_id
      AND job_id = p_job_id
      AND status = 'processing';
    IF NOT FOUND THEN RAISE EXCEPTION 'WEARABLE_ACTIVITY_IMPORT_NOT_FOUND'; END IF;
  END IF;

  RETURN p_session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.persist_wearable_activity_bundle(uuid, uuid, jsonb, uuid, boolean, jsonb, jsonb, jsonb, jsonb, jsonb, text, jsonb, uuid, uuid, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.persist_wearable_activity_bundle(uuid, uuid, jsonb, uuid, boolean, jsonb, jsonb, jsonb, jsonb, jsonb, text, jsonb, uuid, uuid, uuid, integer) TO service_role;
