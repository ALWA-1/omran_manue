import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import FeedbackModal from "./components/FeedbackModal";
import PWAInstallBanner from "./components/PWAInstallBanner"; // استيراد المكون الجديد

export const viewport: Viewport = {
  themeColor: "#e11d48",
};

export const metadata: Metadata = {
  title: "المملكه مطعم",
  description: "اطلب أشهى المأكولات الآن",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "المملكة",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <CartProvider>
          {/* البانر الاحترافي للتثبيت يظهر هنا في أعلى الصفحة */}
          <PWAInstallBanner />
          
          {children}
          <FeedbackModal />
        </CartProvider>
      </body>
    </html>
  );
}
