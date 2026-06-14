# Vibe Market — Nhật ký tiến độ

## Thông tin dự án
- **Framework**: Next.js 16.2.7 (Turbopack) + TypeScript
- **Thư mục**: `C:\Users\HOANG\.gemini\antigravity\scratch`
- **Chạy local**: `npm run dev` → http://localhost:3000

---

## ✅ Đã hoàn thành (cập nhật lần cuối: 04/06/2026)

### Trang & Routes (12/12 build thành công)
| Route | Mô tả |
|---|---|
| `/` | Trang chủ: Hero banner, Flash Sale, Categories, Featured, Seller CTA, Reviews |
| `/products` | Danh sách SP: filter sidebar, sort, search, pagination (6sp/trang) |
| `/products/[id]` | Chi tiết SP: gallery ảnh, chọn màu/size, cart, mua ngay, wishlist, SEO meta |
| `/cart` | Giỏ hàng: nhóm theo shop, coupon VIBE10, tính phí ship |
| `/checkout` | Thanh toán 3 bước: địa chỉ → vận chuyển → payment |
| `/wishlist` | Yêu thích: grid sản phẩm, xóa, thêm vào giỏ |
| `/orders` | Đơn hàng: filter theo trạng thái, nút chat shop, đánh giá, hủy đơn |
| `/shop/[id]` | Trang shop: banner, follow, chat, tabs sản phẩm/review/info |
| `/login` | Đăng nhập / Đăng ký / Mở gian hàng |
| `/seller/dashboard` | Quản lý bán hàng: tổng quan, sản phẩm, đơn hàng, doanh thu, cài đặt |
| `/admin/dashboard` | Admin: KPI, users, shops, sản phẩm, đơn hàng, settings |
| `/_not-found` | Trang 404 có thương hiệu |

### Tính năng hoàn chỉnh
- **Cart Drawer**: ngăn kéo từ phải, tăng/giảm/xóa, progress freeship
- **Chat Widget**: text / hình ảnh / video / audio (ghi âm MediaRecorder), typing indicator, auto-reply
- **Wishlist**: Zustand store + localStorage, badge Navbar
- **Toast notifications**: sonner v2, hiển thị khi add cart / wishlist
- **Search nâng cao**: lọc rating sao, flash sale, giảm giá, kết hợp URL params
- **Pagination**: 6 sản phẩm/trang
- **Responsive CSS**: breakpoints 1024px + 640px cho tất cả grid chính
- **SEO động**: generateMetadata cho `/products/[id]`
- **Fix build errors**: icon lucide brand, recharts type, duplicate style key

### Stores (Zustand)
| Store | File |
|---|---|
| Cart | `lib/store/cart-store.ts` |
| Wishlist | `lib/store/wishlist-store.ts` |
| Chat | `lib/store/chat-store.ts` |

---

## ❌ Việc cần làm tiếp theo

### 🔴 Ưu tiên 1 — Backend (chặn production)
- [x] **Supabase** — project đã tạo, schema + seed đã chạy, kết nối OK (12 sp).
- [x] **Giai đoạn 2a — Catalog đọc DB thật** (`lib/supabase/queries.ts`):
      trang chủ, `/products`, `/products/[id]`, `/shop/[id]` đã đọc Supabase.
- [x] **Giai đoạn 2b — Auth thực** — đăng ký/đăng nhập/đăng xuất qua Supabase Auth
- [x] **Giai đoạn 2c — Đồng bộ user data** (HOÀN TẤT):
      - [x] Orders: checkout tạo đơn thật, `/orders` đọc đơn của mình (RLS)
      - [x] Wishlist: write-through DB + hydrate khi đăng nhập, merge giỏ khách
      - [x] Chat realtime: conversations/messages lưu DB, media lên Storage,
            Supabase Realtime, auto-reply lưu DB
- [ ] **Payment gateway** — VNPay / MoMo / Stripe (chỉ còn đây là backend lớn)

> ✅ **GIAI ĐOẠN 2 (Backend) HOÀN TẤT 13/06/2026** — toàn bộ catalog/auth/orders/
> wishlist/chat đã chạy trên Supabase thật.

