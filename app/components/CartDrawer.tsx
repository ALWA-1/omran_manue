'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2, Loader2, Utensils, MapPin } from 'lucide-react';

const cartDict = {
    ar: {
        cartTitle: 'سلة المشتريات', checkoutTitle: 'إتمام الطلب', successTitle: 'تم بنجاح!',
        emptyCart: 'سلتك فارغة تماماً!', browseMenu: 'تصفح المنيو', subtotal: 'المجموع الفرعي:',
        proceedToCheckout: 'متابعة الدفع', delivery: 'توصيل للمنزل', dineIn: 'طلب صالة',
        customerName: 'الاسم الكريم *', customerPhone: 'رقم الهاتف *', deliveryArea: 'منطقة التوصيل *',
        selectArea: 'اختر المنطقة...', fullAddress: 'العنوان التفصيلي *', addressPlaceholder: 'القطعة، الشارع، المبنى، الشقة...',
        tableNumber: 'رقم الطاولة *', tablePlaceholder: 'مثال: 5', kitchenNotes: 'ملاحظات إضافية للمطبخ (اختياري)',
        notesPlaceholder: 'بدون بصل، زيادة صوص...', total: 'المجموع:', deliveryFee: 'التوصيل:',
        grandTotal: 'الإجمالي المطلوب:', cashOnDelivery: '💵 الدفع نقداً عند الاستلام', confirmOrder: 'تأكيد وإرسال الطلب',
        orderReceived: 'تم استلام طلبك!', orderNumber: 'رقم الطلب:', successMsg: 'جاري تحضير طلبك بكل حب. سنتواصل معك قريباً.',
        backToMenu: 'العودة للمنيو', loading: 'جاري الإرسال...'
    },
    en: {
        cartTitle: 'Shopping Cart', checkoutTitle: 'Checkout', successTitle: 'Success!',
        emptyCart: 'Your cart is completely empty!', browseMenu: 'Browse Menu', subtotal: 'Subtotal:',
        proceedToCheckout: 'Proceed to Checkout', delivery: 'Home Delivery', dineIn: 'Dine-in Order',
        customerName: 'Full Name *', customerPhone: 'Phone Number *', deliveryArea: 'Delivery Area *',
        selectArea: 'Select Area...', fullAddress: 'Detailed Address *', addressPlaceholder: 'Block, Street, Building, Apartment...',
        tableNumber: 'Table Number *', tablePlaceholder: 'e.g., 5', kitchenNotes: 'Extra Kitchen Notes (Optional)',
        notesPlaceholder: 'No onions, extra sauce...', total: 'Total:', deliveryFee: 'Delivery Fee:',
        grandTotal: 'Grand Total:', cashOnDelivery: '💵 Cash on Delivery', confirmOrder: 'Confirm & Send Order',
        orderReceived: 'Order Received!', orderNumber: 'Order Number:', successMsg: 'Preparing your order with love. We will contact you soon.',
        backToMenu: 'Back to Menu', loading: 'Submitting...'
    }
};

interface CartDrawerProps {
    lang?: 'ar' | 'en';
    currency?: string;
}

