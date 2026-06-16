-- ============================================================
-- Vibe Market — Migration: Hủy đơn (hoàn kho) + Yêu cầu Trả hàng/Hoàn tiền
-- Chạy SAU schema.sql + realdata.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ------------------------------------------------------------
-- 1) Hủy đơn → hoàn lại tồn kho + giảm "đã bán" (cho cả buyer & seller hủy)
-- ------------------------------------------------------------
create or replace function public.trg_order_cancel_restock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.status = 'cancelled' and old.status is distinct from 'cancelled') then
    update public.products p
      set stock = p.stock + agg.q,
          sold  = greatest(0, p.sold - agg.q)
      from (
        select product_id, sum(qty) as q
        from public.order_items
        where order_id = new.id and product_id is not null
        group by product_id
      ) agg
      where agg.product_id = p.id;
  end if;
  return new;
end; $$;

drop trigger if exists order_cancel_restock on public.orders;
create trigger order_cancel_restock
  after update on public.orders
  for each row execute function public.trg_order_cancel_restock();

-- ------------------------------------------------------------
-- 2) Yêu cầu trả hàng / hoàn tiền
-- ------------------------------------------------------------
create table if not exists public.return_requests (
  id          uuid primary key default gen_random_uuid(),
  order_id    text not null references public.orders(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  reason      text not null,
  detail      text not null default '',
  images      text[],
  status      text not null default 'pending',  -- pending | approved | rejected
  created_at  timestamptz not null default now()
);
create index if not exists return_requests_order_idx on public.return_requests(order_id);
create index if not exists return_requests_user_idx  on public.return_requests(user_id);

alter table public.return_requests enable row level security;

-- Buyer: tạo + xem yêu cầu của mình. (Seller/Admin xử lý qua service-role server action.)
drop policy if exists "returns insert own" on public.return_requests;
create policy "returns insert own" on public.return_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "returns read own" on public.return_requests;
create policy "returns read own" on public.return_requests
  for select using (auth.uid() = user_id);

-- ============================================================
-- Xong. Buyer: hủy đơn (pending/confirmed) + gửi yêu cầu trả hàng (đã giao).
-- Seller: duyệt/từ chối trả hàng trong Seller Center.
-- ============================================================
