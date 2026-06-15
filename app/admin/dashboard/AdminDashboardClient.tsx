'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, Store, Package, ShoppingBag, Settings, Zap, LogOut, Bell,
  Search, ArrowUpRight, Shield, CheckCircle2, XCircle, AlertTriangle, Eye, Trash2,
  DollarSign, Star, Menu, Flag, Lock, Unlock, ShieldCheck,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { formatPrice, formatNumber } from '@/lib/data/mock-data';
import type { UserRole } from '@/lib/supabase/types';
import {
  setUserStatus, setUserRole, setShopVerified, deleteShop,
  adminDeleteProduct, adminDeleteReview, resolveReport,
  type AdminDashboardData,
} from '@/app/actions/admin';

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: '#fef9c3', color: '#a16207', label: 'Chờ xác nhận' },
  confirmed: { bg: '#dbeafe', color: '#1d4ed8', label: 'Đã xác nhận' },
  shipping: { bg: '#dcfce7', color: '#15803d', label: 'Đang giao' },
  delivered: { bg: '#f0fdf4', color: '#16a34a', label: 'Đã giao' },
  cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Đã hủy' },
};

const reportTypeLabel: Record<string, string> = { product: 'Sản phẩm', review: 'Đánh giá', shop: 'Gian hàng' };

