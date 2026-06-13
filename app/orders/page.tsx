// app/orders/page.tsx — Server Component: lấy đơn hàng của user đang đăng nhập từ DB.
import { createClient } from '@/lib/supabase/server';
import { getMyOrders } from '@/lib/supabase/queries';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orders = user ? await getMyOrders() : [];
  return <OrdersClient orders={orders} loggedIn={!!user} />;
}
