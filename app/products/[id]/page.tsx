import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById, getRelatedProducts, getReviewsByProduct } from '@/lib/supabase/queries';
import ProductDetailClient from './ProductDetailClient';

// SEO động: mỗi sản phẩm có title / description / og riêng (đọc từ DB)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: 'Sản phẩm không tồn tại — Vibe Market' };
  return {
    title: `${product.name} — Vibe Market`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image, width: 500, height: 500, alt: product.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  };
}

// Server Component — fetch dữ liệu từ Supabase rồi truyền xuống Client Component
export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const [relatedProducts, productReviews] = await Promise.all([
    getRelatedProducts(product.category, product.id, 4),
    getReviewsByProduct(product.id),
  ]);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      productReviews={productReviews}
    />
  );
}
