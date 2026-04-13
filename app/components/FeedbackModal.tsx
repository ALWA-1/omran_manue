'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star, MessageSquare, X, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // استقبال أمر الفتح من الناف بار
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-feedback', handleOpen);
        return () => window.removeEventListener('open-feedback', handleOpen);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return alert('الرجاء اختيار التقييم بالنجوم أولاً');

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('feedback').insert([
                { rating, comment, phone }
            ]);
            if (error) throw error;

            setIsSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setIsSuccess(false);
                setRating(0);
                setComment('');
                setPhone('');
            }, 3000);
        } catch (error: any) {
            alert('حدث خطأ: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* زر التقييم العائم تم الحفاظ عليه لمن يفضله */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 md:right-10 z-30 bg-white text-slate-700 p-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-slate-100 hover:text-amber-500 hover:border-amber-200 hover:scale-105 transition-all group flex items-center gap-3"
            >
                <span className="font-bold text-sm hidden md:block group-hover:text-amber-500">قيّم تجربتك</span>
                <Star size={24} className="group-hover:fill-amber-500" />
            </button>

            {/* نافذة التقييم المنبثقة */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-3xl shadow-2xl z-[60] overflow-hidden"
                        >
                            {isSuccess ? (
                                <div className="p-10 flex flex-col items-center text-center">
                                    <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">شكراً لتقييمك!</h3>
                                    <p className="text-slate-500 font-semibold">رأيك يهمنا جداً ويساعدنا على تقديم الأفضل دائماً.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                                            <MessageSquare size={20} className="text-ruby-500" /> تقييم المطعم
                                        </div>
                                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-500 bg-white rounded-full p-1.5 shadow-sm transition-colors"><X size={18} /></button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                                        <div className="flex flex-col items-center gap-3">
                                            <p className="text-sm font-bold text-slate-500">ما هو تقييمك العام للتجربة؟</p>
                                            <div className="flex gap-2" dir="ltr">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setRating(star)}
                                                        onMouseEnter={() => setHoveredRating(star)}
                                                        onMouseLeave={() => setHoveredRating(0)}
                                                        className="transition-transform hover:scale-110"
                                                    >
                                                        <Star
                                                            size={36}
                                                            className={`transition-colors duration-200 ${star <= (hoveredRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'}`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">رقم الهاتف (اختياري)</label>
                                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-ruby-500 outline-none font-semibold text-slate-800 text-left" placeholder="+973 XXXXXXXX" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">ملاحظاتك (اختياري)</label>
                                                <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-ruby-500 outline-none font-semibold text-slate-800 resize-none h-24" placeholder="أخبرنا عن تجربتك..."></textarea>
                                            </div>
                                        </div>

                                        <button type="submit" disabled={isSubmitting || rating === 0} className="w-full py-4 bg-ruby-500 hover:bg-ruby-600 disabled:opacity-50 disabled:hover:bg-ruby-500 text-white rounded-xl font-bold text-lg shadow-[0_4px_15px_rgba(225,29,72,0.3)] transition-colors flex justify-center items-center gap-2 mt-2">
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> إرسال التقييم</>}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}