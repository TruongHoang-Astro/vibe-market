'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star, Heart, Share2, ShoppingCart, Zap, Shield,
  Truck, RotateCcw, ChevronRight, Plus, Minus, Store, CheckCircle2, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, formatNumber } from '@/lib/data/mock-data';
import type { Product, Review } from '@/lib/data/mock-data';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useUser } from '@/lib/supabase/use-user';
import { createClient } from '@/lib/supabase/client';

export default function ProductDetailClient({
  product, relatedProducts, productReviews,
}: {
  product: Product;
  relatedProducts: Product[];
  productReviews: Review[];
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || null);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const { addItem, openCart } = useCartStore();
  const { toggleItem, isWished } = useWishlistStore();
  const { user, profile } = useUser();
  const router = useRouter();
  const wished = isWished(product.id);

  // Đánh giá: cho phép thêm review mới (lưu DB) và hiển thị ngay
  const [reviews, setReviews] = useState<Review[]>(productReviews);
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revSubmitting, setRevSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (!user) { toast('Đăng nhập để đánh giá nhé!'); return; }
    if (!revComment.trim()) { toast.error('Vui lòng nhập nội dung đánh giá'); return; }
    setRevSubmitting(true);
    const supabase = createClient();
    const userName = profile?.full_name || user.email?.split('@')[0] || 'Người dùng';
    const { data, error } = await supabase.from('reviews')
      .insert({ product_id: product.id, user_id: user.id, user_name: userName, avatar: profile?.avatar_url ?? null, rating: revRating, comment: revComment.trim() })
      .select('*').single();
    setRevSubmitting(false);
    if (error || !data) { toast.error('Gửi đánh giá thất bại'); return; }
    setReviews([{ id: data.id, userId: user.id, userName, avatar: profile?.avatar_url ?? '', rating: revRating, comment: revComment.trim(), date: data.created_at, productId: product.id }, ...reviews]);
    setRevComment(''); setRevRating(5);
    toast.success('Cảm ơn đánh giá của bạn! 🌟');
  };

  const buildCartItem = () => ({
    productId: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    quantity,
    color: selectedColor || undefined,
    size: selectedSize || undefined,
    shopId: product.shopId,
    shopName: product.shopName,
  });

  const handleWishlist = () => {
    toggleItem({ productId: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, image: product.image, shopName: product.shopName, rating: product.rating, sold: product.sold, badge: product.badge });
    toast(wished ? 'Đã xóa khỏi yêu thích' : '❤️ Đã thêm vào yêu thích', { description: product.name });
  };

  const handleAddCart = () => {
    addItem(buildCartItem());
    toast.success('Đã thêm vào giỏ hàng!', { description: product.name, duration: 2500 });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
    openCart();
  };

  const handleBuyNow = () => {
    addItem(buildCartItem());
    router.push('/checkout');
  };

  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)', padding: '12px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--gray-500)' }}>
          <Link href="/" style={{ color: 'var(--gray-500)', textDecoration: 'none' }}>Trang chủ</Link>
          <ChevronRight size={12} />
          <Link href="/products" style={{ color: 'var(--gray-500)', textDecoration: 'none' }}>Sản phẩm</Link>
          <ChevronRight size={12} />
          <Link href={`/products?category=${product.category}`} style={{ color: 'var(--gray-500)', textDecoration: 'none' }}>{product.category}</Link>
          <ChevronRight size={12} />
          <span className="line-clamp-1" style={{ color: 'var(--gray-700)', maxWidth: '200px' }}>{product.name}</span>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        {/* Product main */}
        <div className="product-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '64px' }}>
          {/* Image gallery */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
              {product.images.map((img, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05 }} onClick={() => setSelectedImage(i)}
                  style={{ width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${selectedImage === i ? 'var(--primary)' : 'var(--gray-200)'}`, transition: 'all 0.2s' }}>
                  <img src={img} alt={`${product.name} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </motion.div>
              ))}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <motion.div key={selectedImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '1', position: 'relative' }}>
                <img src={product.images[selectedImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                  onMouseEnter={e => ((e.target as HTMLImageElement).style.transform = 'scale(1.04)')}
                  onMouseLeave={e => ((e.target as HTMLImageElement).style.transform = 'scale(1)')} />
                {product.badge && (
                  <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                    <span className={`badge ${product.badge === 'sale' ? 'badge-red' : product.badge === 'new' ? 'badge-green' : product.badge === 'hot' ? 'badge-orange' : 'badge-gold'}`} style={{ fontSize: '12px', padding: '5px 14px' }}>
                      {product.badge === 'sale' ? 'SALE' : product.badge === 'new' ? 'MỚI' : product.badge === 'hot' ? 'HOT' : 'BÁN CHẠY'}
                    </span>
                  </div>
                )}
                {discount > 0 && (
                  <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--secondary)', color: 'white', fontWeight: 800, fontSize: '15px', padding: '6px 12px', borderRadius: '99px' }}>
                    -{discount}%
                  </div>
                )}
                {product.images.length > 1 && (
                  <>
                    <button onClick={() => setSelectedImage(i => (i - 1 + product.images.length) % product.images.length)}
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)' }}>
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => setSelectedImage(i => (i + 1) % product.images.length)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)' }}>
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          </div>

          {/* Product info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>{product.category}</span>
              <span style={{ color: 'var(--gray-300)' }}>·</span>
              <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{product.subcategory}</span>
            </div>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 800, color: 'var(--black)', lineHeight: 1.3, marginBottom: '16px' }}>
              {product.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= Math.floor(product.rating) ? '#f59e0b' : '#e5e5e5'} color={s <= Math.floor(product.rating) ? '#f59e0b' : '#e5e5e5'} />)}</div>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>{product.rating}</span>
                <span style={{ color: 'var(--gray-400)', fontSize: '13px' }}>({formatNumber(product.reviews)} đánh giá)</span>
              </div>
              <div style={{ width: '1px', height: '16px', background: 'var(--gray-200)' }} />
              <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Đã bán <strong style={{ color: 'var(--black)' }}>{formatNumber(product.sold)}</strong></span>
              <div style={{ width: '1px', height: '16px', background: 'var(--gray-200)' }} />
              <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Còn <strong style={{ color: product.stock < 20 ? '#ef4444' : 'var(--black)' }}>{product.stock}</strong> sp</span>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #fff0f0, #fff)', border: '1px solid rgba(153,0,0,0.12)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'Playfair Display', fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(product.price)}</span>
                {discount > 0 && (
                  <>
                    <span style={{ fontSize: '16px', color: 'var(--gray-400)', textDecoration: 'line-through' }}>{formatPrice(product.originalPrice)}</span>
                    <span className="badge badge-red">{discount}% OFF</span>
                  </>
                )}
              </div>
              {discount > 0 && <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>🎉 Tiết kiệm {formatPrice(product.originalPrice - product.price)}</p>}
            </div>

            {product.colors && product.colors.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: 'var(--gray-700)' }}>
                  Màu sắc: <span style={{ color: 'var(--black)' }}>{selectedColor || 'Chưa chọn'}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {product.colors.map(color => (
                    <button key={color} onClick={() => setSelectedColor(color)}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', background: color, border: `3px solid ${selectedColor === color ? 'var(--primary)' : 'transparent'}`, outline: `2px solid ${selectedColor === color ? 'var(--primary)' : 'var(--gray-200)'}`, cursor: 'pointer', transition: 'all 0.2s', boxShadow: selectedColor === color ? 'var(--shadow-red)' : 'none' }} />
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: 'var(--gray-700)' }}>
                  Kích thước: <span style={{ color: 'var(--black)' }}>{selectedSize || 'Chưa chọn'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.sizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)}
                      style={{ padding: '8px 18px', border: `2px solid ${selectedSize === size ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: '10px', background: selectedSize === size ? 'var(--primary)' : 'white', color: selectedSize === size ? 'white' : 'var(--gray-700)', fontWeight: selectedSize === size ? 700 : 400, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-700)' }}>Số lượng:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden' }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ padding: '10px 16px', background: 'var(--gray-50)', border: 'none', cursor: 'pointer', color: 'var(--gray-600)' }}
                  onMouseEnter={e => ((e.target as HTMLButtonElement).style.background = 'var(--gray-200)')}
                  onMouseLeave={e => ((e.target as HTMLButtonElement).style.background = 'var(--gray-50)')}>
                  <Minus size={16} />
                </button>
                <span style={{ padding: '10px 20px', fontWeight: 700, fontSize: '16px', minWidth: '56px', textAlign: 'center' }}>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  style={{ padding: '10px 16px', background: 'var(--gray-50)', border: 'none', cursor: 'pointer', color: 'var(--gray-600)' }}
                  onMouseEnter={e => ((e.target as HTMLButtonElement).style.background = 'var(--gray-200)')}
                  onMouseLeave={e => ((e.target as HTMLButtonElement).style.background = 'var(--gray-50)')}>
                  <Plus size={16} />
                </button>
              </div>
              <span style={{ fontSize: '13px', color: 'var(--gray-400)' }}>Còn {product.stock} sp</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleAddCart}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '15px', borderRadius: '14px', border: '2px solid var(--primary)', background: 'white', color: 'var(--primary)', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.25s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(153,0,0,0.05)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; }}>
                <ShoppingCart size={18} />
                {addedAnimation ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a' }}>
                    <CheckCircle2 size={16} /> Đã thêm!
                  </motion.span>
                ) : 'Thêm vào giỏ'}
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleBuyNow}
                className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '15px', borderRadius: '14px', fontSize: '15px' }}>
                <span><Zap size={18} /> Mua ngay</span>
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleWishlist}
                style={{ padding: '15px', borderRadius: '14px', border: '2px solid', borderColor: wished ? 'var(--primary)' : 'var(--gray-200)', background: wished ? 'rgba(153,0,0,0.05)' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Heart size={20} fill={wished ? 'var(--primary)' : 'none'} color={wished ? 'var(--primary)' : 'var(--gray-400)'} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }}
                style={{ padding: '15px', borderRadius: '14px', border: '2px solid var(--gray-200)', background: 'white', cursor: 'pointer' }}>
                <Share2 size={20} style={{ color: 'var(--gray-400)' }} />
              </motion.button>
            </div>

            <div className="product-guarantees" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { icon: <Truck size={16} />, text: 'Giao hàng nhanh 1-3 ngày' },
                { icon: <Shield size={16} />, text: 'Hàng chính hãng 100%' },
                { icon: <RotateCcw size={16} />, text: 'Đổi trả trong 30 ngày' },
                { icon: <CheckCircle2 size={16} />, text: 'Đảm bảo hoàn tiền' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--gray-50)', borderRadius: '10px', fontSize: '13px', color: 'var(--gray-600)' }}>
                  <span style={{ color: 'var(--primary)' }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            <Link href={`/shop/${product.shopId}`} style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ scale: 1.01 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'var(--transition)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gray-200)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Store size={20} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{product.shopName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Xem tất cả sản phẩm của shop</div>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--gray-400)' }} />
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Description & Reviews */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', overflow: 'hidden', marginBottom: '48px' }}>
          <div style={{ padding: '28px 32px', borderBottom: '1px solid var(--gray-100)' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>Mô Tả Sản Phẩm</h2>
            <p style={{ fontSize: '15px', color: 'var(--gray-600)', lineHeight: 1.8 }}>{product.description}</p>
          </div>
          <div style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '22px', fontWeight: 700 }}>Đánh Giá ({formatNumber(product.reviews)})</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'Playfair Display', fontSize: '40px', fontWeight: 800, color: 'var(--primary)' }}>{product.rating}</span>
                <div>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={18} fill="#f59e0b" color="#f59e0b" />)}</div>
                  <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{formatNumber(product.reviews)} đánh giá</span>
                </div>
              </div>
            </div>
            {/* Form viết đánh giá */}
            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '24px' }}>
              {user ? (
                <>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Viết đánh giá của bạn</div>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setRevRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Star size={26} fill={s <= revRating ? '#f59e0b' : '#e5e5e5'} color={s <= revRating ? '#f59e0b' : '#e5e5e5'} />
                      </button>
                    ))}
                  </div>
                  <textarea value={revComment} onChange={e => setRevComment(e.target.value)} placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..." rows={3}
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--gray-200)', borderRadius: '10px', fontSize: '14px', fontFamily: 'Inter', resize: 'vertical', outline: 'none', marginBottom: '12px' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--primary)')} onBlur={e => (e.target.style.borderColor = 'var(--gray-200)')} />
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSubmitReview} disabled={revSubmitting}
                    className="btn-primary" style={{ padding: '10px 24px', borderRadius: '10px', fontSize: '14px', opacity: revSubmitting ? 0.7 : 1 }}>
                    <span>{revSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}</span>
                  </motion.button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Đăng nhập để viết đánh giá cho sản phẩm này</span>
                  <Link href="/login" className="btn-outline" style={{ borderRadius: '10px', fontSize: '14px', padding: '8px 18px' }}>Đăng nhập</Link>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)' }}>
                <Star size={32} style={{ marginBottom: '12px' }} />
                <p>Chưa có đánh giá. Hãy là người đầu tiên đánh giá!</p>
              </div>
            ) : (
              reviews.map((r, i) => (
                <div key={r.id} style={{ padding: '20px 0', borderBottom: i < reviews.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <img src={r.avatar || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop'} alt={r.userName} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>{r.userName}</span>
                        <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{new Date(r.date).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={13} fill={s <= r.rating ? '#f59e0b' : '#e5e5e5'} color={s <= r.rating ? '#f59e0b' : '#e5e5e5'} />)}</div>
                      <p style={{ fontSize: '14px', color: 'var(--gray-600)', lineHeight: 1.7 }}>{r.comment}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '26px', fontWeight: 800, marginBottom: '24px' }}>Sản Phẩm Liên Quan</h2>
            <div className="products-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {relatedProducts.map(p => (
                <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div className="product-card">
                    <div className="img-wrap"><img src={p.image} alt={p.name} /></div>
                    <div className="card-body">
                      <h3 className="line-clamp-2" style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>{p.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{p.rating}</span>
                      </div>
                      <div className="price-sale" style={{ marginTop: '6px', fontSize: '15px' }}>{formatPrice(p.price)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
