


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_username"("username_input" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return not exists (
    select 1
    from public.users
    where lower(username) = lower(username_input)
  );
end;
$$;


ALTER FUNCTION "public"."check_username"("username_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_account"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'No autenticado';
  end if;
  -- 1. Intentar borrar objetos de storage (best effort)
  begin
    delete from storage.objects where owner = current_user_id;
  exception when others then null; end;
  -- 2. Borrar usuario de auth.users
  -- Gracias a ON DELETE CASCADE, esto borrará AUTOMÁTICAMENTE:
  -- - public.users
  -- - Todas las tablas hijas (logs, sesiones, etc.)
  delete from auth.users where id = current_user_id;
end;
$$;


ALTER FUNCTION "public"."delete_user_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.users (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now())
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.users (
    id,
    email,
    display_name,
    avatar_url,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.users.display_name),
        avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
        updated_at = now();

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_ingredients_batch"("payload" "jsonb") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_inserted_count integer := 0;
BEGIN
  WITH inserted AS (
    INSERT INTO public.ingredients (
      id,
      name_es,
      name_en,
      name_norm_es,
      category,
      unit_basis,
      kcal_100,
      protein_g_100,
      carbs_g_100,
      fat_g_100,
      fiber_g_100,
      sugar_g_100,
      sodium_mg_100,
      salt_g_100,
      source_primary,
      source_secondary,
      quality_score,
      notes
    )
    SELECT
      gen_random_uuid(),
      ing->>'name_es',
      ing->>'name_en',
      ing->>'name_norm_es',
      ing->>'category',
      COALESCE(payload->>'unit_basis', 'per_100g'),
      (NULLIF(ing->>'kcal_100g', ''))::numeric,
      (NULLIF(ing->>'protein_g_100g', ''))::numeric,
      (NULLIF(ing->>'carbs_g_100g', ''))::numeric,
      (NULLIF(ing->>'fat_g_100g', ''))::numeric,
      (NULLIF(ing->>'fiber_g_100g', ''))::numeric,
      (NULLIF(ing->>'sugar_g_100g', ''))::numeric,
      (NULLIF(ing->>'sodium_mg_100g', ''))::numeric,
      NULL::numeric,
      ing->'source_primary',
      NULL::jsonb,
      COALESCE((NULLIF(ing->>'quality_score',''))::numeric, 0.7),
      ing->>'notes'
    FROM jsonb_array_elements(payload->'ingredients') AS ing
    -- si ya existe name_norm_es → no lo inserta
    ON CONFLICT (name_norm_es) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted_count FROM inserted;

  RETURN v_inserted_count;
END;
$$;


ALTER FUNCTION "public"."import_ingredients_batch"("payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_recipes_batch"("payload" "jsonb") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_recipe      jsonb;
  v_recipe_id   uuid;
  v_name_es     text;
  v_name_en     text;
  v_desc        text;
  v_quality     numeric;
  v_name_norm   text;
  v_existing_id uuid;
  v_has_missing_ingredient boolean;
  v_inserted_count integer := 0;
BEGIN
  -- Recorremos todas las recetas del JSON
  FOR v_recipe IN
    SELECT jsonb_array_elements(payload->'recipes')
  LOOP
    v_name_es   := v_recipe->>'name_es';
    v_name_en   := v_recipe->>'name_en';
    v_desc      := v_recipe->>'description';
    v_quality   := COALESCE((v_recipe->>'quality_score')::numeric, 0.7);

    -- normalización básica del nombre de la receta
    v_name_norm := lower(trim(regexp_replace(v_name_es, '\s+', ' ', 'g')));

    ----------------------------------------------------------------
    -- 1) Comprobar si la receta ya existe por name_norm_es
    ----------------------------------------------------------------
    SELECT r.id
    INTO v_existing_id
    FROM public.recipes r
    WHERE r.name_norm_es = v_name_norm;

    IF FOUND THEN
      -- ya existe -> no insertamos nada de esta receta
      CONTINUE;
    END IF;

    ----------------------------------------------------------------
    -- 2) Comprobar que TODOS los ingredientes existen
    --    Usamos name_norm_es OR name_es OR name_en (case-insensitive)
    ----------------------------------------------------------------
    v_has_missing_ingredient := FALSE;

    IF v_recipe ? 'items' THEN
      SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(v_recipe->'items') AS item
        LEFT JOIN public.ingredients i
          ON  lower(i.name_norm_es) = lower(item->>'ingredient_norm_es')
          OR lower(i.name_es)      = lower(item->>'ingredient_norm_es')
          OR lower(i.name_en)      = lower(item->>'ingredient_norm_es')
        WHERE
          -- si no se encontró ningún ingrediente para ese texto,
          -- i.id será NULL -> ese ingrediente "falta"
          i.id IS NULL
      )
      INTO v_has_missing_ingredient;

      IF v_has_missing_ingredient THEN
        -- opcional: log
        RAISE NOTICE 'Saltando receta % porque falta algún ingrediente', v_name_es;
        CONTINUE;
      END IF;
    END IF;

    ----------------------------------------------------------------
    -- 3) Insertar la receta (ya sabemos que no existe y que todos
    --    los ingredientes del JSON tienen match en ingredients)
    ----------------------------------------------------------------
    INSERT INTO public.recipes (
      id,
      name_es,
      name_en,
      name_norm_es,
      description,
      quality_score
    )
    VALUES (
      gen_random_uuid(),
      v_name_es,
      v_name_en,
      v_name_norm,
      v_desc,
      v_quality
    )
    RETURNING id INTO v_recipe_id;

    -- contamos una receta insertada
    v_inserted_count := v_inserted_count + 1;

    ----------------------------------------------------------------
    -- 4) Aliases en español (evitando duplicados por alias_norm_es)
    ----------------------------------------------------------------
    IF v_recipe ? 'aliases_es' THEN
      DECLARE
        v_alias text;
        v_alias_norm text;
      BEGIN
        FOR v_alias IN
          SELECT jsonb_array_elements_text(v_recipe->'aliases_es')
        LOOP
          v_alias_norm := lower(trim(regexp_replace(v_alias, '\s+', ' ', 'g')));

          INSERT INTO public.recipe_aliases (
            id,
            recipe_id,
            alias_es,
            alias_norm_es,
            created_at
          )
          VALUES (
            gen_random_uuid(),
            v_recipe_id,
            v_alias,
            v_alias_norm,
            now()
          )
          ON CONFLICT (alias_norm_es) DO NOTHING;
        END LOOP;
      END;
    END IF;

    ----------------------------------------------------------------
    -- 5) Items de la receta: resolvemos cada ingrediente
    --    por name_norm_es OR name_es OR name_en
    --    y usamos un JOIN LATERAL con LIMIT 1 para evitar duplicados
    ----------------------------------------------------------------
    IF v_recipe ? 'items' THEN
      INSERT INTO public.recipe_items (
        id,
        recipe_id,
        ingredient_id,
        order_index,
        quantity,
        unit,
        notes,
        created_at
      )
      SELECT
        gen_random_uuid(),
        v_recipe_id,
        i.id,
        COALESCE((item->>'order_index')::int, 0),
        (item->>'quantity')::numeric,
        item->>'unit',
        NULL::text,
        now()
      FROM jsonb_array_elements(v_recipe->'items') AS item
      JOIN LATERAL (
        SELECT ing.id
        FROM public.ingredients ing
        WHERE
          lower(ing.name_norm_es) = lower(item->>'ingredient_norm_es')
          OR lower(ing.name_es)   = lower(item->>'ingredient_norm_es')
          OR lower(ing.name_en)   = lower(item->>'ingredient_norm_es')
        ORDER BY ing.id
        LIMIT 1
      ) AS i ON TRUE;
    END IF;
  END LOOP;

  RETURN v_inserted_count;
