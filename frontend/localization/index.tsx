import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en/translation.json';
import uk from './uk/translation.json';

// Initialize i18next with bundled app translations and make it available to React components.
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: 'uk',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: en,
    },
    uk: {
      translation: uk,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
