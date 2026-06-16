-- ============================================================
-- Vibe Market — Migration: Sổ địa chỉ có Phường/Xã (verify hành chính)
-- Chạy SAU extras.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Thêm Phường/Xã cho địa chỉ (đã có recipient/phone/address/district/province).
alter table public.addresses add column if not exists ward text;

-- RLS đã có "addresses all own" (extras.sql) — không cần thêm.
