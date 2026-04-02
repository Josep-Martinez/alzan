-- Migration: Convert remaining string fields to PostgreSQL enums
-- This migration converts the remaining string fields that are not yet enums
-- Excludes fields already migrated in previous migrations

-- ============================================================================
-- CREATE NEW ENUM TYPES (excluding already migrated ones)
-- ============================================================================

-- Training Module Enums
CREATE TYPE duration_type_enum AS ENUM ('time', 'distance', 'lap_button');
CREATE TYPE phase_type_enum AS ENUM ('warmup', 'interval', 'recovery', 'cooldown', 'relax');
CREATE TYPE target_type_enum AS ENUM ('none', 'pace', 'heart_rate', 'power', 'speed', 'heart_rate_zone', 'rpe');
CREATE TYPE sport_type_enum AS ENUM ('basketball', 'padel', 'hiking', 'strength', 'running', 'cycling', 'swimming', 'football', 'tennis','other', 'gym');
CREATE TYPE workout_goal_enum AS ENUM ('resistencia', 'fuerza', 'velocidad', 'potencia', 'hipertrofia', 'perdida_grasa');

-- Nutrition Module Enums
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'merienda', 'almuerzo');

-- Nutrition Settings Enums (daily_activity and training_frequency - others already migrated)
CREATE TYPE daily_activity_enum AS ENUM ('sedentary', 'active', 'physical');
CREATE TYPE training_frequency_enum AS ENUM ('none', 'occasional', 'frequent', 'athlete');

-- Activity & Sessions Enums
CREATE TYPE activity_source_enum AS ENUM ('manual', 'imported', 'strava', 'garmin', 'polar', 'gym_session');
CREATE TYPE activity_status_enum AS ENUM ('active', 'completed', 'paused', 'cancelled');
CREATE TYPE visibility_enum AS ENUM ('private', 'followers', 'public');
CREATE TYPE provider_enum AS ENUM ('manual', 'strava', 'garmin', 'polar', 'fitbit', 'other');

-- Health & User Enums
CREATE TYPE measurement_type_enum AS ENUM ('waist', 'chest', 'hips', 'thigh', 'arm', 'calf', 'neck', 'shoulders', 'abdomen');

-- Remaining Enums
CREATE TYPE lap_type_enum AS ENUM ('manual', 'auto', 'distance', 'time', 'unknown');
CREATE TYPE stream_type_enum AS ENUM ('heart_rate', 'cadence', 'power', 'altitude', 'speed', 'distance', 'temperature');
CREATE TYPE sport_subtype_enum AS ENUM ('road', 'trail', 'track', 'indoor', 'outdoor', 'pool', 'open_water');
CREATE TYPE language_code_enum AS ENUM ('es', 'en');

-- ============================================================================
-- DROP EXISTING CHECK CONSTRAINTS (only for fields being migrated)
-- ============================================================================

-- Nutrition Settings (only for daily_activity and training_frequency)
ALTER TABLE "public"."user_nutrition_settings" DROP CONSTRAINT IF EXISTS "user_nutrition_settings_daily_activity_check";
ALTER TABLE "public"."user_nutrition_settings" DROP CONSTRAINT IF EXISTS "user_nutrition_settings_training_frequency_check";

-- ============================================================================
-- CONVERT COLUMNS TO ENUM TYPES
-- ============================================================================

-- TRAINING MODULE

-- endurance_workout_steps.duration_type
ALTER TABLE "public"."endurance_workout_steps" 
  ALTER COLUMN "duration_type" DROP DEFAULT;
ALTER TABLE "public"."endurance_workout_steps" 
  ALTER COLUMN "duration_type" TYPE duration_type_enum 
  USING "duration_type"::text::duration_type_enum;

-- endurance_workout_steps.phase_type
ALTER TABLE "public"."endurance_workout_steps" 
  ALTER COLUMN "phase_type" DROP DEFAULT;
ALTER TABLE "public"."endurance_workout_steps" 
  ALTER COLUMN "phase_type" TYPE phase_type_enum 
  USING "phase_type"::text::phase_type_enum;

-- endurance_workout_steps.target_type
ALTER TABLE "public"."endurance_workout_steps" 
  ALTER COLUMN "target_type" DROP DEFAULT;
ALTER TABLE "public"."endurance_workout_steps" 
  ALTER COLUMN "target_type" TYPE target_type_enum 
  USING "target_type"::text::target_type_enum;

-- activity_sessions.sport_type
ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "sport_type" DROP DEFAULT;
ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "sport_type" TYPE sport_type_enum 
  USING "sport_type"::text::sport_type_enum;

-- endurance_workout_templates.sport_type
ALTER TABLE "public"."endurance_workout_templates" 
  ALTER COLUMN "sport_type" DROP DEFAULT;
ALTER TABLE "public"."endurance_workout_templates" 
  ALTER COLUMN "sport_type" TYPE sport_type_enum 
  USING "sport_type"::text::sport_type_enum;

-- NUTRITION MODULE

-- diet_template_meals.meal_type
ALTER TABLE "public"."diet_template_meals" 
  ALTER COLUMN "meal_type" DROP DEFAULT;
ALTER TABLE "public"."diet_template_meals" 
  ALTER COLUMN "meal_type" TYPE meal_type_enum 
  USING "meal_type"::text::meal_type_enum;

-- meal_logs.meal_type
ALTER TABLE "public"."meal_logs" 
  ALTER COLUMN "meal_type" DROP DEFAULT;
