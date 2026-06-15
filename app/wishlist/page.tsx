'use client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Trash2, Star, ChevronRight, ShoppingBag } from 'lucide-react';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice, formatNumber } from '@/lib/data/mock-data';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function WishlistPage() {
  const { items, removeItem, clear } = useWishlistStore();
  const { addItem, openCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const handleAddToCart = async (item: typeof items[0]) => {
    // Lấy shopId thật của sản phẩm từ DB
    const { data } = await createClient().from('products').select('shop_id').eq('id', item.productId).maybeSingle();
    addItem({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      shopId: data?.shop_id || 'unknown',
      shopName: item.shopName,
    });
    openCart();
    toast.success('Đã thêm vào giỏ hàng!', {
      description: item.name,
      duration: 2500,
    });
  };

  return (
    <div style={{ minHeight: '80vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div className="page-hero" style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a0000)', padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Trang chủ</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--primary)' }}>Yêu thích</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: 'white', marginBottom: '6px' }}>
                Sản Phẩm Yêu Thích
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>{items.length} sản phẩm</p>
            </div>
            {items.length > 0 && (
              <button onClick={() => { clear(); toast.success('Đã xóa tất cả yêu thích'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '99px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                <Trash2 size={14} /> Xóa tất cả
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        {items.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '72px', marginBottom: '16px' }}>💝</div>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '26px', fontWeight: 800, marginBottom: '10px' }}>
              Chưa có sản phẩm yêu thích
            </h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: '32px', fontSize: '15px' }}>
              Bấm vào trái tim ❤️ trên sản phẩm để lưu vào đây
            </p>
            <Link href="/products" className="btn-primary" style={{ borderRadius: '99px', fontSize: '15px', padding: '14px 32px' }}>
              <ShoppingBag size={18} />
              <span>Khám phá sản phẩm</span>
            </Link>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            <AnimatePresence>
              {items.map((item, i) => {
                const discount = item.originalPrice > item.price
                  ? Math.round((1 - item.price / item.originalPrice) * 100) : 0;
                return (
                  <motion.div key={item.productId}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    transition={{ delay: i * 0.04 }}>
                    <div className="product-card" style={{ position: 'relative' }}>
                      {/* Remove button */}
                      <button onClick={() => { removeItem(item.productId); toast('Đã xóa khỏi yêu thích', { icon: '💔' }); }}
                        style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2, width: '32px', height: '32px', borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)', color: 'var(--primary)' }}>
                        <Heart size={15} fill="var(--primary)" />
                      </button>
                      {discount > 0 && (
                        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2, background: 'var(--secondary)', color: 'white', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '99px' }}>
                          -{discount}%
                        </div>
                      )}
                      <Link href={`/products/${item.productId}`} style={{ textDecoration: 'none' }}>
                        <div className="img-wrap">
                          <img src={item.image} alt={item.name} />
                        </div>
                      </Link>
                      <div className="card-body">
                        <p style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>{item.shopName}</p>
                        <Link href={`/products/${item.productId}`} style={{ textDecoration: 'none' }}>
                          <h3 className="line-clamp-2" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gray-800)', marginBottom: '8px', lineHeight: 1.4 }}>
                            {item.name}
                          </h3>
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                          <Star size={12} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.rating}</span>
                          <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>· {formatNumber(item.sold)} đã bán</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div className="price-sale">{formatPrice(item.price)}</div>
                            {discount > 0 && <div className="price-original">{formatPrice(item.originalPrice)}</div>}
                          </div>
                          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                            onClick={() => handleAddToCart(item)}
                            style={{ background: 'var(--primary)', border: 'none', borderRadius: '10px', padding: '8px 14px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                            + Giỏ
                          </motion.button>
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
    </div>
  );
}