export default function AdminDashboardClient({ data }: { data: AdminDashboardData }) {
  const { overview, users, shops, products, orders, reports } = data;
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shopFilter, setShopFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [userFilter, setUserFilter] = useState<'all' | 'buyer' | 'seller' | 'banned'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const navItems = [
    { key: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={18} />, badge: 0 },
    { key: 'users', label: 'Người dùng', icon: <Users size={18} />, badge: 0 },
    { key: 'shops', label: 'Quản lý Shop', icon: <Store size={18} />, badge: overview.pendingShops },
    { key: 'products', label: 'Sản phẩm', icon: <Package size={18} />, badge: 0 },
    { key: 'orders', label: 'Đơn hàng', icon: <ShoppingBag size={18} />, badge: 0 },
    { key: 'reports', label: 'Kiểm duyệt', icon: <Flag size={18} />, badge: overview.openReports },
    { key: 'settings', label: 'Cài đặt', icon: <Settings size={18} />, badge: 0 },
  ];

  const run = async (fn: () => Promise<{ ok?: true; error?: string }>, okMsg: string) => {
    if (busy) return;
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success(okMsg);
    startTransition(() => router.refresh());
  };

  const filteredUsers = users.filter(u => {
    const f = userFilter === 'all' ? true
      : userFilter === 'banned' ? u.status === 'banned'
      : u.role === userFilter;
    const s = !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    return f && s;
  });
  const filteredShops = shops.filter(s => shopFilter === 'all' ? true : shopFilter === 'pending' ? !s.verified : s.verified);
  const filteredProducts = products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.shopName.toLowerCase().includes(productSearch.toLowerCase()));
  const openReports = reports.filter(r => r.status === 'open');
  const topProducts = products.slice(0, 4);
  const pendingShopList = shops.filter(s => !s.verified).slice(0, 5);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      {sidebarOpen && <div className="dash-backdrop" onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 55 }} />}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '240px', background: 'white', borderRight: '1px solid var(--gray-200)', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 30, overflowY: 'auto' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--gray-100)' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #ef4444, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="white" fill="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 800, fontSize: '16px', color: 'var(--black)' }}>VibeMarket</div>
              <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Admin Panel</div>
            </div>
          </Link>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--black)' }}>Super Admin</div>
              <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Quản trị nền tảng</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '12px', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginBottom: '2px', background: activeTab === item.key ? 'rgba(239,68,68,0.1)' : 'transparent', transition: 'all 0.15s', textAlign: 'left' }}
              onMouseEnter={e => { if (activeTab !== item.key) (e.currentTarget as HTMLElement).style.background = 'var(--gray-50)'; }}
              onMouseLeave={e => { if (activeTab !== item.key) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <span style={{ color: activeTab === item.key ? 'var(--primary)' : 'var(--gray-500)', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ color: activeTab === item.key ? 'var(--primary)' : 'var(--gray-600)', fontSize: '14px', fontWeight: activeTab === item.key ? 600 : 400 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px' }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 12px 20px', borderTop: '1px solid var(--gray-100)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '8px', textDecoration: 'none' }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'var(--gray-50)')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'transparent')}>
            <LogOut size={16} style={{ color: 'var(--gray-400)' }} />
            <span style={{ color: 'var(--gray-600)', fontSize: '14px' }}>Về trang chủ</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main" style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 16px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button className="dash-burger" onClick={() => setSidebarOpen(true)} aria-label="Mở menu" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#0f172a', alignItems: 'center' }}>
              <Menu size={22} />
            </button>
            <h1 className="line-clamp-1" style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              {navItems.find(n => n.key === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button style={{ position: 'relative', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', color: '#475569' }} onClick={() => setActiveTab('reports')}>
              <Bell size={18} />
              {overview.openReports > 0 && <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }} />}
            </button>
            <div className="nav-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#f8fafc', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={14} color="white" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Admin</span>
            </div>
          </div>
        </header>

        <div className="dash-content" style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Tổng doanh thu', val: formatPrice(overview.totalRevenue), icon: <DollarSign size={20} />, color: '#ef4444', sub: 'Đã trừ đơn hủy' },
                  { label: 'Tổng người dùng', val: formatNumber(overview.totalUsers), icon: <Users size={20} />, color: '#2563eb', sub: `${overview.bannedUsers} bị khóa` },
                  { label: 'Gian hàng', val: formatNumber(overview.totalShops), icon: <Store size={20} />, color: '#16a34a', sub: `Chờ duyệt: ${overview.pendingShops}` },
                  { label: 'Tổng đơn hàng', val: formatNumber(overview.totalOrders), icon: <ShoppingBag size={20} />, color: '#f59e0b', sub: `${overview.totalProducts} sản phẩm` },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${stat.color}, ${stat.color}66)` }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>{stat.icon}</div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '2px' }}><ArrowUpRight size={13} /> thực</span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{stat.val}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>{stat.label}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{stat.sub}</div>
                  </motion.div>
                ))}
              </div>

              <div className="dash-charts" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>Doanh thu nền tảng (6 tháng)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={overview.monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(v) => formatPrice(Number(v))} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: '#0f172a' }}>GMV theo danh mục</h3>
                  {overview.categoryRevenue.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Chưa có dữ liệu</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={overview.categoryRevenue} cx="50%" cy="50%" innerRadius={52} outerRadius={80} dataKey="value" paddingAngle={3}>
                            {overview.categoryRevenue.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v) => formatPrice(Number(v))} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        {overview.categoryRevenue.map((d, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: d.color }} />
                              <span style={{ color: '#475569' }}>{d.name}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatPrice(d.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              </div>

              <div className="dash-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Shop chờ duyệt */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Shop chờ duyệt</h3>
                    <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px' }}>{overview.pendingShops} chờ</span>
                  </div>
                  <div style={{ padding: '12px 0' }}>
                    {pendingShopList.length === 0 ? (
                      <div style={{ padding: '28px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Không có shop nào chờ duyệt 🎉</div>
                    ) : pendingShopList.map((shop, i) => (
                      <div key={shop.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < pendingShopList.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <img src={shop.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=ef4444&color=fff`} alt={shop.name} style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' }} />
                          <div style={{ minWidth: 0 }}>
                            <div className="line-clamp-1" style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{shop.name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{shop.category} · {shop.products} sp</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button disabled={busy} onClick={() => run(() => setShopVerified(shop.id, true), 'Đã duyệt gian hàng')} style={{ padding: '5px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', fontSize: '12px', fontWeight: 700, color: '#16a34a', cursor: 'pointer' }}>Duyệt</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Top products */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Sản phẩm bán chạy nhất</h3>
                  </div>
                  <div style={{ padding: '12px 0' }}>
                    {topProducts.length === 0 ? (
                      <div style={{ padding: '28px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Chưa có sản phẩm</div>
                    ) : topProducts.map((product, i) => (
                      <div key={product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: i < topProducts.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: i === 0 ? '#fef3c7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: i === 0 ? '#d97706' : '#64748b', flexShrink: 0 }}>{i + 1}</span>
                          <img src={product.image} alt={product.name} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                          <div style={{ minWidth: 0 }}>
                            <div className="line-clamp-1" style={{ fontWeight: 500, fontSize: '13px', color: '#0f172a', maxWidth: '140px' }}>{product.name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{product.shopName}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{formatNumber(product.sold)} đã bán</div>
                          <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>{formatPrice(product.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div>
              <div className="dash-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {[
                  { label: 'Tổng người dùng', val: formatNumber(overview.totalUsers), color: '#2563eb', icon: <Users size={18} /> },
                  { label: 'Người bán', val: formatNumber(users.filter(u => u.role === 'seller').length), color: '#ef4444', icon: <Store size={18} /> },
                  { label: 'Bị khóa', val: String(overview.bannedUsers), color: '#dc2626', icon: <XCircle size={18} /> },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{s.val}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {([['all', 'Tất cả'], ['buyer', 'Người mua'], ['seller', 'Người bán'], ['banned', 'Bị khóa']] as const).map(([key, label]) => (
                      <button key={key} onClick={() => setUserFilter(key)} style={{ padding: '7px 14px', borderRadius: '99px', border: '1.5px solid #e2e8f0', background: userFilter === key ? '#ef4444' : 'white', color: userFilter === key ? 'white' : '#475569', fontWeight: userFilter === key ? 700 : 400, fontSize: '13px', cursor: 'pointer' }}>{label}</button>
                    ))}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Tìm người dùng..." style={{ padding: '8px 10px 8px 30px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'Inter', background: '#f8fafc' }} />
                  </div>
                </div>
                <table className="table-base">
                  <thead><tr><th>Người dùng</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày đăng ký</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#ef4444,#f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>{user.name.charAt(0).toUpperCase()}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{user.name}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '13px', color: '#475569' }}>{user.email}</td>
                        <td style={{ fontSize: '13px', color: '#475569' }}>{user.phone}</td>
                        <td>
                          <select value={user.role} disabled={busy} onChange={e => run(() => setUserRole(user.id, e.target.value as UserRole), 'Đã đổi vai trò')}
                            style={{ padding: '5px 8px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: 'white', color: '#0f172a' }}>
                            <option value="buyer">🛒 Người mua</option>
                            <option value="seller">🏪 Người bán</option>
                            <option value="admin">🛡️ Admin</option>
                          </select>
                        </td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, background: user.status === 'active' ? '#f0fdf4' : '#fef2f2', color: user.status === 'active' ? '#16a34a' : '#dc2626' }}>
                            {user.status === 'active' ? '✓ Hoạt động' : '✗ Bị khóa'}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#64748b' }}>{new Date(user.joined).toLocaleDateString('vi-VN')}</td>
                        <td>
                          {user.status === 'active' ? (
                            <button disabled={busy} onClick={() => run(() => setUserStatus(user.id, 'banned'), 'Đã khóa tài khoản')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: '1.5px solid #fecaca', borderRadius: '8px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626', fontSize: '12px', fontWeight: 600 }}><Lock size={13} /> Khóa</button>
                          ) : (
                            <button disabled={busy} onClick={() => run(() => setUserStatus(user.id, 'active'), 'Đã mở khóa tài khoản')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: '1.5px solid #bbf7d0', borderRadius: '8px', background: '#f0fdf4', cursor: 'pointer', color: '#16a34a', fontSize: '12px', fontWeight: 600 }}><Unlock size={13} /> Mở</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Không có người dùng phù hợp</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SHOPS ── */}
          {activeTab === 'shops' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {([['all', 'Tất cả'], ['pending', `⏳ Chờ duyệt (${overview.pendingShops})`], ['active', '✓ Đã duyệt']] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setShopFilter(key)} style={{ padding: '8px 16px', borderRadius: '99px', border: '1.5px solid #e2e8f0', background: shopFilter === key ? '#ef4444' : 'white', color: shopFilter === key ? 'white' : '#475569', fontWeight: shopFilter === key ? 700 : 400, fontSize: '13px', cursor: 'pointer' }}>{label}</button>
                ))}
              </div>
              {filteredShops.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Không có gian hàng phù hợp</div>
              ) : (
                <div className="dash-3 dash-shops" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {filteredShops.map((shop, i) => (
                    <motion.div key={shop.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.06, 0.4) }} style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <div style={{ height: '100px', position: 'relative', overflow: 'hidden', background: '#0f172a' }}>
                        {shop.banner && <img src={shop.banner} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                          {shop.verified ? (
                            <span style={{ background: 'rgba(37,99,235,0.9)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={10} /> Đã duyệt</span>
                          ) : (
                            <span style={{ background: 'rgba(234,179,8,0.9)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={10} /> Chờ duyệt</span>
                          )}
                        </div>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', transform: 'translateY(-20px)', marginBottom: '-4px' }}>
                          <img src={shop.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=ef4444&color=fff`} alt={shop.name} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                          <div style={{ minWidth: 0 }}>
                            <div className="line-clamp-1" style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{shop.name}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{shop.category}</div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', marginBottom: '14px' }}>
                          {[{ label: 'Sản phẩm', val: shop.products }, { label: 'Đánh giá', val: `⭐ ${shop.rating}` }, { label: 'Theo dõi', val: formatNumber(shop.followers) }, { label: 'Phản hồi', val: `${shop.responseRate}%` }].map((s, j) => (
                            <div key={j} style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{s.val}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link href={`/shop/${shop.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                            <button style={{ width: '100%', padding: '8px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Eye size={13} /> Xem</button>
                          </Link>
                          {!shop.verified ? (
                            <button disabled={busy} onClick={() => run(() => setShopVerified(shop.id, true), 'Đã duyệt gian hàng')} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: '#f0fdf4', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><ShieldCheck size={13} /> Duyệt</button>
                          ) : (
                            <button disabled={busy} onClick={() => run(() => setShopVerified(shop.id, false), 'Đã gỡ xác minh')} style={{ flex: 1, padding: '8px', border: '1.5px solid #fde68a', borderRadius: '8px', background: '#fffbeb', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Lock size={13} /> Gỡ</button>
                          )}
                          <button disabled={busy} onClick={() => { if (confirm(`Xóa gian hàng "${shop.name}" và toàn bộ sản phẩm? Không thể hoàn tác.`)) run(() => deleteShop(shop.id), 'Đã xóa gian hàng'); }} style={{ padding: '8px 10px', border: '1.5px solid #fecaca', borderRadius: '8px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626' }} title="Xóa"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {activeTab === 'products' && (
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>Tất cả sản phẩm ({products.length})</h3>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Tìm sản phẩm..." style={{ padding: '8px 10px 8px 30px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'Inter', background: '#f8fafc', width: '220px' }} />
                </div>
              </div>
              <table className="table-base">
                <thead><tr><th>Sản phẩm</th><th>Shop</th><th>Danh mục</th><th>Giá</th><th>Đã bán</th><th>Đánh giá</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={product.image} alt={product.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                          <span className="line-clamp-1" style={{ fontSize: '13px', fontWeight: 500, maxWidth: '180px' }}>{product.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>{product.shopName}</td>
                      <td style={{ fontSize: '13px', color: '#475569' }}>{product.category}</td>
                      <td style={{ fontWeight: 700, fontSize: '14px', color: '#ef4444' }}>{formatPrice(product.price)}</td>
                      <td style={{ fontWeight: 600 }}>{formatNumber(product.sold)}</td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={12} fill="#f59e0b" color="#f59e0b" /><span style={{ fontSize: '13px', fontWeight: 600 }}>{product.rating}</span></div></td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Link href={`/products/${product.id}`}><button style={{ padding: '5px 9px', border: '1.5px solid #e2e8f0', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#475569' }}><Eye size={13} /></button></Link>
                          <button disabled={busy} onClick={() => { if (confirm(`Gỡ sản phẩm "${product.name}"?`)) run(() => adminDeleteProduct(product.id), 'Đã gỡ sản phẩm'); }} style={{ padding: '5px 9px', border: '1.5px solid #fecaca', borderRadius: '7px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Không có sản phẩm phù hợp</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── ORDERS ── */}
          {activeTab === 'orders' && (
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>Tất cả đơn hàng ({orders.length})</h3>
              </div>
              <table className="table-base">
                <thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Giao tới</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Ngày đặt</th></tr></thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 700, color: '#ef4444', fontSize: '13px' }}>{order.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {order.itemImage && <img src={order.itemImage} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />}
                          <span className="line-clamp-1" style={{ fontSize: '13px', maxWidth: '150px' }}>{order.itemName}{order.itemCount > 1 ? ` +${order.itemCount - 1}` : ''}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: '#475569' }}>{order.address.split(',')[0]}</td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(order.total)}</td>
                      <td style={{ fontSize: '13px' }}>{order.paymentMethod}</td>
                      <td><span style={{ background: statusColors[order.status]?.bg, color: statusColors[order.status]?.color, padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>{statusColors[order.status]?.label ?? order.status}</span></td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có đơn hàng nào</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── REPORTS (Kiểm duyệt) ── */}
          {activeTab === 'reports' && (
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>Báo cáo vi phạm</h3>
                <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px' }}>{openReports.length} chờ xử lý</span>
              </div>
              {reports.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                  <Flag size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>Chưa có báo cáo nào</p>
                  <p style={{ fontSize: '13px' }}>Báo cáo từ người dùng (sản phẩm/đánh giá/gian hàng vi phạm) sẽ hiện ở đây.</p>
                </div>
              ) : (
                <table className="table-base">
                  <thead><tr><th>Loại</th><th>Đối tượng</th><th>Lý do</th><th>Trạng thái</th><th>Ngày</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id}>
                        <td><span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, background: '#eff6ff', color: '#2563eb' }}>{reportTypeLabel[r.targetType] ?? r.targetType}</span></td>
                        <td style={{ fontSize: '13px', color: '#0f172a', maxWidth: '180px' }} className="line-clamp-1">{r.targetLabel || r.targetId}</td>
                        <td style={{ fontSize: '13px', color: '#475569', maxWidth: '220px' }}>{r.reason || '—'}</td>
                        <td><span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, background: r.status === 'open' ? '#fef3c7' : r.status === 'resolved' ? '#f0fdf4' : '#f1f5f9', color: r.status === 'open' ? '#d97706' : r.status === 'resolved' ? '#16a34a' : '#64748b' }}>{r.status === 'open' ? 'Chờ xử lý' : r.status === 'resolved' ? 'Đã xử lý' : 'Bỏ qua'}</span></td>
                        <td style={{ color: '#64748b', fontSize: '13px' }}>{new Date(r.date).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {r.targetType === 'product' && (
                              <button disabled={busy} onClick={() => { if (confirm('Gỡ sản phẩm bị báo cáo?')) run(async () => { const d = await adminDeleteProduct(r.targetId); if (!d.error) await resolveReport(r.id, 'resolved'); return d; }, 'Đã gỡ & xử lý'); }} style={{ padding: '5px 10px', border: '1.5px solid #fecaca', borderRadius: '7px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626', fontSize: '12px', fontWeight: 600 }}>Gỡ SP</button>
                            )}
                            {r.targetType === 'review' && (
                              <button disabled={busy} onClick={() => { if (confirm('Gỡ đánh giá bị báo cáo?')) run(async () => { const d = await adminDeleteReview(r.targetId); if (!d.error) await resolveReport(r.id, 'resolved'); return d; }, 'Đã gỡ & xử lý'); }} style={{ padding: '5px 10px', border: '1.5px solid #fecaca', borderRadius: '7px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626', fontSize: '12px', fontWeight: 600 }}>Gỡ ĐG</button>
                            )}
                            {r.status === 'open' && (
                              <>
                                <button disabled={busy} onClick={() => run(() => resolveReport(r.id, 'resolved'), 'Đã đánh dấu xử lý')} style={{ padding: '5px 10px', border: '1.5px solid #bbf7d0', borderRadius: '7px', background: '#f0fdf4', cursor: 'pointer', color: '#16a34a', fontSize: '12px', fontWeight: 600 }}>Đã xử lý</button>
                                <button disabled={busy} onClick={() => run(() => resolveReport(r.id, 'dismissed'), 'Đã bỏ qua')} style={{ padding: '5px 10px', border: '1.5px solid #e2e8f0', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Bỏ qua</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
              <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>Phân quyền admin</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7 }}>
                  Để cấp quyền admin cho một tài khoản, chạy SQL trong Supabase:
                </p>
                <pre style={{ marginTop: '12px', background: '#0f172a', color: '#e2e8f0', padding: '14px 16px', borderRadius: '10px', fontSize: '12.5px', overflowX: 'auto' }}>{`update public.profiles
set role = 'admin'
where id = '<user-uuid>';`}</pre>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>Lấy <strong>user-uuid</strong> tại Supabase → Authentication → Users.</p>
              </div>
              <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>Thông tin nền tảng</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  {[{ l: 'Tổng người dùng', v: formatNumber(overview.totalUsers) }, { l: 'Tổng gian hàng', v: formatNumber(overview.totalShops) }, { l: 'Tổng sản phẩm', v: formatNumber(overview.totalProducts) }, { l: 'Tổng đơn hàng', v: formatNumber(overview.totalOrders) }].map((s, i) => (
                    <div key={i} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{s.l}</div>
                      <div style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