ALTER TABLE "public"."meal_logs" 
  ALTER COLUMN "meal_type" TYPE meal_type_enum 
  USING "meal_type"::text::meal_type_enum;

-- NUTRITION SETTINGS (only daily_activity and training_frequency)

-- user_nutrition_settings.daily_activity (nullable)
ALTER TABLE "public"."user_nutrition_settings" 
  ALTER COLUMN "daily_activity" DROP DEFAULT;
ALTER TABLE "public"."user_nutrition_settings" 
  ALTER COLUMN "daily_activity" TYPE daily_activity_enum 
  USING "daily_activity"::text::daily_activity_enum;

-- user_nutrition_settings.training_frequency (nullable)
ALTER TABLE "public"."user_nutrition_settings" 
  ALTER COLUMN "training_frequency" DROP DEFAULT;
ALTER TABLE "public"."user_nutrition_settings" 
  ALTER COLUMN "training_frequency" TYPE training_frequency_enum 
  USING "training_frequency"::text::training_frequency_enum;

-- ACTIVITY & SESSIONS

-- activity_sessions.source
ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "source" TYPE activity_source_enum 
  USING "source"::text::activity_source_enum;

-- activity_sessions.status
ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "status" TYPE activity_status_enum 
  USING "status"::text::activity_status_enum;

-- activity_sessions.visibility (nullable)
ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "visibility" TYPE visibility_enum 
  USING "visibility"::text::visibility_enum;

-- activity_sessions.provider
ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "provider" DROP DEFAULT;
ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "provider" TYPE provider_enum 
  USING "provider"::text::provider_enum;

-- devices.provider
ALTER TABLE "public"."devices" 
  ALTER COLUMN "provider" DROP DEFAULT;
ALTER TABLE "public"."devices" 
  ALTER COLUMN "provider" TYPE provider_enum 
  USING "provider"::text::provider_enum;

-- HEALTH & USER MODULE

-- body_measurements.measurement_type
ALTER TABLE "public"."body_measurements" 
  ALTER COLUMN "measurement_type" DROP DEFAULT;
ALTER TABLE "public"."body_measurements" 
  ALTER COLUMN "measurement_type" TYPE measurement_type_enum 
  USING "measurement_type"::text::measurement_type_enum;

-- REMAINING FIELDS

-- endurance_workout_templates.workout_goal (nullable)
ALTER TABLE "public"."endurance_workout_templates" 
  ALTER COLUMN "workout_goal" DROP DEFAULT;
ALTER TABLE "public"."endurance_workout_templates" 
  ALTER COLUMN "workout_goal" TYPE workout_goal_enum 
  USING "workout_goal"::text::workout_goal_enum;

-- workout_templates.workout_goal (nullable)
ALTER TABLE "public"."workout_templates" 
  ALTER COLUMN "workout_goal" DROP DEFAULT;
ALTER TABLE "public"."workout_templates" 
  ALTER COLUMN "workout_goal" TYPE workout_goal_enum 
  USING "workout_goal"::text::workout_goal_enum;

-- activity_laps.lap_type
ALTER TABLE "public"."activity_laps" 
  ALTER COLUMN "lap_type" DROP DEFAULT;
ALTER TABLE "public"."activity_laps" 
  ALTER COLUMN "lap_type" TYPE lap_type_enum 
  USING "lap_type"::text::lap_type_enum;

-- activity_streams.stream_type
ALTER TABLE "public"."activity_streams" 
  ALTER COLUMN "stream_type" DROP DEFAULT;
ALTER TABLE "public"."activity_streams" 
  ALTER COLUMN "stream_type" TYPE stream_type_enum 
  USING "stream_type"::text::stream_type_enum;

-- activity_sessions.sport_subtype (nullable)
ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "sport_subtype" DROP DEFAULT;
ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "sport_subtype" TYPE sport_subtype_enum 
  USING "sport_subtype"::text::sport_subtype_enum;

-- diet_template_translations.language_code (nullable)
ALTER TABLE "public"."diet_template_translations" 
  ALTER COLUMN "language_code" DROP DEFAULT;
ALTER TABLE "public"."diet_template_translations" 
  ALTER COLUMN "language_code" TYPE language_code_enum 
  USING "language_code"::text::language_code_enum;

-- diet_template_meal_translations.language_code (nullable)
ALTER TABLE "public"."diet_template_meal_translations" 
  ALTER COLUMN "language_code" DROP DEFAULT;
ALTER TABLE "public"."diet_template_meal_translations" 
  ALTER COLUMN "language_code" TYPE language_code_enum 
  USING "language_code"::text::language_code_enum;

-- ============================================================================
-- SET DEFAULTS WHERE APPROPRIATE
-- ============================================================================

-- Restore defaults based on query results
ALTER TABLE "public"."endurance_workout_steps" 
  ALTER COLUMN "target_type" SET DEFAULT 'none'::target_type_enum;

ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "source" SET DEFAULT 'manual'::activity_source_enum;

ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "provider" SET DEFAULT 'manual'::provider_enum;

ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "status" SET DEFAULT 'completed'::activity_status_enum;

ALTER TABLE "public"."activity_sessions" 
  ALTER COLUMN "visibility" SET DEFAULT 'private'::visibility_enum;

ALTER TABLE "public"."activity_laps" 
  ALTER COLUMN "lap_type" SET DEFAULT 'unknown'::lap_type_enum;

ALTER TABLE "public"."devices" 
  ALTER COLUMN "provider" SET DEFAULT 'other'::provider_enum;