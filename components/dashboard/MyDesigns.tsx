import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { SavedDesign } from '../../types';
import { api } from '../../services/api';
import { glassCardClass, Icon } from './DashboardShared';

interface MyDesignsProps {
  savedDesigns: SavedDesign[];
  setSavedDesigns: React.Dispatch<React.SetStateAction<SavedDesign[]>>;
  setCurrentView: (view: any) => void;
}

export const MyDesigns: React.FC<MyDesignsProps> = ({
  savedDesigns,
  setSavedDesigns,
  setCurrentView,
}) => {
  const { t } = useTranslation();
  const [forwardingId, setForwardingId] = useState<string | null>(null);

  const handleForwardToTailor = async (design: SavedDesign) => {
    setForwardingId(design.id);
    try {
      const payload = {
        design_id: parseInt(design.id) || null,
        notes: `Customer requesting custom dress sewing quote based on: ${t(design.name as any)} with color code: ${design.selectedColor}`,
        price: 0, // Quote is pending
        status: 'pending_quote',
      };
      
      await api.createOrder(payload);
      alert(t('dashboard_forward_success' as any) || 'Your custom creation has been forwarded to professional couturiers. You will receive quote evaluations under Orders.');
    } catch (err: any) {
      alert(err.message || 'Failed to forward design pattern to tailor');
    } finally {
      setForwardingId(null);
    }
  };

  const handleDeleteDesign = async (designId: string) => {
    try {
      // Opt: invoke design deletion if supported or update frontend state
      setSavedDesigns(prev => prev.filter(d => d.id !== designId));
      alert(t('profile_save_success'));
    } catch {
      alert('Failed to delete design');
    }
  };

  return (
    <div className="animate-fade-in text-start">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-white mb-1">{t('dashboard_menu_my_designs')}</h2>
        <p className="text-sm text-gray-300">
          {t('my_designs_subtitle' as any) || 'Review your saved fashion combinations and forward patterns to tailors'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedDesigns.length === 0 ? (
          <div className={glassCardClass + " col-span-3 text-center py-20"}>
            <p className="text-gray-400 mb-4">{t('dashboard_no_designs')}</p>
            <button
              onClick={() => setCurrentView('design')}
              className="text-brand-gold font-bold uppercase tracking-widest text-xs hover:underline"
            >
              {t('dashboard_menu_create_design')}
            </button>
          </div>
        ) : (
          savedDesigns.map(design => {
            const isForwarding = forwardingId === design.id;

            return (
              <div key={design.id} className={glassCardClass + " p-4 flex flex-col justify-between"}>
                <div>
                  <div className="aspect-[3/4] bg-white/5 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative border border-white/10">
                    {design.generatedImageUrl ? (
                      <img
                        src={design.generatedImageUrl}
                        alt={t(design.name as any)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Icon name="palette" className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <span className="text-xs text-gray-400 font-mono">{design.selectedColor}</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteDesign(design.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600/80 rounded-lg text-white transition-colors"
                      title="Delete saved combination"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <h4 className="font-bold text-white mb-1 text-sm truncate">{t(design.name as any)}</h4>
                  <p className="text-xs text-gray-400 mb-4">
                    {new Date(design.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <button
                  onClick={() => handleForwardToTailor(design)}
                  disabled={isForwarding}
                  className="w-full py-2.5 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-brand-gold hover:text-white transition-all disabled:opacity-50"
                >
                  {isForwarding ? t('wallet_processing') : t('dashboard_send_to_tailor')}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
