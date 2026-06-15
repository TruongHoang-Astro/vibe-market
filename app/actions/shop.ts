'use server';
// Theo dõi / bỏ theo dõi gian hàng (lưu DB thật; followers tự cập nhật qua trigger).
import { createClient } from '@/lib/supabase/server';

export async function toggleFollowShop(shopId: string): Promise<{ following?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập để theo dõi shop' };

  const { data: existing } = await supabase
    .from('shop_follows').select('id').eq('user_id', user.id).eq('shop_id', shopId).maybeSingle();

  if (existing) {
    const { error } = await supabase.from('shop_follows').delete().eq('id', existing.id);
    if (error) { console.error('unfollow:', error.message); return { error: 'Thao tác thất bại' }; }
    return { following: false };
  }
  const { error } = await supabase.from('shop_follows').insert({ user_id: user.id, shop_id: shopId });
  if (error) { console.error('follow:', error.message); return { error: 'Thao tác thất bại' }; }
  return { following: true };
}
