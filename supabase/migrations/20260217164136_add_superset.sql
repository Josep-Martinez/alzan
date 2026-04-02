
  create table "public"."activity_session_superset_links" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "from_exercise_id" uuid not null,
    "to_exercise_id" uuid not null,
    "from_order_index" integer not null,
    "to_order_index" integer not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."activity_session_superset_links" enable row level security;

alter table "public"."workout_template_exercises" add column "superset_next_exercise_id" uuid;

CREATE UNIQUE INDEX activity_session_superset_links_pkey ON public.activity_session_superset_links USING btree (id);

CREATE UNIQUE INDEX activity_session_superset_links_session_from_order_unique ON public.activity_session_superset_links USING btree (session_id, from_order_index);

CREATE INDEX idx_activity_session_superset_links_session ON public.activity_session_superset_links USING btree (session_id, from_order_index);

CREATE UNIQUE INDEX workout_template_exercises_template_id_id_key ON public.workout_template_exercises USING btree (workout_template_id, id);

CREATE UNIQUE INDEX workout_template_exercises_template_order_unique ON public.workout_template_exercises USING btree (workout_template_id, order_index);

CREATE UNIQUE INDEX workout_template_exercises_unique_next_link_idx ON public.workout_template_exercises USING btree (superset_next_exercise_id) WHERE (superset_next_exercise_id IS NOT NULL);

alter table "public"."activity_session_superset_links" add constraint "activity_session_superset_links_pkey" PRIMARY KEY using index "activity_session_superset_links_pkey";

alter table "public"."activity_session_superset_links" add constraint "activity_session_superset_links_check" CHECK ((to_order_index = (from_order_index + 1))) not valid;

alter table "public"."activity_session_superset_links" validate constraint "activity_session_superset_links_check";

alter table "public"."activity_session_superset_links" add constraint "activity_session_superset_links_from_exercise_id_fkey" FOREIGN KEY (from_exercise_id) REFERENCES public.exercises(id) not valid;

alter table "public"."activity_session_superset_links" validate constraint "activity_session_superset_links_from_exercise_id_fkey";

alter table "public"."activity_session_superset_links" add constraint "activity_session_superset_links_from_order_index_check" CHECK ((from_order_index >= 0)) not valid;

alter table "public"."activity_session_superset_links" validate constraint "activity_session_superset_links_from_order_index_check";

alter table "public"."activity_session_superset_links" add constraint "activity_session_superset_links_no_self_ref_chk" CHECK ((from_exercise_id <> to_exercise_id)) not valid;

alter table "public"."activity_session_superset_links" validate constraint "activity_session_superset_links_no_self_ref_chk";

alter table "public"."activity_session_superset_links" add constraint "activity_session_superset_links_session_from_order_unique" UNIQUE using index "activity_session_superset_links_session_from_order_unique";

alter table "public"."activity_session_superset_links" add constraint "activity_session_superset_links_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.activity_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."activity_session_superset_links" validate constraint "activity_session_superset_links_session_id_fkey";

alter table "public"."activity_session_superset_links" add constraint "activity_session_superset_links_to_exercise_id_fkey" FOREIGN KEY (to_exercise_id) REFERENCES public.exercises(id) not valid;

alter table "public"."activity_session_superset_links" validate constraint "activity_session_superset_links_to_exercise_id_fkey";

alter table "public"."workout_template_exercises" add constraint "workout_template_exercises_no_self_superset_chk" CHECK (((superset_next_exercise_id IS NULL) OR (superset_next_exercise_id <> id))) not valid;

alter table "public"."workout_template_exercises" validate constraint "workout_template_exercises_no_self_superset_chk";

alter table "public"."workout_template_exercises" add constraint "workout_template_exercises_superset_next_same_template_fkey" FOREIGN KEY (workout_template_id, superset_next_exercise_id) REFERENCES public.workout_template_exercises(workout_template_id, id) ON DELETE SET NULL not valid;

alter table "public"."workout_template_exercises" validate constraint "workout_template_exercises_superset_next_same_template_fkey";

alter table "public"."workout_template_exercises" add constraint "workout_template_exercises_template_id_id_key" UNIQUE using index "workout_template_exercises_template_id_id_key";