END;
$$;


ALTER FUNCTION "public"."import_recipes_batch"("payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_user_data"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  current_user_id uuid;
  latest_weight_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'No autenticado';
  end if;
  -- 1. Identificar el último registro de peso para salvarlo
  select id into latest_weight_id 
  from public.weight_logs 
  where user_id = current_user_id 
  order by measured_at desc limit 1;
  -- 2. Borrar logs de peso (EXCEPTO el último)
  if latest_weight_id is not null then
    delete from public.weight_logs where user_id = current_user_id and id != latest_weight_id;
  else
    delete from public.weight_logs where user_id = current_user_id;
  end if;
  -- 3. Borrar historial y datos (Las tablas hijas se borran por CASCADE)
  -- Data de deporte
  delete from public.activity_sessions where user_id = current_user_id;
  delete from public.workout_plans where user_id = current_user_id;
  delete from public.workout_templates where user_id = current_user_id;
  delete from public.endurance_workout_templates where user_id = current_user_id;
  
  -- Data de nutrición
  delete from public.meal_logs where user_id = current_user_id;
  delete from public.diet_templates where user_id = current_user_id;
  
  -- Data de salud / métricas
  delete from public.body_measurements where user_id = current_user_id;
  delete from public.sleep_logs where user_id = current_user_id;
  delete from public.daily_hydration where user_id = current_user_id;
  delete from public.resting_hr_logs where user_id = current_user_id;
  
  -- Config / Metas
  delete from public.user_goals where user_id = current_user_id;
  delete from public.devices where user_id = current_user_id;
  delete from public.tags where user_id = current_user_id;
  
  -- Ejercicios personalizados
  delete from public.exercises where owner_user_id = current_user_id;
  
  -- 4. NO TOCAMOS:
  -- public.users (Perfil, fecha nacimiento, avatar) -> SE CONSERVA
  -- user_preferences -> SE CONSERVA (según petición de datos 'necesarios')
  -- auth.users -> SE CONSERVA
end;
$$;


ALTER FUNCTION "public"."reset_user_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tf_set_user_id_from_parent"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  parent_table text;
  fk_column text;
  parent_user_id uuid;
BEGIN
  -- Detectar configuración según la tabla que dispara
  IF TG_TABLE_NAME = 'diet_template_meals' THEN
    parent_table := 'diet_templates';
    fk_column := 'diet_template_id';
    SELECT user_id INTO parent_user_id FROM public.diet_templates WHERE id = (NEW.diet_template_id);
    
  ELSIF TG_TABLE_NAME = 'workout_template_exercises' THEN
    parent_table := 'workout_templates';
    fk_column := 'workout_template_id';
    SELECT user_id INTO parent_user_id FROM public.workout_templates WHERE id = (NEW.workout_template_id);
    
  ELSIF TG_TABLE_NAME = 'endurance_workout_steps' THEN
    parent_table := 'endurance_workout_templates';
    fk_column := 'template_id';
    SELECT user_id INTO parent_user_id FROM public.endurance_workout_templates WHERE id = (NEW.template_id);
    
  ELSIF TG_TABLE_NAME = 'activity_laps' OR TG_TABLE_NAME = 'activity_streams' OR TG_TABLE_NAME = 'activity_session_tags' THEN
    parent_table := 'activity_sessions';
    fk_column := 'session_id';
    SELECT user_id INTO parent_user_id FROM public.activity_sessions WHERE id = (NEW.session_id);

  END IF;

  -- Asignar
  IF parent_user_id IS NOT NULL THEN
    NEW.user_id := parent_user_id;
  ELSE
    -- Fallback de seguridad: si no se encuentra padre (raro), intentar usar auth.uid()
    -- o dejar que falle el NOT NULL si es crítico.
    NEW.user_id := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."tf_set_user_id_from_parent"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_laps" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "lap_index" integer NOT NULL,
    "distance_m" numeric,
    "duration_s" integer,
    "avg_heart_rate" integer,
    "max_heart_rate" integer,
    "avg_pace_s_per_km" integer,
    "lap_type" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "start_offset_s" integer,
    "end_offset_s" integer,
    "user_id" "uuid"
);


ALTER TABLE "public"."activity_laps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_session_tags" (
    "session_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_session_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sport_type" "text" NOT NULL,
    "start_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_time" timestamp with time zone,
    "duration_s" integer,
    "workout_template_id" "uuid",
    "name" "text",
    "description" "text",
    "distance_m" numeric,
    "elev_gain_m" numeric,
    "avg_heart_rate" integer,
    "max_heart_rate" integer,
    "avg_speed_m_per_s" numeric,
    "calories_kcal" numeric,
    "rpe" numeric,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "timezone" "text",
    "started_at_local" timestamp without time zone,
    "ended_at_local" timestamp without time zone,
    "provider" "text" DEFAULT 'manual'::"text" NOT NULL,
    "provider_activity_id" "text",
    "device_id" "uuid",
    "sport_subtype" "text",
    "visibility" "text" DEFAULT 'private'::"text",
    "total_sets" integer,
    "total_reps" integer,
    "total_volume_kg" numeric,
    "avg_cadence" integer,
    "max_cadence" integer,
    "avg_power_w" integer,
    "max_power_w" integer,
    "avg_temp_c" numeric,
    "max_temp_c" numeric,
    "imported_at" timestamp with time zone,
    "endurance_template_id" "uuid"
);


ALTER TABLE "public"."activity_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_streams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "stream_type" "text" NOT NULL,
    "unit" "text",
    "data" "jsonb" NOT NULL,
    "sample_hz" numeric,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    CONSTRAINT "activity_streams_data_check" CHECK (("jsonb_typeof"("data") = 'object'::"text"))
);


ALTER TABLE "public"."activity_streams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."body_measurements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "measured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "measurement_type" "text" NOT NULL,
    "value_cm" numeric NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."body_measurements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_hydration" (
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "total_ml" integer DEFAULT 0 NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "daily_hydration_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'imported'::"text", 'ai'::"text"]))),
    CONSTRAINT "daily_hydration_total_ml_check" CHECK (("total_ml" >= 0))
);


ALTER TABLE "public"."daily_hydration" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" DEFAULT 'other'::"text" NOT NULL,
    "device_name" "text",
    "device_model" "text",
    "device_serial" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diet_template_meal_translations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "diet_template_meal_id" "uuid",
    "language_code" "text",
    "name" "text" NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."diet_template_meal_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diet_template_meals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "diet_template_id" "uuid" NOT NULL,
    "day_of_week" smallint NOT NULL,
    "meal_type" "text" NOT NULL,
    "base_name" "text" NOT NULL,
    "notes" "text",
    "target_kcal" numeric,
    "target_protein_g" numeric,
    "target_carbs_g" numeric,
    "target_fats_g" numeric,
    "order_index" integer DEFAULT 0 NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."diet_template_meals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diet_template_translations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "diet_template_id" "uuid",
    "language_code" "text",
    "name" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."diet_template_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diet_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "base_name" "text" NOT NULL,
    "description" "text",
    "daily_calorie_target_kcal" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'user'::"text" NOT NULL
);


