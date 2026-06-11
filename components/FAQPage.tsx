import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface FAQPageProps {
  onNavigate: (page: 'home') => void;
}

const FAQ_COUNT = 8;

const FAQPage: React.FC<FAQPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
          <h1 className="text-5xl font-serif text-black mb-4">{t('faq_title' as any)}</h1>
          <p className="text-gray-600">{t('faq_subtitle' as any)}</p>
          <div className="w-20 h-px bg-brand-gold mx-auto mt-6" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: FAQ_COUNT }, (_, i) => i + 1).map(n => {
            const isOpen = openIndex === n;
            return (
              <div key={n} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : n)}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-start hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-black">{t(`faq_q${n}` as any)}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {t(`faq_a${n}` as any)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQPage;
