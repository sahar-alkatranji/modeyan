import React, { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { api } from '../services/api';

interface DesignerWork {
  id: number;
  name: string;
  description?: string;
  price?: number;
  imageUrl: string;
  designerName?: string;
  category?: string;
  sizes?: string[];
}

const DesignersWorks: React.FC = () => {
  const { t } = useTranslation();
  const [works, setWorks] = useState<DesignerWork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDesigns(true)
      .then((designs: any[]) => {
        if (!Array.isArray(designs)) return;
        setWorks(designs
          .filter(d => d && d.image_url)
          .map(d => ({
            id: d.id,
            name: d.name || '',
            description: d.description || '',
            price: d.price != null ? Number(d.price) : undefined,
            imageUrl: d.image_url,
            designerName: d.designer_name || undefined,
            category: d.category || undefined,
            sizes: Array.isArray(d.sizes) ? d.sizes : undefined,
          })));
      })
      .catch(e => console.error('Failed to load designer works', e))
      .finally(() => setLoading(false));
  }, []);

  const categoryLabel = (slug?: string) => {
    if (!slug) return null;
    const normalized = slug.replace(/_dress$/, '');
    const label = t(`category_${normalized}` as any);
    return label === `category_${normalized}` ? slug : label;
  };

  return (
    <section className="py-20 bg-brand-beige min-h-screen" id="designers-works">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-serif mb-2 text-brand-dark">{t('designers_works_title' as any)}</h2>
        <p className="text-gray-600 mb-4">{t('designers_works_subtitle' as any)}</p>
        <div className="w-20 h-px bg-brand-gold mx-auto mb-12"></div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4 text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-gold"></div>
            {t('designers_works_loading' as any)}
          </div>
        ) : works.length === 0 ? (
          <div className="py-20 text-center text-gray-500 font-medium">
            {t('designers_works_empty' as any)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 text-start">
            {works.map(work => (
              <div key={work.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-80 overflow-hidden">
                  <img
                    src={work.imageUrl}
                    alt={work.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x600/E5E7EB/9CA3AF?text=MODEYA';
                    }}
                  />
                  {work.category && (
                    <span className="absolute top-3 start-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full tracking-wider">
                      {categoryLabel(work.category)}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-brand-dark mb-1 truncate">{work.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {t('designers_works_by' as any)}: {work.designerName || t('designers_works_default_designer' as any)}
                  </p>
                  {work.price != null && (
                    <p className="text-xl font-serif text-brand-dark font-bold mb-3">${work.price.toFixed(2)}</p>
                  )}
                  {work.sizes && work.sizes.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">{t('designers_works_sizes' as any)}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {work.sizes.map(size => (
                          <span key={size} className="text-xs border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default DesignersWorks;
