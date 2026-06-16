'use server';
// Bọc DAL cho client gọi: sản phẩm đã xem + gợi ý "Dành cho bạn".
import { getProductsByIds, getRecommendations } from '@/lib/supabase/queries';
import type { Product } from '@/lib/data/mock-data';

export async function fetchRecentProducts(ids: string[]): Promise<Product[]> {
  return getProductsByIds(ids.slice(0, 12));
}

export async function fetchRecommendations(viewedIds: string[]): Promise<Product[]> {
  return getRecommendations(viewedIds.slice(0, 12), 10);
}
