-- Wedding Studio Personal: remove the legacy public/album password layer completely.
-- Safe to run more than once.

-- No invitation in this project should require a page or album password.
update public.site_settings
set
  page_password_hash = null,
  album_password_hash = null,
  updated_at = now()
where page_password_hash is not null
   or album_password_hash is not null;

-- Keep the original/root invitation public. Newly-created invitations still
-- retain their own is_public switch until the admin explicitly publishes them.
update public.site_settings
set
  is_public = true,
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000001';
