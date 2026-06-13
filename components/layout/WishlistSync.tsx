'use client';
// Đồng bộ wishlist với DB theo trạng thái đăng nhập:
// - Đăng nhập: đẩy wishlist khách (local) lên DB rồi tải lại từ DB.
// - Đăng xuất: xoá wishlist khỏi UI (chỉ local, không đụng DB).
import { useEffect, useRef } from 'react';
import { useUser } from '@/lib/supabase/use-user';
import { useWishlistStore } from '@/lib/store/wishlist-store';

export default function WishlistSync() {
  const { user } = useUser();
  const prevUid = useRef<string | null>(null);

  useEffect(() => {
    const uid = user?.id ?? null;
    if (uid && uid !== prevUid.current) {
      // vừa đăng nhập (hoặc đổi tài khoản)
      const store = useWishlistStore.getState();
      store.mergeLocalToDb().finally(() => store.loadFromDb());
    } else if (!uid && prevUid.current) {
      // vừa đăng xuất
      useWishlistStore.getState().clearLocal();
    }
    prevUid.current = uid;
  }, [user]);

  return null;
}
