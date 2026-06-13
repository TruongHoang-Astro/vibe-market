// lib/store/wishlist-store.ts
// Wishlist: UI dùng Zustand (optimistic, cache localStorage cho khách).
// Khi đã đăng nhập → đồng bộ DB (write-through add/remove, hydrate khi login).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  shopName: string;
  rating: number;
  sold: number;
  badge?: string;
  addedAt: number; // timestamp
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
  isWished: (productId: string) => boolean;
  clear: () => void;          // xoá tất cả (local + DB nếu đã đăng nhập)
  clearLocal: () => void;     // dùng khi đăng xuất — chỉ xoá local
  loadFromDb: () => Promise<void>;     // hydrate từ DB khi đăng nhập
  mergeLocalToDb: () => Promise<void>; // đẩy wishlist khách lên DB khi đăng nhập
}

async function getUid(): Promise<string | null> {
  const { data } = await createClient().auth.getUser();
  return data.user?.id ?? null;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        if (get().isWished(item.productId)) return;
        set(state => ({ items: [{ ...item, addedAt: Date.now() }, ...state.items] }));
        // write-through DB (chỉ khi đã đăng nhập)
        void (async () => {
          const uid = await getUid();
          if (!uid) return;
          await createClient()
            .from('wishlists')
            .upsert({ user_id: uid, product_id: item.productId }, { onConflict: 'user_id,product_id', ignoreDuplicates: true });
        })();
      },

      removeItem: (productId) => {
        set(state => ({ items: state.items.filter(i => i.productId !== productId) }));
        void (async () => {
          const uid = await getUid();
          if (!uid) return;
          await createClient().from('wishlists').delete().eq('user_id', uid).eq('product_id', productId);
        })();
      },

      toggleItem: (item) => {
        if (get().isWished(item.productId)) get().removeItem(item.productId);
        else get().addItem(item);
      },

      isWished: (productId) => get().items.some(i => i.productId === productId),

      clear: () => {
        set({ items: [] });
        void (async () => {
          const uid = await getUid();
          if (!uid) return;
          await createClient().from('wishlists').delete().eq('user_id', uid);
        })();
      },

      clearLocal: () => set({ items: [] }),

      loadFromDb: async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from('wishlists')
          .select('product_id, created_at, products(name, price, original_price, image, rating, sold, badge, shops(name))')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('wishlist loadFromDb:', error.message);
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: WishlistItem[] = ((data ?? []) as any[]).map((r) => ({
          productId: r.product_id,
          name: r.products?.name ?? '',
          price: Number(r.products?.price ?? 0),
          originalPrice: Number(r.products?.original_price ?? 0),
          image: r.products?.image ?? '',
          shopName: r.products?.shops?.name ?? '',
          rating: Number(r.products?.rating ?? 0),
          sold: r.products?.sold ?? 0,
          badge: r.products?.badge ?? undefined,
          addedAt: new Date(r.created_at).getTime(),
        }));
        set({ items });
      },

      mergeLocalToDb: async () => {
        const local = get().items;
        if (!local.length) return;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const rows = local.map(i => ({ user_id: user.id, product_id: i.productId }));
        await supabase.from('wishlists').upsert(rows, { onConflict: 'user_id,product_id', ignoreDuplicates: true });
      },
    }),
    { name: 'vibe-wishlist' }
  )
);
