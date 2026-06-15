-- ============================================================
-- Vibe Market — Migration: Real-data hóa toàn bộ
-- Tự tính (qua trigger) thay vì số seed cứng:
--   • products.sold   = tổng qty đã đặt (order_items)
--   • products.stock  = giảm dần theo đơn
--   • products.rating, products.reviews = tổng hợp từ bảng reviews
--   • shops.rating, shops.products       = tổng hợp từ products của shop
--   • shops.followers = số người theo dõi thật (bảng shop_follows)
-- ⚠️ CÓ BACKFILL: reset toàn bộ số seed (demo) về số THẬT từ DB.
-- Chạy SAU schema.sql + seed.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ------------------------------------------------------------
-- 1) Theo dõi gian hàng (follow) — bảng thật
-- ------------------------------------------------------------
create table if not exists public.shop_follows (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  shop_id     text not null references public.shops(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, shop_id)
);
create index if not exists shop_follows_shop_idx on public.shop_follows(shop_id);

alter table public.shop_follows enable row level security;
drop policy if exists "shop_follows read all" on public.shop_follows;
create policy "shop_follows read all" on public.shop_follows for select using (true);
drop policy if exists "shop_follows all own" on public.shop_follows;
create policy "shop_follows all own" on public.shop_follows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2) Hàm tổng hợp
-- ------------------------------------------------------------
-- Rating + số đánh giá của sản phẩm (từ reviews thật)
create or replace function public.recompute_product_rating(p_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.products p set
    reviews = (select count(*) from public.reviews r where r.product_id = p_id),
    rating  = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.product_id = p_id), 5.0)
  where p.id = p_id;
end; $$;

-- Số sản phẩm + rating trung bình của shop (từ products của shop)
create or replace function public.recompute_shop_stats(s_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.shops s set
    products = (select count(*) from public.products p where p.shop_id = s_id),
    rating   = coalesce((select round(avg(p.rating)::numeric, 1) from public.products p where p.shop_id = s_id), 5.0)
  where s.id = s_id;
end; $$;

-- Số người theo dõi của shop (từ shop_follows)
create or replace function public.recompute_shop_followers(s_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.shops s set
    followers = (select count(*) from public.shop_follows f where f.shop_id = s_id)
  where s.id = s_id;
end; $$;

-- ------------------------------------------------------------
-- 3) Triggers
-- ------------------------------------------------------------
-- reviews → cập nhật rating/reviews của sản phẩm
create or replace function public.trg_reviews_aggregate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recompute_product_rating(old.product_id);
    return old;
  else
    perform public.recompute_product_rating(new.product_id);
    if (tg_op = 'UPDATE' and new.product_id is distinct from old.product_id) then
      perform public.recompute_product_rating(old.product_id);
    end if;
    return new;
  end if;
end; $$;
drop trigger if exists reviews_aggregate on public.reviews;
create trigger reviews_aggregate
  after insert or update or delete on public.reviews
  for each row execute function public.trg_reviews_aggregate();

-- order_items → tăng sold, giảm stock của sản phẩm
create or replace function public.trg_order_item_sold()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.product_id is not null) then
    update public.products
      set sold  = sold + new.qty,
          stock = greatest(0, stock - new.qty)
      where id = new.product_id;
  end if;
  return new;
end; $$;
drop trigger if exists order_item_sold on public.order_items;
create trigger order_item_sold
  after insert on public.order_items
  for each row execute function public.trg_order_item_sold();

-- products → cập nhật stats của shop (chỉ khi liên quan, tránh churn khi chỉ đổi sold/stock)
create or replace function public.trg_products_shop_stats()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recompute_shop_stats(old.shop_id);
    return old;
  elsif (tg_op = 'INSERT') then
    perform public.recompute_shop_stats(new.shop_id);
    return new;
  else -- UPDATE
    if (new.shop_id is distinct from old.shop_id) then
      perform public.recompute_shop_stats(old.shop_id);
      perform public.recompute_shop_stats(new.shop_id);
    elsif (new.rating is distinct from old.rating) then
      perform public.recompute_shop_stats(new.shop_id);
    end if;
    return new;
  end if;
end; $$;
drop trigger if exists products_shop_stats on public.products;
create trigger products_shop_stats
  after insert or update or delete on public.products
  for each row execute function public.trg_products_shop_stats();

-- shop_follows → cập nhật followers của shop
create or replace function public.trg_shop_follows_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recompute_shop_followers(old.shop_id);
    return old;
  else
    perform public.recompute_shop_followers(new.shop_id);
    return new;
  end if;
end; $$;
drop trigger if exists shop_follows_count on public.shop_follows;
create trigger shop_follows_count
  after insert or delete on public.shop_follows
  for each row execute function public.trg_shop_follows_count();

-- ------------------------------------------------------------
-- 4) BACKFILL — reset số seed về số THẬT (chạy 1 lần, an toàn chạy lại)
-- ------------------------------------------------------------
-- sold = tổng qty đã bán thật
update public.products p set
  sold = coalesce((select sum(oi.qty) from public.order_items oi where oi.product_id = p.id), 0);

-- rating + reviews từ reviews thật
update public.products p set
  reviews = (select count(*) from public.reviews r where r.product_id = p.id),
  rating  = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.product_id = p.id), 5.0);

-- shop stats từ products
update public.shops s set
  products  = (select count(*) from public.products p where p.shop_id = s.id),
  rating    = coalesce((select round(avg(p.rating)::numeric, 1) from public.products p where p.shop_id = s.id), 5.0),
  followers = (select count(*) from public.shop_follows f where f.shop_id = s.id);

-- ------------------------------------------------------------
-- 5) Realtime cho follow (tuỳ chọn)
-- ------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.shop_follows;
exception when duplicate_object then null; end $$;

-- ============================================================
-- Xong. Từ giờ mọi số (sao, đã bán, tồn kho, số đánh giá, followers) đều THẬT.
-- ============================================================
