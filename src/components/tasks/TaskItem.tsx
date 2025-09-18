import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface TaskProps {
  id: string;
  title: string;
  status: string;
  progress: number;
}

export const TaskItem: React.FC<TaskProps> = ({ title, status, progress }) => {
  const getIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="text-white text-sm">{title}</span>
      </div>
      {status === 'in_progress' && (
        <div className="w-full bg-gray-600 rounded-full h-1 mt-2">
          <div className="bg-blue-400 h-1 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};
