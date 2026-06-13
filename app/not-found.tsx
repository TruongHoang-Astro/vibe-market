import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 24px', gap: '8px' }}>
      <div style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(5rem, 18vw, 11rem)', fontWeight: 800, lineHeight: 1, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        404
      </div>
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '8px' }}>
        Ối! Không tìm thấy trang
      </h1>
      <p style={{ color: 'var(--gray-500)', fontSize: '16px', maxWidth: '440px', marginBottom: '28px', lineHeight: 1.7 }}>
        Trang bạn tìm có thể đã bị xoá, đổi tên hoặc tạm thời không khả dụng. Hãy quay lại mua sắm cùng Vibe Market nhé!
      </p>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" className="btn-primary" style={{ borderRadius: '99px', fontSize: '15px', padding: '14px 32px' }}>
          <span>Về trang chủ</span>
        </Link>
        <Link href="/products" className="btn-outline" style={{ borderRadius: '99px', fontSize: '15px', padding: '12px 30px' }}>
          Xem sản phẩm
        </Link>
      </div>
    </div>
  );
}
