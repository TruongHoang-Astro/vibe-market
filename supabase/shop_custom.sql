-- ============================================================
-- Vibe Market — Migration: Chính sách bán hàng + Tùy chỉnh gian hàng
-- Chạy SAU schema.sql + seller.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Tùy chỉnh giao diện gian hàng
alter table public.shops add column if not exists theme_color  text not null default '#EF4444';
alter table public.shops add column if not exists announcement text not null default '';

-- Chính sách bán hàng (hiện ở trang shop + trang sản phẩm)
alter table public.shops add column if not exists return_policy   text not null default '';
alter table public.shops add column if not exists shipping_policy text not null default '';
alter table public.shops add column if not exists warranty_policy text not null default '';

-- RLS: chủ shop được sửa các cột này — đã có policy "shops owner update" (seller.sql).
-- Đọc công khai — đã có "catalog read shops" (schema.sql).
