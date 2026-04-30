import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface AboutPageProps {
  onNavigate: (page: 'home') => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <section
      className="relative min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center text-white p-6"
      style={{
        backgroundImage: "url('https://static.wixstatic.com/media/11062b_d01649f4423b4f1d9ae3a0e14eaaa5c6~mv2.jpg/v1/fill/w_1093,h_618,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/11062b_d01649f4423b4f1d9ae3a0e14eaaa5c6~mv2.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <div className="relative z-10 max-w-3xl text-center bg-black bg-opacity-30 p-10 rounded-lg backdrop-blur-sm">
        <h1 className="text-5xl font-serif mb-8">{t('about_title')}</h1>
        <div className="space-y-5 text-lg leading-relaxed text-gray-200">
          <p>{t('about_paragraph_long_p1')}</p>
          <p>{t('about_paragraph_long_p2')}</p>
          <p>{t('about_paragraph_long_p3')}</p>
          <p>{t('about_paragraph_long_p4')}</p>
          <p>{t('about_paragraph_long_p5')}</p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="mt-12 px-10 py-3 bg-white text-black font-semibold tracking-widest text-sm hover:bg-gray-200 transition duration-300"
        >
          {t('about_page_back_button')}
        </button>
      </div>
    </section>
  );
};

export default AboutPage;
