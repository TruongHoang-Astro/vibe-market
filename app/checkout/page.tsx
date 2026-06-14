'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronRight, MapPin, Truck, CreditCard, CheckCircle2, Wallet, Smartphone, Building, ChevronDown, Lock, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { useUser } from '@/lib/supabase/use-user';
import { createOrder } from '@/app/actions/orders';
import { formatPrice } from '@/lib/data/mock-data';

// Nhãn phương thức thanh toán lưu vào DB
const paymentLabels: Record<string, string> = {
  cod: 'COD', card: 'Thẻ ngân hàng', momo: 'MoMo', zalopay: 'ZaloPay', bank: 'Chuyển khoản',
};

const steps = ['Địa chỉ giao hàng', 'Phương thức vận chuyển', 'Thanh toán'];

const shippingMethods = [
  { id: 'standard', label: 'Giao hàng tiêu chuẩn', time: '2-3 ngày', price: 30000, icon: '📦' },
  { id: 'express', label: 'Giao hàng nhanh', time: '1 ngày', price: 60000, icon: '⚡' },
  { id: 'same-day', label: 'Giao trong ngày', time: 'Hôm nay (trước 22h)', price: 100000, icon: '🚀' },
];

const paymentMethods = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng', desc: 'COD - Trả tiền mặt khi nhận', icon: <Wallet size={20} /> },
  { id: 'card', label: 'Thẻ ngân hàng', desc: 'Visa, Mastercard, JCB', icon: <CreditCard size={20} /> },
  { id: 'momo', label: 'Ví MoMo', desc: 'Thanh toán qua ứng dụng MoMo', icon: <Smartphone size={20} /> },
  { id: 'zalopay', label: 'ZaloPay', desc: 'Thanh toán qua ZaloPay', icon: <Smartphone size={20} /> },
  { id: 'bank', label: 'Chuyển khoản ngân hàng', desc: 'ATM / Internet Banking', icon: <Building size={20} /> },
];

