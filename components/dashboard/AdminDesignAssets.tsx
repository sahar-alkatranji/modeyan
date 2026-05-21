import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { DressPart } from '../../types';
import { api } from '../../services/api';
import { glassCardClass, glassInputClass, ConfirmDialog } from './DashboardShared';

interface AdminDesignAssetsProps {
  dressParts: DressPart[];
  setDressParts: React.Dispatch<React.SetStateAction<DressPart[]>>;
}

export const AdminDesignAssets: React.FC<AdminDesignAssetsProps> = ({ dressParts, setDressParts }) => {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<string>('all');

  // Add Asset modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'front_neckline' | 'back_neckline' | 'fabrics' | 'skirt_styles' | 'train'>('front_neckline');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm Dialog state
  const [assetToDelete, setAssetToDelete] = useState<DressPart | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const assetTypes = [
    { id: 'front_neckline', label: 'Front Neckline' },
    { id: 'back_neckline', label: 'Back Neckline' },
    { id: 'fabrics', label: 'Fabric / Material' },
    { id: 'skirt_styles', label: 'Skirt Style' },
    { id: 'train', label: 'Train / Tail' },
  ];

  // Filters logic
  const filteredAssets = dressParts.filter(part => {
    if (filterType === 'all') return true;
    return part.type === filterType;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageUrl) {
      alert('Asset name and image URL are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const added = await api.createDesignAsset({
        name,
        type,
        image_url: imageUrl,
      });

      const newAsset: DressPart = {
        id: String(added.id),
        name: added.name,
        type: added.type as any,
        imageUrl: added.image_url,
      };

      setDressParts(prev => [...prev, newAsset]);
      setIsAddOpen(false);

      // Reset Form
      setName('');
      setImageUrl('');
      alert(t('profile_save_success'));
    } catch (err: any) {
      alert(err.message || 'Failed to register design asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!assetToDelete) return;
    try {
      await api.deleteDesignAsset(parseInt(assetToDelete.id));
      setDressParts(prev => prev.filter(p => p.id !== assetToDelete.id));
      setIsDeleteOpen(false);
      setAssetToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to remove design asset');
    }
  };

  return (
    <div className="animate-fade-in text-start">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-serif text-white mb-1">
            {t('admin_design_assets_title' as any) || 'AI Studio Design Assets'}
          </h2>
          <p className="text-sm text-gray-300">
            {t('admin_design_assets_subtitle' as any) || 'Manage neckline, fabrics, trains, and cuts options catalog for AI Dress Builder'}
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-6 py-2.5 bg-white text-brand-dark font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-brand-gold hover:text-white transition-colors"
        >
          {t('admin_design_assets_add_button' as any) || 'Add Design Element'}
        </button>
      </div>

      {/* Type Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all uppercase tracking-wider ${
            filterType === 'all'
              ? 'bg-brand-gold border-brand-gold text-white shadow-md'
              : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
          }`}
        >
          All Options
        </button>
        {assetTypes.map(tOption => (
          <button
            key={tOption.id}
            onClick={() => setFilterType(tOption.id)}
            className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all uppercase tracking-wider ${
              filterType === tOption.id
                ? 'bg-brand-gold border-brand-gold text-white shadow-md'
                : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
            }`}
          >
            {tOption.label}
          </button>
        ))}
      </div>

      {/* Grid of Design Parts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filteredAssets.map(part => (
          <div key={part.id} className={glassCardClass + " p-3 flex flex-col justify-between group overflow-hidden"}>
            <div>
              <div className="aspect-square bg-white rounded-xl overflow-hidden mb-3 border border-white/10 relative">
                <img
                  src={part.imageUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={part.name}
                />
                <button
                  onClick={() => {
                    setAssetToDelete(part);
                    setIsDeleteOpen(true);
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-red-600 rounded-lg text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] uppercase font-bold text-brand-gold tracking-widest leading-none mb-1">
                {part.type.replace('_', ' ')}
              </p>
              <h4 className="font-bold text-white text-xs truncate mb-2">{t(part.name as any)}</h4>
            </div>
          </div>
        ))}
        {filteredAssets.length === 0 && (
          <div className={glassCardClass + " col-span-5 text-center py-16 text-gray-400 text-sm"}>
            {t('admin_design_assets_empty' as any) || 'No dress studio parts catalog registered under this category.'}
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <form
            onSubmit={handleAddSubmit}
            className={glassCardClass + " p-8 max-w-md w-full text-start space-y-4"}
          >
            <h3 className="font-serif text-2xl text-white mb-4">
              {t('admin_design_assets_add_modal_title' as any) || 'Register Dress Element'}
            </h3>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('admin_design_assets_field_name' as any) || 'Asset Name (or Translation Key)'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className={glassInputClass}
                placeholder="e.g. sweetheart_neckline"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('admin_design_assets_field_type' as any) || 'Element Type'}
              </label>
              <select
                className={glassInputClass}
                value={type}
                onChange={e => setType(e.target.value as any)}
              >
                <option value="front_neckline" className="bg-gray-800 text-white">Front Neckline Option</option>
                <option value="back_neckline" className="bg-gray-800 text-white">Back Neckline Option</option>
                <option value="fabrics" className="bg-gray-800 text-white">Fabric Option</option>
                <option value="skirt_styles" className="bg-gray-800 text-white">Skirt Option</option>
                <option value="train" className="bg-gray-800 text-white">Train Option</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('admin_products_field_image' as any) || 'Transparent PNG / SVG Asset Link'}
              </label>
              <input
                type="text"
                required
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className={glassInputClass}
                placeholder="https://example.com/asset.png"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="flex-1 py-3 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
              >
                {t('modal_cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold hover:text-white transition-colors disabled:opacity-50"
              >
                {isSubmitting ? t('wallet_processing') : t('signup_form_submit_label' as any) || 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deletion Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title={t('admin_design_assets_delete_confirm' as any) || 'Remove Design Element'}
        message={`${t('admin_design_assets_delete_warning' as any) || 'Are you sure you want to permanently delete this dress design component option from the AI Studio selections catalog?'}`}
        confirmText={t('admin_design_assets_delete_confirm' as any) || 'Delete Element'}
        cancelText={t('modal_cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteOpen(false);
          setAssetToDelete(null);
        }}
      />
    </div>
  );
};
