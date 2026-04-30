import React from 'react';
import { Product } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { t } = useTranslation();
  return (
    <div className="group text-center">
      <div className="relative overflow-hidden mb-4">
        <img src={product.imageUrls[0]} alt={t(product.name as any)} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center">
          <button 
            onClick={() => onQuickView(product)}
            className="bg-white text-black px-6 py-2 text-sm tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            {t('product_card_view')}
          </button>
        </div>
      </div>
      <h3 className="text-lg">{t(product.name as any)}</h3>
      <p className="text-gray-500">${product.price.toFixed(2)}</p>
    </div>
  );
};

export default ProductCard;