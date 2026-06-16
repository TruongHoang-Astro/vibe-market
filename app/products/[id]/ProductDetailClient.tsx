'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star, Heart, Share2, ShoppingCart, Zap, Shield,
  Truck, RotateCcw, ChevronRight, Plus, Minus, Store, CheckCircle2,
  ChevronLeft, ChevronDown, MessageCircle, ShieldCheck, Ruler, Camera, X, Flag,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, formatNumber } from '@/lib/data/mock-data';
import type { Product, Review } from '@/lib/data/mock-data';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useChatStore } from '@/lib/store/chat-store';
import { useUser } from '@/lib/supabase/use-user';
import { createClient } from '@/lib/supabase/client';
import { uploadChatMedia } from '@/app/actions/chat';
import { reportContent } from '@/app/actions/report';
import { askQuestion, answerQuestion } from '@/app/actions/qa';
import type { ProductQuestion } from '@/lib/supabase/queries';
import { addRecentlyViewed } from '@/lib/recently-viewed';

interface ShopInfo { name: string; logo: string; rating: number; products: number; response_rate: number; verified: boolean }

export default function ProductDetailClient({
  product, relatedProducts, productReviews, questions = [], isShopOwner = false,
}: {
  product: Product;
  relatedProducts: Product[];
  productReviews: Review[];
  questions?: ProductQuestion[];
  isShopOwner?: boolean;
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || null);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || null);
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const { addItem, openCart } = useCartStore();
  const { toggleItem, isWished } = useWishlistStore();
  const { openChat } = useChatStore();
  const { user, profile } = useUser();
  const router = useRouter();
  const wished = isWished(product.id);

  useEffect(() => { addRecentlyViewed(product.id); }, [product.id]);

  useEffect(() => {
    createClient().from('shops').select('name, logo, rating, products, response_rate, verified').eq('id', product.shopId).maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: any) => { if (data) setShop(data as ShopInfo); });
  }, [product.shopId]);

  const [reviews, setReviews] = useState<Review[]>(productReviews);
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revImages, setRevImages] = useState<string[]>([]);
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Hỏi & Đáp
  const [qaList, setQaList] = useState<ProductQuestion[]>(questions);
  const [newQuestion, setNewQuestion] = useState('');
  const [askingQ, setAskingQ] = useState(false);
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const [answeringId, setAnsweringId] = useState<string | null>(null);

  const submitQuestion = async () => {
    if (!user) { toast('Đăng nhập để đặt câu hỏi nhé!'); return; }
    if (!newQuestion.trim()) { toast.error('Vui lòng nhập câu hỏi'); return; }
    setAskingQ(true);
    const res = await askQuestion(product.id, newQuestion);
    setAskingQ(false);
    if (res.error) { toast.error(res.error); return; }
    setQaList([{ id: 'tmp-' + Date.now(), askerName: profile?.full_name || 'Bạn', question: newQuestion.trim(), answer: null, date: new Date().toISOString() }, ...qaList]);
    setNewQuestion('');
    toast.success('Đã gửi câu hỏi tới shop!');
  };
  const submitAnswer = async (id: string) => {
    const a = (answerDraft[id] || '').trim();
    if (!a) { toast.error('Vui lòng nhập câu trả lời'); return; }
    setAnsweringId(id);
    const res = await answerQuestion(id, a);
    setAnsweringId(null);
    if (res.error) { toast.error(res.error); return; }
    setQaList(qaList.map(q => q.id === id ? { ...q, answer: a } : q));
    setAnswerDraft(prev => ({ ...prev, [id]: '' }));
    toast.success('Đã trả lời');
  };

  const handleRevImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const { url, error } = await uploadChatMedia(ev.target?.result as string);
      if (error || !url) { toast.error('Upload ảnh thất bại'); return; }
      setRevImages(prev => [...prev, url]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmitReview = async () => {
    if (!user) { toast('Đăng nhập để đánh giá nhé!'); return; }
    if (!revComment.trim()) { toast.error('Vui lòng nhập nội dung đánh giá'); return; }
    setRevSubmitting(true);
    const supabase = createClient();
    const userName = profile?.full_name || user.email?.split('@')[0] || 'Người dùng';
    const { data, error } = await supabase.from('reviews')
      .insert({ product_id: product.id, user_id: user.id, user_name: userName, avatar: profile?.avatar_url ?? null, rating: revRating, comment: revComment.trim(), images: revImages })
      .select('*').single();
    setRevSubmitting(false);
    if (error || !data) { toast.error('Gửi đánh giá thất bại'); return; }
    setReviews([{ id: data.id, userId: user.id, userName, avatar: profile?.avatar_url ?? '', rating: revRating, comment: revComment.trim(), date: data.created_at, productId: product.id, images: revImages }, ...reviews]);
    setRevComment(''); setRevRating(5); setRevImages([]);
    toast.success('Cảm ơn đánh giá của bạn! 🌟');
    router.refresh(); // cập nhật rating/số đánh giá tổng hợp (trigger DB)
  };

  const hasVariants = !!product.variants?.length;
  const effPrice = selectedVariant ? selectedVariant.price : product.price;
  const effStock = selectedVariant ? selectedVariant.stock : product.stock;

  const buildCartItem = () => ({
    productId: product.id, name: product.name, price: effPrice, image: product.image,
    quantity, color: selectedColor || undefined, size: selectedSize || undefined,
    variantId: selectedVariant?.id, variantName: selectedVariant?.name,
    shopId: product.shopId, shopName: product.shopName,
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
  const handleBuyNow = () => { addItem(buildCartItem()); router.push('/checkout'); };
  const handleChat = () => openChat(product.shopId, product.shopName, shop?.logo || '');

  const discount = product.originalPrice > 0 ? Math.round((1 - effPrice / product.originalPrice) * 100) : 0;
  const badgeLabel = product.badge === 'sale' ? 'SALE' : product.badge === 'new' ? 'MỚI' : product.badge === 'hot' ? 'HOT' : product.badge === 'bestseller' ? 'BÁN CHẠY' : '';

  return (
    <div className="pd-page" style={{ minHeight: '80vh', background: 'var(--gray-50)' }}>
      {/* Breadcrumb */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--gray-100)', padding: '10px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: 'var(--gray-500)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <Link href="/" style={{ color: 'var(--gray-500)', textDecoration: 'none' }}>Trang chủ</Link>
          <ChevronRight size={12} />
          <Link href="/products" style={{ color: 'var(--gray-500)', textDecoration: 'none' }}>Sản phẩm</Link>
          <ChevronRight size={12} />
          <Link href={`/products?category=${product.category}`} style={{ color: 'var(--gray-500)', textDecoration: 'none' }}>{product.category}</Link>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--gray-700)' }}>{product.subcategory}</span>
        </div>
      </div>

      <div className="container" style={{ padding: '20px 16px 40px' }}>
        {/* Main: gallery + info */}
        <div className="product-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '24px', alignItems: 'start' }}>
          {/* Gallery */}
          <div className="pd-gallery" style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', overflow: 'hidden', position: 'sticky', top: '88px' }}>
            <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: 'var(--gray-50)' }}>
              <motion.img key={selectedImage} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
                src={product.images[selectedImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {badgeLabel && (
                <span className={`badge ${product.badge === 'sale' ? 'badge-red' : product.badge === 'new' ? 'badge-green' : product.badge === 'hot' ? 'badge-orange' : 'badge-gold'}`}
                  style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '12px', padding: '4px 12px' }}>{badgeLabel}</span>
              )}
              {discount > 0 && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--secondary)', color: 'white', fontWeight: 800, fontSize: '14px', padding: '5px 11px', borderRadius: '99px' }}>-{discount}%</div>
              )}
              {product.images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage(i => (i - 1 + product.images.length) % product.images.length)} aria-label="Ảnh trước"
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}><ChevronLeft size={18} /></button>
                  <button onClick={() => setSelectedImage(i => (i + 1) % product.images.length)} aria-label="Ảnh sau"
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}><ChevronRight size={18} /></button>
                  <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '99px' }}>{selectedImage + 1}/{product.images.length}</div>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px', overflowX: 'auto' }}>
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: `2px solid ${selectedImage === i ? 'var(--primary)' : 'var(--gray-200)'}`, padding: 0, background: 'none' }}>
                    <img src={img} alt={`${product.name} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Title + meta */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--primary)', fontWeight: 600 }}>{product.category}</span>
                <span style={{ color: 'var(--gray-300)' }}>·</span>
                <span style={{ fontSize: '12.5px', color: 'var(--gray-500)' }}>{product.subcategory}</span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.25rem, 2vw, 1.6rem)', fontWeight: 700, color: 'var(--black)', lineHeight: 1.35, marginBottom: '12px' }}>{product.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>{product.rating}</span>
                  <div style={{ display: 'flex', gap: '1px' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= Math.round(product.rating) ? '#f59e0b' : '#e5e5e5'} color={s <= Math.round(product.rating) ? '#f59e0b' : '#e5e5e5'} />)}</div>
                </div>
                <span style={{ color: 'var(--gray-300)' }}>|</span>
                <span style={{ color: 'var(--gray-500)' }}><strong style={{ color: 'var(--black)' }}>{formatNumber(product.reviews)}</strong> đánh giá</span>
                <span style={{ color: 'var(--gray-300)' }}>|</span>
                <span style={{ color: 'var(--gray-500)' }}>Đã bán <strong style={{ color: 'var(--black)' }}>{formatNumber(product.sold)}</strong></span>
              </div>
            </div>

            {/* Price block */}
            <div style={{ background: 'linear-gradient(135deg, #fff1f2, #fff5f5)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{formatPrice(effPrice)}</span>
                {discount > 0 && (
                  <>
                    <span style={{ fontSize: '15px', color: 'var(--gray-400)', textDecoration: 'line-through' }}>{formatPrice(product.originalPrice)}</span>
                    <span className="badge badge-red">{discount}% GIẢM</span>
                  </>
                )}
              </div>
              {discount > 0 && <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, marginTop: '6px' }}>🎉 Tiết kiệm {formatPrice(product.originalPrice - effPrice)}</p>}
              {(product.badge === 'hot' || product.badge === 'bestseller') && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: 'rgba(239,68,68,0.08)', color: 'var(--primary)', fontSize: '12.5px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px' }}>
                  🏆 Top bán chạy trong {product.category}
                </div>
              )}
            </div>

            {/* Variants + quantity */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {hasVariants && (
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '10px', color: 'var(--gray-700)' }}>Phân loại: <span style={{ color: 'var(--black)' }}>{selectedVariant?.name || 'Chưa chọn'}</span></div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {product.variants!.map((v) => {
                      const active = selectedVariant?.id === v.id;
                      const out = v.stock <= 0;
                      return (
                        <button key={v.id} onClick={() => !out && setSelectedVariant(v)} disabled={out}
                          style={{ padding: '8px 14px', border: `1.5px solid ${active ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: '8px', background: active ? 'rgba(239,68,68,0.06)' : 'white', color: out ? 'var(--gray-300)' : active ? 'var(--primary)' : 'var(--gray-700)', fontWeight: active ? 700 : 500, cursor: out ? 'not-allowed' : 'pointer', fontSize: '14px', textDecoration: out ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                          {v.name} · {formatPrice(v.price)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '10px', color: 'var(--gray-700)' }}>Màu sắc: <span style={{ color: 'var(--black)' }}>{selectedColor || 'Chưa chọn'}</span></div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {product.colors.map(color => (
                      <button key={color} onClick={() => setSelectedColor(color)} aria-label={color}
                        style={{ width: '34px', height: '34px', borderRadius: '50%', background: color, border: `3px solid ${selectedColor === color ? 'var(--primary)' : 'transparent'}`, outline: `2px solid ${selectedColor === color ? 'var(--primary)' : 'var(--gray-200)'}`, cursor: 'pointer', transition: 'all 0.2s' }} />
                    ))}
                  </div>
                </div>
              )}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '10px', color: 'var(--gray-700)' }}>Kích thước: <span style={{ color: 'var(--black)' }}>{selectedSize || 'Chưa chọn'}</span></div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {product.sizes.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)}
                        style={{ padding: '8px 16px', border: `1.5px solid ${selectedSize === size ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: '8px', background: selectedSize === size ? 'rgba(239,68,68,0.06)' : 'white', color: selectedSize === size ? 'var(--primary)' : 'var(--gray-700)', fontWeight: selectedSize === size ? 700 : 500, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>{size}</button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--gray-700)' }}>Số lượng</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--gray-200)', borderRadius: '10px', overflow: 'hidden' }}>
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ padding: '8px 14px', background: 'var(--gray-50)', border: 'none', cursor: 'pointer', color: 'var(--gray-600)' }}><Minus size={15} /></button>
                  <span style={{ padding: '8px 18px', fontWeight: 700, fontSize: '15px', minWidth: '50px', textAlign: 'center' }}>{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(Math.max(1, effStock), q + 1))} style={{ padding: '8px 14px', background: 'var(--gray-50)', border: 'none', cursor: 'pointer', color: 'var(--gray-600)' }}><Plus size={15} /></button>
                </div>
                <span style={{ fontSize: '12.5px', color: 'var(--gray-400)' }}>Còn {effStock} sp</span>
              </div>

              {/* Inline actions (desktop) */}
              <div className="pd-actions-inline" style={{ display: 'flex', gap: '10px' }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleAddCart}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '12px', border: '1.5px solid var(--primary)', background: 'rgba(239,68,68,0.05)', color: 'var(--primary)', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
                  <ShoppingCart size={18} />
                  {addedAnimation ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a' }}><CheckCircle2 size={16} /> Đã thêm!</span> : 'Thêm vào giỏ'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleBuyNow}
                  className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '13px', borderRadius: '12px', fontSize: '15px' }}>
                  <span><Zap size={18} /> Mua ngay</span>
                </motion.button>
                <button onClick={handleWishlist} aria-label="Yêu thích" style={{ padding: '13px', borderRadius: '12px', border: '1.5px solid', borderColor: wished ? 'var(--primary)' : 'var(--gray-200)', background: wished ? 'rgba(239,68,68,0.05)' : 'white', cursor: 'pointer' }}>
                  <Heart size={20} fill={wished ? 'var(--primary)' : 'none'} color={wished ? 'var(--primary)' : 'var(--gray-400)'} />
                </button>
                <button aria-label="Chia sẻ" style={{ padding: '13px', borderRadius: '12px', border: '1.5px solid var(--gray-200)', background: 'white', cursor: 'pointer' }}><Share2 size={20} style={{ color: 'var(--gray-400)' }} /></button>
              </div>
            </div>

            {/* Guarantees */}
            <div className="product-guarantees" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { icon: <Truck size={15} />, text: 'Giao nhanh 1-3 ngày' },
                { icon: <Shield size={15} />, text: 'Chính hãng 100%' },
                { icon: <RotateCcw size={15} />, text: 'Đổi trả 30 ngày' },
                { icon: <CheckCircle2 size={15} />, text: 'Đảm bảo hoàn tiền' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'white', border: '1px solid var(--gray-100)', borderRadius: '10px', fontSize: '12.5px', color: 'var(--gray-600)' }}>
                  <span style={{ color: 'var(--primary)' }}>{item.icon}</span>{item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shop bar */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {shop?.logo ? <img src={shop.logo} alt={product.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={24} color="white" />}
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>{product.shopName}</span>
                {shop?.verified && <ShieldCheck size={15} style={{ color: '#2563eb' }} />}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--gray-400)' }}>Shop trên Vibe Market</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleChat} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1.5px solid var(--primary)', borderRadius: '8px', background: 'rgba(239,68,68,0.05)', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}><MessageCircle size={15} /> Chat</button>
              <Link href={`/shop/${product.shopId}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', border: '1.5px solid var(--gray-200)', borderRadius: '8px', color: 'var(--gray-700)', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>Xem Shop</Link>
            </div>
          </div>
          {shop && (
            <div style={{ display: 'flex', gap: '0', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--gray-100)' }}>
              {[
                { v: shop.rating?.toFixed(1) ?? '5.0', l: 'Đánh giá' },
                { v: formatNumber(shop.products ?? 0), l: 'Sản phẩm' },
                { v: `${shop.response_rate ?? 100}%`, l: 'Phản hồi chat' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--gray-100)' : 'none' }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary)' }}>{s.v}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hướng dẫn chọn kích cỡ (collapsible) — do seller nhập */}
        {product.sizeGuide && product.sizeGuide.length > 0 && (
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', marginBottom: '16px', overflow: 'hidden' }}>
            <button onClick={() => setSizeGuideOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--black)', display: 'flex', alignItems: 'center', gap: '8px' }}><Ruler size={18} style={{ color: 'var(--primary)' }} /> Hướng dẫn chọn kích cỡ</span>
              <ChevronDown size={20} style={{ color: 'var(--gray-400)', transform: sizeGuideOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {sizeGuideOpen && (
              <div style={{ padding: '0 20px 20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead><tr>
                    <th style={{ textAlign: 'left', padding: '10px 12px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', fontWeight: 600, color: 'var(--gray-600)' }}>Size</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', fontWeight: 600, color: 'var(--gray-600)' }}>Thông số</th>
                  </tr></thead>
                  <tbody>
                    {product.sizeGuide.map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', fontWeight: 600 }}>{row.size}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-600)' }}>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Description (collapsible) */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', marginBottom: '16px', overflow: 'hidden' }}>
          <button onClick={() => setDescOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--black)' }}>Thông số & Mô tả</span>
            <ChevronDown size={20} style={{ color: 'var(--gray-400)', transform: descOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {descOpen && (
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 20px', fontSize: '14px', marginBottom: '16px' }}>
                <span style={{ color: 'var(--gray-500)' }}>Danh mục</span><span>{product.category} · {product.subcategory}</span>
                <span style={{ color: 'var(--gray-500)' }}>Tồn kho</span><span>{product.stock} sản phẩm</span>
                <span style={{ color: 'var(--gray-500)' }}>Đã bán</span><span>{formatNumber(product.sold)}</span>
              </div>
              <p style={{ fontSize: '14.5px', color: 'var(--gray-600)', lineHeight: 1.8 }}>{product.description}</p>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '34px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{product.rating}</span>
              <div>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= Math.round(product.rating) ? '#f59e0b' : '#e5e5e5'} color={s <= Math.round(product.rating) ? '#f59e0b' : '#e5e5e5'} />)}</div>
                <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Đánh giá sản phẩm ({formatNumber(product.reviews)})</span>
              </div>
            </div>
            <button onClick={async () => {
              if (!user) { toast.error('Bạn cần đăng nhập để báo cáo'); return; }
              const reason = window.prompt('Lý do báo cáo sản phẩm này? (vd: hàng giả, nội dung phản cảm...)');
              if (reason == null || !reason.trim()) return;
              const res = await reportContent({ targetType: 'product', targetId: product.id, targetLabel: product.name, reason });
              if (res.error) toast.error(res.error); else toast.success('Đã gửi báo cáo tới quản trị viên. Cảm ơn bạn!');
            }} title="Báo cáo sản phẩm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', color: 'var(--gray-500)', fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>
              <Flag size={14} /> Báo cáo
            </button>
          </div>

          {/* Review form */}
          <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: '20px' }}>
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
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {revImages.map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setRevImages(revImages.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={12} /></button>
                    </div>
                  ))}
                  {revImages.length < 5 && (
                    <label style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1.5px dashed var(--gray-300)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '10px', gap: '2px' }}>
                      <Camera size={18} /> Ảnh
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleRevImage} />
                    </label>
                  )}
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSubmitReview} disabled={revSubmitting}
                  className="btn-primary" style={{ padding: '10px 24px', borderRadius: '10px', fontSize: '14px', opacity: revSubmitting ? 0.7 : 1 }}>
                  <span>{revSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}</span>
                </motion.button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Đăng nhập để viết đánh giá</span>
                <Link href="/login" className="btn-outline" style={{ borderRadius: '10px', fontSize: '14px', padding: '8px 18px' }}>Đăng nhập</Link>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px', color: 'var(--gray-400)' }}>
              <Star size={30} style={{ marginBottom: '10px' }} />
              <p>Chưa có đánh giá. Hãy là người đầu tiên đánh giá!</p>
            </div>
          ) : (
            reviews.map((r, i) => (
              <div key={r.id} style={{ padding: '16px 0', borderBottom: i < reviews.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <img src={r.avatar || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop'} alt={r.userName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{r.userName}</span>
                      <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{new Date(r.date).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={13} fill={s <= r.rating ? '#f59e0b' : '#e5e5e5'} color={s <= r.rating ? '#f59e0b' : '#e5e5e5'} />)}</div>
                    <p style={{ fontSize: '14px', color: 'var(--gray-600)', lineHeight: 1.7 }}>{r.comment}</p>
                    {r.images && r.images.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {r.images.map((url, idx) => (
                          <img key={idx} src={url} alt="" onClick={() => window.open(url, '_blank')} style={{ width: '72px', height: '72px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--gray-200)' }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Hỏi & Đáp */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '20px', fontWeight: 800, marginBottom: '14px' }}>Hỏi &amp; Đáp {qaList.length > 0 && <span style={{ fontSize: '14px', color: 'var(--gray-400)', fontWeight: 400 }}>({qaList.length})</span>}</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
            <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Đặt câu hỏi cho shop về sản phẩm này..." className="input-base" style={{ flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') submitQuestion(); }} />
            <button onClick={submitQuestion} disabled={askingQ} className="btn-primary" style={{ borderRadius: '10px', padding: '0 18px', opacity: askingQ ? 0.7 : 1 }}>{askingQ ? '...' : 'Gửi'}</button>
          </div>
          {qaList.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', fontSize: '14px', textAlign: 'center', padding: '12px' }}>Chưa có câu hỏi nào. Hãy là người đầu tiên!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {qaList.map(q => (
                <div key={q.id} style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '13px', flexShrink: 0 }}>Hỏi</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', color: 'var(--gray-800)' }}>{q.question}</p>
                      <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{q.askerName} · {new Date(q.date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  {q.answer ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '8px', marginLeft: '12px', background: 'var(--gray-50)', padding: '10px 12px', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '13px', flexShrink: 0 }}>Đáp</span>
                      <p style={{ fontSize: '14px', color: 'var(--gray-700)' }}>{q.answer}</p>
                    </div>
                  ) : isShopOwner ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginLeft: '12px' }}>
                      <input value={answerDraft[q.id] || ''} onChange={e => setAnswerDraft(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="Trả lời câu hỏi này..." className="input-base" style={{ flex: 1 }} />
                      <button onClick={() => submitAnswer(q.id)} disabled={answeringId === q.id} style={{ padding: '0 14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{answeringId === q.id ? '...' : 'Trả lời'}</button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '6px', marginLeft: '12px' }}>Chờ shop trả lời...</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Có thể bạn cũng thích</h2>
            <div className="products-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {relatedProducts.map(p => {
                const d = p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
                return (
                  <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div className="product-card">
                      <div className="img-wrap"><img src={p.image} alt={p.name} />
                        {d > 0 && <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--secondary)', color: 'white', fontSize: '11px', fontWeight: 800, padding: '2px 7px', borderRadius: '99px' }}>-{d}%</span>}
                      </div>
                      <div className="card-body">
                        <h3 className="line-clamp-2" style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--gray-800)' }}>{p.name}</h3>
                        <div className="price-sale" style={{ fontSize: '15px' }}>{formatPrice(p.price)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Star size={12} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{p.rating}</span>
                          <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>· Đã bán {formatNumber(p.sold)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom action bar (mobile) */}
      <div className="pd-bottom-bar">
        <button onClick={handleChat} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', width: '64px', background: 'white', border: 'none', borderRight: '1px solid var(--gray-100)', color: 'var(--primary)', cursor: 'pointer', fontSize: '11px', flexShrink: 0 }}>
          <MessageCircle size={20} /> Chat
        </button>
        <button onClick={handleAddCart} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', width: '76px', background: 'white', border: 'none', borderRight: '1px solid var(--gray-100)', color: 'var(--primary)', cursor: 'pointer', fontSize: '11px', flexShrink: 0 }}>
          <ShoppingCart size={20} /> Thêm giỏ
        </button>
        <button onClick={handleBuyNow} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
          <span style={{ fontSize: '15px' }}>Mua ngay</span>
          <span style={{ fontSize: '12px', opacity: 0.9 }}>{formatPrice(effPrice)}</span>
        </button>
      </div>
    </div>
  );
}
