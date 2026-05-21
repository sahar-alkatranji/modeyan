import React from 'react';
import { FOOTER_LINKS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';
import { SocialLink } from '../types';

type ShopCategory = 'all' | 'long' | 'short' | 'summer' | 'winter' | 'spring' | 'autumn';

interface FooterProps {
  socialLinks: SocialLink[];
  onNavigate?: (page: string) => void;
  onShopCategory?: (category: ShopCategory) => void;
}

// Map footer link keys to shop categories
const CATEGORY_MAP: Record<string, ShopCategory> = {
  footer_shop_long: 'long',
  footer_shop_short: 'short',
  footer_shop_summer: 'summer',
  footer_shop_winter: 'winter',
  footer_shop_spring: 'spring',
  footer_shop_autumn: 'autumn',
};

const Footer: React.FC<FooterProps> = ({ socialLinks, onNavigate, onShopCategory }) => {
  const { t } = useTranslation();

  const handleShopLinkClick = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    const category = CATEGORY_MAP[key];
    if (category && onShopCategory) {
      onShopCategory(category);
    } else if (onNavigate) {
      onNavigate('shop');
    }
  };

  return (
    <footer className="bg-brand-beige text-gray-600">
      <div className="container mx-auto px-6 py-16">
        {/* Subscription Section */}
        <div className="text-center mb-16">
          <h3 className="text-2xl font-serif mb-2 text-black">{t('footer_subscribe_title')}</h3>
          <p className="mb-6">{t('footer_subscribe_text')}</p>
          <div className="flex justify-center max-w-md mx-auto">
            <input type="email" placeholder={t('footer_subscribe_placeholder')} className="flex-grow p-3 border border-e-0 border-gray-300 focus:outline-none" />
            <button className="px-8 py-3 bg-black text-white font-semibold tracking-widest text-sm hover:bg-gray-800 transition duration-300">
              {t('footer_subscribe_button')}
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-start">
          {/* Shop Categories */}
          <div>
            <h4 className="font-bold text-black mb-4 tracking-widest">{t('footer_shop_title')}</h4>
            <ul>
              {FOOTER_LINKS.shop.map(link => (
                <li key={link.key} className="mb-2">
                  <a
                    href={link.href}
                    onClick={(e) => handleShopLinkClick(e, link.key)}
                    className="hover:text-black cursor-pointer transition-colors duration-200 hover:underline"
                  >
                    {t(link.key as any)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Store Info */}
          <div>
            <h4 className="font-bold text-black mb-4 tracking-widest">{t('footer_store_title')}</h4>
            <p className="mb-2 font-medium text-gray-700">+963 969 656 346</p>
            <p className="mb-2 text-gray-700">bsaman710@gmail.com</p>
            <p className="mb-4 text-gray-700">حماة، سوريا</p>
            {/* WhatsApp Link */}
            <a
              href="https://wa.me/963969656346"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              تواصل واتساب
            </a>
             <ul className="mt-4">
              {FOOTER_LINKS.store.map(link => (
                <li key={link.key} className="mb-2">
                  <span>{t(link.key as any)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy */}
          <div>
            <h4 className="font-bold text-black mb-4 tracking-widest">{t('footer_policy_title')}</h4>
            <ul>
              {FOOTER_LINKS.policy.map(link => (
                <li key={link.key} className="mb-2">
                  <a
                    href={link.href}
                    onClick={link.key === 'footer_policy_shipping' && onNavigate ? (e) => { e.preventDefault(); onNavigate('policy-shipping'); } : undefined}
                    className="hover:text-black cursor-pointer"
                  >
                    {t(link.key as any)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Socials */}
          <div className="md:col-start-4 flex flex-col items-center md:items-start">
             <h4 className="font-bold text-black mb-4 tracking-widest">{t('footer_socials_title')}</h4>
             <div className="flex space-x-4">
                {socialLinks.filter(social => social.isEnabled).map(social => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform duration-200 hover:scale-110"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
             </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-6 py-4 text-center text-sm text-gray-500">
          <p>© 2025 MODEYA. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;