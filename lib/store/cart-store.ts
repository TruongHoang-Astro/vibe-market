// lib/store/cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  size?: string;
  shopId: string;
  shopName: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const id = `${item.productId}-${item.color || ''}-${item.size || ''}`;
        const existingItem = get().items.find(i => i.id === id);
        if (existingItem) {
          set(state => ({
            items: state.items.map(i =>
              i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          }));
        } else {
          set(state => ({ items: [...state.items, { ...item, id }] }));
        }
      },

      removeItem: (id) => {
        set(state => ({ items: state.items.filter(i => i.id !== id) }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set(state => ({
          items: state.items.map(i => i.id === id ? { ...i, quantity } : i),
        }));
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set(state => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      getTotalPrice: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    { name: 'vibe-cart' }
  )
);
