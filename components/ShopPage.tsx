import React, { useState } from 'react';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { useTranslation } from '../hooks/useTranslation';
import { Product } from '../types';

interface ShopPageProps {
  onAddToCart: (product: Product, size: string) => void;
  products: Product[];
}

const ShopPage: React.FC<ShopPageProps> = ({ onAddToCart, products }) => {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  return (
    <>
      <section className="py-20" id="shop">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-serif mb-2">{t('shop_page_title')}</h2>
          <div className="w-20 h-px bg-gray-300 mx-auto mb-12"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                onQuickView={handleQuickView}
              />
            ))}
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

export default ShopPage;