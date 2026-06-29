import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Brain, Zap, CheckCircle } from 'lucide-react';

interface ReActLoopIndicatorProps {
  phase: string;
  step: number;
  totalSteps: number;
  tool: string;
  description: string;
}

const PHASES = [
  { key: 'observe', label: 'Observe', activeLabel: 'Observing', Icon: Eye },
  { key: 'think', label: 'Think', activeLabel: 'Thinking', Icon: Brain },
  { key: 'act', label: 'Act', activeLabel: 'Acting', Icon: Zap },
];

const BouncingDots: React.FC = () => (
  <span className="inline-flex items-center ml-0.5">
    <motion.span
      animate={{ y: [0, -3, 0] }}
      transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
      className="inline-block"
    >
      .
    </motion.span>
    <motion.span
      animate={{ y: [0, -3, 0] }}
      transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
      className="inline-block"
    >
      .
    </motion.span>
    <motion.span
      animate={{ y: [0, -3, 0] }}
      transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
      className="inline-block"
    >
      .
    </motion.span>
  </span>
);

export const ReActLoopIndicator: React.FC<ReActLoopIndicatorProps> = ({
  phase,
  step,
  totalSteps,
  tool,
  description,
}) => {
  const activeIndex = PHASES.findIndex(p => p.key === phase);

  return (
    <AnimatePresence>
      <motion.div
        key="react-loop"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        style={{ marginLeft: '250px', marginRight: '150px' }}
        className="mb-3 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-blue-950/40 backdrop-blur-sm px-4 py-3"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-300 tracking-wide uppercase">
              Agent Loop
            </span>
            {totalSteps > 0 && (
              <span className="text-xs text-gray-500">
                Step {step}/{totalSteps}
              </span>
            )}
          </div>
          {tool && (
            <span className="text-xs text-purple-400 font-mono truncate max-w-[140px]">
              {tool}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 mb-2">
          {PHASES.map((p, idx) => {
            const { Icon } = p;
            const isActive = idx === activeIndex;
            const isDone = idx < activeIndex;

            return (
              <React.Fragment key={p.key}>
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={isActive ? { repeat: Infinity, duration: 1.1 } : {}}
                    className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 ${
                      isActive
                        ? 'border-indigo-400 bg-indigo-500/30 text-indigo-200'
                        : isDone
                        ? 'border-green-500/50 bg-green-900/20 text-green-400'
                        : 'border-gray-600/40 bg-gray-800/20 text-gray-600'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                    )}
                  </motion.div>
                  <motion.span
                    animate={isActive ? { opacity: [1, 0.7, 1] } : { opacity: 1 }}
                    transition={isActive ? { repeat: Infinity, duration: 1.5 } : {}}
                    className={`text-xs font-medium transition-colors duration-300 ${
                      isActive
                        ? 'text-indigo-300'
                        : isDone
                        ? 'text-green-500'
                        : 'text-gray-600'
                    }`}
                  >
                    {isActive ? p.activeLabel : p.label}
                    {isActive && <BouncingDots />}
                  </motion.span>
                </div>
                {idx < PHASES.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-1 transition-all duration-500 ${
                      isDone ? 'bg-green-500/50' : 'bg-gray-700/50'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {description && (
          <p className="text-xs text-gray-400 truncate">
            {description}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
