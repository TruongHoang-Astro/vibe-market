'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, XCircle, Star, RotateCcw, ShoppingBag, MessageCircle, LogIn } from 'lucide-react';
import { formatPrice } from '@/lib/data/mock-data';
import type { Order } from '@/lib/data/mock-data';
import { useChatStore } from '@/lib/store/chat-store';

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
  const [activeTab, setActiveTab] = useState('all');
  const { openChat } = useChatStore();

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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '99px', background: cfg.bg, color: cfg.color, fontSize: '12px', fontWeight: 700 }}>
                            {cfg.icon} {cfg.label}
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

                              {order.status === 'delivered' && (
                                <motion.button whileHover={{ scale: 1.03 }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'white', border: '2px solid var(--primary)', borderRadius: '10px', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                                  <Star size={14} /> Đánh giá
                                </motion.button>
                              )}
                              {(order.status === 'pending' || order.status === 'confirmed') && (
                                <motion.button whileHover={{ scale: 1.03 }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#fff5f5', border: '2px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                                  <XCircle size={14} /> Hủy đơn
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
    </div>
  );
}
