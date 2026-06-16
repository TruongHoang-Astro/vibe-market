'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronRight, MapPin, Truck, CreditCard, CheckCircle2, Wallet, Lock, ShoppingBag, Plus, Star, Phone, LogIn, Pencil } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { useUser } from '@/lib/supabase/use-user';
import { createClient } from '@/lib/supabase/client';
import { createOrder } from '@/app/actions/orders';
import { initiatePayment } from '@/app/actions/payment';
import { formatPrice } from '@/lib/data/mock-data';
import { SHIPPING_METHODS, computeShippingFee, FREE_SHIP_THRESHOLD } from '@/lib/shipping';
import AddressForm, { type AddressValue } from '@/components/address/AddressForm';
import { saveAddress } from '@/lib/save-address';
import { formatFullAddress } from '@/lib/vn-address';

interface SavedAddress {
  id: string; recipient: string; phone: string; address: string;
  ward: string | null; district: string | null; province: string; is_default: boolean;
}

const steps = ['Địa chỉ giao hàng', 'Phương thức vận chuyển', 'Thanh toán'];

const paymentMethods = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng', desc: 'COD - Trả tiền mặt khi nhận', icon: <Wallet size={20} /> },
  { id: 'online', label: 'Thanh toán online (VNPay)', desc: 'Thẻ ATM / Visa / QR qua cổng VNPay', icon: <CreditCard size={20} /> },
];