> **Giai đoạn 1 (xong, 13/06/2026):** Cài `@supabase/*`, `proxy.ts` (Next 16 thay
> `middleware.ts`), client helper browser/server, schema.sql (10 bảng + RLS +
> trigger auto-profile + realtime), seed.sql.
>
> **Giai đoạn 2a (xong, 13/06/2026):** `lib/supabase/queries.ts` (DAL, map
> snake_case→camelCase, React `cache()` dedupe). Tách Server Component (fetch DB)
> + Client Component (UI giữ nguyên): `HomeClient`, `ProductsClient`,
> `ProductDetailClient`, `ShopClient`. Các trang catalog giờ là **dynamic (ƒ)**.
> Build xanh, smoke test runtime OK — dữ liệu thật render, proxy refresh session,
> không lỗi. `mock-data.ts` vẫn giữ (interface + formatPrice/formatNumber +
> dữ liệu cho cart/orders/wishlist chưa nối DB).
>
> **Giai đoạn 2b (xong, 13/06/2026):** Auth thật qua Supabase. `lib/supabase/
> use-user.ts` (hook `useUser` + `signOutUser`, dùng browser client +
> onAuthStateChange). `/login` wire signUp/signInWithPassword (lỗi dịch sang
> tiếng Việt, xử lý email-confirm). Navbar hiện tên/avatar user thật + đăng xuất.
> Verified end-to-end: trigger auto-tạo profile khi đăng ký, login trả token.
> Fix hydration mismatch: thay `toLocaleString()` (phụ thuộc locale) bằng
> `formatCount()` cố định trong HomeClient + Navbar.
>
> **Giai đoạn 2c — Orders + Wishlist (xong, 13/06/2026):**
> - `app/actions/orders.ts` — Server Action `createOrder` (tính tổng phía server,
>   kiểm tra auth). Checkout wire vào: gate đăng nhập, tạo đơn thật, mã đơn thật,
>   guard giỏ trống + `mounted` (tránh hydration). `getMyOrders()` trong DAL.
>   `/orders` → Server Component, tách `OrdersClient` (đọc đơn của mình qua RLS,
>   trạng thái chưa-đăng-nhập).
> - Wishlist: `wishlist-store.ts` write-through DB (add/remove/clear) + `loadFromDb`
>   + `mergeLocalToDb`. `WishlistSync` (mount trong ConditionalLayout) hydrate khi
>   đăng nhập, merge wishlist khách, xoá local khi đăng xuất.
> - **Fix type quan trọng:** `lib/supabase/types.ts` thiếu khóa `Relationships`
>   trên mỗi bảng → postgrest-js 2.108 coi mọi bảng là `never` (insert/update lỗi).
>   Đã thêm `Relationships: []` cho cả 10 bảng.
> - Verified end-to-end bằng token user thật: tạo đơn + order_items + đọc đơn của
>   mình + wishlist add/read + RLS cách ly. Build xanh, smoke test pages OK.
>
> **Giai đoạn 2c — Chat realtime (xong, 13/06/2026):**
> - Storage bucket `chat-media` (public, đã tạo qua service API). Upload qua
>   Server Action `app/actions/chat.ts` (admin client, không cần RLS storage,
>   kiểm tra auth). `next.config.ts`: `serverActions.bodySizeLimit: '12mb'`.
> - `chat-store.ts` rework hẳn sang DB: openChat tạo/tìm conversation, loadMessages,
>   sendMessage insert DB (upload media trước nếu là data-URL), auto-reply lưu DB,
>   `subscribe()` lắng nghe Supabase Realtime (`postgres_changes` INSERT messages),
>   `addIncoming` dedup giữa optimistic + realtime. Chat **yêu cầu đăng nhập**
>   (conversations.buyer_id = user) — chưa đăng nhập thì redirect /login.
> - `ChatWidget.tsx`: load conversations + subscribe khi đăng nhập, reset khi
>   đăng xuất; ghi âm đổi sang data-URL để upload được.
> - Verified token user thật: tạo conv + tin buyer/shop + đọc (RLS) + join shops +
>   Storage upload(200)/public read(200). Build xanh, pages render OK.
> - **Lưu ý:** auto-reply do client buyer insert (sender='shop') — phía shop là
>   mô phỏng; chat 2 chiều thật cần tài khoản seller (giai đoạn sau).
>
> **Trang còn thiếu (xong, 14/06/2026):**
> - `/forgot-password` (resetPasswordForEmail) + `/reset-password` (updateUser) +
>   `app/auth/callback/route.ts` (exchangeCodeForSession — chuẩn PKCE @supabase/ssr).
>   Login "Quên mật khẩu?" → `/forgot-password`.
>   *Cần allowlist redirect URL trong Supabase (Authentication → URL Configuration)
>   nếu test trên domain khác localhost.*
> - `/profile`: sửa tên/SĐT (RLS update own), upload avatar (`app/actions/profile.ts`
>   → bucket chat-media/avatars), đổi mật khẩu (updateUser). Navbar thêm link.
> - Review form ở `ProductDetailClient` (insert reviews RLS own, hiện ngay optimistic).
> - Verified token user thật: review insert+đọc công khai, profile update, avatar
>   storage upload/read. Build xanh 16 routes.
>
> **Seller — Nền tảng + Quản lý shop (xong code, 14/06/2026):**
> - `supabase/seller.sql` (migration, **người dùng phải chạy**): cập nhật trigger
>   `handle_new_user` set role từ metadata + tạo shop khi role='seller'; RLS owner
>   cho shops (insert/update) + products (insert/update/delete); RLS chat 2 chiều
>   cho conversations/messages (buyer HOẶC chủ shop) — sẵn cho UI chat seller turn sau.
> - `app/actions/seller.ts`: createProduct/updateProduct/deleteProduct/updateShop
>   (verify chủ shop, id sản phẩm `p-xxxxxxxx`, giá gốc→original_price, KM→price).
> - `app/seller/dashboard/page.tsx` rewrite: gate theo role=seller + có shop; đọc
>   shop & sản phẩm thật; CRUD sản phẩm (modal add/edit, upload ảnh qua uploadChatMedia,
>   xóa); lưu thông tin shop thật. Tab Đơn hàng/Doanh thu vẫn demo (đánh dấu rõ).
> - Build xanh, pages render OK. **Chưa verify runtime** vì chờ user chạy seller.sql.
> - Lưu ý: user đăng ký "seller" TRƯỚC migration vẫn là role=buyer, không có shop —
>   cần đăng ký lại sau khi chạy migration.
>
> **Seller — Chat 2 chiều + dashboard thật (xong, 14/06/2026):**
> - `chat-store.ts`: thêm `hasOwner` cho conversation → shop có chủ TẮT auto-reply
>   mô phỏng (để seller trả lời thật), shop seed (không chủ) vẫn auto-reply demo.
> - `app/seller/dashboard/SellerChat.tsx`: UI chat seller (danh sách hội thoại +
>   khung chat + trả lời text + realtime postgres_changes + hiện ảnh/audio/video).
>   Khách hiển thị "Khách #xxxx" (RLS profiles không cho seller đọc tên buyer).
> - `seller.ts` `getShopOrders`: admin client lấy order_items có product của shop +
>   join orders, gộp theo đơn, tính doanh thu phần shop + thống kê 6 tháng.
> - Dashboard: tab Tin nhắn, tab Đơn hàng + Doanh thu + overview dùng dữ liệu thật.
> - Fix bug modal lệch (framer-motion ghi đè transform → bọc flex-center).
> - Verified token thật: seller đọc/trả lời hội thoại khách (chat 2 chiều), cách ly
>   RLS, getShopOrders trả đúng đơn. Build xanh 16 routes.
>
> **Trang phụ + trạng thái đơn (xong, 14/06/2026):**
> - `supabase/extras.sql`: bảng `addresses` + `notifications` + RLS (all own /
>   read+update own). Realtime bật cho notifications.
> - `/profile/address`: CRUD sổ địa chỉ (đặt mặc định bỏ mặc định cũ), link từ /profile.
> - `/notifications`: list + mark read/all + click→link; Navbar chuông hiện badge
>   số chưa đọc (count head query).
> - `seller.ts` `updateOrderStatus`: admin đổi status + chèn notification cho buyer;
>   dashboard tab Đơn hàng có nút Xác nhận/Giao/Đã giao/Hủy (map nextActions).
> - `orders.ts` createOrder: best-effort chèn notification cho buyer + chủ shop.
> - Notifications insert luôn qua admin (service role); user chỉ read/update own.
> - Verified token thật: address CRUD+cách ly, notif insert/read/mark-read+cách ly,
>   đổi trạng thái đơn → thông báo khách. Build xanh 18 routes.
>
> ### Bucket Storage
> `chat-media` (public) đã tạo. Nếu dựng project Supabase mới, cần tạo lại bucket
> này (Dashboard → Storage → New bucket → tên `chat-media`, bật Public).

