-- Migration: Convert array constraints to enums
-- This migration converts CHECK constraints that use ARRAY to proper PostgreSQL enums
-- Following the pattern from 20260115200313_use_enums_and_add_rls_user_nutrition_settings.sql

-- Create enum types
create type "public"."daily_hydration_source" as enum ('manual', 'imported', 'ai');

create type "public"."ingredients_category" as enum (
  'proteina_animal', 'proteina_vegetal', 'cereal', 'tuberculo', 'legumbre',
  'verdura', 'fruta', 'lacteo', 'grasa', 'fruto_seco', 'semilla',
  'bebida', 'condimento', 'otro', 'dulce', 'precocinado', 'snack'
);

create type "public"."ingredients_unit_basis" as enum ('per_100g', 'per_100ml');

create type "public"."meal_items_data_quality" as enum ('manual', 'automatic');

create type "public"."meal_items_origin" as enum ('user', 'ai_name', 'ai_photo', 'imported');

create type "public"."meal_items_source" as enum ('manual', 'database', 'openfoodfacts', 'custom');

create type "public"."meal_logs_data_quality" as enum ('manual', 'computed');

create type "public"."meal_logs_origin" as enum ('user', 'ai_name', 'ai_photo', 'imported');

create type "public"."recipe_items_unit" as enum ('g', 'ml');

create type "public"."workout_plans_status" as enum ('planned', 'completed', 'skipped', 'rescheduled');

-- Drop existing constraints
alter table "public"."daily_hydration" drop constraint "daily_hydration_source_check";

alter table "public"."ingredients" drop constraint "ingredients_category_check";

alter table "public"."ingredients" drop constraint "ingredients_unit_basis_check";

alter table "public"."meal_items" drop constraint "meal_items_data_quality_check";

alter table "public"."meal_items" drop constraint "meal_items_origin_check";

alter table "public"."meal_items" drop constraint "meal_items_source_check";

alter table "public"."meal_logs" drop constraint "meal_logs_data_quality_check";

alter table "public"."meal_logs" drop constraint "meal_logs_origin_check";

alter table "public"."recipe_items" drop constraint "recipe_items_unit_check";

alter table "public"."workout_plans" drop constraint "workout_plans_status_check";

-- Convert columns to enum types
-- daily_hydration.source
alter table "public"."daily_hydration" alter column "source" set default 'manual'::public.daily_hydration_source;

alter table "public"."daily_hydration" alter column "source" set data type public.daily_hydration_source using "source"::public.daily_hydration_source;

-- ingredients.category
alter table "public"."ingredients" alter column "category" set data type public.ingredients_category using "category"::public.ingredients_category;

-- ingredients.unit_basis
alter table "public"."ingredients" alter column "unit_basis" set default 'per_100g'::public.ingredients_unit_basis;

alter table "public"."ingredients" alter column "unit_basis" set data type public.ingredients_unit_basis using "unit_basis"::public.ingredients_unit_basis;

-- meal_items.data_quality
alter table "public"."meal_items" alter column "data_quality" set default 'manual'::public.meal_items_data_quality;

alter table "public"."meal_items" alter column "data_quality" set data type public.meal_items_data_quality using "data_quality"::public.meal_items_data_quality;

-- meal_items.origin
alter table "public"."meal_items" alter column "origin" set default 'user'::public.meal_items_origin;

alter table "public"."meal_items" alter column "origin" set data type public.meal_items_origin using "origin"::public.meal_items_origin;

-- meal_items.source
alter table "public"."meal_items" alter column "source" set default 'manual'::public.meal_items_source;

alter table "public"."meal_items" alter column "source" set data type public.meal_items_source using "source"::public.meal_items_source;

-- meal_logs.data_quality
alter table "public"."meal_logs" alter column "data_quality" set default 'manual'::public.meal_logs_data_quality;

alter table "public"."meal_logs" alter column "data_quality" set data type public.meal_logs_data_quality using "data_quality"::public.meal_logs_data_quality;

-- meal_logs.origin
alter table "public"."meal_logs" alter column "origin" set default 'user'::public.meal_logs_origin;

alter table "public"."meal_logs" alter column "origin" set data type public.meal_logs_origin using "origin"::public.meal_logs_origin;

-- recipe_items.unit
alter table "public"."recipe_items" alter column "unit" set data type public.recipe_items_unit using "unit"::public.recipe_items_unit;

-- workout_plans.status
alter table "public"."workout_plans" alter column "status" set default 'planned'::public.workout_plans_status;

alter table "public"."workout_plans" alter column "status" set data type public.workout_plans_status using "status"::public.workout_plans_status;