export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderDone, setOrderDone] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [placing, setPlacing] = useState(false);
  // Sổ địa chỉ giao hàng (chọn nhanh từ profile)
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [savingAddr, setSavingAddr] = useState(false);
  const { items, getTotalPrice, clearCart } = useCartStore();
  // Giỏ hàng nằm ở localStorage → chỉ render sau khi client mount để tránh hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Tải địa chỉ đã lưu của buyer
  const reloadAddresses = async () => {
    if (!user) { setLoadingAddr(false); return [] as SavedAddress[]; }
    const { data } = await createClient().from('addresses').select('*')
      .order('is_default', { ascending: false }).order('created_at', { ascending: false });
    const list = (data ?? []) as SavedAddress[];
    setAddresses(list);
    setLoadingAddr(false);
    return list;
  };
  useEffect(() => {
    (async () => {
      const list = await reloadAddresses();
      setSelectedAddrId((prev) => prev ?? (list.find((a) => a.is_default)?.id ?? list[0]?.id ?? null));
      setAddingNew(list.length === 0 && !!user);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSaveNewAddress = async (v: AddressValue) => {
    if (!user) { toast.error('Vui lòng đăng nhập'); router.push('/login'); return; }
    setSavingAddr(true);
    const { id, error } = await saveAddress(user.id, v);
    setSavingAddr(false);
    if (error || !id) { toast.error('Lưu địa chỉ thất bại'); return; }
    await reloadAddresses();
    setSelectedAddrId(id);
    setAddingNew(false);
    toast.success('Đã lưu địa chỉ');
    setStep(1); // sang bước vận chuyển
  };

  const subtotal = getTotalPrice();
  const shippingFee = computeShippingFee(shippingMethod, subtotal);
  const total = subtotal + shippingFee;

  const selectedAddr = addresses.find((a) => a.id === selectedAddrId) ?? null;

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đặt hàng');
      router.push('/login');
      return;
    }
    if (!selectedAddr) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      setStep(0);
      return;
    }
    if (items.length === 0) {
      toast.error('Giỏ hàng đang trống');
      return;
    }

    setPlacing(true);
    const fullAddress = formatFullAddress({
      recipient: selectedAddr.recipient, phone: selectedAddr.phone, street: selectedAddr.address,
      ward: selectedAddr.ward ?? '', district: selectedAddr.district ?? '', province: selectedAddr.province,
    });
    const provider: 'cod' | 'vnpay' = paymentMethod === 'online' ? 'vnpay' : 'cod';
    const { orderId: newId, paymentProvider, error } = await createOrder({
      items: items.map(i => ({ productId: i.productId, name: i.name, price: i.price, qty: i.quantity, image: i.image })),
      address: fullAddress,
      shippingMethod,
      paymentProvider: provider,
    });

    if (error || !newId) {
      setPlacing(false);
      toast.error(error || 'Đặt hàng thất bại, vui lòng thử lại');
      return;
    }
    clearCart();

    // Thanh toán online → chuyển tới cổng (VNPay thật hoặc trang giả lập)
    if (paymentProvider === 'vnpay') {
      const pay = await initiatePayment(newId);
      if (pay.error || !pay.url) {
        setPlacing(false);
        toast.error(pay.error || 'Không khởi tạo được thanh toán. Đơn đã tạo, bạn có thể thanh toán lại ở mục Đơn hàng.');
        router.push('/orders');
        return;
      }
      window.location.href = pay.url; // có thể là URL ngoài (cổng VNPay)
      return;
    }

    // COD → hoàn tất
    setPlacing(false);
    setOrderId(newId);
    setOrderDone(true);
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                      <h2 style={{ fontFamily: 'Playfair Display', fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MapPin size={22} style={{ color: 'var(--primary)' }} /> Địa Chỉ Giao Hàng
                      </h2>
                      <Link href="/profile/address" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Pencil size={13} /> Quản lý sổ địa chỉ
                      </Link>
                    </div>

                    {!user ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <LogIn size={40} style={{ color: 'var(--gray-300)', marginBottom: '12px' }} />
                        <p style={{ color: 'var(--gray-500)', marginBottom: '20px' }}>Đăng nhập để chọn địa chỉ đã lưu và đặt hàng nhanh hơn.</p>
                        <Link href="/login" className="btn-primary" style={{ borderRadius: '99px' }}><LogIn size={18} /> <span>Đăng nhập</span></Link>
                      </div>
                    ) : loadingAddr ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)' }}>Đang tải địa chỉ...</div>
                    ) : (addingNew || addresses.length === 0) ? (
                      <div>
                        {addresses.length > 0 && (
                          <button onClick={() => setAddingNew(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', marginBottom: '16px' }}>← Chọn địa chỉ đã lưu</button>
                        )}
                        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Thêm địa chỉ giao hàng mới</div>
                        <AddressForm onSave={handleSaveNewAddress} saving={savingAddr} showDefault submitLabel="Lưu & giao đến đây" />
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                          {addresses.map((a) => {
                            const sel = selectedAddrId === a.id;
                            return (
                              <div key={a.id} onClick={() => setSelectedAddrId(a.id)}
                                style={{ padding: '16px 18px', border: `2px solid ${sel ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius)', cursor: 'pointer', background: sel ? 'rgba(239,68,68,0.03)' : 'white', display: 'flex', gap: '14px', alignItems: 'flex-start', transition: 'all 0.2s' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${sel ? 'var(--primary)' : 'var(--gray-300)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                                  {sel && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{a.recipient}</span>
                                    <span style={{ color: 'var(--gray-400)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {a.phone}</span>
                                    {a.is_default && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(239,68,68,0.08)', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px' }}><Star size={10} fill="var(--primary)" /> Mặc định</span>}
                                  </div>
                                  <p style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: 1.5 }}>
                                    {a.address}{a.ward ? `, ${a.ward}` : ''}{a.district ? `, ${a.district}` : ''}, {a.province}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button onClick={() => setAddingNew(true)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', border: '1.5px dashed var(--gray-300)', borderRadius: 'var(--radius)', background: 'white', color: 'var(--gray-600)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginBottom: '20px' }}>
                          <Plus size={16} /> Giao đến địa chỉ khác
                        </button>
                        <motion.button whileHover={{ scale: selectedAddrId ? 1.02 : 1 }} whileTap={{ scale: selectedAddrId ? 0.97 : 1 }} onClick={() => selectedAddrId ? setStep(1) : toast.error('Vui lòng chọn địa chỉ giao hàng')}
                          className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', borderRadius: '12px', opacity: selectedAddrId ? 1 : 0.6 }}>
                          <span>Tiếp theo: Chọn vận chuyển</span>
                          <ChevronRight size={18} />
                        </motion.button>
                      </div>
                    )}
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
                    {subtotal >= FREE_SHIP_THRESHOLD && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: '14px', fontSize: '13px', color: '#15803d', fontWeight: 600 }}>
                        🎉 Đơn của bạn được <strong>miễn phí giao hàng tiêu chuẩn</strong>!
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {SHIPPING_METHODS.map(method => {
                        const fee = computeShippingFee(method.id, subtotal);
                        return (
                        <motion.div key={method.id} whileHover={{ scale: 1.01 }} onClick={() => setShippingMethod(method.id)}
                          style={{ padding: '18px 20px', border: `2px solid ${shippingMethod === method.id ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius)', cursor: 'pointer', background: shippingMethod === method.id ? 'rgba(239,68,68,0.03)' : 'white', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '24px' }}>{method.icon}</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--black)', marginBottom: '2px' }}>{method.label}</div>
                              <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Dự kiến: {method.eta}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontWeight: 800, fontSize: '16px', color: fee === 0 ? '#16a34a' : 'var(--black)' }}>
                              {fee === 0 ? 'Miễn phí' : formatPrice(fee)}
                            </span>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${shippingMethod === method.id ? 'var(--primary)' : 'var(--gray-300)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {shippingMethod === method.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />}
                            </div>
                          </div>
                        </motion.div>
                        );
                      })}
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

                    {/* Online payment note */}
                    {paymentMethod === 'online' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <Lock size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: 1.6 }}>
                          Bạn sẽ được chuyển tới <strong>cổng thanh toán VNPay</strong> để hoàn tất. Đơn hàng được tạo trước, đánh dấu <strong>đã thanh toán</strong> sau khi cổng xác nhận. Có thể thanh toán lại ở mục Đơn hàng nếu bị gián đoạn.
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
                        <span>{placing ? 'Đang xử lý...' : paymentMethod === 'online' ? `Thanh toán ${formatPrice(total)}` : `Đặt hàng — ${formatPrice(total)}`}</span>
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
                    <span style={{ color: shippingFee === 0 ? '#16a34a' : 'inherit' }}>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
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
