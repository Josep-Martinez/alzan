CREATE UNIQUE INDEX social_follows_pkey ON public.social_follows USING btree (id_follower, id_followed);

alter table "public"."social_follows" add constraint "social_follows_pkey" PRIMARY KEY using index "social_follows_pkey";

alter table "public"."social_follows" add constraint "social_follows_id_followed_fkey" FOREIGN KEY (id_followed) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."social_follows" validate constraint "social_follows_id_followed_fkey";

alter table "public"."social_follows" add constraint "social_follows_id_follower_fkey" FOREIGN KEY (id_follower) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."social_follows" validate constraint "social_follows_id_follower_fkey";


