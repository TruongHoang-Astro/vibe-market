// app/api/payment/vnpay/return/route.ts — VNPay redirect người dùng về đây sau khi thanh toán.
// Xác minh chữ ký → cập nhật trạng thái đơn → chuyển về /orders.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyVnpayReturn } from '@/lib/payments/vnpay';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const query: Record<string, string> = {};
  searchParams.forEach((v, k) => { query[k] = v; });

  const { valid, orderId, success } = verifyVnpayReturn(query);
  if (!valid || !orderId) {
    return NextResponse.redirect(`${origin}/orders?failed=invalid`);
  }

  const admin = createAdminClient();
  if (success) {
    await admin.from('orders').update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      payment_ref: query['vnp_TransactionNo'] ?? null,
    }).eq('id', orderId);
    return NextResponse.redirect(`${origin}/orders?paid=${orderId}`);
  }

  await admin.from('orders').update({ payment_status: 'failed' }).eq('id', orderId);
  return NextResponse.redirect(`${origin}/orders?failed=${orderId}`);
}
