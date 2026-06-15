// app/shop/[id]/page.tsx — Server Component: fetch shop + sản phẩm + đánh giá thật từ DB.
import { notFound } from 'next/navigation';
import { getShopById, getProductsByShop, getShopReviews } from '@/lib/supabase/queries';
import ShopClient from '../ShopClient';

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await getShopById(id);
  if (!shop) notFound();

  const [shopProducts, { reviews, total }] = await Promise.all([
    getProductsByShop(shop.id),
    getShopReviews(shop.id),
  ]);

  return <ShopClient shop={shop} shopProducts={shopProducts} shopReviews={reviews} reviewTotal={total} />;
}
