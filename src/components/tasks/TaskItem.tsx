import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface TaskProps {
  id: string;
  title: string;
  status: string;
  progress: number;
  details?: {
    stage: string;
    qualityScore?: number;
    executionResults?: any;
    reviewData?: any;
    prpData?: any;
    executionPlan?: any;
  };
}

export const TaskItem: React.FC<TaskProps> = ({ title, status, progress, details }) => {
  const getStageDisplayName = (stage: string): string => {
    const stageNames: Record<string, string> = {
      'created': 'Initializing',
      'refining': 'Refining Requirements',
      'clarifying': 'Awaiting Clarification',
      'planning': 'Creating Execution Plan',
      'executing': 'Executing Tasks',
      'reviewing': 'Quality Review',
      'formatting': 'Formatting Output',
      'completed': 'Completed',
      'failed': 'Failed',
      'retrying': 'Retrying Execution',
      'processing': 'Processing'
    };
    return stageNames[stage] || stage;
  };

  const getIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'clarifying': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default: return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-gray-700/30 rounded p-2 mb-2 border border-gray-600/30">
      <div className="flex items-center gap-2 mb-1">
        {getIcon()}
        <span className="text-white text-xs font-medium truncate">{title}</span>
      </div>
      <div className="text-xs text-gray-400 mb-1">{details?.stage || getStageDisplayName(status)}</div>
      {details?.qualityScore && status === 'completed' && (
        <div className="text-xs text-green-400 mb-1">Quality: {details.qualityScore}%</div>
      )}
      {status !== 'completed' && status !== 'failed' && (
        <div className="w-full bg-gray-600 rounded-full h-1">
          <div 
            className="bg-blue-400 h-1 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}
      {status !== 'completed' && status !== 'failed' && (
        <div className="text-xs text-gray-500 mt-1">{progress}%</div>
      )}
    </div>
  );
};
