'use server';
// Server Action tạo đơn hàng — chạy phía server, có session qua cookie.
// Tính tổng tiền phía server (không tin client), RLS đảm bảo chỉ tạo đơn cho chính mình.
import { createClient } from '@/lib/supabase/server';

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

  return { orderId: order.id };
}
