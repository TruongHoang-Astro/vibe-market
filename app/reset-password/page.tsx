'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState<boolean | null>(null); // null=checking

  // Sau khi /auth/callback đổi code → session, người dùng có session để đổi mật khẩu.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (password !== confirm) { toast.error('Mật khẩu xác nhận không khớp'); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error('Đổi mật khẩu thất bại: ' + error.message); return; }
    toast.success('Đổi mật khẩu thành công! Hãy đăng nhập lại.');
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--gray-50)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '40px', maxWidth: '440px', width: '100%', boxShadow: 'var(--shadow)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <ShieldCheck size={28} style={{ color: 'var(--primary)' }} />
        </div>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', fontWeight: 800, marginBottom: '8px' }}>Đặt lại mật khẩu</h1>

        {ready === false ? (
          <>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.7 }}>
              Liên kết không hợp lệ hoặc đã hết hạn. Hãy yêu cầu liên kết mới.
            </p>
            <Link href="/forgot-password" className="btn-primary" style={{ borderRadius: '99px', justifyContent: 'center', width: '100%' }}>
              Gửi lại liên kết
            </Link>
          </>
        ) : ready === null ? (
          <p style={{ color: 'var(--gray-400)', fontSize: '14px' }}>Đang kiểm tra liên kết...</p>
        ) : (
          <>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '24px' }}>Nhập mật khẩu mới cho tài khoản của bạn.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Mật khẩu mới</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                  <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-base" style={{ paddingLeft: '40px', paddingRight: '44px' }} required />
                  <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Xác nhận mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className="input-base" style={{ paddingLeft: '40px' }} required />
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', borderRadius: '12px', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </motion.button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
