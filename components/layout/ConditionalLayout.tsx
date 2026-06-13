'use client';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import ChatWidget from '@/components/chat/ChatWidget';
import WishlistSync from './WishlistSync';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullPage = pathname.startsWith('/admin') || pathname.startsWith('/seller') || pathname.startsWith('/login');

  if (isFullPage) {
    return (
      <>
        {children}
        <WishlistSync />
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <CartDrawer />
      <ChatWidget />
      <WishlistSync />
      <Toaster position="bottom-right" richColors toastOptions={{
        style: { fontFamily: 'Inter, sans-serif' },
      }} />
    </>
  );
}
