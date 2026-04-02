alter table "public"."activity_sessions" add column if not exists "route_polyline" text;

comment on column "public"."activity_sessions"."route_polyline" is
  'Google-encoded polyline string representing the GPS route of the activity.';
