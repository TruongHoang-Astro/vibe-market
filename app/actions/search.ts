'use server';
// Gợi ý tìm kiếm (autocomplete) cho Navbar — dùng full-text phía server.
import { searchProducts } from '@/lib/supabase/queries';

export interface Suggestion {
  id: string;
  name: string;
  image: string;
  price: number;
  shopName: string;
}

export async function searchSuggestions(q: string): Promise<Suggestion[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const results = await searchProducts(query, { limit: 6 });
  return results.map((p) => ({
    id: p.id,
    name: p.name,
    image: p.image,
    price: p.price,
    shopName: p.shopName,
  }));
}
