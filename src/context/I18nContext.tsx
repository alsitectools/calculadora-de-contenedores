import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, SUPPORTED_LANGUAGES, LanguageInfo, translations } from '../i18n/translations';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  currentLanguage: LanguageInfo;
  availableLanguages: LanguageInfo[];
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'alsiapps_language';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode;
      if (saved && translations[saved]) {
        return saved;
      }
      // Check browser language
      const browserLang = navigator.language.slice(0, 2) as LanguageCode;
      if (browserLang && translations[browserLang]) {
        return browserLang;
      }
    } catch {
      // ignore
    }
    return 'es';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language] || translations.es;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to Spanish or provided fallback or key
    return (translations.es && translations.es[key]) || fallback || key;
  };

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentLanguage,
        availableLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
