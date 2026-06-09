import React, { useState, useCallback, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { Product } from '../types';

type ShopCategory = 'all' | 'long' | 'short' | 'summer' | 'winter' | 'spring' | 'autumn';

interface ShopCategoryTab {
  key: string;
  label: string;
}

interface ShopPageProps {
  onAddToCart: (product: Product, size: string) => void;
  products: Product[];
  initialCategory?: ShopCategory;
}

const ShopPage: React.FC<ShopPageProps> = ({ onAddToCart, products, initialCategory = 'all' }) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<ShopCategory>(initialCategory);
  // Categories fetched from GET /categories (TASK 3). Falls back to the bundled
  // translated list below if the API is unavailable.
  const [apiCategories, setApiCategories] = useState<ShopCategoryTab[] | null>(null);

  // Sync when parent changes the category (e.g. from footer link)
  useEffect(() => {
    setActiveCategory(initialCategory || 'all');
  }, [initialCategory]);

  useEffect(() => {
    let cancelled = false;
    api.getCategories()
      .then(data => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        const tabs: ShopCategoryTab[] = data
          .filter((c: any) => c && c.slug)
          .map((c: any) => ({
            key: c.slug,
            label: (language === 'ar' ? c.name_ar : c.name) || c.name || c.slug,
          }));
        setApiCategories([{ key: 'all', label: t('shop_category_all' as any) }, ...tabs]);
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, [language]);

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCloseModal = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const fallbackCategories: ShopCategoryTab[] = [
    { key: 'all', label: t('shop_category_all' as any) },
    { key: 'long', label: t('footer_shop_long' as any) },
    { key: 'short', label: t('footer_shop_short' as any) },
    { key: 'summer', label: t('footer_shop_summer' as any) },
    { key: 'winter', label: t('footer_shop_winter' as any) },
    { key: 'spring', label: t('footer_shop_spring' as any) },
    { key: 'autumn', label: t('footer_shop_autumn' as any) },
  ];

  const categories = apiCategories ?? fallbackCategories;

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <>
      <section className="py-20 bg-brand-beige" id="shop">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-serif mb-2 text-brand-dark">{t('shop_page_title')}</h2>
          <div className="w-20 h-px bg-brand-gold mx-auto mb-10"></div>
          
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-16 max-w-4xl mx-auto">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key as ShopCategory)}
                className={`px-6 py-3 text-base font-medium tracking-wider transition-all duration-300 border rounded-lg ${
                  activeCategory === cat.key
                    ? 'bg-brand-dark text-white border-brand-dark shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-dark hover:text-brand-dark'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onQuickView={handleQuickView}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-500 font-medium">
              لا توجد قطع فساتين متوفرة ضمن هذا التصنيف حالياً.
            </div>
          )}
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