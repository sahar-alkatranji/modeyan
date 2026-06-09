import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface HeroProps {
  onNavigate: (page: 'shop' | 'design-dress') => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const { t, lang } = useTranslation();
  const isAr = lang === 'ar';
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section 
      className="relative h-[80vh] bg-cover bg-no-repeat bg-scroll overflow-hidden"
      style={{ 
        backgroundImage: "url('https://static.wixstatic.com/media/88aac0_a61bd9903e7942cba653459562a80d35~mv2.jpeg')",
        backgroundPosition: isDesktop ? 'center calc(15% - 200px)' : 'center 15%'
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
        <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-widest">MODEYA</h1>
        <p className="mt-4 text-lg sm:text-xl md:text-2xl lg:text-3xl tracking-widest">{t('hero_subtitle')}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => onNavigate('shop')}
            className="px-8 sm:px-10 py-3 bg-white text-black font-semibold tracking-widest text-sm hover:bg-gray-200 transition duration-300"
          >
            {t('hero_button')}
          </button>
          <button 
            onClick={() => onNavigate('design-dress')}
            className="px-8 sm:px-10 py-3 bg-transparent border-2 border-white text-white font-semibold tracking-widest text-sm hover:bg-white hover:text-black transition duration-300"
          >
            {isAr ? 'صمم فستانك' : 'Design Your Dress'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
