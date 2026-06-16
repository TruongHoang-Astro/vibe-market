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

> ✅ **Responsive mobile (xong, 14/06/2026):** Fix toàn site ở 375px (verified
> bằng preview, overflow=0 mọi trang). Navbar gom danh mục/tìm/tài khoản vào
> hamburger drawer. Footer + lưới sản phẩm dùng `minmax(0,1fr)` (chống phình
> min-content). Seller & Admin dashboard: sidebar → drawer (hamburger + backdrop),
> lưới stats/charts/bảng responsive, `min-width:0` chống flex blowout. SellerChat
> mobile hiện 1 pane + nút back. Rule responsive gom trong `globals.css`.
>
> ⏳ **Admin dashboard:** đã responsive nhưng VẪN DÙNG MOCK DATA — cần wire DB thật
> (KPI từ orders/users/shops, quản lý shop/sản phẩm/đơn) — việc kế tiếp.

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
- [x] **Payment gateway** — VNPay (HMAC-SHA512) + cổng giả lập fallback; ship phí server-side. Xem "GIAI ĐOẠN SCALE → 6)".

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

## 🚀 GIAI ĐOẠN SCALE (16/06/2026) — code xong, chờ chạy migration

> 4 hạng mục Scale đã code xong + **build xanh 18 routes** + smoke test runtime OK
> (search fallback ilike chạy đúng, admin gate chặn đúng, product detail + report render).
> Tất cả **resilient**: code không vỡ nếu chưa chạy migration (tự fallback).

### ⚠️ Migration cần chạy (Supabase → SQL Editor → Run), theo thứ tự:
1. `supabase/search.sql` — full-text (unaccent + tsvector + GIN). Chưa chạy → tìm kiếm tự fallback ilike.
2. `supabase/shop_custom.sql` — cột theme/announcement + 3 chính sách cho shops.
3. `supabase/admin.sql` — `profiles.status`, `is_admin()`, bảng `reports`, RLS admin.
   **Sau đó cấp quyền admin:** `update public.profiles set role='admin' where id='<uuid>';`
4. `supabase/realdata.sql` — **REAL-DATA HÓA**: trigger tự tính `sold`/`stock`/`rating`/`reviews`/shop-stats
   + bảng `shop_follows` + **BACKFILL reset số seed về số THẬT** (đa số SP về 0 đánh giá/0 đã bán — đúng dữ liệu thật).

### 1) Search + Advanced filter (full-text)
- `search.sql`: cột `search_vector` (generated, unaccent) + GIN index.
- `lib/supabase/queries.ts` → `searchProducts(q, opts)`: `.textSearch('search_vector', 'q:*', {config:'simple'})`,
  bỏ dấu tiếng Việt + prefix; **fallback ilike** nếu chưa chạy migration. Hỗ trợ lọc category/giá/rating/sort.
- `app/products/page.tsx`: có `?search=` → server full-text; bộ lọc nâng cao client giữ nguyên
  (ô tìm trong trang thành "lọc trong kết quả"). `searchTerm` truyền xuống ProductsClient.
- `app/actions/search.ts` → `searchSuggestions(q)`; Navbar có **autocomplete** (debounce 250ms,
  ảnh+tên+giá, "Xem tất cả kết quả").

### 2) Seller policies + Shop customization
- `shop_custom.sql`: `theme_color`, `announcement`, `return_policy`, `shipping_policy`, `warranty_policy`.
- `app/actions/seller.ts` `updateShop` + `ShopInput` nhận thêm 5 cột (chỉ patch khi !== undefined).
- Seller dashboard → tab Cài đặt: card "Tùy chỉnh gian hàng" (8 swatch + color picker + announcement)
  + card "Chính sách bán hàng" (3 textarea). `lib/data/mock-data.ts` Shop thêm field optional; `mapShop` map (resilient).
- `app/shop/ShopClient.tsx`: banner announcement (màu theme), tab/nút Follow theo theme, tab Thông tin có card Chính sách.

