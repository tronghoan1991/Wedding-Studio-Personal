-- Public read fallback used only when the Edge Function is temporarily unavailable.
-- It returns ONLY the wedding data JSON, never owner email, owner id, password hashes or admin fields.

create or replace function public.get_public_wedding_site(p_site_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select s.data
  from public.site_settings s
  where s.id = p_site_id
    and (
      s.id = '00000000-0000-0000-0000-000000000001'::uuid
      or s.is_public = true
    )
  limit 1;
$$;

revoke all on function public.get_public_wedding_site(uuid) from public;
grant execute on function public.get_public_wedding_site(uuid) to anon, authenticated;

-- The primary invitation is intentionally always public.
update public.site_settings
set
  is_public = true,
  page_password_hash = null,
  album_password_hash = null,
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Password protection was removed from the product. Clear any legacy hashes.
update public.site_settings
set
  page_password_hash = null,
  album_password_hash = null,
  updated_at = now()
where page_password_hash is not null
   or album_password_hash is not null;
