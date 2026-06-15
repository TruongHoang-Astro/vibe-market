'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Store, Package, Users, ChevronRight, ShieldCheck, MessageSquare, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, formatNumber } from '@/lib/data/mock-data';
import type { Shop, Product, Review } from '@/lib/data/mock-data';
import { useCartStore } from '@/lib/store/cart-store';
import { useChatStore } from '@/lib/store/chat-store';
import { useUser } from '@/lib/supabase/use-user';
import { createClient } from '@/lib/supabase/client';
import { toggleFollowShop } from '@/app/actions/shop';

export default function ShopClient({ shop, shopProducts, shopReviews, reviewTotal }: { shop: Shop; shopProducts: Product[]; shopReviews: Review[]; reviewTotal: number }) {
  const { user } = useUser();
  const [followed, setFollowed] = useState(false);
  const [followers, setFollowers] = useState(shop.followers);
  const [followBusy, setFollowBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'info'>('products');
  const { addItem, openCart } = useCartStore();
  const { openChat } = useChatStore();

  // Trạng thái theo dõi thật của user hiện tại
  useEffect(() => {
    if (!user) { setFollowed(false); return; }
    createClient().from('shop_follows').select('id').eq('user_id', user.id).eq('shop_id', shop.id).maybeSingle()
      .then(({ data }) => setFollowed(!!data));
  }, [user, shop.id]);

  const handleFollow = async () => {
    if (!user) { toast('Đăng nhập để theo dõi shop nhé!'); return; }
    if (followBusy) return;
    setFollowBusy(true);
    const prev = followed;
    setFollowed(!prev); setFollowers(f => f + (prev ? -1 : 1)); // optimistic
    const res = await toggleFollowShop(shop.id);
    setFollowBusy(false);
    if (res.error) { setFollowed(prev); setFollowers(f => f + (prev ? 1 : -1)); toast.error(res.error); return; }
    setFollowed(!!res.following);
    toast.success(res.following ? 'Đã theo dõi shop' : 'Đã bỏ theo dõi');
  };

  const handleChat = () => openChat(shop.id, shop.name, shop.logo);
  const theme = shop.themeColor || 'var(--primary)';
  const policies = [
    { label: 'Đổi trả', value: shop.returnPolicy },
    { label: 'Vận chuyển', value: shop.shippingPolicy },
    { label: 'Bảo hành', value: shop.warrantyPolicy },
  ].filter(p => p.value && p.value.trim());

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Thông báo gian hàng (tùy chỉnh) */}
      {shop.announcement && (
        <div style={{ background: theme, color: 'white', fontSize: '14px', fontWeight: 600, textAlign: 'center', padding: '10px 16px' }}>
          {shop.announcement}
        </div>
      )}

      {/* Shop banner */}
      <div style={{ position: 'relative', height: '220px', overflow: 'hidden', background: 'linear-gradient(135deg, #0a0a0a, #1a0000)' }}>
        {shop.banner && <img src={shop.banner} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
      </div>

      {/* Shop header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container" style={{ padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', transform: 'translateY(-40px)', marginBottom: '-20px', flexWrap: 'wrap' }}>
            {/* Logo */}
            <div style={{ width: '100px', height: '100px', borderRadius: '20px', overflow: 'hidden', border: '4px solid white', boxShadow: 'var(--shadow-md)', flexShrink: 0, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {shop.logo ? <img src={shop.logo} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={44} color="white" />}
            </div>
            <div style={{ flex: 1, paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', fontWeight: 800, color: 'var(--black)' }}>{shop.name}</h1>
                {shop.verified && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px' }}>
                    <ShieldCheck size={13} /> Đã xác minh
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {[
                  { icon: <Star size={14} fill="#f59e0b" color="#f59e0b" />, val: shop.rating, label: 'Đánh giá' },
                  { icon: <Users size={14} />, val: formatNumber(followers), label: 'Theo dõi' },
                  { icon: <Package size={14} />, val: shop.products, label: 'Sản phẩm' },
                ].map((stat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--gray-600)' }}>
                    <span style={{ color: 'var(--primary)' }}>{stat.icon}</span>
                    <strong style={{ color: 'var(--black)' }}>{stat.val}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <motion.button whileHover={{ scale: 1.04 }} onClick={handleFollow}
                  className={followed ? 'btn-outline' : 'btn-primary'}
                  style={{ borderRadius: '10px', padding: '10px 24px', fontSize: '14px', ...(followed ? {} : { background: theme, borderColor: theme }) }}>
                  {followed ? (
                    <><Heart size={16} fill="var(--primary)" color="var(--primary)" /> <span>Đang theo dõi</span></>
                  ) : (
                    <><Heart size={16} /> <span>Theo dõi shop</span></>
                  )}
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} onClick={handleChat}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: '2px solid var(--primary)', borderRadius: '10px', background: 'rgba(239,68,68,0.04)', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: 'var(--primary)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}>
                  <MessageSquare size={16} /> Chat ngay
                </motion.button>
                <button style={{ padding: '10px 14px', border: '2px solid var(--gray-200)', borderRadius: '10px', background: 'white', cursor: 'pointer', color: 'var(--gray-500)', transition: 'all 0.2s' }}>
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shop info bar */}
      <div style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container" style={{ padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: '32px', padding: '14px 0', flexWrap: 'wrap' }}>
            {[
              { label: 'Tỷ lệ phản hồi', val: `${shop.responseRate}%` },
              { label: 'Thời gian phản hồi', val: shop.responseTime },
              { label: 'Đã tham gia', val: new Date(shop.joinedDate).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' }) },
              { label: 'Danh mục', val: shop.category },
            ].map((info, i) => (
              <div key={i} style={{ fontSize: '13px' }}>
                <span style={{ color: 'var(--gray-500)' }}>{info.label}: </span>
                <strong style={{ color: 'var(--black)' }}>{info.val}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container" style={{ padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            {[{ key: 'products', label: `Sản phẩm (${shopProducts.length})` }, { key: 'reviews', label: `Đánh giá (${reviewTotal})` }, { key: 'info', label: 'Thông tin shop' }].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                style={{ padding: '16px 24px', border: 'none', background: 'transparent', fontWeight: activeTab === tab.key ? 700 : 400, color: activeTab === tab.key ? theme : 'var(--gray-600)', fontSize: '15px', cursor: 'pointer', borderBottom: `3px solid ${activeTab === tab.key ? theme : 'transparent'}`, transition: 'all 0.2s' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: '32px 24px' }}>
        {activeTab === 'products' && (
          <div>
            {shopProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray-400)' }}>
                <Package size={48} style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '16px' }}>Shop chưa có sản phẩm nào</p>
              </div>
            ) : (
              <div className="products-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {shopProducts.map((product, i) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <div className="product-card">
                      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                        <div className="img-wrap">
                          <img src={product.image} alt={product.name} />
                          {product.badge && (
                            <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                              <span className={`badge ${product.badge === 'sale' ? 'badge-red' : product.badge === 'new' ? 'badge-green' : product.badge === 'hot' ? 'badge-orange' : 'badge-gold'}`}>
                                {product.badge === 'sale' ? 'SALE' : product.badge === 'new' ? 'MỚI' : product.badge === 'hot' ? 'HOT' : 'BÁN CHẠY'}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="card-body">
                        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                          <h3 className="line-clamp-2" style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>{product.name}</h3>
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                          <Star size={12} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{product.rating}</span>
                          <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>({formatNumber(product.reviews)})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div className="price-sale" style={{ fontSize: '15px' }}>{formatPrice(product.price)}</div>
                            {product.originalPrice > product.price && <div className="price-original">{formatPrice(product.originalPrice)}</div>}
                          </div>
                          <motion.button whileHover={{ scale: 1.08 }} onClick={() => { addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, quantity: 1, shopId: product.shopId, shopName: product.shopName }); openCart(); }}
                            style={{ background: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '7px 12px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                            + Giỏ
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ maxWidth: '640px' }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontFamily: 'Playfair Display', fontSize: '60px', fontWeight: 800, color: theme }}>{shop.rating}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={20} fill={s <= Math.round(shop.rating) ? '#f59e0b' : '#e5e5e5'} color={s <= Math.round(shop.rating) ? '#f59e0b' : '#e5e5e5'} />)}</div>
              <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>Đánh giá trung bình từ {formatNumber(reviewTotal)} đánh giá</p>
            </div>
            {shopReviews.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>
                <Star size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontSize: '15px' }}>Shop chưa có đánh giá nào</p>
              </div>
            ) : shopReviews.map((r) => (
              <div key={r.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '20px', marginBottom: '12px', display: 'flex', gap: '14px' }}>
                {r.avatar
                  ? <img src={r.avatar} alt={r.userName} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>{r.userName.charAt(0).toUpperCase()}</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{r.userName}</span>
                    <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{new Date(r.date).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={13} fill={s <= r.rating ? '#f59e0b' : '#e5e5e5'} color={s <= r.rating ? '#f59e0b' : '#e5e5e5'} />)}</div>
                  {r.comment && <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: r.images?.length ? '10px' : 0 }}>{r.comment}</p>}
                  {r.images && r.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {r.images.map((img, j) => <img key={j} src={img} alt="" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'info' && (
          <div style={{ maxWidth: '640px' }}>
            {policies.length > 0 && (
              <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '28px', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Chính Sách Bán Hàng</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {policies.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, fontSize: '12px', fontWeight: 700, color: 'white', background: theme, padding: '4px 10px', borderRadius: '99px', marginTop: '2px' }}>{p.label}</span>
                      <p style={{ fontSize: '14px', color: 'var(--gray-600)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{p.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', padding: '28px' }}>
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Giới Thiệu Shop</h3>
              <p style={{ color: 'var(--gray-600)', lineHeight: 1.8, marginBottom: '24px' }}>{shop.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Danh mục chính', val: shop.category },
                  { label: 'Ngày tham gia', val: new Date(shop.joinedDate).toLocaleDateString('vi-VN') },
                  { label: 'Tổng sản phẩm', val: `${shop.products} sản phẩm` },
                  { label: 'Người theo dõi', val: formatNumber(followers) },
                  { label: 'Tỷ lệ phản hồi', val: `${shop.responseRate}%` },
                  { label: 'Thời gian phản hồi', val: shop.responseTime },
                ].map((info, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: 'var(--gray-50)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>{info.label}</div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{info.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