### 3) Moderation + Admin real data
- `app/actions/admin.ts`: `requireAdmin()` (chặn non-admin) + `getAdminDashboard()` (1 lần nạp:
  overview KPI thật, users/shops/products/orders/reports). Kiểm duyệt: `setUserStatus` (khóa/mở),
  `setUserRole`, `setShopVerified` (duyệt/gỡ + báo chủ shop), `deleteShop`, `adminDeleteProduct`,
  `adminDeleteReview`, `resolveReport`.
- `app/admin/dashboard/page.tsx` → Server Component gate (Denied nếu unauth/forbidden) → `AdminDashboardClient.tsx`
  (UI cũ rewired dữ liệu thật + nút kiểm duyệt + tab **Kiểm duyệt** = hàng đợi reports). KPI/charts/GMV theo danh mục đều thật.
- `app/actions/report.ts` + nút "Báo cáo" ở trang sản phẩm → đẩy vào hàng đợi admin.

### 4) Notifications (email/SMS)
- `lib/notify.ts`: `sendEmail` (Resend HTTP), `sendSms` (Twilio HTTP), `createNotification(admin, n)`
  = in-app + email/SMS best-effort. **No-op nếu chưa cấu hình env** (RESEND_API_KEY/TWILIO_*).
- `orders.ts` + `seller.ts` chuyển sang `createNotification` (đơn mới / đổi trạng thái → email tự động).
- `.env.example`: thêm `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `NOTIFY_EMAIL_FROM`, `TWILIO_*` (tất cả tuỳ chọn).

### 5) Real-data hóa toàn bộ (16/06/2026) — chính sách: tính thuần từ DB (reset seed)
- `realdata.sql`: trigger `reviews→products.rating/reviews`, `order_items→products.sold/stock`,
  `products→shops.rating/products`, `shop_follows→shops.followers`; **backfill** reset seed về số thật.
- **Sao/đã bán/tồn kho/số đánh giá** giờ tự cập nhật theo hoạt động thật (review mới, đặt hàng).
- **Trang shop** (`/shop/[id]`): đánh giá thật từ sản phẩm của shop ([getShopReviews]); bỏ 2 review hardcoded;
  rating + tổng đánh giá thật. **Theo dõi shop** lưu DB thật ([app/actions/shop.ts] + `shop_follows`), followers thật.
- **Navbar** dropdown danh mục: đọc bảng `categories` thật (trước đây hardcoded).
- **Bỏ tra cứu mock**: cart dùng `shopName` của item; orders gắn shop info thật qua `getMyOrders`;
  wishlist lấy `shop_id` thật từ DB khi thêm giỏ.
- **Seller dashboard**: thẻ "Lượt xem (demo)" → "Đánh giá shop" (số thật). **Home Testimonials**: chỉ review thật (ẩn nếu trống).
- ProductDetailClient: `router.refresh()` sau khi gửi đánh giá để cập nhật rating tổng hợp.
- **Còn tĩnh (chấp nhận — là copy/marketing, không phải data)**: hero slides + dòng "2M+ đánh giá" ở home;
  phương thức ship/thanh toán ở checkout (chờ payment gateway thật).
- Build xanh 18 routes; smoke test: shop hiện "Đánh giá (1)" thật (không còn tên giả), navbar/home danh mục DB, không lỗi runtime.

### 6) Vận chuyển + Thanh toán (16/06/2026) — backend lớn cuối cùng ✅
- `supabase/payment.sql`: thêm cột orders `shipping_method`, `shipping_fee`, `payment_provider`,
  `payment_status`, `paid_at`, `payment_ref`. **Code resilient** (createOrder + getMyOrders tự fallback nếu chưa migrate).
- **Vận chuyển**: `lib/shipping.ts` (3 phương thức + `computeShippingFee` — **freeship tiêu chuẩn từ 299k**).
  Phí ship **tính lại phía server** trong `createOrder` (không tin client). Checkout hiện ETA + phí thật.
- **Thanh toán**:
  - COD → đơn `payment_status='unpaid'`.
  - Online (VNPay) → `lib/payments/vnpay.ts` (HMAC-SHA512 chuẩn 2.1.0): `buildVnpayUrl` + `verifyVnpayReturn`.
    `app/actions/payment.ts` `initiatePayment` → URL VNPay thật (nếu cấu hình env) **hoặc cổng giả lập**
    `/checkout/pay/[orderId]` (demo được ngay). Route `app/api/payment/vnpay/return` xác minh chữ ký → cập nhật đơn.
  - Trang đơn (`/orders`): badge trạng thái thanh toán + nút **Thanh toán** lại cho đơn online pending/failed + toast `?paid/?failed`.
- Bỏ form thẻ giả + momo/zalopay/bank mô phỏng ở checkout (chỉ COD + VNPay).
- `.env.example`: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL` (tuỳ chọn — trống thì dùng cổng giả lập).
- Build xanh 19 routes; smoke test: checkout hiện ship 30k/60k/100k + COD/VNPay, tổng 280k đúng (server-computed); cổng giả lập render OK.

