import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../i18n';

export const LanguageDemo: React.FC = () => {
  const { language } = useLanguage();
  const { t } = useTranslation();

  // Sample text that will update based on selected language
  const demoTexts = [
    'new_chat',
    'settings',
    'agents',
    'language',
    'ai_role',
    'response_style',
    'save_changes'
  ];

  return (
    <div className="p-4 bg-gray-800 rounded-lg max-w-md mx-auto my-4">
      <h2 className="text-xl text-white mb-4">
        Language Demo: <span className="font-bold">{language.name}</span> {language.flag}
      </h2>
      
      <div className="grid grid-cols-2 gap-2">
        {demoTexts.map(key => (
          <div key={key} className="p-2 bg-gray-700 rounded">
            <div className="text-gray-400 text-xs">{key}</div>
            <div className="text-white font-medium">{t(key as any)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
