-- =====================================================================
-- Páginas: estructura de la base de datos (todas las páginas en un solo proyecto).
-- Ejecutar una sola vez en Supabase > SQL Editor > New query > Run.
-- Después, ejecutar supabase/admin.sql para darte permiso de administrador.
-- =====================================================================

-- ---------------------------------------------------------------- Tablas

-- Una fila por página (negocio). Su diseño y su vocabulario van en jsonb.
create table if not exists public.sites (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique
                  check (char_length(slug) between 2 and 40 and slug ~ '^[a-z0-9]+$' and slug <> 'admin'),
  name            text not null check (char_length(name) between 1 and 60),
  description     text not null default '',
  avatar_url      text,
  published       boolean not null default false,  -- false = borrador: solo lo ve el administrador
  theme           jsonb not null default '{}',     -- colores, fuentes, video, efecto, botones
  vocab           jsonb not null default '{}',     -- "Carta"/"plato" o "Catálogo"/"producto", unidades…
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.links (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references public.sites (id) on delete cascade,
  label      text not null check (char_length(label) between 1 and 60),
  type       text not null check (type in ('url', 'menu')),
  url        text,
  icon       text not null default 'link',
  position   int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  constraint links_url_required check (type = 'menu' or url is not null)
);

create table if not exists public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  description text,
  emoji       text,
  image_url   text,
  position    int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Secciones dentro de una categoría (Bebidas → Jugos, Cervezas…).
create table if not exists public.menu_subcategories (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites (id) on delete cascade,
  category_id uuid not null references public.menu_categories (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.menu_items (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references public.sites (id) on delete cascade,
  category_id    uuid not null references public.menu_categories (id) on delete cascade,
  -- Borrar una subcategoría no borra sus productos: quedan sin subcategoría.
  subcategory_id uuid references public.menu_subcategories (id) on delete set null,
  name           text not null check (char_length(name) between 1 and 70),
  description    text,
  price          integer not null check (price >= 0),  -- pesos colombianos, sin decimales; 0 = "Consultar precio"
  unit           text check (unit in ('lb', 'unidad', 'kg')),  -- precio por libra, unidad o kilo (null = no se indica)
  image_url      text,
  position       int  not null default 0,
  is_available   boolean not null default true,  -- false = "Agotado"
  is_active      boolean not null default true,  -- false = oculto
  created_at     timestamptz not null default now()
);

create index if not exists links_site_idx               on public.links (site_id);
create index if not exists menu_categories_site_idx     on public.menu_categories (site_id);
create index if not exists menu_subcategories_site_idx  on public.menu_subcategories (site_id);
create index if not exists menu_subcategories_cat_idx   on public.menu_subcategories (category_id);
create index if not exists menu_items_site_idx          on public.menu_items (site_id);
create index if not exists menu_items_category_idx      on public.menu_items (category_id);
create index if not exists menu_items_subcategory_idx   on public.menu_items (subcategory_id);

-- Quiénes pueden editar. Se agregan con supabase/admin.sql.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- Permisos

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- ¿La página está publicada? (security definer: no depende de la RLS de sites; lo usan las demás tablas).
create or replace function public.site_publicado(sid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.sites where id = sid and published);
$$;

grant execute on function public.is_admin(), public.site_publicado(uuid) to anon, authenticated;
grant select on public.sites, public.links, public.menu_categories, public.menu_subcategories, public.menu_items to anon, authenticated;
grant insert, update, delete on public.sites, public.links, public.menu_categories, public.menu_subcategories, public.menu_items to authenticated;
grant select on public.admins to authenticated;

alter table public.sites              enable row level security;
alter table public.links              enable row level security;
alter table public.menu_categories    enable row level security;
alter table public.menu_subcategories enable row level security;
alter table public.menu_items         enable row level security;
alter table public.admins             enable row level security;

-- Lectura: el público ve solo lo visible de páginas publicadas; el admin ve todo.
drop policy if exists "leer paginas" on public.sites;
create policy "leer paginas" on public.sites for select to anon, authenticated
  using (published or (select public.is_admin()));
drop policy if exists "leer botones" on public.links;
create policy "leer botones" on public.links for select to anon, authenticated
  using ((is_active and public.site_publicado(site_id)) or (select public.is_admin()));
drop policy if exists "leer categorias" on public.menu_categories;
create policy "leer categorias" on public.menu_categories for select to anon, authenticated
  using ((is_active and public.site_publicado(site_id)) or (select public.is_admin()));
drop policy if exists "leer subcategorias" on public.menu_subcategories;
create policy "leer subcategorias" on public.menu_subcategories for select to anon, authenticated
  using (public.site_publicado(site_id) or (select public.is_admin()));
drop policy if exists "leer productos" on public.menu_items;
create policy "leer productos" on public.menu_items for select to anon, authenticated
  using ((is_active and public.site_publicado(site_id)) or (select public.is_admin()));
drop policy if exists "ver mi rol" on public.admins;
create policy "ver mi rol" on public.admins for select to authenticated using (user_id = (select auth.uid()));

-- Escritura: solo administradores.
drop policy if exists "editar paginas" on public.sites;
create policy "editar paginas" on public.sites for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "editar botones" on public.links;
create policy "editar botones" on public.links for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "editar categorias" on public.menu_categories;
create policy "editar categorias" on public.menu_categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "editar subcategorias" on public.menu_subcategories;
create policy "editar subcategorias" on public.menu_subcategories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "editar productos" on public.menu_items;
create policy "editar productos" on public.menu_items for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------- Varias cartas

-- Cartas adicionales de una página (por ejemplo, la carta en inglés o la de bebidas).
-- La carta principal no tiene fila aquí: son las categorías con menu_id = null y usa el vocabulario de la página.
-- Se puede ejecutar sobre una base que ya existe: solo agrega la tabla y dos columnas opcionales.
create table if not exists public.menus (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references public.sites (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),        -- "English menu": se ve en el selector de cartas
  ruta       text not null check (char_length(ruta) between 2 and 40 and ruta ~ '^[a-z0-9]+$'),  -- /<slug>/<ruta>
  idioma     text not null default 'es' check (idioma in ('es', 'en')),      -- textos fijos de la carta (Inicio/Home, Agotado/Sold out…)
  titulo     text check (char_length(titulo) <= 60),
  subtitulo  text check (char_length(subtitulo) <= 160),
  position   int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (site_id, ruta)
);
create index if not exists menus_site_idx on public.menus (site_id);

-- Cada categoría pertenece a una carta (null = la principal). Borrar una carta borra sus categorías.
alter table public.menu_categories add column if not exists menu_id uuid references public.menus (id) on delete cascade;
create index if not exists menu_categories_menu_idx on public.menu_categories (menu_id);
-- Un botón de tipo carta abre una carta concreta (null = la principal; si se borra la carta, vuelve a la principal).
alter table public.links add column if not exists menu_id uuid references public.menus (id) on delete set null;

grant select on public.menus to anon, authenticated;
grant insert, update, delete on public.menus to authenticated;
alter table public.menus enable row level security;
drop policy if exists "leer cartas" on public.menus;
create policy "leer cartas" on public.menus for select to anon, authenticated
  using ((is_active and public.site_publicado(site_id)) or (select public.is_admin()));
drop policy if exists "editar cartas" on public.menus;
create policy "editar cartas" on public.menus for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------- Fotos y videos

-- Bucket público: fotos (el panel las comprime a WebP) y videos de fondo (máx. 20 MB).
-- Cada página guarda lo suyo en una carpeta con su id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 20971520, array['image/webp', 'image/jpeg', 'image/png', 'video/mp4', 'video/webm'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Listar la carpeta de cada página (para detectar y borrar archivos que ya no se usan).
drop policy if exists "admin lista archivos" on storage.objects;
create policy "admin lista archivos" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
drop policy if exists "admin sube archivos" on storage.objects;
create policy "admin sube archivos" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));
drop policy if exists "admin cambia archivos" on storage.objects;
create policy "admin cambia archivos" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
drop policy if exists "admin borra archivos" on storage.objects;
create policy "admin borra archivos" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
