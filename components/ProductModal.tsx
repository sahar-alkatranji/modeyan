import React, { useEffect, useState } from 'react';
import { Product, Measurements } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import CustomizationView from './CustomizationView';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string) => void;
}

// Normalized review for display (backend uses `reviewer_name`, bundled uses `author`)
interface DisplayReview {
  author: string;
  rating: number;
  comment: string;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => {
        const starClass = index < rating ? 'text-yellow-400' : 'text-gray-300';
        return (
          <svg key={index} className={`w-4 h-4 fill-current ${starClass}`} viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
          </svg>
        );
      })}
    </div>
  );
};

// Clickable star selector for submitting a rating (1-5)
const StarInput = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(star => {
        const active = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            className="p-0.5 focus:outline-none"
            aria-label={`${star} stars`}
          >
            <svg className={`w-6 h-6 fill-current transition-colors ${active ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
            </svg>
          </button>
        );
      })}
    </div>
  );
};

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Design reviews loaded from the backend (TASK 2). `isApiDesign` tells us the
  // product is a real /designs record (vs a bundled fallback) so we only show the
  // review form where POST /designs/{id}/reviews will actually work.
  const [apiReviews, setApiReviews] = useState<DisplayReview[] | null>(null);
  const [isApiDesign, setIsApiDesign] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const loadReviews = async (designId: number) => {
    // GET /designs/{id} is a public endpoint. We read the raw status so we can
    // distinguish a missing design (404 → bundled product, hide the review form)
    // from a real design. NOTE: the backend currently returns 500 for any design
    // that already has reviews, so a non-404 error still means "real design" —
    // we just can't list the existing reviews until the backend is patched.
    try {
      const res = await fetch(`/api/v1/designs/${designId}`);
      if (res.status === 404) {
        setIsApiDesign(false);
        setApiReviews(null);
        return;
      }
      setIsApiDesign(true);
      if (res.ok) {
        const d = await res.json();
        const reviews: DisplayReview[] = Array.isArray(d?.reviews)
          ? d.reviews.map((r: any) => ({
              author: r.reviewer_name || t('unknown'),
              rating: Number(r.rating) || 0,
              comment: r.comment || '',
            }))
          : [];
        setApiReviews(reviews);
      } else {
        setApiReviews(null);
      }
    } catch {
      setIsApiDesign(false);
      setApiReviews(null);
    }
  };

  const submitReview = async () => {
    if (!product) return;
    if (!reviewRating) { setReviewError(t('review_rating_required' as any)); return; }
    setReviewBusy(true);
    setReviewError(null);
    try {
      const created = await api.createDesignReview(product.id, { rating: reviewRating, comment: reviewComment || undefined });
      // Optimistically show the new review. We do NOT re-fetch via GET /designs/{id}
      // because that endpoint 500s once a design has reviews (backend bug).
      const newReview: DisplayReview = {
        author: created?.reviewer_name || t('unknown'),
        rating: Number(created?.rating) || reviewRating,
        comment: created?.comment || reviewComment || '',
      };
      setApiReviews(prev => [...(prev || []), newReview]);
      setReviewRating(0);
      setReviewComment('');
      alert(t('review_submit_success' as any));
    } catch (e: any) {
      setReviewError(e.message || 'Failed to submit review');
    } finally {
      setReviewBusy(false);
    }
  };

  // Customization State
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [enableSizeCustom, setEnableSizeCustom] = useState(false);
  const [enableColorCustom, setEnableColorCustom] = useState(false);
  const [customMeasurements, setCustomMeasurements] = useState<Measurements>({ bust: '', waist: '', hips: '', shoulder: '', length: '' });
  const [customNotes, setCustomNotes] = useState('');
  const [customColor, setCustomColor] = useState('#000000');

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    if (product) {
      setIsImageLoading(true);
      setCurrentImageIndex(0);
      setIsCustomizing(false);
      setEnableSizeCustom(false);
      setEnableColorCustom(false);
      setCustomNotes('');
      setCustomColor('#000000');
      setCustomMeasurements({ bust: '', waist: '', hips: '', shoulder: '', length: '' });
      // Reset + load reviews for the freshly opened product (TASK 2)
      setApiReviews(null);
      setIsApiDesign(false);
      setReviewRating(0);
      setReviewComment('');
      setReviewError(null);
      loadReviews(product.id);
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      } else {
        setSelectedSize('default');
      }
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [product, onClose]);

  if (!product) return null;

  const handleImageSelect = (index: number) => {
    if (index !== currentImageIndex) {
      setIsImageLoading(true);
      setCurrentImageIndex(index);
    }
  };

  const handleAddToCartClick = () => {
    if (product && selectedSize) {
      onAddToCart(product, selectedSize);
      onClose();
    }
  };

  const handleSizeSelect = (size: string) => {
    if (size === 'custom' || size === 'Custom' || size === t('product_modal_custom_size_button')) {
      setIsCustomizing(true);
      setSelectedSize('Custom');
    } else {
      setSelectedSize(size);
      setIsCustomizing(false);
    }
  };

  const isSizeSelectionRequired = product.sizes && product.sizes.length > 0;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative bg-white p-6 max-w-5xl w-full rounded-lg shadow-xl flex flex-col md:flex-row gap-8 h-[90vh] md:h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 text-gray-500 hover:text-black z-20"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Gallery Column */}
        <div className="w-full md:w-1/2 flex flex-col h-full min-h-[400px]">
          <div className="relative flex-1 min-h-0 flex items-center justify-center bg-gray-50 rounded overflow-hidden">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <svg className="w-12 h-12 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v2m0 12v2m8-8h-2M4 12H2m15.364 6.364l-1.414-1.414M6.343 6.343L4.929 4.929m12.728 0l1.414 1.414M6.343 17.657l-1.414 1.414" />
                </svg>
              </div>
            )}
            <img
              src={product.imageUrls[currentImageIndex]}
              alt={t(product.name as any)}
              className={`w-full h-full object-contain transition-opacity duration-300 ${isImageLoading ? 'opacity-25' : 'opacity-100'}`}
              onLoad={() => setIsImageLoading(false)}
            />
          </div>

          {product.imageUrls.length > 1 && (
            <div className="flex-shrink-0 flex justify-center items-center gap-2 pt-4">
              {product.imageUrls.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(index)}
                  className={`w-12 h-12 border overflow-hidden transition-all duration-200 rounded ${
                    currentImageIndex === index
                      ? 'border-black opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={product.imageUrls[index]} className="w-full h-full object-cover"/>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Column - Switchable View */}
        <div className="w-full md:w-1/2 flex flex-col h-full overflow-hidden">
          {isCustomizing ? (
            // ✅ مكون مستقل خارج ProductModal - لا يُعاد إنشاؤه عند كل render
            <CustomizationView
              enableSizeCustom={enableSizeCustom}
              setEnableSizeCustom={setEnableSizeCustom}
              enableColorCustom={enableColorCustom}
              setEnableColorCustom={setEnableColorCustom}
              customMeasurements={customMeasurements}
              setCustomMeasurements={setCustomMeasurements}
              customNotes={customNotes}
              setCustomNotes={setCustomNotes}
              customColor={customColor}
              setCustomColor={setCustomColor}
              onBack={() => setIsCustomizing(false)}
              onAddToCart={handleAddToCartClick}
            />
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto pe-2 custom-scrollbar">
                <style>{`
                  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                  .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
                  .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
                `}</style>
                <div className="text-start">
                  <h3 className="text-3xl font-serif mb-2">{t(product.name as any)}</h3>
                  {product.description && (
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">{t(product.description as any)}</p>
                  )}
                  <p className="text-black font-semibold text-xl mb-6">${product.price.toFixed(2)}</p>
                </div>

                {isSizeSelectionRequired && (
                  <div className="my-4 text-start">
                    <p className="text-sm font-semibold tracking-wider mb-3">{t('product_modal_size')}</p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => handleSizeSelect(size)}
                          className={`min-w-[40px] px-3 h-10 border flex items-center justify-center text-sm font-medium transition-colors duration-200 ${
                            selectedSize === size
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-black border-gray-300 hover:border-black'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                      {/* Custom Size Button */}
                      <button
                        onClick={() => handleSizeSelect('custom')}
                        className={`px-4 h-10 border flex items-center justify-center text-sm font-medium transition-colors duration-200 ${
                          selectedSize === 'Custom'
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-gray-300 hover:border-black'
                        }`}
                      >
                        {t('product_modal_custom_size_button')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reviews (TASK 2): live reviews from the backend when available,
                    otherwise the bundled static reviews. */}
                {(() => {
                  const reviews: DisplayReview[] = apiReviews ?? (product.reviews || []);
                  return (
                    <div className="my-6 pt-6 border-t border-gray-200">
                      <h4 className="text-xl font-serif mb-6 text-start">{t('product_modal_reviews_title')}</h4>
                      {reviews.length > 0 ? (
                        <div className="space-y-6">
                          {reviews.map((review, index) => (
                            <div key={index} className="text-start">
                              <div className="flex items-center mb-1">
                                <p className="font-semibold me-3">{review.author}</p>
                                <StarRating rating={review.rating} />
                              </div>
                              {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm text-start">{t('review_no_reviews' as any)}</p>
                      )}

                      {/* Submit a review — only for real backend designs */}
                      {isApiDesign && (
                        <div className="mt-6 pt-6 border-t border-gray-100 text-start">
                          {isAuthenticated ? (
                            <>
                              <h5 className="text-base font-semibold mb-3">{t('review_form_title' as any)}</h5>
                              <p className="text-xs font-medium text-gray-500 mb-2">{t('review_form_rating' as any)}</p>
                              <StarInput value={reviewRating} onChange={setReviewRating} />
                              <textarea
                                value={reviewComment}
                                onChange={e => setReviewComment(e.target.value)}
                                rows={3}
                                maxLength={1000}
                                placeholder={t('review_form_comment_placeholder' as any)}
                                className="w-full mt-3 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black resize-none"
                              />
                              {reviewError && <p className="text-red-500 text-xs mt-2">{reviewError}</p>}
                              <button
                                onClick={submitReview}
                                disabled={reviewBusy}
                                className="mt-3 px-6 py-2.5 bg-black text-white text-sm font-semibold tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
                              >
                                {reviewBusy ? t('review_form_submitting' as any) : t('review_form_submit' as any)}
                              </button>
                            </>
                          ) : (
                            <p className="text-gray-500 text-sm">{t('review_login_required' as any)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-4 border-t border-gray-100 mt-2">
                <button
                  onClick={handleAddToCartClick}
                  disabled={!selectedSize}
                  className="w-full bg-black text-white py-3 tracking-widest text-sm font-semibold hover:bg-gray-800 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t('product_modal_add_to_cart_button')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductModal;