import React from 'react';
import { FOOTER_LINKS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';
import { SocialLink } from '../types';

interface FooterProps {
  socialLinks: SocialLink[];
}

const Footer: React.FC<FooterProps> = ({ socialLinks }) => {
  const { t } = useTranslation();

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
          <div>
            <h4 className="font-bold text-black mb-4 tracking-widest">{t('footer_shop_title')}</h4>
            <ul>
              {FOOTER_LINKS.shop.map(link => (
                <li key={link.key} className="mb-2">
                  <a href={link.href} className="hover:text-black">{t(link.key as any)}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-black mb-4 tracking-widest">{t('footer_store_title')}</h4>
            <p className="mb-2">123-456-7890</p>
            <p className="mb-2">info@mysite.com</p>
            <p className="mb-4">123 Street Name, City, State, 12345</p>
             <ul>
              {FOOTER_LINKS.store.map(link => (
                <li key={link.key} className="mb-2">
                  <span>{t(link.key as any)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-black mb-4 tracking-widest">{t('footer_policy_title')}</h4>
            <ul>
              {FOOTER_LINKS.policy.map(link => (
                <li key={link.key} className="mb-2">
                  <a href={link.href} className="hover:text-black">{t(link.key as any)}</a>
                </li>
              ))}
            </ul>
          </div>
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
          <p>{t('footer_copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;