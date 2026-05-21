import React, { useEffect, useState } from 'react';
import { Product, Measurements } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import CustomizationView from './CustomizationView';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string) => void;
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

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart }) => {
  const { t } = useTranslation();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(false);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
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
          className="absolute top-4 right-4 text-gray-500 hover:text-black z-20"
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
            <div className="flex-shrink-0 flex justify-center items-center space-x-2 pt-4">
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
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
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

                {product.reviews && product.reviews.length > 0 && (
                  <div className="my-6 pt-6 border-t border-gray-200">
                    <h4 className="text-xl font-serif mb-6 text-start">{t('product_modal_reviews_title')}</h4>
                    <div className="space-y-6">
                      {product.reviews.map((review, index) => (
                        <div key={index} className="text-start">
                          <div className="flex items-center mb-1">
                            <p className="font-semibold mr-3">{review.author}</p>
                            <StarRating rating={review.rating} />
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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