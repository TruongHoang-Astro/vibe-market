-- ============================================================
-- Vibe Market — Migration: Tìm kiếm full-text (Postgres tsvector + unaccent)
-- Chạy SAU schema.sql. Idempotent — chạy lại nhiều lần vẫn an toàn.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) unaccent: bỏ dấu tiếng Việt khi index + truy vấn.
--    Supabase cài extension vào schema "extensions".
create extension if not exists unaccent with schema extensions;

-- Wrapper IMMUTABLE — bắt buộc để dùng trong generated column / index.
-- (unaccent() mặc định chỉ STABLE nên không index trực tiếp được.)
create or replace function public.immutable_unaccent(text)
  returns text
  language sql
  immutable
  parallel safe
as $$ select extensions.unaccent('extensions.unaccent', $1) $$;

-- 2) Cột tsvector sinh tự động từ tên + mô tả + danh mục (đã bỏ dấu).
--    Dùng config 'simple' (không stemming) — hợp với tiếng Việt.
alter table public.products
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector(
      'simple',
      public.immutable_unaccent(
        coalesce(name, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(category, '')
      )
    )
  ) stored;

-- 3) GIN index để tìm kiếm nhanh trên hàng triệu sản phẩm.
create index if not exists products_search_idx
  on public.products using gin(search_vector);

-- ============================================================
-- Xong. Code dùng .textSearch('search_vector', '<từ khóa đã bỏ dấu>:*',
-- { config: 'simple' }) — xem lib/supabase/queries.ts → searchProducts().
-- Nếu CHƯA chạy migration này: code tự fallback sang ilike (không vỡ trang).
-- ============================================================