ALTER TABLE "public"."diet_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."endurance_workout_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "phase_type" "text" NOT NULL,
    "duration_type" "text" NOT NULL,
    "duration_s" integer,
    "distance_m" integer,
    "target_type" "text" DEFAULT 'none'::"text" NOT NULL,
    "target_min" numeric,
    "target_max" numeric,
    "repetitions" integer DEFAULT 1,
    "parent_step_id" "uuid",
    "is_group" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."endurance_workout_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."endurance_workout_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sport_type" "text" NOT NULL,
    "base_name" "text" NOT NULL,
    "description" "text",
    "total_distance_m" integer,
    "total_duration_s" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "workout_goal" "text",
    "scheduled_day" integer
);


ALTER TABLE "public"."endurance_workout_templates" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."equipment_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."equipment_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equipment" (
    "id" smallint DEFAULT "nextval"('"public"."equipment_id_seq"'::"regclass") NOT NULL,
    "code" "text" NOT NULL
);


ALTER TABLE "public"."equipment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equipment_translations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "equipment_id" smallint,
    "language_code" "text",
    "name" "text" NOT NULL
);


ALTER TABLE "public"."equipment_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_media" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "media_type" "text" NOT NULL,
    "url" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."exercise_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_translations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "language_code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."exercise_translations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."exercise_types_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."exercise_types_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_types" (
    "id" smallint DEFAULT "nextval"('"public"."exercise_types_id_seq"'::"regclass") NOT NULL,
    "code" "text" NOT NULL
);


ALTER TABLE "public"."exercise_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercises" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "base_name" "text" NOT NULL,
    "primary_muscle_id" smallint,
    "secondary_muscle_id" smallint,
    "equipment_id" smallint,
    "exercise_type_id" smallint,
    "difficulty" "text",
    "description" "text",
    "is_custom" boolean DEFAULT false NOT NULL,
    "owner_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_accounts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "external_user_id" "text" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "token_expires_at" timestamp with time zone,
    "scopes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."external_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_activity_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "external_account_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "external_activity_id" "text" NOT NULL,
    "activity_session_id" "uuid" NOT NULL,
    "imported_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."external_activity_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_raw_payloads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "external_activity_mapping_id" "uuid" NOT NULL,
    "received_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payload" "jsonb" NOT NULL
);


ALTER TABLE "public"."external_raw_payloads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ingredient_import_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "batch_number" integer,
    "payload" "jsonb" NOT NULL,
    "inserted_count" integer DEFAULT 0 NOT NULL,
    "updated_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ingredient_import_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ingredient_usda_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "spanish_input_raw" "text" NOT NULL,
    "spanish_input_norm" "text" NOT NULL,
    "resolved_en_query" "text" NOT NULL,
    "chosen_fdc_id" bigint NOT NULL,
    "chosen_description" "text" NOT NULL,
    "chosen_data_type" "text" NOT NULL,
    "confidence_score" double precision NOT NULL,
    "resolver_version" "text" DEFAULT 'v1'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ingredient_usda_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_es" "text" NOT NULL,
    "name_en" "text" NOT NULL,
    "name_norm_es" "text" NOT NULL,
    "category" "text" NOT NULL,
    "unit_basis" "text" DEFAULT 'per_100g'::"text" NOT NULL,
    "kcal_100" numeric,
    "protein_g_100" numeric,
    "carbs_g_100" numeric,
    "fat_g_100" numeric,
    "fiber_g_100" numeric,
    "sugar_g_100" numeric,
    "sodium_mg_100" numeric,
    "salt_g_100" numeric,
    "source_primary" "jsonb",
    "source_secondary" "jsonb",
    "quality_score" numeric NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ingredients_category_check" CHECK (("category" = ANY (ARRAY['proteina_animal'::"text", 'proteina_vegetal'::"text", 'cereal'::"text", 'tuberculo'::"text", 'legumbre'::"text", 'verdura'::"text", 'fruta'::"text", 'lacteo'::"text", 'grasa'::"text", 'fruto_seco'::"text", 'semilla'::"text", 'bebida'::"text", 'condimento'::"text", 'otro'::"text", 'dulce'::"text", 'precocinado'::"text", 'snack'::"text"]))),
    CONSTRAINT "ingredients_quality_score_check" CHECK ((("quality_score" >= (0)::numeric) AND ("quality_score" <= (1)::numeric))),
    CONSTRAINT "ingredients_unit_basis_check" CHECK (("unit_basis" = ANY (ARRAY['per_100g'::"text", 'per_100ml'::"text"])))
);


ALTER TABLE "public"."ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "meal_log_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "source_ref" "text",
    "quantity_g" numeric NOT NULL,
    "per_100g_kcal" numeric,
    "per_100g_protein_g" numeric,
    "per_100g_carbs_g" numeric,
    "per_100g_fats_g" numeric,
    "kcal" numeric,
    "protein_g" numeric,
    "carbs_g" numeric,
    "fats_g" numeric,
    "data_quality" "text" DEFAULT 'manual'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "origin" "text" DEFAULT 'user'::"text" NOT NULL,
    "confidence" numeric,
    CONSTRAINT "meal_items_data_quality_check" CHECK (("data_quality" = ANY (ARRAY['manual'::"text", 'automatic'::"text"]))),
    CONSTRAINT "meal_items_origin_check" CHECK (("origin" = ANY (ARRAY['user'::"text", 'ai_name'::"text", 'ai_photo'::"text", 'imported'::"text"]))),
    CONSTRAINT "meal_items_quantity_g_check" CHECK (("quantity_g" > (0)::numeric)),
    CONSTRAINT "meal_items_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'database'::"text", 'openfoodfacts'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."meal_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "logged_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "date" "date" NOT NULL,
    "meal_type" "text" NOT NULL,
    "name" "text",
    "notes" "text",
    "kcal" numeric,
    "protein_g" numeric,
    "carbs_g" numeric,
    "fats_g" numeric,
    "diet_template_meal_id" "uuid",
    "adherence_status" "text",
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "data_quality" "text" DEFAULT 'manual'::"text" NOT NULL,
    "calc_version" "text" DEFAULT 'nutrition_v1'::"text" NOT NULL,
    "origin" "text" DEFAULT 'user'::"text" NOT NULL,
    "origin_confidence" numeric,
    CONSTRAINT "meal_logs_data_quality_check" CHECK (("data_quality" = ANY (ARRAY['manual'::"text", 'computed'::"text"]))),
    CONSTRAINT "meal_logs_origin_check" CHECK (("origin" = ANY (ARRAY['user'::"text", 'ai_name'::"text", 'ai_photo'::"text", 'imported'::"text"])))
);


ALTER TABLE "public"."meal_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."muscle_group_translations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "muscle_group_id" smallint,
    "language_code" "text",
    "name" "text" NOT NULL
);


ALTER TABLE "public"."muscle_group_translations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."muscle_groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."muscle_groups_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."muscle_groups" (
    "id" smallint DEFAULT "nextval"('"public"."muscle_groups_id_seq"'::"regclass") NOT NULL,
    "code" "text" NOT NULL
);


ALTER TABLE "public"."muscle_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe_aliases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "alias_es" "text" NOT NULL,
    "alias_norm_es" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."recipe_aliases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "ingredient_id" "uuid" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "quantity" numeric NOT NULL,
    "unit" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "recipe_items_quantity_check" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "recipe_items_unit_check" CHECK (("unit" = ANY (ARRAY['g'::"text", 'ml'::"text"])))
);


ALTER TABLE "public"."recipe_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_es" "text" NOT NULL,
    "name_en" "text",
    "name_norm_es" "text" NOT NULL,
    "description" "text",
    "quality_score" numeric DEFAULT 0.7 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "recipes_quality_score_check" CHECK ((("quality_score" >= (0)::numeric) AND ("quality_score" <= (1)::numeric)))
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resting_hr_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "measured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resting_hr_bpm" integer NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL
);


