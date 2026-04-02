alter table "public"."user_nutrition_settings" add column "daily_activity" text;

alter table "public"."user_nutrition_settings" add column "training_frequency" text;

CREATE UNIQUE INDEX exercise_translations_exercise_lang_uq ON public.exercise_translations USING btree (exercise_id, language_code);

alter table "public"."user_nutrition_settings" add constraint "user_nutrition_settings_daily_activity_check" CHECK ((daily_activity = ANY (ARRAY['sedentary'::text, 'active'::text, 'physical'::text]))) not valid;

alter table "public"."user_nutrition_settings" validate constraint "user_nutrition_settings_daily_activity_check";

alter table "public"."user_nutrition_settings" add constraint "user_nutrition_settings_training_frequency_check" CHECK ((training_frequency = ANY (ARRAY['none'::text, 'occasional'::text, 'frequent'::text, 'athlete'::text]))) not valid;

alter table "public"."user_nutrition_settings" validate constraint "user_nutrition_settings_training_frequency_check";


