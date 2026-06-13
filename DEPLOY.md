# Deploy Vibe Market lên Vercel

Code đã được commit sạch (`.env.local` KHÔNG bị commit). Làm theo các bước dưới.
`gh` và `vercel` CLI chưa cài trên máy → dùng **luồng GitHub + Vercel web** (khuyến nghị).

---

## Bước 1 — Đưa code lên GitHub

1. Tạo repo rỗng tại https://github.com/new (vd tên `vibe-market`, **KHÔNG** thêm README).
2. Trong thư mục dự án, chạy (thay `<user>`):

```bash
git remote add origin https://github.com/<user>/vibe-market.git
git branch -M main          # đổi master → main (Vercel mặc định deploy nhánh production)
git push -u origin main
```

> Nếu chưa đăng nhập git: GitHub yêu cầu Personal Access Token thay mật khẩu khi push.

## Bước 2 — Import vào Vercel

1. https://vercel.com → **Add New… → Project** → chọn repo `vibe-market`.
2. Framework: **Next.js** (tự nhận diện). Build command / Output: để mặc định.
3. **TRƯỚC khi bấm Deploy**, mở mục **Environment Variables**, thêm 3 biến
   (copy **giá trị** từ file `.env.local` của bạn — đừng gõ tay):

   | Name | Lấy từ `.env.local` | Ghi chú |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | dòng cùng tên | công khai |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dòng cùng tên | công khai |
   | `SUPABASE_SERVICE_ROLE_KEY` | dòng cùng tên | **BÍ MẬT** — chỉ server |

   Đặt cho cả 3 môi trường (Production / Preview / Development).
4. Bấm **Deploy**. Vài phút sau có URL `*.vercel.app`.

## Bước 3 — Gắn tên miền của bạn

1. Vercel → Project → **Settings → Domains → Add** → nhập tên miền.
2. Vercel hiện bản ghi DNS cần thêm. Vào nhà cung cấp tên miền cấu hình:
   - Domain gốc `vibemarket.com` → bản ghi **A** trỏ `76.76.21.21`
   - hoặc subdomain `www` → **CNAME** trỏ `cname.vercel-dns.com`
   (làm theo đúng giá trị Vercel hiển thị — có thể khác).
3. Đợi DNS lan truyền (vài phút–vài giờ). Vercel tự cấp **SSL/HTTPS** miễn phí.

## Bước 4 — Cập nhật Supabase cho domain production (QUAN TRỌNG)

Nếu bỏ qua bước này, đăng nhập / đặt lại mật khẩu trên domain thật sẽ lỗi.

Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://<tên-miền-của-bạn>`
- **Redirect URLs**: thêm `https://<tên-miền-của-bạn>/**`
  (giữ luôn `http://localhost:3000/**` để vẫn dev được)

---

## Sau khi deploy
- Mỗi lần `git push` lên `main` → Vercel **tự deploy lại** (CI/CD).
- Xem log build/lỗi tại Vercel → Deployments.

## Lưu ý kỹ thuật
- **Upload media chat/avatar > ~4.5MB có thể lỗi trên Vercel**: Server Action chạy
  serverless, giới hạn body ~4.5MB (dù `next.config.ts` đặt 12mb). Ảnh/audio thường
  nhỏ nên ổn; video lớn thì sau này nên chuyển sang upload trực tiếp browser → Storage.
- Bucket Storage `chat-media` đã có sẵn (public). Không cần làm gì thêm.
- `proxy.ts` (refresh session) chạy trên Node runtime của Vercel — bình thường.
