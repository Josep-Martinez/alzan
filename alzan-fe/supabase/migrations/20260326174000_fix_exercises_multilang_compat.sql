-- Align local schema with seed schema for exercises.
-- Target shape:
--   base_name_es (required), description_es, base_name_en, description_en

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercises'
      and column_name = 'base_name'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercises'
      and column_name = 'base_name_es'
  ) then
    alter table public.exercises rename column base_name to base_name_es;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercises'
      and column_name = 'description'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercises'
      and column_name = 'description_es'
  ) then
    alter table public.exercises rename column description to description_es;
  end if;
end
$$;

alter table public.exercises
  add column if not exists base_name_en text,
  add column if not exists description_en text;
