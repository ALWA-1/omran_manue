'use client';
import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare } from 'lucide-react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // التحقق من نظام iOS
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isApple);

    // الإمساك بحدث التثبيت (للأندرويد والكروم)
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // التحقق إذا كان التطبيق مثبتاً بالفعل
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAvailable(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAvailable(false);
    }
  };

  // إذا كان آيفون، نظهر تعليمات بدلاً من زر التثبيت المباشر
  if (isIOS) {
    return (
      <div className="bg-ruby-50 p-4 rounded-2xl border border-ruby-100 mt-4 animate-bounce">
        <p className="text-ruby-700 text-xs font-bold flex items-center justify-center gap-2">
           لتحميل التطبيق: اضغط على <Share size={16} /> ثم "إضافة للشاشة الرئيسية" <PlusSquare size={16} />
        </p>
      </div>
    );
  }

  if (!isAvailable) return null;

  return (
    <button
      onClick={handleInstall}
      className="w-full flex items-center justify-center gap-2 bg-ruby-500 text-white px-6 py-4 rounded-xl font-black shadow-lg hover:bg-ruby-600 transition-all active:scale-95"
    >
      <Download size={20} />
      ثبّت تطبيق مطعم المملكة الآن 📱
    </button>
  );
}