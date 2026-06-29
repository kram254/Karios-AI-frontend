import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Zap, AlertCircle, CheckCircle } from 'lucide-react';

interface ThinkingStep {
  step: number;
  content: string;
  type?: 'analysis' | 'reasoning' | 'conclusion';
}

interface ThinkingBlockProps {
  thinking: string | ThinkingStep[];
  confidence?: number;
  isExpanded?: boolean;
  showByDefault?: boolean;
  compactHeader?: boolean;
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'text-green-400';
  if (confidence >= 0.6) return 'text-yellow-400';
  if (confidence >= 0.4) return 'text-orange-400';
  return 'text-red-400';
};

const getConfidenceLabel = (confidence: number) => {
  if (confidence >= 0.8) return 'High confidence';
  if (confidence >= 0.6) return 'Moderate confidence';
  if (confidence >= 0.4) return 'Low confidence';
  return 'Uncertain';
};

const parseThinkingSteps = (thinking: string): ThinkingStep[] => {
  const lines = thinking.split('\n').filter(line => line.trim());
  return lines.map((line, index) => ({
    step: index + 1,
    content: line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''),
    type: line.toLowerCase().includes('conclusion') || line.toLowerCase().includes('therefore') 
      ? 'conclusion' 
      : line.toLowerCase().includes('analyzing') || line.toLowerCase().includes('examining')
        ? 'analysis'
        : 'reasoning'
  }));
};

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  thinking,
  confidence = 0.85,
  isExpanded: initialExpanded = false,
  showByDefault = false,
  compactHeader = false
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded || showByDefault);
  
  const steps = Array.isArray(thinking) ? thinking : parseThinkingSteps(thinking);
  
  if (!thinking || (Array.isArray(thinking) && thinking.length === 0)) {
    return null;
  }

  const getStepIcon = (type?: string) => {
    switch (type) {
      case 'analysis':
        return <Brain className="w-3 h-3 text-blue-400" />;
      case 'conclusion':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      default:
        return <Zap className="w-3 h-3 text-purple-400" />;
    }
  };

  return (
    <div className={compactHeader ? "rounded-lg bg-gray-800/20 overflow-hidden" : "mb-3 rounded-lg bg-gray-800/20 overflow-hidden"}>
      <button
        disabled={compactHeader}
        onClick={() => {
          if (compactHeader) return;
          setIsExpanded(!isExpanded);
        }}
        className={compactHeader
          ? "w-full flex items-center justify-between px-3 py-2"
          : "w-full flex items-center justify-between px-3 py-2 hover:bg-gray-700/20 transition-colors"
        }
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-300">Reasoning Process</span>
          {!compactHeader && (
            <span className="text-xs text-gray-500">({steps.length} steps)</span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {confidence && !compactHeader && (
            <div className={`flex items-center gap-1 text-xs ${getConfidenceColor(confidence)}`}>
              <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    confidence >= 0.8 ? 'bg-green-500' : 
                    confidence >= 0.6 ? 'bg-yellow-500' : 
                    confidence >= 0.4 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span>{getConfidenceLabel(confidence)}</span>
            </div>
          )}
          {!compactHeader && (
            isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )
          )}
        </div>
      </button>
      
      {isExpanded && !compactHeader && (
        <div className="px-3 pb-3">
          <div className="mt-2 space-y-2">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="flex items-start gap-2 text-sm"
              >
                <div className="flex items-center gap-1.5 mt-0.5 min-w-[60px]">
                  {getStepIcon(step.type)}
                  <span className="text-xs text-gray-500">Step {step.step}</span>
                </div>
                <p className="text-gray-300 leading-relaxed">{step.content}</p>
              </div>
            ))}
          </div>
          
          {confidence < 0.6 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 px-2 py-1.5 rounded">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>This response has lower confidence. Consider verifying the information.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThinkingBlock;
