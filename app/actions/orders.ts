'use server';
// Server Action tạo đơn hàng — chạy phía server, có session qua cookie.
// Tính tổng tiền phía server (không tin client), RLS đảm bảo chỉ tạo đơn cho chính mình.
import { createClient, createAdminClient } from '@/lib/supabase/server';

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
  paymentMethod: string;
  shippingFee: number;
}

export async function createOrder(
  payload: NewOrderPayload,
): Promise<{ orderId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập để đặt hàng' };
  if (!payload.items?.length) return { error: 'Giỏ hàng đang trống' };

  // Tính tổng phía server — không dùng số tiền client gửi lên
  const subtotal = payload.items.reduce((s, it) => s + it.price * it.qty, 0);
  const total = subtotal + (payload.shippingFee || 0);

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total,
      status: 'pending',
      address: payload.address,
      payment_method: payload.paymentMethod,
    })
    .select('id')
    .single();
  if (orderErr || !order) {
    console.error('createOrder (order):', orderErr?.message);
    return { error: 'Không tạo được đơn hàng, vui lòng thử lại' };
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

  // Thông báo (best-effort, dùng admin để gửi cho cả người mua lẫn chủ shop)
  try {
    const admin = createAdminClient();
    await admin.from('notifications').insert({
      user_id: user.id, type: 'order',
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
      if (owners.length) {
        await admin.from('notifications').insert(owners.map(o => ({
          user_id: o, type: 'order',
          title: 'Đơn hàng mới! 🛍️',
          message: `Bạn có đơn hàng mới ${order.id}`,
          link: '/seller/dashboard',
        })));
      }
    }
  } catch (e) {
    console.error('createOrder (notif):', e);
  }

  return { orderId: order.id };
}
