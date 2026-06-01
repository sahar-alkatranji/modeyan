import React from 'react';
import { Measurements } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface CustomizationViewProps {
  enableSizeCustom: boolean;
  setEnableSizeCustom: (v: boolean) => void;
  enableColorCustom: boolean;
  setEnableColorCustom: (v: boolean) => void;
  customMeasurements: Measurements;
  setCustomMeasurements: (m: Measurements) => void;
  customNotes: string;
  setCustomNotes: (n: string) => void;
  customColor: string;
  setCustomColor: (c: string) => void;
  onBack: () => void;
  onAddToCart: () => void;
}

const CustomizationView: React.FC<CustomizationViewProps> = ({
  enableSizeCustom, setEnableSizeCustom,
  enableColorCustom, setEnableColorCustom,
  customMeasurements, setCustomMeasurements,
  customNotes, setCustomNotes,
  customColor, setCustomColor,
  onBack, onAddToCart,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto pe-2 pb-6 custom-scrollbar">
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        `}</style>

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-black mb-2 flex items-center transition-colors"
          >
            <span className="text-lg me-1 rtl:rotate-180">←</span> {t('customization_back_to_product')}
          </button>
          <h3 className="text-2xl font-serif text-gray-900">{t('customization_title')}</h3>
          <div className="mt-3 bg-gray-50 border border-gray-100 p-4 rounded-lg text-sm text-gray-700">
            <p className="font-semibold">{t('customization_help_text')}</p>
            <a href="tel:+0969656346" className="text-black font-bold mt-1 hover:underline inline-block">
              +0969656346
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-900 leading-relaxed">
          {t('customization_warning')}
        </div>

        {/* Toggle Size Customization */}
        <div className="mb-6 border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-lg">{t('customization_toggle_size')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableSizeCustom}
                onChange={() => setEnableSizeCustom(!enableSizeCustom)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:ltr:translate-x-full peer-checked:after:rtl:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>

          {enableSizeCustom && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 transition-all duration-300">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-start">{t('measurement_bust' as any)}</label>
                <input
                  placeholder="cm"
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-start"
                  value={customMeasurements.bust}
                  onChange={e => setCustomMeasurements({ ...customMeasurements, bust: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-start">{t('measurement_waist' as any)}</label>
                <input
                  placeholder="cm"
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-start"
                  value={customMeasurements.waist}
                  onChange={e => setCustomMeasurements({ ...customMeasurements, waist: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-start">{t('measurement_hips' as any)}</label>
                <input
                  placeholder="cm"
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-start"
                  value={customMeasurements.hips}
                  onChange={e => setCustomMeasurements({ ...customMeasurements, hips: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-start">{t('measurement_shoulder' as any)}</label>
                <input
                  placeholder="cm"
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-start"
                  value={customMeasurements.shoulder}
                  onChange={e => setCustomMeasurements({ ...customMeasurements, shoulder: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-start">{t('measurement_length' as any)}</label>
                <input
                  placeholder="cm"
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-start"
                  value={customMeasurements.length}
                  onChange={e => setCustomMeasurements({ ...customMeasurements, length: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Toggle Color Customization */}
        <div className="mb-6 border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-lg">{t('customization_toggle_color')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableColorCustom}
                onChange={() => setEnableColorCustom(!enableColorCustom)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:ltr:translate-x-full peer-checked:after:rtl:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
          {enableColorCustom && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-300">
              <label className="block text-xs font-semibold text-gray-500 mb-2 text-start">{t('design_color_picker_label')}</label>
              <div className="flex items-center gap-4">
                <div className="relative overflow-hidden w-16 h-16 rounded-full border-2 border-gray-300 shadow-sm hover:scale-105 transition-transform">
                  <input
                    type="color"
                    value={customColor}
                    onChange={e => setCustomColor(e.target.value)}
                    className="absolute -top-1/2 -start-1/2 w-[200%] h-[200%] cursor-pointer p-0 m-0 border-0"
                  />
                </div>
                <div className="flex flex-col text-start">
                  <span className="text-sm font-medium text-gray-900 mb-1">{t('customization_select_color')}</span>
                  <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border">{customColor}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div className="mb-6 border-t border-gray-100 pt-6 text-start">
          <label className="block font-semibold mb-2">{t('customization_requests_label')}</label>
          <textarea
            placeholder={t('customization_requests_label')}
            className="w-full border border-gray-300 p-3 rounded-lg h-24 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
            value={customNotes}
            onChange={e => setCustomNotes(e.target.value)}
          />
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 mb-6 italic bg-gray-50 p-3 rounded text-start">{t('customization_fee_note')}</p>
      </div>

      <div className="pt-4 border-t border-gray-100 mt-2">
        <button
          onClick={onAddToCart}
          className="w-full bg-black text-white py-4 tracking-widest text-sm font-bold uppercase hover:bg-gray-800 transition-colors duration-300 rounded shadow-md"
        >
          {t('product_modal_add_to_cart_button')}
        </button>
      </div>
    </div>
  );
};

export default CustomizationView;