ALTER TABLE "public"."resting_hr_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rpe" numeric,
    "mood" smallint,
    "stress" smallint,
    "soreness" smallint,
    "sleep_quality" smallint,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "session_feedback_mood_check" CHECK ((("mood" IS NULL) OR (("mood" >= 1) AND ("mood" <= 5)))),
    CONSTRAINT "session_feedback_sleep_quality_check" CHECK ((("sleep_quality" IS NULL) OR (("sleep_quality" >= 1) AND ("sleep_quality" <= 5)))),
    CONSTRAINT "session_feedback_soreness_check" CHECK ((("soreness" IS NULL) OR (("soreness" >= 1) AND ("soreness" <= 5)))),
    CONSTRAINT "session_feedback_stress_check" CHECK ((("stress" IS NULL) OR (("stress" >= 1) AND ("stress" <= 5))))
);


ALTER TABLE "public"."session_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sleep_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sleep_start" timestamp with time zone,
    "sleep_end" timestamp with time zone,
    "duration_min" integer,
    "date" "date" NOT NULL,
    "quality_score" integer,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL
);


ALTER TABLE "public"."sleep_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "name_norm" "text" NOT NULL,
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_goals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "goal_type" "text" NOT NULL,
    "description" "text",
    "target_weight_kg" numeric,
    "target_bodyfat_percent" numeric,
    "target_distance_m" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "valid_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valid_to" "date",
    "target_time_s" integer,
    "target_power_w" integer,
    "target_calories_kcal" integer,
    "target_protein_g" integer,
    "target_carbs_g" integer,
    "target_fats_g" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "sport_type" "text"
);


ALTER TABLE "public"."user_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_nutrition_settings" (
    "user_id" "uuid" NOT NULL,
    "primary_goal" "text" NOT NULL,
    "goal_mode" "text" NOT NULL,
    "adjustment_type" "text" DEFAULT 'percent'::"text" NOT NULL,
    "adjustment_value" numeric DEFAULT 0 NOT NULL,
    "activity_level" "text" DEFAULT 'moderate'::"text" NOT NULL,
    "protein_g_per_kg" numeric,
    "fat_g_per_kg" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_nutrition_settings_activity_level_check" CHECK (("activity_level" = ANY (ARRAY['sedentary'::"text", 'light'::"text", 'moderate'::"text", 'high'::"text", 'very_high'::"text"]))),
    CONSTRAINT "user_nutrition_settings_adjustment_type_check" CHECK (("adjustment_type" = ANY (ARRAY['percent'::"text", 'kcal'::"text"]))),
    CONSTRAINT "user_nutrition_settings_check" CHECK (((("adjustment_type" = 'percent'::"text") AND ("adjustment_value" >= (0)::numeric) AND ("adjustment_value" <= 0.35)) OR (("adjustment_type" = 'kcal'::"text") AND ("adjustment_value" >= (0)::numeric) AND ("adjustment_value" <= (1000)::numeric)))),
    CONSTRAINT "user_nutrition_settings_goal_mode_check" CHECK (("goal_mode" = ANY (ARRAY['lose'::"text", 'maintain'::"text", 'gain'::"text", 'recomp'::"text"]))),
    CONSTRAINT "user_nutrition_settings_primary_goal_check" CHECK (("primary_goal" = ANY (ARRAY['gain_strength'::"text", 'gain_muscle'::"text", 'recomp'::"text", 'lose_weight'::"text", 'maintain'::"text"])))
);


ALTER TABLE "public"."user_nutrition_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "weight_unit" "text" DEFAULT 'kg'::"text" NOT NULL,
    "distance_unit" "text" DEFAULT 'km'::"text" NOT NULL,
    "energy_unit" "text" DEFAULT 'kcal'::"text" NOT NULL,
    "language_code" "text" DEFAULT 'en'::"text" NOT NULL,
    "timezone" "text",
    "health_data_consent" boolean DEFAULT false NOT NULL,
    "import_health_metrics" boolean DEFAULT false NOT NULL,
    "nutrition_prefs" "jsonb" DEFAULT '{"meal_types": [{"id": "breakfast", "label": "Desayuno", "order": 0, "enabled": true}, {"id": "morning_snack", "label": "Almuerzo", "order": 1, "enabled": true}, {"id": "lunch", "label": "Comida", "order": 2, "enabled": true}, {"id": "afternoon_snack", "label": "Merienda", "order": 3, "enabled": true}, {"id": "dinner", "label": "Cena", "order": 4, "enabled": true}, {"id": "snack", "label": "Snack", "order": 5, "enabled": true}], "snack_behavior": {"treat_as_meal": false, "show_only_if_content": false}}'::"jsonb",
    "pace_unit" "text" DEFAULT 'min_km'::"text" NOT NULL,
    "temperature_unit" "text" DEFAULT 'celsius'::"text" NOT NULL,
    "notification_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "appearance_settings" "jsonb" DEFAULT '{"theme": "system"}'::"jsonb",
    "privacy_settings" "jsonb" DEFAULT '{"profile_public": false, "default_workout_visibility": "private"}'::"jsonb"
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "date_of_birth" "date",
    "sex" "text",
    "height_cm" numeric,
    "display_name" "text",
    "avatar_url" "text",
    "username" "text",
    "onboarding_step" integer DEFAULT 0,
    CONSTRAINT "users_sex_check" CHECK (("sex" = ANY (ARRAY['male'::"text", 'female'::"text", 'other'::"text", 'prefer_not_to_say'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weight_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "measured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "weight_kg" numeric NOT NULL,
    "bodyfat_percent" numeric,
    "muscle_mass_kg" numeric,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL
);


ALTER TABLE "public"."weight_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "planned_date" "date" NOT NULL,
    "gym_template_id" "uuid",
    "endurance_template_id" "uuid",
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "activity_session_id" "uuid",
    "completed_at" timestamp with time zone,
    CONSTRAINT "workout_plans_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'completed'::"text", 'skipped'::"text", 'rescheduled'::"text"])))
);


ALTER TABLE "public"."workout_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_sets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "set_number" integer NOT NULL,
    "weight_kg" numeric DEFAULT 0 NOT NULL,
    "reps" integer NOT NULL,
    "duration_s" integer,
    "rest_s" integer,
    "rpe" numeric,
    "is_warmup" boolean DEFAULT false NOT NULL,
    "is_pr" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "set_type" "text" DEFAULT 'normal'::"text" NOT NULL,
    "notes" "text",
    "tempo" "text",
    "pause_s" integer,
    "distance_m" integer,
    "calories_kcal" numeric,
    "avg_hr_bpm" integer,
    "max_hr_bpm" integer
);


ALTER TABLE "public"."workout_sets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_template_exercises" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workout_template_id" "uuid" NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "target_sets" integer,
    "target_reps_min" integer,
    "target_reps_max" integer,
    "target_weight_kg" numeric,
    "target_rpe" numeric,
    "notes" "text",
    "rest_seconds" integer,
    "user_id" "uuid"
);


ALTER TABLE "public"."workout_template_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_template_translations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workout_template_id" "uuid",
    "language_code" "text",
    "name" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."workout_template_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "base_name" "text" NOT NULL,
    "description" "text",
    "workout_goal" "text",
    "suggested_day_of_week" smallint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'user'::"text" NOT NULL
);


ALTER TABLE "public"."workout_templates" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_laps"
    ADD CONSTRAINT "activity_laps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_session_tags"
    ADD CONSTRAINT "activity_session_tags_pkey" PRIMARY KEY ("session_id", "tag_id");



