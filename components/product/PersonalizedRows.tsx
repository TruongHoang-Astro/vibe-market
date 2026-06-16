'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRecentlyViewed } from '@/lib/recently-viewed';
import { fetchRecentProducts, fetchRecommendations } from '@/app/actions/recommend';
import { formatPrice } from '@/lib/data/mock-data';
import type { Product } from '@/lib/data/mock-data';

function Row({ title, products }: { title: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="section-sm">
      <div className="container">
        <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', fontWeight: 800, marginBottom: '16px' }}>{title}</h2>
        <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px' }}>
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: 'none', flexShrink: 0, width: '160px' }}>
              <div style={{ background: 'white', border: '1px solid var(--gray-100)', borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'var(--transition)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                <img src={p.image} alt={p.name} style={{ width: '100%', height: '160px', objectFit: 'cover', background: 'var(--gray-100)' }} />
                <div style={{ padding: '10px' }}>
                  <p className="line-clamp-2" style={{ fontSize: '13px', color: 'var(--gray-800)', marginBottom: '6px', minHeight: '34px', lineHeight: 1.3 }}>{p.name}</p>
                  <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '15px' }}>{formatPrice(p.price)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PersonalizedRows() {
  const [recent, setRecent] = useState<Product[]>([]);
  const [recs, setRecs] = useState<Product[]>([]);

  useEffect(() => {
    const ids = getRecentlyViewed();
    fetchRecommendations(ids).then(setRecs).catch(() => {});
    if (ids.length) fetchRecentProducts(ids).then(setRecent).catch(() => {});
  }, []);

  return (
    <>
      <Row title="👀 Đã xem gần đây" products={recent} />
      <Row title="✨ Dành cho bạn" products={recs} />
    </>
  );
}
