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
  size_guide?: { size: string; value: string }[] | null;
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
    sizeGuide: Array.isArray(row.size_guide) && row.size_guide.length > 0 ? row.size_guide : undefined,
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
    // Cột tùy chỉnh/chính sách — chỉ có sau khi chạy shop_custom.sql (resilient)
    themeColor: (row.theme_color as string) || undefined,
    announcement: (row.announcement as string) || undefined,
    returnPolicy: (row.return_policy as string) || undefined,
    shippingPolicy: (row.shipping_policy as string) || undefined,
    warrantyPolicy: (row.warranty_policy as string) || undefined,
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
  if (!data) return null;
  const productObj = mapProduct(data as unknown as ProductRow);
  // Lấy size_guide riêng (cột mới — nếu chưa chạy sizeguide.sql thì bỏ qua, không vỡ trang)
  const { data: sg } = await supabase.from('products').select('size_guide').eq('id', id).maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guide = (sg as any)?.size_guide;
  if (Array.isArray(guide) && guide.length > 0) productObj.sizeGuide = guide;
  // Biến thể (nếu chưa chạy variants.sql → bảng không tồn tại, bỏ qua)
  const { data: vrs } = await supabase.from('product_variants').select('id, name, price, stock').eq('product_id', id).order('created_at');
  if (Array.isArray(vrs) && vrs.length > 0) {
    productObj.variants = vrs.map((v) => ({ id: v.id as string, name: v.name as string, price: Number(v.price), stock: v.stock as number }));
  }
  return productObj;
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
  const products = (data as unknown as ProductRow[]).map(mapProduct);
  // Gắn flash_sale_end (cột mới — nếu chưa chạy flashsale.sql thì bỏ qua)
  const ids = products.map((p) => p.id);
  if (ids.length) {
    const { data: ends } = await supabase.from('products').select('id, flash_sale_end').in('id', ids);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map((ends ?? []).map((e: any) => [e.id as string, e.flash_sale_end as string | null]));
    for (const p of products) { const e = map.get(p.id); if (e) p.flashSaleEnd = e; }
  }
  return products;
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

// Sản phẩm theo danh sách id (giữ đúng thứ tự input) — cho "Đã xem gần đây".
export const getProductsByIds = cache(async (ids: string[]): Promise<Product[]> => {
  if (!ids.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).in('id', ids);
  if (error) { console.error('getProductsByIds:', error.message); return []; }
  const products = (data as unknown as ProductRow[]).map(mapProduct);
  const order = new Map(ids.map((id, i) => [id, i]));
  return products.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
});

