create type "public"."user_nutrition_settings_activity_level" as enum ('sedentary', 'light', 'moderate', 'high', 'very_high');

create type "public"."user_nutrition_settings_adjustment_type" as enum ('percent', 'kcal');

create type "public"."user_nutrition_settings_goal_mode" as enum ('lose', 'maintain', 'gain', 'recomp');

create type "public"."user_nutrition_settings_primary_goal_mode" as enum ('gain_strength', 'lose_weight', 'gain_muscle', 'recomp', 'maintain');

create type "public"."user_preferences_distance_unit" as enum ('km', 'miles');

create type "public"."user_preferences_energy_unit" as enum ('kcal', 'kj');

create type "public"."user_preferences_pace_unit" as enum ('min_km', 'min_mi');

create type "public"."user_preferences_weight_unit" as enum ('kg', 'lb');

create type "public"."users_sex" as enum ('male', 'female', 'other', 'prefer_not_to_say');

alter table "public"."user_nutrition_settings" drop constraint "user_nutrition_settings_activity_level_check";

alter table "public"."user_nutrition_settings" drop constraint "user_nutrition_settings_adjustment_type_check";

alter table "public"."user_nutrition_settings" drop constraint "user_nutrition_settings_check";

alter table "public"."user_nutrition_settings" drop constraint "user_nutrition_settings_goal_mode_check";

alter table "public"."user_nutrition_settings" drop constraint "user_nutrition_settings_primary_goal_check";

alter table "public"."users" drop constraint "users_sex_check";

alter table "public"."user_nutrition_settings" alter column "activity_level" drop default;

alter table "public"."user_nutrition_settings" alter column "activity_level" set data type public.user_nutrition_settings_activity_level using "activity_level"::public.user_nutrition_settings_activity_level;

alter table "public"."user_nutrition_settings" alter column "adjustment_type" drop default;

alter table "public"."user_nutrition_settings" alter column "adjustment_type" set data type public.user_nutrition_settings_adjustment_type using "adjustment_type"::public.user_nutrition_settings_adjustment_type;

alter table "public"."user_nutrition_settings" alter column "goal_mode" set data type public.user_nutrition_settings_goal_mode using "goal_mode"::public.user_nutrition_settings_goal_mode;

alter table "public"."user_nutrition_settings" alter column "primary_goal" set data type public.user_nutrition_settings_primary_goal_mode using "primary_goal"::public.user_nutrition_settings_primary_goal_mode;

alter table "public"."user_nutrition_settings" enable row level security;

alter table "public"."user_preferences" alter column "distance_unit" set default 'km'::public.user_preferences_distance_unit;

alter table "public"."user_preferences" alter column "distance_unit" set data type public.user_preferences_distance_unit using "distance_unit"::public.user_preferences_distance_unit;

alter table "public"."user_preferences" alter column "energy_unit" set default 'kcal'::public.user_preferences_energy_unit;

alter table "public"."user_preferences" alter column "energy_unit" set data type public.user_preferences_energy_unit using "energy_unit"::public.user_preferences_energy_unit;

alter table "public"."user_preferences" alter column "pace_unit" set default 'min_km'::public.user_preferences_pace_unit;

alter table "public"."user_preferences" alter column "pace_unit" set data type public.user_preferences_pace_unit using "pace_unit"::public.user_preferences_pace_unit;

alter table "public"."user_preferences" alter column "weight_unit" set default 'kg'::public.user_preferences_weight_unit;

alter table "public"."user_preferences" alter column "weight_unit" set data type public.user_preferences_weight_unit using "weight_unit"::public.user_preferences_weight_unit;

alter table "public"."users" alter column "sex" set default 'male'::public.users_sex;

alter table "public"."users" alter column "sex" set data type public.users_sex using "sex"::public.users_sex;


  create policy "Users can delete their own nutrition settings"
  on "public"."user_nutrition_settings"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own nutrition settings"
  on "public"."user_nutrition_settings"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can update their own nutrition settings"
  on "public"."user_nutrition_settings"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own nutrition settings"
  on "public"."user_nutrition_settings"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



