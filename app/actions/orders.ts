'use server';
// Server Action tạo đơn hàng — chạy phía server, có session qua cookie.
// Tính tổng tiền phía server (không tin client), RLS đảm bảo chỉ tạo đơn cho chính mình.
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notify';
import { computeShippingFee } from '@/lib/shipping';
import { validateVoucher } from './voucher';

export interface NewOrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image: string;
}

export interface NewOrderPayload {
  items: NewOrderItem[];
  address: string;
  shippingMethod: string;                 // standard | express | same-day
  paymentProvider: 'cod' | 'vnpay';       // online (vnpay) hay COD
  voucherCode?: string;                   // mã giảm giá (re-validate phía server)
}

export async function createOrder(
  payload: NewOrderPayload,
): Promise<{ orderId?: string; paymentProvider?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập để đặt hàng' };
  if (!payload.items?.length) return { error: 'Giỏ hàng đang trống' };

  // Tính tiền phía server — KHÔNG tin số từ client (cả phí ship lẫn giảm giá)
  const subtotal = payload.items.reduce((s, it) => s + it.price * it.qty, 0);
  const shippingFee = computeShippingFee(payload.shippingMethod, subtotal);

  // Voucher: re-validate phía server (bỏ qua nếu chưa chạy voucher.sql)
  let discount = 0;
  let voucherCode: string | null = null;
  if (payload.voucherCode) {
    try {
      const admin0 = createAdminClient();
      const { data: prodShops } = await admin0.from('products').select('shop_id').in('id', payload.items.map((i) => i.productId));
      const shopIds = [...new Set((prodShops ?? []).map((p) => p.shop_id))];
      const { voucher } = await validateVoucher(payload.voucherCode, subtotal, shopIds);
      if (voucher) { discount = voucher.discount; voucherCode = voucher.code; }
    } catch (e) { console.error('createOrder (voucher):', e); }
  }

  const total = Math.max(0, subtotal + shippingFee - discount);

  const isOnline = payload.paymentProvider === 'vnpay';
  const paymentLabel = isOnline ? 'VNPay' : 'COD';

  const baseRow = {
    user_id: user.id,
    total,
    status: 'pending' as const,
    address: payload.address,
    payment_method: paymentLabel,
  };
  // Thử insert kèm cột vận chuyển/thanh toán/voucher (payment.sql + voucher.sql); chưa migrate → fallback base.
  let { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      ...baseRow,
      shipping_method: payload.shippingMethod,
      shipping_fee: shippingFee,
      payment_provider: isOnline ? 'vnpay' : 'cod',
      payment_status: isOnline ? 'pending' : 'unpaid',
      voucher_code: voucherCode,
      discount,
    })
    .select('id')
    .single();
  if (orderErr) {
    ({ data: order, error: orderErr } = await supabase.from('orders').insert(baseRow).select('id').single());
  }
  if (orderErr || !order) {
    console.error('createOrder (order):', orderErr?.message);
    return { error: 'Không tạo được đơn hàng, vui lòng thử lại' };
  }

  // Tăng lượt dùng voucher (best-effort)
  if (voucherCode) {
    try {
      const admin = createAdminClient();
      const { data: vrow } = await admin.from('vouchers').select('id, used_count').ilike('code', voucherCode).maybeSingle();
      if (vrow) await admin.from('vouchers').update({ used_count: vrow.used_count + 1 }).eq('id', vrow.id);
    } catch (e) { console.error('createOrder (voucher count):', e); }
  }

  const rows = payload.items.map((it) => ({
    order_id: order.id,
    product_id: it.productId,
    name: it.name,
    qty: it.qty,
    price: it.price,
    image: it.image,
  }));
  const { error: itemsErr } = await supabase.from('order_items').insert(rows);
  if (itemsErr) {
    console.error('createOrder (items):', itemsErr.message);
    return { error: 'Không lưu được sản phẩm trong đơn' };
  }

  // Thông báo (best-effort) — in-app + email (Resend nếu đã cấu hình env)
  try {
    const admin = createAdminClient();
    await createNotification(admin, {
      userId: user.id, type: 'order',
      title: 'Đặt hàng thành công 🎉',
      message: `Đơn ${order.id} đã được tạo. Cảm ơn bạn đã mua sắm!`,
      link: '/orders',
    });
    // Thông báo cho chủ các shop có sản phẩm trong đơn
    const { data: prods } = await admin.from('products').select('shop_id').in('id', payload.items.map(i => i.productId));
    const shopIds = [...new Set((prods ?? []).map(p => p.shop_id))];
    if (shopIds.length) {
      const { data: shops } = await admin.from('shops').select('owner_id').in('id', shopIds);
      const owners = [...new Set((shops ?? []).map(s => s.owner_id).filter((o): o is string => !!o))];
      await Promise.all(owners.map(o => createNotification(admin, {
        userId: o, type: 'order',
        title: 'Đơn hàng mới! 🛍️',
        message: `Bạn có đơn hàng mới ${order.id}`,
        link: '/seller/dashboard',
      })));
    }
  } catch (e) {
    console.error('createOrder (notif):', e);
  }

  return { orderId: order.id, paymentProvider: isOnline ? 'vnpay' : 'cod' };
}

// ---------- Buyer hủy đơn (chỉ khi chưa giao) ----------
export async function cancelOrder(orderId: string): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập' };

  const { data: order } = await supabase
    .from('orders').select('id, user_id, status').eq('id', orderId).maybeSingle();
  if (!order || order.user_id !== user.id) return { error: 'Không tìm thấy đơn hàng' };
  if (order.status !== 'pending' && order.status !== 'confirmed') {
    return { error: 'Chỉ có thể hủy đơn đang chờ xác nhận hoặc đã xác nhận' };
  }

  // Cập nhật qua admin (RLS orders không cho buyer update). Trigger sẽ hoàn kho.
  const admin = createAdminClient();
  const { error } = await admin.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
  if (error) { console.error('cancelOrder:', error.message); return { error: 'Hủy đơn thất bại' }; }

  // Thông báo chủ shop có sản phẩm trong đơn (best-effort)
  try {
    const { data: items } = await admin.from('order_items').select('product_id').eq('order_id', orderId);
    const ids = [...new Set((items ?? []).map((i) => i.product_id).filter((x): x is string => !!x))];
    if (ids.length) {
      const { data: prods } = await admin.from('products').select('shop_id').in('id', ids);
      const shopIds = [...new Set((prods ?? []).map((p) => p.shop_id))];
      const { data: shops } = await admin.from('shops').select('owner_id').in('id', shopIds);
      const owners = [...new Set((shops ?? []).map((s) => s.owner_id).filter((o): o is string => !!o))];
      await Promise.all(owners.map((o) => createNotification(admin, {
        userId: o, type: 'order', title: 'Đơn hàng bị hủy',
        message: `Khách đã hủy đơn ${orderId}.`, link: '/seller/dashboard',
      })));
    }
  } catch (e) { console.error('cancelOrder (notif):', e); }

  return { ok: true };
}
