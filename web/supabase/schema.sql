-- Run this file in the Supabase SQL Editor to create the recipe database.

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(trim(title)) between 1 and 120),
  photo_path text,
  photo_alt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- These ALTERs also upgrade a database created with an earlier version of this file.
alter table public.recipes add column if not exists photo_path text;
alter table public.recipes add column if not exists photo_alt text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.recipes'::regclass and conname = 'recipes_photo_pair_check'
  ) then
    alter table public.recipes add constraint recipes_photo_pair_check
      check (
        (photo_path is null and photo_alt is null)
        or (photo_path is not null and char_length(trim(coalesce(photo_alt, ''))) between 1 and 250)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.recipes'::regclass and conname = 'recipes_photo_path_check'
  ) then
    alter table public.recipes add constraint recipes_photo_path_check
      check (
        photo_path is null
        or photo_path ~ '^recipes/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp)$'
      );
  end if;
end;
$$;

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  amount numeric(14, 5) not null check (amount > 0),
  unit text not null default '' check (char_length(unit) <= 80),
  name text not null check (char_length(trim(name)) between 1 and 160),
  position integer not null check (position >= 0),
  unique (recipe_id, position)
);

create table if not exists public.recipe_instructions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 4000),
  position integer not null check (position >= 0),
  unique (recipe_id, position)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);

create unique index if not exists tags_name_case_insensitive_idx
  on public.tags (lower(name));

create table if not exists public.recipe_tags (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (recipe_id, tag_id)
);

alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_instructions enable row level security;
alter table public.tags enable row level security;
alter table public.recipe_tags enable row level security;

grant usage on schema public to service_role;
grant all on public.recipes, public.recipe_ingredients, public.recipe_instructions,
  public.tags, public.recipe_tags to service_role;

-- Recipe photographs are public content. The public bucket allows reads; only the
-- server-side service key can upload or remove objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-photos',
  'recipe-photos',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view recipe photos" on storage.objects;
create policy "Public can view recipe photos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'recipe-photos');

-- Replace the earlier save function signature when upgrading an existing project.
drop function if exists public.save_recipe(uuid, text, text, jsonb, jsonb, jsonb);

create or replace function public.save_recipe(
  p_recipe_id uuid,
  p_title text,
  p_slug text,
  p_tags jsonb,
  p_ingredients jsonb,
  p_instructions jsonb,
  p_photo_path text,
  p_photo_alt text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_recipe_id uuid;
  v_slug text;
begin
  if char_length(trim(coalesce(p_title, ''))) not between 1 and 120 then
    raise exception 'Recipe title must be between 1 and 120 characters';
  end if;

  if jsonb_typeof(p_tags) is distinct from 'array'
    or jsonb_typeof(p_ingredients) is distinct from 'array'
    or jsonb_typeof(p_instructions) is distinct from 'array' then
    raise exception 'Recipe fields must be JSON arrays';
  end if;

  if jsonb_array_length(p_ingredients) = 0 or jsonb_array_length(p_instructions) = 0 then
    raise exception 'A recipe needs ingredients and instructions';
  end if;

  if (p_photo_path is null) is distinct from (p_photo_alt is null)
    or (p_photo_path is not null and char_length(trim(coalesce(p_photo_alt, ''))) not between 1 and 250)
    or (p_photo_path is not null and p_photo_path !~ '^recipes/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp)$') then
    raise exception 'Recipe photo details are invalid';
  end if;

  if p_recipe_id is null then
    if char_length(trim(coalesce(p_slug, ''))) = 0 then
      raise exception 'A new recipe needs a URL slug';
    end if;

    insert into public.recipes (slug, title, photo_path, photo_alt)
    values (trim(p_slug), trim(p_title), p_photo_path, nullif(trim(p_photo_alt), ''))
    returning id, slug into v_recipe_id, v_slug;
  else
    update public.recipes
    set title = trim(p_title),
      photo_path = p_photo_path,
      photo_alt = nullif(trim(p_photo_alt), ''),
      updated_at = pg_catalog.now()
    where id = p_recipe_id
    returning id, slug into v_recipe_id, v_slug;

    if v_recipe_id is null then
      raise exception 'Recipe not found';
    end if;
  end if;

  delete from public.recipe_ingredients where recipe_id = v_recipe_id;
  delete from public.recipe_instructions where recipe_id = v_recipe_id;
  delete from public.recipe_tags where recipe_id = v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, amount, unit, name, position)
  select
    v_recipe_id,
    (item->>'amount')::numeric,
    coalesce(item->>'unit', ''),
    trim(item->>'name'),
    (ordinal - 1)::integer
  from pg_catalog.jsonb_array_elements(p_ingredients) with ordinality as ingredient_rows(item, ordinal);

  insert into public.recipe_instructions (recipe_id, content, position)
  select v_recipe_id, trim(item->>'content'), (ordinal - 1)::integer
  from pg_catalog.jsonb_array_elements(p_instructions) with ordinality as instruction_rows(item, ordinal);

  insert into public.tags (name)
  select candidate.name
  from (
    select distinct on (lower(trim(tag_value))) trim(tag_value) as name
    from pg_catalog.jsonb_array_elements_text(p_tags) as tag_rows(tag_value)
    where trim(tag_value) <> ''
    order by lower(trim(tag_value)), trim(tag_value)
  ) as candidate
  on conflict (lower(name)) do nothing;

  insert into public.recipe_tags (recipe_id, tag_id)
  select v_recipe_id, tag.id
  from public.tags as tag
  where lower(tag.name) in (
    select distinct lower(trim(tag_value))
    from pg_catalog.jsonb_array_elements_text(p_tags) as tag_rows(tag_value)
    where trim(tag_value) <> ''
  )
  on conflict do nothing;

  return pg_catalog.jsonb_build_object('id', v_recipe_id, 'slug', v_slug);
end;
$$;

revoke all on function public.save_recipe(uuid, text, text, jsonb, jsonb, jsonb, text, text)
  from public, anon, authenticated;
grant execute on function public.save_recipe(uuid, text, text, jsonb, jsonb, jsonb, text, text)
  to service_role;
