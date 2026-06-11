import React, { useState } from 'react';
import { CartItem } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

type ShippingMethod = 'normal' | 'express';

const FREE_SHIPPING_THRESHOLD = 1000; // SYP
const SHIPPING_COSTS: Record<ShippingMethod, number> = { normal: 50, express: 120 };
const SHIPPING_DAYS: Record<ShippingMethod, [number, number]> = { normal: [5, 7], express: [2, 3] };

interface CheckoutPageProps {
  cartItems: CartItem[];
  onOrderPlaced: () => void;
  onNavigate: (page: 'home' | 'shop' | 'login' | 'policy-shipping') => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ cartItems, onOrderPlaced, onNavigate }) => {
  const { t, lang } = useTranslation();
  const { isAuthenticated } = useAuth();

  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<ShippingMethod>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShipping = subtotal > FREE_SHIPPING_THRESHOLD;
  const shippingFee = freeShipping ? 0 : SHIPPING_COSTS[method];
  const total = subtotal + shippingFee;

  const [minDays, maxDays] = SHIPPING_DAYS[method];
  const fmtDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toLocaleDateString(lang === 'ar' ? 'ar-SY' : 'en-US', { day: 'numeric', month: 'long' });
  };

  const inputClass = "w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark transition-all";

  const handlePlaceOrder = async () => {
    setError(null);
    if (!city.trim() || !street.trim() || !phone.trim()) {
      setError(t('checkout_fill_required' as any));
      return;
    }
    setSubmitting(true);
    try {
      const address = [city, area, street, building].filter(Boolean).join(', ');
      const methodLabel = method === 'normal'
        ? `${t('checkout_method_normal' as any)} (${t('checkout_method_normal_desc' as any)})`
        : `${t('checkout_method_express' as any)} (${t('checkout_method_express_desc' as any)})`;
      const itemsText = cartItems
        .map(item => `- ${t(item.product.name as any)} | ${t('product_modal_size')}: ${item.size} | ${t('checkout_qty' as any)}: ${item.quantity} | ${item.product.price.toFixed(2)}`)
        .join('\n');
      const notes = [
        `[CART CHECKOUT]`,
        itemsText,
        `${t('checkout_shipping_address' as any)}: ${address}`,
        `${t('checkout_phone' as any)}: ${phone}`,
        `${t('checkout_shipping_method' as any)}: ${methodLabel}`,
        `${t('checkout_shipping_fee' as any)}: ${freeShipping ? t('checkout_free' as any) : `${shippingFee} SYP`}`,
        `${t('checkout_total' as any)}: ${total.toFixed(2)}`,
      ].join('\n');

      // One order per cart line so each dress can be quoted/tracked separately.
      for (const item of cartItems) {
        await api.createOrder({
          design_id: typeof item.product.id === 'number' ? item.product.id : undefined,
          design_type: 'ready',
          notes,
        });
      }
      setSuccess(true);
      onOrderPlaced();
      window.scrollTo(0, 0);
    } catch (e: any) {
      setError(e.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="min-h-screen bg-brand-beige py-24 px-6 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif text-black mb-3">{t('checkout_success_title' as any)}</h1>
          <p className="text-gray-600 mb-8">{t('checkout_success_text' as any)}</p>
          <p className="text-sm text-gray-500 mb-8">
            {t('checkout_estimated_delivery' as any)}: <b className="text-black">{fmtDate(minDays)} – {fmtDate(maxDays)}</b>
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="px-8 py-3 bg-black text-white font-semibold tracking-widest text-sm hover:bg-gray-800 transition rounded-lg"
          >
            {t('checkout_back_to_shop' as any)}
          </button>
        </div>
      </section>
    );
  }

  if (cartItems.length === 0) {
    return (
      <section className="min-h-screen bg-brand-beige py-24 px-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-6">{t('checkout_empty_cart' as any)}</p>
          <button
            onClick={() => onNavigate('shop')}
            className="px-8 py-3 bg-black text-white font-semibold tracking-widest text-sm hover:bg-gray-800 transition rounded-lg"
          >
            {t('checkout_back_to_shop' as any)}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-brand-beige py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif text-black mb-2">{t('checkout_title' as any)}</h1>
          <p className="text-gray-600">{t('checkout_subtitle' as any)}</p>
          <div className="w-20 h-px bg-brand-gold mx-auto mt-4" />
        </div>

        {!isAuthenticated && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-amber-800">{t('checkout_login_required' as any)}</p>
            <button
              onClick={() => onNavigate('login')}
              className="px-5 py-2 bg-black text-white text-xs font-bold tracking-widest rounded-lg hover:bg-gray-800 transition"
            >
              {t('checkout_login_button' as any)}
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <div className="space-y-8">
            {/* Shipping address */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-serif text-black mb-6 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                {t('checkout_shipping_address' as any)}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('checkout_city' as any)} *</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('checkout_area' as any)}</label>
                  <input type="text" value={area} onChange={e => setArea(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('checkout_street' as any)} *</label>
                  <input type="text" value={street} onChange={e => setStreet(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('checkout_building' as any)}</label>
                  <input type="text" value={building} onChange={e => setBuilding(e.target.value)} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('checkout_phone' as any)} *</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" className={inputClass} placeholder="+963 ..." />
                </div>
              </div>
            </div>

            {/* Shipping method */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-serif text-black mb-2 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a2 2 0 104 0m-4 0a2 2 0 11-4 0m10 0a2 2 0 104 0" />
                  </svg>
                </span>
                {t('checkout_shipping_method' as any)}
              </h2>
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-5 inline-block">
                🎁 {t('checkout_free_shipping_note' as any)}
              </p>
              <div className="space-y-3">
                {(['normal', 'express'] as ShippingMethod[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-start ${
                      method === m ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <span>
                      <span className="block font-semibold text-black text-sm">
                        {t(m === 'normal' ? 'checkout_method_normal' : 'checkout_method_express' as any)}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {t(m === 'normal' ? 'checkout_method_normal_desc' : 'checkout_method_express_desc' as any)}
                      </span>
                    </span>
                    <span className={`text-sm font-bold ${freeShipping ? 'text-green-600' : 'text-black'}`}>
                      {freeShipping ? t('checkout_free' as any) : `${SHIPPING_COSTS[m]} ${lang === 'ar' ? 'ل.س' : 'SYP'}`}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-5">
                📦 {t('checkout_estimated_delivery' as any)}: <b className="text-black">{fmtDate(minDays)} – {fmtDate(maxDays)}</b>
              </p>
              <button
                onClick={() => onNavigate('policy-shipping')}
                className="mt-3 text-xs text-gray-500 underline hover:text-black transition"
              >
                {t('checkout_view_shipping_policy' as any)}
              </button>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8 lg:sticky lg:top-24">
            <h2 className="text-xl font-serif text-black mb-6">{t('checkout_order_summary' as any)}</h2>
            <ul className="space-y-4 mb-6 max-h-72 overflow-y-auto">
              {cartItems.map(item => (
                <li key={`${item.product.id}-${item.size}`} className="flex items-center gap-3">
                  <img src={item.product.imageUrls[0]} alt="" className="w-14 h-16 object-cover rounded-lg border border-gray-200" />
                  <div className="flex-grow text-sm min-w-0">
                    <p className="font-semibold text-black truncate">{t(item.product.name as any)}</p>
                    <p className="text-gray-500 text-xs">{t('product_modal_size')}: {item.size} · {t('checkout_qty' as any)}: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-black flex-shrink-0">${(item.product.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{t('checkout_items_subtotal' as any)}</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t('checkout_shipping_fee' as any)}</span>
                <span className={freeShipping ? 'text-green-600 font-bold' : ''}>
                  {freeShipping ? t('checkout_free' as any) : `${shippingFee} ${lang === 'ar' ? 'ل.س' : 'SYP'}`}
                </span>
              </div>
              <div className="flex justify-between text-black font-bold text-base pt-2 border-t border-gray-100">
                <span>{t('checkout_total' as any)}</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            {error && <p className="text-red-600 text-xs mt-4">{error}</p>}
            <button
              onClick={handlePlaceOrder}
              disabled={submitting || !isAuthenticated}
              className="w-full mt-6 py-4 bg-black text-white font-semibold tracking-widest text-sm hover:bg-gray-800 transition rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('checkout_placing_order' as any) : t('checkout_place_order' as any)}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheckoutPage;
