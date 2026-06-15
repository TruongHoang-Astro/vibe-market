'use server';
// Server Actions cho seller: CRUD sản phẩm + cập nhật gian hàng.
// RLS đảm bảo chỉ chủ shop thao tác được; ở đây verify thêm để báo lỗi rõ ràng.
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Database, OrderStatus } from '@/lib/supabase/types';

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
  sizeGuide?: { size: string; value: string }[];  // bảng hướng dẫn chọn size
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

// Lọc bỏ dòng size guide trống
function cleanGuide(g?: { size: string; value: string }[]): { size: string; value: string }[] {
  return (g ?? []).filter(r => (r.size?.trim() || r.value?.trim())).map(r => ({ size: (r.size || '').trim(), value: (r.value || '').trim() }));
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
    ...(cleanGuide(input.sizeGuide).length ? { size_guide: cleanGuide(input.sizeGuide) } : {}),
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
  const guide = cleanGuide(input.sizeGuide);
  if (guide.length) patch.size_guide = guide;
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

// ---------- Đơn hàng của shop (dùng admin client; RLS orders chỉ cho buyer) ----------
export interface SellerOrder {
  id: string;
  status: string;
  address: string;
  paymentMethod: string;
  date: string;
  buyerId: string;
  shopRevenue: number; // doanh thu phần của shop này trong đơn
  items: { name: string; qty: number; price: number; image: string }[];
}
export interface SellerStats {
  totalRevenue: number;
  totalOrders: number;
  monthly: { month: string; revenue: number; orders: number }[];
}

function monthlyBuckets(orders: { date: string; shopRevenue: number }[]): SellerStats['monthly'] {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: `T${d.getMonth() + 1}`, revenue: 0, orders: 0 };
  });
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const o of orders) {
    const d = new Date(o.date);
    const i = idx.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (i !== undefined) { buckets[i].revenue += o.shopRevenue; buckets[i].orders += 1; }
  }
  return buckets.map(({ month, revenue, orders }) => ({ month, revenue, orders }));
}

export async function getShopOrders(): Promise<{ orders: SellerOrder[]; stats: SellerStats; error?: string }> {
  const empty = { orders: [], stats: { totalRevenue: 0, totalOrders: 0, monthly: monthlyBuckets([]) } };
  const c = await ctx();
  if ('error' in c) return { ...empty, error: c.error };
  const { shop } = c;
  const admin = createAdminClient();

  const { data: prods } = await admin.from('products').select('id').eq('shop_id', shop.id);
  const ids = (prods ?? []).map(p => p.id);
  if (!ids.length) return empty;

  const { data: rows, error } = await admin
    .from('order_items')
    .select('order_id, name, qty, price, image, orders(id, user_id, total, status, address, payment_method, created_at)')
    .in('product_id', ids);
  if (error) { console.error('getShopOrders:', error.message); return { ...empty, error: 'Không tải được đơn hàng' }; }

  const map = new Map<string, SellerOrder>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const it of (rows ?? []) as any[]) {
    const o = it.orders;
    if (!o) continue;
    let so = map.get(o.id);
    if (!so) {
      so = { id: o.id, status: o.status, address: o.address, paymentMethod: o.payment_method, date: o.created_at, buyerId: o.user_id ?? '', shopRevenue: 0, items: [] };
      map.set(o.id, so);
    }
    so.items.push({ name: it.name, qty: it.qty, price: Number(it.price), image: it.image });
    so.shopRevenue += Number(it.price) * it.qty;
  }
  const orders = [...map.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalRevenue = orders.reduce((s, o) => s + o.shopRevenue, 0);
  return { orders, stats: { totalRevenue, totalOrders: orders.length, monthly: monthlyBuckets(orders) } };
}

// ---------- Cập nhật trạng thái đơn (seller) + thông báo cho khách ----------
const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy',
};

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ ok?: true; error?: string }> {
  const c = await ctx();
  if ('error' in c) return { error: c.error };
  const { shop } = c;
  const admin = createAdminClient();

  // Xác minh đơn có chứa sản phẩm của shop này
  const { data: shopProds } = await admin.from('products').select('id').eq('shop_id', shop.id);
  const ids = (shopProds ?? []).map(p => p.id);
  if (!ids.length) return { error: 'Đơn không thuộc shop của bạn' };
  const { data: oi } = await admin.from('order_items').select('order_id').eq('order_id', orderId).in('product_id', ids).limit(1);
  if (!oi || !oi.length) return { error: 'Đơn không thuộc shop của bạn' };

  const { data: order } = await admin.from('orders').select('id, user_id').eq('id', orderId).maybeSingle();
  if (!order) return { error: 'Không tìm thấy đơn' };

  const { error } = await admin.from('orders').update({ status }).eq('id', orderId);
  if (error) { console.error('updateOrderStatus:', error.message); return { error: 'Cập nhật trạng thái thất bại' }; }

  // Thông báo cho người mua
  if (order.user_id) {
    await admin.from('notifications').insert({
      user_id: order.user_id,
      type: 'order',
      title: `Đơn hàng ${orderId}`,
      message: `Đơn của bạn đã chuyển sang trạng thái: ${STATUS_LABEL[status] ?? status}`,
      link: '/orders',
    });
  }
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
