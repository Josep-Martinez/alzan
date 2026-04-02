create type "public"."user_preferences_language_code" as enum ('es', 'en');

alter table "public"."user_preferences" alter column "language_code" set default 'es'::public.user_preferences_language_code;

alter table "public"."user_preferences" alter column "language_code" set data type public.user_preferences_language_code using "language_code"::public.user_preferences_language_code;


