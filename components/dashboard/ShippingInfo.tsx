import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { glassCardClass } from './DashboardShared';

// "طلبات الشحن" — shipping policy info shown inside the dashboard (dark luxury theme)
export const ShippingInfo: React.FC = () => {
  const { t, lang } = useTranslation();
  const isAr = lang === 'ar';

  const methods = [
    { labelKey: 'shipping_info_normal_label', duration: isAr ? '5-7 أيام' : '5-7 days', cost: isAr ? '50 ل.س' : '50 SYP', icon: '🚚' },
    { labelKey: 'shipping_info_express_label', duration: isAr ? '2-3 أيام' : '2-3 days', cost: isAr ? '120 ل.س' : '120 SYP', icon: '⚡' },
    { labelKey: 'shipping_info_free_label', duration: isAr ? '5-7 أيام' : '5-7 days', cost: t('shipping_info_free_value' as any), icon: '🎁' },
  ];

  const steps = [
    { titleKey: 'shipping_info_step_confirmed', descKey: 'shipping_info_step_confirmed_desc', color: 'bg-green-500', icon: '✓' },
    { titleKey: 'shipping_info_step_processing', descKey: 'shipping_info_step_processing_desc', color: 'bg-blue-500', icon: '⚙' },
    { titleKey: 'shipping_info_step_shipped', descKey: 'shipping_info_step_shipped_desc', color: 'bg-purple-500', icon: '🚚' },
    { titleKey: 'shipping_info_step_delivered', descKey: 'shipping_info_step_delivered_desc', color: 'bg-brand-gold', icon: '📦' },
  ];

  return (
    <div className="animate-fade-in text-start">
      <div className="mb-8">
        <h2 className="text-4xl font-serif font-bold text-white mb-2 tracking-wide">{t('shipping_info_title' as any)}</h2>
        <div className="w-16 h-0.5 bg-brand-gold mb-3"></div>
        <p className="text-base text-gray-300">{t('shipping_info_subtitle' as any)}</p>
      </div>

      {/* Preparation time */}
      <div className={glassCardClass + ' p-6 mb-6'}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl">🧵</div>
          <h3 className="text-xl font-serif text-white">{t('shipping_info_prep_title' as any)}</h3>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{t('shipping_info_prep_text' as any)}</p>
      </div>

      {/* Shipping durations */}
      <div className={glassCardClass + ' p-6 mb-6'}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl">⏱</div>
          <h3 className="text-xl font-serif text-white">{t('shipping_info_duration_title' as any)}</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {methods.map(m => (
            <div key={m.labelKey} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-brand-gold/40 transition-colors">
              <div className="text-2xl mb-2">{m.icon}</div>
              <p className="font-bold text-white text-sm mb-1">{t(m.labelKey as any)}</p>
              <p className="text-xs text-gray-400">{m.duration}</p>
              <p className="text-sm text-brand-gold font-bold mt-2">{m.cost}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fees table */}
      <div className={glassCardClass + ' p-6 mb-6 overflow-x-auto'}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl">💳</div>
          <h3 className="text-xl font-serif text-white">{t('shipping_info_fees_title' as any)}</h3>
        </div>
        <table className="w-full text-start min-w-[420px]">
          <thead className="bg-white/5 text-gray-300 uppercase text-xs font-bold tracking-[0.15em] border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-start">{t('shipping_info_fees_method' as any)}</th>
              <th className="px-4 py-3 text-start">{t('shipping_info_fees_duration' as any)}</th>
              <th className="px-4 py-3 text-start">{t('shipping_info_fees_cost' as any)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-sm">
            {methods.map(m => (
              <tr key={m.labelKey} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white font-medium">{m.icon} {t(m.labelKey as any)}</td>
                <td className="px-4 py-3 text-gray-300">{m.duration}</td>
                <td className="px-4 py-3 text-brand-gold font-bold">{m.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tracking steps */}
      <div className={glassCardClass + ' p-6'}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl">📍</div>
          <h3 className="text-xl font-serif text-white">{t('shipping_info_tracking_title' as any)}</h3>
        </div>
        <p className="text-sm text-gray-400 mb-6">{t('shipping_info_tracking_text' as any)}</p>
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={step.titleKey} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-lg`}>
                  {step.icon}
                </div>
                {i < steps.length - 1 && <div className="w-px h-6 bg-white/20 mt-2" />}
              </div>
              <div className="flex-1 pt-1.5">
                <p className="font-semibold text-white text-sm mb-1">{t(step.titleKey as any)}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{t(step.descKey as any)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
