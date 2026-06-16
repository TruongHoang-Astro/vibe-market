// lib/save-address.ts — Lưu địa chỉ (client, RLS own). Resilient: nếu cột `ward`
// chưa tồn tại (chưa chạy address.sql) thì tự bỏ ward và lưu lại.
import { createClient } from '@/lib/supabase/client';
import type { AddressValue } from '@/components/address/AddressForm';

export async function saveAddress(
  userId: string,
  v: AddressValue,
  editingId?: string | null,
): Promise<{ id?: string; error?: string }> {
  const supabase = createClient();
  if (v.is_default) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
  }
  const base = {
    user_id: userId, recipient: v.recipient, phone: v.phone, address: v.address,
    district: v.district || null, province: v.province, is_default: !!v.is_default,
  };
  const withWard = { ...base, ward: v.ward || null };

  if (editingId) {
    let { error } = await supabase.from('addresses').update(withWard).eq('id', editingId);
    if (error) ({ error } = await supabase.from('addresses').update(base).eq('id', editingId));
    if (error) return { error: error.message };
    return { id: editingId };
  }
  let { data, error } = await supabase.from('addresses').insert(withWard).select('id').single();
  if (error) ({ data, error } = await supabase.from('addresses').insert(base).select('id').single());
  if (error) return { error: error.message };
  return { id: data?.id };
}
