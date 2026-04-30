import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface HeroProps {
  onNavigate: (page: 'shop') => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <section 
      className="relative h-[80vh] bg-cover bg-no-repeat bg-fixed"
      style={{ 
        backgroundImage: "url('https://static.wixstatic.com/media/88aac0_a61bd9903e7942cba653459562a80d35~mv2.jpeg')",
        backgroundPosition: 'center calc(50% + 100px)'
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white">
        <h1 className="font-serif text-8xl md:text-9xl font-bold tracking-widest">MODEYA</h1>
        <p className="mt-4 text-2xl md:text-3xl tracking-widest">{t('hero_subtitle')}</p>
        <button 
          onClick={() => onNavigate('shop')}
          className="mt-8 px-10 py-3 bg-white text-black font-semibold tracking-widest text-sm hover:bg-gray-200 transition duration-300"
        >
          {t('hero_button')}
        </button>
      </div>
    </section>
  );
};

export default Hero;