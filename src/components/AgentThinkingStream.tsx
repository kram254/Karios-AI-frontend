import React from 'react';
import { Brain, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThinkingEntry {
  id: string;
  agent: string;
  thought: string;
  timestamp: string;
  metadata?: any;
}

interface AgentThinkingStreamProps {
  thoughts: ThinkingEntry[];
  isVisible: boolean;
  onToggle?: () => void;
}

export const AgentThinkingStream: React.FC<AgentThinkingStreamProps> = ({
  thoughts,
  isVisible,
  onToggle
}) => {
  if (!isVisible || thoughts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-4 rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-pulse" />
          <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            Agent Thinking Process
          </span>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            Hide
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700">
        <AnimatePresence mode="popLayout">
          {thoughts.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-start gap-2 p-2 rounded bg-white/50 dark:bg-gray-800/50"
            >
              <div className="flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    {entry.agent}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {entry.thought}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

interface StepProgressEntry {
  id: string;
  step_number: number;
  total_steps: number;
  description: string;
  tool_name: string;
  status: 'starting' | 'running' | 'completed' | 'failed';
  timestamp: string;
  metadata?: any;
}

interface StepProgressTrackerProps {
  steps: StepProgressEntry[];
  isVisible: boolean;
}

export const StepProgressTracker: React.FC<StepProgressTrackerProps> = ({
  steps,
  isVisible
}) => {
  if (!isVisible || steps.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <AlertCircle className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const currentStep = steps[steps.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Step {currentStep.step_number} of {currentStep.total_steps}
            </span>
          </div>
        </div>
        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          {Math.round((currentStep.step_number / currentStep.total_steps) * 100)}%
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep.step_number / currentStep.total_steps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex items-center gap-2">
        {getStatusIcon(currentStep.status)}
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
            {currentStep.tool_name}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {currentStep.description}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
