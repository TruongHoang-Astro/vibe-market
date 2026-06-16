-- ============================================================
-- Vibe Market — Migration: Hỏi đáp sản phẩm (Q&A)
-- Chạy SAU schema.sql. Idempotent.
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.product_questions (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null references public.products(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  asker_name  text not null default 'Khách',
  question    text not null,
  answer      text,
  answered_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists product_questions_product_idx on public.product_questions(product_id, created_at desc);

alter table public.product_questions enable row level security;

-- Đọc công khai
drop policy if exists "qa read" on public.product_questions;
create policy "qa read" on public.product_questions for select using (true);

-- Người dùng đăng nhập đặt câu hỏi của mình. (Seller trả lời qua service-role server action.)
drop policy if exists "qa ask own" on public.product_questions;
create policy "qa ask own" on public.product_questions
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- Xong. Trang sản phẩm có mục "Hỏi & Đáp"; chủ shop trả lời ngay trên trang.
-- ============================================================
