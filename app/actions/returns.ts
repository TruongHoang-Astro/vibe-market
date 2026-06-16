'use server';
// Yêu cầu trả hàng / hoàn tiền. Buyer tạo; seller (chủ shop) duyệt/từ chối.
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notify';

export interface ReturnInput {
  orderId: string;
  reason: string;
  detail?: string;
  images?: string[];
}

export async function createReturnRequest(input: ReturnInput): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập' };
  if (!input.reason?.trim()) return { error: 'Vui lòng chọn lý do trả hàng' };

  const { data: order } = await supabase
    .from('orders').select('id, user_id, status').eq('id', input.orderId).maybeSingle();
  if (!order || order.user_id !== user.id) return { error: 'Không tìm thấy đơn hàng' };
  if (order.status !== 'delivered' && order.status !== 'shipping') {
    return { error: 'Chỉ trả hàng khi đơn đang giao hoặc đã giao' };
  }

  // Chặn trùng yêu cầu đang mở
  const { data: existing } = await supabase
    .from('return_requests').select('id').eq('order_id', input.orderId).eq('status', 'pending').maybeSingle();
  if (existing) return { error: 'Đơn này đã có yêu cầu trả hàng đang xử lý' };

  const { error } = await supabase.from('return_requests').insert({
    order_id: input.orderId, user_id: user.id,
    reason: input.reason.trim(), detail: (input.detail ?? '').slice(0, 1000),
    images: input.images && input.images.length ? input.images : null,
  });
  if (error) { console.error('createReturnRequest:', error.message); return { error: 'Gửi yêu cầu thất bại' }; }

  // Thông báo chủ shop
  try {
    const admin = createAdminClient();
    const { data: items } = await admin.from('order_items').select('product_id').eq('order_id', input.orderId);
    const ids = [...new Set((items ?? []).map((i) => i.product_id).filter((x): x is string => !!x))];
    if (ids.length) {
      const { data: prods } = await admin.from('products').select('shop_id').in('id', ids);
      const shopIds = [...new Set((prods ?? []).map((p) => p.shop_id))];
      const { data: shops } = await admin.from('shops').select('owner_id').in('id', shopIds);
      const owners = [...new Set((shops ?? []).map((s) => s.owner_id).filter((o): o is string => !!o))];
      await Promise.all(owners.map((o) => createNotification(admin, {
        userId: o, type: 'order', title: 'Yêu cầu trả hàng mới',
        message: `Đơn ${input.orderId} có yêu cầu trả hàng/hoàn tiền.`, link: '/seller/dashboard',
      })));
    }
  } catch (e) { console.error('createReturnRequest (notif):', e); }

  return { ok: true };
}

export interface ShopReturn {
  id: string;
  orderId: string;
  reason: string;
  detail: string;
  images: string[];
  status: string;
  date: string;
  buyerId: string;
}

// Seller: danh sách yêu cầu trả hàng cho đơn chứa sản phẩm của shop mình.
export async function getShopReturns(): Promise<{ returns: ShopReturn[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { returns: [], error: 'unauth' };
  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).maybeSingle();
  if (!shop) return { returns: [], error: 'Bạn chưa có gian hàng' };

  const admin = createAdminClient();
  const { data: prods } = await admin.from('products').select('id').eq('shop_id', shop.id);
  const ids = (prods ?? []).map((p) => p.id);
  if (!ids.length) return { returns: [] };

  const { data: items } = await admin.from('order_items').select('order_id').in('product_id', ids);
  const orderIds = [...new Set((items ?? []).map((i) => i.order_id))];
  if (!orderIds.length) return { returns: [] };

  const { data, error } = await admin
    .from('return_requests').select('*').in('order_id', orderIds).order('created_at', { ascending: false });
  if (error) { console.error('getShopReturns:', error.message); return { returns: [], error: 'Không tải được' }; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const returns: ShopReturn[] = ((data ?? []) as any[]).map((r) => ({
    id: r.id, orderId: r.order_id, reason: r.reason, detail: r.detail ?? '',
    images: r.images ?? [], status: r.status, date: r.created_at, buyerId: r.user_id,
  }));
  return { returns };
}

export async function resolveReturn(id: string, status: 'approved' | 'rejected'): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập' };
  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).maybeSingle();
  if (!shop) return { error: 'Bạn chưa có gian hàng' };

  const admin = createAdminClient();
  // Xác minh yêu cầu thuộc đơn có sản phẩm của shop
  const { data: req } = await admin.from('return_requests').select('id, order_id, user_id').eq('id', id).maybeSingle();
  if (!req) return { error: 'Không tìm thấy yêu cầu' };
  const { data: shopProds } = await admin.from('products').select('id').eq('shop_id', shop.id);
  const pids = (shopProds ?? []).map((p) => p.id);
  const { data: match } = await admin.from('order_items').select('order_id').eq('order_id', req.order_id).in('product_id', pids).limit(1);
  if (!match || !match.length) return { error: 'Yêu cầu không thuộc shop của bạn' };

  const { error } = await admin.from('return_requests').update({ status }).eq('id', id);
  if (error) { console.error('resolveReturn:', error.message); return { error: 'Cập nhật thất bại' }; }

  // Nếu duyệt → đánh dấu đơn đã hủy (hoàn kho qua trigger) + thông báo buyer
  if (status === 'approved') {
    await admin.from('orders').update({ status: 'cancelled' }).eq('id', req.order_id);
    // payment_status='refunded' (best-effort — cột có thể chưa tồn tại nếu chưa chạy payment.sql)
    try { await admin.from('orders').update({ payment_status: 'refunded' }).eq('id', req.order_id); } catch { /* bỏ qua */ }
  }
  await createNotification(admin, {
    userId: req.user_id, type: 'order',
    title: status === 'approved' ? 'Yêu cầu trả hàng được chấp nhận ✅' : 'Yêu cầu trả hàng bị từ chối',
    message: status === 'approved'
      ? `Đơn ${req.order_id} đã được duyệt trả hàng/hoàn tiền.`
      : `Yêu cầu trả hàng đơn ${req.order_id} đã bị từ chối. Liên hệ shop để biết thêm.`,
    link: '/orders',
  });
  return { ok: true };
}
