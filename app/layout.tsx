import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import FeedbackModal from "./components/FeedbackModal";

export const metadata: Metadata = {
  title: "مطعم المملكة",
  description: "اطلب أشهى المأكولات الآن",
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
          {children}
          {/* تركنا نافذة التقييم لتعمل في كامل الموقع، وتم حذف السلة المكررة من هنا */}
          <FeedbackModal />
        </CartProvider>
      </body>
    </html>
  );
}
