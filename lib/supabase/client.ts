// lib/supabase/client.ts
// Supabase client dùng trong Client Components ('use client').
// Đọc/ghi cookie qua trình duyệt — dùng cho login, realtime, các hành động phía client.
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
