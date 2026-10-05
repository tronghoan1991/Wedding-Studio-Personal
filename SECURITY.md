# Security

- Không có `eval`, mã tự giải mã, PHP, tunnel hoặc executable.
- Admin xác thực bằng Supabase Auth.
- RLS giới hạn bảng quản trị theo `auth.uid()`.
- Edge Function dùng service role ở phía server; key này không xuất hiện trong source frontend.
- Ảnh khách ở bucket `guest-photos` private; frontend chỉ nhận signed upload URL và admin nhận signed read URL.
- Mật khẩu website/album được băm bằng bcrypt/pgcrypto trong database.
- Public API giới hạn độ dài input và MIME/size ảnh.
- Hãy tắt public sign-up sau khi tạo admin và giữ anon key/service role đúng vai trò.
