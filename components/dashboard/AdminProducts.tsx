import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Product } from '../../types';
import { api } from '../../services/api';
import { glassCardClass, glassInputClass, ConfirmDialog } from './DashboardShared';

interface AdminProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ products, setProducts }) => {
  const { t } = useTranslation();

  // Add/Edit Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // true if editing, false if adding new
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L']);
  const [formCategory, setFormCategory] = useState('long_dress'); // صيفي، شتوي، طويل، قصير (NB-07)
  const [formStock, setFormStock] = useState('10');
  const [formVideoUrl, setFormVideoUrl] = useState('');

  // Deletion Dialog State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];
  const categories = [
    { id: 'long_dress', labelKey: 'category_long' },
    { id: 'short_dress', labelKey: 'category_short' },
    { id: 'summer_dress', labelKey: 'category_summer' },
    { id: 'winter_dress', labelKey: 'category_winter' },
    { id: 'spring_dress', labelKey: 'category_spring' },
    { id: 'autumn_dress', labelKey: 'category_autumn' }
  ];

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedProduct(null);
    setFormName('');
    setFormPrice('');
    setFormImage('');
    setFormSizes(['S', 'M', 'L']);
    setFormCategory('long_dress');
    setFormStock('10');
    setFormVideoUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setIsEditing(true);
    setSelectedProduct(product);
    setFormName(product.name);
    setFormPrice(String(product.price));
    setFormImage(product.imageUrls[0] || '');
    setFormSizes(product.sizes || ['S', 'M', 'L']);
    setFormCategory((product as any).category || 'long_dress');
    setFormStock(String((product as any).stock || '10'));
    setFormVideoUrl(product.videoUrl || '');
    setIsModalOpen(true);
  };

  const handleToggleSize = (size: string) => {
    if (formSizes.includes(size)) {
      setFormSizes(formSizes.filter(s => s !== size));
    } else {
      setFormSizes([...formSizes, size]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice) {
      alert('Product name and price are required');
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      alert('Price must be a valid positive number');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formName,
        price: priceNum,
        image_urls: formImage ? [formImage] : ['https://placehold.co/400x600?text=Dress'],
        sizes: formSizes,
        category: formCategory,
        stock: parseInt(formStock) || 10,
        video_url: formVideoUrl,
      };

      if (isEditing && selectedProduct) {
        // Edit flow
        const updatedRes = await api.updateProduct(Number(selectedProduct.id), payload);
        const updatedProduct: Product = {
          id: Number(updatedRes.id),
          name: updatedRes.name,
          price: Number(updatedRes.price),
          imageUrls: updatedRes.image_urls || [formImage],
          sizes: updatedRes.sizes || formSizes,
          videoUrl: updatedRes.video_url || '',
        };
        (updatedProduct as any).category = updatedRes.category;
        (updatedProduct as any).stock = updatedRes.stock;

        setProducts(prev => prev.map(p => (p.id === selectedProduct.id ? updatedProduct : p)));
        alert(t('profile_save_success'));
      } else {
        // Add flow
        const createdRes = await api.createProduct(payload);
        const newProduct: Product = {
          id: Number(createdRes.id),
          name: createdRes.name,
          price: Number(createdRes.price),
          imageUrls: createdRes.image_urls || [formImage],
          sizes: createdRes.sizes || formSizes,
          videoUrl: createdRes.video_url || '',
        };
        (newProduct as any).category = createdRes.category;
        (newProduct as any).stock = createdRes.stock;

        setProducts(prev => [...prev, newProduct]);
        alert(t('profile_save_success'));
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await api.deleteProduct(Number(productToDelete.id));
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setIsDeleteOpen(false);
      setProductToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  return (
    <div className="animate-fade-in text-start">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-serif text-white mb-1">{t('admin_products_title')}</h2>
          <p className="text-sm text-gray-300">{t('admin_products_subtitle')}</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-6 py-2.5 bg-white text-brand-dark font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-brand-gold hover:text-white transition-colors"
        >
          {t('admin_products_add_button')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className={glassCardClass + " overflow-hidden group flex flex-col justify-between"}>
            <div className="aspect-[3/4] relative overflow-hidden bg-white/5">
              <img
                src={product.imageUrls[0] || 'https://placehold.co/400x600?text=Dress'}
                alt={t(product.name as any)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[9px] uppercase tracking-wider font-bold border border-white/10 text-brand-gold">
                {t((categories.find(c => c.id === (product as any).category)?.labelKey || 'category_long') as any)}
              </div>
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => handleOpenEdit(product)}
                  className="px-6 py-2 bg-white text-brand-dark font-bold uppercase tracking-widest text-[9px] rounded-lg hover:bg-brand-gold hover:text-white transition-colors w-32"
                >
                  {t('admin_payments_configure') || 'Edit'}
                </button>
                <button
                  onClick={() => {
                    setProductToDelete(product);
                    setIsDeleteOpen(true);
                  }}
                  className="px-6 py-2 bg-red-500 text-white font-bold uppercase tracking-widest text-[9px] rounded-lg hover:bg-red-600 transition-colors w-32"
                >
                  {t('admin_products_action_delete')}
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-white/10 bg-black/20">
              <h3 className="font-bold text-white text-sm mb-1 truncate">{t(product.name as any)}</h3>
              <div className="flex justify-between items-center">
                <p className="text-sm font-serif text-brand-gold font-bold">${Number(product.price).toFixed(2)}</p>
                <p className="text-[10px] text-gray-400">
                  {t('admin_products_stock' as any) || 'Stock'}: {(product as any).stock ?? 10}
                </p>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className={glassCardClass + " col-span-3 text-center py-16 text-gray-400 text-sm"}>
            {t('admin_products_empty' as any) || 'No products listed in catalog.'}
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <form
            onSubmit={handleSubmit}
            className={glassCardClass + " p-6 sm:p-8 max-w-lg w-full text-start space-y-4 my-4 max-h-[85vh] overflow-y-auto"}
          >
            <h3 className="font-serif text-2xl text-white mb-4">
              {isEditing ? t('admin_products_edit_title' as any) || 'Edit Product Details' : t('admin_products_add_modal_title' as any) || 'Add New Product'}
            </h3>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('admin_products_field_name' as any) || 'Product Name (or Translation Key)'}
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className={glassInputClass}
                placeholder="e.g. elegant_silk_dress"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {t('admin_orders_table_price')} ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formPrice}
                  onChange={e => setFormPrice(e.target.value)}
                  className={glassInputClass}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {t('admin_products_stock' as any) || 'Stock Count'}
                </label>
                <input
                  type="number"
                  required
                  value={formStock}
                  onChange={e => setFormStock(e.target.value)}
                  className={glassInputClass}
                  placeholder="10"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('admin_products_field_image' as any) || 'Image URL'}
              </label>
              <input
                type="text"
                value={formImage}
                onChange={e => setFormImage(e.target.value)}
                className={glassInputClass}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('admin_products_field_video' as any) || 'Design Video URL (Direct link or YouTube)'}
              </label>
              <input
                type="text"
                value={formVideoUrl}
                onChange={e => setFormVideoUrl(e.target.value)}
                className={glassInputClass}
                placeholder="https://youtube.com/watch?v=... or direct MP4 link"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('admin_products_field_category' as any) || 'Category'}
              </label>
              <select
                className={glassInputClass}
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-gray-800 text-white">
                    {t(cat.labelKey as any)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                {t('admin_products_field_sizes' as any) || 'Available Sizes'}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleToggleSize(size)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${formSizes.includes(size) ? 'bg-brand-gold border-brand-gold text-white shadow-md shadow-brand-gold/20' : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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

      {/* Unified Deletion Confirm Overlay */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title={t('admin_products_delete_confirm' as any) || 'Delete Product'}
        message={`${t('admin_products_delete_warning' as any) || 'Are you sure you want to permanently delete this product from store catalog?'}`}
        confirmText={t('admin_products_action_delete')}
        cancelText={t('modal_cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteOpen(false);
          setProductToDelete(null);
        }}
      />
    </div>
  );
};
