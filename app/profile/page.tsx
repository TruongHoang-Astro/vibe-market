'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Mail, Phone, Camera, Lock, LogIn, Store, ShieldCheck, Save, MapPin, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/supabase/use-user';
import { uploadAvatar } from '@/app/actions/profile';

const roleLabel: Record<string, string> = { buyer: 'Người mua', seller: 'Người bán', admin: 'Quản trị' };

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading } = useUser();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setAvatar(profile.avatar_url ?? null);
    }
  }, [profile]);

  // Lấy thêm phone (useUser không trả phone)
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from('profiles').select('phone').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.phone) setPhone(data.phone); });
  }, [user]);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string;
      setAvatar(dataUrl); // preview ngay
      const { url, error } = await uploadAvatar(dataUrl);
      if (error || !url) { toast.error(error || 'Upload thất bại'); return; }
      setAvatar(url);
      toast.success('Đã tải ảnh lên');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('profiles')
      .update({ full_name: fullName.trim() || null, phone: phone.trim() || null, avatar_url: avatar })
      .eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Lưu thất bại: ' + error.message); return; }
    toast.success('Đã lưu thông tin!');
    router.refresh();
  };

  const handleChangePassword = async () => {
    if (pw.next.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (pw.next !== pw.confirm) { toast.error('Mật khẩu xác nhận không khớp'); return; }
    setPwSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setPwSaving(false);
    if (error) { toast.error('Đổi mật khẩu thất bại: ' + error.message); return; }
    toast.success('Đã đổi mật khẩu!');
    setPw({ next: '', confirm: '' });
  };

  if (loading) {
    return <div style={{ minHeight: '60vh' }} />;
  }

  if (!user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <LogIn size={56} style={{ color: 'var(--gray-300)', marginBottom: '16px' }} />
        <p style={{ fontWeight: 700, fontSize: '17px', marginBottom: '8px' }}>Bạn chưa đăng nhập</p>
        <p style={{ color: 'var(--gray-500)', marginBottom: '28px' }}>Đăng nhập để xem và chỉnh sửa thông tin cá nhân</p>
        <Link href="/login" className="btn-primary" style={{ borderRadius: '99px' }}><LogIn size={18} /> <span>Đăng nhập</span></Link>
      </div>
    );
  }

  const role = profile?.role ?? 'buyer';

  return (
    <div style={{ minHeight: '80vh', background: 'var(--gray-50)' }}>
      <div style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a0000)', padding: '40px 0' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: 'white' }}>Tài Khoản Của Tôi</h1>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px', maxWidth: '720px' }}>
        {/* Thông tin cá nhân */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '28px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '88px', height: '88px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: 'var(--shadow-md)' }}>
                {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} color="white" />}
              </div>
              <button onClick={() => fileRef.current?.click()}
                style={{ position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Camera size={14} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{fullName || 'Chưa đặt tên'}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px', background: 'rgba(153,0,0,0.08)', color: 'var(--primary)', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px' }}>
                {role === 'seller' ? <Store size={12} /> : <ShieldCheck size={12} />} {roleLabel[role]}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Họ và tên</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nguyễn Văn A" className="input-base" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input type="email" value={user.email ?? ''} disabled className="input-base" style={{ paddingLeft: '40px', background: 'var(--gray-50)', color: 'var(--gray-500)' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Số điện thoại</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901 234 567" className="input-base" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
            className="btn-primary" style={{ marginTop: '24px', padding: '12px 28px', borderRadius: '12px', fontSize: '15px', opacity: saving ? 0.7 : 1 }}>
            <Save size={16} /> <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </motion.button>
        </div>

        {/* Đổi mật khẩu */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '28px' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '18px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} style={{ color: 'var(--primary)' }} /> Đổi mật khẩu
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Mật khẩu mới</label>
              <input type="password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} placeholder="••••••••" className="input-base" />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>Xác nhận</label>
              <input type="password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} placeholder="••••••••" className="input-base" />
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleChangePassword} disabled={pwSaving}
            className="btn-outline" style={{ marginTop: '20px', padding: '12px 28px', borderRadius: '12px', fontSize: '15px', opacity: pwSaving ? 0.7 : 1 }}>
            <span>{pwSaving ? 'Đang đổi...' : 'Đổi mật khẩu'}</span>
          </motion.button>
        </div>

        {/* Sổ địa chỉ */}
        <Link href="/profile/address" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '18px 20px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 600, color: 'var(--black)' }}>Sổ địa chỉ giao hàng</span>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--gray-300)' }} />
          </div>
        </Link>
      </div>
    </div>
  );
}
