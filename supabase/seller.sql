-- ============================================================
-- Vibe Market — Migration: Seller thật (tài khoản seller + sở hữu shop + chat 2 chiều)
-- Chạy SAU schema.sql + seed.sql. Idempotent — chạy lại nhiều lần vẫn an toàn.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ------------------------------------------------------------
-- 1) Trigger: khi đăng ký, set role từ metadata; nếu là seller → tạo shop
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role      user_role;
  v_shop_name text;
  v_shop_id   text;
begin
  -- role lấy từ metadata (mặc định buyer nếu không hợp lệ/không có)
  begin
    v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer');
  exception when others then
    v_role := 'buyer';
  end;

  insert into public.profiles (id, full_name, avatar_url, role, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    v_role,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;

  -- Seller → tạo gian hàng sở hữu bởi user (nếu chưa có)
  if v_role = 'seller' then
    v_shop_name := coalesce(
      nullif(new.raw_user_meta_data->>'shop_name', ''),
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || ' Shop'
    );
    v_shop_id := 'shop-' || substr(replace(new.id::text, '-', ''), 1, 12);
    insert into public.shops (id, owner_id, name, category, response_time)
    values (v_shop_id, new.id, v_shop_name, 'Tổng hợp', 'trong vài giờ')
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2) shops: chủ shop được tạo/sửa gian hàng của mình
--    (select công khai vẫn giữ từ schema.sql — "catalog read shops")
-- ------------------------------------------------------------
drop policy if exists "shops owner insert" on public.shops;
create policy "shops owner insert" on public.shops
  for insert with check (auth.uid() = owner_id);

drop policy if exists "shops owner update" on public.shops;
create policy "shops owner update" on public.shops
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- 3) products: chủ shop CRUD sản phẩm của shop mình
--    (select công khai vẫn giữ — "catalog read products")
-- ------------------------------------------------------------
drop policy if exists "products owner insert" on public.products;
create policy "products owner insert" on public.products
  for insert with check (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

drop policy if exists "products owner update" on public.products;
create policy "products owner update" on public.products
  for update using (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

drop policy if exists "products owner delete" on public.products;
create policy "products owner delete" on public.products
  for delete using (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

-- ------------------------------------------------------------
-- 4) Chat 2 chiều: chủ shop cũng truy cập được hội thoại/tin nhắn của shop
--    (thay thế policy cũ chỉ-buyer). Dùng cho UI chat seller ở bước sau.
-- ------------------------------------------------------------
drop policy if exists "conversations all own" on public.conversations;
drop policy if exists "conversations buyer or shop" on public.conversations;
create policy "conversations buyer or shop" on public.conversations
  for all using (
    auth.uid() = buyer_id
    or exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  ) with check (
    auth.uid() = buyer_id
    or exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

drop policy if exists "messages read own" on public.messages;
drop policy if exists "messages read participant" on public.messages;
create policy "messages read participant" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (
        c.buyer_id = auth.uid()
        or exists (select 1 from public.shops s where s.id = c.shop_id and s.owner_id = auth.uid())
      )
    )
  );

drop policy if exists "messages insert own" on public.messages;
drop policy if exists "messages insert participant" on public.messages;
create policy "messages insert participant" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (
        c.buyer_id = auth.uid()
        or exists (select 1 from public.shops s where s.id = c.shop_id and s.owner_id = auth.uid())
      )
    )
  );

-- ============================================================
-- Xong. Test: đăng ký 1 tài khoản ở tab "🏪 Bán hàng" → bảng shops sẽ có 1 row
-- owner_id = user vừa tạo, profiles.role = 'seller'.
-- ============================================================
