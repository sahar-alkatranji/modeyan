import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

export const ROLE_IMAGES = {
  customer: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop', // Fashion/Shopping
  designer: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1974&auto=format&fit=crop', // Sketching/Design
  tailor: 'https://images.unsplash.com/photo-1550920430-b3b4f624d783?q=80&w=2070&auto=format&fit=crop', // Woman sewing on machine
  manager: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop', // Boutique/Office
  default: 'https://i.pinimg.com/1200x/6a/8a/d1/6a8ad1d51775ca4922490cc273a4cd01.jpg' // Original Elegant Background
};

export const glassCardClass = "bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300";
export const glassInputClass = "w-full p-4 border border-white/20 bg-white/5 text-white text-base placeholder-gray-400 focus:bg-white/10 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all rounded-xl";
export const glassButtonClass = "w-full py-4 bg-white text-brand-dark font-bold tracking-[0.14em] text-sm hover:bg-brand-gold hover:text-white transition-all duration-300 rounded-xl uppercase shadow-lg transform hover:-translate-y-1";

export const GlassDropdown: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ options, value, onChange, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 border border-white/20 bg-white/5 text-white text-base text-start flex items-center justify-between focus:bg-white/10 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 transition-all rounded-xl cursor-pointer"
      >
        <span className="truncate">{selected?.label || placeholder || value}</span>
        <svg className={`w-4 h-4 text-brand-gold transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 left-0 right-0 z-20 bg-black/90 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-64 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full px-5 py-3 text-start text-sm font-medium transition-all flex items-center gap-3 ${
                  value === opt.value
                    ? 'bg-brand-gold/20 text-brand-gold border-l-2 border-brand-gold'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white border-l-2 border-transparent'
                }`}
              >
                {value === opt.value && (
                  <svg className="w-4 h-4 text-brand-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const Icon = ({ name, className = "w-3 h-3" }: { name: string, className?: string }) => {
    switch (name) {
        case 'grid': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
        case 'users': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
        case 'shopping-bag': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
        case 'credit-card': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
        case 'check-circle': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'settings': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
        case 'share': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
        case 'box': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
        case 'clipboard': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
        case 'logout': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
        case 'scissor': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>;
        case 'pencil': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
        case 'palette': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
        case 'sparkles': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
        default: return null;
    }
};

export const StatusPill = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const styles: Record<string, string> = {
      approved: 'bg-green-500/20 text-green-300 border-green-500/30',
      pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
      completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      cancelled: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      pending_quote: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  };
  const key = status.toLowerCase();
  return (
      <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase border tracking-wide ${styles[key] || 'bg-gray-500/20 text-gray-300'}`}>
          {t(`status_${key}` as any) || key}
      </span>
  );
};

export const MetricCard = ({ title, value, icon, trend }: { title: string, value: string | number, icon: string, trend?: string }) => {
  const isNegative = trend && (trend.startsWith('-') || parseFloat(trend) < 0);
  return (
    <div className={glassCardClass + " p-6 flex flex-col justify-between group hover:border-brand-gold"}>
        <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-white/10 text-gray-300 group-hover:bg-brand-gold group-hover:text-white transition-colors duration-300">
                <Icon name={icon} className="w-4 h-4" />
            </div>
            {trend && (
              <span className={`text-sm font-bold px-3 py-1 rounded-md ${isNegative ? 'text-red-400 bg-red-500/20' : 'text-green-400 bg-green-500/20'}`}>
                {isNegative ? '' : '+'}{trend}
              </span>
            )}
        </div>
        <div>
            <p className="text-sm font-bold text-gray-200 uppercase tracking-wide mb-1">{title}</p>
            <h3 className="text-2xl font-serif text-white">{value}</h3>
        </div>
    </div>
  );
};

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  variant = 'danger'
}: {
  isOpen: boolean,
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel: () => void,
  confirmText?: string,
  cancelText?: string,
  variant?: 'danger' | 'warning' | 'info'
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const iconColor = variant === 'danger' ? 'red' : variant === 'warning' ? 'amber' : 'blue';
  const btnBg = variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
      <div className={glassCardClass + " p-8 max-w-sm w-full text-center border-" + iconColor + "-500/30"}>
        {/* Animated warning icon */}
        <div className={`w-16 h-16 rounded-full bg-${iconColor}-500/10 flex items-center justify-center mx-auto mb-5 border border-${iconColor}-500/20 animate-pulse`}>
          <svg className={`w-8 h-8 text-${iconColor}-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h4 className="font-serif text-xl text-white mb-2">{title}</h4>
        <p className="text-sm text-gray-300 mb-8 leading-7">{message}</p>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-4 border border-white/20 text-gray-300 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 hover:text-white transition-all">{cancelText || t('modal_cancel')}</button>
          <button onClick={onConfirm} className={`flex-1 py-4 ${btnBg} text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg`}>{confirmText || t('admin_action_approve')}</button>
        </div>
      </div>
    </div>
  );
};
