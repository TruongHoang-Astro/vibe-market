// app/page.tsx — Server Component: fetch dữ liệu catalog từ Supabase rồi
// truyền xuống HomeClient (Client Component giữ toàn bộ UI/animation).
import HomeClient from './HomeClient';
import {
  getProducts,
  getCategories,
  getFlashSaleProducts,
  getRecentReviews,
} from '@/lib/supabase/queries';

export default async function HomePage() {
  const [products, categories, flashSaleProducts, reviews] = await Promise.all([
    getProducts(),
    getCategories(),
    getFlashSaleProducts(),
    getRecentReviews(3),
  ]);

  return (
    <HomeClient
      products={products}
      categories={categories}
      flashSaleProducts={flashSaleProducts}
      reviews={reviews}
    />
  );
}
