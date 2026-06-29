import React from 'react';
import { GitBranch, Loader, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ParallelStep {
  id: string;
  stepNumber: number;
  agentName: string;
  description: string;
  status: 'waiting' | 'running' | 'completed' | 'failed';
  progress?: number;
  startTime?: string;
  endTime?: string;
}

interface ParallelStepVisualizationProps {
  parallelGroups: ParallelStep[][];
  isParallelMode: boolean;
}

export const ParallelStepVisualization: React.FC<ParallelStepVisualizationProps> = ({
  parallelGroups,
  isParallelMode
}) => {
  if (!isParallelMode || parallelGroups.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-950/20';
      case 'failed':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'running':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'waiting':
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className="border border-purple-500/30 rounded-lg p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
          Parallel Execution Mode
        </span>
        <span className="text-xs text-purple-600 dark:text-purple-400 ml-auto">
          {parallelGroups.length} concurrent groups
        </span>
      </div>

      <div className="space-y-6">
        {parallelGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="relative">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Group {groupIdx + 1} ({group.length} agents)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.map((step, stepIdx) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stepIdx * 0.1 }}
                  className={`border-2 ${getStatusColor(step.status)} rounded-lg p-3 relative overflow-hidden`}
                >
                  {step.status === 'running' && step.progress !== undefined && (
                    <div 
                      className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-300"
                      style={{ width: `${step.progress}%` }}
                    />
                  )}

                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {step.agentName}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Step {step.stepNumber}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                    {step.description}
                  </div>

                  {step.startTime && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {step.endTime ? (
                        <span>
                          ⏱️ {Math.round((new Date(step.endTime).getTime() - new Date(step.startTime).getTime()) / 1000)}s
                        </span>
                      ) : (
                        <span>Started {new Date(step.startTime).toLocaleTimeString()}</span>
                      )}
                    </div>
                  )}

                  {step.status === 'running' && step.progress !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium">{step.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {groupIdx < parallelGroups.length - 1 && (
              <div className="flex items-center justify-center my-3">
                <div className="h-6 w-px bg-purple-300 dark:bg-purple-700" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
