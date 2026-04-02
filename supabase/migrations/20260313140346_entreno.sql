alter table "public"."activity_sessions" add column "recovery_time_s" integer;

alter table "public"."activity_sessions" add column "total_steps" integer;

alter table "public"."activity_sessions" add column "vo2_max" numeric(4,1);

alter table "public"."activity_sessions" add constraint "activity_sessions_recovery_time_s_check" CHECK (((recovery_time_s IS NULL) OR (recovery_time_s >= 0))) not valid;

alter table "public"."activity_sessions" validate constraint "activity_sessions_recovery_time_s_check";

alter table "public"."activity_sessions" add constraint "activity_sessions_total_steps_check" CHECK (((total_steps IS NULL) OR (total_steps >= 0))) not valid;

alter table "public"."activity_sessions" validate constraint "activity_sessions_total_steps_check";

alter table "public"."activity_sessions" add constraint "activity_sessions_vo2_max_check" CHECK (((vo2_max IS NULL) OR ((vo2_max > (0)::numeric) AND (vo2_max <= (100)::numeric)))) not valid;

alter table "public"."activity_sessions" validate constraint "activity_sessions_vo2_max_check";


