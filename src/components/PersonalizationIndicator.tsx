import React from 'react';
import { Brain, Sparkles, User, Zap } from 'lucide-react';

interface PersonalizationIndicatorProps {
  phase: number;
  interactionCount?: number;
  isActive: boolean;
  topInterests?: string[];
}

const phaseInfo = {
  1: {
    label: 'Learning',
    description: 'Getting to know your preferences',
    icon: <User className="w-3.5 h-3.5" />,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    progress: 20
  },
  2: {
    label: 'Adapting',
    description: 'Starting to personalize responses',
    icon: <Brain className="w-3.5 h-3.5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    progress: 60
  },
  3: {
    label: 'Personalized',
    description: 'Fully adapted to your preferences',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    progress: 100
  }
};

export const PersonalizationIndicator: React.FC<PersonalizationIndicatorProps> = ({
  phase,
  interactionCount = 0,
  isActive,
  topInterests = []
}) => {
  const info = phaseInfo[phase as keyof typeof phaseInfo] || phaseInfo[1];
  const remainingToActivate = Math.max(0, 5 - interactionCount);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${info.bgColor} transition-all duration-300`}>
      <div className={`${info.color}`}>
        {info.icon}
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${info.color}`}>
            {info.label}
          </span>
          {isActive && (
            <Zap className="w-3 h-3 text-yellow-400" />
          )}
        </div>
        
        {phase < 3 && remainingToActivate > 0 && (
          <span className="text-[10px] text-gray-500">
            {remainingToActivate} more interaction{remainingToActivate > 1 ? 's' : ''} to personalize
          </span>
        )}
        
        {phase >= 3 && topInterests.length > 0 && (
          <span className="text-[10px] text-gray-500">
            Interests: {topInterests.slice(0, 2).join(', ')}
          </span>
        )}
      </div>

      <div className="ml-auto w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            phase === 3 ? 'bg-purple-500' : phase === 2 ? 'bg-blue-500' : 'bg-gray-500'
          }`}
          style={{ width: `${info.progress}%` }}
        />
      </div>
    </div>
  );
};

export default PersonalizationIndicator;
