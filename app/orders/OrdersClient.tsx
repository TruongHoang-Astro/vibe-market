'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, XCircle, Star, RotateCcw, ShoppingBag, MessageCircle, LogIn, CreditCard, X, Upload, Undo2 } from 'lucide-react';
import { formatPrice } from '@/lib/data/mock-data';
import type { Order } from '@/lib/data/mock-data';
import { useChatStore } from '@/lib/store/chat-store';
import { useUser } from '@/lib/supabase/use-user';
import { createClient } from '@/lib/supabase/client';
import { initiatePayment } from '@/app/actions/payment';
import { cancelOrder } from '@/app/actions/orders';
import { createReturnRequest } from '@/app/actions/returns';
import { uploadChatMedia } from '@/app/actions/chat';

const returnReasons = ['Hàng lỗi / hư hỏng', 'Khác với mô tả', 'Thiếu hàng / sai sản phẩm', 'Hàng giả / kém chất lượng', 'Lý do khác'];
const returnBadge: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Đang xử lý trả hàng', color: '#d97706', bg: '#fef3c7' },
  approved: { label: 'Đã duyệt trả hàng',   color: '#16a34a', bg: '#f0fdf4' },
  rejected: { label: 'Từ chối trả hàng',    color: '#dc2626', bg: '#fee2e2' },
};

const paymentBadge: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: 'Đã thanh toán',  color: '#16a34a', bg: '#f0fdf4' },
  pending: { label: 'Chờ thanh toán', color: '#d97706', bg: '#fef3c7' },
  failed:  { label: 'Thanh toán lỗi', color: '#dc2626', bg: '#fee2e2' },
  unpaid:  { label: 'COD',            color: '#475569', bg: '#f1f5f9' },
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  pending:   { label: 'Chờ xác nhận', icon: <Clock size={14} />,        color: '#a16207', bg: '#fef9c3' },
  confirmed: { label: 'Đã xác nhận',  icon: <CheckCircle2 size={14} />, color: '#1d4ed8', bg: '#dbeafe' },
  shipping:  { label: 'Đang giao',    icon: <Truck size={14} />,        color: '#15803d', bg: '#dcfce7' },
  delivered: { label: 'Đã giao',      icon: <CheckCircle2 size={14} />, color: '#16a34a', bg: '#f0fdf4' },
  cancelled: { label: 'Đã hủy',       icon: <XCircle size={14} />,      color: '#dc2626', bg: '#fee2e2' },
};

const tabs = [
  { key: 'all',       label: 'Tất cả' },
  { key: 'pending',   label: 'Chờ xác nhận' },
  { key: 'shipping',  label: 'Đang giao' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'cancelled', label: 'Đã hủy' },
];

