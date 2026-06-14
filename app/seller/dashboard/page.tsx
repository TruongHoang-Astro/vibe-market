'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, Settings,
  Bell, Plus, Edit3, Trash2, Eye, Search,
  Upload, X, Check, Star, Zap, LogOut, LogIn,
  ArrowUpRight, ArrowDownRight, DollarSign, Tag, MessageCircle, User, Store, Camera, Menu,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { formatPrice, formatNumber } from '@/lib/data/mock-data';
import { useUser } from '@/lib/supabase/use-user';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { createProduct, updateProduct, deleteProduct, updateShop, getShopOrders, updateOrderStatus } from '@/app/actions/seller';
import type { SellerOrder, SellerStats } from '@/app/actions/seller';
import { uploadChatMedia } from '@/app/actions/chat';
import SellerChat from './SellerChat';

const navItems = [
  { key: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
  { key: 'products', label: 'Sản phẩm', icon: <Package size={18} /> },
  { key: 'chat', label: 'Tin nhắn', icon: <MessageCircle size={18} /> },
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

type OStatus = 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
const nextActions: Record<string, { label: string; status: OStatus; color: string }[]> = {
  pending: [{ label: 'Xác nhận', status: 'confirmed', color: '#2563eb' }, { label: 'Hủy', status: 'cancelled', color: '#dc2626' }],
  confirmed: [{ label: 'Giao hàng', status: 'shipping', color: '#15803d' }, { label: 'Hủy', status: 'cancelled', color: '#dc2626' }],
  shipping: [{ label: 'Đã giao', status: 'delivered', color: '#16a34a' }],
  delivered: [],
  cancelled: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any) {
  return {
    id: r.id, image: r.image as string, name: r.name as string,
    badge: r.badge ?? undefined, category: r.category as string,
    subcategory: (r.subcategory ?? r.category) as string,
    price: Number(r.price), originalPrice: Number(r.original_price),
    stock: r.stock as number, sold: r.sold as number, rating: Number(r.rating),
    description: (r.description ?? '') as string,
  };
}

const fallbackLogo = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Shop')}&background=ef4444&color=fff&bold=true`;

function GateView({ title, desc, cta, href }: { title: string; desc: string; cta?: string; href?: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '40px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #ef4444, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <Zap size={32} color="white" fill="white" />
      </div>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 800, marginBottom: '8px', color: '#111' }}>{title}</h1>
      <p style={{ color: '#6b7280', marginBottom: '28px', maxWidth: '420px' }}>{desc}</p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link href={href ?? '/login'} className="btn-primary" style={{ borderRadius: '99px' }}>
          <LogIn size={18} /> <span>{cta ?? 'Đăng nhập người bán'}</span>
        </Link>
        <Link href="/" className="btn-outline" style={{ borderRadius: '99px' }}>Về trang chủ</Link>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const { user, profile, loading } = useUser();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', category: '', price: '', salePrice: '', stock: '', description: '' });
  const [productImage, setProductImage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Dữ liệu thật
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [shop, setShop] = useState<any>(null);
  const [sellerProducts, setSellerProducts] = useState<ReturnType<typeof mapRow>[]>([]);
  const [loadingShop, setLoadingShop] = useState(true);
  const [shopForm, setShopForm] = useState({ name: '', description: '', category: '' });
  const [shopLogo, setShopLogo] = useState('');
  const [shopBanner, setShopBanner] = useState('');
  const [savingShop, setSavingShop] = useState(false);
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([]);
  const [stats, setStats] = useState<SellerStats>({ totalRevenue: 0, totalOrders: 0, monthly: [] });

  const loadData = async () => {
    if (!user) { setLoadingShop(false); return; }
    const supabase = createClient();
    const { data: myShop } = await supabase.from('shops').select('*').eq('owner_id', user.id).maybeSingle();
    setShop(myShop);
    if (myShop) {
      setShopForm({ name: myShop.name ?? '', description: myShop.description ?? '', category: myShop.category ?? '' });
      setShopLogo(myShop.logo ?? '');
      setShopBanner(myShop.banner ?? '');
      const { data: prods } = await supabase.from('products').select('*').eq('shop_id', myShop.id).order('created_at', { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSellerProducts(((prods ?? []) as any[]).map(mapRow));
      const { orders: so, stats: st } = await getShopOrders();
      setSellerOrders(so);
      setStats(st);
    }
    setLoadingShop(false);
  };

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const resetForm = () => {
    setProductForm({ name: '', category: '', price: '', salePrice: '', stock: '', description: '' });
    setProductImage(''); setEditingId(null);
  };
  const openAdd = () => { resetForm(); setShowAddProduct(true); };
  const openEdit = (p: ReturnType<typeof mapRow>) => {
    setEditingId(p.id);
    setProductForm({
      name: p.name, category: p.category || '',
      price: String(p.originalPrice),
      salePrice: p.price < p.originalPrice ? String(p.price) : '',
      stock: String(p.stock), description: p.description || '',
    });
    setProductImage(p.image || '');
    setShowAddProduct(true);
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string;
      setProductImage(dataUrl); // preview tạm
      const { url, error } = await uploadChatMedia(dataUrl);
      if (error || !url) { toast.error('Upload ảnh thất bại'); return; }
      setProductImage(url);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const input = {
      name: productForm.name, category: productForm.category,
      price: Number(productForm.price || 0),
      salePrice: productForm.salePrice ? Number(productForm.salePrice) : undefined,
      stock: Number(productForm.stock || 0),
      description: productForm.description, image: productImage,
    };
    const res = editingId ? await updateProduct(editingId, input) : await createProduct(input);
    setSubmitting(false);
    if (res.error) { toast.error(res.error); return; }
    setSubmitted(true);
    await loadData();
    setTimeout(() => { setSubmitted(false); setShowAddProduct(false); resetForm(); }, 1300);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa sản phẩm này? Hành động không thể hoàn tác.')) return;
    const res = await deleteProduct(id);
    if (res.error) { toast.error(res.error); return; }
    toast.success('Đã xóa sản phẩm');
    loadData();
  };

  const uploadShopImage = (e: React.ChangeEvent<HTMLInputElement>, kind: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string;
      if (kind === 'logo') setShopLogo(dataUrl); else setShopBanner(dataUrl); // preview tạm
      const { url, error } = await uploadChatMedia(dataUrl);
      if (error || !url) { toast.error('Upload ảnh thất bại'); return; }
      if (kind === 'logo') setShopLogo(url); else setShopBanner(url);
      toast.success('Đã tải ảnh lên — nhớ bấm Lưu');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveShop = async () => {
    setSavingShop(true);
    const res = await updateShop({ name: shopForm.name, description: shopForm.description, category: shopForm.category, logo: shopLogo, banner: shopBanner });
    setSavingShop(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success('Đã lưu thông tin gian hàng');
    loadData();
  };

  const handleStatus = async (orderId: string, status: OStatus) => {
    const res = await updateOrderStatus(orderId, status);
    if (res.error) { toast.error(res.error); return; }
    toast.success('Đã cập nhật trạng thái đơn');
    loadData();
  };

  // ── Gating ──
  if (loading || loadingShop) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>Đang tải Seller Center...</div>;
  }
  if (!user) return <GateView title="Bạn chưa đăng nhập" desc="Đăng nhập tài khoản người bán để vào Seller Center quản lý gian hàng." />;
  if (profile && profile.role !== 'seller') return <GateView title="Bạn chưa phải người bán" desc="Tài khoản của bạn là người mua. Hãy đăng ký gian hàng ở tab '🏪 Bán hàng' để bắt đầu kinh doanh." cta="Mở gian hàng" href="/login" />;
  if (!shop) return <GateView title="Chưa có gian hàng" desc="Tài khoản seller của bạn chưa gắn gian hàng nào. Hãy đăng ký lại ở tab Bán hàng." />;

  const logoSrc = shop.logo || fallbackLogo(shop.name);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Backdrop khi mở drawer trên mobile */}
      {sidebarOpen && <div className="dash-backdrop" onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 55 }} />}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: '240px', background: '#0a0a0a', flexShrink: 0,
        display: 'flex', flexDirection: 'column', position: 'fixed',
        top: 0, left: 0, bottom: 0, zIndex: 30, overflowY: 'auto',
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #ef4444, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="white" fill="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 800, fontSize: '16px', color: 'white' }}>VibeMarket</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '-2px' }}>Seller Center</div>
            </div>
          </Link>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoSrc} alt={shop.name} style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'white' }}>{shop.name}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{shop.category}</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '12px 12px', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
              className={`sidebar-item ${activeTab === item.key ? 'active' : ''}`}
              style={{ width: '100%', background: activeTab === item.key ? 'rgba(239,68,68,0.2)' : 'transparent', border: 'none', marginBottom: '2px', justifyContent: 'flex-start' }}>
              <span style={{ color: activeTab === item.key ? '#fca5a5' : 'rgba(255,255,255,0.5)' }}>{item.icon}</span>
              <span style={{ color: activeTab === item.key ? 'white' : 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" className="sidebar-item" style={{ textDecoration: 'none', border: 'none', background: 'transparent', width: '100%' }}>
            <LogOut size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Thoát về trang chủ</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main" style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 16px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button className="dash-burger" onClick={() => setSidebarOpen(true)} aria-label="Mở menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#111', alignItems: 'center' }}>
              <Menu size={22} />
            </button>
            <h1 className="line-clamp-1" style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, color: '#111' }}>
              {navItems.find(n => n.key === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {activeTab === 'products' && (
              <motion.button whileHover={{ scale: 1.03 }} onClick={openAdd}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                <Plus size={16} /> Đăng sản phẩm mới
              </motion.button>
            )}
            <button style={{ position: 'relative', background: '#f3f4f6', border: 'none', borderRadius: '10px', padding: '9px', cursor: 'pointer', color: '#374151' }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={logoSrc} alt="Avatar" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{shop.name.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        <div className="dash-content" style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Doanh thu', val: formatPrice(stats.totalRevenue), icon: <DollarSign size={20} />, change: 'thực', up: true, color: '#ef4444' },
                  { label: 'Đơn hàng', val: stats.totalOrders, icon: <ShoppingBag size={20} />, change: 'thực', up: true, color: '#2563eb' },
                  { label: 'Sản phẩm', val: sellerProducts.length, icon: <Package size={20} />, change: 'thực', up: true, color: '#16a34a' },
                  { label: 'Lượt xem (demo)', val: '24.8K', icon: <Eye size={20} />, change: '-3.1%', up: false, color: '#f59e0b' },
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

              <div className="dash-charts" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700 }}>Doanh thu 6 tháng</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats.monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(val) => formatPrice(Number(val))} labelStyle={{ fontWeight: 600 }} contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Đơn hàng</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb' }} />
                      <Bar dataKey="orders" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Sản phẩm gần đây (thật) */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700 }}>Sản phẩm của bạn</h3>
                  <button onClick={() => setActiveTab('products')} style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Quản lý →</button>
                </div>
                {sellerProducts.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                    Chưa có sản phẩm nào. Bấm <strong>Sản phẩm → Đăng sản phẩm mới</strong> để bắt đầu.
                  </div>
                ) : (
                  <table className="table-base">
                    <thead><tr><th>Sản phẩm</th><th>Giá</th><th>Tồn kho</th><th>Đã bán</th></tr></thead>
                    <tbody>
                      {sellerProducts.slice(0, 5).map(p => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={p.image || fallbackLogo(p.name)} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                              <span className="line-clamp-1" style={{ fontWeight: 500, fontSize: '13px', maxWidth: '260px' }}>{p.name}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: '#ef4444' }}>{formatPrice(p.price)}</td>
                          <td><span style={{ fontWeight: 600, color: p.stock < 20 ? '#dc2626' : '#16a34a' }}>{p.stock}</span></td>
                          <td style={{ fontWeight: 600 }}>{formatNumber(p.sold)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {activeTab === 'products' && (
            <div>
              <div className="dash-table-card" style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input type="text" placeholder="Tìm sản phẩm..." style={{ padding: '9px 12px 9px 34px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', width: '260px', fontFamily: 'Inter' }} onFocus={e => (e.target.style.borderColor = '#ef4444')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
                  </div>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>{sellerProducts.length} sản phẩm</span>
                </div>
                {sellerProducts.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                    <Package size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 600, marginBottom: '6px' }}>Gian hàng chưa có sản phẩm</p>
                    <p style={{ fontSize: '13px' }}>Bấm "Đăng sản phẩm mới" ở góc trên để thêm sản phẩm đầu tiên.</p>
                  </div>
                ) : (
                  <table className="table-base">
                    <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Tồn kho</th><th>Đã bán</th><th>Đánh giá</th><th>Thao tác</th></tr></thead>
                    <tbody>
                      {sellerProducts.map((product, i) => (
                        <motion.tr key={product.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img src={product.image || fallbackLogo(product.name)} alt={product.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
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
                          <td style={{ fontSize: '13px' }}>{product.category}</td>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#ef4444' }}>{formatPrice(product.price)}</div>
                            {product.originalPrice > product.price && <div style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>{formatPrice(product.originalPrice)}</div>}
                          </td>
                          <td><span style={{ fontWeight: 600, color: product.stock < 20 ? '#dc2626' : '#16a34a' }}>{product.stock}</span></td>
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
                                <button style={{ padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#374151' }} title="Xem"><Eye size={14} /></button>
                              </Link>
                              <button onClick={() => openEdit(product)} style={{ padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#374151' }} title="Sửa"><Edit3 size={14} /></button>
                              <button onClick={() => handleDelete(product.id)} style={{ padding: '6px 10px', border: '1.5px solid #fee2e2', borderRadius: '8px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626' }} title="Xóa"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── CHAT 2 chiều (realtime) ── */}
          {activeTab === 'chat' && <SellerChat shopId={shop.id} />}

          {/* ── ORDERS (thật — đơn chứa sản phẩm của shop) ── */}
          {activeTab === 'orders' && (
            <div>
              <div className="dash-table-card" style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {sellerOrders.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                    <ShoppingBag size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 600, marginBottom: '6px' }}>Chưa có đơn hàng nào</p>
                    <p style={{ fontSize: '13px' }}>Đơn hàng có chứa sản phẩm của shop bạn sẽ hiện ở đây.</p>
                  </div>
                ) : (
                  <table className="table-base">
                    <thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Khách</th><th>Doanh thu</th><th>Trạng thái</th><th>Ngày</th><th>Thao tác</th></tr></thead>
                    <tbody>
                      {sellerOrders.map((order, i) => (
                        <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
                          <td style={{ fontWeight: 700, color: '#ef4444', fontSize: '13px' }}>{order.id}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img src={order.items[0]?.image || ''} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                              <span className="line-clamp-1" style={{ fontSize: '13px', maxWidth: '160px' }}>
                                {order.items[0]?.name}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontSize: '13px' }}>Khách #{order.buyerId.slice(0, 4).toUpperCase()}</td>
                          <td style={{ fontWeight: 700 }}>{formatPrice(order.shopRevenue)}</td>
                          <td>
                            <span style={{ background: statusColors[order.status]?.bg, color: statusColors[order.status]?.color, padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>
                              {statusColors[order.status]?.label ?? order.status}
                            </span>
                          </td>
                          <td style={{ color: '#6b7280', fontSize: '13px' }}>{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(nextActions[order.status] ?? []).map(a => (
                                <button key={a.status} onClick={() => handleStatus(order.id, a.status)}
                                  style={{ padding: '5px 12px', border: 'none', borderRadius: '8px', background: a.color, color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                  {a.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── REVENUE (thật) ── */}
          {activeTab === 'revenue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="dash-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {([
                  { label: 'Tổng doanh thu', val: formatPrice(stats.totalRevenue) },
                  { label: 'Tổng đơn hàng', val: String(stats.totalOrders) },
                  { label: 'Doanh thu / đơn (TB)', val: formatPrice(stats.totalOrders ? Math.round(stats.totalRevenue / stats.totalOrders) : 0) },
                ]).map((s, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{s.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111' }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'white', borderRadius: '14px', padding: '28px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Biểu đồ doanh thu 6 tháng</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 13, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(v) => [formatPrice(Number(v)), 'Doanh thu']} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 5, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── SETTINGS (thật) ── */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="dash-table-card" style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {/* Ảnh bìa + logo */}
                <div style={{ position: 'relative', height: '170px', background: shopBanner ? `center / cover no-repeat url(${shopBanner})` : 'linear-gradient(135deg, #0a0a0a, #1a0000)' }}>
                  <label style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(0,0,0,0.55)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <Camera size={15} /> Đổi ảnh bìa
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadShopImage(e, 'banner')} />
                  </label>
                  <div style={{ position: 'absolute', bottom: '-42px', left: '28px' }}>
                    <div style={{ position: 'relative', width: '92px', height: '92px' }}>
                      <div style={{ width: '92px', height: '92px', borderRadius: '22px', overflow: 'hidden', border: '4px solid white', background: 'linear-gradient(135deg, #ef4444, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,0,0,0.18)' }}>
                        {shopLogo ? <img src={shopLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={38} color="white" />}
                      </div>
                      <label style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '30px', height: '30px', borderRadius: '50%', background: '#ef4444', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Camera size={14} />
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadShopImage(e, 'logo')} />
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '58px 28px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700 }}>Thông tin gian hàng</h3>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tên gian hàng</label>
                    <input type="text" value={shopForm.name} onChange={e => setShopForm({ ...shopForm, name: e.target.value })} className="input-base" />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Mô tả</label>
                    <textarea value={shopForm.description} onChange={e => setShopForm({ ...shopForm, description: e.target.value })} placeholder="Giới thiệu gian hàng của bạn..." style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: 'Inter', resize: 'vertical', minHeight: '90px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Danh mục chính</label>
                    <input type="text" value={shopForm.category} onChange={e => setShopForm({ ...shopForm, category: e.target.value })} className="input-base" />
                  </div>
                  <button onClick={handleSaveShop} disabled={savingShop} className="btn-primary" style={{ alignSelf: 'flex-start', borderRadius: '10px', opacity: savingShop ? 0.7 : 1 }}>
                    <span>{savingShop ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── ADD/EDIT PRODUCT MODAL ── */}
      <AnimatePresence>
        {showAddProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddProduct(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '640px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 800 }}>{editingId ? 'Sửa Sản Phẩm' : 'Đăng Sản Phẩm Mới'}</h2>
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
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{editingId ? 'Đã cập nhật!' : 'Đăng sản phẩm thành công!'}</h3>
                  <p style={{ color: '#6b7280' }}>Sản phẩm đã hiển thị trong gian hàng của bạn.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Image upload */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '10px' }}>Hình ảnh sản phẩm</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <label style={{ width: '110px', height: '110px', border: '2px dashed #e5e7eb', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '8px', background: '#fafafa', flexShrink: 0 }}>
                        <Upload size={20} style={{ color: '#9ca3af' }} />
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Tải ảnh lên</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadImage} />
                      </label>
                      {productImage && (
                        <div style={{ width: '110px', height: '110px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                          <img src={productImage} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>JPG, PNG, WEBP. Ảnh được tải lên Storage và dùng làm ảnh đại diện sản phẩm.</p>
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
                        {['Thời Trang', 'Điện Tử', 'Làm Đẹp', 'Gia Dụng', 'Thể Thao', 'Tổng hợp'].map(c => <option key={c} value={c}>{c}</option>)}
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
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Mô tả sản phẩm</label>
                    <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Mô tả chi tiết sản phẩm..." style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: 'Inter', resize: 'vertical', minHeight: '100px', outline: 'none' }} />
                  </div>

                  {productForm.price && productForm.salePrice && Number(productForm.salePrice) < Number(productForm.price) && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#15803d' }}>
                      <Tag size={16} />
                      Giảm giá: {Math.round((1 - Number(productForm.salePrice) / Number(productForm.price)) * 100)}% — Tiết kiệm {formatPrice(Number(productForm.price) - Number(productForm.salePrice))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                    <button type="button" onClick={() => setShowAddProduct(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>Hủy</button>
                    <motion.button type="submit" whileHover={{ scale: 1.02 }} disabled={submitting}
                      className="btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '12px', borderRadius: '12px' }}>
                      {submitting ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                          Đang lưu...
                        </span>
                      ) : <span>{editingId ? '💾 Lưu thay đổi' : '🚀 Đăng sản phẩm'}</span>}
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
