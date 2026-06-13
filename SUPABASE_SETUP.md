# Hướng dẫn kết nối Supabase — Vibe Market

Phần code đã được dựng sẵn (client, server, proxy, schema, seed). Bạn chỉ cần
làm 4 bước dưới đây để có database + auth thật.

---

## Bước 1 — Tạo project Supabase (miễn phí)

1. Vào https://supabase.com → **Start your project** → đăng nhập bằng GitHub/Google.
2. Bấm **New project**:
   - **Name**: `vibe-market`
   - **Database Password**: đặt mật khẩu mạnh và **lưu lại** (cần khi kết nối trực tiếp DB).
   - **Region**: chọn **Southeast Asia (Singapore)** cho gần Việt Nam.
3. Đợi ~2 phút để project khởi tạo.

## Bước 2 — Lấy API keys và điền vào `.env.local`

1. Trong project: **Project Settings** (bánh răng) → **API**.
2. Copy 3 giá trị vào file `.env.local` (đã tạo sẵn ở gốc dự án):

   | Trong Dashboard | Biến trong `.env.local` |
   |---|---|
   | **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
   | **anon / publishable key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | **service_role / secret key** | `SUPABASE_SERVICE_ROLE_KEY` |

   > `service_role` là khóa bí mật — chỉ dùng phía server, không bao giờ commit lên git.

3. Lưu file, sau đó **khởi động lại** `npm run dev` (Next.js chỉ đọc env lúc khởi động).

## Bước 3 — Tạo bảng và dữ liệu mẫu

1. Trong project: **SQL Editor** → **New query**.
2. Mở file `supabase/schema.sql`, copy toàn bộ, dán vào, bấm **Run**.
   → Tạo toàn bộ bảng, RLS, trigger, bật realtime cho chat.
3. Tạo query mới, mở `supabase/seed.sql`, copy toàn bộ, dán vào, bấm **Run**.
   → Nạp 8 danh mục, 3 shop, 12 sản phẩm, vài đánh giá.
4. Kiểm tra: **Table Editor** → thấy bảng `products` có 12 dòng là thành công.

## Bước 4 — Cấu hình Auth (cho đăng nhập email)

1. **Authentication** → **Providers** → **Email**: để bật (mặc định đã bật).
2. Khi đang dev, nên tắt xác nhận email cho nhanh:
   **Authentication** → **Sign In / Up** (hoặc **Providers → Email**) →
   tắt **Confirm email** → Save. (Khi lên production thì bật lại.)
3. (Tùy chọn) Bật đăng nhập Google ở mục Providers nếu muốn.

---

## Sau khi xong 4 bước

Báo lại để mình làm **Giai đoạn 2**: nối code vào Supabase, gồm
- `lib/supabase/queries.ts` — hàm đọc sản phẩm/shop/đánh giá từ DB
- Trang chủ, /products, /products/[id], /shop/[id] đọc dữ liệu thật thay mock-data
- Auth thật ở /login (đăng ký, đăng nhập, đăng xuất) + bảo vệ route bằng `proxy.ts`
- Wishlist, Orders, Chat đồng bộ lên DB (realtime)

---

## Ghi chú kỹ thuật (Next.js 16)

- **`proxy.ts`** ở gốc dự án thay cho `middleware.ts` — Next.js 16 đã đổi tên.
  Đây là nơi refresh session Supabase mỗi request. Hướng dẫn Supabase chính thức
  vẫn ghi "tạo middleware.ts" — với bản này phải đặt tên `proxy.ts`, nếu không sẽ
  **không chạy** mà cũng không báo lỗi.
- `cookies()` trong Next.js 16 là **async** → `lib/supabase/server.ts` dùng `await cookies()`.
- File đã tạo:
  ```
  .env.local                       ← điền 3 keys ở đây
  .env.example                     ← mẫu tham khảo
  proxy.ts                         ← refresh session (gốc dự án)
  lib/supabase/client.ts           ← client cho Client Components
  lib/supabase/server.ts           ← client cho Server Components + admin client
  lib/supabase/proxy-session.ts    ← helper updateSession dùng trong proxy.ts
  lib/supabase/types.ts            ← kiểu Database (TypeScript)
  supabase/schema.sql              ← tạo bảng + RLS + trigger + realtime
  supabase/seed.sql                ← dữ liệu mẫu
  ```
