-- Ejecuta este archivo completo en Supabase → SQL Editor → New query → Run.

-- ============ Tablas ============
create table if not exists public.pages (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title       text not null default '',
  bio         text not null default '',
  avatar_url  text,
  theme       jsonb not null default '{}'::jsonb,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.links (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages(id) on delete cascade,
  label      text not null default '',
  url        text not null default '',
  icon       text,
  position   int  not null default 0,
  enabled    boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists links_page_id_idx on public.links(page_id, position);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists pages_touch on public.pages;
create trigger pages_touch before update on public.pages
  for each row execute function public.touch_updated_at();

-- ============ Seguridad (RLS) ============
alter table public.pages enable row level security;
alter table public.links enable row level security;

-- Público: solo lee páginas publicadas y sus enlaces activos
drop policy if exists "public read pages" on public.pages;
create policy "public read pages" on public.pages
  for select to anon using (published = true);

drop policy if exists "public read links" on public.links;
create policy "public read links" on public.links
  for select to anon using (
    enabled = true and exists (
      select 1 from public.pages p where p.id = links.page_id and p.published = true
    )
  );

-- Admin (usuario con sesión): acceso total
drop policy if exists "admin all pages" on public.pages;
create policy "admin all pages" on public.pages
  for all to authenticated using (true) with check (true);

drop policy if exists "admin all links" on public.links;
create policy "admin all links" on public.links
  for all to authenticated using (true) with check (true);

-- ============ Imágenes (Storage) ============
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "admin write avatars" on storage.objects;
create policy "admin write avatars" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');

drop policy if exists "admin update avatars" on storage.objects;
create policy "admin update avatars" on storage.objects
  for update to authenticated using (bucket_id = 'avatars');

drop policy if exists "admin delete avatars" on storage.objects;
create policy "admin delete avatars" on storage.objects
  for delete to authenticated using (bucket_id = 'avatars');
