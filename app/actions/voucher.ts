'use server';
// Kiểm tra + tính giảm giá voucher (server-side, không tin số từ client).
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

type VoucherRow = Database['public']['Tables']['vouchers']['Row'];

export interface AppliedVoucher {
  code: string;
  discount: number;
  description: string;
}

function computeDiscount(v: VoucherRow, subtotal: number): number {
  let d = v.discount_type === 'percent'
    ? Math.round((subtotal * Number(v.discount_value)) / 100)
    : Number(v.discount_value);
  if (v.max_discount != null) d = Math.min(d, Number(v.max_discount));
  return Math.max(0, Math.min(d, subtotal)); // không vượt quá tiền hàng
}

// Trả về voucher hợp lệ + số tiền giảm, hoặc lỗi. shopIds = các shop có trong giỏ.
export async function validateVoucher(
  code: string,
  subtotal: number,
  shopIds: string[],
): Promise<{ voucher?: AppliedVoucher; error?: string }> {
  const c = (code ?? '').trim();
  if (!c) return { error: 'Vui lòng nhập mã giảm giá' };

  const supabase = await createClient();
  const { data: v } = await supabase.from('vouchers').select('*').ilike('code', c).maybeSingle();
  if (!v) return { error: 'Mã không tồn tại' };
  if (!v.active) return { error: 'Mã đã ngừng áp dụng' };

  const now = Date.now();
  if (v.starts_at && new Date(v.starts_at).getTime() > now) return { error: 'Mã chưa đến thời gian áp dụng' };
  if (v.expires_at && new Date(v.expires_at).getTime() < now) return { error: 'Mã đã hết hạn' };
  if (v.usage_limit != null && v.used_count >= v.usage_limit) return { error: 'Mã đã hết lượt sử dụng' };
  if (subtotal < Number(v.min_order)) return { error: `Cần đơn tối thiểu ${Number(v.min_order).toLocaleString('vi-VN')}đ` };
  if (v.shop_id && !shopIds.includes(v.shop_id)) return { error: 'Mã chỉ áp dụng cho gian hàng cụ thể' };

  const discount = computeDiscount(v, subtotal);
  if (discount <= 0) return { error: 'Mã không tạo được mức giảm cho đơn này' };
  return { voucher: { code: v.code, discount, description: v.description } };
}
