'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, Settings,
  Bell, ChevronDown, Plus, Edit3, Trash2, Eye, Search,
  Upload, X, Check, Star, Zap, Store, LogOut, Menu,
  ArrowUpRight, ArrowDownRight, DollarSign, Users, BarChart2,
  Image as ImageIcon, Tag, Layers, AlertCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { products, orders, revenueData, formatPrice, formatNumber, shops } from '@/lib/data/mock-data';

const navItems = [
  { key: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
  { key: 'products', label: 'Sản phẩm', icon: <Package size={18} /> },
  { key: 'orders', label: 'Đơn hàng', icon: <ShoppingBag size={18} /> },
  { key: 'revenue', label: 'Doanh thu', icon: <TrendingUp size={18} /> },
  { key: 'settings', label: 'Cài đặt', icon: <Settings size={18} /> },
];

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: '#fef9c3', color: '#a16207', label: 'Chờ xác nhận' },
  confirmed: { bg: '#dbeafe', color: '#1d4ed8', label: 'Đã xác nhận' },
  shipping: { bg: '#dcfce7', color: '#15803d', label: 'Đang giao' },
  delivered: { bg: '#f0fdf4', color: '#16a34a', label: 'Đã giao' },
  cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Đã hủy' },
};

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', category: '', price: '', salePrice: '', stock: '', description: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const shop = shops[0];
  const sellerProducts = products.filter(p => p.shopId === 'shop1');
  const sellerOrders = orders.filter(o => o.userId === 'seller1');

  const totalRevenue = sellerOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = sellerOrders.length;

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); setTimeout(() => { setSubmitted(false); setShowAddProduct(false); setProductForm({ name: '', category: '', price: '', salePrice: '', stock: '', description: '' }); }, 1500); }, 1200);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px', background: '#0a0a0a', flexShrink: 0,
        display: 'flex', flexDirection: 'column', position: 'fixed',
        top: 0, left: 0, bottom: 0, zIndex: 30, overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #990000, #FF0000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="white" fill="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 800, fontSize: '16px', color: 'white' }}>VibeMarket</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '-2px' }}>Seller Center</div>
            </div>
          </Link>
        </div>

        {/* Shop info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={shop.logo} alt={shop.name} style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'white' }}>{shop.name}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{shop.category}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 12px', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className={`sidebar-item ${activeTab === item.key ? 'active' : ''}`}
              style={{ width: '100%', background: activeTab === item.key ? 'rgba(153,0,0,0.2)' : 'transparent', border: 'none', marginBottom: '2px', justifyContent: 'flex-start' }}>
              <span style={{ color: activeTab === item.key ? '#ff6666' : 'rgba(255,255,255,0.5)' }}>{item.icon}</span>
              <span style={{ color: activeTab === item.key ? 'white' : 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" className="sidebar-item" style={{ textDecoration: 'none', border: 'none', background: 'transparent', width: '100%' }}>
            <LogOut size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Thoát về trang chủ</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 28px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, color: '#111' }}>
            {navItems.find(n => n.key === activeTab)?.label || 'Dashboard'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {activeTab === 'products' && (
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => setShowAddProduct(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: 'linear-gradient(135deg, #990000, #cc0000)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                <Plus size={16} /> Đăng sản phẩm mới
              </motion.button>
            )}
            <button style={{ position: 'relative', background: '#f3f4f6', border: 'none', borderRadius: '10px', padding: '9px', cursor: 'pointer', color: '#374151' }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: '#990000', borderRadius: '50%', border: '2px solid white' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={shop.logo} alt="Avatar" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{shop.name.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Doanh thu tháng', val: formatPrice(totalRevenue), icon: <DollarSign size={20} />, change: '+18.2%', up: true, color: '#990000' },
                  { label: 'Đơn hàng', val: totalOrders, icon: <ShoppingBag size={20} />, change: '+12.5%', up: true, color: '#2563eb' },
                  { label: 'Sản phẩm', val: sellerProducts.length, icon: <Package size={20} />, change: '+2 mới', up: true, color: '#16a34a' },
                  { label: 'Lượt xem', val: '24.8K', icon: <Eye size={20} />, change: '-3.1%', up: false, color: '#f59e0b' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${stat.color}, ${stat.color}88)` }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                        {stat.icon}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: stat.up ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {stat.change}
                      </span>
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#111', marginBottom: '4px' }}>{stat.val}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700 }}>Doanh thu 6 tháng</h3>
                    <span style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', padding: '4px 12px', borderRadius: '99px' }}>2025</span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(val) => formatPrice(Number(val))} labelStyle={{ fontWeight: 600 }} contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#990000" strokeWidth={2.5} dot={{ fill: '#990000', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Đơn hàng</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb' }} />
                      <Bar dataKey="orders" fill="#990000" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Recent orders */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700 }}>Đơn hàng gần đây</h3>
                  <button onClick={() => setActiveTab('orders')} style={{ fontSize: '13px', color: '#990000', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Xem tất cả →</button>
                </div>
                <table className="table-base">
                  <thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th></tr></thead>
                  <tbody>
                    {sellerOrders.map(order => (
                      <tr key={order.id}>
                        <td style={{ fontWeight: 700, color: '#990000' }}>{order.id}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={order.products[0].image} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontWeight: 500, fontSize: '13px' }} className="line-clamp-1">{order.products[0].name}</div>
                              {order.products.length > 1 && <div style={{ fontSize: '11px', color: '#9ca3af' }}>+{order.products.length - 1} sản phẩm</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: '#111' }}>{formatPrice(order.total)}</td>
                        <td>
                          <span style={{ ...statusColors[order.status], padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>
                            {statusColors[order.status].label}
                          </span>
                        </td>
                        <td style={{ color: '#6b7280' }}>{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {activeTab === 'products' && (
            <div>
              <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input type="text" placeholder="Tìm sản phẩm..." style={{ padding: '9px 12px 9px 34px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', width: '260px', fontFamily: 'Inter' }} onFocus={e => (e.target.style.borderColor = '#990000')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
                  </div>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>{sellerProducts.length} sản phẩm</span>
                </div>
                <table className="table-base">
                  <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Tồn kho</th><th>Đã bán</th><th>Đánh giá</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {sellerProducts.map((product, i) => (
                      <motion.tr key={product.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={product.image} alt={product.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px', maxWidth: '200px' }} className="line-clamp-2">{product.name}</div>
                              {product.badge && (
                                <span className={`badge ${product.badge === 'sale' ? 'badge-red' : product.badge === 'new' ? 'badge-green' : product.badge === 'hot' ? 'badge-orange' : 'badge-gold'}`} style={{ marginTop: '4px', display: 'inline-flex' }}>
                                  {product.badge === 'sale' ? 'SALE' : product.badge === 'new' ? 'MỚI' : product.badge === 'hot' ? 'HOT' : 'BÁN CHẠY'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '13px' }}>{product.subcategory}</td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#990000' }}>{formatPrice(product.price)}</div>
                          {product.originalPrice > product.price && <div style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>{formatPrice(product.originalPrice)}</div>}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: product.stock < 20 ? '#dc2626' : '#16a34a' }}>{product.stock}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatNumber(product.sold)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={13} fill="#f59e0b" color="#f59e0b" />
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{product.rating}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Link href={`/products/${product.id}`}>
                              <button style={{ padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#374151', transition: 'all 0.2s' }} title="Xem">
                                <Eye size={14} />
                              </button>
                            </Link>
                            <button style={{ padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#374151' }} title="Sửa">
                              <Edit3 size={14} />
                            </button>
                            <button style={{ padding: '6px 10px', border: '1.5px solid #fee2e2', borderRadius: '8px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626' }} title="Xóa">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ORDERS ── */}
          {activeTab === 'orders' && (
            <div>
              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {['Tất cả', 'Chờ xác nhận', 'Đang giao', 'Đã giao', 'Đã hủy'].map(tab => (
                  <button key={tab} style={{ padding: '8px 16px', borderRadius: '99px', border: '1.5px solid #e5e7eb', background: tab === 'Tất cả' ? '#990000' : 'white', color: tab === 'Tất cả' ? 'white' : '#374151', fontWeight: tab === 'Tất cả' ? 700 : 400, fontSize: '13px', cursor: 'pointer' }}>
                    {tab}
                  </button>
                ))}
              </div>
              <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table className="table-base">
                  <thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Khách hàng</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Ngày</th></tr></thead>
                  <tbody>
                    {orders.map((order, i) => (
                      <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
                        <td style={{ fontWeight: 700, color: '#990000', fontSize: '13px' }}>{order.id}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={order.products[0].image} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                            <span className="line-clamp-1" style={{ fontSize: '13px', maxWidth: '160px' }}>{order.products[0].name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '13px' }}>{order.address.split(',')[0]}</td>
                        <td style={{ fontWeight: 700 }}>{formatPrice(order.total)}</td>
                        <td style={{ fontSize: '13px' }}>{order.paymentMethod}</td>
                        <td>
                          <span style={{ background: statusColors[order.status].bg, color: statusColors[order.status].color, padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>
                            {statusColors[order.status].label}
                          </span>
                        </td>
                        <td style={{ color: '#6b7280', fontSize: '13px' }}>{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REVENUE ── */}
          {activeTab === 'revenue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Doanh thu tháng này', val: formatPrice(32400000), change: '+12.4%', up: true },
                  { label: 'Doanh thu tháng trước', val: formatPrice(28900000), change: '+8.1%', up: true },
                  { label: 'Tổng doanh thu năm', val: formatPrice(132000000), change: '+24.5%', up: true },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{s.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111', marginBottom: '6px' }}>{s.val}</div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ArrowUpRight size={14} /> {s.change} so với kỳ trước
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'white', borderRadius: '14px', padding: '28px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Biểu đồ doanh thu 6 tháng</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 13, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(v) => [formatPrice(Number(v)), 'Doanh thu']} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#990000" strokeWidth={3} dot={{ fill: '#990000', r: 5, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'white', borderRadius: '14px', padding: '28px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Thông tin gian hàng</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tên gian hàng</label>
                    <input type="text" defaultValue={shop.name} className="input-base" />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Mô tả</label>
                    <textarea defaultValue={shop.description} style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: 'Inter', resize: 'vertical', minHeight: '80px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Danh mục chính</label>
                    <input type="text" defaultValue={shop.category} className="input-base" />
                  </div>
                  <button className="btn-primary" style={{ alignSelf: 'flex-start', borderRadius: '10px' }}>
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── ADD PRODUCT MODAL ── */}
      <AnimatePresence>
        {showAddProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overlay" onClick={() => setShowAddProduct(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: '20px', padding: '32px', width: '640px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', zIndex: 50, boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 800 }}>Đăng Sản Phẩm Mới</h2>
                <button onClick={() => setShowAddProduct(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
                  <X size={18} />
                </button>
              </div>

              {submitted ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Check size={40} color="white" />
                    </div>
                  </motion.div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Đăng sản phẩm thành công!</h3>
                  <p style={{ color: '#6b7280' }}>Sản phẩm đang được xét duyệt và sẽ hiển thị trong vài phút.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Image upload */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '10px' }}>Hình ảnh sản phẩm *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      <div style={{ aspectRatio: '1', border: '2px dashed #e5e7eb', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '8px', background: '#fafafa', transition: 'all 0.2s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#990000'; (e.currentTarget as HTMLElement).style.background = '#fff0f0'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}>
                        <Upload size={20} style={{ color: '#9ca3af' }} />
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Tải ảnh lên</span>
                      </div>
                      {['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
                        'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=100&h=100&fit=crop'].map((img, i) => (
                        <div key={i} style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e5e7eb', position: 'relative' }}>
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Tải lên tối đa 8 ảnh. Định dạng JPG, PNG, WEBP. Tối đa 5MB/ảnh.</p>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Tên sản phẩm *</label>
                    <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="Nhập tên sản phẩm..." className="input-base" required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Danh mục *</label>
                      <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="input-base" style={{ cursor: 'pointer' }}>
                        <option value="">Chọn danh mục...</option>
                        {['Thời Trang', 'Điện Tử', 'Làm Đẹp', 'Gia Dụng', 'Thể Thao'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Tồn kho *</label>
                      <input type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} placeholder="100" className="input-base" min="0" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Giá gốc (đồng) *</label>
                      <input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="500000" className="input-base" min="0" required />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Giá khuyến mãi</label>
                      <input type="number" value={productForm.salePrice} onChange={e => setProductForm({ ...productForm, salePrice: e.target.value })} placeholder="350000" className="input-base" min="0" />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Mô tả sản phẩm *</label>
                    <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Mô tả chi tiết sản phẩm..." style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: 'Inter', resize: 'vertical', minHeight: '100px', outline: 'none' }} onFocus={e => (e.target.style.borderColor = '#990000')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
                  </div>

                  {productForm.price && productForm.salePrice && Number(productForm.salePrice) < Number(productForm.price) && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#15803d' }}>
                      <Tag size={16} />
                      Giảm giá: {Math.round((1 - Number(productForm.salePrice) / Number(productForm.price)) * 100)}% — Tiết kiệm {formatPrice(Number(productForm.price) - Number(productForm.salePrice))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                    <button type="button" onClick={() => setShowAddProduct(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
                      Hủy
                    </button>
                    <motion.button type="submit" whileHover={{ scale: 1.02 }} disabled={submitting}
                      className="btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '12px', borderRadius: '12px' }}>
                      {submitting ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                          Đang đăng...
                        </span>
                      ) : <span>🚀 Đăng sản phẩm</span>}
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
