'use client';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import {
  ArrowRight, Star, Flame, Clock, ChevronRight,
  TrendingUp, Award, Users, ShoppingBag, Zap, Store, ChevronLeft
} from 'lucide-react';
import { formatPrice, formatNumber, formatCount } from '@/lib/data/mock-data';
import type { Product, Category, Review } from '@/lib/data/mock-data';
import { useCartStore } from '@/lib/store/cart-store';

// --- Hero Banner ---
const heroSlides = [
  {
    title: 'Mua Sắm Đỉnh Cao,\nSống Đời Vibe',
    subtitle: 'Hàng nghìn sản phẩm chính hãng, giá tốt nhất thị trường',
    cta: 'Khám phá ngay',
    bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 55%, #fff5f5 100%)',
    accent: '#ef4444',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=700&fit=crop',
  },
  {
    title: 'Flash Sale Mỗi Ngày\nGiảm Đến 70%',
    subtitle: 'Nhanh tay săn deal hot, số lượng có hạn!',
    cta: 'Săn deal ngay',
    bg: 'linear-gradient(135deg, #fff7ed 0%, #ffe4e6 55%, #fff1f2 100%)',
    accent: '#f43f5e',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=700&fit=crop',
  },
  {
    title: 'Mở Shop Ngay\nKiếm Thu Nhập Triệu',
    subtitle: 'Đăng ký miễn phí, bắt đầu bán hàng trong 5 phút',
    cta: 'Bắt đầu bán',
    bg: 'linear-gradient(135deg, #fffbeb 0%, #ffe4e6 55%, #fff7ed 100%)',
    accent: '#e0590b',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=700&fit=crop',
  },
];

