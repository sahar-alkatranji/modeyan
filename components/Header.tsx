import React from 'react';
import { NAV_LINKS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { SocialLink } from '../types';

interface HeaderProps {
  onNavigate: (page: 'home' | 'login' | 'shop' | 'about', anchor?: string) => void;
  cartItemCount: number;
  onCartClick: () => void;
  socialLinks: SocialLink[];
}

const Header: React.FC<HeaderProps> = ({ onNavigate, cartItemCount, onCartClick, socialLinks }) => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-beige bg-opacity-95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Brand Name */}
        <button
          onClick={() => onNavigate('home')}
          className="font-serif text-3xl font-bold tracking-wider"
          aria-label="Go to homepage"
        >
          MODEYA
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.key}
              onClick={() => onNavigate(link.page, link.anchor)}
              className="text-gray-600 hover:text-black tracking-widest text-sm"
            >
              {t(link.key as any)}
            </button>
          ))}
        </nav>

        {/* Right side icons */}
        <div className="flex items-center space-x-5">
            <div className="hidden md:flex items-center space-x-4">
                {socialLinks.filter(social => social.isEnabled).map((social) => (
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
          
            <div className="flex items-center space-x-4">
                <button
                  onClick={toggleLanguage}
                  className="text-gray-600 hover:text-black text-sm font-medium tracking-wider"
                  aria-label={`Switch to ${language === 'en' ? 'Arabic' : 'English'}`}
                >
                  {language === 'en' ? t('header_lang_switch_ar') : t('header_lang_switch_en')}
                </button>
                <div className="h-4 w-px bg-gray-300"></div>
                <button onClick={() => onNavigate('login')} className="text-gray-600 hover:text-black flex items-center space-x-1 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{t('header_login')}</span>
                </button>

                <button onClick={onCartClick} className="relative text-gray-600 hover:text-black" aria-label="Open shopping cart">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartItemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {cartItemCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
        
        {/* Mobile Menu Button can be added here if needed */}
      </div>
    </header>
  );
};

export default Header;