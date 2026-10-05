# Wedding Studio Personal

Thiệp cưới online độc lập cho nhu cầu cá nhân. Frontend chạy trên GitHub Pages; dữ liệu động dùng Supabase project do chính chủ sở hữu.

## Tính năng

- 10 theme: Bạc hà, Oải hương, Hoàng hôn, Thiệp cưới, Hoàng kim, Song hỷ, Tạp chí, Vườn hoa, Đêm sao, Đất nung.
- 10 kiểu mở thiệp: Cổ điển, Quyển sách, Foil lật, Cổng đôi, Cắt laser, Pop-up, Cuộn thư, Song hỷ, Màu nước, Sáp niêm.
- 16 xưng hô khách mời và link riêng từng khách.
- Theo dõi lượt mở, RSVP, số người tham dự, lời nhắn.
- Lời chúc có duyệt.
- Album, khóa website/album bằng mật khẩu băm bcrypt.
- Upload ảnh khách vào bucket Supabase private.
- Nhạc nền, hiệu ứng, đếm ngược, âm lịch, 6 ngôn ngữ.
- Xuất CSV, backup/restore dữ liệu quản trị.

## Kiến trúc bảo mật

Website chỉ phụ thuộc vào:

1. GitHub Pages: HTML/CSS/JavaScript tĩnh.
2. Supabase của bạn: Auth, Postgres, Storage và Edge Function.

Không có PHP, cloudflared, tunnel, binary thực thi, mã obfuscate/eval, analytics hoặc server.

## Thiết lập để kiểm thử

### 1. Tạo Supabase project

Tạo project mới trong Supabase.

### 2. Tạo tài khoản admin

Trong **Authentication → Users**, tạo user email/password cho riêng bạn.

### 3. Chạy schema

Mở `supabase/schema.sql`, thay:

```sql
YOUR_ADMIN_EMAIL@example.com
```

bằng đúng email admin rồi chạy toàn bộ file trong **SQL Editor**.

### 4. Deploy Edge Function

Cài Supabase CLI, đăng nhập rồi chạy từ thư mục repo:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy wedding-api
```

Supabase tự cung cấp `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` cho Edge Function.

### 5. Điền config frontend

Copy `config.example.js` thành `config.js` nếu cần rồi sửa:

```js
window.APP_CONFIG = Object.freeze({
  SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  SITE_ID: "00000000-0000-0000-0000-000000000001",
  API_FUNCTION: "wedding-api"
});
```

Anon/publishable key được phép nằm trong frontend; tuyệt đối không đưa `service_role` key vào GitHub.

### 6. Bật GitHub Pages

Repo → **Settings → Pages → Deploy from a branch → main / root**.

Sau khi Pages hoạt động:

- `index.html`: thiệp khách xem.
- `admin.html`: quản trị.
- `upload.html`: khách gửi ảnh.

## Lưu ý trước khi dùng thật

- Sau khi tạo tài khoản admin, nên tắt public sign-up trong Supabase Auth.
- Đổi `photoUploadCode` trong dữ liệu site thành chuỗi ngẫu nhiên dài.
- Không commit database password, service-role key, PAT hoặc secret khác.
- Xóa EXIF GPS của ảnh trước khi upload nếu cần riêng tư vị trí.
