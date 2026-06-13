-- ============================================================
-- Vibe Market — Supabase schema
-- Chạy file này trong: Supabase Dashboard → SQL Editor → New query → Run
-- (Chạy schema.sql trước, sau đó chạy seed.sql)
-- ============================================================

-- ---------- ENUM types ----------
do $$ begin
  create type user_role as enum ('buyer', 'seller', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_badge as enum ('new', 'sale', 'hot', 'bestseller');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_type as enum ('text', 'image', 'audio', 'video');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_sender as enum ('buyer', 'shop');
exception when duplicate_object then null; end $$;

-- ---------- profiles (gắn với auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        user_role not null default 'buyer',
  phone       text,
  created_at  timestamptz not null default now()
);

-- ---------- categories ----------
create table if not exists public.categories (
  id     text primary key,
  name   text not null,
  icon   text not null default '',
  color  text not null default '#000000',
  count  integer not null default 0
);

-- ---------- shops ----------
create table if not exists public.shops (
  id             text primary key,
  owner_id       uuid references public.profiles(id) on delete set null,
  name           text not null,
  logo           text not null default '',
  banner         text not null default '',
  rating         numeric(2,1) not null default 5.0,
  followers      integer not null default 0,
  products       integer not null default 0,
  response_rate  integer not null default 100,
  response_time  text not null default '',
  joined_date    date not null default now(),
  description    text not null default '',
  category       text not null,
  verified       boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ---------- products ----------
create table if not exists public.products (
  id                text primary key,
  shop_id           text not null references public.shops(id) on delete cascade,
  name              text not null,
  price             bigint not null,
  original_price    bigint not null,
  image             text not null default '',
  images            text[] not null default '{}',
  category          text not null,
  subcategory       text,
  rating            numeric(2,1) not null default 5.0,
  reviews           integer not null default 0,
  sold              integer not null default 0,
  stock             integer not null default 0,
  description       text not null default '',
  badge             product_badge,
  colors            text[],
  sizes             text[],
  is_flash_sale     boolean not null default false,
  flash_sale_price  bigint,
  created_at        timestamptz not null default now()
);
create index if not exists products_shop_id_idx  on public.products(shop_id);
create index if not exists products_category_idx on public.products(category);
create index if not exists products_flash_idx    on public.products(is_flash_sale);

-- ---------- reviews ----------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null references public.products(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  user_name   text not null,
  avatar      text,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null default '',
  images      text[],
  created_at  timestamptz not null default now()
);
create index if not exists reviews_product_id_idx on public.reviews(product_id);

-- ---------- orders ----------
create table if not exists public.orders (
  id              text primary key default ('ORD-' || substr(gen_random_uuid()::text, 1, 8)),
  user_id         uuid references public.profiles(id) on delete set null,
  total           bigint not null,
  status          order_status not null default 'pending',
  address         text not null,
  payment_method  text not null,
  created_at      timestamptz not null default now()
);
create index if not exists orders_user_id_idx on public.orders(user_id);

-- ---------- order_items ----------
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    text not null references public.orders(id) on delete cascade,
  product_id  text references public.products(id) on delete set null,
  name        text not null,
  qty         integer not null default 1,
  price       bigint not null,
  image       text
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

-- ---------- wishlists ----------
create table if not exists public.wishlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  product_id  text not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ---------- conversations (chat buyer ↔ shop) ----------
create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  buyer_id      uuid not null references public.profiles(id) on delete cascade,
  shop_id       text not null references public.shops(id) on delete cascade,
  last_message  text,
  last_time     timestamptz not null default now(),
  unread_count  integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (buyer_id, shop_id)
);

-- ---------- messages ----------
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender           message_sender not null,
  type             message_type not null default 'text',
  content          text not null,
  file_name        text,
  duration         integer,
  status           text not null default 'sent',
  created_at       timestamptz not null default now()
);
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);

-- ============================================================
-- Trigger: tự tạo profile khi có user mới đăng ký
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.categories    enable row level security;
alter table public.shops         enable row level security;
alter table public.products      enable row level security;
alter table public.reviews       enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.wishlists     enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

-- ---- Catalog công khai: ai cũng đọc được ----
drop policy if exists "catalog read categories" on public.categories;
create policy "catalog read categories" on public.categories for select using (true);

drop policy if exists "catalog read shops" on public.shops;
create policy "catalog read shops" on public.shops for select using (true);

drop policy if exists "catalog read products" on public.products;
create policy "catalog read products" on public.products for select using (true);

drop policy if exists "catalog read reviews" on public.reviews;
create policy "catalog read reviews" on public.reviews for select using (true);

-- ---- profiles: tự đọc/sửa hồ sơ của mình ----
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

-- ---- reviews: user đã đăng nhập tự viết review của mình ----
drop policy if exists "reviews insert own" on public.reviews;
create policy "reviews insert own" on public.reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "reviews update own" on public.reviews;
create policy "reviews update own" on public.reviews
  for update using (auth.uid() = user_id);

drop policy if exists "reviews delete own" on public.reviews;
create policy "reviews delete own" on public.reviews
  for delete using (auth.uid() = user_id);

-- ---- orders: chỉ chủ đơn ----
drop policy if exists "orders read own" on public.orders;
create policy "orders read own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "orders insert own" on public.orders;
create policy "orders insert own" on public.orders
  for insert with check (auth.uid() = user_id);

-- ---- order_items: theo đơn của chính mình ----
drop policy if exists "order_items read own" on public.order_items;
create policy "order_items read own" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

drop policy if exists "order_items insert own" on public.order_items;
create policy "order_items insert own" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- ---- wishlists: chỉ chủ sở hữu ----
drop policy if exists "wishlists all own" on public.wishlists;
create policy "wishlists all own" on public.wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- conversations: chỉ người mua trong hội thoại ----
drop policy if exists "conversations all own" on public.conversations;
create policy "conversations all own" on public.conversations
  for all using (auth.uid() = buyer_id) with check (auth.uid() = buyer_id);

-- ---- messages: theo hội thoại của chính mình ----
drop policy if exists "messages read own" on public.messages;
create policy "messages read own" on public.messages
  for select using (
    exists (select 1 from public.conversations c where c.id = conversation_id and c.buyer_id = auth.uid())
  );

drop policy if exists "messages insert own" on public.messages;
create policy "messages insert own" on public.messages
  for insert with check (
    exists (select 1 from public.conversations c where c.id = conversation_id and c.buyer_id = auth.uid())
  );

-- ============================================================
-- Realtime: bật cho messages + conversations (chat realtime)
-- ============================================================
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null; end $$;
