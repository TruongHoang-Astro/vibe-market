// app/products/page.tsx — Server Component.
// Có ?search= → dùng full-text search phía server (lib/supabase/queries.searchProducts).
// Không → lấy toàn bộ sản phẩm. Bộ lọc nâng cao chạy tiếp phía client trong ProductsClient.
import ProductsClient from './ProductsClient';
import { getProducts, getCategories, searchProducts } from '@/lib/supabase/queries';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const term = (sp.search ?? '').trim();

  const [allProducts, categories] = await Promise.all([
    term ? searchProducts(term, { limit: 120 }) : getProducts(),
    getCategories(),
  ]);

  return <ProductsClient allProducts={allProducts} categories={categories} searchTerm={term} />;
}