### 7) Sổ địa chỉ verify + chọn nhanh khi checkout (16/06/2026)
- `supabase/address.sql`: thêm cột `addresses.ward` (Phường/Xã). Code resilient (saveAddress fallback nếu chưa migrate).
- **Verify địa chỉ thật**: `lib/vn-address.ts` đọc dữ liệu hành chính VN chính thức (provinces.open-api.vn — 63 tỉnh,
  có CORS). `components/address/AddressForm.tsx` (tái dùng): cascading **Tỉnh → Huyện → Xã** (chỉ chọn được đơn vị
  có thật) + validate SĐT di động VN + số nhà/đường. Tự **fallback nhập tay** nếu API không truy cập được.
- `lib/save-address.ts`: lưu địa chỉ (client, RLS own) resilient (bỏ `ward` nếu cột chưa tồn tại).
- **Sổ địa chỉ** `/profile/address`: dùng AddressForm (verify) + hiện Phường/Xã.
- **Checkout** giữ bước "Địa chỉ giao hàng" nhưng **chọn nhanh** 1 trong các địa chỉ đã lưu (radio card, mặc định
  được chọn sẵn) — không cần nhập tay mỗi lần. "Giao đến địa chỉ khác" → AddressForm (lưu vào sổ + tự sang bước ship).
  Chưa đăng nhập → nhắc đăng nhập. Đơn lưu địa chỉ đầy đủ (người nhận + SĐT + Phường/Xã) qua `formatFullAddress`.
- Build xanh 19 routes; smoke test: dataset API 63 tỉnh OK, checkout step 0 hiện picker (login-gated) + link "Quản lý sổ địa chỉ".

### 8) NOW-1: Hủy đơn + Đánh giá + Trả hàng (16/06/2026)
- `supabase/orders_lifecycle.sql`: trigger **hủy đơn → hoàn kho + giảm sold**; bảng `return_requests` + RLS (buyer own).
- **Hủy đơn**: `cancelOrder` (orders.ts) — buyer hủy khi pending/confirmed (admin update + notify shop); nút đã wire ở /orders.
- **Đánh giá từ trang đơn**: nút "Đánh giá" mở modal chấm sao + nhận xét từng SP trong đơn (insert reviews → trigger cập nhật rating).
- **Trả hàng/Hoàn tiền**: `app/actions/returns.ts` (createReturnRequest + getShopReturns + resolveReturn). Buyer gửi yêu cầu
  (lý do + chi tiết + ảnh) ở /orders; badge trạng thái trên đơn. Seller có **tab "Trả hàng"** duyệt/từ chối (duyệt → đơn cancelled
  + hoàn kho + notify buyer). Resilient (payment_status refunded best-effort).
- Build xanh 19 routes; smoke test /orders render OK.

### 9) NOW-2: Voucher thật (16/06/2026)
- `supabase/voucher.sql`: bảng `vouchers` (percent/fixed, trần giảm, đơn tối thiểu, shop_id null=sàn, usage_limit,
  used_count, hạn dùng) + cột orders `voucher_code`/`discount` + seed VIBE10 & FREESHIP50. RLS: đọc công khai, seller quản lý voucher shop mình.
- `app/actions/voucher.ts` `validateVoucher(code, subtotal, shopIds)` — kiểm tra hạn/lượt/ngưỡng/scope, tính giảm (server-side).
- `createOrder`: **re-validate phía server** (không tin client), áp giảm vào total, lưu `voucher_code`/`discount`, tăng `used_count`.
- Cart store thêm `voucherCode` (persist). Cart: ô mã wire `validateVoucher` thật (bỏ VIBE10 hardcode 10% cũ), nút "Bỏ" gỡ mã.
  Checkout: đọc voucher từ giỏ, re-validate, hiện dòng giảm giá, truyền vào đơn.
