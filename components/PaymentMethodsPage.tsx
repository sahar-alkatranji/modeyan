import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface PaymentMethodsPageProps {
  onNavigate: (page: 'home') => void;
}

const METHODS = [
  { name: 'Stripe', descKey: 'payment_stripe_desc', icon: '💳', color: 'bg-indigo-50 border-indigo-200' },
  { name: 'PayPal', descKey: 'payment_paypal_desc', icon: '🅿️', color: 'bg-blue-50 border-blue-200' },
  { name: 'Syriatel Cash', descKey: 'payment_syriatel_desc', icon: '📱', color: 'bg-red-50 border-red-200' },
  { name: 'MTN Cash', descKey: 'payment_mtn_desc', icon: '📲', color: 'bg-yellow-50 border-yellow-200' },
  { name: 'Sham Cash', descKey: 'payment_sham_desc', icon: '💰', color: 'bg-green-50 border-green-200' },
  { name: 'Bank Al Baraka', descKey: 'payment_baraka_desc', icon: '🏦', color: 'bg-gray-50 border-gray-200' },
];

const PaymentMethodsPage: React.FC<PaymentMethodsPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <section className="min-h-screen bg-brand-beige py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-10 group"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('policy_shipping_back' as any)}
        </button>

        <div className="text-center mb-14">
          <h1 className="text-5xl font-serif text-black mb-4">{t('payment_page_title' as any)}</h1>
          <p className="text-gray-600">{t('payment_page_subtitle' as any)}</p>
          <div className="w-20 h-px bg-brand-gold mx-auto mt-6" />
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-12">
          {METHODS.map(m => (
            <div key={m.name} className={`flex items-start gap-4 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow`}>
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl flex-shrink-0 ${m.color}`}>
                {m.icon}
              </div>
              <div>
                <h3 className="font-bold text-black mb-1">{m.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{t(m.descKey as any)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-800">{t('payment_page_note' as any)}</p>
        </div>
      </div>
    </section>
  );
};

export default PaymentMethodsPage;
