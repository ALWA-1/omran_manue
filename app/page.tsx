'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, MapPin, Phone, LayoutGrid, List as ListIcon, 
  Loader2, MessageCircle, ShoppingBag, Plus, X, Share2, 
  Minus, ArrowRight, Menu as MenuIcon, Star, Send, ShoppingCart, Download 
} from 'lucide-react';
import { useCart } from './context/CartContext';
import CartDrawer from './components/CartDrawer'; 

const dict = {
  ar: {
    navMenu: 'القائمة', navContact: 'تواصل معنا', navFeedback: 'ملاحظات',
    heroBrowse: 'تصفح القائمة', heroContact: 'تواصل معنا',
    spicy: 'سبايسي', loading: 'جاري تحضير المنيو...', empty: 'لا توجد وجبات في هذا القسم', orderNow: 'اطلب الآن',
  },
  en: {
    navMenu: 'Menu', navContact: 'Contact Us', navFeedback: 'Feedback',
    heroBrowse: 'Browse Menu', heroContact: 'Contact Us',
    spicy: 'Spicy', loading: 'Loading menu...', empty: 'No items in this category', orderNow: 'Order',
  }
};

export default function Home() {
  const { cart, addToCart, updateQuantity, totalPrice, totalItems, isCartOpen, setIsCartOpen } = useCart();

  const [settings, setSettings] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); 
  const [lang, setLang] = useState<'ar' | 'en'>('ar'); 
  
  const [selectedItem, setSelectedItem] = useState<any>(null); 
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isClickScrolling, setIsClickScrolling] = useState(false);

  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackPhone, setFeedbackPhone] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // --- حالات الـ PWA الخاصة بزر التثبيت ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  
  // --- [إضافة جديدة] حالات الـ PWA الخاصة بـ iOS ---
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  // ------------------------------------------

  const sectionRefs = useRef<{ [key: number]: HTMLElement | null }>({});
  const categoryNavRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const t = dict[lang];
  const isAr = lang === 'ar';
  
  const currentCurrency = isAr ? (settings?.currency_ar || 'د.ب') : (settings?.currency_en || 'BHD');

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- مراقب حدث تثبيت التطبيق PWA ---
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // --- [إضافة جديدة] اكتشاف أجهزة iOS وحالة التثبيت ---
  useEffect(() => {
    // 1. فحص هل الجهاز آيفون أو آيباد
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 2. فحص هل التطبيق مثبت بالفعل (Standalone)
    const isStandAloneMatch = window.matchMedia('(display-mode: standalone)').matches;
    const isiOSStandalone = (window.navigator as any).standalone === true;
    setIsStandalone(isStandAloneMatch || isiOSStandalone);
  }, []);
  // ----------------------------------------------------

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    const [settingsRes, categoriesRes, itemsRes] = await Promise.all([
      supabase.from('restaurant_settings').select('*').eq('id', 1).single(),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('menu_items').select('*').eq('is_available', true).order('sort_order', { ascending: true })
    ]);

    if (settingsRes.data) setSettings(settingsRes.data);
    if (categoriesRes.data) {
      setCategories(categoriesRes.data);
      if (categoriesRes.data.length > 0) setActiveCategory(categoriesRes.data[0].id);
    }
    if (itemsRes.data) setItems(itemsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 60) {
        setIsNavVisible(currentScrollY < lastScrollY);
      } else {
        setIsNavVisible(true);
      }
      setLastScrollY(currentScrollY);

      if (isClickScrolling || categories.length === 0) return;
      
      let newActiveId = activeCategory;
      
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const section = sectionRefs.current[cat.id];
        
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 250 && rect.bottom > 250) {
            newActiveId = cat.id;
            break;
          }
        }
      }
      
      if (newActiveId !== activeCategory && newActiveId !== null) {
        setActiveCategory(newActiveId);
        
        const navItem = document.getElementById(`nav-cat-${newActiveId}`);
        const navContainer = categoryNavRef.current;
        if (navItem && navContainer) {
          const scrollLeft = navItem.offsetLeft - (navContainer.offsetWidth / 2) + (navItem.offsetWidth / 2);
          navContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeCategory, isClickScrolling, categories, lastScrollY]);

  const scrollToCategory = (categoryId: number) => {
    setIsClickScrolling(true);
    setActiveCategory(categoryId);
    
    const section = sectionRefs.current[categoryId];
    if (section) {
      const yOffset = -180; 
      const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      
      const navItem = document.getElementById(`nav-cat-${categoryId}`);
      const navContainer = categoryNavRef.current;
      if (navItem && navContainer) {
        const scrollLeft = navItem.offsetLeft - (navContainer.offsetWidth / 2) + (navItem.offsetWidth / 2);
        navContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
      
      setTimeout(() => setIsClickScrolling(false), 800);
    }
  };

  const scrollToMenu = () => {
    if (menuRef.current) {
      const yOffset = -20;
      const y = menuRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false); 
  };

  const openFeedbackModal = () => {
    window.dispatchEvent(new Event('open-feedback'));
    setIsMobileMenuOpen(false);
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert(isAr ? 'الرجاء اختيار التقييم بالنجوم أولاً' : 'Please select a star rating first');
    setIsSubmittingFeedback(true);
    try {
      await supabase.from('feedback').insert([{ rating, comment: feedbackComment, phone: feedbackPhone }]);
      alert(isAr ? 'تم إرسال تقييمك بنجاح. شكراً لك! ❤️' : 'Feedback submitted successfully. Thank you! ❤️');
      setIsFeedbackOpen(false);
      setRating(0); setFeedbackComment(''); setFeedbackPhone('');
    } catch (error) {
      alert('حدث خطأ');
    }
    setIsSubmittingFeedback(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2ECE4]">
        <Loader2 size={48} className="text-[#C8102E] animate-spin mb-4" />
        <p className="text-[#84796B] font-bold text-lg animate-pulse">{t.loading}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-10 font-sans selection:bg-red-200 relative" style={{ backgroundColor: '#F2ECE4', direction: isAr ? 'rtl' : 'ltr' }}>

      <header className={`fixed top-0 left-0 w-full h-16 md:h-20 bg-white/95 backdrop-blur-md shadow-sm z-50 flex items-center justify-between px-4 md:px-8 transition-transform duration-300 ${isNavVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer max-w-[55%]" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-white flex items-center justify-center border border-[#E8E2D9] shadow-sm shrink-0">
             {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-[8px] text-slate-400">Logo</span>
              )}
          </div>
          <span className="font-black text-[#222222] text-[13px] sm:text-base md:text-xl tracking-tight line-clamp-1">
             {isAr ? settings?.name_ar : settings?.name_en || settings?.name_ar}
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button onClick={scrollToMenu} className="font-bold text-[#6C635A] hover:text-[#C8102E] transition-colors text-[15px]">{t.navMenu}</button>
          <button onClick={() => setIsContactOpen(true)} className="font-bold text-[#6C635A] hover:text-[#C8102E] transition-colors text-[15px]">{t.navContact}</button>
          <button onClick={openFeedbackModal} className="font-bold text-[#6C635A] hover:text-[#C8102E] transition-colors text-[15px]">{t.navFeedback}</button>
        </nav>

        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
          
          {/* 📱 [تعديل] زر تثبيت التطبيق الموحد للجميع */}
          {!isStandalone && (canInstall || isIOS) && (
            <button
              onClick={() => {
                if (canInstall) {
                  handleInstallClick(); // تشغيل الأندرويد
                } else if (isIOS) {
                  setShowIOSModal(true); // فتح مودال الآيفون
                }
              }}
              className="flex items-center gap-1.5 bg-[#C8102E] text-white px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold animate-pulse shadow-md hover:bg-[#A00D24] transition-colors"
            >
              <Download size={14} />
              <span className="hidden sm:inline">{isAr ? 'تثبيت التطبيق' : 'Install App'}</span>
              <span className="sm:hidden">{isAr ? 'تثبيت' : 'Install'}</span>
            </button>
          )}

          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="font-bold text-[#84796B] hover:text-[#C8102E] text-[13px] sm:text-sm flex items-center gap-1">
            <Globe size={18} /> 
            <span>{lang === 'ar' ? 'EN' : 'عر'}</span>
          </button>
          
          <button onClick={() => setIsCartOpen(true)} className="relative text-[#222222] hover:text-[#C8102E] transition-colors bg-[#F2ECE4] p-2 md:p-2.5 rounded-full shrink-0">
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#C8102E] text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center justify-center shadow-sm border-2 border-white">
                {totalItems}
              </span>
            )}
          </button>
          
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-[#222222] p-1">
            <MenuIcon size={24} />
          </button>
        </div>
      </header>

      <div className="relative w-full h-[70vh] md:h-[85vh] min-h-[450px] mt-16 md:mt-20">
        {settings?.cover_url ? (
          <img src={settings.cover_url} alt="Hero Background" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-slate-800"></div>
        )}
        
        <div className="absolute top-[66%] left-0 w-full flex flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4 -translate-y-1/2 z-10">
          <button onClick={scrollToMenu} className="bg-[#222222] hover:bg-black text-white px-5 sm:px-8 py-3.5 rounded-xl font-bold text-[14px] sm:text-lg shadow-[0_8px_20px_rgba(0,0,0,0.3)] active:scale-95 transition-all flex justify-center text-center">
            {t.heroBrowse}
          </button>
          <button onClick={() => setIsContactOpen(true)} className="bg-transparent backdrop-blur-[2px] border-[2px] border-white text-white hover:bg-white/20 px-5 sm:px-8 py-3.5 rounded-xl font-bold text-[14px] sm:text-lg active:scale-95 transition-all flex justify-center text-center shadow-sm">
            {t.heroContact}
          </button>
        </div>
      </div>

      <div ref={menuRef}></div>

      <div className="sticky top-0 z-40 bg-[#F2ECE4]/70 backdrop-blur-xl pt-4 pb-2 border-b border-[#E8E2D9]/50 shadow-sm transition-all duration-300">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-4 overflow-x-auto px-4 pb-2 custom-scrollbar no-scrollbar" ref={categoryNavRef}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`nav-cat-${cat.id}`}
                onClick={() => scrollToCategory(cat.id)}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className={`w-[70px] h-[70px] rounded-full flex items-center justify-center transition-all overflow-hidden shadow-sm bg-white/90 border-2
                  ${activeCategory === cat.id ? 'border-[#C8102E] scale-105' : 'border-transparent group-hover:border-[#C8102E]/30'}`}>
                  {cat.image_url ? (
                    <img src={cat.image_url} alt="" className="w-full h-full object-cover p-1 rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-[#EAE5D9]/50"></div>
                  )}
                </div>
                <span className={`text-sm font-bold transition-all whitespace-nowrap ${activeCategory === cat.id ? 'text-[#C8102E] border-b-2 border-[#C8102E] pb-0.5' : 'text-[#6C635A]'}`}>
                  {isAr ? cat.name_ar : cat.name_en}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 mb-4 flex justify-end relative z-30">
        <div className="flex bg-[#E8E2D9] rounded-xl p-1 shadow-inner">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#222222]' : 'text-[#84796B]'}`}><LayoutGrid size={20} /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#222222]' : 'text-[#84796B]'}`}><ListIcon size={20} /></button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-10">
        {categories.map(cat => {
          const itemsInCategory = items.filter(item => item.category_id === cat.id);
          if (itemsInCategory.length === 0) return null;

          return (
            <div key={cat.id} ref={(el) => { sectionRefs.current[cat.id] = el; }} className="mb-10 pt-4">
              <h2 className="text-xl font-black text-[#222222] mb-6 border-b-[3px] border-[#84796B] pb-1 inline-block">
                {isAr ? cat.name_ar : cat.name_en}
              </h2>

              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {itemsInCategory.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)} 
                    className={`cursor-pointer group relative ${viewMode === 'list' ? 'flex items-start gap-4 mb-2' : 'flex flex-col'}`}
                  >
                    <div className={`relative overflow-hidden shrink-0 ${viewMode === 'list' ? 'w-[130px] h-[130px] rounded-[20px]' : 'w-full h-[220px] rounded-[24px] mb-3'}`}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover shadow-sm transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-[#E8E2D9] flex items-center justify-center text-sm text-[#84796B]">بدون صورة</div>
                      )}
                    </div>

                    <div className={`flex flex-col flex-grow ${viewMode === 'grid' ? 'items-center text-center px-2' : 'py-1'}`}>
                      <h3 className="font-bold text-[#222222] text-[18px] leading-tight mb-1.5">{isAr ? item.name_ar : item.name_en}</h3>
                      <p className={`text-[13px] text-[#84796B] font-medium leading-relaxed line-clamp-2 ${viewMode === 'grid' ? 'mb-4' : 'mb-2'}`}>
                        {isAr ? item.description_ar : item.description_en}
                      </p>
                      {item.tag && <span className={`text-[12px] font-bold text-[#4A4A4A] mb-2 ${viewMode === 'list' ? 'self-start' : ''}`}>{item.tag}</span>}

                      <div className={`mt-auto w-full flex items-center ${viewMode === 'list' ? 'justify-between' : 'justify-center gap-4'}`}>
                        <div className={`bg-[#84796B] text-white text-[13px] font-bold px-3 py-1.5 rounded-lg shadow-sm ${viewMode === 'list' && !isAr ? 'order-last' : ''}`}>
                          {item.price} {currentCurrency}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                          className="flex items-center justify-center gap-1.5 bg-[#C8102E] hover:bg-[#A00D24] text-white px-4 py-1.5 rounded-lg text-[13px] font-bold shadow-sm active:scale-95 transition-transform"
                        >
                          <Plus size={16} /> {t.orderNow}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex justify-end">
            <motion.div initial={{ x: isAr ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: isAr ? '100%' : '-100%' }} transition={{ type: 'tween', duration: 0.3 }} className="w-64 h-full bg-white shadow-2xl flex flex-col">
              <div className="flex justify-between items-center p-5 border-b border-[#E8E2D9]">
                <span className="font-black text-[#222222] text-lg">{isAr ? settings?.name_ar : settings?.name_en}</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#84796B] hover:text-[#C8102E] bg-[#F2ECE4] p-1.5 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="flex flex-col p-4 gap-2">
                <button onClick={() => { setIsMobileMenuOpen(false); scrollToMenu(); }} className="flex items-center gap-3 w-full text-start p-4 rounded-xl font-bold text-[#222222] hover:bg-[#F2ECE4] transition-colors">
                  <LayoutGrid size={20} className="text-[#C8102E]" /> {t.navMenu}
                </button>
                <button onClick={() => { setIsMobileMenuOpen(false); setIsContactOpen(true); }} className="flex items-center gap-3 w-full text-start p-4 rounded-xl font-bold text-[#222222] hover:bg-[#F2ECE4] transition-colors">
                  <Phone size={20} className="text-[#C8102E]" /> {t.navContact}
                </button>
                <button onClick={() => { setIsMobileMenuOpen(false); openFeedbackModal(); }} className="flex items-center gap-3 w-full text-start p-4 rounded-xl font-bold text-[#222222] hover:bg-[#F2ECE4] transition-colors">
                  <Star size={20} className="text-[#C8102E]" /> {t.navFeedback}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isContactOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[30px] p-6 w-full max-w-sm relative shadow-2xl">
              <button onClick={() => setIsContactOpen(false)} className="absolute top-4 right-4 bg-[#F2ECE4] text-[#84796B] hover:text-[#C8102E] p-2 rounded-full transition-colors"><X size={20}/></button>
              <h2 className="text-2xl font-black text-[#222222] text-center mb-6 mt-4">{t.navContact}</h2>
              <div className="grid grid-cols-2 gap-4">
                {settings?.phone && (
                  <a href={`tel:${settings.phone}`} className="flex flex-col items-center justify-center gap-3 bg-[#F2ECE4] hover:bg-[#E8E2D9] p-5 rounded-2xl transition-colors">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Phone size={24}/></div>
                    <span className="font-bold text-[#222222]">اتصال</span>
                  </a>
                )}
                {settings?.whatsapp && (
                  <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-3 bg-[#F2ECE4] hover:bg-[#E8E2D9] p-5 rounded-2xl transition-colors">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><MessageCircle size={24}/></div>
                    <span className="font-bold text-[#222222]">واتساب</span>
                  </a>
                )}
                {settings?.instagram && (
                  <a href={settings.instagram} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-3 bg-[#F2ECE4] hover:bg-[#E8E2D9] p-5 rounded-2xl transition-colors">
                    <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                      </svg>
                    </div>
                    <span className="font-bold text-[#222222]">انستجرام</span>
                  </a>
                )}
                {settings?.location_url && (
                  <a href={settings.location_url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-3 bg-[#F2ECE4] hover:bg-[#E8E2D9] p-5 rounded-2xl transition-colors">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center"><MapPin size={24}/></div>
                    <span className="font-bold text-[#222222]">الموقع</span>
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFeedbackOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[30px] p-6 w-full max-w-sm relative shadow-2xl">
              <button onClick={() => setIsFeedbackOpen(false)} className="absolute top-4 right-4 bg-[#F2ECE4] text-[#84796B] hover:text-[#C8102E] p-2 rounded-full transition-colors"><X size={20}/></button>
              <h2 className="text-2xl font-black text-[#222222] text-center mb-6 mt-4">{isAr ? 'شاركنا رأيك' : 'Feedback'}</h2>

              <form onSubmit={submitFeedback} className="flex flex-col gap-5">
                <div className="flex justify-center gap-2" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} onClick={() => setRating(star)} size={36} className={`cursor-pointer transition-colors ${star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-[#F2ECE4] text-[#E8E2D9]'}`} />
                  ))}
                </div>
                <div>
                  <label className="text-sm font-bold text-[#6C635A] mb-1 block">{isAr ? 'رقم الهاتف (اختياري)' : 'Phone (Optional)'}</label>
                  <input type="tel" value={feedbackPhone} onChange={(e) => setFeedbackPhone(e.target.value)} dir="ltr" className="w-full px-4 py-3 bg-[#F2ECE4] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#84796B] font-semibold text-[#222222]" />
                </div>
                <div>
                  <label className="text-sm font-bold text-[#6C635A] mb-1 block">{isAr ? 'ملاحظاتك' : 'Comments'}</label>
                  <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} required className="w-full px-4 py-3 bg-[#F2ECE4] border border-[#E8E2D9] rounded-xl focus:outline-none focus:border-[#84796B] font-semibold text-[#222222] h-24 resize-none"></textarea>
                </div>
                <button type="submit" disabled={isSubmittingFeedback} className="w-full py-4 bg-[#222222] hover:bg-black disabled:opacity-50 text-white rounded-xl font-bold text-lg shadow-md transition-colors flex justify-center items-center gap-2">
                  {isSubmittingFeedback ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> {isAr ? 'إرسال' : 'Submit'}</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-[80] bg-[#F2ECE4] flex flex-col overflow-hidden">
            <div className="relative w-full h-[45%] bg-slate-200 rounded-b-[40px] overflow-hidden shadow-sm">
              {selectedItem.image_url && <img src={selectedItem.image_url} alt="" className="w-full h-full object-cover" />}
              <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start">
                <button onClick={() => setSelectedItem(null)} className="w-11 h-11 bg-white/70 backdrop-blur-md rounded-full flex items-center justify-center text-[#222222] hover:bg-white shadow-sm transition-colors"><X size={24} /></button>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col relative z-10">
              <div className="flex justify-between items-start mb-6 mt-4">
                <h2 className="text-3xl font-black text-[#222222]">{isAr ? selectedItem.name_ar : selectedItem.name_en}</h2>
                <div className="bg-[#84796B] text-white font-bold px-5 py-2 rounded-xl text-lg shadow-sm shrink-0">
                  {selectedItem.price} {currentCurrency}
                </div>
              </div>
              <p className="text-[#6C635A] text-[17px] leading-relaxed font-medium flex-grow overflow-y-auto">{isAr ? selectedItem.description_ar : selectedItem.description_en}</p>
              <div className="pt-4 mt-auto pb-4">
                <button onClick={() => { addToCart(selectedItem); setSelectedItem(null); }} className="w-full py-4.5 bg-[#C8102E] hover:bg-[#A00D24] text-white rounded-2xl font-black text-[18px] shadow-[0_8px_20px_rgba(200,16,46,0.3)] transition-all flex justify-center items-center gap-3 active:scale-[0.98]">
                  <ShoppingBag size={22} /> {t.orderNow}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- [إضافة جديدة] المودال الخاص بإرشادات الآيفون --- */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowIOSModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }} 
              className="bg-white rounded-[30px] p-6 w-full max-w-sm relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowIOSModal(false)} 
                className="absolute top-4 right-4 bg-[#F2ECE4] text-[#84796B] hover:text-[#C8102E] p-2 rounded-full transition-colors"
              >
                <X size={20}/>
              </button>
              
              <div className="text-center mb-6 mt-2">
                <div className="w-16 h-16 bg-[#F2ECE4] text-[#C8102E] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                   <Download size={32} />
                </div>
                <h2 className="text-2xl font-black text-[#222222]">
                  {isAr ? 'تثبيت التطبيق' : 'Install App'}
                </h2>
                <p className="text-[#84796B] text-sm font-medium mt-2">
                  {isAr ? 'لتجربة أسرع وأفضل، قم بتثبيت التطبيق على هاتفك بخطوات بسيطة:' : 'For a better experience, install the app on your phone:'}
                </p>
              </div>

              <div className="flex flex-col gap-4 relative">
                <div className="absolute right-6 top-6 bottom-6 w-0.5 bg-[#E8E2D9] z-0 hidden md:block"></div>

                <div className="flex items-center gap-4 relative z-10 bg-[#F2ECE4] p-4 rounded-2xl">
                  <div className="w-10 h-10 shrink-0 bg-white border border-[#E8E2D9] rounded-full flex items-center justify-center shadow-sm">
                    <Share2 size={20} className="text-[#222222]" />
                  </div>
                  <p className="text-[#222222] font-bold text-sm leading-snug">
                    {isAr ? '1. اضغط على زر المشاركة أسفل المتصفح' : '1. Tap the Share button at the bottom'}
                  </p>
                </div>

                <div className="flex items-center gap-4 relative z-10 bg-[#F2ECE4] p-4 rounded-2xl">
                  <div className="w-10 h-10 shrink-0 bg-white border border-[#E8E2D9] rounded-full flex items-center justify-center shadow-sm">
                    <Plus size={22} className="text-[#222222]" />
                  </div>
                  <p className="text-[#222222] font-bold text-sm leading-snug">
                    {isAr ? '2. مرر لأسفل واختر "إضافة للشاشة الرئيسية"' : '2. Scroll down and select "Add to Home Screen"'}
                  </p>
                </div>

                <div className="flex items-center gap-4 relative z-10 bg-[#F2ECE4] p-4 rounded-2xl">
                  <div className="w-10 h-10 shrink-0 bg-[#C8102E] text-white rounded-full flex items-center justify-center shadow-md font-bold">
                    {isAr ? 'إضافة' : 'Add'}
                  </div>
                  <p className="text-[#222222] font-bold text-sm leading-snug">
                    {isAr ? '3. اضغط على زر "إضافة" في أعلى الشاشة' : '3. Tap "Add" at the top right'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowIOSModal(false)} 
                className="w-full mt-6 py-3.5 bg-[#222222] hover:bg-black text-white rounded-xl font-bold text-[15px] shadow-md transition-colors"
              >
                {isAr ? 'حسناً، فهمت' : 'Got it'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* -------------------------------------------------------- */}

      <CartDrawer lang={lang} currency={currentCurrency} />

      <AnimatePresence>
        {totalItems > 0 && !isCartOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-40 right-6 md:right-10 z-50 bg-[#C8102E] text-white p-4 md:p-5 rounded-full shadow-[0_8px_25px_rgba(200,16,46,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
          >
            <div className="relative">
              <ShoppingCart size={28} />
              <span className="absolute -top-3 -right-3 md:-top-4 md:-right-4 bg-white text-[#C8102E] w-6 h-6 md:w-7 md:h-7 rounded-full text-xs md:text-sm font-black flex items-center justify-center shadow-sm border-2 border-[#C8102E]">
                {totalItems}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

    </main>
  );
}