export default function OrdersClient({ orders, loggedIn }: { orders: Order[]; loggedIn: boolean }) {
  const router = useRouter();
  const { user, profile } = useUser();
  const [activeTab, setActiveTab] = useState('all');
  const [paying, setPaying] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [returns, setReturns] = useState<Record<string, string>>({}); // orderId → status
  const { openChat } = useChatStore();

  // Review modal
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({});
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [submittingReview, setSubmittingReview] = useState(false);

  // Return modal
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnDetail, setReturnDetail] = useState('');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Thông báo kết quả thanh toán (?paid / ?failed) — đọc trực tiếp để khỏi cần Suspense
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('paid')) toast.success('Thanh toán thành công! Đơn của bạn đang được xử lý.');
    else if (sp.get('failed')) toast.error('Thanh toán chưa hoàn tất. Bạn có thể thử thanh toán lại.');
  }, []);

  // Trạng thái yêu cầu trả hàng theo đơn
  const loadReturns = async () => {
    if (!user) return;
    const { data } = await createClient().from('return_requests').select('order_id, status').order('created_at', { ascending: false });
    const map: Record<string, string> = {};
    for (const r of (data ?? []) as { order_id: string; status: string }[]) if (!map[r.order_id]) map[r.order_id] = r.status;
    setReturns(map);
  };
  useEffect(() => { loadReturns(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const handlePay = async (orderId: string) => {
    if (paying) return;
    setPaying(orderId);
    const res = await initiatePayment(orderId);
    if (res.error || !res.url) { toast.error(res.error || 'Không khởi tạo được thanh toán'); setPaying(null); return; }
    window.location.href = res.url;
  };

  const handleCancel = async (orderId: string) => {
    if (cancelling) return;
    if (!window.confirm('Hủy đơn hàng này? Hành động không thể hoàn tác.')) return;
    setCancelling(orderId);
    const res = await cancelOrder(orderId);
    setCancelling(null);
    if (res.error) { toast.error(res.error); return; }
    toast.success('Đã hủy đơn hàng');
    router.refresh();
  };

  // ----- Review -----
  const openReview = (order: Order) => {
    setReviewOrder(order); setReviewRatings({}); setReviewComments({});
  };
  const submitReview = async () => {
    if (!reviewOrder || !user) return;
    const userName = profile?.full_name || user.email?.split('@')[0] || 'Người dùng';
    const rows = reviewOrder.products
      .filter((p) => p.productId && (reviewRatings[p.productId] ?? 0) > 0)
      .map((p) => ({ product_id: p.productId, user_id: user.id, user_name: userName, avatar: profile?.avatar_url ?? null, rating: reviewRatings[p.productId], comment: (reviewComments[p.productId] ?? '').trim() }));
    if (!rows.length) { toast.error('Vui lòng chọn số sao cho ít nhất 1 sản phẩm'); return; }
    setSubmittingReview(true);
    const { error } = await createClient().from('reviews').insert(rows);
    setSubmittingReview(false);
    if (error) { toast.error('Gửi đánh giá thất bại'); return; }
    toast.success('Cảm ơn đánh giá của bạn! 🌟');
    setReviewOrder(null);
  };

  // ----- Return -----
  const openReturn = (order: Order) => {
    setReturnOrder(order); setReturnReason(''); setReturnDetail(''); setReturnImages([]);
  };
  const handleReturnUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const { url, error } = await uploadChatMedia(ev.target?.result as string);
      if (error || !url) { toast.error('Tải ảnh thất bại'); return; }
      setReturnImages((prev) => [...prev, url]);
    };
    reader.readAsDataURL(file); e.target.value = '';
  };
  const submitReturn = async () => {
    if (!returnOrder) return;
    if (!returnReason) { toast.error('Vui lòng chọn lý do'); return; }
    setSubmittingReturn(true);
    const res = await createReturnRequest({ orderId: returnOrder.id, reason: returnReason, detail: returnDetail, images: returnImages });
    setSubmittingReturn(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success('Đã gửi yêu cầu trả hàng. Shop sẽ phản hồi sớm.');
    setReturnOrder(null);
    loadReturns();
  };

  const filtered = orders.filter(o => activeTab === 'all' || o.status === activeTab);

  // Thông tin shop (dữ liệu thật, đính kèm bởi getMyOrders) để mở chat
  const getShopInfo = (order: Order) => {
    if (!order.shopId) return null;
    return { id: order.shopId, name: order.shopName ?? 'Shop', logo: order.shopLogo ?? '' };
  };

  return (
    <div style={{ minHeight: '80vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div className="page-hero" style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a0000)', padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Trang chủ</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--primary)' }}>Đơn mua</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: 'white', marginBottom: '6px' }}>
            Đơn Hàng Của Tôi
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>{orders.length} đơn hàng</p>
        </div>
      </div>

      {/* Chưa đăng nhập */}
      {!loggedIn ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <LogIn size={56} style={{ color: 'var(--gray-300)', marginBottom: '16px' }} />
          <p style={{ fontWeight: 700, fontSize: '17px', marginBottom: '8px' }}>Bạn chưa đăng nhập</p>
          <p style={{ color: 'var(--gray-500)', marginBottom: '28px' }}>Đăng nhập để xem lịch sử đơn hàng của bạn</p>
          <Link href="/login" className="btn-primary" style={{ borderRadius: '99px' }}>
            <LogIn size={18} />
            <span>Đăng nhập</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Status tabs */}
          <div style={{ background: 'white', borderBottom: '1px solid var(--gray-100)', position: 'sticky', top: '70px', zIndex: 10 }}>
            <div className="container" style={{ padding: '0 24px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: '0', minWidth: 'max-content' }}>
                {tabs.map(tab => {
                  const count = tab.key === 'all' ? orders.length : orders.filter(o => o.status === tab.key).length;
                  return (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      style={{ padding: '16px 20px', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: activeTab === tab.key ? 700 : 400, color: activeTab === tab.key ? 'var(--primary)' : 'var(--gray-600)', borderBottom: `3px solid ${activeTab === tab.key ? 'var(--primary)' : 'transparent'}`, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {tab.label}
                      {count > 0 && (
                        <span style={{ background: activeTab === tab.key ? 'var(--primary)' : 'var(--gray-200)', color: activeTab === tab.key ? 'white' : 'var(--gray-600)', borderRadius: '99px', fontSize: '11px', fontWeight: 700, padding: '1px 7px', minWidth: '20px', textAlign: 'center' }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="container" style={{ padding: '24px 24px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <Package size={56} style={{ color: 'var(--gray-300)', marginBottom: '16px' }} />
                <p style={{ fontWeight: 700, fontSize: '17px', marginBottom: '8px' }}>Không có đơn hàng nào</p>
                <p style={{ color: 'var(--gray-500)', marginBottom: '28px' }}>Hãy mua sắm để có đơn hàng đầu tiên!</p>
                <Link href="/products" className="btn-primary" style={{ borderRadius: '99px' }}>
                  <ShoppingBag size={18} />
                  <span>Mua sắm ngay</span>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <AnimatePresence mode="popLayout">
                  {filtered.map((order, i) => {
                    const cfg = statusConfig[order.status];
                    return (
                      <motion.div key={order.id} layout
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', overflow: 'hidden' }}>
                        {/* Order header */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }}>{order.id}</span>
                            <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                              {new Date(order.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {returns[order.id] && returnBadge[returns[order.id]] && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '99px', background: returnBadge[returns[order.id]].bg, color: returnBadge[returns[order.id]].color, fontSize: '12px', fontWeight: 700 }}>
                                <Undo2 size={12} /> {returnBadge[returns[order.id]].label}
                              </div>
                            )}
                            {order.paymentStatus && paymentBadge[order.paymentStatus] && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '99px', background: paymentBadge[order.paymentStatus].bg, color: paymentBadge[order.paymentStatus].color, fontSize: '12px', fontWeight: 700 }}>
                                <CreditCard size={12} /> {paymentBadge[order.paymentStatus].label}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '99px', background: cfg.bg, color: cfg.color, fontSize: '12px', fontWeight: 700 }}>
                              {cfg.icon} {cfg.label}
                            </div>
                          </div>
                        </div>

                        {/* Products */}
                        <div style={{ padding: '16px 20px' }}>
                          {order.products.map((p, pi) => (
                            <div key={pi} style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: pi < order.products.length - 1 ? '12px' : 0, marginBottom: pi < order.products.length - 1 ? '12px' : 0, borderBottom: pi < order.products.length - 1 ? '1px dashed var(--gray-100)' : 'none' }}>
                              <div style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--gray-100)' }}>
                                <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p className="line-clamp-2" style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{p.name}</p>
                                <p style={{ fontSize: '12px', color: 'var(--gray-400)' }}>x{p.qty} · {formatPrice(p.price)}/sp</p>
                              </div>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)', flexShrink: 0 }}>
                                {formatPrice(p.price * p.qty)}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order footer */}
                        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--gray-100)', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                              Thanh toán: <strong style={{ color: 'var(--black)' }}>{order.paymentMethod}</strong>
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                              Giao đến: <strong style={{ color: 'var(--black)' }}>{order.address.split(',')[0]}</strong>
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Tổng cộng</div>
                              <div style={{ fontFamily: 'Playfair Display', fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                                {formatPrice(order.total)}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {/* Chat với shop */}
                              {(() => {
                                const shopInfo = getShopInfo(order);
                                return shopInfo ? (
                                  <motion.button whileHover={{ scale: 1.03 }} onClick={() => openChat(shopInfo.id, shopInfo.name, shopInfo.logo)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'rgba(239,68,68,0.06)', border: '2px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                                    <MessageCircle size={14} /> Chat shop
                                  </motion.button>
                                ) : null;
                              })()}

                              {/* Thanh toán lại cho đơn online chưa thanh toán */}
                              {order.paymentProvider && order.paymentProvider !== 'cod' && (order.paymentStatus === 'pending' || order.paymentStatus === 'failed') && order.status !== 'cancelled' && (
                                <motion.button whileHover={{ scale: 1.03 }} onClick={() => handlePay(order.id)} disabled={paying === order.id}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'linear-gradient(135deg, #0b3d91, #1a5fc4)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: paying === order.id ? 0.7 : 1 }}>
                                  <CreditCard size={14} /> {paying === order.id ? 'Đang mở...' : 'Thanh toán'}
                                </motion.button>
                              )}
                              {order.status === 'delivered' && (
                                <motion.button whileHover={{ scale: 1.03 }} onClick={() => openReview(order)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'white', border: '2px solid var(--primary)', borderRadius: '10px', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                                  <Star size={14} /> Đánh giá
                                </motion.button>
                              )}
                              {(order.status === 'delivered' || order.status === 'shipping') && !returns[order.id] && (
                                <motion.button whileHover={{ scale: 1.03 }} onClick={() => openReturn(order)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'white', border: '2px solid var(--gray-200)', borderRadius: '10px', color: 'var(--gray-600)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                                  <Undo2 size={14} /> Trả hàng
                                </motion.button>
                              )}
                              {(order.status === 'pending' || order.status === 'confirmed') && (
                                <motion.button whileHover={{ scale: 1.03 }} onClick={() => handleCancel(order.id)} disabled={cancelling === order.id}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#fff5f5', border: '2px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: cancelling === order.id ? 0.6 : 1 }}>
                                  <XCircle size={14} /> {cancelling === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                                </motion.button>
                              )}
                              <Link href="/products">
                                <motion.button whileHover={{ scale: 1.03 }} className="btn-primary"
                                  style={{ padding: '9px 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <RotateCcw size={14} />
                                  <span>Mua lại</span>
                                </motion.button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── REVIEW MODAL ── */}
      <AnimatePresence>
        {reviewOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReviewOrder(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}
              style={{ background: 'white', borderRadius: '20px', padding: '28px', width: '520px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: '20px', fontWeight: 800 }}>Đánh giá sản phẩm</h2>
                <button onClick={() => setReviewOrder(null)} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {reviewOrder.products.map((p, i) => (
                  <div key={i} style={{ borderBottom: i < reviewOrder.products.length - 1 ? '1px solid var(--gray-100)' : 'none', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                      <img src={p.image} alt={p.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                      <span className="line-clamp-2" style={{ fontSize: '13px', fontWeight: 500, flex: 1 }}>{p.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => p.productId && setReviewRatings((prev) => ({ ...prev, [p.productId]: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <Star size={24} fill={s <= (reviewRatings[p.productId] ?? 0) ? '#f59e0b' : '#e5e5e5'} color={s <= (reviewRatings[p.productId] ?? 0) ? '#f59e0b' : '#e5e5e5'} />
                        </button>
                      ))}
                    </div>
                    <input value={reviewComments[p.productId] ?? ''} onChange={(e) => p.productId && setReviewComments((prev) => ({ ...prev, [p.productId]: e.target.value }))}
                      placeholder="Nhận xét về sản phẩm (tuỳ chọn)..." className="input-base" />
                  </div>
                ))}
                <button onClick={submitReview} disabled={submittingReview} className="btn-primary" style={{ justifyContent: 'center', padding: '12px', borderRadius: '10px', opacity: submittingReview ? 0.7 : 1 }}>
                  <Star size={16} /> <span>{submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RETURN MODAL ── */}
      <AnimatePresence>
        {returnOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReturnOrder(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}
              style={{ background: 'white', borderRadius: '20px', padding: '28px', width: '480px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: '20px', fontWeight: 800 }}>Trả hàng / Hoàn tiền</h2>
                <button onClick={() => setReturnOrder(null)} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '18px' }}>Đơn <strong style={{ color: 'var(--primary)' }}>{returnOrder.id}</strong></p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Lý do *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {returnReasons.map((r) => (
                      <button key={r} onClick={() => setReturnReason(r)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: `2px solid ${returnReason === r ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: '10px', background: returnReason === r ? 'rgba(239,68,68,0.03)' : 'white', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: returnReason === r ? 600 : 400 }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${returnReason === r ? 'var(--primary)' : 'var(--gray-300)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {returnReason === r && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}
                        </div>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea value={returnDetail} onChange={(e) => setReturnDetail(e.target.value)} placeholder="Mô tả chi tiết vấn đề (tuỳ chọn)..."
                  style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--gray-200)', borderRadius: '8px', fontSize: '14px', fontFamily: 'Inter', resize: 'vertical', minHeight: '80px', outline: 'none' }} />
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Ảnh minh chứng (tuỳ chọn)</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {returnImages.map((img, i) => (
                      <img key={i} src={img} alt="" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--gray-200)' }} />
                    ))}
                    <label style={{ width: '64px', height: '64px', border: '2px dashed var(--gray-300)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--gray-400)', gap: '2px' }}>
                      <Upload size={18} />
                      <span style={{ fontSize: '10px' }}>Ảnh</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleReturnUpload} />
                    </label>
                  </div>
                </div>
                <button onClick={submitReturn} disabled={submittingReturn} className="btn-primary" style={{ justifyContent: 'center', padding: '12px', borderRadius: '10px', opacity: submittingReturn ? 0.7 : 1 }}>
                  <Undo2 size={16} /> <span>{submittingReturn ? 'Đang gửi...' : 'Gửi yêu cầu trả hàng'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
