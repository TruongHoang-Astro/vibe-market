'use server';
// Khởi tạo + xác nhận thanh toán online.
// Dùng VNPay thật nếu đã cấu hình env; nếu chưa → cổng giả lập (/checkout/pay/[id]) để demo được.
import { headers } from 'next/headers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { buildVnpayUrl, isVnpayConfigured } from '@/lib/payments/vnpay';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Trả về URL để chuyển hướng người dùng tới trang thanh toán.
export async function initiatePayment(orderId: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập' };

  const { data: order } = await supabase
    .from('orders').select('id, total, user_id, payment_status').eq('id', orderId).maybeSingle();
  if (!order || order.user_id !== user.id) return { error: 'Không tìm thấy đơn hàng' };
  if (order.payment_status === 'paid') return { error: 'Đơn hàng đã được thanh toán' };

  // VNPay thật (sandbox/production) nếu đã cấu hình
  if (isVnpayConfigured()) {
    const hdrs = await headers();
    const ip = (hdrs.get('x-forwarded-for') ?? '').split(',')[0].trim() || '127.0.0.1';
    const url = buildVnpayUrl({
      orderId: order.id,
      amount: Number(order.total),
      orderInfo: `Thanh toan don ${order.id}`,
      ipAddr: ip,
      returnUrl: `${SITE_URL}/api/payment/vnpay/return`,
    });
    return { url };
  }

  // Chưa cấu hình cổng → trang giả lập (demo flow)
  return { url: `/checkout/pay/${order.id}` };
}

// Xác nhận thanh toán từ cổng giả lập (chỉ chủ đơn).
export async function confirmMockPayment(orderId: string, success: boolean): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập' };

  const { data: order } = await supabase
    .from('orders').select('id, user_id, payment_status').eq('id', orderId).maybeSingle();
  if (!order || order.user_id !== user.id) return { error: 'Không tìm thấy đơn hàng' };
  if (order.payment_status === 'paid') return { ok: true };

  const admin = createAdminClient();
  const patch = success
    ? { payment_status: 'paid', paid_at: new Date().toISOString(), payment_ref: 'MOCK-' + Date.now(), payment_provider: 'mock' }
    : { payment_status: 'failed' };
  const { error } = await admin.from('orders').update(patch).eq('id', orderId);
  if (error) { console.error('confirmMockPayment:', error.message); return { error: 'Cập nhật thanh toán thất bại' }; }
  return { ok: true };
}
