// lib/supabase/queries.ts
// Data Access Layer — đọc catalog từ Supabase, map snake_case (DB) → camelCase
// (interface frontend) để các component hiện có không phải đổi.
// Dùng trong Server Components / generateMetadata. cache() để gộp truy vấn trùng
// trong cùng một request.
import { cache } from 'react';
import { createClient } from './server';
import type { Product, Shop, Review, Category, Order } from '@/lib/data/mock-data';

// ---- Kiểu row thô từ DB (có join shops.name) ----
type ProductRow = {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  original_price: number;
  image: string;
  images: string[] | null;
  category: string;
  subcategory: string | null;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  description: string;
  badge: Product['badge'] | null;
  colors: string[] | null;
  sizes: string[] | null;
  is_flash_sale: boolean;
  flash_sale_price: number | null;
  shops?: { name: string } | null;
};

const PRODUCT_SELECT =
  'id, shop_id, name, price, original_price, image, images, category, subcategory, rating, reviews, sold, stock, description, badge, colors, sizes, is_flash_sale, flash_sale_price, shops(name)';

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    image: row.image,
    images: row.images ?? [],
    category: row.category,
    subcategory: row.subcategory ?? '',
    rating: Number(row.rating),
    reviews: row.reviews,
    sold: row.sold,
    stock: row.stock,
    shopId: row.shop_id,
    shopName: row.shops?.name ?? '',
    description: row.description,
    badge: row.badge ?? undefined,
    colors: row.colors ?? undefined,
    sizes: row.sizes ?? undefined,
    isFlashSale: row.is_flash_sale,
    flashSalePrice: row.flash_sale_price != null ? Number(row.flash_sale_price) : undefined,
  };
}

function mapShop(row: Record<string, unknown>): Shop {
  return {
    id: row.id as string,
    name: row.name as string,
    logo: row.logo as string,
    banner: row.banner as string,
    rating: Number(row.rating),
    followers: row.followers as number,
    products: row.products as number,
    responseRate: row.response_rate as number,
    responseTime: row.response_time as string,
    joinedDate: row.joined_date as string,
    description: row.description as string,
    category: row.category as string,
    verified: row.verified as boolean,
  };
}

function mapReview(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    userId: (row.user_id as string) ?? '',
    userName: row.user_name as string,
    avatar: (row.avatar as string) ?? '',
    rating: row.rating as number,
    comment: row.comment as string,
    date: row.created_at as string,
    productId: row.product_id as string,
    images: (row.images as string[]) ?? undefined,
  };
}

// ---------- Products ----------
export const getProducts = cache(async (): Promise<Product[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .order('sold', { ascending: false });
  if (error) {
    console.error('getProducts:', error.message);
    return [];
  }
  return (data as unknown as ProductRow[]).map(mapProduct);
});

export const getProductById = cache(async (id: string): Promise<Product | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('getProductById:', error.message);
    return null;
  }
  return data ? mapProduct(data as unknown as ProductRow) : null;
});

export const getFlashSaleProducts = cache(async (): Promise<Product[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_flash_sale', true)
    .order('sold', { ascending: false });
  if (error) {
    console.error('getFlashSaleProducts:', error.message);
    return [];
  }
  return (data as unknown as ProductRow[]).map(mapProduct);
});

export const getProductsByShop = cache(async (shopId: string): Promise<Product[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('shop_id', shopId)
    .order('sold', { ascending: false });
  if (error) {
    console.error('getProductsByShop:', error.message);
    return [];
  }
  return (data as unknown as ProductRow[]).map(mapProduct);
});

export const getRelatedProducts = cache(
  async (category: string, excludeId: string, limit = 4): Promise<Product[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('category', category)
      .neq('id', excludeId)
      .limit(limit);
    if (error) {
      console.error('getRelatedProducts:', error.message);
      return [];
    }
    return (data as unknown as ProductRow[]).map(mapProduct);
  },
);

// ---------- Categories ----------
export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('id');
  if (error) {
    console.error('getCategories:', error.message);
    return [];
  }
  return (data ?? []) as Category[];
});

// ---------- Shops ----------
export const getShopById = cache(async (id: string): Promise<Shop | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('getShopById:', error.message);
    return null;
  }
  return data ? mapShop(data) : null;
});

// ---------- Reviews ----------
export const getReviewsByProduct = cache(async (productId: string): Promise<Review[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getReviewsByProduct:', error.message);
    return [];
  }
  return (data ?? []).map(mapReview);
});

export const getRecentReviews = cache(async (limit = 3): Promise<Review[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('getRecentReviews:', error.message);
    return [];
  }
  return (data ?? []).map(mapReview);
});

// ---------- Orders (đơn của user đang đăng nhập, RLS lọc tự động) ----------
export async function getMyOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('id, total, status, address, payment_method, created_at, order_items(product_id, name, qty, price, image)')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getMyOrders:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((o) => ({
    id: o.id,
    userId: user.id,
    total: Number(o.total),
    status: o.status,
    date: o.created_at,
    address: o.address,
    paymentMethod: o.payment_method,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products: (o.order_items ?? []).map((it: any) => ({
      productId: it.product_id,
      name: it.name,
      qty: it.qty,
      price: Number(it.price),
      image: it.image,
    })),
  }));
}
