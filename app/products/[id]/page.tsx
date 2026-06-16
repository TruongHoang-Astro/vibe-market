import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById, getRelatedProducts, getReviewsByProduct, getProductQuestions } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/server';
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

  const [relatedProducts, productReviews, questions] = await Promise.all([
    getRelatedProducts(product.category, product.id, 4),
    getReviewsByProduct(product.id),
    getProductQuestions(product.id),
  ]);

  // Người xem có phải chủ shop của sản phẩm? (để hiện ô trả lời Q&A)
  let isShopOwner = false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: shop } = await supabase.from('shops').select('owner_id').eq('id', product.shopId).maybeSingle();
    isShopOwner = shop?.owner_id === user.id;
  }

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      productReviews={productReviews}
      questions={questions}
      isShopOwner={isShopOwner}
    />
  );
}
