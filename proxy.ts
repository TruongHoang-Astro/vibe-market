// proxy.ts (gốc dự án) — Next.js 16 thay thế cho middleware.ts.
// Chạy trước mỗi request để làm mới session Supabase và đồng bộ cookie.
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy-session';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Chạy trên mọi route, trừ static asset và file ảnh.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
