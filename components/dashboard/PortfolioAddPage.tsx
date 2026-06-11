import React, { useState, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { PortfolioItem } from '../../types';
import { api } from '../../services/api';
import { glassCardClass, glassInputClass, StatusPill } from './DashboardShared';

interface PortfolioAddPageProps {
  setPortfolioItems: React.Dispatch<React.SetStateAction<PortfolioItem[]>>;
  currentUserId?: string;
  onBack: () => void;
}

export const PortfolioAddPage: React.FC<PortfolioAddPageProps> = ({
  setPortfolioItems,
  currentUserId,
  onBack,
}) => {
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
        tailorId: String(added.tailor_id || currentUserId || ''),
        title: added.title,
        description: added.description || '',
        price: Number(added.price),
        imageUrls: added.image_urls || [imageUrl],
        videoUrl: added.video_url || videoUrl || undefined,
        status: 'pending',
      };

      setPortfolioItems(prev => [...prev, newItem]);
      alert(t('profile_save_success'));
      onBack();
    } catch (err: any) {
      alert(err.message || 'Failed to submit portfolio item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setVideoUrl('');
    setImagePreview(null);
  };

  const handleCancel = () => {
    resetForm();
    onBack();
  };

  return (
    <div className="animate-fade-in text-start max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-3xl font-serif text-white mb-1">
            {t('tailor_portfolio_add_button')}
          </h2>
          <p className="text-sm text-gray-300">
            {t('portfolio_subtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={glassCardClass + " p-6 sm:p-8 space-y-5"}>
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">
            {t('tailor_portfolio_form_title' as any) || 'عنوان العمل'} <span className="text-red-400">*</span>
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

        {/* Price */}
        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">
            {t('tailor_portfolio_form_price' as any) || 'السعر ($)'} <span className="text-red-400">*</span>
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
            {t('tailor_portfolio_form_image' as any) || 'صورة العمل'} <span className="text-red-400">*</span>
          </label>
          <div
            className="border-2 border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:border-white/40 transition-colors text-center"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="preview" className="max-h-64 mx-auto rounded-lg object-contain" />
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1 text-center">— {t('or' as any) || 'أو أدخل رابط الصورة'} —</p>
            <input
              type="text"
              value={imageUrl}
              onChange={e => { setImageUrl(e.target.value); setImagePreview(null); }}
              className={glassInputClass + " text-sm"}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Video URL */}
        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">
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

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">
            {t('tailor_portfolio_form_desc' as any) || 'الوصف'}
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className={glassInputClass + " resize-none"}
            placeholder="اوصف عملك بالتفصيل..."
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-3 text-gray-300 hover:text-white font-bold uppercase tracking-widest text-xs border border-white/10 hover:border-white/30 rounded-xl transition-colors"
          >
            {t('modal_cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage || !imageUrl}
            className="flex-1 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('wallet_processing') : t('tailor_portfolio_add_button')}
          </button>
        </div>
      </form>
    </div>
  );
};

interface PortfolioDetailPageProps {
  item: PortfolioItem;
  onBack: () => void;
}

export const PortfolioDetailPage: React.FC<PortfolioDetailPageProps> = ({ item, onBack }) => {
  const { t } = useTranslation();
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <div className="animate-fade-in text-start max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-3xl font-serif text-white mb-1 truncate">{item.title}</h2>
          <div className="flex items-center gap-3 mt-2">
            <StatusPill status={item.status} />
            <span className="text-2xl font-serif text-brand-gold font-bold">${Number(item.price).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Image / Video preview */}
        <div className={glassCardClass + " overflow-hidden"}>
          <div className="relative aspect-square bg-black/30">
            <img
              src={item.imageUrls[0] || 'https://placehold.co/600x600'}
              alt={item.title}
              className="w-full h-full object-contain"
            />
            {item.videoUrl && (
              <button
                onClick={() => setVideoOpen(true)}
                className="absolute inset-0 bg-black/30 hover:bg-black/50 transition-colors flex items-center justify-center"
                aria-label="Play video"
              >
                <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center text-brand-dark shadow-xl hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 fill-current translate-x-0.5 text-black" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className={glassCardClass + " p-6 space-y-4"}>
            {item.description && (
              <div>
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">
                  {t('tailor_portfolio_form_desc' as any) || 'الوصف'}
                </h3>
                <p className="text-gray-200 leading-relaxed text-sm whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}

            {!item.description && (
              <p className="text-gray-400 text-sm italic">No description provided</p>
            )}

            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price</span>
                <span className="text-brand-gold font-bold font-serif">${Number(item.price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <StatusPill status={item.status} />
              </div>
              {item.videoUrl && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Video</span>
                  <button
                    onClick={() => setVideoOpen(true)}
                    className="text-white hover:text-brand-gold underline transition-colors"
                  >
                    {t('portfolio_play_video' as any) || 'تشغيل الفيديو'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video player modal (kept as modal since it's a fullscreen media experience) */}
      {videoOpen && item.videoUrl && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4 animate-fade-in"
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 bg-black/50 p-2 rounded-full"
              aria-label="Close video"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {item.videoUrl.includes('youtube.com') || item.videoUrl.includes('youtu.be') ? (
              <iframe
                src={item.videoUrl.includes('youtu.be/')
                  ? `https://www.youtube.com/embed/${item.videoUrl.split('youtu.be/')[1]}`
                  : item.videoUrl.replace('watch?v=', 'embed/')}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={item.videoUrl} controls autoPlay className="w-full h-full" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