alter table "public"."workout_template_exercises" add constraint "workout_template_exercises_template_order_unique" UNIQUE using index "workout_template_exercises_template_order_unique";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.validate_superset_next_exercise()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_next_order integer;
BEGIN
  IF NEW.superset_next_exercise_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT order_index
    INTO v_next_order
  FROM public.workout_template_exercises
  WHERE id = NEW.superset_next_exercise_id;

  IF v_next_order IS NULL THEN
    RAISE EXCEPTION 'superset_next_exercise_id % no existe', NEW.superset_next_exercise_id;
  END IF;

  IF v_next_order <> NEW.order_index + 1 THEN
    RAISE EXCEPTION
      'Enlace superserie inválido: el ejercicio % (order_index=%) debe apuntar al siguiente (%), pero apunta a order_index=%',
      NEW.id, NEW.order_index, NEW.order_index + 1, v_next_order;
  END IF;

  RETURN NEW;
END;
$function$
;

grant delete on table "public"."activity_session_superset_links" to "anon";

grant insert on table "public"."activity_session_superset_links" to "anon";

grant references on table "public"."activity_session_superset_links" to "anon";

grant select on table "public"."activity_session_superset_links" to "anon";

grant trigger on table "public"."activity_session_superset_links" to "anon";

grant truncate on table "public"."activity_session_superset_links" to "anon";

grant update on table "public"."activity_session_superset_links" to "anon";

grant delete on table "public"."activity_session_superset_links" to "authenticated";

grant insert on table "public"."activity_session_superset_links" to "authenticated";

grant references on table "public"."activity_session_superset_links" to "authenticated";

grant select on table "public"."activity_session_superset_links" to "authenticated";

grant trigger on table "public"."activity_session_superset_links" to "authenticated";

grant truncate on table "public"."activity_session_superset_links" to "authenticated";

grant update on table "public"."activity_session_superset_links" to "authenticated";

grant delete on table "public"."activity_session_superset_links" to "postgres";

grant insert on table "public"."activity_session_superset_links" to "postgres";

grant references on table "public"."activity_session_superset_links" to "postgres";

grant select on table "public"."activity_session_superset_links" to "postgres";

grant trigger on table "public"."activity_session_superset_links" to "postgres";

grant truncate on table "public"."activity_session_superset_links" to "postgres";

grant update on table "public"."activity_session_superset_links" to "postgres";

grant delete on table "public"."activity_session_superset_links" to "service_role";

grant insert on table "public"."activity_session_superset_links" to "service_role";

grant references on table "public"."activity_session_superset_links" to "service_role";

grant select on table "public"."activity_session_superset_links" to "service_role";

grant trigger on table "public"."activity_session_superset_links" to "service_role";

grant truncate on table "public"."activity_session_superset_links" to "service_role";

grant update on table "public"."activity_session_superset_links" to "service_role";


  create policy "Users can delete their own session superset links"
  on "public"."activity_session_superset_links"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.activity_sessions s
  WHERE ((s.id = activity_session_superset_links.session_id) AND (s.user_id = auth.uid())))));



  create policy "Users can insert their own session superset links"
  on "public"."activity_session_superset_links"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.activity_sessions s
  WHERE ((s.id = activity_session_superset_links.session_id) AND (s.user_id = auth.uid())))));



  create policy "Users can update their own session superset links"
  on "public"."activity_session_superset_links"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.activity_sessions s
  WHERE ((s.id = activity_session_superset_links.session_id) AND (s.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.activity_sessions s
  WHERE ((s.id = activity_session_superset_links.session_id) AND (s.user_id = auth.uid())))));



  create policy "Users can view their own session superset links"
  on "public"."activity_session_superset_links"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.activity_sessions s
  WHERE ((s.id = activity_session_superset_links.session_id) AND (s.user_id = auth.uid())))));


CREATE TRIGGER trg_validate_superset_next_exercise BEFORE INSERT OR UPDATE OF superset_next_exercise_id, order_index, workout_template_id ON public.workout_template_exercises FOR EACH ROW EXECUTE FUNCTION public.validate_superset_next_exercise();


