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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail view state
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  // Administrative approve/reject state
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter items
  // Manager: sees only pending items for approval
  // Tailor/Designer: sees only their own items
  const displayItems = userRole === 'manager'
    ? portfolioItems.filter(item => item.status === 'pending')
    : portfolioItems.filter(item => item.tailorId === currentUserId);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setIsUploadingImage(true);
    try {
      const { url } = await api.uploadFile(file, 'image');
      const finalUrl = url.startsWith('http') ? url : url.replace('/storage/uploads/', '/api/v1/uploads/');
      setImageUrl(finalUrl);
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !imageUrl) {
      alert('Title, price and image are required');
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
      setImagePreview(null);
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
                onClick={() => !item.videoUrl && setSelectedItem(item)}
              >
                <img
                  src={item.imageUrls[0] || 'https://placehold.co/400x400'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.videoUrl ? (
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedVideo(item.videoUrl || null); }}
                    className="absolute inset-0 bg-black/30 hover:bg-black/50 transition-colors flex items-center justify-center cursor-pointer"
                    title={t('portfolio_play_video' as any) || 'Play Video'}
                  >
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center text-brand-dark shadow-xl hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 fill-current translate-x-0.5 text-black" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </button>
                ) : (
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
                      onClick={() => setSelectedItem(item)}
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

      {/* Add Portfolio Item Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <form
            onSubmit={handleAddSubmit}
            className={glassCardClass + " p-6 sm:p-8 max-w-3xl w-full text-start space-y-4 my-4"}
          >
            <h3 className="font-serif text-2xl text-white mb-4">
              {t('tailor_portfolio_add_button')}
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                {t('tailor_portfolio_form_title' as any) || 'عنوان العمل'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={glassInputClass}
                placeholder="مثال: فستان حرير أنيق"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                {t('tailor_portfolio_form_price' as any) || 'السعر ($)'}
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className={glassInputClass}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">
                {t('tailor_portfolio_form_image' as any) || 'صورة العمل'} *
              </label>
              <div
                className="border-2 border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:border-white/40 transition-colors text-center"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4">
                    <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-300">{t('tailor_portfolio_form_image_upload' as any) || 'اضغط لرفع صورة من جهازك'}</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
                disabled={isUploadingImage}
              />
              {/* Or paste URL */}
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1 text-center">— {t('or' as any) || 'أو أدخل رابط الصورة'} —</p>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => { setImageUrl(e.target.value); setImagePreview(null); }}
                  className={glassInputClass + " text-xs"}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                {t('tailor_portfolio_field_video' as any) || 'رابط الفيديو (اختياري)'}
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className={glassInputClass}
                placeholder="https://youtube.com/... أو رابط mp4"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                {t('tailor_portfolio_form_desc' as any) || 'الوصف'}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className={glassInputClass + " resize-none"}
                placeholder="اوصف عملك بالتفصيل..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setIsAddOpen(false); setImagePreview(null); setImageUrl(''); }}
                className="flex-1 py-3 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
              >
                {t('modal_cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingImage || !imageUrl}
                className="flex-1 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold hover:text-white transition-colors disabled:opacity-50"
              >
                {isSubmitting ? t('wallet_processing') : t('tailor_portfolio_add_button')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detail View Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className={glassCardClass + " max-w-2xl w-full overflow-hidden animate-fade-in"}
            onClick={e => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-black/30">
              <img
                src={selectedItem.imageUrls[0] || 'https://placehold.co/600x400'}
                alt={selectedItem.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute top-3 left-3">
                <StatusPill status={selectedItem.status} />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-serif font-bold text-white mb-2">{selectedItem.title}</h3>
              <p className="text-2xl font-serif text-brand-gold font-bold mb-4">${Number(selectedItem.price).toFixed(2)}</p>
              {selectedItem.description && (
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{selectedItem.description}</p>
              )}
              {selectedItem.videoUrl && (
                <button
                  onClick={() => { setSelectedItem(null); setSelectedVideo(selectedItem.videoUrl || null); }}
                  className="flex items-center gap-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  {t('portfolio_play_video' as any) || 'تشغيل الفيديو'}
                </button>
              )}
            </div>
          </div>
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
