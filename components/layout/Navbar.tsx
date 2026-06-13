'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Search, Menu, X, ChevronDown, Heart,
  User, Store, Bell, Package, LogOut, Settings,
  Zap, Shield, Truck
} from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useUser, signOutUser } from '@/lib/supabase/use-user';
import { categories, formatCount } from '@/lib/data/mock-data';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { getTotalItems, openCart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { user, profile } = useUser();
  // Tránh hydration mismatch: dữ liệu localStorage chỉ đọc sau khi client mount.
  const totalItems = mounted ? getTotalItems() : 0;
  const totalWishlist = mounted ? wishlistItems.length : 0;
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Tài khoản';

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await signOutUser();
    router.refresh();
    router.push('/');
    toast.success('Đã đăng xuất');
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const goSearch = (query: string) => {
    const q = query.trim();
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goSearch(searchQuery);
  };

  const isAdmin = pathname.startsWith('/admin');
  const isSeller = pathname.startsWith('/seller');
  if (isAdmin || isSeller) return null;

  return (
    <>
      {/* Promo bar */}
      <div style={{ background: 'var(--primary)', color: 'white', fontSize: '13px', fontWeight: 500, overflow: 'hidden' }}>
        <div className="animate-ticker" style={{ display: 'flex', gap: '80px', padding: '8px 0', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...Array(4)].map((_, i) => (
            <span key={i} style={{ display: 'flex', gap: '48px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={12} /> Flash Sale mỗi ngày — Giảm đến 70%</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Truck size={12} /> Miễn phí vận chuyển đơn từ 299k</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={12} /> Hoàn tiền 100% nếu không hài lòng</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main navbar */}
      <motion.nav
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'white',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: '1px solid var(--gray-100)',
          transition: 'all 0.3s ease',
          boxShadow: scrolled ? 'var(--shadow)' : 'none',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: '70px', gap: '24px' }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <motion.div whileHover={{ scale: 1.02 }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={20} color="white" fill="white" />
              </div>
              <span style={{ fontFamily: 'Playfair Display', fontWeight: 800, fontSize: '22px', color: 'var(--primary)' }}>
                Vibe<span style={{ color: 'var(--black)' }}>Market</span>
              </span>
            </motion.div>
          </Link>

          {/* Category dropdown */}
          <div style={{ position: 'relative' }} onMouseEnter={() => setCatMenuOpen(true)} onMouseLeave={() => setCatMenuOpen(false)}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)',
              background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
              color: 'var(--gray-700)', transition: 'var(--transition)', flexShrink: 0,
            }}>
              <Menu size={16} />
              <span>Danh mục</span>
              <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: catMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            <AnimatePresence>
              {catMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: 'white',
                    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--gray-100)',
                    padding: '8px', minWidth: '220px', zIndex: 100,
                  }}
                >
                  {categories.map(cat => (
                    <Link key={cat.id} href={`/products?category=${cat.name}`} style={{ textDecoration: 'none' }}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--black)' }}>{cat.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{formatCount(cat.count)} sản phẩm</div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search bar */}
          <div style={{ flex: 1, position: 'relative', maxWidth: '560px' }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', color: 'var(--gray-400)', pointerEvents: 'none' }} />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                style={{
                  width: '100%', padding: '11px 16px 11px 44px',
                  border: '2px solid', borderColor: searchOpen ? 'var(--primary)' : 'var(--gray-200)',
                  borderRadius: '99px', fontSize: '14px', fontFamily: 'Inter', outline: 'none',
                  transition: 'all 0.3s',
                  boxShadow: searchOpen ? '0 0 0 3px rgba(153,0,0,0.1)' : 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute', right: '6px', background: 'var(--primary)',
                  border: 'none', borderRadius: '99px', padding: '6px 16px',
                  cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: 600,
                }}
              >
                Tìm
              </button>
            </form>
            <AnimatePresence>
              {searchOpen && searchQuery.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                    background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--gray-100)', padding: '8px', zIndex: 100,
                  }}
                >
                  <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--gray-400)', fontWeight: 600 }}>GỢI Ý TÌM KIẾM</div>
                  {['Áo khoác', 'Giày sneaker', 'Tai nghe bluetooth', 'Son môi'].slice(0, 4).map(s => (
                    <div key={s} onMouseDown={() => goSearch(s)} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Search size={14} style={{ color: 'var(--gray-400)' }} /> {s}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            {/* Wishlist */}
            <Link href="/wishlist" style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                style={{ position: 'relative', padding: '8px', cursor: 'pointer', color: totalWishlist > 0 ? 'var(--primary)' : 'var(--gray-600)' }}>
                <Heart size={22} fill={totalWishlist > 0 ? 'var(--primary)' : 'none'} />
                {totalWishlist > 0 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{ position: 'absolute', top: 2, right: 2, background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, border: '2px solid white' }}>
                    {totalWishlist > 99 ? '99+' : totalWishlist}
                  </motion.div>
                )}
              </motion.div>
            </Link>

            {/* Cart */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={openCart}
              style={{ position: 'relative', padding: '8px', cursor: 'pointer', color: 'var(--gray-700)' }}>
              <ShoppingCart size={22} />
                {totalItems > 0 && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{
                      position: 'absolute', top: 2, right: 2,
                      background: 'var(--secondary)', color: 'white',
                      borderRadius: '50%', width: '18px', height: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, border: '2px solid white',
                    }}
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </motion.div>
                )}
            </motion.div>

            {/* User menu */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
              <motion.button whileHover={{ scale: 1.05 }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '99px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', cursor: 'pointer' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {mounted && profile?.avatar_url
                    ? <img src={profile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <User size={16} color="white" />}
                </div>
                <span className="line-clamp-1" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--gray-700)', maxWidth: '120px' }}>{mounted && user ? displayName : 'Tài khoản'}</span>
                <ChevronDown size={14} style={{ color: 'var(--gray-400)' }} />
              </motion.button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--gray-100)', padding: '8px', minWidth: '200px', zIndex: 100 }}
                  >
                    {mounted && user ? (
                      <div style={{ padding: '10px 12px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Xin chào,</div>
                        <div className="line-clamp-1" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--black)' }}>{displayName}</div>
                      </div>
                    ) : (
                      <Link href="/login" style={{ textDecoration: 'none' }}>
                        <MenuItem icon={<User size={16} />} label="Đăng nhập / Đăng ký" />
                      </Link>
                    )}
                    <div style={{ margin: '4px 0', height: '1px', background: 'var(--gray-100)' }} />
                    <Link href="/seller/dashboard" style={{ textDecoration: 'none' }}>
                      <MenuItem icon={<Store size={16} />} label="Quản lý bán hàng" />
                    </Link>
                    <Link href="/admin/dashboard" style={{ textDecoration: 'none' }}>
                      <MenuItem icon={<Settings size={16} />} label="Admin Dashboard" />
                    </Link>
                    <div style={{ margin: '4px 0', height: '1px', background: 'var(--gray-100)' }} />
                    <Link href="/profile" style={{ textDecoration: 'none' }}>
                      <MenuItem icon={<User size={16} />} label="Trang cá nhân" />
                    </Link>
                    <Link href="/orders" style={{ textDecoration: 'none' }}>
                      <MenuItem icon={<Package size={16} />} label="Đơn mua" />
                    </Link>
                    <Link href="/wishlist" style={{ textDecoration: 'none' }}>
                      <MenuItem icon={<Heart size={16} />} label={`Yêu thích${totalWishlist > 0 ? ` (${totalWishlist})` : ''}`} />
                    </Link>
                    <MenuItem icon={<Bell size={16} />} label="Thông báo" onClick={() => { setUserMenuOpen(false); toast('Trung tâm thông báo sắp ra mắt'); }} />
                    {mounted && user && (
                      <>
                        <div style={{ margin: '4px 0', height: '1px', background: 'var(--gray-100)' }} />
                        <MenuItem icon={<LogOut size={16} />} label="Đăng xuất" danger onClick={handleLogout} />
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
              className="mobile-menu-btn"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'white', padding: '80px 24px 24px', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(cat => (
                <Link key={cat.id} href={`/products?category=${cat.name}`} style={{ textDecoration: 'none' }}
                  onClick={() => setMobileOpen(false)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--gray-100)' }}>
                    <span style={{ fontSize: '22px' }}>{cat.icon}</span>
                    <span style={{ fontSize: '15px', fontWeight: 500 }}>{cat.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}

function MenuItem({ icon, label, danger, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
      borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px',
      color: danger ? '#dc2626' : 'var(--gray-700)', transition: 'var(--transition)',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? '#fef2f2' : 'var(--gray-50)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {icon} {label}
    </div>
  );
}
