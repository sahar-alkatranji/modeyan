import React, { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { api } from '../services/api';

interface ShippingPolicy {
  id: number;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  price: number;
  estimated_days: number;
  is_active: boolean;
}

interface ShippingPolicyPageProps {
  onNavigate: (page: 'home') => void;
}

const ShippingPolicyPage: React.FC<ShippingPolicyPageProps> = ({ onNavigate }) => {
  const { t, lang } = useTranslation();
  const [policies, setPolicies] = useState<ShippingPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getShippingPolicies()
      .then(data => { setPolicies(data.filter(p => p.is_active)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getLocalizedName = (p: ShippingPolicy) =>
    lang === 'ar' ? (p.title_ar || p.title) : p.title;

  const getLocalizedDesc = (p: ShippingPolicy) =>
    lang === 'ar' ? (p.description_ar || p.description) : p.description;

  return (
    <section className="min-h-screen bg-brand-beige py-24 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-10 group"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('policy_shipping_back' as any)}
        </button>

        {/* Title */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-serif text-black mb-4">
            {t('policy_shipping_title' as any)}
          </h1>
          <div className="w-20 h-px bg-gray-300 mx-auto" />
        </div>

        {/* ═══════════════════════════════ */}
        {/* Section 1: Order Preparation  */}
        {/* ═══════════════════════════════ */}
        <div className="mb-12 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-6 border-b border-gray-100 bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <h2 className="text-xl font-serif text-black">
              {t('policy_preparation_title' as any)}
            </h2>
          </div>
          <div className="p-6">
            <p
              className="text-gray-600 leading-relaxed mb-4 text-sm"
              dangerouslySetInnerHTML={{ __html: t('policy_preparation_desc' as any) }}
            />
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-amber-800">
                {t('policy_preparation_note' as any)}
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════ */}
        {/* Section 2: Shipping Options    */}
        {/* ═══════════════════════════════ */}
        <div className="mb-12 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-6 border-b border-gray-100 bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-serif text-black">
              {t('policy_shipping_duration_title' as any)}
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-sm mb-6">
              {t('policy_shipping_duration_desc' as any)}
            </p>

            {/* API shipping policies */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              </div>
            ) : policies.length > 0 ? (
              <div className="space-y-3 mb-6">
                {policies.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{getLocalizedName(p)}</p>
                      <p className="text-xs text-gray-500 mt-1">{getLocalizedDesc(p)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {p.estimated_days} {lang === 'ar' ? 'أيام' : 'days'}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${p.price === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {p.price === 0
                          ? (lang === 'ar' ? 'مجاني' : 'Free')
                          : `${p.price.toLocaleString()} SYP`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback to static table when API returns empty */
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-5 py-3 text-start font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        {lang === 'ar' ? 'المنطقة' : 'Region'}
                      </th>
                      <th className="px-5 py-3 text-start font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        {lang === 'ar' ? 'المدة' : 'Duration'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 flex items-center gap-2">
                        <span className="text-lg">🏙️</span>
                        <span className="font-medium text-gray-800">{t('policy_shipping_local' as any)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          {t('policy_shipping_local_time' as any)}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 flex items-center gap-2">
                        <span className="text-lg">🗺️</span>
                        <span className="font-medium text-gray-800">{t('policy_shipping_syria' as any)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          {t('policy_shipping_syria_time' as any)}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 flex items-center gap-2">
                        <span className="text-lg">✈️</span>
                        <span className="font-medium text-gray-800">{t('policy_shipping_international' as any)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                          {t('policy_shipping_international_time' as any)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4 italic">
              {t('policy_shipping_note' as any)}
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════ */}
        {/* Section 3: Shipping Fees      */}
        {/* ═══════════════════════════════ */}
        <div className="mb-12 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-6 border-b border-gray-100 bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-serif text-black">
              {t('policy_fees_title' as any)}
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 text-sm mb-6">
              {t('policy_fees_desc' as any)}
            </p>

            {/* Show API prices when available */}
            {policies.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎁</span>
                    <div>
                      <p className="font-bold text-green-800 text-sm">{t('policy_fees_free' as any)}</p>
                      <p className="text-xs text-green-600">{t('policy_fees_free_desc' as any)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {policies.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        📦 {getLocalizedName(p)}
                      </span>
                      <span className={`font-bold text-sm px-3 py-1 rounded-full ${p.price === 0 ? 'text-green-700 bg-green-100' : 'text-blue-700 bg-blue-100'}`}>
                        {p.price === 0
                          ? (lang === 'ar' ? 'مجاني' : 'Free')
                          : `${p.price.toLocaleString()} SYP`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎁</span>
                    <div>
                      <p className="font-bold text-green-800 text-sm">{t('policy_fees_free' as any)}</p>
                      <p className="text-xs text-green-600">{t('policy_fees_free_desc' as any)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span>🏙️</span> {t('policy_fees_local_rate' as any).split(':')[0]}
                    </span>
                    <span className="font-bold text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
                      {t('policy_fees_local_rate' as any).split(':')[1]?.trim() || (lang === 'ar' ? 'مجاني' : 'Free')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span>🗺️</span> {t('policy_fees_syria_rate' as any).split(':')[0]}
                    </span>
                    <span className="font-bold text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                      {t('policy_fees_syria_rate' as any).split(':')[1]?.trim() || (lang === 'ar' ? 'يُحدد عند الطلب' : 'TBD')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span>✈️</span> {t('policy_fees_international_rate' as any).split(':')[0]}
                    </span>
                    <span className="font-bold text-sm text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                      {t('policy_fees_international_rate' as any).split(':')[1]?.trim() || (lang === 'ar' ? 'يُحدد حسب الوزن' : 'By weight')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* ═══════════════════════════════ */}
        {/* Section 4: Track Your Order   */}
        {/* ═══════════════════════════════ */}
        <div className="mb-12 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-6 border-b border-gray-100 bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h2 className="text-xl font-serif text-black">
              {t('policy_tracking_title' as any)}
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-sm mb-8">
              {t('policy_tracking_desc' as any)}
            </p>

            {/* Timeline Steps */}
            <div className="relative">
              <div className="absolute right-5 top-0 bottom-0 w-px bg-gray-200 hidden rtl:block ltr:left-5 ltr:right-auto" style={{left: '20px'}} />

              <div className="space-y-6">
                {[
                  { step: 1, key: 'step1', color: 'bg-green-500', icon: '✓' },
                  { step: 2, key: 'step2', color: 'bg-blue-500', icon: '⚙' },
                  { step: 3, key: 'step3', color: 'bg-purple-500', icon: '🚚' },
                  { step: 4, key: 'step4', color: 'bg-amber-500', icon: '📦' },
                ].map(({ step, key, color, icon }) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm`}>
                      {icon}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        {t(`policy_tracking_${key}` as any)}
                      </p>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        {t(`policy_tracking_${key}_desc` as any)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help note */}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-xs text-gray-500 mb-2">{t('policy_tracking_help' as any)}</p>
              <a href="mailto:bsaman710@gmail.com" className="text-xs font-bold text-black hover:underline block">
                📧 bsaman710@gmail.com
              </a>
              <a href="tel:+0969656346" className="text-xs font-bold text-black hover:underline block mt-1">
                📞 +0969656346
              </a>
            </div>
          </div>
        </div>

        {/* Contact CTA */}

        <div className="text-center p-8 bg-black text-white rounded-2xl">
          <p className="text-sm text-gray-400 mb-3">{t('policy_contact_us' as any)}</p>
          <a
            href={`mailto:${t('policy_contact_email' as any)}`}
            className="text-white font-serif text-lg hover:text-gray-300 transition-colors block mb-2"
          >
            📧 {t('policy_contact_email' as any)}
          </a>
          <a
            href={`tel:${t('policy_contact_phone' as any)}`}
            className="text-white font-serif text-lg hover:text-gray-300 transition-colors block"
          >
            📞 {t('policy_contact_phone' as any)}
          </a>
        </div>

      </div>
    </section>
  );
};

export default ShippingPolicyPage;
