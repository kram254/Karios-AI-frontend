import React, { useState } from 'react';
import { RefreshCw, ChevronDown, Minimize2, Maximize2, Sparkles, Code } from 'lucide-react';

type RegenerateMode = 'default' | 'shorter' | 'longer' | 'simplify' | 'technical';

interface RegenerateOptionsProps {
  onRegenerate: (mode: RegenerateMode) => void;
  disabled?: boolean;
}

const options: { mode: RegenerateMode; label: string; icon: React.ReactNode; instruction: string }[] = [
  { mode: 'default', label: 'Regenerate', icon: <RefreshCw className="w-3.5 h-3.5" />, instruction: '' },
  { mode: 'shorter', label: 'Make Shorter', icon: <Minimize2 className="w-3.5 h-3.5" />, instruction: 'Provide a more concise response.' },
  { mode: 'longer', label: 'Make Longer', icon: <Maximize2 className="w-3.5 h-3.5" />, instruction: 'Provide a more detailed response.' },
  { mode: 'simplify', label: 'Simplify', icon: <Sparkles className="w-3.5 h-3.5" />, instruction: 'Explain in simpler terms.' },
  { mode: 'technical', label: 'More Technical', icon: <Code className="w-3.5 h-3.5" />, instruction: 'Provide more technical depth.' },
];

export const RegenerateOptions: React.FC<RegenerateOptionsProps> = ({ onRegenerate, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (mode: RegenerateMode) => {
    onRegenerate(mode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        <button
          onClick={() => handleSelect('default')}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2 py-1 rounded-l-md text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Regenerate</span>
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="px-1.5 py-1 rounded-r-md text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 border-l border-gray-700 transition-colors disabled:opacity-50"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute bottom-full right-0 mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px] z-50">
          {options.slice(1).map(opt => (
            <button
              key={opt.mode}
              onClick={() => handleSelect(opt.mode)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700/50 transition-colors"
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const getRegenerateInstruction = (mode: RegenerateMode): string => {
  return options.find(o => o.mode === mode)?.instruction || '';
};

export default RegenerateOptions;
