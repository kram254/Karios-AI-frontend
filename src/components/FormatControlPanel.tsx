import React, { useState } from 'react';
import { Settings2, ChevronDown } from 'lucide-react';

export interface FormatPreferences {
  length: 'brief' | 'standard' | 'detailed';
  format: 'paragraphs' | 'bullets' | 'structured';
  tone: 'casual' | 'professional' | 'technical';
}

interface FormatControlPanelProps {
  preferences: FormatPreferences;
  onPreferencesChange: (preferences: FormatPreferences) => void;
  disabled?: boolean;
}

const options = {
  length: ['brief', 'standard', 'detailed'],
  format: ['paragraphs', 'bullets', 'structured'],
  tone: ['casual', 'professional', 'technical']
};

export const FormatControlPanel: React.FC<FormatControlPanelProps> = ({
  preferences, onPreferencesChange, disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof FormatPreferences, value: string) => {
    onPreferencesChange({ ...preferences, [key]: value });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 transition-colors disabled:opacity-50"
      >
        <Settings2 className="w-3.5 h-3.5" />
        <span>Format</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 min-w-[220px] z-50">
          {(['length', 'format', 'tone'] as const).map(key => (
            <div key={key} className="mb-2 last:mb-0">
              <label className="text-xs text-gray-500 mb-1 block capitalize">{key}</label>
              <div className="flex gap-1">
                {options[key].map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleChange(key, opt)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors capitalize ${
                      preferences[key] === opt 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                        : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 border border-transparent'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormatControlPanel;
