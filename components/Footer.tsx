import React, { useState } from 'react';
import { FOOTER_LINKS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';
import { SocialLink } from '../types';
import { api } from '../services/api';

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

// Map footer policy link keys to app pages
const POLICY_PAGE_MAP: Record<string, string> = {
  footer_policy_shipping: 'policy-shipping',
  footer_policy_store: 'policy-store',
  footer_policy_payment: 'policy-payment',
  footer_policy_faq: 'faq',
};

const Footer: React.FC<FooterProps> = ({ socialLinks, onNavigate, onShopCategory }) => {
  const { t } = useTranslation();
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'busy' | 'success' | 'invalid'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = subscribeEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubscribeStatus('invalid');
      return;
    }
    setSubscribeStatus('busy');
    try {
      await api.subscribeNewsletter(email);
    } catch (err) {
      // Subscription is best-effort: still confirm to the visitor even if the
      // backend endpoint is unavailable, so the button never feels broken.
      console.error('Newsletter subscribe failed', err);
    }
    setSubscribeEmail('');
    setSubscribeStatus('success');
  };

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
          <form onSubmit={handleSubscribe} className="flex justify-center max-w-md mx-auto">
            <input
              type="email"
              value={subscribeEmail}
              onChange={e => { setSubscribeEmail(e.target.value); if (subscribeStatus !== 'idle') setSubscribeStatus('idle'); }}
              placeholder={t('footer_subscribe_placeholder')}
              className="flex-grow p-3 border border-e-0 border-gray-300 focus:outline-none"
            />
            <button
              type="submit"
              disabled={subscribeStatus === 'busy'}
              className="px-8 py-3 bg-black text-white font-semibold tracking-widest text-sm hover:bg-gray-800 transition duration-300 disabled:opacity-60"
            >
              {t('footer_subscribe_button')}
            </button>
          </form>
          {subscribeStatus === 'success' && (
            <p className="mt-4 text-sm text-green-700 font-medium">✓ {t('footer_subscribe_success' as any)}</p>
          )}
          {subscribeStatus === 'invalid' && (
            <p className="mt-4 text-sm text-red-600 font-medium">{t('footer_subscribe_invalid' as any)}</p>
          )}
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
                    onClick={POLICY_PAGE_MAP[link.key] && onNavigate ? (e) => { e.preventDefault(); onNavigate(POLICY_PAGE_MAP[link.key]); } : undefined}
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
             <a
               href="https://www.instagram.com/modeyaboutiq/"
               target="_blank"
               rel="noopener noreferrer"
               className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-black transition-colors duration-200"
             >
               <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                 <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z"/>
               </svg>
               @modeyaboutiq
             </a>
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