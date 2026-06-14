'use server';
// Server Actions cho seller: CRUD sản phẩm + cập nhật gian hàng.
// RLS đảm bảo chỉ chủ shop thao tác được; ở đây verify thêm để báo lỗi rõ ràng.
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

type ProductUpdate = Database['public']['Tables']['products']['Update'];
type ShopUpdate = Database['public']['Tables']['shops']['Update'];

export interface ProductInput {
  name: string;
  category: string;
  price: number;        // giá gốc
  salePrice?: number;   // giá bán (nếu có khuyến mãi)
  stock: number;
  description: string;
  image: string;
}

async function ctx() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập' as const };
  const { data: shop } = await supabase
    .from('shops').select('id, owner_id').eq('owner_id', user.id).maybeSingle();
  if (!shop) return { error: 'Bạn chưa có gian hàng' as const };
  return { supabase, shop };
}

function priceFields(input: ProductInput) {
  const original = Math.max(0, Math.round(input.price));
  const selling = input.salePrice && input.salePrice > 0 ? Math.round(input.salePrice) : original;
  const badge: 'sale' | 'new' = selling < original ? 'sale' : 'new';
  return { original, selling, badge };
}

export async function createProduct(input: ProductInput): Promise<{ ok?: true; error?: string }> {
  const c = await ctx();
  if ('error' in c) return { error: c.error };
  const { supabase, shop } = c;
  if (!input.name.trim()) return { error: 'Thiếu tên sản phẩm' };

  const { original, selling, badge } = priceFields(input);
  const id = 'p-' + crypto.randomUUID().slice(0, 8);
  const image = input.image || '';

  const { error } = await supabase.from('products').insert({
    id,
    shop_id: shop.id,
    name: input.name.trim(),
    price: selling,
    original_price: original,
    image,
    images: image ? [image] : [],
    category: input.category || 'Tổng hợp',
    stock: Math.max(0, Math.round(input.stock || 0)),
    description: input.description || '',
    badge,
  });
  if (error) { console.error('createProduct:', error.message); return { error: 'Đăng sản phẩm thất bại' }; }
  return { ok: true };
}

export async function updateProduct(id: string, input: ProductInput): Promise<{ ok?: true; error?: string }> {
  const c = await ctx();
  if ('error' in c) return { error: c.error };
  const { supabase, shop } = c;

  const { original, selling, badge } = priceFields(input);
  const patch: ProductUpdate = {
    name: input.name.trim(),
    price: selling,
    original_price: original,
    category: input.category || 'Tổng hợp',
    stock: Math.max(0, Math.round(input.stock || 0)),
    description: input.description || '',
    badge,
  };
  if (input.image) { patch.image = input.image; patch.images = [input.image]; }

  // .eq shop_id để chắc chắn chỉ sửa SP của shop mình (RLS cũng chặn)
  const { error } = await supabase.from('products').update(patch).eq('id', id).eq('shop_id', shop.id);
  if (error) { console.error('updateProduct:', error.message); return { error: 'Cập nhật thất bại' }; }
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<{ ok?: true; error?: string }> {
  const c = await ctx();
  if ('error' in c) return { error: c.error };
  const { supabase, shop } = c;
  const { error } = await supabase.from('products').delete().eq('id', id).eq('shop_id', shop.id);
  if (error) { console.error('deleteProduct:', error.message); return { error: 'Xóa thất bại' }; }
  return { ok: true };
}

export interface ShopInput {
  name: string;
  description: string;
  category: string;
  logo?: string;
  banner?: string;
}

export async function updateShop(input: ShopInput): Promise<{ ok?: true; error?: string }> {
  const c = await ctx();
  if ('error' in c) return { error: c.error };
  const { supabase, shop } = c;
  const patch: ShopUpdate = {
    name: input.name.trim(),
    description: input.description || '',
    category: input.category || 'Tổng hợp',
  };
  if (input.logo) patch.logo = input.logo;
  if (input.banner) patch.banner = input.banner;
  const { error } = await supabase.from('shops').update(patch).eq('id', shop.id);
  if (error) { console.error('updateShop:', error.message); return { error: 'Lưu thất bại' }; }
  return { ok: true };
}
