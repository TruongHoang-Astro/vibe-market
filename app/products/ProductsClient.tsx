'use client';
import Link from 'next/link';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Star, Grid3X3, List, ChevronDown,
  Search, X, Filter, ChevronRight, Heart, ShoppingCart, Flame, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, formatNumber } from '@/lib/data/mock-data';
import type { Product, Category } from '@/lib/data/mock-data';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';

const sortOptions = [
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
];

const priceRanges = [
  { label: 'Dưới 200.000đ', min: 0, max: 200000 },
  { label: '200k - 500k', min: 200000, max: 500000 },
  { label: '500k - 1 triệu', min: 500000, max: 1000000 },
  { label: '1 triệu - 5 triệu', min: 1000000, max: 5000000 },
  { label: 'Trên 5 triệu', min: 5000000, max: Infinity },
];

function ProductsContent({ allProducts, categories }: { allProducts: Product[]; categories: Category[] }) {
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  // Bộ lọc đến từ URL
  const [flashOnly, setFlashOnly] = useState(false);
  const [saleOnly, setSaleOnly] = useState(false);
  const [badgeFilter, setBadgeFilter] = useState<string | null>(null);
  // Pagination
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  const { addItem, openCart } = useCartStore();

  // Đồng bộ bộ lọc theo query string mỗi khi URL thay đổi
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'Tất cả');
    setSearchQuery(searchParams.get('search') || '');
    setFlashOnly(searchParams.get('flash') === 'true');
    setSaleOnly(searchParams.get('sale') === 'true');
    setBadgeFilter(searchParams.get('badge'));
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  // Reset page khi filter thay đổi
  useEffect(() => { setPage(1); }, [selectedCategory, selectedPrice, minRating, flashOnly, saleOnly, badgeFilter, searchQuery, sortBy]);

  const hasActiveFilter = selectedCategory !== 'Tất cả' || selectedPrice !== null || minRating !== null || flashOnly || saleOnly || badgeFilter !== null || searchQuery !== '';

  const clearAll = () => {
    setSelectedCategory('Tất cả');
    setSelectedPrice(null);
    setMinRating(null);
    setFlashOnly(false);
    setSaleOnly(false);
    setBadgeFilter(null);
    setSearchQuery('');
  };

  const pageTitle = searchQuery ? `Kết quả cho “${searchQuery}”`
    : flashOnly ? '⚡ Flash Sale'
    : saleOnly ? 'Đang Khuyến Mãi'
    : badgeFilter === 'new' ? 'Sản Phẩm Mới'
    : badgeFilter === 'bestseller' ? 'Hàng Bán Chạy'
    : badgeFilter === 'hot' ? 'Sản Phẩm Hot'
    : selectedCategory !== 'Tất cả' ? selectedCategory
    : 'Tất Cả Sản Phẩm';

  const allFiltered = allProducts
    .filter(p => {
      const catMatch = selectedCategory === 'Tất cả' || p.category === selectedCategory;
      const priceMatch = selectedPrice === null || (() => {
        const range = priceRanges[selectedPrice];
        return p.price >= range.min && p.price <= range.max;
      })();
      const searchMatch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.shopName.toLowerCase().includes(searchQuery.toLowerCase());
      const flashMatch = !flashOnly || p.isFlashSale === true;
      const saleMatch = !saleOnly || p.originalPrice > p.price;
      const badgeMatch = !badgeFilter || p.badge === badgeFilter;
      const ratingMatch = minRating === null || p.rating >= minRating;
      return catMatch && priceMatch && searchMatch && flashMatch && saleMatch && badgeMatch && ratingMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'newest': return b.id.localeCompare(a.id);
        default: return b.sold - a.sold;
      }
    });

  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
  const filteredProducts = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Page header */}
      <div style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a0000)', padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Trang chủ</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--primary)' }}>Sản phẩm</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
            {pageTitle}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>{allFiltered.length} sản phẩm đang có sẵn</p>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm trong kết quả..."
                style={{ padding: '10px 12px 10px 36px', border: '1.5px solid var(--gray-200)', borderRadius: '99px', fontSize: '14px', outline: 'none', width: '240px', fontFamily: 'Inter' }}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--gray-200)')}
              />
              {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}><X size={14} /></button>}
            </div>
            <span style={{ fontSize: '14px', color: 'var(--gray-500)' }}>
              <strong style={{ color: 'var(--black)' }}>{filteredProducts.length}</strong> kết quả
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Sort dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setSortOpen(!sortOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1.5px solid var(--gray-200)', borderRadius: '10px', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                <SlidersHorizontal size={16} />
                {sortOptions.find(s => s.value === sortBy)?.label}
                <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: sortOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--gray-100)', padding: '8px', minWidth: '200px', zIndex: 20 }}>
                    {sortOptions.map(opt => (
                      <div key={opt.value} onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                        style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px', fontWeight: sortBy === opt.value ? 600 : 400, color: sortBy === opt.value ? 'var(--primary)' : 'var(--gray-700)', background: sortBy === opt.value ? 'rgba(153,0,0,0.06)' : 'transparent' }}
                        onMouseEnter={e => { if (sortBy !== opt.value) (e.currentTarget as HTMLElement).style.background = 'var(--gray-50)'; }}
                        onMouseLeave={e => { if (sortBy !== opt.value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* View mode */}
            <div style={{ display: 'flex', border: '1.5px solid var(--gray-200)', borderRadius: '10px', overflow: 'hidden' }}>
              {(['grid', 'list'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  style={{ padding: '10px 14px', background: viewMode === mode ? 'var(--primary)' : 'white', border: 'none', cursor: 'pointer', color: viewMode === mode ? 'white' : 'var(--gray-500)', transition: 'all 0.2s' }}>
                  {mode === 'grid' ? <Grid3X3 size={16} /> : <List size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="products-layout" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Sidebar filters */}
          <div className="products-sidebar" style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', overflow: 'hidden', position: 'sticky', top: '90px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
                <Filter size={16} style={{ color: 'var(--primary)' }} />
                Bộ lọc
              </div>
              {hasActiveFilter && (
                <button onClick={clearAll}
                  style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Categories */}
            <div style={{ padding: '16px 20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Danh mục</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {['Tất cả', ...categories.map(c => c.name)].map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: selectedCategory === cat ? 'rgba(153,0,0,0.08)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: selectedCategory === cat ? 600 : 400, color: selectedCategory === cat ? 'var(--primary)' : 'var(--gray-700)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (selectedCategory !== cat) (e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)'; }}
                    onMouseLeave={e => { if (selectedCategory !== cat) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    {cat}
                    {selectedCategory === cat && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--gray-100)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Khoảng giá</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {priceRanges.map((range, i) => (
                  <button key={i} onClick={() => setSelectedPrice(selectedPrice === i ? null : i)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: selectedPrice === i ? 'rgba(153,0,0,0.08)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: selectedPrice === i ? 600 : 400, color: selectedPrice === i ? 'var(--primary)' : 'var(--gray-700)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (selectedPrice !== i) (e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)'; }}
                    onMouseLeave={e => { if (selectedPrice !== i) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${selectedPrice === i ? 'var(--primary)' : 'var(--gray-300)'}`, background: selectedPrice === i ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                      {selectedPrice === i && <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '2px' }} />}
                    </div>
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating filter — clickable, highlight active */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--gray-100)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Đánh giá</h4>
              {[5, 4, 3].map(stars => (
                <button key={stars} onClick={() => setMinRating(minRating === stars ? null : stars)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: minRating === stars ? 'rgba(153,0,0,0.08)' : 'transparent', border: 'none', cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (minRating !== stars) (e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)'; }}
                  onMouseLeave={e => { if (minRating !== stars) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                  <div style={{ display: 'flex', gap: '2px' }}>{[...Array(5)].map((_, i) => <Star key={i} size={13} fill={i < stars ? '#f59e0b' : '#e5e5e5'} color={i < stars ? '#f59e0b' : '#e5e5e5'} />)}</div>
                  <span style={{ fontSize: '13px', color: minRating === stars ? 'var(--primary)' : 'var(--gray-600)', fontWeight: minRating === stars ? 700 : 400 }}>từ {stars} sao</span>
                  {minRating === stars && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />}
                </button>
              ))}
            </div>

            {/* Flash & Sale filters */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--gray-100)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Ưu đãi</h4>
              {[
                { key: 'flash', label: '⚡ Flash Sale', active: flashOnly, toggle: () => setFlashOnly(!flashOnly) },
                { key: 'sale',  label: '🏷️ Đang giảm giá', active: saleOnly, toggle: () => setSaleOnly(!saleOnly) },
              ].map(opt => (
                <button key={opt.key} onClick={opt.toggle}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: opt.active ? 'rgba(153,0,0,0.08)' : 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontSize: '14px', fontWeight: opt.active ? 600 : 400, color: opt.active ? 'var(--primary)' : 'var(--gray-700)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!opt.active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)'; }}
                  onMouseLeave={e => { if (!opt.active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${opt.active ? 'var(--primary)' : 'var(--gray-300)'}`, background: opt.active ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                    {opt.active && <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '2px' }} />}
                  </div>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          <div>
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Không tìm thấy sản phẩm</h3>
                <p style={{ color: 'var(--gray-500)' }}>Thử thay đổi bộ lọc để xem thêm kết quả</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="products-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {filteredProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} onAddCart={() => { addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, quantity: 1, shopId: product.shopId, shopName: product.shopName }); openCart(); toast.success('Đã thêm vào giỏ!', { description: product.name, duration: 2000 }); }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredProducts.map((product, i) => (
                  <ProductListItem key={product.id} product={product} index={i} onAddCart={() => { addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, quantity: 1, shopId: product.shopId, shopName: product.shopName }); openCart(); }} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '9px 16px', border: '1.5px solid var(--gray-200)', borderRadius: '10px', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? 'var(--gray-300)' : 'var(--gray-700)', fontSize: '13px', fontWeight: 600 }}>
                  <ChevronLeft size={16} /> Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: '40px', height: '40px', borderRadius: '10px', border: `1.5px solid ${page === p ? 'var(--primary)' : 'var(--gray-200)'}`, background: page === p ? 'var(--primary)' : 'white', color: page === p ? 'white' : 'var(--gray-700)', fontWeight: page === p ? 700 : 400, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '9px 16px', border: '1.5px solid var(--gray-200)', borderRadius: '10px', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? 'var(--gray-300)' : 'var(--gray-700)', fontSize: '13px', fontWeight: 600 }}>
                  Sau <ChevronRight size={16} />
                </button>
                <span style={{ fontSize: '13px', color: 'var(--gray-500)', marginLeft: '8px' }}>
                  Trang {page}/{totalPages} · {allFiltered.length} sản phẩm
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, index, onAddCart }: { product: Product; index: number; onAddCart: () => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const { toggleItem, isWished } = useWishlistStore();
  const wished = isWished(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem({ productId: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, image: product.image, shopName: product.shopName, rating: product.rating, sold: product.sold, badge: product.badge });
    toast(wished ? 'Đã xóa khỏi yêu thích' : '❤️ Đã thêm vào yêu thích', { description: product.name, duration: 2000 });
  };

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: Math.min(index * 0.05, 0.4) }}>
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
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--secondary)', color: 'white', fontSize: '11px', fontWeight: 800, padding: '2px 7px', borderRadius: '99px' }}>
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </div>
            )}
            <button onClick={handleWishlist}
              style={{ position: 'absolute', bottom: '10px', right: '10px', width: '32px', height: '32px', borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)', opacity: wished ? 1 : 0, transition: 'opacity 0.2s' }} className="wishlist-btn">
              <Heart size={14} fill={wished ? 'var(--primary)' : 'none'} style={{ color: 'var(--primary)' }} />
            </button>
          </div>
        </Link>
        <div className="card-body">
          <p style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>{product.shopName}</p>
          <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
            <h3 className="line-clamp-2" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gray-800)', marginBottom: '8px', lineHeight: 1.4 }}>{product.name}</h3>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
            <Star size={12} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{product.rating}</span>
            <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>({formatNumber(product.reviews)}) · {formatNumber(product.sold)} đã bán</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="price-sale" style={{ fontSize: '15px' }}>{formatPrice(product.price)}</div>
              {product.originalPrice > product.price && <div className="price-original">{formatPrice(product.originalPrice)}</div>}
            </div>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} onClick={onAddCart}
              style={{ background: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '7px 12px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              + Giỏ
            </motion.button>
          </div>
        </div>
      </div>
      <style>{`.product-card:hover .wishlist-btn { opacity: 1 !important; }`}</style>
    </motion.div>
  );
}

function ProductListItem({ product, index, onAddCart }: { product: Product; index: number; onAddCart: () => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });

  return (
    <motion.div ref={ref} initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: Math.min(index * 0.05, 0.3) }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', display: 'flex', gap: '20px', overflow: 'hidden', transition: 'var(--transition)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--gray-100)'; }}>
        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: '160px', height: '160px', overflow: 'hidden' }}>
            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
              onMouseEnter={e => ((e.target as HTMLImageElement).style.transform = 'scale(1.06)')}
              onMouseLeave={e => ((e.target as HTMLImageElement).style.transform = 'scale(1)')} />
          </div>
        </Link>
        <div style={{ flex: 1, padding: '20px 20px 20px 0', display: 'flex', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginBottom: '6px' }}>{product.shopName}</p>
            <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '10px' }}>{product.name}</h3>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={13} fill={s <= Math.floor(product.rating) ? '#f59e0b' : '#e5e5e5'} color={s <= Math.floor(product.rating) ? '#f59e0b' : '#e5e5e5'} />)}</div>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{product.rating}</span>
              <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>({formatNumber(product.reviews)} đánh giá) · {formatNumber(product.sold)} đã bán</span>
            </div>
            <p className="line-clamp-2" style={{ fontSize: '13px', color: 'var(--gray-500)', lineHeight: 1.6 }}>{product.description}</p>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(product.price)}</div>
              {product.originalPrice > product.price && <div className="price-original">{formatPrice(product.originalPrice)}</div>}
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onAddCart}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', border: 'none', borderRadius: '10px', padding: '10px 20px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
              <ShoppingCart size={16} />
              Thêm giỏ hàng
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductsClient({ allProducts, categories }: { allProducts: Product[]; categories: Category[] }) {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Flame size={32} style={{ color: 'var(--primary)', animation: 'pulse-red 2s infinite' }} />
    </div>}>
      <ProductsContent allProducts={allProducts} categories={categories} />
    </Suspense>
  );
}
