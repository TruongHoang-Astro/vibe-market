'use server';
// Server Actions cho Admin — đọc dữ liệu thật + kiểm duyệt (moderation).
// Bảo mật: requireAdmin() kiểm tra role='admin' của người gọi TRƯỚC khi dùng
// service-role client (bỏ qua RLS). Người không phải admin không lấy được gì.
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notify';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, UserRole } from '@/lib/supabase/types';

type Admin = SupabaseClient<Database>;

async function requireAdmin(): Promise<{ admin: Admin; userId: string } | { error: 'unauth' | 'forbidden' }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauth' };
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (prof?.role !== 'admin') return { error: 'forbidden' };
  return { admin: createAdminClient(), userId: user.id };
}

// ============================================================
// Kiểu dữ liệu trả về cho dashboard
// ============================================================
export interface AdminUserRow { id: string; name: string; email: string; role: string; status: string; phone: string; joined: string; }
export interface AdminShopRow { id: string; name: string; logo: string; banner: string; category: string; products: number; rating: number; followers: number; responseRate: number; verified: boolean; }
export interface AdminProductRow { id: string; name: string; image: string; shopName: string; category: string; price: number; sold: number; rating: number; }
export interface AdminOrderRow { id: string; total: number; status: string; address: string; paymentMethod: string; date: string; itemName: string; itemImage: string; itemCount: number; }
export interface AdminReportRow { id: string; targetType: string; targetId: string; targetLabel: string; reason: string; status: string; date: string; }
export interface AdminOverview {
  totalRevenue: number; totalOrders: number; totalUsers: number; totalShops: number;
  totalProducts: number; pendingShops: number; openReports: number; bannedUsers: number;
  monthly: { month: string; revenue: number; orders: number }[];
  categoryRevenue: { name: string; value: number; color: string }[];
}
export interface AdminDashboardData {
  overview: AdminOverview;
  users: AdminUserRow[];
  shops: AdminShopRow[];
  products: AdminProductRow[];
  orders: AdminOrderRow[];
  reports: AdminReportRow[];
}
export type AdminAccess = 'ok' | 'unauth' | 'forbidden';

const PIE_COLORS = ['#ef4444', '#2563eb', '#ec4899', '#f59e0b', '#16a34a', '#9333ea', '#0891b2', '#64748b'];

function monthlyBuckets(rows: { date: string; total: number }[]) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: `T${d.getMonth() + 1}`, revenue: 0, orders: 0 };
  });
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const r of rows) {
    const d = new Date(r.date);
    const i = idx.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (i !== undefined) { buckets[i].revenue += r.total; buckets[i].orders += 1; }
  }
  return buckets.map(({ month, revenue, orders }) => ({ month, revenue, orders }));
}

