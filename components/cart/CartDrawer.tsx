'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingCart, ShoppingBag, Truck, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice } from '@/lib/data/mock-data';

const FREE_SHIP_THRESHOLD = 299000;

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const subtotal = getTotalPrice();
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeCart}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 60 }}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', maxWidth: '92vw', background: 'white', zIndex: 61, display: 'flex', flexDirection: 'column', boxShadow: '-16px 0 48px rgba(0,0,0,0.18)' }}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingCart size={22} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: '20px', fontWeight: 800 }}>
                  Giỏ Hàng <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 400, color: 'var(--gray-400)' }}>({totalItems})</span>
                </h2>
              </div>
              <button onClick={closeCart} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gray-50)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600)' }}>
                <X size={18} />
              </button>
            </div>

            {items.length === 0 ? (
              /* Empty state */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px' }}>
                <div style={{ fontSize: '64px' }}>🛒</div>
                <p style={{ fontWeight: 700, fontSize: '17px' }}>Giỏ hàng trống</p>
                <p style={{ color: 'var(--gray-500)', fontSize: '14px', textAlign: 'center' }}>Thêm sản phẩm yêu thích để bắt đầu mua sắm</p>
                <Link href="/products" onClick={closeCart} className="btn-primary" style={{ borderRadius: '99px', marginTop: '8px' }}>
                  <ShoppingBag size={18} />
                  <span>Khám phá sản phẩm</span>
                </Link>
              </div>
            ) : (
              <>
                {/* Free-ship progress */}
                <div style={{ padding: '14px 24px', background: remaining === 0 ? '#f0fdf4' : '#fff9f0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: remaining === 0 ? '#16a34a' : '#92400e', marginBottom: '8px' }}>
                    <Truck size={15} />
                    {remaining === 0
                      ? <span>🎉 Bạn được <strong>miễn phí vận chuyển</strong>!</span>
                      : <span>Mua thêm <strong>{formatPrice(remaining)}</strong> để được miễn phí ship</span>}
                  </div>
                  <div style={{ height: '5px', background: 'var(--gray-200)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100)}%`, background: remaining === 0 ? 'linear-gradient(90deg, #16a34a, #22c55e)' : 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '99px', transition: 'width 0.4s' }} />
                  </div>
                </div>

                {/* Items list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                  <AnimatePresence initial={false}>
                    {items.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, x: -40, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ display: 'flex', gap: '12px', padding: '16px 24px', alignItems: 'center' }}
                      >
                        <Link href={`/products/${item.productId}`} onClick={closeCart} style={{ flexShrink: 0 }}>
                          <div style={{ width: '72px', height: '72px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-100)' }}>
                            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        </Link>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link href={`/products/${item.productId}`} onClick={closeCart} style={{ textDecoration: 'none' }}>
                            <p className="line-clamp-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--black)', marginBottom: '2px' }}>{item.name}</p>
                          </Link>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            {item.color && <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, border: '1px solid var(--gray-200)' }} />{item.color}</span>}
                            {item.size && <span style={{ fontSize: '11px', color: 'var(--gray-500)' }}>Size: {item.size}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--gray-200)', borderRadius: '8px', overflow: 'hidden' }}>
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '4px 8px', background: 'var(--gray-50)', border: 'none', cursor: 'pointer', color: 'var(--gray-600)', display: 'flex' }}>
                                <Minus size={13} />
                              </button>
                              <span style={{ padding: '4px 10px', fontWeight: 700, fontSize: '13px', minWidth: '32px', textAlign: 'center' }}>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '4px 8px', background: 'var(--gray-50)', border: 'none', cursor: 'pointer', color: 'var(--gray-600)', display: 'flex' }}>
                                <Plus size={13} />
                              </button>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary)' }}>{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} style={{ alignSelf: 'flex-start', padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-300)', borderRadius: '6px' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-300)'; }}>
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div style={{ padding: '20px 24px', borderTop: '1px solid var(--gray-100)', boxShadow: '0 -8px 24px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gray-600)' }}>Tạm tính</span>
                    <span style={{ fontFamily: 'Playfair Display', fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href="/cart" onClick={closeCart} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '13px', borderRadius: '12px', fontSize: '14px' }}>
                      Xem giỏ hàng
                    </Link>
                    <Link href="/checkout" onClick={closeCart} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '13px', borderRadius: '12px', fontSize: '14px' }}>
                      <span>Thanh toán</span>
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
