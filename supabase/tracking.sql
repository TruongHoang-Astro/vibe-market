-- ============================================================
-- Vibe Market — Migration: Lịch sử trạng thái đơn (timeline theo dõi)
-- Chạy SAU schema.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    text not null references public.orders(id) on delete cascade,
  status      text not null,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists order_status_history_idx on public.order_status_history(order_id, created_at);

alter table public.order_status_history enable row level security;

-- Buyer đọc lịch sử đơn của mình
drop policy if exists "history read own" on public.order_status_history;
create policy "history read own" on public.order_status_history
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- Trigger: ghi lịch sử khi tạo đơn + khi đổi trạng thái
-- ------------------------------------------------------------
create or replace function public.trg_order_status_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.order_status_history(order_id, status) values (new.id, new.status);
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.order_status_history(order_id, status) values (new.id, new.status);
  end if;
  return new;
end; $$;

drop trigger if exists order_status_history_trg on public.orders;
create trigger order_status_history_trg
  after insert or update on public.orders
  for each row execute function public.trg_order_status_history();

-- Backfill: trạng thái hiện tại cho các đơn cũ
insert into public.order_status_history (order_id, status, created_at)
select id, status, created_at from public.orders o
where not exists (select 1 from public.order_status_history h where h.order_id = o.id);

-- ============================================================
-- Xong. Trang /orders hiện timeline trạng thái cho mỗi đơn.
-- ============================================================
