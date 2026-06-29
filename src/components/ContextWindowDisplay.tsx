import React, { useState } from 'react';
import { Database, FileText, MessageSquare, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextItem {
  type: 'file' | 'message' | 'web' | 'memory';
  title: string;
  content: string;
  tokens?: number;
  relevance?: number;
}

interface ContextWindowDisplayProps {
  contextItems: ContextItem[];
  totalTokens: number;
  maxTokens: number;
  intelligenceData?: {
    inferredIntent?: string;
    complexity?: string;
    estimatedTime?: number;
    toolsRequired?: number;
  };
}

export const ContextWindowDisplay: React.FC<ContextWindowDisplayProps> = ({
  contextItems,
  totalTokens,
  maxTokens,
  intelligenceData
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'file': return <FileText className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'web': return <Globe className="w-4 h-4" />;
      case 'memory': return <Database className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const tokenPercentage = (totalTokens / maxTokens) * 100;
  const getTokenColor = () => {
    if (tokenPercentage >= 90) return 'bg-red-500';
    if (tokenPercentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">Context Window</span>
          <span className="text-xs text-gray-500">
            {totalTokens.toLocaleString()} / {maxTokens.toLocaleString()} tokens
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-gray-500"
        >
          ▼
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Token Usage</span>
                  <span className="font-medium">{tokenPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className={`${getTokenColor()} h-2 rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${tokenPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {intelligenceData && (
                <div className="mb-4 p-3 bg-[#00F3FF]/5 border border-[#00F3FF]/20 rounded-lg space-y-2">
                  <div className="text-xs font-semibold text-[#00F3FF] mb-2">Intelligence Analysis</div>
                  {intelligenceData.inferredIntent && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-gray-400 font-medium min-w-[80px]">Intent:</span>
                      <span className="text-gray-300">{intelligenceData.inferredIntent}</span>
                    </div>
                  )}
                  {intelligenceData.complexity && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-gray-400 font-medium min-w-[80px]">Complexity:</span>
                      <span className={`font-semibold ${
                        intelligenceData.complexity === 'HIGH' ? 'text-orange-400' :
                        intelligenceData.complexity === 'MEDIUM' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>{intelligenceData.complexity}</span>
                    </div>
                  )}
                  {intelligenceData.estimatedTime && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-gray-400 font-medium min-w-[80px]">Est. Time:</span>
                      <span className="text-gray-300">{intelligenceData.estimatedTime}s</span>
                    </div>
                  )}
                  {intelligenceData.toolsRequired && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-gray-400 font-medium min-w-[80px]">Tools:</span>
                      <span className="text-gray-300">{intelligenceData.toolsRequired}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 max-h-80 overflow-y-auto">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Context Items ({contextItems.length})
                </div>
                {contextItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setSelectedItem(selectedItem === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="text-blue-600 dark:text-blue-400">
                          {getIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-medium truncate">{item.title}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            {item.tokens && <span>{item.tokens} tokens</span>}
                            {item.relevance && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                {(item.relevance * 100).toFixed(0)}% relevant
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: selectedItem === idx ? 180 : 0 }}
                        className="text-gray-400"
                      >
                        {selectedItem === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {selectedItem === idx && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                            <pre className="text-xs whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                              {item.content}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
