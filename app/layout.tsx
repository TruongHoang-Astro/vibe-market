import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

export const metadata: Metadata = {
  title: "Vibe Market — Nền Tảng Mua Sắm Hàng Đầu Việt Nam",
  description: "Vibe Market - Mua sắm hàng nghìn sản phẩm chính hãng với giá tốt nhất. Flash Sale mỗi ngày, giao hàng nhanh toàn quốc, đổi trả dễ dàng.",
  keywords: "vibe market, mua sắm online, thương mại điện tử, flash sale, hàng chính hãng",
  openGraph: {
    title: "Vibe Market — Nền Tảng Mua Sắm Hàng Đầu Việt Nam",
    description: "Mua sắm thông minh, sống đỉnh cao cùng Vibe Market",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
      </head>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}
