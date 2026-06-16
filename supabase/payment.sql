-- ============================================================
-- Vibe Market — Migration: Vận chuyển + Thanh toán
-- Thêm cột cho orders: phương thức/phí ship + trạng thái thanh toán.
-- Chạy SAU schema.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

alter table public.orders add column if not exists shipping_method  text   not null default 'standard';
alter table public.orders add column if not exists shipping_fee     bigint not null default 0;
-- payment_provider: cod | vnpay | mock
alter table public.orders add column if not exists payment_provider text   not null default 'cod';
-- payment_status: unpaid (COD chờ nhận) | pending (chờ cổng) | paid | failed
alter table public.orders add column if not exists payment_status   text   not null default 'unpaid';
alter table public.orders add column if not exists paid_at          timestamptz;
alter table public.orders add column if not exists payment_ref      text;

create index if not exists orders_payment_status_idx on public.orders(payment_status);

-- Ghi chú: cập nhật trạng thái thanh toán do server (service role) thực hiện
-- sau khi xác minh chữ ký cổng (VNPay) hoặc xác nhận giả lập — không cần RLS update cho buyer.
