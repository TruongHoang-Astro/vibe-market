// lib/supabase/server.ts
// Supabase client dùng trong Server Components, Server Actions, Route Handlers.
// Next.js 16: cookies() là async → phải await trước khi dùng.
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Trong Server Component thuần, set cookie sẽ ném lỗi — bỏ qua an toàn,
          // vì proxy.ts đã đảm nhiệm việc refresh session.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Bỏ qua: được gọi từ Server Component không thể ghi cookie.
          }
        },
      },
    },
  );
}

// Client với quyền admin (service role) — CHỈ dùng phía server cho tác vụ tin cậy
// (seed, webhook, thao tác bỏ qua RLS). Tuyệt đối KHÔNG import vào Client Component.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
