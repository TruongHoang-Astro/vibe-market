'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Store, Package, ShoppingBag,
  Settings, Zap, LogOut, Bell, Search, ArrowUpRight,
  ArrowDownRight, Shield, CheckCircle2, XCircle, AlertTriangle,
  Eye, Edit3, Trash2, TrendingUp, DollarSign, Star, MoreHorizontal, Menu
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { products, orders, shops, revenueData, formatPrice, formatNumber } from '@/lib/data/mock-data';

const navItems = [
  { key: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
  { key: 'users', label: 'Người dùng', icon: <Users size={18} /> },
  { key: 'shops', label: 'Quản lý Shop', icon: <Store size={18} /> },
  { key: 'products', label: 'Sản phẩm', icon: <Package size={18} /> },
  { key: 'orders', label: 'Đơn hàng', icon: <ShoppingBag size={18} /> },
  { key: 'settings', label: 'Cài đặt', icon: <Settings size={18} /> },
];

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: '#fef9c3', color: '#a16207', label: 'Chờ xác nhận' },
  confirmed: { bg: '#dbeafe', color: '#1d4ed8', label: 'Đã xác nhận' },
  shipping: { bg: '#dcfce7', color: '#15803d', label: 'Đang giao' },
  delivered: { bg: '#f0fdf4', color: '#16a34a', label: 'Đã giao' },
  cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Đã hủy' },
};

const pieData = [
  { name: 'Thời Trang', value: 35, color: '#990000' },
  { name: 'Điện Tử', value: 28, color: '#2563eb' },
  { name: 'Làm Đẹp', value: 20, color: '#ec4899' },
  { name: 'Khác', value: 17, color: '#f59e0b' },
];

