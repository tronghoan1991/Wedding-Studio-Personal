create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id uuid primary key,
  owner_id uuid references auth.users(id) on delete set null,
  owner_email text not null,
  is_public boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  page_password_hash text,
  album_password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.site_settings(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  honorific text not null default 'ban',
  side text not null default 'khac',
  message text not null default '',
  token text not null unique,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.site_settings(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  attend boolean not null,
  guests_count integer not null default 1 check (guests_count between 1 and 20),
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.site_settings(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  message text not null check (char_length(message) between 1 and 800),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.site_settings(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete set null,
  path text not null unique,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.guests enable row level security;
alter table public.rsvps enable row level security;
alter table public.wishes enable row level security;
alter table public.photos enable row level security;

create or replace function public.is_configured_owner(site_row public.site_settings)
returns boolean language sql stable as $$
  select auth.uid() is not null and (
    site_row.owner_id = auth.uid() or
    (site_row.owner_id is null and lower(coalesce(auth.jwt()->>'email','')) = lower(site_row.owner_email))
  )
$$;

create policy "owner select site" on public.site_settings for select to authenticated using (public.is_configured_owner(site_settings));
create policy "owner update site" on public.site_settings for update to authenticated using (public.is_configured_owner(site_settings)) with check (public.is_configured_owner(site_settings));
create policy "owner guests" on public.guests for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner rsvps" on public.rsvps for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner wishes" on public.wishes for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner photos" on public.photos for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guest-photos','guest-photos',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=10485760, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

-- IMPORTANT: đổi email bên dưới thành email Supabase Auth của bạn trước khi chạy.
insert into public.site_settings (id, owner_email, data)
values (
  '00000000-0000-0000-0000-000000000001',
  'YOUR_ADMIN_EMAIL@example.com',
  jsonb_build_object(
    'brideName','Cô dâu',
    'groomName','Chú rể',
    'eventDate','2026-12-31T11:00:00+07:00',
    'venueName','Địa điểm tổ chức',
    'venueAddress','',
    'mapUrl','',
    'theme','mint',
    'cardStyle','classic',
    'effect','hearts',
    'musicUrl','',
    'storyText','',
    'galleryTitle','Khoảnh khắc của chúng tôi',
    'gallery',jsonb_build_array(),
    'languages',jsonb_build_array('vi'),
    'photoUploadCode','CHANGE-ME-RANDOM-CODE'
  )
)
on conflict (id) do nothing;

create or replace function public.hash_password(plain_text text)
returns text language sql security definer set search_path=public as $$
  select crypt(plain_text, gen_salt('bf', 12));
$$;

create or replace function public.verify_password(plain_text text, password_hash text)
returns boolean language sql security definer set search_path=public as $$
  select password_hash is not null and crypt(plain_text, password_hash) = password_hash;
$$;

revoke all on function public.hash_password(text) from public;
revoke all on function public.verify_password(text,text) from public;
grant execute on function public.hash_password(text) to service_role;
grant execute on function public.verify_password(text,text) to service_role;