// Gợi ý "Dành cho bạn": ưu tiên danh mục đã xem; nếu chưa xem gì → phổ biến nhất.
export const getRecommendations = cache(async (viewedIds: string[], limit = 8): Promise<Product[]> => {
  const supabase = await createClient();
  let query = supabase.from('products').select(PRODUCT_SELECT).order('sold', { ascending: false });
  if (viewedIds.length) {
    const { data: cats } = await supabase.from('products').select('category').in('id', viewedIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories = [...new Set((cats ?? []).map((c: any) => c.category))];
    if (categories.length) query = query.in('category', categories);
  }
  const { data, error } = await query.limit(limit + viewedIds.length);
  if (error) { console.error('getRecommendations:', error.message); return []; }
  return (data as unknown as ProductRow[]).map(mapProduct).filter((p) => !viewedIds.includes(p.id)).slice(0, limit);
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

// ---------- Full-text search ----------
// Bỏ dấu tiếng Việt để khớp cột search_vector (build bằng unaccent).
function deaccentVi(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// "áo thun" → "ao & thun:*" (prefix ở token cuối cho gợi ý gõ dở).
function toTsPrefixQuery(q: string): string {
  const tokens = deaccentVi(q)
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);
  if (!tokens.length) return '';
  return tokens.map((t, i) => (i === tokens.length - 1 ? `${t}:*` : t)).join(' & ');
}

export interface SearchOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
  limit?: number;
}

export async function searchProducts(query: string, opts: SearchOptions = {}): Promise<Product[]> {
  const supabase = await createClient();
  const limit = opts.limit ?? 60;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (qb: any) => {
    if (opts.category && opts.category !== 'Tất cả') qb = qb.eq('category', opts.category);
    if (opts.minPrice != null) qb = qb.gte('price', opts.minPrice);
    if (opts.maxPrice != null && Number.isFinite(opts.maxPrice)) qb = qb.lte('price', opts.maxPrice);
    if (opts.minRating != null) qb = qb.gte('rating', opts.minRating);
    switch (opts.sort) {
      case 'price-asc': qb = qb.order('price', { ascending: true }); break;
      case 'price-desc': qb = qb.order('price', { ascending: false }); break;
      case 'rating': qb = qb.order('rating', { ascending: false }); break;
      case 'newest': qb = qb.order('created_at', { ascending: false }); break;
      default: qb = qb.order('sold', { ascending: false });
    }
    return qb.limit(limit);
  };

  // 1) Full-text (cần search.sql đã chạy)
  const tsq = toTsPrefixQuery(query);
  if (tsq) {
    const base = supabase.from('products').select(PRODUCT_SELECT)
      .textSearch('search_vector', tsq, { config: 'simple' });
    const { data, error } = await applyFilters(base);
    if (!error) return (data as unknown as ProductRow[]).map(mapProduct);
    console.error('searchProducts (fts → fallback ilike):', error.message);
  }

  // 2) Fallback ilike (không cần migration; an toàn nếu cột chưa tồn tại)
  const base = supabase.from('products').select(PRODUCT_SELECT);
  const term = query.replace(/[,%()]/g, ' ').trim();
  const qb = term ? base.or(`name.ilike.%${term}%,description.ilike.%${term}%`) : base;
  const { data, error } = await applyFilters(qb);
  if (error) { console.error('searchProducts (ilike):', error.message); return []; }
  return (data as unknown as ProductRow[]).map(mapProduct);
}

// ---------- Hỏi đáp sản phẩm ----------
export interface ProductQuestion {
  id: string;
  askerName: string;
  question: string;
  answer: string | null;
  date: string;
}
export const getProductQuestions = cache(async (productId: string): Promise<ProductQuestion[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_questions')
    .select('id, asker_name, question, answer, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getProductQuestions:', error.message); return []; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((q: any) => ({ id: q.id, askerName: q.asker_name, question: q.question, answer: q.answer, date: q.created_at }));
});

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

// Đánh giá thật của 1 shop = đánh giá trên tất cả sản phẩm của shop đó.
export const getShopReviews = cache(async (shopId: string, limit = 30): Promise<{ reviews: Review[]; total: number }> => {
  const supabase = await createClient();
  const { data: prods } = await supabase.from('products').select('id').eq('shop_id', shopId);
  const ids = (prods ?? []).map((p) => p.id);
  if (!ids.length) return { reviews: [], total: 0 };
  const [{ data, error }, { count }] = await Promise.all([
    supabase.from('reviews').select('*').in('product_id', ids).order('created_at', { ascending: false }).limit(limit),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).in('product_id', ids),
  ]);
  if (error) { console.error('getShopReviews:', error.message); return { reviews: [], total: 0 }; }
  return { reviews: (data ?? []).map(mapReview), total: count ?? 0 };
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

  const ITEMS = 'order_items(product_id, name, qty, price, image)';
  // Thử kèm cột thanh toán (payment.sql); nếu chưa chạy migration → fallback select cơ bản.
  const full = await supabase
    .from('orders')
    .select(`id, total, status, address, payment_method, payment_provider, payment_status, shipping_fee, created_at, ${ITEMS}`)
    .order('created_at', { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any[] | null = full.data as any;
  let error = full.error;
  if (error) {
    const base = await supabase
      .from('orders')
      .select(`id, total, status, address, payment_method, created_at, ${ITEMS}`)
      .order('created_at', { ascending: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data = base.data as any;
    error = base.error;
  }
  if (error) {
    console.error('getMyOrders:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders: Order[] = ((data ?? []) as any[]).map((o) => ({
    id: o.id,
    userId: user.id,
    total: Number(o.total),
    status: o.status,
    date: o.created_at,
    address: o.address,
    paymentMethod: o.payment_method,
    shippingFee: o.shipping_fee != null ? Number(o.shipping_fee) : undefined,
    paymentProvider: o.payment_provider ?? undefined,
    paymentStatus: o.payment_status ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products: (o.order_items ?? []).map((it: any) => ({
      productId: it.product_id,
      name: it.name,
      qty: it.qty,
      price: Number(it.price),
      image: it.image,
    })),
  }));

  // Gắn thông tin shop (sản phẩm đầu mỗi đơn) để nút "Chat shop" dùng dữ liệu thật
  const firstIds = [...new Set(orders.map((o) => o.products[0]?.productId).filter(Boolean))] as string[];
  if (firstIds.length) {
    const { data: prodRows } = await supabase
      .from('products').select('id, shop_id, shops(name, logo)').in('id', firstIds);
    const map = new Map<string, { shopId: string; name: string; logo: string }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const pr of (prodRows ?? []) as any[]) map.set(pr.id, { shopId: pr.shop_id, name: pr.shops?.name ?? '', logo: pr.shops?.logo ?? '' });
    for (const o of orders) {
      const info = o.products[0]?.productId ? map.get(o.products[0].productId) : undefined;
      if (info) { o.shopId = info.shopId; o.shopName = info.name; o.shopLogo = info.logo; }
    }
  }

  // Lịch sử trạng thái (timeline) — resilient nếu chưa chạy tracking.sql
  const orderIds = orders.map((o) => o.id);
  if (orderIds.length) {
    const { data: hist } = await supabase
      .from('order_status_history').select('order_id, status, note, created_at')
      .in('order_id', orderIds).order('created_at', { ascending: true });
    if (hist) {
      const byOrder = new Map<string, { status: string; note: string | null; date: string }[]>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const h of hist as any[]) {
        const arr = byOrder.get(h.order_id) ?? [];
        arr.push({ status: h.status, note: h.note ?? null, date: h.created_at });
        byOrder.set(h.order_id, arr);
      }
      for (const o of orders) o.tracking = byOrder.get(o.id);
    }
  }
  return orders;
}
