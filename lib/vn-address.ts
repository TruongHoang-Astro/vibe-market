// lib/vn-address.ts — Dữ liệu hành chính VN (Tỉnh/Huyện/Xã) từ API mở chính thức
// để "verify" địa chỉ buyer nhập là có thật (chỉ chọn được đơn vị hành chính tồn tại).
// Nguồn: https://provinces.open-api.vn (miễn phí, hỗ trợ CORS).

const BASE = 'https://provinces.open-api.vn/api';

export interface AdminUnit { code: number; name: string; }

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchProvinces(): Promise<AdminUnit[]> {
  const data = await getJson(`${BASE}/p/`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Array.isArray(data) ? (data as any[]).map((p) => ({ code: p.code, name: p.name })) : [];
}

export async function fetchDistricts(provinceCode: number): Promise<AdminUnit[]> {
  const data = await getJson(`${BASE}/p/${provinceCode}?depth=2`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const districts = (data as any)?.districts;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Array.isArray(districts) ? (districts as any[]).map((d) => ({ code: d.code, name: d.name })) : [];
}

export async function fetchWards(districtCode: number): Promise<AdminUnit[]> {
  const data = await getJson(`${BASE}/d/${districtCode}?depth=2`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wards = (data as any)?.wards;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Array.isArray(wards) ? (wards as any[]).map((w) => ({ code: w.code, name: w.name })) : [];
}

// Validate SĐT di động VN: 0[3|5|7|8|9] + 8 số (hoặc +84...).
export function isValidVnPhone(phone: string): boolean {
  const p = phone.replace(/[\s.]/g, '');
  return /^(?:0|\+84)(?:3|5|7|8|9)\d{8}$/.test(p);
}

export interface AddressParts {
  recipient: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
}

// Chuỗi địa chỉ đầy đủ lưu vào đơn hàng (kèm người nhận + SĐT để shop giao được).
export function formatFullAddress(a: AddressParts): string {
  const loc = [a.street, a.ward, a.district, a.province].filter(Boolean).join(', ');
  return `${a.recipient}, ${a.phone}, ${loc}`;
}
