-- ============================================================
-- Vibe Market — Migration: Số dư & Rút tiền cho người bán (payout)
-- Chạy SAU schema.sql + seller.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.withdrawals (
  id            uuid primary key default gen_random_uuid(),
  shop_id       text not null references public.shops(id) on delete cascade,
  amount        bigint not null,
  bank_name     text not null default '',
  bank_account  text not null default '',
  account_name  text not null default '',
  status        text not null default 'pending',  -- pending | approved | rejected
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists withdrawals_shop_idx on public.withdrawals(shop_id, created_at desc);
create index if not exists withdrawals_status_idx on public.withdrawals(status);

alter table public.withdrawals enable row level security;

-- Seller quản lý yêu cầu rút tiền của shop mình. (Admin duyệt qua service-role server action.)
drop policy if exists "withdrawals own" on public.withdrawals;
create policy "withdrawals own" on public.withdrawals
  for all using (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

-- ============================================================
-- Số dư = doanh thu đơn ĐÃ GIAO × (1 - hoa hồng nền tảng) − (đã/đang rút).
-- Hoa hồng cấu hình trong lib/commission.ts (mặc định 5%).
-- ============================================================