// ============================================================
// Tải toàn bộ dữ liệu dashboard trong 1 lần (1 lần requireAdmin)
// ============================================================
export async function getAdminDashboard(): Promise<{ access: AdminAccess; data?: AdminDashboardData }> {
  const c = await requireAdmin();
  if ('error' in c) return { access: c.error };
  const { admin } = c;

  // Email từ Auth (gộp theo id)
  const emailMap = new Map<string, string>();
  try {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of list?.users ?? []) if (u.email) emailMap.set(u.id, u.email);
  } catch (e) { console.error('listUsers:', e); }

  const [
    profilesRes, shopsRes, productsRes, ordersRes, orderItemsRes, reportsRes,
    usersCount, shopsCount, productsCount,
  ] = await Promise.all([
    admin.from('profiles').select('id, full_name, role, status, phone, created_at').order('created_at', { ascending: false }),
    admin.from('shops').select('id, name, logo, banner, category, products, rating, followers, response_rate, verified').order('created_at', { ascending: false }),
    admin.from('products').select('id, name, image, category, price, sold, rating, shops(name)').order('sold', { ascending: false }),
    admin.from('orders').select('id, total, status, address, payment_method, created_at').order('created_at', { ascending: false }),
    admin.from('order_items').select('order_id, name, image'),
    admin.from('reports').select('id, target_type, target_id, target_label, reason, status, created_at').order('created_at', { ascending: false }),
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('shops').select('*', { count: 'exact', head: true }),
    admin.from('products').select('*', { count: 'exact', head: true }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users: AdminUserRow[] = ((profilesRes.data ?? []) as any[]).map(p => ({
    id: p.id, name: p.full_name || '(chưa đặt tên)', email: emailMap.get(p.id) || '—',
    role: p.role, status: p.status ?? 'active', phone: p.phone || '—', joined: p.created_at,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shops: AdminShopRow[] = ((shopsRes.data ?? []) as any[]).map(s => ({
    id: s.id, name: s.name, logo: s.logo, banner: s.banner, category: s.category,
    products: s.products, rating: Number(s.rating), followers: s.followers,
    responseRate: s.response_rate, verified: s.verified,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products: AdminProductRow[] = ((productsRes.data ?? []) as any[]).map(p => ({
    id: p.id, name: p.name, image: p.image, shopName: p.shops?.name ?? '',
    category: p.category, price: Number(p.price), sold: p.sold, rating: Number(p.rating),
  }));

  // Gộp order_items theo order (lấy item đầu + đếm)
  const itemsByOrder = new Map<string, { name: string; image: string; count: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const it of (orderItemsRes.data ?? []) as any[]) {
    const cur = itemsByOrder.get(it.order_id);
    if (cur) cur.count += 1;
    else itemsByOrder.set(it.order_id, { name: it.name, image: it.image ?? '', count: 1 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ordersData = (ordersRes.data ?? []) as any[];
  const orders: AdminOrderRow[] = ordersData.map(o => {
    const it = itemsByOrder.get(o.id);
    return {
      id: o.id, total: Number(o.total), status: o.status, address: o.address,
      paymentMethod: o.payment_method, date: o.created_at,
      itemName: it?.name ?? '(không có sản phẩm)', itemImage: it?.image ?? '', itemCount: it?.count ?? 0,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reports: AdminReportRow[] = ((reportsRes.data ?? []) as any[]).map(r => ({
    id: r.id, targetType: r.target_type, targetId: r.target_id, targetLabel: r.target_label,
    reason: r.reason, status: r.status, date: r.created_at,
  }));

  // Doanh thu: bỏ đơn đã hủy
  const validOrders = ordersData.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((s, o) => s + Number(o.total), 0);
  const monthly = monthlyBuckets(validOrders.map(o => ({ date: o.created_at, total: Number(o.total) })));

  // GMV theo danh mục (sold * price gộp theo category)
  const catMap = new Map<string, number>();
  for (const p of products) catMap.set(p.category, (catMap.get(p.category) ?? 0) + p.sold * p.price);
  const categoryRevenue = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));

  const overview: AdminOverview = {
    totalRevenue, totalOrders: ordersData.length,
    totalUsers: usersCount.count ?? users.length,
    totalShops: shopsCount.count ?? shops.length,
    totalProducts: productsCount.count ?? products.length,
    pendingShops: shops.filter(s => !s.verified).length,
    openReports: reports.filter(r => r.status === 'open').length,
    bannedUsers: users.filter(u => u.status === 'banned').length,
    monthly, categoryRevenue,
  };

  return { access: 'ok', data: { overview, users, shops, products, orders, reports } };
}

// ============================================================
// Hành động kiểm duyệt
// ============================================================
type Res = { ok?: true; error?: string };

export async function setUserStatus(userId: string, status: 'active' | 'banned'): Promise<Res> {
  const c = await requireAdmin();
  if ('error' in c) return { error: 'Không có quyền' };
  if (userId === c.userId) return { error: 'Không thể tự khóa tài khoản admin của bạn' };
  const { error } = await c.admin.from('profiles').update({ status }).eq('id', userId);
  if (error) { console.error('setUserStatus:', error.message); return { error: 'Cập nhật thất bại' }; }
  return { ok: true };
}

export async function setUserRole(userId: string, role: UserRole): Promise<Res> {
  const c = await requireAdmin();
  if ('error' in c) return { error: 'Không có quyền' };
  const { error } = await c.admin.from('profiles').update({ role }).eq('id', userId);
  if (error) { console.error('setUserRole:', error.message); return { error: 'Cập nhật thất bại' }; }
  return { ok: true };
}

export async function setShopVerified(shopId: string, verified: boolean): Promise<Res> {
  const c = await requireAdmin();
  if ('error' in c) return { error: 'Không có quyền' };
  const { data: shop, error } = await c.admin.from('shops').update({ verified }).eq('id', shopId).select('owner_id, name').maybeSingle();
  if (error) { console.error('setShopVerified:', error.message); return { error: 'Cập nhật thất bại' }; }
  // Thông báo cho chủ shop
  if (shop?.owner_id) {
    await createNotification(c.admin, {
      userId: shop.owner_id, type: 'info',
      title: verified ? 'Gian hàng đã được duyệt ✅' : 'Gian hàng bị tạm khóa',
      message: verified ? `Gian hàng "${shop.name}" đã được duyệt và hiển thị công khai.` : `Gian hàng "${shop.name}" đã bị admin tạm khóa xác minh.`,
      link: '/seller/dashboard',
    });
  }
  return { ok: true };
}

export async function deleteShop(shopId: string): Promise<Res> {
  const c = await requireAdmin();
  if ('error' in c) return { error: 'Không có quyền' };
  const { error } = await c.admin.from('shops').delete().eq('id', shopId);
  if (error) { console.error('deleteShop:', error.message); return { error: 'Xóa thất bại' }; }
  return { ok: true };
}

export async function adminDeleteProduct(id: string): Promise<Res> {
  const c = await requireAdmin();
  if ('error' in c) return { error: 'Không có quyền' };
  const { error } = await c.admin.from('products').delete().eq('id', id);
  if (error) { console.error('adminDeleteProduct:', error.message); return { error: 'Xóa thất bại' }; }
  return { ok: true };
}

export async function adminDeleteReview(id: string): Promise<Res> {
  const c = await requireAdmin();
  if ('error' in c) return { error: 'Không có quyền' };
  const { error } = await c.admin.from('reviews').delete().eq('id', id);
  if (error) { console.error('adminDeleteReview:', error.message); return { error: 'Xóa thất bại' }; }
  return { ok: true };
}

export async function resolveReport(id: string, status: 'resolved' | 'dismissed' | 'open'): Promise<Res> {
  const c = await requireAdmin();
  if ('error' in c) return { error: 'Không có quyền' };
  const { error } = await c.admin.from('reports').update({ status }).eq('id', id);
  if (error) { console.error('resolveReport:', error.message); return { error: 'Cập nhật thất bại' }; }
  return { ok: true };
}