export default function CartDrawer({ lang = 'ar', currency = 'د.ب' }: CartDrawerProps) {
    const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
    const [view, setView] = useState<'cart' | 'checkout' | 'success'>('cart');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, setOrderId] = useState<number | null>(null);

    const [orderType, setOrderType] = useState<'dine_in' | 'delivery'>('delivery');
    const [areas, setAreas] = useState<any[]>([]);
    const [selectedArea, setSelectedArea] = useState<any>(null);

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (view === 'checkout' && areas.length === 0) {
            supabase.from('delivery_areas').select('*').eq('is_active', true).then(({ data }) => {
                if (data) setAreas(data);
            });
        }
    }, [view, areas.length]);

    const isAr = lang === 'ar';
    const t = isAr ? cartDict.ar : cartDict.en;

    const formatPrice = (amount: number) => {
        return `${amount.toFixed(3)} ${currency}`;
    };

    const deliveryFee = orderType === 'delivery' && selectedArea ? selectedArea.delivery_fee : 0;
    const grandTotal = totalPrice + deliveryFee;

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;
        setIsSubmitting(true);

        try {
            const orderData = {
                order_type: orderType,
                status: 'pending',
                customer_name: customerName,
                customer_phone: customerPhone,
                table_number: orderType === 'dine_in' ? tableNumber : null,
                delivery_address: orderType === 'delivery' ? address : null,
                delivery_area_id: orderType === 'delivery' && selectedArea ? selectedArea.id : null,
                order_items: cart, 
                items_total: totalPrice, 
                notes: notes,
                delivery_fee: deliveryFee,
                grand_total: grandTotal
            };

            const { data, error } = await supabase.from('orders').insert([orderData]).select('id').single();
            if (error) throw error;

            setOrderId(data.id);
            setView('success');
            clearCart();
        } catch (error: any) {
            alert((isAr ? 'حدث خطأ: ' : 'Error: ') + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetDrawer = () => {
        setIsCartOpen(false);
        setTimeout(() => { setView('cart'); setOrderId(null); }, 300);
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetDrawer} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" />

                    <motion.div
                        initial={{ x: isAr ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: isAr ? '100%' : '-100%' }} transition={{ type: 'tween', duration: 0.3 }}
                        className={`fixed top-0 ${isAr ? 'right-0' : 'left-0'} h-full w-full sm:w-[420px] bg-white z-[70] shadow-2xl flex flex-col`}
                        dir={isAr ? 'rtl' : 'ltr'}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                {view === 'checkout' && (
                                    <button onClick={() => setView('cart')} className="p-2 bg-white rounded-full text-slate-500 shadow-sm hover:text-ruby-500">
                                        <ArrowRight size={18} className={isAr ? "" : "rotate-180"} />
                                    </button>
                                )}
                                <h2 className="text-xl font-black text-slate-800">
                                    {view === 'cart' ? t.cartTitle : view === 'checkout' ? t.checkoutTitle : t.successTitle}
                                </h2>
                            </div>
                            <button onClick={resetDrawer} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm transition-colors"><X size={20} /></button>
                        </div>

                        {view === 'cart' && (
                            <>
                                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                                    {cart.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                                            <ShoppingBag size={64} className="text-slate-200" />
                                            <p className="font-bold text-lg">{t.emptyCart}</p>
                                            <button onClick={resetDrawer} className="px-6 py-2 text-ruby-500 bg-ruby-50 rounded-full font-bold text-sm hover:bg-ruby-100 transition-colors">{t.browseMenu}</button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            {cart.map((item) => (
                                                <div key={item.id} className="flex gap-4 bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                                                    <img src={item.image_url} alt="" className="w-20 h-20 rounded-xl object-cover bg-slate-100" />
                                                    <div className="flex-1 flex flex-col justify-between">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{isAr ? item.name_ar : item.name_en}</h4>
                                                            <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-2">
                                                            <span className="font-black text-ruby-600">{formatPrice(item.price * item.quantity)}</span>
                                                            <div className="flex items-center gap-3 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                                                <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-500 hover:text-ruby-500"><Minus size={14} /></button>
                                                                <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                                                <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-500 hover:text-ruby-500"><Plus size={14} /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {cart.length > 0 && (
                                    <div className="p-5 bg-slate-50 border-t border-slate-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="font-bold text-slate-500">{t.subtotal}</span>
                                            <span className="font-black text-xl text-slate-800">{formatPrice(totalPrice)}</span>
                                        </div>
                                        <button onClick={() => setView('checkout')} className="w-full py-4 bg-ruby-500 hover:bg-ruby-600 text-white rounded-xl font-bold text-lg shadow-[0_4px_15px_rgba(225,29,72,0.3)] flex justify-center items-center gap-2">
                                            {t.proceedToCheckout} <ArrowRight size={20} className={isAr ? "rotate-180" : ""} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {view === 'checkout' && (
                            <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-6">
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button type="button" onClick={() => setOrderType('delivery')} className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all ${orderType === 'delivery' ? 'bg-white text-ruby-600 shadow-sm' : 'text-slate-500'}`}><MapPin size={16} /> {t.delivery}</button>
                                        <button type="button" onClick={() => setOrderType('dine_in')} className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all ${orderType === 'dine_in' ? 'bg-white text-ruby-600 shadow-sm' : 'text-slate-500'}`}><Utensils size={16} /> {t.dineIn}</button>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder={t.customerName} />
                                        {orderType === 'delivery' ? (
                                            <>
                                                <input type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl ${isAr ? 'text-right' : 'text-left'}`} dir="ltr" placeholder={t.customerPhone} />
                                                <select required onChange={(e) => setSelectedArea(areas.find(a => a.id === Number(e.target.value)))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                    <option value="">{t.selectArea}</option>
                                                    {areas.map(area => <option key={area.id} value={area.id}>{isAr ? area.name_ar : area.name_en} (+{area.delivery_fee} {currency})</option>)}
                                                </select>
                                                <textarea required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-20" placeholder={t.fullAddress}></textarea>
                                            </>
                                        ) : (
                                            <input type="text" required value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-black" placeholder={t.tableNumber} />
                                        )}
                                        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder={t.kitchenNotes} />
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                                        <span>{t.total}</span> <span>{formatPrice(totalPrice)}</span>
                                    </div>
                                    {orderType === 'delivery' && (
                                        <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                                            <span>{t.deliveryFee}</span> <span>{formatPrice(deliveryFee)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-black text-slate-800 text-lg">{t.grandTotal}</span>
                                        <span className="font-black text-ruby-600 text-2xl">{formatPrice(grandTotal)}</span>
                                    </div>
                                    <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-3 rounded-lg text-center mb-2 border border-emerald-100">
                                        {t.cashOnDelivery}
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : t.confirmOrder}
                                    </button>
                                </div>
                            </form>
                        )}

                        {view === 'success' && (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-emerald-500 text-white">
                                <CheckCircle2 size={100} className="mb-6 opacity-90" />
                                <h2 className="text-3xl font-black mb-2">{t.orderReceived}</h2>
                                <p className="font-bold opacity-90 text-lg mb-8">{t.orderNumber} #{orderId}</p>
                                <p className="text-sm opacity-80 mb-8 leading-relaxed">{t.successMsg}</p>
                                <button onClick={resetDrawer} className="px-8 py-3 bg-white text-emerald-600 rounded-full font-black shadow-lg hover:scale-105 transition-transform">{t.backToMenu}</button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}