const mockUsers = [
  { id: 'U001', name: 'Nguyễn Văn An', email: 'an@email.com', role: 'buyer', status: 'active', joined: '2024-01-15', orders: 24, spent: 4500000, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop' },
  { id: 'U002', name: 'Trần Thị Bích', email: 'bich@email.com', role: 'buyer', status: 'active', joined: '2024-02-20', orders: 12, spent: 2100000, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop' },
  { id: 'U003', name: 'VibeFashion Store', email: 'seller1@email.com', role: 'seller', status: 'active', joined: '2022-03-15', orders: 342, spent: 0, avatar: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=40&h=40&fit=crop' },
  { id: 'U004', name: 'Lê Minh Cường', email: 'cuong@email.com', role: 'buyer', status: 'banned', joined: '2024-03-01', orders: 3, spent: 450000, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop' },
  { id: 'U005', name: 'TechZone Official', email: 'techzone@email.com', role: 'seller', status: 'active', joined: '2021-06-20', orders: 215, spent: 0, avatar: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=40&h=40&fit=crop' },
  { id: 'U006', name: 'Phạm Thu Hương', email: 'huong@email.com', role: 'buyer', status: 'active', joined: '2024-04-10', orders: 8, spent: 1800000, avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2a60d34?w=40&h=40&fit=crop' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shopFilter, setShopFilter] = useState<'all' | 'pending' | 'active'>('all');

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0) * 18; // platform take
  const totalOrders = orders.length * 120;
  const totalUsers = 24800;
  const totalShops = 10240;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      {sidebarOpen && <div className="dash-backdrop" onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 55 }} />}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '240px', background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0000 100%)', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 30, overflowY: 'auto' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #990000, #FF0000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="white" fill="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 800, fontSize: '16px', color: 'white' }}>VibeMarket</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Admin Panel</div>
            </div>
          </Link>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #990000, #FF0000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'white' }}>Super Admin</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>admin@vibemarket.vn</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '12px', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px',
                borderRadius: '8px', border: 'none', cursor: 'pointer', marginBottom: '2px',
                background: activeTab === item.key ? 'rgba(153,0,0,0.25)' : 'transparent',
                transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (activeTab !== item.key) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (activeTab !== item.key) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ color: activeTab === item.key ? '#ff6666' : 'rgba(255,255,255,0.45)', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ color: activeTab === item.key ? 'white' : 'rgba(255,255,255,0.55)', fontSize: '14px', fontWeight: activeTab === item.key ? 600 : 400 }}>{item.label}</span>
              {item.key === 'shops' && (
                <span style={{ marginLeft: 'auto', background: '#990000', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px' }}>3</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.15s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'transparent')}
          >
            <LogOut size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Về trang chủ</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main" style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 16px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button className="dash-burger" onClick={() => setSidebarOpen(true)} aria-label="Mở menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#0f172a', alignItems: 'center' }}>
              <Menu size={22} />
            </button>
            <h1 className="line-clamp-1" style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              {navItems.find(n => n.key === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="nav-hide-mobile" style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="text" placeholder="Tìm kiếm..." style={{ padding: '9px 12px 9px 34px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', width: '220px', fontFamily: 'Inter', background: '#f8fafc' }} onFocus={e => (e.target.style.borderColor = '#990000')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
            </div>
            <button style={{ position: 'relative', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', color: '#475569' }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#990000', borderRadius: '50%', border: '2px solid white' }} />
            </button>
            <div className="nav-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#f8fafc', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #990000, #FF0000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              {/* KPI Cards */}
              <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Tổng doanh thu', val: formatPrice(totalRevenue * 100), icon: <DollarSign size={20} />, change: '+24.5%', up: true, color: '#990000', sub: 'Tháng này' },
                  { label: 'Tổng người dùng', val: formatNumber(totalUsers), icon: <Users size={20} />, change: '+8.2%', up: true, color: '#2563eb', sub: `+${formatNumber(1240)} tuần này` },
                  { label: 'Gian hàng đang hoạt động', val: formatNumber(totalShops), icon: <Store size={20} />, change: '+3 chờ duyệt', up: true, color: '#16a34a', sub: 'Cần xem xét: 3' },
                  { label: 'Đơn hàng hôm nay', val: formatNumber(totalOrders), icon: <ShoppingBag size={20} />, change: '+12.8%', up: true, color: '#f59e0b', sub: 'So với hôm qua' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${stat.color}, ${stat.color}66)` }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                        {stat.icon}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: stat.up ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {stat.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {stat.change}
                      </span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{stat.val}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>{stat.label}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{stat.sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* Charts row */}
              <div className="dash-charts" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Doanh thu nền tảng</h3>
                    <select style={{ fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', background: '#f8fafc', cursor: 'pointer', outline: 'none', color: '#475569' }}>
                      <option>6 tháng gần nhất</option>
                      <option>12 tháng</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(v) => formatPrice(Number(v))} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#990000" strokeWidth={2.5} dot={{ fill: '#990000', r: 4, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: '#0f172a' }}>Doanh thu theo danh mục</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {pieData.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: d.color }} />
                          <span style={{ color: '#475569' }}>{d.name}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Recent activity */}
              <div className="dash-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Latest shops */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                  style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Shop chờ duyệt</h3>
                    <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px' }}>3 mới</span>
                  </div>
                  <div style={{ padding: '12px 0' }}>
                    {shops.map((shop, i) => (
                      <div key={shop.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < shops.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={shop.logo} alt={shop.name} style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{shop.name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{shop.category} · {shop.products} sp</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={{ padding: '5px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', fontSize: '12px', fontWeight: 700, color: '#16a34a', cursor: 'pointer' }}>Duyệt</button>
                          <button style={{ padding: '5px 10px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '7px', color: '#dc2626', cursor: 'pointer' }}><XCircle size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Top products */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                  style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Sản phẩm bán chạy nhất</h3>
                  </div>
                  <div style={{ padding: '12px 0' }}>
                    {products.sort((a, b) => b.sold - a.sold).slice(0, 4).map((product, i) => (
                      <div key={product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: i < 3 ? '1px solid #f8fafc' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : i === 2 ? '#fff3e0' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: i === 0 ? '#d97706' : '#64748b', flexShrink: 0 }}>
                            {i + 1}
                          </span>
                          <img src={product.image} alt={product.name} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                          <div>
                            <div className="line-clamp-1" style={{ fontWeight: 500, fontSize: '13px', color: '#0f172a', maxWidth: '140px' }}>{product.name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{product.shopName}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{formatNumber(product.sold)} đã bán</div>
                          <div style={{ fontSize: '11px', color: '#990000', fontWeight: 600 }}>{formatPrice(product.price)}</div>
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
                  { label: 'Tổng người dùng', val: formatNumber(totalUsers), color: '#2563eb', icon: <Users size={18} /> },
                  { label: 'Người bán', val: formatNumber(totalShops), color: '#990000', icon: <Store size={18} /> },
                  { label: 'Bị khóa', val: '42', color: '#dc2626', icon: <XCircle size={18} /> },
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
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Tất cả', 'Người mua', 'Người bán', 'Bị khóa'].map(tab => (
                      <button key={tab} style={{ padding: '7px 14px', borderRadius: '99px', border: '1.5px solid #e2e8f0', background: tab === 'Tất cả' ? '#990000' : 'white', color: tab === 'Tất cả' ? 'white' : '#475569', fontWeight: tab === 'Tất cả' ? 700 : 400, fontSize: '13px', cursor: 'pointer' }}>{tab}</button>
                    ))}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input placeholder="Tìm người dùng..." style={{ padding: '8px 10px 8px 30px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'Inter', background: '#f8fafc' }} onFocus={e => (e.target.style.borderColor = '#990000')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
                  </div>
                </div>
                <table className="table-base">
                  <thead><tr><th>Người dùng</th><th>Email</th><th>Vai trò</th><th>Tổng đơn</th><th>Đã chi</th><th>Trạng thái</th><th>Ngày đăng ký</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {mockUsers.map((user, i) => (
                      <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={user.avatar} alt={user.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{user.name}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '13px', color: '#475569' }}>{user.email}</td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, background: user.role === 'seller' ? 'rgba(153,0,0,0.1)' : '#eff6ff', color: user.role === 'seller' ? '#990000' : '#2563eb' }}>
                            {user.role === 'seller' ? '🏪 Người bán' : '🛒 Người mua'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{user.orders}</td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{user.role === 'buyer' ? formatPrice(user.spent) : '—'}</td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, background: user.status === 'active' ? '#f0fdf4' : '#fef2f2', color: user.status === 'active' ? '#16a34a' : '#dc2626' }}>
                            {user.status === 'active' ? '✓ Hoạt động' : '✗ Bị khóa'}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#64748b' }}>{new Date(user.joined).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button style={{ padding: '5px 9px', border: '1.5px solid #e2e8f0', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#475569' }}><Eye size={13} /></button>
                            <button style={{ padding: '5px 9px', border: '1.5px solid #e2e8f0', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#475569' }}><Edit3 size={13} /></button>
                            <button style={{ padding: '5px 9px', border: '1.5px solid #fecaca', borderRadius: '7px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SHOPS ── */}
          {activeTab === 'shops' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[{ key: 'all', label: 'Tất cả' }, { key: 'pending', label: '⏳ Chờ duyệt (3)' }, { key: 'active', label: '✓ Đang hoạt động' }].map(tab => (
                  <button key={tab.key} onClick={() => setShopFilter(tab.key as typeof shopFilter)}
                    style={{ padding: '8px 16px', borderRadius: '99px', border: '1.5px solid #e2e8f0', background: shopFilter === tab.key ? '#990000' : 'white', color: shopFilter === tab.key ? 'white' : '#475569', fontWeight: shopFilter === tab.key ? 700 : 400, fontSize: '13px', cursor: 'pointer' }}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="dash-3 dash-shops" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {shops.map((shop, i) => (
                  <motion.div key={shop.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {/* Banner */}
                    <div style={{ height: '100px', position: 'relative', overflow: 'hidden' }}>
                      <img src={shop.banner} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                        {shop.verified ? (
                          <span style={{ background: 'rgba(37,99,235,0.9)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={10} /> Đã xác minh
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(234,179,8,0.9)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={10} /> Chờ xác minh
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', transform: 'translateY(-20px)', marginBottom: '-4px' }}>
                        <img src={shop.logo} alt={shop.name} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{shop.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{shop.category}</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', marginBottom: '14px' }}>
                        {[
                          { label: 'Sản phẩm', val: shop.products },
                          { label: 'Đánh giá', val: `⭐ ${shop.rating}` },
                          { label: 'Theo dõi', val: formatNumber(shop.followers) },
                          { label: 'Phản hồi', val: `${shop.responseRate}%` },
                        ].map((s, j) => (
                          <div key={j} style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{s.val}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/shop/${shop.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                          <button style={{ width: '100%', padding: '8px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Eye size={13} /> Xem shop
                          </button>
                        </Link>
                        {!shop.verified ? (
                          <button style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: '#f0fdf4', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <CheckCircle2 size={13} /> Duyệt
                          </button>
                        ) : (
                          <button style={{ flex: 1, padding: '8px', border: '1.5px solid #fecaca', borderRadius: '8px', background: '#fff5f5', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <XCircle size={13} /> Khóa
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── PRODUCTS (ADMIN) ── */}
          {activeTab === 'products' && (
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>Tất cả sản phẩm ({products.length})</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input placeholder="Tìm sản phẩm..." style={{ padding: '8px 10px 8px 30px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'Inter', background: '#f8fafc', width: '220px' }} onFocus={e => (e.target.style.borderColor = '#990000')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
                  </div>
                </div>
              </div>
              <table className="table-base">
                <thead><tr><th>Sản phẩm</th><th>Shop</th><th>Danh mục</th><th>Giá</th><th>Đã bán</th><th>Đánh giá</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {products.map((product, i) => (
                    <tr key={product.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={product.image} alt={product.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                          <span className="line-clamp-1" style={{ fontSize: '13px', fontWeight: 500, maxWidth: '180px' }}>{product.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: '#990000', fontWeight: 600 }}>{product.shopName}</td>
                      <td style={{ fontSize: '13px', color: '#475569' }}>{product.category}</td>
                      <td style={{ fontWeight: 700, fontSize: '14px', color: '#990000' }}>{formatPrice(product.price)}</td>
                      <td style={{ fontWeight: 600 }}>{formatNumber(product.sold)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={12} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{product.rating}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Link href={`/products/${product.id}`}><button style={{ padding: '5px 9px', border: '1.5px solid #e2e8f0', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#475569' }}><Eye size={13} /></button></Link>
                          <button style={{ padding: '5px 9px', border: '1.5px solid #fecaca', borderRadius: '7px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── ORDERS (ADMIN) ── */}
          {activeTab === 'orders' && (
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>Tất cả đơn hàng ({orders.length})</h3>
              </div>
              <table className="table-base">
                <thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Người mua</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Ngày đặt</th></tr></thead>
                <tbody>
                  {orders.map((order, i) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 700, color: '#990000', fontSize: '13px' }}>{order.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={order.products[0].image} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                          <span className="line-clamp-1" style={{ fontSize: '13px', maxWidth: '150px' }}>{order.products[0].name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: '#475569' }}>{order.address.split(',')[0]}</td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(order.total)}</td>
                      <td style={{ fontSize: '13px' }}>{order.paymentMethod}</td>
                      <td>
                        <span style={{ background: statusColors[order.status].bg, color: statusColors[order.status].color, padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>
                          {statusColors[order.status].label}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── SETTINGS (ADMIN) ── */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
              {[
                { title: 'Thông tin nền tảng', fields: [{ label: 'Tên nền tảng', val: 'Vibe Market' }, { label: 'Email liên hệ', val: 'support@vibemarket.vn' }, { label: 'Hotline', val: '1800-1234' }] },
                { title: 'Cấu hình thanh toán', fields: [{ label: 'Hoa hồng nền tảng (%)', val: '5' }, { label: 'Ngưỡng rút tiền tối thiểu', val: '100000' }] },
              ].map((section, si) => (
                <div key={si} style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, marginBottom: '18px', color: '#0f172a' }}>{section.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {section.fields.map((f, fi) => (
                      <div key={fi}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                        <input type="text" defaultValue={f.val} className="input-base" />
                      </div>
                    ))}
                    <button className="btn-primary" style={{ alignSelf: 'flex-start', borderRadius: '10px', marginTop: '4px' }}>
                      <span>Lưu thay đổi</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