### 🟠 Ưu tiên 2 — Trang còn thiếu
- [x] `/profile` — Trang cá nhân (avatar upload, sửa tên/SĐT, đổi mật khẩu)
- [x] `/forgot-password` + `/reset-password` — quên/đặt lại mật khẩu (+ `/auth/callback`)
- [x] Viết đánh giá sản phẩm (form submit ở trang chi tiết, lưu DB)
- [x] `/profile/address` — Sổ địa chỉ (CRUD + mặc định, RLS own)
- [x] `/notifications` — Trung tâm thông báo (mark read, Navbar badge) + sinh thông báo tự động
- [x] Cập nhật trạng thái đơn (seller bấm Xác nhận/Giao/Đã giao → thông báo khách)
- [x] **Seller thật** (HOÀN TẤT — cần đã chạy `supabase/seller.sql`):
      - [x] Tài khoản seller + sở hữu shop (trigger tạo shop khi đăng ký seller)
      - [x] Quản lý shop: CRUD sản phẩm + sửa thông tin gian hàng (dashboard thật)
      - [x] Chat 2 chiều: seller đọc + trả lời hội thoại khách (realtime)
      - [x] Dashboard đơn hàng/doanh thu dữ liệu thật (getShopOrders)

### 🟡 Ưu tiên 3 — UX & Performance
- [ ] Skeleton loading (CSS đã có, chưa dùng)
- [ ] Chuyển `<img>` → `<Image>` của Next.js
- [ ] Test responsive thực tế trên mobile
- [ ] Bottom navigation bar mobile
- [ ] generateMetadata cho tất cả trang còn lại
- [ ] sitemap.xml + robots.txt

