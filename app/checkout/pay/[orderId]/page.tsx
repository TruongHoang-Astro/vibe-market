// app/checkout/pay/[orderId]/page.tsx — Cổng thanh toán GIẢ LẬP (khi chưa cấu hình VNPay).
// Server Component: đọc đơn của chính mình rồi giao cho island xác nhận.
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import MockPayClient from './MockPayClient';

export default async function MockPayPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: order } = user
    ? await supabase.from('orders').select('id, total, payment_status').eq('id', orderId).maybeSingle()
    : { data: null };

  if (!order) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Playfair Display', fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>Không tìm thấy đơn hàng</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: '24px' }}>Đơn không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Link href="/orders" className="btn-primary" style={{ borderRadius: '99px' }}><span>Về đơn hàng của tôi</span></Link>
      </div>
    );
  }

  return <MockPayClient orderId={order.id} total={Number(order.total)} alreadyPaid={order.payment_status === 'paid'} />;
}
