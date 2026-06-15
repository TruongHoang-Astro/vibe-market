'use client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, Tag, ChevronRight, Gift, Truck, MessageCircle, Store } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { useChatStore } from '@/lib/store/chat-store';
import { formatPrice } from '@/lib/data/mock-data';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const { openChat } = useChatStore();
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 299000 ? 0 : 30000;
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + shipping - discount;

  const handleCoupon = () => {
    if (couponCode.toUpperCase() === 'VIBE10') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Mã giảm giá không hợp lệ');
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}>
          <div style={{ fontSize: '80px', marginBottom: '8px', textAlign: 'center' }}>🛒</div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>Giỏ hàng trống</h2>
          <p style={{ color: 'var(--gray-500)', textAlign: 'center', marginBottom: '32px' }}>Hãy thêm sản phẩm yêu thích vào giỏ hàng!</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link href="/products" className="btn-primary" style={{ borderRadius: '99px', fontSize: '16px', padding: '14px 32px' }}>
              <ShoppingCart size={18} />
              <span>Bắt đầu mua sắm</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--gray-100)', padding: '20px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>
            <Link href="/" style={{ color: 'var(--gray-500)', textDecoration: 'none' }}>Trang chủ</Link>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--primary)' }}>Giỏ hàng</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '28px', fontWeight: 800 }}>
            Giỏ Hàng Của Tôi <span style={{ fontFamily: 'Inter', fontSize: '16px', fontWeight: 400, color: 'var(--gray-400)' }}>({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
          </h1>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
          {/* Cart items */}
          <div>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-700)' }}>SẢN PHẨM</span>
                <button onClick={clearCart} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onMouseEnter={e => ((e.target as HTMLElement).closest('button')!.style.color = '#ef4444')}
                  onMouseLeave={e => ((e.target as HTMLElement).closest('button')!.style.color = 'var(--gray-400)')}>
                  <Trash2 size={14} /> Xóa tất cả
                </button>
              </div>

              {/* Group items by shop */}
              {Object.entries(
                items.reduce<Record<string, { shopId: string; shopName: string; items: typeof items }>>((acc, item) => {
                  if (!acc[item.shopId]) acc[item.shopId] = { shopId: item.shopId, shopName: item.shopName, items: [] };
                  acc[item.shopId].items.push(item);
                  return acc;
                }, {})
              ).map(([shopId, group]) => {
                return (
                  <div key={shopId} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    {/* Shop header row */}
                    <div style={{ padding: '12px 24px', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--gray-100)' }}>
                      <Store size={14} style={{ color: 'var(--primary)' }} />
                      <Link href={`/shop/${shopId}`} style={{ textDecoration: 'none', fontWeight: 700, fontSize: '13px', color: 'var(--primary)', flex: 1 }}>
                        {group.shopName}
                      </Link>
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => openChat(shopId, group.shopName, '')}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', background: 'white', border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: '99px', color: 'var(--primary)', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                        <MessageCircle size={13} /> Chat shop
                      </motion.button>
                    </div>

                    {/* Shop's items */}
                    <AnimatePresence>
                      {group.items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -60, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ padding: '20px 24px', borderBottom: i < items.length - 1 ? '1px solid var(--gray-100)' : 'none' }}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {/* Image */}
                      <Link href={`/products/${item.productId}`}>
                        <div style={{ width: '88px', height: '88px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </Link>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/products/${item.productId}`} style={{ textDecoration: 'none' }}>
                          <h3 className="line-clamp-2" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--black)', marginBottom: '6px' }}>{item.name}</h3>
                        </Link>
                        <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>{item.shopName}</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {item.color && <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.color, display: 'inline-block', border: '1px solid var(--gray-200)' }} /> {item.color}</span>}
                          {item.size && <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Size: {item.size}</span>}
                        </div>
                      </div>
                      {/* Price */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)', marginBottom: '12px' }}>
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        {/* Quantity control */}
                        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--gray-200)', borderRadius: '10px', overflow: 'hidden', width: 'fit-content', marginLeft: 'auto' }}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            style={{ padding: '6px 12px', background: 'var(--gray-50)', border: 'none', cursor: 'pointer', color: 'var(--gray-600)' }}
                            onMouseEnter={e => ((e.target as HTMLButtonElement).style.background = 'var(--gray-200)')}
                            onMouseLeave={e => ((e.target as HTMLButtonElement).style.background = 'var(--gray-50)')}>
                            <Minus size={14} />
                          </button>
                          <span style={{ padding: '6px 14px', fontWeight: 700, fontSize: '15px', minWidth: '42px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            style={{ padding: '6px 12px', background: 'var(--gray-50)', border: 'none', cursor: 'pointer', color: 'var(--gray-600)' }}
                            onMouseEnter={e => ((e.target as HTMLButtonElement).style.background = 'var(--gray-200)')}
                            onMouseLeave={e => ((e.target as HTMLButtonElement).style.background = 'var(--gray-50)')}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      {/* Remove */}
                      <motion.button whileHover={{ scale: 1.1 }} onClick={() => removeItem(item.id)}
                        style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-300)', borderRadius: '8px', transition: 'all 0.2s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-300)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Continue shopping */}
            <div style={{ marginTop: '16px' }}>
              <Link href="/products" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 600, fontSize: '14px' }}>
                <ArrowLeft size={16} />
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>

          {/* Order summary */}
          <div style={{ position: 'sticky', top: '90px' }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)' }}>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: '20px', fontWeight: 800 }}>Tóm Tắt Đơn Hàng</h2>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {/* Coupon */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Tag size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        placeholder="Mã giảm giá..."
                        disabled={couponApplied}
                        style={{ width: '100%', padding: '11px 12px 11px 34px', border: `1.5px solid ${couponError ? '#ef4444' : couponApplied ? '#16a34a' : 'var(--gray-200)'}`, borderRadius: '10px', fontSize: '13px', fontFamily: 'Inter', outline: 'none', background: couponApplied ? '#f0fdf4' : 'white' }}
                      />
                    </div>
                    <button onClick={handleCoupon} disabled={couponApplied || !couponCode}
                      style={{ padding: '0 16px', background: couponApplied ? '#16a34a' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: couponApplied ? 'default' : 'pointer', opacity: !couponCode && !couponApplied ? 0.5 : 1 }}>
                      {couponApplied ? '✓' : 'Áp dụng'}
                    </button>
                  </div>
                  {couponError && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{couponError}</p>}
                  {couponApplied && <p style={{ color: '#16a34a', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>✓ Giảm 10% đã được áp dụng! (Thử: VIBE10)</p>}
                  {!couponApplied && !couponError && <p style={{ color: 'var(--gray-400)', fontSize: '12px', marginTop: '4px' }}>Thử mã: VIBE10</p>}
                </div>

                {/* Summary lines */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Tạm tính ({items.reduce((s, i) => s + i.quantity, 0)} sp)</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={14} /> Phí vận chuyển</span>
                    <span style={{ fontWeight: 600, color: shipping === 0 ? '#16a34a' : 'inherit' }}>
                      {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
                    </span>
                  </div>
                  {couponApplied && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}><Gift size={14} /> Giảm giá (VIBE10)</span>
                      <span style={{ fontWeight: 600, color: '#16a34a' }}>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  {shipping === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '8px', fontSize: '13px', color: '#16a34a' }}>
                      <Truck size={14} />
                      <span>🎉 Đủ điều kiện miễn phí vận chuyển!</span>
                    </div>
                  )}
                  {shipping > 0 && (
                    <div style={{ padding: '10px 12px', background: '#fef9f0', borderRadius: '8px', fontSize: '13px', color: '#92400e' }}>
                      Thêm {formatPrice(299000 - subtotal)} để được miễn phí vận chuyển
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '2px solid var(--gray-100)', paddingTop: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px' }}>Tổng cộng</span>
                    <span style={{ fontFamily: 'Playfair Display', fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(total)}</span>
                  </div>
                </div>

                <Link href="/checkout" style={{ textDecoration: 'none' }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '16px', borderRadius: '14px' }}>
                    <span>Tiến hành thanh toán</span>
                    <ChevronRight size={18} />
                  </motion.button>
                </Link>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                  {['💳 Thẻ ngân hàng', '🏦 COD', '📱 MoMo', '💰 ZaloPay'].map(method => (
                    <span key={method} style={{ fontSize: '11px', color: 'var(--gray-400)', padding: '4px 10px', background: 'var(--gray-50)', borderRadius: '99px' }}>{method}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