### 🟢 Ưu tiên 4 — Infrastructure
- [ ] Deploy lên Vercel
- [ ] `.env.local` setup
- [ ] Error monitoring (Sentry)
- [ ] Analytics (GA4)

---

## Lộ trình đề xuất

```
Tuần 1-2: Supabase setup → auth + database → thay mock-data
Tuần 3:   Payment gateway (VNPay)
Tuần 4:   Trang profile, notifications, reviews
Tuần 5:   Polish responsive, SEO, performance
Tuần 6:   Deploy Vercel + domain
```

---

## Ghi chú kỹ thuật

### Breaking changes đã fix
- `lucide-react` 1.17 — không có icon thương hiệu (Facebook/Instagram/Youtube/Twitter)
  → Dùng: `MessageCircle`, `Camera`, `Play`, `Send` thay thế
- `recharts` v3 — Tooltip `formatter` type thay đổi
  → Dùng `(v) => formatPrice(Number(v))` thay vì `(v: number) => ...`
- Next.js 16 — `generateMetadata` không thể đứng chung file với `'use client'`
  → Tách Server Component (`page.tsx`) + Client Component (`ProductDetailClient.tsx`)
- Next.js 16 — `useSearchParams` cần bọc trong `<Suspense>`

### Cấu trúc quan trọng
```
app/
  products/[id]/
    page.tsx              ← Server Component (generateMetadata)
    ProductDetailClient.tsx ← Client Component (UI)
components/
  cart/CartDrawer.tsx     ← Global cart slide-in
  chat/ChatWidget.tsx     ← Global chat widget
  layout/ConditionalLayout.tsx ← Mount Cart + Chat + Toaster
lib/store/
  cart-store.ts
  wishlist-store.ts
  chat-store.ts
```
