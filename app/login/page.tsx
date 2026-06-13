'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, Zap, Mail, Lock, User, Phone, Store, ChevronRight, CheckCircle2 } from 'lucide-react';
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

      // Nếu bật xác nhận email → chưa có session, cần kiểm tra hộp thư
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
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative' }}>
      {/* Left panel - decorative */}
      <div style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0000 50%, #0a0a0a 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', position: 'relative', overflow: 'hidden' }}>
        {/* Background decorations */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(153,0,0,0.2)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,0,0,0.1)', filter: 'blur(50px)' }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ position: 'relative', textAlign: 'center', maxWidth: '400px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={28} color="white" fill="white" />
            </div>
            <span style={{ fontFamily: 'Playfair Display', fontWeight: 800, fontSize: '28px', color: 'white' }}>
              Vibe<span style={{ color: 'var(--primary)' }}>Market</span>
            </span>
          </Link>

          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '36px', fontWeight: 800, color: 'white', marginBottom: '16px', lineHeight: 1.2 }}>
            {mode === 'seller' ? 'Bắt Đầu Kinh\nDoanh Ngay' : 'Mua Sắm Thông\nMinh Hơn'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', lineHeight: 1.7, marginBottom: '40px' }}>
            {mode === 'seller' ? 'Đăng ký gian hàng miễn phí, tiếp cận hàng triệu khách hàng trên nền tảng Vibe Market.' : 'Truy cập hàng nghìn sản phẩm chính hãng, Flash Sale mỗi ngày, giao hàng siêu tốc.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              mode === 'seller' ? '🏪 Tạo gian hàng miễn phí trong 5 phút' : '⚡ Flash Sale giảm đến 70%',
              mode === 'seller' ? '📊 Dashboard quản lý chuyên nghiệp' : '🚚 Miễn phí vận chuyển từ 299k',
              mode === 'seller' ? '💰 Thu nhập không giới hạn' : '🔒 Thanh toán an toàn, bảo mật',
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel - form */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', background: 'white', overflowY: 'auto' }}>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <CheckCircle2 size={44} color="white" />
                </div>
              </motion.div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
                {mode === 'login' ? 'Đăng nhập thành công!' : 'Đăng ký thành công!'}
              </h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '28px' }}>
                {mode === 'seller' ? 'Gian hàng của bạn đã được tạo. Chào mừng đến với cộng đồng người bán!' : 'Chào mừng bạn đến với Vibe Market!'}
              </p>
              <Link href={mode === 'seller' ? '/seller/dashboard' : '/'} className="btn-primary" style={{ borderRadius: '99px', justifyContent: 'center', padding: '14px 32px', fontSize: '15px', display: 'inline-flex' }}>
                <span>{mode === 'seller' ? 'Vào Dashboard' : 'Bắt đầu mua sắm'}</span>
                <ChevronRight size={18} />
              </Link>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div style={{ display: 'flex', background: 'var(--gray-100)', borderRadius: '12px', padding: '4px', marginBottom: '36px', gap: '4px' }}>
                {[
                  { key: 'login', label: 'Đăng nhập' },
                  { key: 'register', label: 'Đăng ký' },
                  { key: 'seller', label: '🏪 Bán hàng' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setMode(tab.key as typeof mode)}
                    style={{ flex: 1, padding: '10px', borderRadius: '9px', border: 'none', background: mode === tab.key ? 'white' : 'transparent', fontWeight: mode === tab.key ? 700 : 400, fontSize: '14px', cursor: 'pointer', color: mode === tab.key ? 'var(--primary)' : 'var(--gray-600)', transition: 'all 0.2s', boxShadow: mode === tab.key ? 'var(--shadow-sm)' : 'none' }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
                {mode === 'login' ? 'Chào mừng trở lại!' : mode === 'seller' ? 'Mở Gian Hàng' : 'Tạo tài khoản'}
              </h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '32px' }}>
                {mode === 'login' ? 'Đăng nhập để tiếp tục mua sắm' : mode === 'seller' ? 'Bắt đầu hành trình kinh doanh của bạn' : 'Tham gia cộng đồng Vibe Market'}
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(mode === 'register' || mode === 'seller') && (
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Họ và tên</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                      <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nguyễn Văn A" className="input-base" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>
                )}
                {mode === 'seller' && (
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Tên gian hàng</label>
                    <div style={{ position: 'relative' }}>
                      <Store size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                      <input type="text" value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} placeholder="Tên shop của bạn" className="input-base" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="input-base" style={{ paddingLeft: '40px' }} required />
                  </div>
                </div>
                {(mode === 'register' || mode === 'seller') && (
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Số điện thoại</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0901 234 567" className="input-base" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
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
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Xác nhận mật khẩu</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                      <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••" className="input-base" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                  className="btn-primary" style={{ marginTop: '8px', justifyContent: 'center', padding: '14px', fontSize: '16px', borderRadius: '12px', opacity: loading ? 0.8 : 1 }}>
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

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--gray-400)' }}>hoặc đăng nhập với</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['🇬 Google', '🐦 Facebook'].map(s => (
                    <button key={s} type="button" onClick={() => toast('Đăng nhập mạng xã hội sắp ra mắt — hãy dùng email nhé!')} style={{ flex: 1, padding: '11px', border: '1.5px solid var(--gray-200)', borderRadius: '10px', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-200)'; }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] { grid-template-columns: 1fr !important; }
          div[style*="linear-gradient(135deg, #0a0a0a"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
