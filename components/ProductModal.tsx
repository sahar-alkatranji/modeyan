import React, { useEffect, useState } from 'react';
import { Product, Measurements } from '../types';
import { useTranslation } from '../hooks/useTranslation';

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
      setIsCustomizing(false); // Reset customization view on new product open
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
          // Pass standard add to cart. For customization, logic would need to be extended in App.tsx handleAddToCart
          // For now, we simulate adding the "Custom" size item
          onAddToCart(product, selectedSize);
          onClose();
      }
  }
  
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

  // Customization View Component
  const CustomizationView = () => (
      <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 pb-6 custom-scrollbar">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
            `}</style>
            
            {/* Header */}
            <div className="mb-6">
                <button onClick={() => setIsCustomizing(false)} className="text-sm text-gray-500 hover:text-black mb-2 flex items-center transition-colors">
                    <span className="text-lg mr-1">←</span> {t('customization_back_to_product')}
                </button>
                <h3 className="text-2xl font-serif text-gray-900">{t('customization_title')}</h3>
                <div className="mt-3 bg-gray-50 border border-gray-100 p-4 rounded-lg text-sm text-gray-700">
                    <p className="font-semibold">{t('customization_help_text')}</p>
                    <a href="tel:1234567890" className="text-black font-bold mt-1 hover:underline inline-block">123-456-7890</a>
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
                        <input type="checkbox" checked={enableSizeCustom} onChange={() => setEnableSizeCustom(!enableSizeCustom)} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                </div>
                
                {enableSizeCustom && (
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 transition-all duration-300">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">{t('measurement_bust' as any)}</label>
                            <input placeholder="cm" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black" value={customMeasurements.bust} onChange={e => setCustomMeasurements({...customMeasurements, bust: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">{t('measurement_waist' as any)}</label>
                            <input placeholder="cm" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black" value={customMeasurements.waist} onChange={e => setCustomMeasurements({...customMeasurements, waist: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">{t('measurement_hips' as any)}</label>
                            <input placeholder="cm" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black" value={customMeasurements.hips} onChange={e => setCustomMeasurements({...customMeasurements, hips: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">{t('measurement_shoulder' as any)}</label>
                            <input placeholder="cm" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black" value={customMeasurements.shoulder} onChange={e => setCustomMeasurements({...customMeasurements, shoulder: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">{t('measurement_length' as any)}</label>
                            <input placeholder="cm" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black" value={customMeasurements.length} onChange={e => setCustomMeasurements({...customMeasurements, length: e.target.value})} />
                        </div>
                    </div>
                )}
            </div>

            {/* Toggle Color Customization */}
            <div className="mb-6 border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-lg">{t('customization_toggle_color')}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={enableColorCustom} onChange={() => setEnableColorCustom(!enableColorCustom)} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                </div>
                {enableColorCustom && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-300">
                        <label className="block text-xs font-semibold text-gray-500 mb-2">{t('design_color_picker_label')}</label>
                        <div className="flex items-center gap-4">
                            <div className="relative overflow-hidden w-16 h-16 rounded-full border-2 border-gray-300 shadow-sm hover:scale-105 transition-transform">
                                <input 
                                    type="color" 
                                    value={customColor} 
                                    onChange={e => setCustomColor(e.target.value)} 
                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 m-0 border-0"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900 mb-1">Select Color</span>
                                <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border">{customColor}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Additional Notes - Always Visible */}
            <div className="mb-6 border-t border-gray-100 pt-6">
                <label className="block font-semibold mb-2">{t('customization_requests_label')}</label>
                <textarea 
                    placeholder={t('customization_requests_label')} 
                    className="w-full border border-gray-300 p-3 rounded-lg h-24 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none" 
                    value={customNotes} 
                    onChange={e => setCustomNotes(e.target.value)} 
                />
            </div>

            {/* Footer Note */}
            <p className="text-xs text-gray-500 mb-6 italic bg-gray-50 p-3 rounded">{t('customization_fee_note')}</p>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-2">
            <button 
                onClick={handleAddToCartClick}
                className="w-full bg-black text-white py-4 tracking-widest text-sm font-bold uppercase hover:bg-gray-800 transition-colors duration-300 rounded shadow-md"
            >
                {t('product_modal_add_to_cart_button')}
            </button>
          </div>
      </div>
  );

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
                <CustomizationView />
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
                                {/* Custom Button added to list */}
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