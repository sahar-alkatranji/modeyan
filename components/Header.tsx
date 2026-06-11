import React, { useState } from 'react';
import { NAV_LINKS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { SocialLink } from '../types';

interface HeaderProps {
  onNavigate: (page: 'home' | 'login' | 'shop' | 'about' | 'user-dashboard' | 'designers-works', anchor?: string) => void;
  cartItemCount: number;
  onCartClick: () => void;
  socialLinks: SocialLink[];
  isAuthenticated: boolean;
  onLogout: () => void;
  hidden?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, cartItemCount, onCartClick, socialLinks, isAuthenticated, onLogout, hidden }) => {
  if (hidden) return null;
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-beige/95 backdrop-blur-sm shadow-sm">
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
        <nav className="hidden md:flex items-center gap-8">
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
        <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-4">
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

            <div className="flex items-center gap-4">
                <button
                  onClick={toggleLanguage}
                  className="text-gray-600 hover:text-black text-sm font-medium tracking-wider"
                  aria-label={`Switch to ${language === 'en' ? 'Arabic' : 'English'}`}
                >
                  {language === 'en' ? t('header_lang_switch_ar') : t('header_lang_switch_en')}
                </button>
                <div className="h-4 w-px bg-gray-300 hidden md:block"></div>
                {isAuthenticated ? (
                  <div className="hidden md:flex items-center gap-3">
                    <button onClick={() => onNavigate('user-dashboard')} className="text-gray-600 hover:text-black flex items-center gap-1 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span>{t('header_dashboard' as any)}</span>
                    </button>
                    <button onClick={onLogout} className="text-gray-600 hover:text-black flex items-center gap-1 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>{t('header_logout' as any)}</span>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => onNavigate('login')} className="hidden md:flex text-gray-600 hover:text-black items-center gap-1 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{t('header_login')}</span>
                  </button>
                )}

                <button onClick={onCartClick} className="relative text-gray-600 hover:text-black" aria-label="Open shopping cart">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartItemCount > 0 && (
                        <span className="absolute -top-2 -end-2 bg-black text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {cartItemCount}
                        </span>
                    )}
                </button>

                {/* Mobile hamburger */}
                <button
                  className="md:hidden text-gray-600 hover:text-black focus:outline-none"
                  onClick={() => setIsMobileMenuOpen(prev => !prev)}
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
            </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-brand-beige/98 border-t border-gray-100 px-6 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <button
              key={link.key}
              onClick={() => { onNavigate(link.page, link.anchor); setIsMobileMenuOpen(false); }}
              className="block w-full text-start text-gray-600 hover:text-black tracking-widest text-sm py-2"
            >
              {t(link.key as any)}
            </button>
          ))}
          <div className="border-t border-gray-200 pt-3 space-y-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => { onNavigate('user-dashboard'); setIsMobileMenuOpen(false); }}
                  className="block w-full text-start text-gray-600 hover:text-black text-sm py-1"
                >
                  {t('header_dashboard' as any)}
                </button>
                <button
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-2 w-full text-start text-red-700 hover:text-red-900 font-medium text-base py-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('header_logout' as any)}
                </button>
              </>
            ) : (
              <button
                onClick={() => { onNavigate('login'); setIsMobileMenuOpen(false); }}
                className="block w-full text-start text-gray-600 hover:text-black text-sm py-1"
              >
                {t('header_login')}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