ALTER TABLE ONLY "public"."activity_sessions"
    ADD CONSTRAINT "activity_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_streams"
    ADD CONSTRAINT "activity_streams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."body_measurements"
    ADD CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_hydration"
    ADD CONSTRAINT "daily_hydration_pkey" PRIMARY KEY ("user_id", "date");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diet_template_meal_translations"
    ADD CONSTRAINT "diet_template_meal_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diet_template_meals"
    ADD CONSTRAINT "diet_template_meals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diet_template_translations"
    ADD CONSTRAINT "diet_template_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diet_templates"
    ADD CONSTRAINT "diet_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."endurance_workout_steps"
    ADD CONSTRAINT "endurance_workout_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."endurance_workout_templates"
    ADD CONSTRAINT "endurance_workout_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment_translations"
    ADD CONSTRAINT "equipment_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_media"
    ADD CONSTRAINT "exercise_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_translations"
    ADD CONSTRAINT "exercise_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_types"
    ADD CONSTRAINT "exercise_types_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."exercise_types"
    ADD CONSTRAINT "exercise_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_accounts"
    ADD CONSTRAINT "external_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_activity_mappings"
    ADD CONSTRAINT "external_activity_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_raw_payloads"
    ADD CONSTRAINT "external_raw_payloads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ingredient_import_batches"
    ADD CONSTRAINT "ingredient_import_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ingredient_usda_cache"
    ADD CONSTRAINT "ingredient_usda_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_name_norm_es_key" UNIQUE ("name_norm_es");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_items"
    ADD CONSTRAINT "meal_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_logs"
    ADD CONSTRAINT "meal_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_logs"
    ADD CONSTRAINT "meal_logs_user_id_id_unique" UNIQUE ("id", "user_id");



ALTER TABLE ONLY "public"."muscle_group_translations"
    ADD CONSTRAINT "muscle_group_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."muscle_groups"
    ADD CONSTRAINT "muscle_groups_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."muscle_groups"
    ADD CONSTRAINT "muscle_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipe_aliases"
    ADD CONSTRAINT "recipe_aliases_alias_norm_es_key" UNIQUE ("alias_norm_es");



ALTER TABLE ONLY "public"."recipe_aliases"
    ADD CONSTRAINT "recipe_aliases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipe_items"
    ADD CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_name_norm_es_key" UNIQUE ("name_norm_es");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resting_hr_logs"
    ADD CONSTRAINT "resting_hr_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_feedback"
    ADD CONSTRAINT "session_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_feedback"
    ADD CONSTRAINT "session_feedback_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."sleep_logs"
    ADD CONSTRAINT "sleep_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_goals"
    ADD CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_nutrition_settings"
    ADD CONSTRAINT "user_nutrition_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."weight_logs"
    ADD CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_plans"
    ADD CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_sets"
    ADD CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_template_exercises"
    ADD CONSTRAINT "workout_template_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_template_translations"
    ADD CONSTRAINT "workout_template_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_templates"
    ADD CONSTRAINT "workout_templates_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "tr_set_user_id_diet_meals" BEFORE INSERT ON "public"."diet_template_meals" FOR EACH ROW EXECUTE FUNCTION "public"."tf_set_user_id_from_parent"();



CREATE OR REPLACE TRIGGER "tr_set_user_id_endurance_steps" BEFORE INSERT ON "public"."endurance_workout_steps" FOR EACH ROW EXECUTE FUNCTION "public"."tf_set_user_id_from_parent"();



CREATE OR REPLACE TRIGGER "tr_set_user_id_laps" BEFORE INSERT ON "public"."activity_laps" FOR EACH ROW EXECUTE FUNCTION "public"."tf_set_user_id_from_parent"();



CREATE OR REPLACE TRIGGER "tr_set_user_id_streams" BEFORE INSERT ON "public"."activity_streams" FOR EACH ROW EXECUTE FUNCTION "public"."tf_set_user_id_from_parent"();



CREATE OR REPLACE TRIGGER "tr_set_user_id_wt_exercises" BEFORE INSERT ON "public"."workout_template_exercises" FOR EACH ROW EXECUTE FUNCTION "public"."tf_set_user_id_from_parent"();



ALTER TABLE ONLY "public"."activity_laps"
    ADD CONSTRAINT "activity_laps_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."activity_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_laps"
    ADD CONSTRAINT "activity_laps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_session_tags"
    ADD CONSTRAINT "activity_session_tags_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."activity_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_session_tags"
    ADD CONSTRAINT "activity_session_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id");



ALTER TABLE ONLY "public"."activity_sessions"
    ADD CONSTRAINT "activity_sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id");



ALTER TABLE ONLY "public"."activity_sessions"
    ADD CONSTRAINT "activity_sessions_endurance_template_id_fkey" FOREIGN KEY ("endurance_template_id") REFERENCES "public"."endurance_workout_templates"("id");



ALTER TABLE ONLY "public"."activity_sessions"
    ADD CONSTRAINT "activity_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_sessions"
    ADD CONSTRAINT "activity_sessions_workout_template_id_fkey" FOREIGN KEY ("workout_template_id") REFERENCES "public"."workout_templates"("id");



ALTER TABLE ONLY "public"."activity_streams"
    ADD CONSTRAINT "activity_streams_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."activity_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_streams"
    ADD CONSTRAINT "activity_streams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."body_measurements"
    ADD CONSTRAINT "body_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_hydration"
    ADD CONSTRAINT "daily_hydration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diet_template_meal_translations"
    ADD CONSTRAINT "diet_template_meal_translations_diet_template_meal_id_fkey" FOREIGN KEY ("diet_template_meal_id") REFERENCES "public"."diet_template_meals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diet_template_meals"
    ADD CONSTRAINT "diet_template_meals_diet_template_id_fkey" FOREIGN KEY ("diet_template_id") REFERENCES "public"."diet_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diet_template_meals"
    ADD CONSTRAINT "diet_template_meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diet_template_translations"
    ADD CONSTRAINT "diet_template_translations_diet_template_id_fkey" FOREIGN KEY ("diet_template_id") REFERENCES "public"."diet_templates"("id");



ALTER TABLE ONLY "public"."diet_templates"
    ADD CONSTRAINT "diet_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."endurance_workout_steps"
    ADD CONSTRAINT "endurance_workout_steps_parent_step_id_fkey" FOREIGN KEY ("parent_step_id") REFERENCES "public"."endurance_workout_steps"("id");



ALTER TABLE ONLY "public"."endurance_workout_steps"
    ADD CONSTRAINT "endurance_workout_steps_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."endurance_workout_templates"("id");



ALTER TABLE ONLY "public"."endurance_workout_steps"
    ADD CONSTRAINT "endurance_workout_steps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."endurance_workout_templates"
    ADD CONSTRAINT "endurance_workout_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."equipment_translations"
    ADD CONSTRAINT "equipment_translations_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id");



ALTER TABLE ONLY "public"."exercise_media"
    ADD CONSTRAINT "exercise_media_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id");



