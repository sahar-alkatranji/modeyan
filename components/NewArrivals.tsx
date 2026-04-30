import React, { useState } from 'react';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { useTranslation } from '../hooks/useTranslation';
import { Product } from '../types';

interface NewArrivalsProps {
  onNavigate: (page: 'shop') => void;
  onAddToCart: (product: Product, size: string) => void;
  products: Product[];
}

const NewArrivals: React.FC<NewArrivalsProps> = ({ onNavigate, onAddToCart, products }) => {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  // Only show first 4 products
  const displayProducts = products.slice(0, 4);

  return (
    <>
      <section className="py-20" id="shop">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-serif mb-2">{t('new_arrivals_title')}</h2>
          <div className="w-20 h-px bg-gray-300 mx-auto mb-12"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                onQuickView={handleQuickView}
              />
            ))}
          </div>

          <div className="mt-16">
            <button 
              onClick={() => onNavigate('shop')}
              className="px-10 py-3 bg-black text-white font-semibold tracking-widest text-sm hover:bg-gray-800 transition duration-300"
            >
              {t('new_arrivals_more_button')}
            </button>
          </div>
        </div>
      </section>
      <ProductModal 
        product={selectedProduct} 
        onClose={handleCloseModal}
        onAddToCart={onAddToCart}
      />
    </>
  );
};

export default NewArrivals;