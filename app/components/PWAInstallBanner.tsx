'use client';
import { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. التحقق إذا كان المستخدم أغلق البانر سابقاً
    const isDismissed = localStorage.getItem('pwa-banner-dismissed');
    if (isDismissed) return;

    // 2. التحقق من نظام iOS
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isApple);

    // 3. الإمساك بحدث التثبيت (للأندرويد والكروم)
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 4. في حالة الآيفون، نظهر البانر بعد 3 ثوانٍ من دخول الموقع
    if (isApple) {
      const timer = setTimeout(() => {
        // نتحقق أيضاً إذا كان التطبيق مثبتاً بالفعل (Standalone mode)
        if (!window.matchMedia('(display-mode: standalone)').matches) {
          setShowBanner(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    // حفظ قرار المستخدم لعدم إزعاجه مرة أخرى
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] p-4 px-4 sm:px-6"
        >
          <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-ruby-100 flex items-center justify-between p-3 gap-3">
            {/* اللوجو والمعلومات */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-ruby-500 rounded-xl flex items-center justify-center text-white shadow-inner flex-shrink-0">
                {/* ضع هنا أيقونة التاج أو لوجو المطعم */}
                <span className="text-xl">👑</span>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">مطعم المملكة</h4>
                <p className="text-[10px] text-slate-500 font-bold">لتجربة طلب أسرع.. حمل التطبيق الآن</p>
              </div>
            </div>

            {/* الأكشن: زر التثبيت أو تعليمات الآيفون */}
            <div className="flex items-center gap-2">
              {isIOS ? (
                <div className="flex items-center gap-1 bg-ruby-50 px-3 py-2 rounded-lg text-[10px] font-black text-ruby-600 border border-ruby-100">
                  اضغط <Share size={14} /> ثم "إضافة" <PlusSquare size={14} />
                </div>
              ) : (
                <button
                  onClick={handleInstall}
                  className="bg-ruby-500 text-white px-4 py-2 rounded-lg text-xs font-black shadow-md hover:bg-ruby-600 transition-colors flex items-center gap-1"
                >
                  <Download size={14} /> تثبيت
                </button>
              )}
              
              {/* زر الإغلاق */}
              <button 
                onClick={dismissBanner}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}