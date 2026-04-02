alter table "public"."activity_sessions"
  add column if not exists "elev_loss_m" numeric;

alter table "public"."activity_sessions"
  add constraint "activity_sessions_elev_loss_m_check"
  check ((elev_loss_m is null) or (elev_loss_m >= 0)) not valid;

alter table "public"."activity_sessions"
  validate constraint "activity_sessions_elev_loss_m_check";

create table if not exists "public"."activity_heart_rate_zones" (
  "id" uuid primary key default gen_random_uuid(),
  "session_id" uuid not null references "public"."activity_sessions"("id") on delete cascade,
  "zone" smallint not null,
  "duration_s" integer not null,
  "percentage" numeric(5,2) not null,
  "created_at" timestamp with time zone not null default now(),
  constraint "activity_heart_rate_zones_zone_check" check (zone between 1 and 5),
  constraint "activity_heart_rate_zones_duration_check" check (duration_s >= 0),
  constraint "activity_heart_rate_zones_percentage_check" check (percentage >= 0 and percentage <= 100),
  constraint "activity_heart_rate_zones_session_zone_unique" unique (session_id, zone)
);

create index if not exists "idx_activity_heart_rate_zones_session_id"
  on "public"."activity_heart_rate_zones"("session_id");

alter table "public"."activity_heart_rate_zones" enable row level security;

create policy "activity_heart_rate_zones_manage_own_via_session"
  on "public"."activity_heart_rate_zones"
  to authenticated
  using (
    exists (
      select 1
      from "public"."activity_sessions" s
      where s.id = activity_heart_rate_zones.session_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from "public"."activity_sessions" s
      where s.id = activity_heart_rate_zones.session_id
        and s.user_id = auth.uid()
    )
  );

comment on table "public"."activity_heart_rate_zones" is
  'Aggregated heart-rate zone distribution for an activity session.';

comment on column "public"."activity_heart_rate_zones"."percentage" is
  'Percentage of total session duration spent in this heart-rate zone.';
