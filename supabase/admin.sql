-- ============================================================
-- Vibe Market — Migration: Admin dữ liệu thật + Kiểm duyệt (moderation)
-- Chạy SAU schema.sql + seller.sql + extras.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
--
-- ⚠️ Sau khi chạy, cấp quyền admin cho 1 tài khoản:
--    update public.profiles set role = 'admin' where id = '<user-uuid>';
--    (lấy uuid ở Authentication → Users)
-- ============================================================

-- ------------------------------------------------------------
-- 1) Trạng thái tài khoản: active | banned (admin khóa/mở)
-- ------------------------------------------------------------
alter table public.profiles add column if not exists status text not null default 'active';

-- ------------------------------------------------------------
-- 2) Helper kiểm tra admin (security definer — bỏ qua RLS, tránh đệ quy policy)
-- ------------------------------------------------------------
create or replace function public.is_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

-- ------------------------------------------------------------
-- 3) Bảng báo cáo vi phạm (hàng đợi kiểm duyệt)
-- ------------------------------------------------------------
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references public.profiles(id) on delete set null,
  target_type  text not null,                 -- product | review | shop
  target_id    text not null,
  target_label text not null default '',
  reason       text not null default '',
  status       text not null default 'open',  -- open | resolved | dismissed
  created_at   timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports(status, created_at desc);

alter table public.reports enable row level security;

-- Người dùng đã đăng nhập gửi báo cáo của mình
drop policy if exists "reports insert own" on public.reports;
create policy "reports insert own" on public.reports
  for insert with check (auth.uid() = reporter_id);

-- Admin đọc + cập nhật mọi báo cáo
drop policy if exists "reports admin read" on public.reports;
create policy "reports admin read" on public.reports
  for select using (public.is_admin());

drop policy if exists "reports admin update" on public.reports;
create policy "reports admin update" on public.reports
  for update using (public.is_admin());

-- ------------------------------------------------------------
-- 4) RLS admin cho dữ liệu kiểm duyệt
--    (server actions dùng service-role bỏ qua RLS; đây là lớp phòng thủ bổ sung
--     + cho phép đọc phía client nếu cần)
-- ------------------------------------------------------------
-- profiles: admin đọc tất cả + cập nhật (khóa/mở, đổi vai trò)
drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read" on public.profiles for select using (public.is_admin());
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update using (public.is_admin());

-- shops: admin sửa (duyệt/khóa) + xóa
drop policy if exists "shops admin update" on public.shops;
create policy "shops admin update" on public.shops for update using (public.is_admin());
drop policy if exists "shops admin delete" on public.shops;
create policy "shops admin delete" on public.shops for delete using (public.is_admin());

-- products: admin xóa (gỡ sản phẩm vi phạm)
drop policy if exists "products admin delete" on public.products;
create policy "products admin delete" on public.products for delete using (public.is_admin());

-- reviews: admin xóa (gỡ đánh giá vi phạm)
drop policy if exists "reviews admin delete" on public.reviews;
create policy "reviews admin delete" on public.reviews for delete using (public.is_admin());

-- ------------------------------------------------------------
-- 5) Realtime cho reports (chuông kiểm duyệt) — tuỳ chọn
-- ------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.reports;
exception when duplicate_object then null; end $$;

-- ============================================================
-- Xong. Admin Dashboard (/admin/dashboard) sẽ đọc dữ liệu thật + kiểm duyệt.
-- ============================================================
