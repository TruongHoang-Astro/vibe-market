// app/admin/dashboard/page.tsx — Server Component.
// Cổng chặn theo role='admin' (getAdminDashboard → requireAdmin) rồi nạp dữ liệu thật.
import Link from 'next/link';
import { Shield, Lock } from 'lucide-react';
import { getAdminDashboard, type AdminAccess } from '@/app/actions/admin';
import AdminDashboardClient from './AdminDashboardClient';

function Denied({ access }: { access: AdminAccess }) {
  const unauth = access === 'unauth';
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '40px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #ef4444, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        {unauth ? <Lock size={30} color="white" /> : <Shield size={30} color="white" />}
      </div>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 800, marginBottom: '8px', color: '#111' }}>
        {unauth ? 'Bạn chưa đăng nhập' : 'Không có quyền truy cập'}
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '28px', maxWidth: '440px' }}>
        {unauth
          ? 'Đăng nhập bằng tài khoản admin để vào trang quản trị.'
          : 'Tài khoản của bạn không phải admin. Cấp quyền bằng SQL: update public.profiles set role = \'admin\' where id = \'<user-uuid>\'; (xem supabase/admin.sql).'}
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link href={unauth ? '/login' : '/'} className="btn-primary" style={{ borderRadius: '99px' }}>
          <span>{unauth ? 'Đăng nhập' : 'Về trang chủ'}</span>
        </Link>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { access, data } = await getAdminDashboard();
  if (access !== 'ok' || !data) return <Denied access={access} />;
  return <AdminDashboardClient data={data} />;
}
