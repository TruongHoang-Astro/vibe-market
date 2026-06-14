'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2, Edit3, Check, X, LogIn, Star, ChevronRight, Phone, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/supabase/use-user';

interface Address {
  id: string; recipient: string; phone: string; address: string;
  district: string | null; province: string; is_default: boolean;
}

const provinces = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Biên Hòa', 'Nha Trang', 'Huế'];
const emptyForm = { recipient: '', phone: '', address: '', district: '', province: '', is_default: false };

export default function AddressPage() {
  const { user, loading } = useUser();
  const [items, setItems] = useState<Address[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) { setLoadingList(false); return; }
    const supabase = createClient();
    const { data } = await supabase.from('addresses').select('*').order('is_default', { ascending: false }).order('created_at', { ascending: false });
    setItems((data ?? []) as Address[]);
    setLoadingList(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (a: Address) => {
    setForm({ recipient: a.recipient, phone: a.phone, address: a.address, district: a.district ?? '', province: a.province, is_default: a.is_default });
    setEditingId(a.id); setShowForm(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.recipient.trim() || !form.phone.trim() || !form.address.trim() || !form.province) {
      toast.error('Vui lòng điền đủ tên, SĐT, địa chỉ, tỉnh/thành'); return;
    }
    setSaving(true);
    const supabase = createClient();
    // Nếu đặt mặc định → bỏ mặc định các địa chỉ khác
    if (form.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    }
    const payload = {
      user_id: user.id, recipient: form.recipient.trim(), phone: form.phone.trim(),
      address: form.address.trim(), district: form.district.trim() || null,
      province: form.province, is_default: form.is_default,
    };
    const { error } = editingId
      ? await supabase.from('addresses').update(payload).eq('id', editingId)
      : await supabase.from('addresses').insert(payload);
    setSaving(false);
    if (error) { toast.error('Lưu thất bại: ' + error.message); return; }
    toast.success(editingId ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ');
    setShowForm(false); load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Xóa địa chỉ này?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) { toast.error('Xóa thất bại'); return; }
    toast.success('Đã xóa địa chỉ'); load();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    toast.success('Đã đặt làm mặc định'); load();
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

  return (
    <div style={{ minHeight: '80vh', background: 'var(--gray-50)' }}>
      <div className="page-hero" style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a0000)', padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
            <Link href="/profile" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Tài khoản</Link>
            <ChevronRight size={14} /> <span style={{ color: 'var(--primary)' }}>Sổ địa chỉ</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: 'white' }}>Sổ Địa Chỉ</h1>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px', maxWidth: '720px' }}>
        <button onClick={openAdd} className="btn-primary" style={{ borderRadius: '10px', marginBottom: '20px' }}>
          <Plus size={18} /> <span>Thêm địa chỉ mới</span>
        </button>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)' }}>
            <MapPin size={48} style={{ color: 'var(--gray-300)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--gray-500)' }}>Chưa có địa chỉ nào. Thêm địa chỉ để thanh toán nhanh hơn.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map(a => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: `1px solid ${a.is_default ? 'var(--primary)' : 'var(--gray-100)'}`, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>{a.recipient}</span>
                      <span style={{ color: 'var(--gray-400)', fontSize: '13px' }}>{a.phone}</span>
                      {a.is_default && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(239,68,68,0.08)', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px' }}><Star size={10} fill="var(--primary)" /> Mặc định</span>}
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--gray-600)', lineHeight: 1.5 }}>
                      {a.address}{a.district ? `, ${a.district}` : ''}, {a.province}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!a.is_default && <button onClick={() => setDefault(a.id)} title="Đặt mặc định" style={{ padding: '7px', border: '1.5px solid var(--gray-200)', borderRadius: '8px', background: 'white', cursor: 'pointer', color: 'var(--gray-500)' }}><Star size={15} /></button>}
                    <button onClick={() => openEdit(a)} title="Sửa" style={{ padding: '7px', border: '1.5px solid var(--gray-200)', borderRadius: '8px', background: 'white', cursor: 'pointer', color: 'var(--gray-600)' }}><Edit3 size={15} /></button>
                    <button onClick={() => remove(a.id)} title="Xóa" style={{ padding: '7px', border: '1.5px solid #fee2e2', borderRadius: '8px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={15} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'white', borderRadius: '20px', padding: '28px', width: '480px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: '20px', fontWeight: 800 }}>{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</h2>
                <button onClick={() => setShowForm(false)} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                    <input value={form.recipient} onChange={e => setForm({ ...form, recipient: e.target.value })} placeholder="Họ tên người nhận" className="input-base" style={{ paddingLeft: '36px' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Số điện thoại" className="input-base" style={{ paddingLeft: '36px' }} />
                  </div>
                </div>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Số nhà, tên đường, phường/xã" className="input-base" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="Quận / Huyện" className="input-base" />
                  <select value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} className="input-base" style={{ cursor: 'pointer' }}>
                    <option value="">Tỉnh / Thành...</option>
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} />
                  Đặt làm địa chỉ mặc định
                </label>
                <button onClick={save} disabled={saving} className="btn-primary" style={{ justifyContent: 'center', padding: '12px', borderRadius: '10px', marginTop: '4px', opacity: saving ? 0.7 : 1 }}>
                  <Check size={16} /> <span>{saving ? 'Đang lưu...' : 'Lưu địa chỉ'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
