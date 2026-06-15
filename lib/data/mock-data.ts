// lib/data/mock-data.ts

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  images: string[];
  category: string;
  subcategory: string;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  shopId: string;
  shopName: string;
  description: string;
  badge?: 'new' | 'sale' | 'hot' | 'bestseller';
  colors?: string[];
  sizes?: string[];
  isFlashSale?: boolean;
  flashSalePrice?: number;
  sizeGuide?: { size: string; value: string }[];
}

export interface Shop {
  id: string;
  name: string;
  logo: string;
  banner: string;
  rating: number;
  followers: number;
  products: number;
  responseRate: number;
  responseTime: string;
  joinedDate: string;
  description: string;
  category: string;
  verified: boolean;
  // Tùy chỉnh + chính sách (Scale phase — chỉ có sau khi chạy shop_custom.sql)
  themeColor?: string;
  announcement?: string;
  returnPolicy?: string;
  shippingPolicy?: string;
  warrantyPolicy?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  productId: string;
  images?: string[];
}

export interface Order {
  id: string;
  userId: string;
  products: { productId: string; name: string; qty: number; price: number; image: string }[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  date: string;
  address: string;
  paymentMethod: string;
  // Thông tin shop (sản phẩm đầu đơn) để mở chat — đính kèm bởi getMyOrders
  shopId?: string;
  shopName?: string;
  shopLogo?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

export const categories: Category[] = [
  { id: '1', name: 'Thời Trang', icon: '👗', color: '#FF6B6B', count: 1240 },
  { id: '2', name: 'Điện Tử', icon: '📱', color: '#4ECDC4', count: 890 },
  { id: '3', name: 'Làm Đẹp', icon: '💄', color: '#FFE66D', count: 670 },
  { id: '4', name: 'Gia Dụng', icon: '🏠', color: '#A8E6CF', count: 540 },
  { id: '5', name: 'Thể Thao', icon: '⚽', color: '#FF8B94', count: 320 },
  { id: '6', name: 'Sách & Văn Phòng', icon: '📚', color: '#DCEDC1', count: 280 },
  { id: '7', name: 'Đồ Ăn & Thức Uống', icon: '🍜', color: '#FFD93D', count: 450 },
  { id: '8', name: 'Mẹ & Bé', icon: '👶', color: '#C5CAE9', count: 360 },
];

export const shops: Shop[] = [
  {
    id: 'shop1',
    name: 'VibeFashion Store',
    logo: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=100&h=100&fit=crop',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=300&fit=crop',
    rating: 4.9,
    followers: 12500,
    products: 342,
    responseRate: 98,
    responseTime: '1 giờ',
    joinedDate: '2022-03-15',
    description: 'Thời trang cao cấp, phong cách hiện đại cho giới trẻ Việt Nam.',
    category: 'Thời Trang',
    verified: true,
  },
  {
    id: 'shop2',
    name: 'TechZone Official',
    logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&h=100&fit=crop',
    banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=300&fit=crop',
    rating: 4.8,
    followers: 8900,
    products: 215,
    responseRate: 99,
    responseTime: '30 phút',
    joinedDate: '2021-06-20',
    description: 'Thiết bị điện tử chính hãng, bảo hành đầy đủ.',
    category: 'Điện Tử',
    verified: true,
  },
  {
    id: 'shop3',
    name: 'BeautyVibe',
    logo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
    banner: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&h=300&fit=crop',
    rating: 4.7,
    followers: 5400,
    products: 180,
    responseRate: 95,
    responseTime: '2 giờ',
    joinedDate: '2023-01-10',
    description: 'Mỹ phẩm chính hãng, an toàn cho mọi loại da.',
    category: 'Làm Đẹp',
    verified: false,
  },
];

const productImages = {
  fashion: [
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop',
  ],
  tech: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1567721913486-6585f069b3b1?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&h=500&fit=crop',
  ],
};

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Áo Khoác Denim Premium Limited Edition',
    price: 890000,
    originalPrice: 1290000,
    image: productImages.fashion[0],
    images: [productImages.fashion[0], productImages.fashion[1], productImages.fashion[2], productImages.fashion[3]],
    category: 'Thời Trang',
    subcategory: 'Áo Khoác',
    rating: 4.9,
    reviews: 2841,
    sold: 15420,
    stock: 120,
    shopId: 'shop1',
    shopName: 'VibeFashion Store',
    description: 'Áo khoác denim cao cấp với chất liệu vải nhập khẩu, thiết kế thời thượng phù hợp nhiều phong cách. Màu sắc bền đẹp, không phai màu sau nhiều lần giặt.',
    badge: 'sale',
    colors: ['#1e3a5f', '#2d2d2d', '#8B7355'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    isFlashSale: true,
    flashSalePrice: 750000,
  },
  {
    id: 'p2',
    name: 'Đồng Hồ Thông Minh ProWatch X5',
    price: 2490000,
    originalPrice: 3200000,
    image: productImages.tech[0],
    images: [productImages.tech[0], productImages.tech[1], productImages.tech[2]],
    category: 'Điện Tử',
    subcategory: 'Đồng Hồ Thông Minh',
    rating: 4.8,
    reviews: 1203,
    sold: 8940,
    stock: 45,
    shopId: 'shop2',
    shopName: 'TechZone Official',
    description: 'Đồng hồ thông minh với màn hình AMOLED 1.4 inch, pin 7 ngày, chống nước 50m, theo dõi sức khỏe 24/7.',
    badge: 'hot',
    colors: ['#000000', '#C0C0C0', '#FFD700'],
    isFlashSale: true,
    flashSalePrice: 1990000,
  },
  {
    id: 'p3',
    name: 'Serum Dưỡng Da Vitamin C 30ml',
    price: 450000,
    originalPrice: 650000,
    image: productImages.beauty[0],
    images: [productImages.beauty[0], productImages.beauty[1], productImages.beauty[2]],
    category: 'Làm Đẹp',
    subcategory: 'Chăm Sóc Da',
    rating: 4.7,
    reviews: 5621,
    sold: 32000,
    stock: 200,
    shopId: 'shop3',
    shopName: 'BeautyVibe',
    description: 'Serum vitamin C đậm đặc 20%, làm sáng da, mờ thâm nám, chống oxy hóa mạnh mẽ.',
    badge: 'bestseller',
    isFlashSale: false,
  },
  {
    id: 'p4',
    name: 'Giày Sneaker Vibe Edition 2025',
    price: 1250000,
    originalPrice: 1650000,
    image: productImages.fashion[7],
    images: [productImages.fashion[7], productImages.fashion[4], productImages.fashion[5]],
    category: 'Thời Trang',
    subcategory: 'Giày',
    rating: 4.9,
    reviews: 3210,
    sold: 22100,
    stock: 80,
    shopId: 'shop1',
    shopName: 'VibeFashion Store',
    description: 'Giày sneaker phiên bản giới hạn 2025, đế cao su siêu nhẹ, lót êm ái, thiết kế streetwear độc đáo.',
    badge: 'new',
    colors: ['#FFFFFF', '#000000', '#990000'],
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    isFlashSale: false,
  },
  {
    id: 'p5',
    name: 'Tai Nghe Bluetooth VibeSound Pro',
    price: 1890000,
    originalPrice: 2500000,
    image: productImages.tech[3],
    images: [productImages.tech[3], productImages.tech[4], productImages.tech[5]],
    category: 'Điện Tử',
    subcategory: 'Tai Nghe',
    rating: 4.8,
    reviews: 890,
    sold: 5600,
    stock: 60,
    shopId: 'shop2',
    shopName: 'TechZone Official',
    description: 'Tai nghe over-ear chống ồn ANC, pin 40 giờ, kết nối Bluetooth 5.3, âm thanh Hi-Fi 24bit.',
    badge: 'sale',
    colors: ['#000000', '#FFFFFF', '#8B0000'],
    isFlashSale: true,
    flashSalePrice: 1490000,
  },
  {
    id: 'p6',
    name: 'Đầm Maxi Floral Summer 2025',
    price: 680000,
    originalPrice: 980000,
    image: productImages.fashion[2],
    images: [productImages.fashion[2], productImages.fashion[3], productImages.fashion[6]],
    category: 'Thời Trang',
    subcategory: 'Đầm',
    rating: 4.6,
    reviews: 1450,
    sold: 9800,
    stock: 150,
    shopId: 'shop1',
    shopName: 'VibeFashion Store',
    description: 'Đầm maxi hoa nhí dáng xòe, chất liệu lụa cao cấp, phù hợp đi biển, dã ngoại.',
    badge: 'sale',
    colors: ['#FF9999', '#99CCFF', '#FFFF99'],
    sizes: ['S', 'M', 'L', 'XL'],
    isFlashSale: false,
  },
  {
    id: 'p7',
    name: 'Điện Thoại Flagship VibePhone 15 Pro',
    price: 18500000,
    originalPrice: 22000000,
    image: productImages.tech[4],
    images: [productImages.tech[4], productImages.tech[2], productImages.tech[1]],
    category: 'Điện Tử',
    subcategory: 'Điện Thoại',
    rating: 4.9,
    reviews: 4201,
    sold: 12500,
    stock: 20,
    shopId: 'shop2',
    shopName: 'TechZone Official',
    description: 'Điện thoại flagship chip AI mạnh nhất 2025, camera 200MP, màn hình 120Hz OLED, sạc nhanh 65W.',
    badge: 'hot',
    colors: ['#1C1C1E', '#F5F5F7', '#990000'],
    isFlashSale: true,
    flashSalePrice: 16990000,
  },
  {
    id: 'p8',
    name: 'Kem Chống Nắng SPF 50+ PA++++',
    price: 280000,
    originalPrice: 380000,
    image: productImages.beauty[3],
    images: [productImages.beauty[3], productImages.beauty[1]],
    category: 'Làm Đẹp',
    subcategory: 'Chăm Sóc Da',
    rating: 4.7,
    reviews: 8920,
    sold: 45000,
    stock: 500,
    shopId: 'shop3',
    shopName: 'BeautyVibe',
    description: 'Kem chống nắng vật lý + hóa học kép, lọc UVA/UVB, không nhờn, phù hợp da dầu và da hỗn hợp.',
    badge: 'bestseller',
    isFlashSale: false,
  },
  {
    id: 'p9',
    name: 'Túi Xách Leather Tote Bag',
    price: 1450000,
    originalPrice: 1900000,
    image: productImages.fashion[5],
    images: [productImages.fashion[5], productImages.fashion[4]],
    category: 'Thời Trang',
    subcategory: 'Túi Xách',
    rating: 4.8,
    reviews: 763,
    sold: 3400,
    stock: 40,
    shopId: 'shop1',
    shopName: 'VibeFashion Store',
    description: 'Túi da thật cao cấp, thiết kế minimalist, dung tích lớn phù hợp đi làm và du lịch.',
    badge: 'new',
    colors: ['#8B4513', '#000000', '#F5F5DC'],
    isFlashSale: false,
  },
  {
    id: 'p10',
    name: 'Laptop Gaming VibeBook Pro 16',
    price: 28900000,
    originalPrice: 35000000,
    image: productImages.tech[5],
    images: [productImages.tech[5], productImages.tech[3]],
    category: 'Điện Tử',
    subcategory: 'Laptop',
    rating: 4.9,
    reviews: 312,
    sold: 1800,
    stock: 15,
    shopId: 'shop2',
    shopName: 'TechZone Official',
    description: 'Laptop gaming RTX 5080, i9-15900HX, RAM 32GB, SSD 1TB NVMe, màn hình 2K 240Hz.',
    badge: 'hot',
    isFlashSale: true,
    flashSalePrice: 25990000,
  },
  {
    id: 'p11',
    name: 'Son Môi Velvet Matte Collection',
    price: 185000,
    originalPrice: 250000,
    image: productImages.beauty[1],
    images: [productImages.beauty[1], productImages.beauty[2]],
    category: 'Làm Đẹp',
    subcategory: 'Trang Điểm',
    rating: 4.6,
    reviews: 12400,
    sold: 89000,
    stock: 1000,
    shopId: 'shop3',
    shopName: 'BeautyVibe',
    description: 'Son lì nhung cao cấp, lên màu chuẩn, giữ màu 12 giờ, không khô môi.',
    badge: 'bestseller',
    colors: ['#8B0000', '#DC143C', '#FF69B4', '#FF4500', '#C71585'],
    isFlashSale: false,
  },
  {
    id: 'p12',
    name: 'Áo Sơ Mi Linen Premium Unisex',
    price: 520000,
    originalPrice: 720000,
    image: productImages.fashion[6],
    images: [productImages.fashion[6], productImages.fashion[0]],
    category: 'Thời Trang',
    subcategory: 'Áo Sơ Mi',
    rating: 4.7,
    reviews: 2100,
    sold: 18700,
    stock: 200,
    shopId: 'shop1',
    shopName: 'VibeFashion Store',
    description: 'Áo sơ mi linen tự nhiên, mặc thoáng mát, phù hợp đi làm và dạo phố.',
    badge: 'sale',
    colors: ['#FFFFFF', '#F5DEB3', '#87CEEB', '#F08080'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    isFlashSale: false,
  },
];

export const flashSaleProducts = products.filter(p => p.isFlashSale);

export const reviews: Review[] = [
  {
    id: 'r1',
    userId: 'u1',
    userName: 'Nguyễn Thị Lan',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop',
    rating: 5,
    comment: 'Sản phẩm chất lượng tuyệt vời! Đúng như mô tả, giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop dài dài!',
    date: '2025-05-20',
    productId: 'p1',
  },
  {
    id: 'r2',
    userId: 'u2',
    userName: 'Trần Văn Minh',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    rating: 5,
    comment: 'Mua được hàng chất lượng với giá hợp lý. Vibe Market thật sự uy tín!',
    date: '2025-05-18',
    productId: 'p2',
  },
  {
    id: 'r3',
    userId: 'u3',
    userName: 'Phạm Thu Hương',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2a60d34?w=50&h=50&fit=crop',
    rating: 5,
    comment: 'Giao diện đẹp, dễ dùng, hàng y hình, chất lượng như mong đợi. Rất hài lòng!',
    date: '2025-05-15',
    productId: 'p3',
  },
];

export const orders: Order[] = [
  {
    id: 'ORD-001',
    userId: 'seller1',
    products: [
      { productId: 'p1', name: 'Áo Khoác Denim Premium', qty: 2, price: 890000, image: productImages.fashion[0] },
      { productId: 'p4', name: 'Giày Sneaker Vibe Edition', qty: 1, price: 1250000, image: productImages.fashion[7] },
    ],
    total: 3030000,
    status: 'delivered',
    date: '2025-05-20',
    address: '123 Nguyễn Huệ, Q1, TP.HCM',
    paymentMethod: 'Thẻ ngân hàng',
  },
  {
    id: 'ORD-002',
    userId: 'seller1',
    products: [
      { productId: 'p6', name: 'Đầm Maxi Floral Summer', qty: 1, price: 680000, image: productImages.fashion[2] },
    ],
    total: 680000,
    status: 'shipping',
    date: '2025-05-22',
    address: '456 Lê Lợi, Q3, TP.HCM',
    paymentMethod: 'COD',
  },
  {
    id: 'ORD-003',
    userId: 'seller1',
    products: [
      { productId: 'p12', name: 'Áo Sơ Mi Linen Premium', qty: 3, price: 520000, image: productImages.fashion[6] },
    ],
    total: 1560000,
    status: 'confirmed',
    date: '2025-05-24',
    address: '789 Trần Hưng Đạo, Q5, TP.HCM',
    paymentMethod: 'MoMo',
  },
  {
    id: 'ORD-004',
    userId: 'seller2',
    products: [
      { productId: 'p2', name: 'Đồng Hồ ProWatch X5', qty: 1, price: 2490000, image: productImages.tech[0] },
    ],
    total: 2490000,
    status: 'pending',
    date: '2025-05-25',
    address: '321 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    paymentMethod: 'ZaloPay',
  },
];

export const revenueData = [
  { month: 'T1', revenue: 12500000, orders: 45 },
  { month: 'T2', revenue: 18200000, orders: 63 },
  { month: 'T3', revenue: 15800000, orders: 54 },
  { month: 'T4', revenue: 24100000, orders: 89 },
  { month: 'T5', revenue: 28900000, orders: 102 },
  { month: 'T6', revenue: 32400000, orders: 118 },
];

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);
};

export const formatNumber = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'tr';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
};

// Định dạng số nguyên với dấu chấm ngăn cách hàng nghìn (1240 → "1.240").
// KHÔNG dùng toLocaleString() vì kết quả phụ thuộc locale của server/client
// → gây hydration mismatch. Hàm này cho kết quả nhất quán hai phía.
export const formatCount = (n: number): string =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
