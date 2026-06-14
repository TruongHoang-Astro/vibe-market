'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, Zap, Mail, Lock, User, Phone, Store, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Dịch các lỗi thường gặp của Supabase sang tiếng Việt
function viError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email hoặc mật khẩu không đúng';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Email này đã được đăng ký';
  if (m.includes('email not confirmed')) return 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.';
  if (m.includes('password should be at least')) return 'Mật khẩu phải có ít nhất 6 ký tự';
  if (m.includes('unable to validate email')) return 'Email không hợp lệ';
  if (m.includes('for security purposes')) return 'Bạn thao tác quá nhanh, vui lòng thử lại sau giây lát';
  return msg;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register' | 'seller'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', shopName: '', confirm: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        setDone(true);
        router.refresh();
        return;
      }

      // register hoặc seller
      if (mode === 'register' && form.confirm && form.password !== form.confirm) {
        toast.error('Mật khẩu xác nhận không khớp');
        setLoading(false);
        return;
      }
      if (form.password.length < 6) {
        toast.error('Mật khẩu phải có ít nhất 6 ký tự');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.name || form.email.split('@')[0],
            phone: form.phone || null,
            role: mode === 'seller' ? 'seller' : 'buyer',
            shop_name: mode === 'seller' ? form.shopName : null,
          },
        },
      });
      if (error) throw error;

      if (!data.session) {
        toast.success('Đã gửi email xác nhận. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản!');
        setLoading(false);
        return;
      }

      setDone(true);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại';
      toast.error(viError(msg));
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: 'linear-gradient(170deg, #fff5f5 0%, #fafafa 45%, #ffffff 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '420px' }}>

        {/* Brand */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-red)' }}>
            <Zap size={24} color="white" fill="white" />
          </div>
          <span style={{ fontFamily: 'Playfair Display', fontWeight: 800, fontSize: '26px', color: 'var(--black)' }}>
            Vibe<span style={{ color: 'var(--primary)' }}>Market</span>
          </span>
        </Link>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow)', padding: '28px 24px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle2 size={40} color="white" />
                </div>
              </motion.div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                {mode === 'login' ? 'Đăng nhập thành công!' : 'Đăng ký thành công!'}
              </h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '24px', fontSize: '14px' }}>
                {mode === 'seller' ? 'Gian hàng của bạn đã được tạo. Chào mừng đến với cộng đồng người bán!' : 'Chào mừng bạn đến với Vibe Market!'}
              </p>
              <Link href={mode === 'seller' ? '/seller/dashboard' : '/'} className="btn-primary" style={{ borderRadius: '99px', justifyContent: 'center', padding: '13px 32px', fontSize: '15px', display: 'inline-flex' }}>
                <span>{mode === 'seller' ? 'Vào Dashboard' : 'Bắt đầu mua sắm'}</span>
                <ChevronRight size={18} />
              </Link>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div style={{ display: 'flex', background: 'var(--gray-100)', borderRadius: '12px', padding: '4px', marginBottom: '24px', gap: '4px' }}>
                {[
                  { key: 'login', label: 'Đăng nhập' },
                  { key: 'register', label: 'Đăng ký' },
                  { key: 'seller', label: '🏪 Bán hàng' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setMode(tab.key as typeof mode)}
                    style={{ flex: 1, padding: '9px 4px', borderRadius: '9px', border: 'none', background: mode === tab.key ? 'white' : 'transparent', fontWeight: mode === tab.key ? 700 : 500, fontSize: '13.5px', cursor: 'pointer', color: mode === tab.key ? 'var(--primary)' : 'var(--gray-600)', transition: 'all 0.2s', boxShadow: mode === tab.key ? 'var(--shadow-sm)' : 'none' }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <h1 style={{ fontFamily: 'Playfair Display', fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
                {mode === 'login' ? 'Chào mừng trở lại!' : mode === 'seller' ? 'Mở gian hàng' : 'Tạo tài khoản'}
              </h1>
              <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '24px' }}>
                {mode === 'login' ? 'Đăng nhập để tiếp tục mua sắm' : mode === 'seller' ? 'Bắt đầu hành trình kinh doanh của bạn' : 'Tham gia cộng đồng Vibe Market'}
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(mode === 'register' || mode === 'seller') && (
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>Họ và tên</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                      <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nguyễn Văn A" className="input-base" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>
                )}
                {mode === 'seller' && (
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>Tên gian hàng</label>
                    <div style={{ position: 'relative' }}>
                      <Store size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                      <input type="text" value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} placeholder="Tên shop của bạn" className="input-base" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="input-base" style={{ paddingLeft: '40px' }} required />
                  </div>
                </div>
                {(mode === 'register' || mode === 'seller') && (
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>Số điện thoại</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0901 234 567" className="input-base" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Mật khẩu</label>
                    {mode === 'login' && <button type="button" onClick={() => router.push('/forgot-password')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Quên mật khẩu?</button>}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="input-base" style={{ paddingLeft: '40px', paddingRight: '44px' }} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {mode === 'register' && (
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>Xác nhận mật khẩu</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                      <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••" className="input-base" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>
                )}

                <motion.button whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }} type="submit" disabled={loading}
                  className="btn-primary" style={{ marginTop: '4px', justifyContent: 'center', padding: '13px', fontSize: '15px', borderRadius: '12px', opacity: loading ? 0.8 : 1 }}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                      Đang xử lý...
                    </span>
                  ) : (
                    <span>{mode === 'login' ? 'Đăng nhập' : mode === 'seller' ? '🚀 Tạo gian hàng ngay' : 'Đăng ký ngay'}</span>
                  )}
                </motion.button>
              </form>

              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
                  <span style={{ fontSize: '12.5px', color: 'var(--gray-400)' }}>hoặc</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['🇬 Google', '🐦 Facebook'].map(s => (
                    <button key={s} type="button" onClick={() => toast('Đăng nhập mạng xã hội sắp ra mắt — hãy dùng email nhé!')} style={{ flex: 1, padding: '10px', border: '1.5px solid var(--gray-200)', borderRadius: '10px', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-200)'; }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '18px', fontSize: '14px', color: 'var(--gray-500)', textDecoration: 'none' }}>
          <ArrowLeft size={15} /> Về trang chủ
        </Link>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
