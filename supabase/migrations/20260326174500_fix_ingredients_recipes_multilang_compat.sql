-- Align local schema with seed schema for ingredients and recipes.
-- Target shape:
--   ingredients: notes_es, notes_en
--   recipes: description_es, description_en

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ingredients'
      and column_name = 'notes'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ingredients'
      and column_name = 'notes_es'
  ) then
    alter table public.ingredients rename column notes to notes_es;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recipes'
      and column_name = 'description'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recipes'
      and column_name = 'description_es'
  ) then
    alter table public.recipes rename column description to description_es;
  end if;
end
$$;

alter table public.ingredients
  add column if not exists notes_en text;

alter table public.recipes
  add column if not exists description_en text;
