import React, { useState, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { PortfolioItem, UserRole } from '../../types';
import { api } from '../../services/api';
import { glassCardClass, glassInputClass, StatusPill } from './DashboardShared';

interface ProfessionalPortfolioProps {
  portfolioItems: PortfolioItem[];
  setPortfolioItems: React.Dispatch<React.SetStateAction<PortfolioItem[]>>;
  userRole: UserRole;
  currentUserId?: string;
  // Lifted-up controls: parent renders the form / detail view as full pages
  onAddNew: () => void;
  onViewItem: (item: PortfolioItem) => void;
}

export const ProfessionalPortfolio: React.FC<ProfessionalPortfolioProps> = ({
  portfolioItems,
  setPortfolioItems,
  userRole,
  currentUserId,
  onAddNew,
  onViewItem,
}) => {
  const { t } = useTranslation();

  // Administrative approve/reject state
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter items
  // Manager: sees only pending items for approval
  // Tailor/Designer: sees only their own items
  const displayItems = userRole === 'manager'
    ? portfolioItems.filter(item => item.status === 'pending')
    : portfolioItems.filter(item => item.tailorId === currentUserId);

  const handleApproveReject = async (itemId: string, status: 'approved' | 'rejected') => {
    setProcessingId(itemId);
    try {
      await api.updatePortfolioStatus(parseInt(itemId), status);
      setPortfolioItems(prev =>
        prev.map(item => (item.id === itemId ? { ...item, status } : item))
      );
      alert(t('profile_save_success'));
    } catch (err: any) {
      alert(err.message || 'Failed to process portfolio status');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="animate-fade-in text-start">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-serif text-white mb-1">
            {userRole === 'manager' ? t('dashboard_menu_admin_approvals') : t('dashboard_menu_portfolio')}
          </h2>
          <p className="text-sm text-gray-300">
            {userRole === 'manager'
              ? t('admin_approvals_subtitle' as any) || 'Approve or reject portfolio showcase requests from professional couturiers'
              : t('portfolio_subtitle')}
          </p>
        </div>

        {userRole !== 'manager' && (
          <button
            onClick={onAddNew}
            className="px-6 py-2.5 bg-white text-brand-dark font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-brand-gold hover:text-white transition-colors"
          >
            {t('tailor_portfolio_add_button')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayItems.map(item => {
          const isProcessing = processingId === item.id;

          return (
            <div key={item.id} className={glassCardClass + " overflow-hidden flex flex-col justify-between"}>
              <div
                className="aspect-square relative overflow-hidden bg-white/5 group cursor-pointer"
                onClick={() => onViewItem(item)}
              >
                <img
                  src={item.imageUrls[0] || 'https://placehold.co/400x400'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.videoUrl && (
                  <div
                    className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center pointer-events-none"
                    title={t('portfolio_play_video' as any) || 'Play Video'}
                  >
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center text-brand-dark shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 fill-current translate-x-0.5 text-black" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
                {!item.videoUrl && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white/90 text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow">{t('portfolio_view_details' as any) || 'عرض التفاصيل'}</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <StatusPill status={item.status} />
                </div>
              </div>
              <div className="p-5 border-t border-white/10 flex-1 flex flex-col justify-between bg-black/10">
                <div>
                  <h4 className="font-bold text-white mb-1 text-sm truncate">{item.title}</h4>
                  <p className="text-xs text-gray-300 line-clamp-2 mb-4">
                    {item.description || 'No description provided'}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-sm font-serif text-brand-gold font-bold">
                    ${Number(item.price).toFixed(2)}
                  </span>

                  {/* Manager Controls: Approve / Reject Actions */}
                  {userRole === 'manager' && item.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveReject(item.id, 'approved')}
                        disabled={isProcessing}
                        className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold uppercase rounded disabled:opacity-50 transition-colors"
                      >
                        {t('portfolio_action_approve' as any)}
                      </button>
                      <button
                        onClick={() => handleApproveReject(item.id, 'rejected')}
                        disabled={isProcessing}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase rounded disabled:opacity-50 transition-colors"
                      >
                        {t('portfolio_action_reject' as any)}
                      </button>
                    </div>
                  )}

                  {/* View details button for non-manager */}
                  {userRole !== 'manager' && (
                    <button
                      onClick={() => onViewItem(item)}
                      className="text-xs text-gray-300 hover:text-white underline transition-colors"
                    >
                      {t('portfolio_view_details' as any) || 'التفاصيل'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {displayItems.length === 0 && (
          <div className={glassCardClass + " col-span-3 text-center py-20 text-gray-400 text-sm"}>
            {userRole === 'manager'
              ? t('admin_approvals_empty' as any) || 'No pending approvals waitlist requests.'
              : t('portfolio_empty' as any) || 'Your showroom portfolio is currently empty.'}
          </div>
        )}
      </div>
    </div>
  );
};
