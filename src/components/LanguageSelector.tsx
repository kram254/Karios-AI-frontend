import React, { useState } from 'react';
import { ChevronDown, Languages } from 'lucide-react';
import { languages, useLanguage } from '../context/LanguageContext';

interface LanguageSelectorProps {
  isCollapsed: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ isCollapsed }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelectLanguage = (lang: typeof languages[0]) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="w-full flex items-center p-4 hover:bg-[#2A2A2A] transition-colors"
        title={isCollapsed ? 'Language' : undefined}
      >
        <Languages className="w-5 h-5 text-cyan-500" />
        {!isCollapsed && (
          <div className="ml-3 flex-1 flex justify-between items-center">
            <span>
              <span className="mr-2">{language.flag}</span>
              {language.name}
            </span>
            <ChevronDown className="w-4 h-4" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className={`absolute ${isCollapsed ? 'left-full ml-2' : 'left-0 right-0'} bottom-full mb-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-md shadow-lg z-10 max-h-72 overflow-y-auto`}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelectLanguage(lang)}
              className={`w-full text-left p-3 flex items-center hover:bg-[#2A2A2A] transition-colors ${language.code === lang.code ? 'bg-[#2A2A2A]' : ''}`}
            >
              <span className="mr-2">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