ALTER TABLE ONLY "public"."exercise_translations"
    ADD CONSTRAINT "exercise_translations_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_exercise_type_id_fkey" FOREIGN KEY ("exercise_type_id") REFERENCES "public"."exercise_types"("id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_primary_muscle_id_fkey" FOREIGN KEY ("primary_muscle_id") REFERENCES "public"."muscle_groups"("id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_secondary_muscle_id_fkey" FOREIGN KEY ("secondary_muscle_id") REFERENCES "public"."muscle_groups"("id");



ALTER TABLE ONLY "public"."external_accounts"
    ADD CONSTRAINT "external_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."external_activity_mappings"
    ADD CONSTRAINT "external_activity_mappings_activity_session_id_fkey" FOREIGN KEY ("activity_session_id") REFERENCES "public"."activity_sessions"("id");



ALTER TABLE ONLY "public"."external_activity_mappings"
    ADD CONSTRAINT "external_activity_mappings_external_account_id_fkey" FOREIGN KEY ("external_account_id") REFERENCES "public"."external_accounts"("id");



ALTER TABLE ONLY "public"."external_activity_mappings"
    ADD CONSTRAINT "external_activity_mappings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."external_raw_payloads"
    ADD CONSTRAINT "external_raw_payloads_external_activity_mapping_id_fkey" FOREIGN KEY ("external_activity_mapping_id") REFERENCES "public"."external_activity_mappings"("id");



ALTER TABLE ONLY "public"."ingredient_usda_cache"
    ADD CONSTRAINT "ingredient_usda_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_items"
    ADD CONSTRAINT "meal_items_meal_log_fkey" FOREIGN KEY ("meal_log_id") REFERENCES "public"."meal_logs"("id");



ALTER TABLE ONLY "public"."meal_items"
    ADD CONSTRAINT "meal_items_meal_log_user_fkey" FOREIGN KEY ("meal_log_id", "user_id") REFERENCES "public"."meal_logs"("id", "user_id");



ALTER TABLE ONLY "public"."meal_items"
    ADD CONSTRAINT "meal_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_logs"
    ADD CONSTRAINT "meal_logs_diet_template_meal_id_fkey" FOREIGN KEY ("diet_template_meal_id") REFERENCES "public"."diet_template_meals"("id");



ALTER TABLE ONLY "public"."meal_logs"
    ADD CONSTRAINT "meal_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."muscle_group_translations"
    ADD CONSTRAINT "muscle_group_translations_muscle_group_id_fkey" FOREIGN KEY ("muscle_group_id") REFERENCES "public"."muscle_groups"("id");



ALTER TABLE ONLY "public"."recipe_aliases"
    ADD CONSTRAINT "recipe_aliases_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id");



ALTER TABLE ONLY "public"."recipe_items"
    ADD CONSTRAINT "recipe_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id");



ALTER TABLE ONLY "public"."recipe_items"
    ADD CONSTRAINT "recipe_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id");



ALTER TABLE ONLY "public"."resting_hr_logs"
    ADD CONSTRAINT "resting_hr_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_feedback"
    ADD CONSTRAINT "session_feedback_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."activity_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_feedback"
    ADD CONSTRAINT "session_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sleep_logs"
    ADD CONSTRAINT "sleep_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_goals"
    ADD CONSTRAINT "user_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_nutrition_settings"
    ADD CONSTRAINT "user_nutrition_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weight_logs"
    ADD CONSTRAINT "weight_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_plans"
    ADD CONSTRAINT "workout_plans_activity_session_id_fkey" FOREIGN KEY ("activity_session_id") REFERENCES "public"."activity_sessions"("id");



ALTER TABLE ONLY "public"."workout_plans"
    ADD CONSTRAINT "workout_plans_endurance_template_id_fkey" FOREIGN KEY ("endurance_template_id") REFERENCES "public"."endurance_workout_templates"("id");



ALTER TABLE ONLY "public"."workout_plans"
    ADD CONSTRAINT "workout_plans_gym_template_id_fkey" FOREIGN KEY ("gym_template_id") REFERENCES "public"."workout_templates"("id");



ALTER TABLE ONLY "public"."workout_plans"
    ADD CONSTRAINT "workout_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_sets"
    ADD CONSTRAINT "workout_sets_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id");



ALTER TABLE ONLY "public"."workout_sets"
    ADD CONSTRAINT "workout_sets_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."activity_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_sets"
    ADD CONSTRAINT "workout_sets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_template_exercises"
    ADD CONSTRAINT "workout_template_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id");



ALTER TABLE ONLY "public"."workout_template_exercises"
    ADD CONSTRAINT "workout_template_exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_template_exercises"
    ADD CONSTRAINT "workout_template_exercises_workout_template_id_fkey" FOREIGN KEY ("workout_template_id") REFERENCES "public"."workout_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_template_translations"
    ADD CONSTRAINT "workout_template_translations_workout_template_id_fkey" FOREIGN KEY ("workout_template_id") REFERENCES "public"."workout_templates"("id");



