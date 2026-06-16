-- ============================================================
-- Vibe Market — Migration: Mã giảm giá (Voucher) thật
-- Chạy SAU schema.sql + seller.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.vouchers (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  description    text not null default '',
  discount_type  text not null default 'percent',  -- percent | fixed
  discount_value bigint not null default 0,         -- % (0-100) nếu percent, VND nếu fixed
  max_discount   bigint,                            -- trần giảm cho percent (null = không trần)
  min_order      bigint not null default 0,         -- giá trị đơn tối thiểu
  shop_id        text references public.shops(id) on delete cascade, -- null = voucher toàn sàn
  usage_limit    integer,                           -- null = không giới hạn lượt
  used_count     integer not null default 0,
  starts_at      timestamptz,
  expires_at     timestamptz,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists vouchers_code_idx on public.vouchers(lower(code));
create index if not exists vouchers_shop_idx on public.vouchers(shop_id);

alter table public.vouchers enable row level security;

-- Đọc công khai (hiện danh sách mã khả dụng). Validate + apply do server làm.
drop policy if exists "vouchers read" on public.vouchers;
create policy "vouchers read" on public.vouchers for select using (true);

-- Seller tự quản lý voucher SHOP của mình (insert/update/delete).
drop policy if exists "vouchers shop manage" on public.vouchers;
create policy "vouchers shop manage" on public.vouchers
  for all using (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

-- orders: lưu mã + số tiền giảm
alter table public.orders add column if not exists voucher_code text;
alter table public.orders add column if not exists discount     bigint not null default 0;

-- Voucher sàn mẫu (thay cho VIBE10 hardcode cũ)
insert into public.vouchers (code, description, discount_type, discount_value, max_discount, min_order, active)
values
  ('VIBE10',     'Giảm 10% tối đa 50.000đ',           'percent', 10, 50000, 0,      true),
  ('FREESHIP50', 'Giảm thẳng 30.000đ cho đơn từ 199k', 'fixed',   30000, null, 199000, true)
on conflict (code) do nothing;

-- ============================================================
-- Xong. Cart/Checkout nhập mã → validateVoucher (server) → áp dụng vào đơn.
-- ============================================================
