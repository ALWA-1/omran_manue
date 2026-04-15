import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// إعدادات الـ PWA
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // إيقاف الكاش في بيئة التطوير لتسهيل التعديل
  register: true,
  sw: "sw.js",
});

const nextConfig: NextConfig = {
  /* config options here */
};

// تغليف الإعدادات الأصلية بإضافة الـ PWA
export default withPWA(nextConfig);
