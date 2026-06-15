-- ============================================================
-- Vibe Market — Migration: Bảng hướng dẫn chọn size cho sản phẩm
-- Chạy trong Supabase SQL Editor. Idempotent.
-- size_guide: mảng JSON [{ "size": "35", "value": "22.5 cm" }, ...] do seller nhập.
-- ============================================================
alter table public.products
  add column if not exists size_guide jsonb not null default '[]'::jsonb;
