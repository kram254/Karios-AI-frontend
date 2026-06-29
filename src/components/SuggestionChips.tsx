import React from 'react';
import { Sparkles, Code, BookOpen, ArrowRight, Lightbulb, Layers } from 'lucide-react';

interface Suggestion {
  type: 'action' | 'clarification' | 'related' | 'expansion';
  text: string;
  action: string;
}

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: Suggestion) => void;
  isVisible?: boolean;
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'action':
      return <Code className="w-3 h-3" />;
    case 'clarification':
      return <BookOpen className="w-3 h-3" />;
    case 'related':
      return <Layers className="w-3 h-3" />;
    case 'expansion':
      return <Lightbulb className="w-3 h-3" />;
    default:
      return <ArrowRight className="w-3 h-3" />;
  }
};

const getColorForType = (type: string) => {
  switch (type) {
    case 'action':
      return 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'clarification':
      return 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'related':
      return 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30';
    case 'expansion':
      return 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:
      return 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onSuggestionClick,
  isVisible = true
}) => {
  if (!isVisible || !suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3 animate-fadeIn">
      <div className="flex items-center gap-1 text-xs text-gray-500 mr-2">
        <Sparkles className="w-3 h-3" />
        <span>Suggestions:</span>
      </div>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
            border transition-all duration-200 cursor-pointer
            hover:scale-105 active:scale-95
            ${getColorForType(suggestion.type)}
          `}
        >
          {getIconForType(suggestion.type)}
          <span>{suggestion.text}</span>
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;
