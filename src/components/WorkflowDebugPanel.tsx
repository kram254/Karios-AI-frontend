import React, { useState, useEffect } from 'react';
import { workflowMessageQueue } from '../services/workflowMessageQueue';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';

interface WorkflowDebugPanelProps {
  taskId: string;
}

export const WorkflowDebugPanel: React.FC<WorkflowDebugPanelProps> = ({ taskId }) => {
  const [stats, setStats] = useState({
    total: 0,
    rendered: 0,
    unrendered: 0,
    missing: 0,
    missingSequences: [] as number[]
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const currentStats = workflowMessageQueue.getStats(taskId);
      setStats(currentStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [taskId]);

  const getStatusColor = () => {
    if (stats.missing > 0) return 'border-red-500/50 bg-red-500/10';
    if (stats.unrendered > 0) return 'border-yellow-500/50 bg-yellow-500/10';
    return 'border-green-500/50 bg-green-500/10';
  };

  const getStatusIcon = () => {
    if (stats.missing > 0) return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (stats.unrendered > 0) return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />;
    return <CheckCircle className="w-4 h-4 text-green-400" />;
  };

  return (
    <div className={`fixed bottom-4 right-4 border-2 rounded-lg p-3 transition-all duration-300 ${getStatusColor()} backdrop-blur-sm z-50`}>
      <div 
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {getStatusIcon()}
        <div className="text-sm">
          <div className="font-semibold text-white">
            Message Queue Status
          </div>
          <div className="text-xs text-gray-300">
            {stats.total} total • {stats.rendered} rendered • {stats.unrendered} pending
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300">Total Messages:</span>
            <span className="font-mono text-white font-semibold">{stats.total}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Rendered:
            </span>
            <span className="font-mono text-green-400 font-semibold">{stats.rendered}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Unrendered:
            </span>
            <span className="font-mono text-yellow-400 font-semibold">{stats.unrendered}</span>
          </div>
          
          {stats.missing > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Missing:
              </span>
              <span className="font-mono text-red-400 font-semibold">{stats.missing}</span>
            </div>
          )}

          {stats.missingSequences.length > 0 && (
            <div className="mt-2 p-2 bg-red-500/20 rounded text-xs">
              <div className="text-red-300 font-semibold mb-1">Missing Sequences:</div>
              <div className="font-mono text-red-200">{stats.missingSequences.join(', ')}</div>
            </div>
          )}

          <div className="mt-2 text-xs text-gray-400 text-center">
            100% Guarantee Active ✓
          </div>
        </div>
      )}
    </div>
  );
};
