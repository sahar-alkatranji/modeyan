import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Product } from '../../types';
import { api } from '../../services/api';
import { glassCardClass, glassInputClass, ConfirmDialog, GlassDropdown } from './DashboardShared';

interface AdminProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

type ProductMode = 'list' | 'add' | 'edit';

export const AdminProducts: React.FC<AdminProductsProps> = ({ products, setProducts }) => {
  const { t } = useTranslation();

  const [mode, setMode] = useState<ProductMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formNameEn, setFormNameEn] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L']);
  const [formCategory, setFormCategory] = useState('long_dress');
  const [formStock, setFormStock] = useState('10');
  const [isUnlimitedStock, setIsUnlimitedStock] = useState(false);
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [localPreviewImage, setLocalPreviewImage] = useState('');

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

  const resetForm = () => {
    setSelectedProduct(null);
    setFormNameEn('');
    setFormNameAr('');
    setFormPrice('');
    setFormImage('');
    setFormSizes(['S', 'M', 'L']);
    setFormCategory('long_dress');
    setFormStock('10');
    setIsUnlimitedStock(false);
    setFormVideoUrl('');
    setLocalPreviewImage('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setMode('add');
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormNameEn(product.name || '');
    setFormNameAr(product.description || '');
    setFormPrice(String(product.price ?? ''));
    // Fix: Handle both camelCase and snake_case, single image and array
    const imageUrl = (product as any).image_url || (product as any).imageUrl || product.imageUrls?.[0] || '';
    setFormImage(imageUrl);
    setFormSizes(product.sizes || ['S', 'M', 'L']);
    setFormCategory((product as any).category || 'long_dress');
    const stockValue = (product as any).stock;
    const unlimited = stockValue === -1 || stockValue === 'unlimited';
    setIsUnlimitedStock(unlimited);
    setFormStock(unlimited ? '' : String(stockValue ?? '10'));
    setFormVideoUrl(product.videoUrl || (product as any).video_url || '');
    setLocalPreviewImage('');
    setMode('edit');
  };

  const handleToggleSize = (size: string) => {
    setFormSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const handleImageUpload = async (file?: File | null) => {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setLocalPreviewImage(localUrl);
    setIsUploadingImage(true);
    try {
      const res = await api.uploadFile(file, 'image');
      const browserUrl = res.url.startsWith('http')
        ? res.url
        : `${window.location.origin}${res.url.replace('/storage/uploads/', '/api/v1/uploads/')}`;
      setFormImage(browserUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const previewTitle = useMemo(() => formNameAr || formNameEn || (t('admin_products_add_modal_title' as any) || 'New Product'), [formNameAr, formNameEn, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameEn || !formPrice) {
      alert('English product name and price are required');
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      alert('Price must be a valid positive number');
      return;
    }

    if (!isUnlimitedStock) {
      const stockNum = parseInt(formStock, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        alert('Stock must be a valid number');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: formNameEn,
        description: formNameAr || null,
        price: priceNum,
        image_url: formImage || 'https://placehold.co/400x600?text=Dress',
        is_public: true,
        image_urls: formImage ? [formImage] : ['https://placehold.co/400x600?text=Dress'],
        sizes: formSizes,
        category: formCategory,
        stock: isUnlimitedStock ? -1 : parseInt(formStock, 10),
        video_url: formVideoUrl,
      };

      if (mode === 'edit' && selectedProduct) {
        const updatedRes = await api.updateProduct(Number(selectedProduct.id), payload);
        // Fix: Handle both snake_case and camelCase from API response
        const imageUrls = updatedRes.image_urls || 
                         (updatedRes.image_url ? [updatedRes.image_url] : [formImage || 'https://placehold.co/400x600?text=Dress']);
        const updatedProduct: Product = {
          id: Number(updatedRes.id),
          name: updatedRes.name || formNameEn,
          description: updatedRes.description || formNameAr,
          price: Number(updatedRes.price ?? priceNum),
          imageUrls: imageUrls,
          sizes: updatedRes.sizes || formSizes,
          videoUrl: updatedRes.video_url || formVideoUrl || '',
        };
        (updatedProduct as any).category = updatedRes.category || formCategory;
        (updatedProduct as any).stock = updatedRes.stock ?? (isUnlimitedStock ? -1 : parseInt(formStock, 10));
        // Also store snake_case versions for compatibility
        (updatedProduct as any).image_url = imageUrls[0];
        (updatedProduct as any).image_urls = imageUrls;
        setProducts(prev => prev.map(p => (p.id === selectedProduct.id ? updatedProduct : p)));
      } else {
        const createdRes = await api.createProduct(payload);
        // Fix: Handle both snake_case and camelCase from API response
        const imageUrls = createdRes.image_urls || 
                         (createdRes.image_url ? [createdRes.image_url] : [formImage || 'https://placehold.co/400x600?text=Dress']);
        const newProduct: Product = {
          id: Number(createdRes.id),
          name: createdRes.name || formNameEn,
          description: createdRes.description || formNameAr,
          price: Number(createdRes.price ?? priceNum),
          imageUrls: imageUrls,
          sizes: createdRes.sizes || formSizes,
          videoUrl: createdRes.video_url || formVideoUrl || '',
        };
        (newProduct as any).category = createdRes.category || formCategory;
        (newProduct as any).stock = createdRes.stock ?? (isUnlimitedStock ? -1 : parseInt(formStock, 10));
        // Also store snake_case versions for compatibility
        (newProduct as any).image_url = imageUrls[0];
        (newProduct as any).image_urls = imageUrls;
        setProducts(prev => [newProduct, ...prev]);
      }

      alert(t('profile_save_success'));
      resetForm();
      setMode('list');
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

  if (mode !== 'list') {
    return (
      <div className="animate-fade-in text-start space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-4xl font-serif text-white mb-2">
              {mode === 'edit' ? (t('admin_products_edit_title' as any) || 'Edit Product') : (t('admin_products_add_modal_title' as any) || 'Add New Product')}
            </h2>
            <p className="text-base text-gray-200">
              {mode === 'edit' ? 'عدّلي بيانات المنتج من نفس الصفحة بشكل أوضح وأسهل.' : 'أضيفي منتج جديد من خلال صفحة كاملة داخل لوحة التحكم.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setMode('list');
            }}
            className="px-6 py-3 rounded-xl border border-white/20 bg-white/10 text-white text-sm font-bold hover:bg-white/15 transition-colors"
          >
            {t('modal_cancel')}
          </button>
        </div>

        <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-8">
          <form onSubmit={handleSubmit} className={glassCardClass + ' p-8 sm:p-10 space-y-6'}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-200 uppercase tracking-widest mb-2">
                  اسم المنتج بالإنجليزية
                </label>
                <input
                  type="text"
                  required
                  value={formNameEn}
                  onChange={e => setFormNameEn(e.target.value)}
                  className={glassInputClass + ' text-base placeholder:text-gray-500'}
                  placeholder="Elegant Silk Dress"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-200 uppercase tracking-widest mb-2">
                  اسم المنتج بالعربية
                </label>
                <input
                  type="text"
                  value={formNameAr}
                  onChange={e => setFormNameAr(e.target.value)}
                  className={glassInputClass + ' text-base placeholder:text-gray-500'}
                  placeholder="فستان حرير أنيق"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-200 uppercase tracking-widest mb-2">
                  {t('admin_orders_table_price')} ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formPrice}
                  onChange={e => setFormPrice(e.target.value)}
                  className={glassInputClass + ' text-base'}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-200 uppercase tracking-widest mb-2">
                  المخزون
                </label>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setIsUnlimitedStock(false)}
                      className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${!isUnlimitedStock ? 'bg-brand-gold border-brand-gold text-white' : 'bg-white/5 border-white/10 text-gray-200 hover:border-white/30'}`}
                    >
                      كمية محددة
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUnlimitedStock(true)}
                      className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${isUnlimitedStock ? 'bg-brand-gold border-brand-gold text-white' : 'bg-white/5 border-white/10 text-gray-200 hover:border-white/30'}`}
                    >
                      متوفر دائماً
                    </button>
                  </div>
                  {!isUnlimitedStock ? (
                    <input
                      type="number"
                      min="0"
                      value={formStock}
                      onChange={e => setFormStock(e.target.value)}
                      className={glassInputClass + ' text-base'}
                      placeholder="10"
                    />
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-base text-gray-200">
                      هذا المنتج سيظهر كمتوفر دائماً بدون تحديد عدد القطع.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-200 uppercase tracking-widest mb-2">
                الصورة الرئيسية
              </label>
              <div className="grid md:grid-cols-[1fr_auto] gap-4">
                <input
                  type="text"
                  value={formImage}
                  onChange={e => setFormImage(e.target.value)}
                  className={glassInputClass + ' text-base'}
                  placeholder="https://example.com/image.jpg"
                />
                <label className="px-5 py-4 rounded-xl bg-white text-brand-dark text-sm font-bold cursor-pointer hover:bg-brand-gold hover:text-white transition-colors text-center">
                  {isUploadingImage ? 'جاري الرفع...' : 'رفع من الجهاز'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleImageUpload(e.target.files?.[0])}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-300 mt-2">إذا ما عندك رابط، ارفعي الصورة مباشرة من الجهاز.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-200 uppercase tracking-widest mb-2">
                رابط الفيديو
              </label>
              <input
                type="text"
                value={formVideoUrl}
                onChange={e => setFormVideoUrl(e.target.value)}
                className={glassInputClass + ' text-base'}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-200 uppercase tracking-widest mb-2">
                التصنيف
              </label>
              <GlassDropdown
                options={categories.map(cat => ({ value: cat.id, label: t(cat.labelKey as any) }))}
                value={formCategory}
                onChange={setFormCategory}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-200 uppercase tracking-widest mb-3">
                القياسات المتاحة
              </label>
              <div className="flex flex-wrap gap-3">
                {availableSizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleToggleSize(size)}
                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${formSizes.includes(size) ? 'bg-brand-gold border-brand-gold text-white shadow-md shadow-brand-gold/20' : 'bg-white/5 border-white/10 text-gray-200 hover:border-white/30'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setMode('list');
                }}
                className="px-6 py-3 text-white border border-white/20 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
              >
                {t('modal_cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingImage}
                className="px-8 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-brand-gold hover:text-white transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الحفظ...' : (mode === 'edit' ? 'حفظ التعديلات' : 'إضافة المنتج')}
              </button>
            </div>
          </form>

          <div className={glassCardClass + ' p-8 space-y-5 h-fit sticky top-6'}>
            <h3 className="text-2xl font-serif text-white">معاينة المنتج</h3>
            <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-white/5 border border-white/10">
              <img
                src={localPreviewImage || formImage || 'https://placehold.co/400x600?text=MODEYA'}
                alt={previewTitle}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-2xl font-serif text-white mb-2">{previewTitle}</p>
              {formNameEn && formNameAr && (
                <p className="text-base text-gray-300 mb-2">{formNameEn}</p>
              )}
              <p className="text-xl font-serif text-brand-gold font-bold">${formPrice || '0.00'}</p>
              {localPreviewImage && <p className="text-sm text-green-300 mt-2">تم تحميل الصورة للمعاينة</p>}
              <p className="text-base text-gray-200 mt-3">
                المخزون: {isUnlimitedStock ? 'لا نهائي' : (formStock || '0')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in text-start">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-serif text-white mb-2">{t('admin_products_title')}</h2>
          <p className="text-base text-gray-200">{t('admin_products_subtitle')}</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-6 py-3 bg-white text-brand-dark font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-brand-gold hover:text-white transition-colors"
        >
          {t('admin_products_add_button')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => {
          const stockValue = (product as any).stock;
          const stockLabel = stockValue === -1 || stockValue === 'unlimited' ? 'لا نهائي' : (stockValue ?? 10);
          return (
            <div key={product.id} className={glassCardClass + ' overflow-hidden group flex flex-col justify-between'}>
              <div className="aspect-[3/4] relative overflow-hidden bg-white/5">
                <img
                  src={(product as any).image_url || product.imageUrls?.[0] || (product as any).imageUrl || 'https://placehold.co/400x600?text=Dress'}
                  alt={product.description || product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-sm uppercase tracking-wider font-bold border border-white/10 text-brand-gold">
                  {t((categories.find(c => c.id === (product as any).category)?.labelKey || 'category_long') as any)}
                </div>
                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => handleOpenEdit(product)}
                    className="px-6 py-3 bg-white text-brand-dark font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-brand-gold hover:text-white transition-colors w-36"
                  >
                    {t('admin_payments_configure') || 'Edit'}
                  </button>
                  <button
                    onClick={() => {
                      setProductToDelete(product);
                      setIsDeleteOpen(true);
                    }}
                    className="px-6 py-3 bg-red-500 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-red-600 transition-colors w-36"
                  >
                    {t('admin_products_action_delete')}
                  </button>
                </div>
              </div>
              <div className="p-5 border-t border-white/10 bg-black/20">
                <h3 className="font-bold text-white text-lg mb-1 truncate">{product.description || t(product.name as any)}</h3>
                {product.description && <p className="text-sm text-gray-300 mb-2 truncate">{product.name}</p>}
                <div className="flex justify-between items-center gap-3">
                  <p className="text-lg font-serif text-brand-gold font-bold">${Number(product.price).toFixed(2)}</p>
                  <p className="text-sm text-gray-200">المخزون: {stockLabel}</p>
                </div>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className={glassCardClass + ' col-span-3 text-center py-16 text-gray-300 text-base'}>
            {t('admin_products_empty' as any) || 'No products listed in catalog.'}
          </div>
        )}
      </div>

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
