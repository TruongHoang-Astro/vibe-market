'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ShieldCheck, Lock, X } from 'lucide-react';
import { formatPrice } from '@/lib/data/mock-data';
import { confirmMockPayment } from '@/app/actions/payment';

export default function MockPayClient({ orderId, total, alreadyPaid }: { orderId: string; total: number; alreadyPaid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handle = async (success: boolean) => {
    if (busy) return;
    setBusy(true);
    const res = await confirmMockPayment(orderId, success);
    if (res.error) { toast.error(res.error); setBusy(false); return; }
    if (success) { toast.success('Thanh toán thành công!'); router.push(`/orders?paid=${orderId}`); }
    else { toast('Đã hủy thanh toán'); router.push(`/orders?failed=${orderId}`); }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--gray-50)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-lg)', maxWidth: '440px', width: '100%', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #0b3d91, #1a5fc4)', padding: '24px 28px', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '18px' }}>
            <ShieldCheck size={22} /> Cổng thanh toán
          </div>
          <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>Môi trường giả lập (chưa cấu hình VNPay)</div>
        </div>

        <div style={{ padding: '28px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '6px' }}>Số tiền cần thanh toán</div>
            <div style={{ fontFamily: 'Playfair Display', fontSize: '38px', fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(total)}</div>
            <div style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '6px' }}>Mã đơn: <strong>{orderId}</strong></div>
          </div>

          {alreadyPaid ? (
            <div style={{ textAlign: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '12px', color: '#16a34a', fontWeight: 600 }}>
              Đơn này đã được thanh toán ✓
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => handle(true)} disabled={busy} className="btn-primary"
                style={{ justifyContent: 'center', padding: '14px', borderRadius: '12px', opacity: busy ? 0.7 : 1 }}>
                <Lock size={16} /> <span>{busy ? 'Đang xử lý...' : 'Xác nhận thanh toán'}</span>
              </button>
              <button onClick={() => handle(false)} disabled={busy}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--gray-200)', background: 'white', color: 'var(--gray-600)', fontWeight: 600, cursor: 'pointer' }}>
                <X size={16} /> Hủy thanh toán
              </button>
            </div>
          )}
          {alreadyPaid && (
            <button onClick={() => router.push('/orders')} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', marginTop: '16px' }}>
              <span>Về đơn hàng của tôi</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
