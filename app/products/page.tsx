// app/products/page.tsx — Server Component: fetch toàn bộ sản phẩm + danh mục,
// truyền xuống ProductsClient (lọc/sắp xếp/phân trang phía client).
import ProductsClient from './ProductsClient';
import { getProducts, getCategories } from '@/lib/supabase/queries';

export default async function ProductsPage() {
  const [allProducts, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return <ProductsClient allProducts={allProducts} categories={categories} />;
}