- Code resilient (orders insert fallback nếu chưa chạy voucher.sql; validateVoucher báo "Mã không tồn tại" nếu bảng chưa có).
- Build xanh 19 routes; smoke test cart hiện ô mã + gợi ý VIBE10/FREESHIP50, không lỗi.

### 10) NOW-3: Biến thể sản phẩm / phân loại hàng (16/06/2026) — HOÀN TẤT NOW
- `supabase/variants.sql`: bảng `product_variants` (name/price/stock riêng) + RLS owner; `order_items.variant_id`;
  trigger trừ tồn kho biến thể khi đặt + hoàn khi hủy.
- Seller: modal sản phẩm thêm section **"Phân loại hàng"** (rows name/price/stock). createProduct/updateProduct lưu biến thể;
  khi có biến thể → product.price = thấp nhất, stock = tổng (badge tự tính). updateProduct đồng bộ xóa+thêm.
- `getProductById` nạp variants (resilient). Trang SP: **bộ chọn Phân loại** (giá theo biến thể, ẩn biến thể hết hàng);
  giá hiển thị/tiết kiệm/tồn kho/nút mua theo biến thể đang chọn.
- cart-store thêm `variantId`/`variantName` (id giỏ phân biệt theo biến thể); cart + drawer hiện "Phân loại".
  createOrder lưu `variant_id` + tên item kèm phân loại (resilient fallback nếu chưa migrate).
- Build xanh 19 routes; smoke test: SP không biến thể chạy như cũ (resilient), không lỗi runtime.

**✅ NOW tier (gap Shopee ưu tiên 1) HOÀN TẤT**: hủy đơn+đánh giá+trả hàng, voucher thật, biến thể SP.

### 11) NEXT-1: Flash Sale đếm ngược thật + quota (16/06/2026)
- `supabase/flashsale.sql`: `products.flash_sale_end` (+ set 8h cho SP flash seed). Resilient (DAL gắn flash_sale_end qua query phụ).
- Home: **đếm ngược thật** tới `flash_sale_end` gần nhất ("Kết thúc sau HH:MM:SS" / "Đang diễn ra" / "Đã kết thúc");
  thanh **"đã bán X%"** = sold/(sold+stock) (cạn kho), bỏ công thức giả cũ.
- Seller: modal SP thêm bật **Flash Sale** + chọn thời điểm kết thúc; createProduct/updateProduct set is_flash_sale/flash_sale_price/flash_sale_end (resilient).
- Build xanh 19 routes; smoke test home flash hiện "Đang diễn ra" (chưa migrate) + progress bar, không lỗi.

### 12) NEXT-2: Hỏi & Đáp sản phẩm (16/06/2026)
- `supabase/qa.sql`: bảng `product_questions` (question/answer/answered_at) + RLS (đọc công khai, đặt câu hỏi own; seller trả lời qua server action).
- `app/actions/qa.ts`: `askQuestion` (buyer, notify shop) + `answerQuestion` (verify chủ shop, notify người hỏi).
- `getProductQuestions` (DAL, resilient → [] nếu chưa migrate). Trang SP có mục **Hỏi & Đáp**: ô đặt câu hỏi + list;
  chủ shop thấy ô **Trả lời** ngay dưới câu chưa đáp (page tính `isShopOwner`).
- Build xanh 19 routes; smoke test SP hiện mục Hỏi & Đáp + empty state (chưa migrate → log resilient, không vỡ).

### 13) NEXT-3: Timeline theo dõi đơn hàng (16/06/2026)
- `supabase/tracking.sql`: bảng `order_status_history` + trigger ghi lịch sử khi tạo đơn / đổi trạng thái + backfill đơn cũ. RLS đọc đơn của mình.
- `getMyOrders` gắn `tracking[]` (resilient). `/orders`: nút **"Theo dõi đơn hàng"** mở timeline (chấm tròn + nhãn trạng thái + mốc thời gian).
- Build xanh 19 routes.

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
