import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface AboutProps {
  onNavigate: (page: 'about') => void;
}

const About: React.FC<AboutProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [scale, setScale] = useState(2.0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const { top } = sectionRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        const progress = Math.max(0, Math.min(1, top / viewportHeight));
        const newScale = 1 + progress * 1.0;
        
        setScale(Math.min(newScale, 2.0));
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <section className="bg-brand-beige py-20" id="about" ref={sectionRef}>
        <div className="w-full h-px bg-gray-200 mb-20"></div>
      <div className="container mx-auto px-6 grid md:grid-cols-3 gap-12 items-center">
        <div className="w-full overflow-hidden md:col-span-2">
          <img 
            src="https://static.wixstatic.com/media/11062b_d01649f4423b4f1d9ae3a0e14eaaa5c6~mv2.jpg/v1/fill/w_1093,h_618,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/11062b_d01649f4423b4f1d9ae3a0e14eaaa5c6~mv2.jpg" 
            alt="About MODEYA" 
            className="w-full h-auto object-cover transition-transform duration-200 ease-out"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
        <div className="text-center md:text-start">
          <h2 className="text-4xl font-serif mb-4 whitespace-nowrap">{t('about_title')}</h2>
          
          <p className="text-gray-600 leading-relaxed mb-6">
            {t('about_paragraph_short')}
          </p>

          <button 
            onClick={() => onNavigate('about')}
            className="px-10 py-3 bg-black text-white font-semibold tracking-widest text-sm hover:bg-gray-800 transition duration-300"
          >
            {t('about_button_more')}
          </button>
        </div>
      </div>
      <div className="w-full h-px bg-gray-200 mt-20"></div>
    </section>
  );
};

export default About;