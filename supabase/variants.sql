-- ============================================================
-- Vibe Market — Migration: Biến thể sản phẩm (phân loại hàng)
-- Mỗi biến thể có GIÁ + TỒN KHO riêng (vd: "Đỏ / Size M").
-- Chạy SAU schema.sql + realdata.sql + orders_lifecycle.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null references public.products(id) on delete cascade,
  name        text not null,            -- nhãn phân loại, vd "Đỏ / M"
  price       bigint not null default 0,
  stock       integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists product_variants_product_idx on public.product_variants(product_id);

alter table public.product_variants enable row level security;

drop policy if exists "variants read" on public.product_variants;
create policy "variants read" on public.product_variants for select using (true);

drop policy if exists "variants owner" on public.product_variants;
create policy "variants owner" on public.product_variants
  for all using (
    exists (select 1 from public.products p join public.shops s on s.id = p.shop_id where p.id = product_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.products p join public.shops s on s.id = p.shop_id where p.id = product_id and s.owner_id = auth.uid())
  );

-- order_items tham chiếu biến thể (để trừ/hoàn đúng tồn kho biến thể)
alter table public.order_items add column if not exists variant_id uuid references public.product_variants(id) on delete set null;

-- ------------------------------------------------------------
-- Trừ tồn kho biến thể khi đặt hàng
-- ------------------------------------------------------------
create or replace function public.trg_order_item_variant_stock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.variant_id is not null) then
    update public.product_variants set stock = greatest(0, stock - new.qty) where id = new.variant_id;
  end if;
  return new;
end; $$;
drop trigger if exists order_item_variant_stock on public.order_items;
create trigger order_item_variant_stock
  after insert on public.order_items
  for each row execute function public.trg_order_item_variant_stock();

-- ------------------------------------------------------------
-- Hoàn tồn kho biến thể khi hủy đơn
-- ------------------------------------------------------------
create or replace function public.trg_order_cancel_variant_restock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.status = 'cancelled' and old.status is distinct from 'cancelled') then
    update public.product_variants pv
      set stock = pv.stock + agg.q
      from (
        select variant_id, sum(qty) as q
        from public.order_items
        where order_id = new.id and variant_id is not null
        group by variant_id
      ) agg
      where agg.variant_id = pv.id;
  end if;
  return new;
end; $$;
drop trigger if exists order_cancel_variant_restock on public.orders;
create trigger order_cancel_variant_restock
  after update on public.orders
  for each row execute function public.trg_order_cancel_variant_restock();

-- ============================================================
-- Xong. Seller thêm "Phân loại hàng" trong modal sản phẩm; trang SP hiện bộ chọn
-- biến thể (giá + tồn kho theo từng phân loại). Sản phẩm KHÔNG có biến thể chạy như cũ.
-- ============================================================
