import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { PortfolioItem, UserRole } from '../../types';
import { api } from '../../services/api';
import { glassCardClass, glassInputClass, StatusPill } from './DashboardShared';

interface ProfessionalPortfolioProps {
  portfolioItems: PortfolioItem[];
  setPortfolioItems: React.Dispatch<React.SetStateAction<PortfolioItem[]>>;
  userRole: UserRole;
  currentUserId?: string;
}

export const ProfessionalPortfolio: React.FC<ProfessionalPortfolioProps> = ({
  portfolioItems,
  setPortfolioItems,
  userRole,
  currentUserId,
}) => {
  const { t } = useTranslation();
  
  // Add Portfolio state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Administrative approve/reject state
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter items
  // Manager: sees only pending items for approval
  // Tailor/Designer: sees only their own items
  const displayItems = userRole === 'manager'
    ? portfolioItems.filter(item => item.status === 'pending')
    : portfolioItems.filter(item => item.tailorId === currentUserId);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !imageUrl) {
      alert('Title, price and image URL are required');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      alert('Price must be a valid positive number');
      return;
    }

    setIsSubmitting(true);
    try {
      const added = await api.createPortfolio({
        title,
        description,
        price: priceNum,
        image_urls: [imageUrl],
        video_url: videoUrl || undefined,
        status: 'pending',
      });

      const newItem: PortfolioItem = {
        id: String(added.id),
        tailorId: String(added.tailor_id),
        title: added.title,
        description: added.description || '',
        price: Number(added.price),
        imageUrls: added.image_urls || [imageUrl],
        videoUrl: added.video_url || videoUrl || undefined,
        status: 'pending',
      };

      setPortfolioItems(prev => [...prev, newItem]);
      setIsAddOpen(false);
      
      // Reset Form
      setTitle('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setVideoUrl('');
      alert(t('profile_save_success'));
    } catch (err: any) {
      alert(err.message || 'Failed to submit portfolio item');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            onClick={() => setIsAddOpen(true)}
            className="px-6 py-2.5 bg-white text-brand-dark font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-brand-gold hover:text-white transition-colors"
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
              <div className="aspect-square relative overflow-hidden bg-white/5 group">
                <img
                  src={item.imageUrls[0] || 'https://placehold.co/400x400'}
                  alt={t(item.title as any)}
                  className="w-full h-full object-cover"
                />
                {item.videoUrl && (
                  <button
                    onClick={() => setSelectedVideo(item.videoUrl || null)}
                    className="absolute inset-0 bg-black/30 hover:bg-black/50 transition-colors flex items-center justify-center cursor-pointer group"
                    title={t('portfolio_play_video' as any) || 'Play Video'}
                  >
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center text-brand-dark shadow-xl hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 fill-current translate-x-0.5 text-black" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </button>
                )}
                <div className="absolute top-2 right-2">
                  <StatusPill status={item.status} />
                </div>
              </div>
              <div className="p-5 border-t border-white/10 flex-1 flex flex-col justify-between bg-black/10">
                <div>
                  <h4 className="font-bold text-white mb-1 text-sm truncate">{t(item.title as any)}</h4>
                  <p className="text-xs text-gray-300 line-clamp-2 mb-4">
                    {t(item.description as any) || 'No description provided'}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-sm font-serif text-brand-gold font-bold">
                    ${Number(item.price).toFixed(2)}
                  </span>
                  
                  {/* Manager Controls: Approve / Reject Actions (H-18) */}
                  {userRole === 'manager' && item.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveReject(item.id, 'approved')}
                        disabled={isProcessing}
                        className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-[9px] font-bold uppercase rounded disabled:opacity-50 transition-colors"
                      >
                        {t('portfolio_action_approve' as any)}
                      </button>
                      <button
                        onClick={() => handleApproveReject(item.id, 'rejected')}
                        disabled={isProcessing}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[9px] font-bold uppercase rounded disabled:opacity-50 transition-colors"
                      >
                        {t('portfolio_action_reject' as any)}
                      </button>
                    </div>
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

      {/* Add Portfolio Item Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <form
            onSubmit={handleAddSubmit}
            className={glassCardClass + " p-6 sm:p-8 max-w-md w-full text-start space-y-4 my-4 max-h-[85vh] overflow-y-auto"}
          >
            <h3 className="font-serif text-2xl text-white mb-4">
              {t('tailor_portfolio_add_modal_title' as any) || 'Add Showcase Work'}
            </h3>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('tailor_portfolio_field_title' as any) || 'Showcase Title'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={glassInputClass}
                placeholder="e.g. elegant_silk_creations"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('tailor_portfolio_field_price' as any) || 'Base Pricing ($)'}
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className={glassInputClass}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('admin_products_field_image' as any) || 'Photo URL'}
              </label>
              <input
                type="text"
                required
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className={glassInputClass}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('tailor_portfolio_field_video' as any) || 'Video URL (Optional)'}
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className={glassInputClass}
                placeholder="e.g. https://www.w3schools.com/html/mov_bbb.mp4 or YouTube link"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('contact_form_message')}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className={glassInputClass + " resize-none"}
                placeholder="Describe your elegant creation..."
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

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 animate-fade-in" onClick={() => setSelectedVideo(null)}>
          <div className="relative max-w-4xl w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 bg-black/50 p-2 rounded-full cursor-pointer"
              aria-label="Close video"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {selectedVideo.includes('youtube.com') || selectedVideo.includes('youtu.be') ? (
              <iframe
                src={selectedVideo.includes('youtu.be/') 
                  ? `https://www.youtube.com/embed/${selectedVideo.split('youtu.be/')[1]}` 
                  : selectedVideo.replace('watch?v=', 'embed/')}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full h-full"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
