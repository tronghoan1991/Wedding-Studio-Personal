-- Remove the two public password layers permanently for this wedding site.
-- Admin login remains unchanged.

update public.site_settings
set
  page_password_hash = null,
  album_password_hash = null,
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000001';