const provinces = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Biên Hòa', 'Nha Trang', 'Huế'];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderDone, setOrderDone] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', province: '', district: '', note: '' });
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const { items, getTotalPrice, clearCart } = useCartStore();
  // Giỏ hàng nằm ở localStorage → chỉ render sau khi client mount để tránh hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const subtotal = getTotalPrice();
  const selectedShipping = shippingMethods.find(s => s.id === shippingMethod)!;
  const total = subtotal + selectedShipping.price;

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đặt hàng');
      router.push('/login');
      return;
    }
    if (!form.name || !form.phone || !form.address || !form.province) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
      setStep(0);
      return;
    }
    if (items.length === 0) {
      toast.error('Giỏ hàng đang trống');
      return;
    }

    setPlacing(true);
    const fullAddress = `${form.address}, ${form.district}, ${form.province}`;
    const { orderId: newId, error } = await createOrder({
      items: items.map(i => ({ productId: i.productId, name: i.name, price: i.price, qty: i.quantity, image: i.image })),
      address: fullAddress,
      paymentMethod: paymentLabels[paymentMethod] || paymentMethod,
      shippingFee: selectedShipping.price,
    });
    setPlacing(false);

    if (error || !newId) {
      toast.error(error || 'Đặt hàng thất bại, vui lòng thử lại');
      return;
    }
    setOrderId(newId);
    setOrderDone(true);
    clearCart();
  };

  if (!mounted) {
    return <div style={{ minHeight: '70vh' }} />;
  }

  if (orderDone) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15, stiffness: 200 }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={56} color="white" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '36px', fontWeight: 800, marginBottom: '12px', color: 'var(--black)' }}>Đặt Hàng Thành Công!</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '16px', marginBottom: '8px' }}>Cảm ơn bạn đã mua sắm tại Vibe Market</p>
          <p style={{ color: 'var(--gray-400)', fontSize: '14px', marginBottom: '36px' }}>Mã đơn hàng: <strong style={{ color: 'var(--primary)' }}>{orderId}</strong></p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/orders" className="btn-primary" style={{ borderRadius: '99px', fontSize: '15px' }}>
              <span>Xem đơn hàng của tôi</span>
            </Link>
            <Link href="/products" className="btn-outline" style={{ borderRadius: '99px', fontSize: '15px' }}>
              Tiếp tục mua sắm
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
        <h2 style={{ fontFamily: 'Playfair Display', fontSize: '26px', fontWeight: 800, marginBottom: '10px' }}>Giỏ hàng trống</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: '28px' }}>Hãy thêm sản phẩm trước khi thanh toán nhé!</p>
        <Link href="/products" className="btn-primary" style={{ borderRadius: '99px', fontSize: '15px', padding: '14px 32px' }}>
          <ShoppingBag size={18} /> <span>Mua sắm ngay</span>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--gray-100)', padding: '20px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '16px' }}>
            <Link href="/cart" style={{ color: 'var(--gray-500)', textDecoration: 'none' }}>Giỏ hàng</Link>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--primary)' }}>Thanh toán</span>
          </div>
          {/* Progress stepper */}
          <div style={{ display: 'flex', alignItems: 'center', maxWidth: '600px' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: i < step ? 'pointer' : 'default' }} onClick={() => i < step && setStep(i)}>
                  <div className={`step-circle ${i === step ? 'active' : i < step ? 'done' : 'pending'}`}>
                    {i < step ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: i === step ? 700 : 400, color: i === step ? 'var(--primary)' : i < step ? 'var(--gray-700)' : 'var(--gray-400)', whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < steps.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} style={{ margin: '0 12px', marginBottom: '20px' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
          {/* Form area */}
          <div>
            <AnimatePresence mode="wait">
              {/* Step 0: Address */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '28px' }}>
                    <h2 style={{ fontFamily: 'Playfair Display', fontSize: '22px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MapPin size={22} style={{ color: 'var(--primary)' }} /> Địa Chỉ Giao Hàng
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>Họ và tên *</label>
                        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nguyễn Văn A" className="input-base" />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>Số điện thoại *</label>
                        <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0901 234 567" className="input-base" />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>Email</label>
                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="input-base" />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>Tỉnh / Thành phố *</label>
                        <div style={{ position: 'relative' }}>
                          <select value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} className="input-base" style={{ appearance: 'none', cursor: 'pointer' }}>
                            <option value="">Chọn tỉnh/thành...</option>
                            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--gray-400)' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>Quận / Huyện *</label>
                        <input type="text" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="Quận 1" className="input-base" />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>Địa chỉ cụ thể *</label>
                        <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Số nhà, tên đường, phường/xã..." className="input-base" />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>Ghi chú (tuỳ chọn)</label>
                        <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Ghi chú thêm cho người giao hàng..." style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: '15px', fontFamily: 'Inter', resize: 'vertical', minHeight: '80px', outline: 'none' }} onFocus={e => (e.target.style.borderColor = 'var(--primary)')} onBlur={e => (e.target.style.borderColor = 'var(--gray-200)')} />
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setStep(1)}
                      className="btn-primary" style={{ marginTop: '24px', width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', borderRadius: '12px' }}>
                      <span>Tiếp theo: Chọn vận chuyển</span>
                      <ChevronRight size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Shipping */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '28px' }}>
                    <h2 style={{ fontFamily: 'Playfair Display', fontSize: '22px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Truck size={22} style={{ color: 'var(--primary)' }} /> Phương Thức Vận Chuyển
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {shippingMethods.map(method => (
                        <motion.div key={method.id} whileHover={{ scale: 1.01 }} onClick={() => setShippingMethod(method.id)}
                          style={{ padding: '18px 20px', border: `2px solid ${shippingMethod === method.id ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius)', cursor: 'pointer', background: shippingMethod === method.id ? 'rgba(239,68,68,0.03)' : 'white', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '24px' }}>{method.icon}</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--black)', marginBottom: '2px' }}>{method.label}</div>
                              <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Dự kiến: {method.time}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontWeight: 800, fontSize: '16px', color: method.price === 0 ? '#16a34a' : 'var(--black)' }}>
                              {method.price === 0 ? 'Miễn phí' : formatPrice(method.price)}
                            </span>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${shippingMethod === method.id ? 'var(--primary)' : 'var(--gray-300)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {shippingMethod === method.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                      <button onClick={() => setStep(0)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '14px' }}>
                        Quay lại
                      </button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setStep(2)}
                        className="btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '14px', fontSize: '15px', borderRadius: '12px' }}>
                        <span>Tiếp theo: Thanh toán</span>
                        <ChevronRight size={18} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '28px' }}>
                    <h2 style={{ fontFamily: 'Playfair Display', fontSize: '22px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CreditCard size={22} style={{ color: 'var(--primary)' }} /> Phương Thức Thanh Toán
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                      {paymentMethods.map(method => (
                        <div key={method.id} onClick={() => setPaymentMethod(method.id)}
                          style={{ padding: '16px 18px', border: `2px solid ${paymentMethod === method.id ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius)', cursor: 'pointer', background: paymentMethod === method.id ? 'rgba(239,68,68,0.03)' : 'white', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ color: paymentMethod === method.id ? 'var(--primary)' : 'var(--gray-500)' }}>{method.icon}</span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '1px' }}>{method.label}</div>
                              <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{method.desc}</div>
                            </div>
                          </div>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${paymentMethod === method.id ? 'var(--primary)' : 'var(--gray-300)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {paymentMethod === method.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Card form */}
                    {paymentMethod === 'card' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--gray-600)', fontWeight: 600 }}>
                          <Lock size={14} style={{ color: 'var(--primary)' }} /> Thông tin bảo mật 256-bit SSL
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: '6px' }}>Số thẻ</label>
                            <input type="text" value={cardForm.number} onChange={e => setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() })} placeholder="1234 5678 9012 3456" className="input-base" style={{ fontFamily: 'monospace' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: '6px' }}>Tên chủ thẻ</label>
                            <input type="text" value={cardForm.name} onChange={e => setCardForm({ ...cardForm, name: e.target.value.toUpperCase() })} placeholder="NGUYEN VAN A" className="input-base" />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: '6px' }}>Ngày hết hạn</label>
                              <input type="text" value={cardForm.expiry} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setCardForm({ ...cardForm, expiry: v.length >= 2 ? v.slice(0, 2) + '/' + v.slice(2) : v }); }} placeholder="MM/YY" className="input-base" />
                            </div>
                            <div>
                              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: '6px' }}>CVV</label>
                              <input type="password" value={cardForm.cvv} onChange={e => setCardForm({ ...cardForm, cvv: e.target.value.slice(0, 3) })} placeholder="•••" className="input-base" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setStep(1)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '14px' }}>
                        Quay lại
                      </button>
                      <motion.button whileHover={{ scale: placing ? 1 : 1.02 }} whileTap={{ scale: placing ? 1 : 0.97 }} onClick={handlePlaceOrder} disabled={placing}
                        className="btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '14px', fontSize: '15px', borderRadius: '12px', opacity: placing ? 0.7 : 1, cursor: placing ? 'wait' : 'pointer' }}>
                        <Lock size={16} />
                        <span>{placing ? 'Đang xử lý...' : `Xác nhận đặt hàng — ${formatPrice(total)}`}</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order summary sidebar */}
          <div style={{ position: 'sticky', top: '90px' }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)' }}>
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', fontWeight: 800 }}>Đơn Hàng Của Bạn</h3>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {items.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={item.image} alt={item.name} style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="line-clamp-2" style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>{item.name}</p>
                        {item.size && <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Size: {item.size}</span>}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--gray-100)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Phí vận chuyển</span>
                    <span>{formatPrice(selectedShipping.price)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '2px solid var(--gray-100)' }}>
                  <span style={{ fontWeight: 800, fontSize: '15px' }}>Tổng cộng</span>
                  <span style={{ fontFamily: 'Playfair Display', fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
