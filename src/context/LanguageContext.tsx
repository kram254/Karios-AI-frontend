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

type TranslationKey = 'greeting' | 'ask_placeholder' | 'new_chat' | 'chat' | 'builder' | 'fleet' | 'settings';

const translations: Record<string, Record<TranslationKey, string>> = {
  en: { greeting: "Hi, I'm Karios AI.", ask_placeholder: "Ask Karios AI…", new_chat: "New chat", chat: "Chat", builder: "Builder", fleet: "Fleet", settings: "Settings" },
  es: { greeting: "Hola, soy Karios AI.", ask_placeholder: "Pregunta a Karios AI…", new_chat: "Nuevo chat", chat: "Chat", builder: "Constructor", fleet: "Flota", settings: "Ajustes" },
  fr: { greeting: "Bonjour, je suis Karios AI.", ask_placeholder: "Demandez à Karios AI…", new_chat: "Nouveau chat", chat: "Chat", builder: "Constructeur", fleet: "Flotte", settings: "Paramètres" },
  pt: { greeting: "Olá, sou Karios AI.", ask_placeholder: "Pergunte ao Karios AI…", new_chat: "Novo chat", chat: "Chat", builder: "Construtor", fleet: "Frota", settings: "Configurações" },
  it: { greeting: "Ciao, sono Karios AI.", ask_placeholder: "Chiedi a Karios AI…", new_chat: "Nuova chat", chat: "Chat", builder: "Costruttore", fleet: "Flotta", settings: "Impostazioni" },
  ru: { greeting: "Привет, я Karios AI.", ask_placeholder: "Спросите Karios AI…", new_chat: "Новый чат", chat: "Чат", builder: "Конструктор", fleet: "Флот", settings: "Настройки" },
  zh: { greeting: "你好，我是 Karios AI。", ask_placeholder: "询问 Karios AI…", new_chat: "新对话", chat: "对话", builder: "构建器", fleet: "机队", settings: "设置" },
  ko: { greeting: "안녕하세요, 저는 Karios AI입니다.", ask_placeholder: "Karios AI에게 물어보세요…", new_chat: "새 대화", chat: "대화", builder: "빌더", fleet: "플릿", settings: "설정" },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  getLanguageName: (code: string) => string;
  translate: (key: TranslationKey) => string;
};

const defaultLanguage = languages[0]; // English

const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  getLanguageName: () => '',
  translate: (key: TranslationKey) => translations['en'][key],
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

  const translate = (key: TranslationKey): string => {
    const t = translations[language.code];
    return (t && t[key]) ? t[key] : (translations['en'][key] ?? key);
  };

  useEffect(() => {
    // When language changes, you could dispatch other side effects here if needed
    document.documentElement.lang = language.code;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getLanguageName, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};
