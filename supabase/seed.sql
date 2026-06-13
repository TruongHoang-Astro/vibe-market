-- ============================================================
-- Vibe Market — seed data (catalog công khai)
-- Chạy SAU schema.sql, trong Supabase SQL Editor.
-- Idempotent: chạy lại nhiều lần cũng an toàn (ON CONFLICT DO NOTHING).
-- KHÔNG seed orders/wishlist/chat vì chúng gắn với user thật (tạo khi dùng).
-- ============================================================

-- ---------- categories ----------
insert into public.categories (id, name, icon, color, count) values
  ('1', 'Thời Trang',         '👗', '#FF6B6B', 1240),
  ('2', 'Điện Tử',            '📱', '#4ECDC4', 890),
  ('3', 'Làm Đẹp',            '💄', '#FFE66D', 670),
  ('4', 'Gia Dụng',           '🏠', '#A8E6CF', 540),
  ('5', 'Thể Thao',           '⚽', '#FF8B94', 320),
  ('6', 'Sách & Văn Phòng',   '📚', '#DCEDC1', 280),
  ('7', 'Đồ Ăn & Thức Uống',  '🍜', '#FFD93D', 450),
  ('8', 'Mẹ & Bé',            '👶', '#C5CAE9', 360)
on conflict (id) do nothing;

-- ---------- shops ----------
insert into public.shops (id, name, logo, banner, rating, followers, products, response_rate, response_time, joined_date, description, category, verified) values
  ('shop1', 'VibeFashion Store',
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=300&fit=crop',
    4.9, 12500, 342, 98, '1 giờ', '2022-03-15',
    'Thời trang cao cấp, phong cách hiện đại cho giới trẻ Việt Nam.', 'Thời Trang', true),
  ('shop2', 'TechZone Official',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=300&fit=crop',
    4.8, 8900, 215, 99, '30 phút', '2021-06-20',
    'Thiết bị điện tử chính hãng, bảo hành đầy đủ.', 'Điện Tử', true),
  ('shop3', 'BeautyVibe',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&h=300&fit=crop',
    4.7, 5400, 180, 95, '2 giờ', '2023-01-10',
    'Mỹ phẩm chính hãng, an toàn cho mọi loại da.', 'Làm Đẹp', false)
on conflict (id) do nothing;

-- ---------- products ----------
insert into public.products
  (id, shop_id, name, price, original_price, image, images, category, subcategory,
   rating, reviews, sold, stock, description, badge, colors, sizes, is_flash_sale, flash_sale_price)
