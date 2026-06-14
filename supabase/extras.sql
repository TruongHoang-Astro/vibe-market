-- ============================================================
-- Vibe Market — Migration: Sổ địa chỉ + Thông báo
-- Chạy SAU schema.sql + seed.sql + seller.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ---------- addresses (sổ địa chỉ giao hàng) ----------
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  recipient   text not null,
  phone       text not null,
  address     text not null,
  district    text,
  province    text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists addresses_user_id_idx on public.addresses(user_id);

alter table public.addresses enable row level security;
drop policy if exists "addresses all own" on public.addresses;
create policy "addresses all own" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- notifications (trung tâm thông báo) ----------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null default 'info',  -- order | message | promo | info
  title       text not null,
  message     text not null default '',
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;
-- Đọc/sửa (đánh dấu đã đọc) thông báo của chính mình. INSERT do server (service role).
drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications delete own" on public.notifications;
create policy "notifications delete own" on public.notifications
  for delete using (auth.uid() = user_id);

-- Realtime cho chuông thông báo (tuỳ chọn)
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
