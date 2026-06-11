import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface StorePolicyPageProps {
  onNavigate: (page: 'home') => void;
}

const SECTIONS = [
  {
    titleKey: 'store_policy_return_title',
    textKey: 'store_policy_return_text',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
      </svg>
    ),
  },
  {
    titleKey: 'store_policy_privacy_title',
    textKey: 'store_policy_privacy_text',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    titleKey: 'store_policy_terms_title',
    textKey: 'store_policy_terms_text',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const StorePolicyPage: React.FC<StorePolicyPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <section className="min-h-screen bg-brand-beige py-24 px-6">
      <div className="max-w-3xl mx-auto">
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
          <h1 className="text-5xl font-serif text-black mb-4">{t('store_policy_title' as any)}</h1>
          <p className="text-gray-600">{t('store_policy_subtitle' as any)}</p>
          <div className="w-20 h-px bg-brand-gold mx-auto mt-6" />
        </div>

        <div className="space-y-8">
          {SECTIONS.map(section => (
            <div key={section.titleKey} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-6 border-b border-gray-100 bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                  {section.icon}
                </div>
                <h2 className="text-xl font-serif text-black">{t(section.titleKey as any)}</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 leading-relaxed text-sm">{t(section.textKey as any)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StorePolicyPage;
