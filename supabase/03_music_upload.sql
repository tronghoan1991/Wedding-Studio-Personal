-- Bật upload MP3 từ trang admin.
-- Chạy file này MỘT LẦN trong Supabase SQL Editor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-public',
  'site-public',
  true,
  26214400,
  array['audio/mpeg','audio/mp3']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 26214400,
  allowed_mime_types = array['audio/mpeg','audio/mp3'];

drop policy if exists "owner insert site public music" on storage.objects;
drop policy if exists "owner select site public music" on storage.objects;
drop policy if exists "owner update site public music" on storage.objects;
drop policy if exists "owner delete site public music" on storage.objects;

create policy "owner insert site public music"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-public'
  and (storage.foldername(name))[1] = 'music'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
  and lower(storage.extension(name)) = 'mp3'
);

-- Storage API trả metadata sau upload, nên cần SELECT cho chính object của người upload.
create policy "owner select site public music"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'site-public'
  and owner_id = (select auth.uid()::text)
);

create policy "owner update site public music"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-public'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'site-public'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = 'music'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
  and lower(storage.extension(name)) = 'mp3'
);

create policy "owner delete site public music"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-public'
  and owner_id = (select auth.uid()::text)
);
