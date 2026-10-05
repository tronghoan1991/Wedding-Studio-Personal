-- Multi-site support: cho phép một tài khoản Admin tạo nhiều thiệp độc lập.
-- Chạy file này MỘT LẦN trong Supabase SQL Editor.

-- Cho phép chủ tài khoản tạo thêm site_settings mới cho chính mình.
drop policy if exists "owner insert site" on public.site_settings;
create policy "owner insert site"
on public.site_settings
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and lower(owner_email) = lower(coalesce(auth.jwt()->>'email',''))
);

-- Cho phép chủ tài khoản xóa một thiệp do chính mình sở hữu nếu sau này cần.
drop policy if exists "owner delete site" on public.site_settings;
create policy "owner delete site"
on public.site_settings
for delete
to authenticated
using (owner_id = auth.uid());

-- Gắn nhãn quản lý cho thiệp mặc định nếu chưa có.
update public.site_settings
set data = jsonb_set(
  coalesce(data,'{}'::jsonb),
  '{siteLabel}',
  to_jsonb(coalesce(nullif(data->>'siteLabel',''), 'Thiệp chính')),
  true
)
where id = '00000000-0000-0000-0000-000000000001';