function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent(c => (c + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };
  const slide = heroSlides[current];

  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: '580px', background: slide.bg, transition: 'background 0.8s ease' }}>
      <div className="container hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center', minHeight: '580px', padding: '60px 24px' }}>
        <motion.div
          key={current}
          initial={{ opacity: 0, x: -40 * direction }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="badge badge-red" style={{ marginBottom: '20px', display: 'inline-flex' }}>
            <Zap size={10} /> Nền tảng #1 Việt Nam
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, color: 'var(--black)', lineHeight: 1.15, marginBottom: '20px', whiteSpace: 'pre-line' }}>
            {slide.title}
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--gray-600)', marginBottom: '36px', lineHeight: 1.7, maxWidth: '420px' }}>
            {slide.subtitle}
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/products">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn-primary" style={{ fontSize: '16px', padding: '14px 32px', borderRadius: '99px' }}>
                <span>{slide.cta}</span>
                <ArrowRight size={18} />
              </motion.button>
            </Link>
            <Link href="/login?mode=seller">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn-white" style={{ fontSize: '16px', padding: '14px 32px', borderRadius: '99px' }}>
                <Store size={18} />
                <span>Bán hàng</span>
              </motion.button>
            </Link>
          </div>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: '36px', marginTop: '48px' }}>
            {[{ v: '2M+', l: 'Khách hàng' }, { v: '50K+', l: 'Sản phẩm' }, { v: '10K+', l: 'Shop' }].map(s => (
              <div key={s.l}>
                <div style={{ fontFamily: 'Playfair Display', fontSize: '26px', fontWeight: 800, color: slide.accent }}>{s.v}</div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div
          key={`img-${current}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="hero-img"
          style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}
        >
          <div className="animate-hero-float" style={{ position: 'relative' }}>
            <div style={{ width: 'clamp(260px, 35vw, 480px)', height: 'clamp(320px, 42vw, 580px)', borderRadius: '24px', overflow: 'hidden', boxShadow: `0 32px 80px ${slide.accent}40` }}>
              <img src={slide.image} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {/* Floating badges */}
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }}
              style={{ position: 'absolute', top: '20px', right: '-20px', background: 'white', borderRadius: '12px', padding: '10px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} style={{ color: '#FF4500' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--black)' }}>Flash Sale</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>Giảm đến 70%</div>
              </div>
            </motion.div>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3.5, delay: 0.5 }}
              style={{ position: 'absolute', bottom: '40px', left: '-20px', background: 'white', borderRadius: '12px', padding: '10px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill="#f59e0b" color="#f59e0b" />)}</div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--black)' }}>4.9/5.0</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>2M+ đánh giá</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
      {/* Slide indicators */}
      <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
        {heroSlides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{ width: i === current ? '28px' : '8px', height: '8px', borderRadius: '99px', background: i === current ? slide.accent : 'rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
        ))}
      </div>
      {/* Nav arrows */}
      <button onClick={() => goTo((current - 1 + heroSlides.length) % heroSlides.length)} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--gray-200)', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', boxShadow: 'var(--shadow-sm)' }}>
        <ChevronLeft size={20} />
      </button>
      <button onClick={() => goTo((current + 1) % heroSlides.length)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--gray-200)', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', boxShadow: 'var(--shadow-sm)' }}>
        <ChevronRight size={20} />
      </button>
    </section>
  );
}

// --- Flash Sale Timer ---
function FlashSaleSection({ flashSaleProducts }: { flashSaleProducts: Product[] }) {
  const [time, setTime] = useState({ h: 5, m: 32, s: 14 });
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(t => {
        let { h, m, s } = t;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 5; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { addItem, openCart } = useCartStore();

  return (
    <section className="section-sm" style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fff5f5 100%)' }} ref={ref}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Flame size={28} style={{ color: '#f97316' }} />
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', fontWeight: 800, color: 'var(--black)' }}>Flash Sale</h2>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[String(time.h).padStart(2, '0'), String(time.m).padStart(2, '0'), String(time.s).padStart(2, '0')].map((val, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: '20px', padding: '6px 10px', borderRadius: '8px', minWidth: '44px', textAlign: 'center', fontFamily: 'monospace' }}>{val}</span>
                    {i < 2 && <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '20px' }}>:</span>}
                  </span>
                ))}
              </div>
            </div>
            <Link href="/products?flash=true" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600, fontSize: '14px' }}>
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>

          {/* Products row */}
          <div className="flash-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {flashSaleProducts.slice(0, 5).map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08, duration: 0.5 }}>
                <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'white', border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'all 0.3s', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; }}
                  >
                    <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                        onMouseEnter={e => ((e.target as HTMLImageElement).style.transform = 'scale(1.06)')}
                        onMouseLeave={e => ((e.target as HTMLImageElement).style.transform = 'scale(1)')} />
                      <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--secondary)', color: 'white', fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '99px' }}>
                        -{Math.round((1 - (product.flashSalePrice || product.price) / product.originalPrice) * 100)}%
                      </div>
                      {/* Progress bar */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                        <div style={{ background: 'rgba(0,0,0,0.6)', padding: '6px 10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                            <span>Đã bán {formatNumber(product.sold)}</span>
                            <span style={{ color: '#FF4500' }}>🔥 Hot</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px' }}>
                            <div style={{ height: '100%', background: 'linear-gradient(90deg, #FF4500, #f43f5e)', borderRadius: '99px', width: `${Math.min(80, 30 + (product.sold % 50))}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--gray-800)', marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {product.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '16px' }}>
                          {formatPrice(product.flashSalePrice || product.price)}
                        </span>
                        <span style={{ color: 'var(--gray-400)', textDecoration: 'line-through', fontSize: '12px' }}>
                          {formatPrice(product.originalPrice)}
                        </span>
                      </div>
                      <button onClick={e => { e.preventDefault(); addItem({ productId: product.id, name: product.name, price: product.flashSalePrice || product.price, image: product.image, quantity: 1, shopId: product.shopId, shopName: product.shopName }); openCart(); }}
                        style={{ marginTop: '10px', width: '100%', padding: '8px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: 'none', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'opacity 0.2s' }}
                        onMouseEnter={e => ((e.target as HTMLButtonElement).style.opacity = '0.9')}
                        onMouseLeave={e => ((e.target as HTMLButtonElement).style.opacity = '1')}
                      >
                        Thêm giỏ hàng
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// --- Category Grid ---
function CategoryGrid({ categories }: { categories: Category[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="section" ref={ref}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="badge badge-gray" style={{ marginBottom: '12px', display: 'inline-flex' }}>Danh Mục Nổi Bật</div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: '12px' }}>
            Khám Phá <span className="text-gradient">Theo Danh Mục</span>
          </h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '16px' }}>Tìm sản phẩm phù hợp theo từng lĩnh vực</p>
        </motion.div>
        <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {categories.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.06, duration: 0.5 }}>
              <Link href={`/products?category=${cat.name}`} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.98 }}
                  style={{ background: 'white', border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-lg)', padding: '28px 20px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--gray-100)'; }}
                >
                  <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', transition: 'transform 0.3s' }}>
                    {cat.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--black)', marginBottom: '4px' }}>{cat.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{formatCount(cat.count)} sản phẩm</div>
                  </div>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)`, transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.3s' }} className="cat-line" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Product Card Component ---
function ProductCard({ product, index }: { product: Product; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const { addItem, openCart } = useCartStore();

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: index * 0.07, duration: 0.5 }}>
      <div className="product-card">
        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
          <div className="img-wrap" style={{ position: 'relative' }}>
            <img src={product.image} alt={product.name} />
            {product.badge && (
              <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                <span className={`badge ${product.badge === 'sale' ? 'badge-red' : product.badge === 'new' ? 'badge-green' : product.badge === 'hot' ? 'badge-orange' : 'badge-gold'}`}>
                  {product.badge === 'sale' ? 'SALE' : product.badge === 'new' ? 'MỚI' : product.badge === 'hot' ? 'HOT' : 'BÁN CHẠY'}
                </span>
              </div>
            )}
            {product.originalPrice > product.price && (
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--secondary)', color: 'white', fontSize: '12px', fontWeight: 800, padding: '2px 8px', borderRadius: '99px' }}>
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </div>
            )}
          </div>
        </Link>
        <div className="card-body">
          <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>{product.shopName}</p>
          <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
            <h3 className="line-clamp-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--gray-800)', marginBottom: '8px', lineHeight: '1.4' }}>{product.name}</h3>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>{product.rating}</span>
            <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>({formatNumber(product.reviews)})</span>
            <span style={{ fontSize: '12px', color: 'var(--gray-400)', marginLeft: '4px' }}>· Đã bán {formatNumber(product.sold)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="price-sale">{formatPrice(product.price)}</div>
              {product.originalPrice > product.price && <div className="price-original">{formatPrice(product.originalPrice)}</div>}
            </div>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
              onClick={() => { addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, quantity: 1, shopId: product.shopId, shopName: product.shopName }); openCart(); }}
              style={{ background: 'var(--primary)', border: 'none', borderRadius: '10px', padding: '8px 14px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'var(--transition)' }}
              onMouseEnter={e => ((e.target as HTMLButtonElement).style.background = 'var(--primary-light)')}
              onMouseLeave={e => ((e.target as HTMLButtonElement).style.background = 'var(--primary)')}
            >
              + Giỏ
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Featured Products ---
function FeaturedProducts({ products }: { products: Product[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="section" style={{ background: 'var(--gray-50)' }} ref={ref}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="badge badge-red" style={{ marginBottom: '10px', display: 'inline-flex' }}><TrendingUp size={10} /> Nổi Bật</div>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800 }}>
              Sản Phẩm <span className="text-gradient">Được Yêu Thích</span>
            </h2>
          </div>
          <Link href="/products" className="btn-outline" style={{ fontSize: '14px', padding: '10px 22px' }}>
            Xem tất cả <ChevronRight size={16} />
          </Link>
        </motion.div>
        <div className="products-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {products.slice(0, 8).map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Seller CTA ---
function SellerCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="section" ref={ref}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="seller-grid"
          style={{ borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%)', border: '1px solid var(--gray-100)', padding: 'clamp(40px, 6vw, 80px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* BG decoration */}
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '30%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(244,63,94,0.1)', filter: 'blur(40px)' }} />

          <div style={{ position: 'relative' }}>
            <div className="badge badge-red" style={{ marginBottom: '20px', display: 'inline-flex' }}><Store size={10} /> Dành Cho Người Bán</div>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 800, color: 'var(--black)', marginBottom: '16px', lineHeight: 1.2 }}>
              Bắt Đầu Bán Hàng<br />Kiếm Thu Nhập Triệu
            </h2>
            <p style={{ color: 'var(--gray-600)', fontSize: '16px', lineHeight: 1.7, marginBottom: '36px' }}>
              Đăng ký gian hàng miễn phí, tiếp cận hàng triệu khách hàng, công cụ quản lý bán hàng thông minh.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/login?mode=seller">
                <motion.button whileHover={{ scale: 1.04 }} className="btn-primary" style={{ borderRadius: '99px', fontSize: '16px' }}>
                  <span>Đăng ký bán hàng ngay</span>
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
              <Link href="/seller/dashboard">
                <motion.button whileHover={{ scale: 1.04 }} className="btn-outline" style={{ borderRadius: '99px', fontSize: '16px', background: 'white' }}>
                  <span>Xem Dashboard</span>
                </motion.button>
              </Link>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', position: 'relative' }}>
            {[
              { icon: <Users size={24} />, val: '2M+', label: 'Khách hàng tiếp cận' },
              { icon: <ShoppingBag size={24} />, val: '10K+', label: 'Shop tin tưởng' },
              { icon: <TrendingUp size={24} />, val: '500%', label: 'Tăng trưởng doanh thu' },
              { icon: <Award size={24} />, val: '99%', label: 'Hài lòng người bán' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.2 + i * 0.1 }}
                style={{ background: 'white', border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--primary)', marginBottom: '12px' }}>{s.icon}</div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: '28px', fontWeight: 800, color: 'var(--black)', marginBottom: '4px' }}>{s.val}</div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// --- Testimonials ---
function Testimonials({ reviews }: { reviews: Review[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  if (!reviews.length) return null; // chỉ hiện khi có đánh giá thật

  return (
    <section className="section" style={{ background: 'var(--gray-50)' }} ref={ref}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="badge badge-gold" style={{ marginBottom: '12px', display: 'inline-flex' }}><Star size={10} /> Đánh Giá</div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: '12px' }}>
            Khách Hàng <span className="text-gradient">Nói Gì Về Chúng Tôi</span>
          </h2>
        </motion.div>
        <div style={{ position: 'relative' }}>
          <div className="products-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {reviews.slice(0, 3).map((review, i) => (
              <motion.div key={review.id} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1, duration: 0.5 }}>
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '28px', border: '1px solid var(--gray-100)', transition: 'var(--transition)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--gray-100)'; }}
                >
                  <div style={{ display: 'flex', marginBottom: '4px' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="#f59e0b" color="#f59e0b" />)}</div>
                  <p style={{ fontSize: '15px', color: 'var(--gray-700)', lineHeight: 1.7, marginBottom: '20px', fontStyle: 'italic' }}>"{review.comment || 'Sản phẩm tốt, sẽ ủng hộ shop!'}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {review.avatar
                      ? <img src={review.avatar} alt={review.userName} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>{review.userName.charAt(0).toUpperCase()}</div>}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{review.userName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{new Date(review.date).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Main Client ---
export default function HomeClient({
  products, categories, flashSaleProducts, reviews,
}: {
  products: Product[];
  categories: Category[];
  flashSaleProducts: Product[];
  reviews: Review[];
}) {
  return (
    <>
      <HeroBanner />
      <FlashSaleSection flashSaleProducts={flashSaleProducts} />
      <CategoryGrid categories={categories} />
      <FeaturedProducts products={products} />
      <SellerCTA />
      <Testimonials reviews={reviews} />
    </>
  );
}