values
  ('p1', 'shop1', 'Áo Khoác Denim Premium Limited Edition', 890000, 1290000,
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&h=500&fit=crop',
    ARRAY['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=500&fit=crop'],
    'Thời Trang', 'Áo Khoác', 4.9, 2841, 15420, 120,
    'Áo khoác denim cao cấp với chất liệu vải nhập khẩu, thiết kế thời thượng phù hợp nhiều phong cách. Màu sắc bền đẹp, không phai màu sau nhiều lần giặt.',
    'sale', ARRAY['#1e3a5f','#2d2d2d','#8B7355'], ARRAY['S','M','L','XL','XXL'], true, 750000),

  ('p2', 'shop2', 'Đồng Hồ Thông Minh ProWatch X5', 2490000, 3200000,
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=500&fit=crop'],
    'Điện Tử', 'Đồng Hồ Thông Minh', 4.8, 1203, 8940, 45,
    'Đồng hồ thông minh với màn hình AMOLED 1.4 inch, pin 7 ngày, chống nước 50m, theo dõi sức khỏe 24/7.',
    'hot', ARRAY['#000000','#C0C0C0','#FFD700'], null, true, 1990000),

  ('p3', 'shop3', 'Serum Dưỡng Da Vitamin C 30ml', 450000, 650000,
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=500&fit=crop',
    ARRAY['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1567721913486-6585f069b3b1?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500&h=500&fit=crop'],
    'Làm Đẹp', 'Chăm Sóc Da', 4.7, 5621, 32000, 200,
    'Serum vitamin C đậm đặc 20%, làm sáng da, mờ thâm nám, chống oxy hóa mạnh mẽ.',
    'bestseller', null, null, false, null),

  ('p4', 'shop1', 'Giày Sneaker Vibe Edition 2025', 1250000, 1650000,
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop',
    ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=500&fit=crop'],
    'Thời Trang', 'Giày', 4.9, 3210, 22100, 80,
    'Giày sneaker phiên bản giới hạn 2025, đế cao su siêu nhẹ, lót êm ái, thiết kế streetwear độc đáo.',
    'new', ARRAY['#FFFFFF','#000000','#990000'], ARRAY['38','39','40','41','42','43','44'], false, null),

  ('p5', 'shop2', 'Tai Nghe Bluetooth VibeSound Pro', 1890000, 2500000,
    'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=500&h=500&fit=crop',
    ARRAY['https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop'],
    'Điện Tử', 'Tai Nghe', 4.8, 890, 5600, 60,
    'Tai nghe over-ear chống ồn ANC, pin 40 giờ, kết nối Bluetooth 5.3, âm thanh Hi-Fi 24bit.',
    'sale', ARRAY['#000000','#FFFFFF','#8B0000'], null, true, 1490000),

  ('p6', 'shop1', 'Đầm Maxi Floral Summer 2025', 680000, 980000,
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&h=500&fit=crop',
    ARRAY['https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&h=500&fit=crop'],
    'Thời Trang', 'Đầm', 4.6, 1450, 9800, 150,
    'Đầm maxi hoa nhí dáng xòe, chất liệu lụa cao cấp, phù hợp đi biển, dã ngoại.',
    'sale', ARRAY['#FF9999','#99CCFF','#FFFF99'], ARRAY['S','M','L','XL'], false, null),

  ('p7', 'shop2', 'Điện Thoại Flagship VibePhone 15 Pro', 18500000, 22000000,
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&h=500&fit=crop',
    ARRAY['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500&h=500&fit=crop'],
    'Điện Tử', 'Điện Thoại', 4.9, 4201, 12500, 20,
    'Điện thoại flagship chip AI mạnh nhất 2025, camera 200MP, màn hình 120Hz OLED, sạc nhanh 65W.',
    'hot', ARRAY['#1C1C1E','#F5F5F7','#990000'], null, true, 16990000),

  ('p8', 'shop3', 'Kem Chống Nắng SPF 50+ PA++++', 280000, 380000,
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&h=500&fit=crop',
    ARRAY['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1567721913486-6585f069b3b1?w=500&h=500&fit=crop'],
    'Làm Đẹp', 'Chăm Sóc Da', 4.7, 8920, 45000, 500,
    'Kem chống nắng vật lý + hóa học kép, lọc UVA/UVB, không nhờn, phù hợp da dầu và da hỗn hợp.',
    'bestseller', null, null, false, null),

  ('p9', 'shop1', 'Túi Xách Leather Tote Bag', 1450000, 1900000,
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=500&fit=crop',
    ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&h=500&fit=crop'],
    'Thời Trang', 'Túi Xách', 4.8, 763, 3400, 40,
    'Túi da thật cao cấp, thiết kế minimalist, dung tích lớn phù hợp đi làm và du lịch.',
    'new', ARRAY['#8B4513','#000000','#F5F5DC'], null, false, null),

  ('p10', 'shop2', 'Laptop Gaming VibeBook Pro 16', 28900000, 35000000,
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop',
    ARRAY['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=500&h=500&fit=crop'],
    'Điện Tử', 'Laptop', 4.9, 312, 1800, 15,
    'Laptop gaming RTX 5080, i9-15900HX, RAM 32GB, SSD 1TB NVMe, màn hình 2K 240Hz.',
    'hot', null, null, true, 25990000),

  ('p11', 'shop3', 'Son Môi Velvet Matte Collection', 185000, 250000,
    'https://images.unsplash.com/photo-1567721913486-6585f069b3b1?w=500&h=500&fit=crop',
    ARRAY['https://images.unsplash.com/photo-1567721913486-6585f069b3b1?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500&h=500&fit=crop'],
    'Làm Đẹp', 'Trang Điểm', 4.6, 12400, 89000, 1000,
    'Son lì nhung cao cấp, lên màu chuẩn, giữ màu 12 giờ, không khô môi.',
    'bestseller', ARRAY['#8B0000','#DC143C','#FF69B4','#FF4500','#C71585'], null, false, null),

  ('p12', 'shop1', 'Áo Sơ Mi Linen Premium Unisex', 520000, 720000,
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&h=500&fit=crop',
    ARRAY['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&h=500&fit=crop','https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&h=500&fit=crop'],
    'Thời Trang', 'Áo Sơ Mi', 4.7, 2100, 18700, 200,
    'Áo sơ mi linen tự nhiên, mặc thoáng mát, phù hợp đi làm và dạo phố.',
    'sale', ARRAY['#FFFFFF','#F5DEB3','#87CEEB','#F08080'], ARRAY['S','M','L','XL','XXL'], false, null)
on conflict (id) do nothing;

-- ---------- reviews (gắn product, chưa gắn user thật) ----------
insert into public.reviews (product_id, user_name, avatar, rating, comment, created_at) values
  ('p1', 'Nguyễn Thị Lan',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop', 5,
    'Sản phẩm chất lượng tuyệt vời! Đúng như mô tả, giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop dài dài!',
    '2025-05-20'),
  ('p2', 'Trần Văn Minh',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop', 5,
    'Mua được hàng chất lượng với giá hợp lý. Vibe Market thật sự uy tín!',
    '2025-05-18'),
  ('p3', 'Phạm Thu Hương',
    'https://images.unsplash.com/photo-1494790108755-2616b2a60d34?w=50&h=50&fit=crop', 5,
    'Giao diện đẹp, dễ dùng, hàng y hình, chất lượng như mong đợi. Rất hài lòng!',
    '2025-05-15')
on conflict do nothing;
