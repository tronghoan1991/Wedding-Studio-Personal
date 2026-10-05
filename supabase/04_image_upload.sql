-- Upload ảnh QR mừng cưới và album từ trang Admin.
-- Chạy file này MỘT LẦN trong Supabase SQL Editor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images',
  'site-images',
  true,
  20971520,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "owner insert site images" on storage.objects;
drop policy if exists "owner select site images" on storage.objects;
drop policy if exists "owner update site images" on storage.objects;
drop policy if exists "owner delete site images" on storage.objects;

create policy "owner insert site images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-images'
  and (storage.foldername(name))[1] in ('album','qr')
  and (storage.foldername(name))[2] = (select auth.uid()::text)
  and lower(storage.extension(name)) in ('jpg','jpeg','png','webp')
);

create policy "owner select site images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'site-images'
  and owner_id = (select auth.uid()::text)
);

create policy "owner update site images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-images'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'site-images'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] in ('album','qr')
  and (storage.foldername(name))[2] = (select auth.uid()::text)
  and lower(storage.extension(name)) in ('jpg','jpeg','png','webp')
);

create policy "owner delete site images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-images'
  and owner_id = (select auth.uid()::text)
);
