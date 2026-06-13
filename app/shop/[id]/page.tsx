// app/shop/[id]/page.tsx — Server Component: fetch shop + sản phẩm của shop từ DB.
import { notFound } from 'next/navigation';
import { getShopById, getProductsByShop } from '@/lib/supabase/queries';
import ShopClient from '../ShopClient';

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await getShopById(id);
  if (!shop) notFound();

  const shopProducts = await getProductsByShop(shop.id);

  return <ShopClient shop={shop} shopProducts={shopProducts} />;
}
