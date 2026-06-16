-- ============================================================
-- Vibe Market — Migration: Flash Sale có thời hạn (đếm ngược thật)
-- Chạy SAU schema.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Thời điểm kết thúc flash sale (đếm ngược tới mốc này)
alter table public.products add column if not exists flash_sale_end timestamptz;

-- Đặt hạn mặc định cho các SP flash sale seed (demo): còn 8 giờ kể từ bây giờ
update public.products
  set flash_sale_end = now() + interval '8 hours'
  where is_flash_sale = true and flash_sale_end is null;

-- Ghi chú: "đã bán X%" tính từ sold/(sold+stock) (mức cạn kho) — không cần cột thêm.