ALTER TABLE ONLY "public"."workout_templates"
    ADD CONSTRAINT "workout_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Access own session tags" ON "public"."activity_session_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."activity_sessions" "s"
  WHERE (("s"."id" = "activity_session_tags"."session_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Access session_tags via session ownership" ON "public"."activity_session_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."activity_sessions" "s"
  WHERE (("s"."id" = "activity_session_tags"."session_id") AND ("s"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."activity_sessions" "s"
  WHERE (("s"."id" = "activity_session_tags"."session_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "CRUD own exercises" ON "public"."exercises" USING (("owner_user_id" = "auth"."uid"())) WITH CHECK (("owner_user_id" = "auth"."uid"()));



CREATE POLICY "Delete own exercises" ON "public"."exercises" FOR DELETE USING (("owner_user_id" = "auth"."uid"()));



CREATE POLICY "Insert own exercises" ON "public"."exercises" FOR INSERT WITH CHECK (("owner_user_id" = "auth"."uid"()));



CREATE POLICY "Owner can CRUD diet_template_meals" ON "public"."diet_template_meals" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner can CRUD endurance_steps" ON "public"."endurance_workout_steps" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner can CRUD laps" ON "public"."activity_laps" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner can CRUD streams" ON "public"."activity_streams" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner can CRUD wt_exercises" ON "public"."workout_template_exercises" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Public read access" ON "public"."equipment" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."equipment_translations" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."exercise_media" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."exercise_translations" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."exercise_types" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."muscle_group_translations" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."muscle_groups" FOR SELECT USING (true);



CREATE POLICY "Public read equipment" ON "public"."equipment" FOR SELECT USING (true);



CREATE POLICY "Public read equipment_translations" ON "public"."equipment_translations" FOR SELECT USING (true);



CREATE POLICY "Public read exercise_translations" ON "public"."exercise_translations" FOR SELECT USING (true);



CREATE POLICY "Public read ingredients" ON "public"."ingredients" FOR SELECT USING (true);



CREATE POLICY "Public read muscle_group_translations" ON "public"."muscle_group_translations" FOR SELECT USING (true);



CREATE POLICY "Public read muscle_groups" ON "public"."muscle_groups" FOR SELECT USING (true);



CREATE POLICY "Public read recipe_items" ON "public"."recipe_items" FOR SELECT USING (true);



CREATE POLICY "Public read recipes" ON "public"."recipes" FOR SELECT USING (true);



CREATE POLICY "Read public and own exercises" ON "public"."exercises" FOR SELECT USING ((("owner_user_id" IS NULL) OR ("owner_user_id" = "auth"."uid"())));



CREATE POLICY "Update own exercises" ON "public"."exercises" FOR UPDATE USING (("owner_user_id" = "auth"."uid"()));



CREATE POLICY "Users can CRUD own body_measurements" ON "public"."body_measurements" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own external_accounts" ON "public"."external_accounts" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own goals" ON "public"."user_goals" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own hydration" ON "public"."daily_hydration" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own mappings" ON "public"."external_activity_mappings" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own meal_items" ON "public"."meal_items" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own preferences" ON "public"."user_preferences" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own resting_hr_logs" ON "public"."resting_hr_logs" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own sleep_logs" ON "public"."sleep_logs" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own tags" ON "public"."tags" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own usda_cache" ON "public"."ingredient_usda_cache" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own weight_logs" ON "public"."weight_logs" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."activity_sessions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."body_measurements" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."daily_hydration" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."devices" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."diet_templates" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."external_accounts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."external_activity_mappings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."ingredient_usda_cache" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."meal_items" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."meal_logs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."resting_hr_logs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."session_feedback" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."sleep_logs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."tags" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."user_goals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."weight_logs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."workout_plans" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."workout_sets" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own" ON "public"."workout_templates" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own prefs" ON "public"."user_preferences" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."activity_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."body_measurements" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."daily_hydration" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."devices" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."diet_templates" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."external_accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."external_activity_mappings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."ingredient_usda_cache" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."meal_items" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."meal_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."resting_hr_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."session_feedback" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."sleep_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."tags" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."user_goals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."weight_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."workout_plans" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."workout_sets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own" ON "public"."workout_templates" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can select own" ON "public"."activity_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."body_measurements" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."daily_hydration" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."devices" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."diet_templates" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."external_accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."external_activity_mappings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."ingredient_usda_cache" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."meal_items" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."meal_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."resting_hr_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."session_feedback" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."sleep_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."tags" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."user_goals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."weight_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."workout_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."workout_sets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own" ON "public"."workout_templates" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own prefs" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."activity_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."body_measurements" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."daily_hydration" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."devices" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."diet_templates" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."external_accounts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."external_activity_mappings" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."ingredient_usda_cache" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."meal_items" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."meal_logs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."resting_hr_logs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."session_feedback" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."sleep_logs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."tags" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."user_goals" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."weight_logs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."workout_plans" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."workout_sets" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own" ON "public"."workout_templates" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own prefs" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can upsert own prefs" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "View own exercises" ON "public"."exercises" FOR SELECT USING (("owner_user_id" = "auth"."uid"()));



CREATE POLICY "View public exercises" ON "public"."exercises" FOR SELECT USING (("owner_user_id" IS NULL));



ALTER TABLE "public"."activity_laps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_laps_manage_own_via_session" ON "public"."activity_laps" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."activity_sessions" "s"
  WHERE (("s"."id" = "activity_laps"."session_id") AND ("s"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."activity_sessions" "s"
  WHERE (("s"."id" = "activity_laps"."session_id") AND ("s"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."activity_session_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_session_tags_manage_own_via_session" ON "public"."activity_session_tags" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."activity_sessions" "s"
  WHERE (("s"."id" = "activity_session_tags"."session_id") AND ("s"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."activity_sessions" "s"
  WHERE (("s"."id" = "activity_session_tags"."session_id") AND ("s"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."activity_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_sessions_manage_own" ON "public"."activity_sessions" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."activity_streams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_streams_manage_own_via_session" ON "public"."activity_streams" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."activity_sessions" "s"
  WHERE (("s"."id" = "activity_streams"."session_id") AND ("s"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."activity_sessions" "s"
  WHERE (("s"."id" = "activity_streams"."session_id") AND ("s"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."body_measurements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "body_measurements_manage_own" ON "public"."body_measurements" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."daily_hydration" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_hydration_manage_own" ON "public"."daily_hydration" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."devices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "devices_manage_own" ON "public"."devices" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."diet_template_meal_translations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diet_template_meal_translations_manage_own_via_meal" ON "public"."diet_template_meal_translations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."diet_template_meals" "m"
     JOIN "public"."diet_templates" "d" ON (("d"."id" = "m"."diet_template_id")))
  WHERE (("m"."id" = "diet_template_meal_translations"."diet_template_meal_id") AND ("d"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."diet_template_meals" "m"
     JOIN "public"."diet_templates" "d" ON (("d"."id" = "m"."diet_template_id")))
  WHERE (("m"."id" = "diet_template_meal_translations"."diet_template_meal_id") AND ("d"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."diet_template_meals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diet_template_meals_manage_own_via_template" ON "public"."diet_template_meals" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."diet_templates" "d"
  WHERE (("d"."id" = "diet_template_meals"."diet_template_id") AND ("d"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."diet_templates" "d"
  WHERE (("d"."id" = "diet_template_meals"."diet_template_id") AND ("d"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."diet_template_translations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diet_template_translations_manage_own_via_template" ON "public"."diet_template_translations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."diet_templates" "d"
  WHERE (("d"."id" = "diet_template_translations"."diet_template_id") AND ("d"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."diet_templates" "d"
  WHERE (("d"."id" = "diet_template_translations"."diet_template_id") AND ("d"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."diet_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diet_templates_manage_own" ON "public"."diet_templates" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."endurance_workout_steps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "endurance_workout_steps_manage_own_via_template" ON "public"."endurance_workout_steps" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."endurance_workout_templates" "t"
  WHERE (("t"."id" = "endurance_workout_steps"."template_id") AND ("t"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."endurance_workout_templates" "t"
  WHERE (("t"."id" = "endurance_workout_steps"."template_id") AND ("t"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."endurance_workout_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "endurance_workout_templates_manage_own" ON "public"."endurance_workout_templates" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."equipment" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "equipment_select_all_authenticated" ON "public"."equipment" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."equipment_translations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "equipment_translations_select_all_authenticated" ON "public"."equipment_translations" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."exercise_media" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exercise_media_select_all_authenticated" ON "public"."exercise_media" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."exercise_translations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exercise_translations_select_all_authenticated" ON "public"."exercise_translations" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."exercise_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exercise_types_select_all_authenticated" ON "public"."exercise_types" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."exercises" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exercises_manage_own_custom" ON "public"."exercises" TO "authenticated" USING ((("is_custom" = true) AND ("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("is_custom" = true) AND ("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "exercises_select_all_authenticated" ON "public"."exercises" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."external_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "external_accounts_manage_own" ON "public"."external_accounts" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."external_activity_mappings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "external_activity_mappings_manage_own" ON "public"."external_activity_mappings" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."external_raw_payloads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "external_raw_payloads_manage_own_via_mapping" ON "public"."external_raw_payloads" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."external_activity_mappings" "m"
  WHERE (("m"."id" = "external_raw_payloads"."external_activity_mapping_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."external_activity_mappings" "m"
  WHERE (("m"."id" = "external_raw_payloads"."external_activity_mapping_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."ingredient_import_batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ingredient_usda_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ingredient_usda_cache_manage_own" ON "public"."ingredient_usda_cache" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."ingredients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ingredients_select_all_authenticated" ON "public"."ingredients" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."meal_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meal_items_manage_own" ON "public"."meal_items" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."meal_logs" "ml"
  WHERE (("ml"."id" = "meal_items"."meal_log_id") AND ("ml"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."meal_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meal_logs_manage_own" ON "public"."meal_logs" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."muscle_group_translations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "muscle_group_translations_select_all_authenticated" ON "public"."muscle_group_translations" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."muscle_groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "muscle_groups_select_all_authenticated" ON "public"."muscle_groups" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."recipe_aliases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recipe_aliases_select_all_authenticated" ON "public"."recipe_aliases" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."recipe_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recipe_items_select_all_authenticated" ON "public"."recipe_items" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recipes_select_all_authenticated" ON "public"."recipes" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."resting_hr_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "resting_hr_logs_manage_own" ON "public"."resting_hr_logs" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."session_feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "session_feedback_manage_own" ON "public"."session_feedback" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."sleep_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sleep_logs_manage_own" ON "public"."sleep_logs" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_manage_own" ON "public"."tags" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."user_goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_goals_delete_own" ON "public"."user_goals" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_goals_insert_own" ON "public"."user_goals" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_goals_select_own" ON "public"."user_goals" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_goals_update_own" ON "public"."user_goals" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_preferences_select_own" ON "public"."user_preferences" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_preferences_update_own" ON "public"."user_preferences" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_preferences_upsert_own" ON "public"."user_preferences" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_select_own" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "users_update_own" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."weight_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "weight_logs_manage_own" ON "public"."weight_logs" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."workout_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workout_plans_manage_own" ON "public"."workout_plans" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."workout_sets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workout_sets_manage_own" ON "public"."workout_sets" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."workout_template_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_template_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workout_templates_manage_own" ON "public"."workout_templates" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."check_username"("username_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_username"("username_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_username"("username_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_user_account"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_account"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_account"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."import_ingredients_batch"("payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."import_ingredients_batch"("payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_ingredients_batch"("payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."import_recipes_batch"("payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."import_recipes_batch"("payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_recipes_batch"("payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_user_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_user_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_user_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tf_set_user_id_from_parent"() TO "anon";
GRANT ALL ON FUNCTION "public"."tf_set_user_id_from_parent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tf_set_user_id_from_parent"() TO "service_role";


















GRANT ALL ON TABLE "public"."activity_laps" TO "anon";
GRANT ALL ON TABLE "public"."activity_laps" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_laps" TO "service_role";



GRANT ALL ON TABLE "public"."activity_session_tags" TO "anon";
GRANT ALL ON TABLE "public"."activity_session_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_session_tags" TO "service_role";



GRANT ALL ON TABLE "public"."activity_sessions" TO "anon";
GRANT ALL ON TABLE "public"."activity_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."activity_streams" TO "anon";
GRANT ALL ON TABLE "public"."activity_streams" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_streams" TO "service_role";



GRANT ALL ON TABLE "public"."body_measurements" TO "anon";
GRANT ALL ON TABLE "public"."body_measurements" TO "authenticated";
GRANT ALL ON TABLE "public"."body_measurements" TO "service_role";



GRANT ALL ON TABLE "public"."daily_hydration" TO "anon";
GRANT ALL ON TABLE "public"."daily_hydration" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_hydration" TO "service_role";



GRANT ALL ON TABLE "public"."devices" TO "anon";
GRANT ALL ON TABLE "public"."devices" TO "authenticated";
GRANT ALL ON TABLE "public"."devices" TO "service_role";



GRANT ALL ON TABLE "public"."diet_template_meal_translations" TO "anon";
GRANT ALL ON TABLE "public"."diet_template_meal_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."diet_template_meal_translations" TO "service_role";



GRANT ALL ON TABLE "public"."diet_template_meals" TO "anon";
GRANT ALL ON TABLE "public"."diet_template_meals" TO "authenticated";
GRANT ALL ON TABLE "public"."diet_template_meals" TO "service_role";



GRANT ALL ON TABLE "public"."diet_template_translations" TO "anon";
GRANT ALL ON TABLE "public"."diet_template_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."diet_template_translations" TO "service_role";



GRANT ALL ON TABLE "public"."diet_templates" TO "anon";
GRANT ALL ON TABLE "public"."diet_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."diet_templates" TO "service_role";



GRANT ALL ON TABLE "public"."endurance_workout_steps" TO "anon";
GRANT ALL ON TABLE "public"."endurance_workout_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."endurance_workout_steps" TO "service_role";



GRANT ALL ON TABLE "public"."endurance_workout_templates" TO "anon";
GRANT ALL ON TABLE "public"."endurance_workout_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."endurance_workout_templates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."equipment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."equipment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."equipment_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."equipment" TO "anon";
GRANT ALL ON TABLE "public"."equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_translations" TO "anon";
GRANT ALL ON TABLE "public"."equipment_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_translations" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_media" TO "anon";
GRANT ALL ON TABLE "public"."exercise_media" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_media" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_translations" TO "anon";
GRANT ALL ON TABLE "public"."exercise_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_translations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."exercise_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."exercise_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."exercise_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_types" TO "anon";
GRANT ALL ON TABLE "public"."exercise_types" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_types" TO "service_role";



GRANT ALL ON TABLE "public"."exercises" TO "anon";
GRANT ALL ON TABLE "public"."exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."exercises" TO "service_role";



GRANT ALL ON TABLE "public"."external_accounts" TO "anon";
GRANT ALL ON TABLE "public"."external_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."external_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."external_activity_mappings" TO "anon";
GRANT ALL ON TABLE "public"."external_activity_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."external_activity_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."external_raw_payloads" TO "anon";
GRANT ALL ON TABLE "public"."external_raw_payloads" TO "authenticated";
GRANT ALL ON TABLE "public"."external_raw_payloads" TO "service_role";



GRANT ALL ON TABLE "public"."ingredient_import_batches" TO "anon";
GRANT ALL ON TABLE "public"."ingredient_import_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredient_import_batches" TO "service_role";



GRANT ALL ON TABLE "public"."ingredient_usda_cache" TO "anon";
GRANT ALL ON TABLE "public"."ingredient_usda_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredient_usda_cache" TO "service_role";



GRANT ALL ON TABLE "public"."ingredients" TO "anon";
GRANT ALL ON TABLE "public"."ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."meal_items" TO "anon";
GRANT ALL ON TABLE "public"."meal_items" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_items" TO "service_role";



GRANT ALL ON TABLE "public"."meal_logs" TO "anon";
GRANT ALL ON TABLE "public"."meal_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_logs" TO "service_role";



GRANT ALL ON TABLE "public"."muscle_group_translations" TO "anon";
GRANT ALL ON TABLE "public"."muscle_group_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."muscle_group_translations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."muscle_groups_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."muscle_groups_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."muscle_groups_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."muscle_groups" TO "anon";
GRANT ALL ON TABLE "public"."muscle_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."muscle_groups" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_aliases" TO "anon";
GRANT ALL ON TABLE "public"."recipe_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_aliases" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_items" TO "anon";
GRANT ALL ON TABLE "public"."recipe_items" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_items" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."resting_hr_logs" TO "anon";
GRANT ALL ON TABLE "public"."resting_hr_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."resting_hr_logs" TO "service_role";



GRANT ALL ON TABLE "public"."session_feedback" TO "anon";
GRANT ALL ON TABLE "public"."session_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."session_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."sleep_logs" TO "anon";
GRANT ALL ON TABLE "public"."sleep_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."sleep_logs" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."user_goals" TO "anon";
GRANT ALL ON TABLE "public"."user_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."user_goals" TO "service_role";



GRANT ALL ON TABLE "public"."user_nutrition_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_nutrition_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_nutrition_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."weight_logs" TO "anon";
GRANT ALL ON TABLE "public"."weight_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."weight_logs" TO "service_role";



GRANT ALL ON TABLE "public"."workout_plans" TO "anon";
GRANT ALL ON TABLE "public"."workout_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_plans" TO "service_role";



GRANT ALL ON TABLE "public"."workout_sets" TO "anon";
GRANT ALL ON TABLE "public"."workout_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_sets" TO "service_role";



GRANT ALL ON TABLE "public"."workout_template_exercises" TO "anon";
GRANT ALL ON TABLE "public"."workout_template_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_template_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."workout_template_translations" TO "anon";
GRANT ALL ON TABLE "public"."workout_template_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_template_translations" TO "service_role";



GRANT ALL ON TABLE "public"."workout_templates" TO "anon";
GRANT ALL ON TABLE "public"."workout_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_templates" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Avatar delete own folder"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Avatar read own folder"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Avatar update own folder"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Avatar upload own folder"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



