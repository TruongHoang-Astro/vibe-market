'use client';
// Form địa chỉ có "verify": chọn Tỉnh → Huyện → Xã từ dữ liệu hành chính VN thật.
// Nếu API dữ liệu không truy cập được → tự fallback sang nhập tay (vẫn validate SĐT).
import { useEffect, useRef, useState } from 'react';
import { Check, User, Phone, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchProvinces, fetchDistricts, fetchWards, isValidVnPhone, type AdminUnit } from '@/lib/vn-address';

export interface AddressValue {
  recipient: string;
  phone: string;
  address: string;   // số nhà, tên đường (street)
  ward: string;
  district: string;
  province: string;
  is_default?: boolean;
}

interface Props {
  initial?: Partial<AddressValue>;
  onSave: (v: AddressValue) => void | Promise<void>;
  onCancel?: () => void;
  saving?: boolean;
  showDefault?: boolean;
  submitLabel?: string;
}

const selectStyle: React.CSSProperties = { cursor: 'pointer', appearance: 'none' as const };

export default function AddressForm({ initial, onSave, onCancel, saving, showDefault = true, submitLabel = 'Lưu địa chỉ' }: Props) {
  const [recipient, setRecipient] = useState(initial?.recipient ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [street, setStreet] = useState(initial?.address ?? '');
  const [isDefault, setIsDefault] = useState(initial?.is_default ?? false);
  const [phoneErr, setPhoneErr] = useState('');

  const [provinces, setProvinces] = useState<AdminUnit[]>([]);
  const [districts, setDistricts] = useState<AdminUnit[]>([]);
  const [wards, setWards] = useState<AdminUnit[]>([]);
  const [provinceCode, setProvinceCode] = useState<number | ''>('');
  const [districtCode, setDistrictCode] = useState<number | ''>('');
  const [wardCode, setWardCode] = useState<number | ''>('');

  // Fallback nhập tay nếu API hành chính không khả dụng
  const [apiFailed, setApiFailed] = useState(false);
  const [provinceText, setProvinceText] = useState(initial?.province ?? '');
  const [districtText, setDistrictText] = useState(initial?.district ?? '');
  const [wardText, setWardText] = useState(initial?.ward ?? '');

  const initDone = useRef(false);

  // Tải danh sách tỉnh
  useEffect(() => {
    let alive = true;
    fetchProvinces().then((ps) => {
      if (!alive) return;
      if (ps.length === 0) { setApiFailed(true); return; }
      setProvinces(ps);
    });
    return () => { alive = false; };
  }, []);

  // Khôi phục lựa chọn khi sửa (match theo tên) — chạy 1 lần sau khi có danh sách tỉnh
  useEffect(() => {
    if (initDone.current || apiFailed || provinces.length === 0) return;
    initDone.current = true;
    if (!initial?.province) return;
    (async () => {
      const p = provinces.find((x) => x.name === initial.province);
      if (!p) return;
      setProvinceCode(p.code);
      const ds = await fetchDistricts(p.code);
      setDistricts(ds);
      const d = ds.find((x) => x.name === initial.district);
      if (!d) return;
      setDistrictCode(d.code);
      const ws = await fetchWards(d.code);
      setWards(ws);
      const w = ws.find((x) => x.name === initial.ward);
      if (w) setWardCode(w.code);
    })();
  }, [provinces, apiFailed, initial]);

  const onProvince = async (code: number) => {
    setProvinceCode(code); setDistrictCode(''); setWardCode(''); setDistricts([]); setWards([]);
    setDistricts(await fetchDistricts(code));
  };
  const onDistrict = async (code: number) => {
    setDistrictCode(code); setWardCode(''); setWards([]);
    setWards(await fetchWards(code));
  };

  const checkPhone = (v: string) => {
    setPhone(v);
    setPhoneErr(v && !isValidVnPhone(v) ? 'SĐT không hợp lệ (VD: 0901234567)' : '');
  };

  const submit = async () => {
    const province = apiFailed ? provinceText.trim() : (provinces.find((p) => p.code === provinceCode)?.name ?? '');
    const district = apiFailed ? districtText.trim() : (districts.find((d) => d.code === districtCode)?.name ?? '');
    const ward = apiFailed ? wardText.trim() : (wards.find((w) => w.code === wardCode)?.name ?? '');

    if (!recipient.trim()) return toast.error('Vui lòng nhập họ tên người nhận');
    if (!isValidVnPhone(phone)) { setPhoneErr('SĐT không hợp lệ (VD: 0901234567)'); return toast.error('Số điện thoại không hợp lệ'); }
    if (!province || !district || !ward) return toast.error('Vui lòng chọn đầy đủ Tỉnh / Huyện / Phường-Xã');
    if (!street.trim()) return toast.error('Vui lòng nhập số nhà, tên đường');

    await onSave({ recipient: recipient.trim(), phone: phone.replace(/[\s.]/g, ''), address: street.trim(), ward, district, province, is_default: isDefault });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Họ tên người nhận" className="input-base" style={{ paddingLeft: '36px' }} />
        </div>
        <div>
          <div style={{ position: 'relative' }}>
            <Phone size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input value={phone} onChange={(e) => checkPhone(e.target.value)} placeholder="Số điện thoại" className="input-base" style={{ paddingLeft: '36px', borderColor: phoneErr ? '#dc2626' : undefined }} />
          </div>
          {phoneErr && <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> {phoneErr}</div>}
        </div>
      </div>

      {apiFailed ? (
        // Fallback: nhập tay (khi không tải được dữ liệu hành chính)
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <input value={provinceText} onChange={(e) => setProvinceText(e.target.value)} placeholder="Tỉnh / Thành" className="input-base" />
          <input value={districtText} onChange={(e) => setDistrictText(e.target.value)} placeholder="Quận / Huyện" className="input-base" />
          <input value={wardText} onChange={(e) => setWardText(e.target.value)} placeholder="Phường / Xã" className="input-base" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <select value={provinceCode} onChange={(e) => onProvince(Number(e.target.value))} className="input-base" style={selectStyle}>
            <option value="">Tỉnh / Thành...</option>
            {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
          <select value={districtCode} onChange={(e) => onDistrict(Number(e.target.value))} className="input-base" style={selectStyle} disabled={!provinceCode}>
            <option value="">Quận / Huyện...</option>
            {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
          </select>
          <select value={wardCode} onChange={(e) => setWardCode(Number(e.target.value))} className="input-base" style={selectStyle} disabled={!districtCode}>
            <option value="">Phường / Xã...</option>
            {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
          </select>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <MapPin size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
        <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Số nhà, tên đường" className="input-base" style={{ paddingLeft: '36px' }} />
      </div>

      {!apiFailed && (
        <div style={{ fontSize: '12px', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Check size={13} style={{ color: '#16a34a' }} /> Địa chỉ hành chính được xác thực theo dữ liệu chính thức.
        </div>
      )}

      {showDefault && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Đặt làm địa chỉ mặc định
        </label>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        {onCancel && (
          <button onClick={onCancel} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>Hủy</button>
        )}
        <button onClick={submit} disabled={saving} className="btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '12px', borderRadius: '10px', opacity: saving ? 0.7 : 1 }}>
          <Check size={16} /> <span>{saving ? 'Đang lưu...' : submitLabel}</span>
        </button>
      </div>
    </div>
  );
}
