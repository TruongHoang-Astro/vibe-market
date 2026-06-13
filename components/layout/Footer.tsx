import Link from 'next/link';
// Lưu ý: phiên bản lucide-react này đã gỡ bỏ các icon thương hiệu
// (Facebook/Instagram/Youtube/Twitter) nên dùng icon thay thế còn hỗ trợ.
import { Zap, MessageCircle, Camera, Play, Send, Mail, Phone, MapPin, Shield, Truck, RotateCcw, Headphones } from 'lucide-react';

const footerLinks = {
  'Mua Sắm': [
    { label: 'Khuyến mãi hôm nay', href: '/products?sale=true' },
    { label: 'Sản phẩm mới', href: '/products?badge=new' },
    { label: 'Hàng bán chạy', href: '/products?badge=bestseller' },
    { label: 'Flash Sale', href: '/products?flash=true' },
  ],
  'Hỗ Trợ': [
    { label: 'Trung tâm trợ giúp', href: '#' },
    { label: 'Chính sách đổi trả', href: '#' },
    { label: 'Chính sách vận chuyển', href: '#' },
    { label: 'Thanh toán an toàn', href: '#' },
  ],
  'Bán Hàng': [
    { label: 'Đăng ký bán hàng', href: '/login?mode=seller' },
    { label: 'Quản lý shop', href: '/seller/dashboard' },
    { label: 'Chính sách người bán', href: '#' },
    { label: 'Hỗ trợ người bán', href: '#' },
  ],
  'Về Chúng Tôi': [
    { label: 'Giới thiệu', href: '#' },
    { label: 'Tuyển dụng', href: '#' },
    { label: 'Blog & Tin tức', href: '#' },
    { label: 'Liên hệ', href: '#' },
  ],
};

const features = [
  { icon: <Truck size={24} />, title: 'Giao Hàng Nhanh', desc: 'Miễn phí từ 299k' },
  { icon: <Shield size={24} />, title: 'An Toàn Tuyệt Đối', desc: 'Bảo mật thanh toán' },
  { icon: <RotateCcw size={24} />, title: 'Đổi Trả Dễ Dàng', desc: 'Trong vòng 30 ngày' },
  { icon: <Headphones size={24} />, title: 'Hỗ Trợ 24/7', desc: 'Tư vấn mọi lúc' },
];

export default function Footer() {
  return (
    <footer style={{ background: 'var(--black)', color: 'white', marginTop: 'auto' }}>
      {/* Feature strip */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container" style={{ padding: '32px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ color: 'var(--primary)', flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{f.title}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container" style={{ padding: '56px 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px repeat(4, 1fr)', gap: '48px' }}>
          {/* Brand column */}
          <div>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} color="white" fill="white" />
              </div>
              <span style={{ fontFamily: 'Playfair Display', fontWeight: 800, fontSize: '22px', color: 'white' }}>
                Vibe<span style={{ color: 'var(--primary)' }}>Market</span>
              </span>
            </Link>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.7', marginBottom: '24px' }}>
              Nền tảng thương mại điện tử hàng đầu Việt Nam. Kết nối người mua và người bán, mang đến trải nghiệm mua sắm tuyệt vời nhất.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
                <Phone size={14} style={{ color: 'var(--primary)' }} /> 1800-1234 (Miễn phí)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
                <Mail size={14} style={{ color: 'var(--primary)' }} /> support@vibemarket.vn
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
                <MapPin size={14} style={{ color: 'var(--primary)' }} /> 123 Nguyễn Huệ, Q1, TP.HCM
              </div>
            </div>
            {/* Social links */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { icon: <MessageCircle size={16} />, color: '#1877F2' },
                { icon: <Camera size={16} />, color: '#E4405F' },
                { icon: <Play size={16} />, color: '#FF0000' },
                { icon: <Send size={16} />, color: '#1DA1F2' },
              ].map((s, i) => (
                <button key={i} style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = s.color; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'; }}
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px', color: 'white', letterSpacing: '0.5px' }}>{title.toUpperCase()}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {links.map(link => (
                  <Link key={link.label} href={link.href} style={{ textDecoration: 'none', fontSize: '14px', color: 'rgba(255,255,255,0.55)', transition: 'color 0.2s' }}
                    onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = 'var(--primary)')}
                    onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)')}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div style={{ marginTop: '48px', padding: '32px', borderRadius: 'var(--radius-lg)', background: 'rgba(153,0,0,0.15)', border: '1px solid rgba(153,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Đăng ký nhận ưu đãi</h3>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px' }}>Nhận thông báo Flash Sale và voucher độc quyền mỗi ngày</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input type="email" placeholder="Email của bạn..." style={{ padding: '12px 18px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '14px', outline: 'none', width: '260px' }} />
              <button className="btn-primary" style={{ borderRadius: '99px' }}>
                <span>Đăng ký</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            © 2025 Vibe Market. Tất cả quyền được bảo lưu.
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Điều khoản dịch vụ', 'Chính sách bảo mật', 'Cookie'].map(t => (
              <span key={t} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--primary)')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)')}
              >{t}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {['💳', '🏦', '📱', '💰'].map((icon, i) => (
              <div key={i} style={{ width: '40px', height: '26px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{icon}</div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          footer .container > div:first-of-type > div { grid-template-columns: repeat(2, 1fr) !important; }
          footer .container > div:nth-of-type(2) > div { grid-template-columns: 1fr repeat(2, 1fr) !important; gap: 32px !important; }
        }
        @media (max-width: 768px) {
          footer .container > div:first-of-type > div { grid-template-columns: repeat(2, 1fr) !important; }
          footer .container > div:nth-of-type(2) > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
