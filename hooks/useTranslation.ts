import { useLanguage } from '../contexts/LanguageContext';
import { en } from '../translations/en';
import { ar } from '../translations/ar';

const translations = { en, ar };

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key: keyof typeof en) => {
    return translations[language][key] || key;
  };

  return { t };
};
