'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Package, MessageCircle, Tag, CheckCheck, LogIn, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/supabase/use-user';

interface Notif {
  id: string; type: string; title: string; message: string;
  link: string | null; is_read: boolean; created_at: string;
}

const iconOf = (t: string) =>
  t === 'order' ? <Package size={18} /> : t === 'message' ? <MessageCircle size={18} /> : t === 'promo' ? <Tag size={18} /> : <Bell size={18} />;
const colorOf = (t: string) =>
  t === 'order' ? '#2563eb' : t === 'message' ? '#ef4444' : t === 'promo' ? '#16a34a' : '#f59e0b';

function fmtRel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'vừa xong';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [items, setItems] = useState<Notif[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const load = async () => {
    if (!user) { setLoadingList(false); return; }
    const supabase = createClient();
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
    setItems((data ?? []) as Notif[]);
    setLoadingList(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const open = async (n: Notif) => {
    if (!n.is_read) {
      const supabase = createClient();
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    if (n.link) router.push(n.link);
  };

  if (loading || loadingList) return <div style={{ minHeight: '60vh' }} />;
  if (!user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <LogIn size={56} style={{ color: 'var(--gray-300)', marginBottom: '16px' }} />
        <p style={{ fontWeight: 700, fontSize: '17px', marginBottom: '8px' }}>Bạn chưa đăng nhập</p>
        <Link href="/login" className="btn-primary" style={{ borderRadius: '99px', marginTop: '12px' }}><LogIn size={18} /> <span>Đăng nhập</span></Link>
      </div>
    );
  }

  const unread = items.filter(n => !n.is_read).length;

  return (
    <div style={{ minHeight: '80vh', background: 'var(--gray-50)' }}>
      <div className="page-hero" style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a0000)', padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Trang chủ</Link>
            <ChevronRight size={14} /> <span style={{ color: 'var(--primary)' }}>Thông báo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: 'white' }}>
              Thông Báo {unread > 0 && <span style={{ fontSize: '1rem', color: 'var(--primary)' }}>({unread} mới)</span>}
            </h1>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '99px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                <CheckCheck size={15} /> Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px', maxWidth: '720px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <Bell size={56} style={{ color: 'var(--gray-300)', marginBottom: '16px' }} />
            <p style={{ fontWeight: 700, fontSize: '17px', marginBottom: '8px' }}>Chưa có thông báo</p>
            <p style={{ color: 'var(--gray-500)' }}>Thông báo về đơn hàng, tin nhắn sẽ xuất hiện ở đây.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((n, i) => (
              <motion.button key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => open(n)}
                style={{ textAlign: 'left', display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 18px', background: n.is_read ? 'white' : '#fff8f8', border: `1px solid ${n.is_read ? 'var(--gray-100)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', width: '100%' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${colorOf(n.type)}18`, color: colorOf(n.type), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {iconOf(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{n.title}</span>
                    {!n.is_read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
                  </div>
                  {n.message && <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginTop: '3px', lineHeight: 1.5 }}>{n.message}</p>}
                  <span style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '4px', display: 'block' }}>{fmtRel(n.created_at)}</span>
                </div>
                {n.link && <ChevronRight size={16} style={{ color: 'var(--gray-300)', flexShrink: 0, marginTop: '10px' }} />}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
