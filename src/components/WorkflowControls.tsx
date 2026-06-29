import React from 'react';
import { Pause, Play, RotateCcw, Square, SkipForward } from 'lucide-react';
import { motion } from 'framer-motion';

interface WorkflowControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  canResume: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRestart: () => void;
  onSkipStep: () => void;
}

export const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  isRunning,
  isPaused,
  canResume,
  onPause,
  onResume,
  onStop,
  onRestart,
  onSkipStep
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
    >
      {isRunning && !isPaused && (
        <button
          onClick={onPause}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          title="Pause workflow"
        >
          <Pause className="w-4 h-4" />
          Pause
        </button>
      )}

      {isPaused && (
        <button
          onClick={onResume}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          title="Resume workflow"
        >
          <Play className="w-4 h-4" />
          Resume
        </button>
      )}

      {isRunning && (
        <button
          onClick={onStop}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          title="Stop workflow"
        >
          <Square className="w-4 h-4" />
          Stop
        </button>
      )}

      {canResume && !isRunning && (
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          title="Restart workflow"
        >
          <RotateCcw className="w-4 h-4" />
          Restart
        </button>
      )}

      {isRunning && (
        <button
          onClick={onSkipStep}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Skip current step"
        >
          <SkipForward className="w-4 h-4" />
          Skip Step
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          isRunning && !isPaused ? 'bg-green-500 animate-pulse' : 
          isPaused ? 'bg-yellow-500' : 
          'bg-gray-400'
        }`} />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {isRunning && !isPaused ? 'Running' : 
           isPaused ? 'Paused' : 
           'Stopped'}
        </span>
      </div>
    </motion.div>
  );
};
