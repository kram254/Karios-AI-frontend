import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = {
  code: string;
  name: string;
  flag: string;
};

export const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'it', name: 'Italian (Italiano)', flag: '🇮🇹' },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese (Português)', flag: '🇵🇹' },
  { code: 'el', name: 'Greek (Ελληνικά)', flag: '🇬🇷' },
  { code: 'zh', name: 'Chinese (中文)', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean (한국어)', flag: '🇰🇷' },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷' },
  { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺' },
];

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  getLanguageName: (code: string) => string;
};

const defaultLanguage = languages[0]; // English

const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  getLanguageName: () => '',
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get saved language from localStorage
    const savedLanguage = localStorage.getItem('appLanguage');
    if (savedLanguage) {
      try {
        return JSON.parse(savedLanguage) as Language;
      } catch (e) {
        return defaultLanguage;
      }
    }
    return defaultLanguage;
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('appLanguage', JSON.stringify(newLanguage));
  };

  const getLanguageName = (code: string): string => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  useEffect(() => {
    // When language changes, you could dispatch other side effects here if needed
    document.documentElement.lang = language.code;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getLanguageName }}>
      {children}
    </LanguageContext.Provider>
  );
};
