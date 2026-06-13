'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error('Không gửi được email. Vui lòng thử lại.');
      return;
    }
    setSent(true);
  };

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--gray-50)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '40px', maxWidth: '440px', width: '100%', boxShadow: 'var(--shadow)' }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={40} color="white" />
            </div>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>Đã gửi email!</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px' }}>
              Kiểm tra hộp thư <strong style={{ color: 'var(--black)' }}>{email}</strong> và bấm vào liên kết để đặt lại mật khẩu.
            </p>
            <Link href="/login" className="btn-outline" style={{ borderRadius: '99px', justifyContent: 'center', width: '100%' }}>
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(153,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <KeyRound size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', fontWeight: 800, marginBottom: '8px' }}>Quên mật khẩu?</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '28px' }}>
              Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
            </p>
            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Email</label>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="input-base" style={{ paddingLeft: '40px' }} required />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', borderRadius: '12px', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
              </motion.button>
            </form>
            <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '20px', fontSize: '14px', color: 'var(--gray-500)', textDecoration: 'none' }}>
              <ArrowLeft size={15} /> Quay lại đăng nhập
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
