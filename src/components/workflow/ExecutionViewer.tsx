import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ExecutionViewerProps {
  executionId: string;
  workflowName: string;
  onClose: () => void;
}

interface NodeResult {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  output?: any;
  error?: string;
}

export const ExecutionViewer: React.FC<ExecutionViewerProps> = ({
  executionId,
  workflowName,
  onClose
}) => {
  const [execution, setExecution] = useState<any>(null);
  const [nodeResults, setNodeResults] = useState<Record<string, NodeResult>>({});
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    const fetchExecution = async () => {
      try {
        const response = await fetch(`/api/workflows/executions/${executionId}`);
        const data = await response.json();
        setExecution(data);
        setNodeResults(data.nodeResults || {});
        
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Failed to fetch execution:', error);
      }
    };

    fetchExecution();

    if (isPolling) {
      const interval = setInterval(fetchExecution, 1000);
      return () => clearInterval(interval);
    }
  }, [executionId, isPolling]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Play className="w-5 h-5 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const calculateProgress = () => {
    const results = Object.values(nodeResults);
    if (results.length === 0) return 0;
    
    const completed = results.filter(r => r.status === 'completed' || r.status === 'failed').length;
    return Math.round((completed / results.length) * 100);
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return '-';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  if (!execution) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-4xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{workflowName}</h2>
            <p className="text-sm text-gray-600 mt-1">Execution ID: {executionId}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg border ${getStatusColor(execution.status)}`}>
              <div className="flex items-center gap-2">
                {getStatusIcon(execution.status)}
                <span className="font-medium capitalize">{execution.status}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Progress</div>
              <div className="text-2xl font-bold text-gray-900">{calculateProgress()}%</div>
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Duration</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDuration(execution.startedAt, execution.completedAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {Object.entries(nodeResults).map(([nodeId, result]) => (
              <div
                key={nodeId}
                className={`border rounded-lg p-4 transition-all ${
                  result.status === 'running' ? 'ring-2 ring-indigo-400 shadow-lg' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{nodeId}</h3>
                      <span className="text-sm text-gray-600">
                        {formatDuration(result.startedAt, result.completedAt)}
                      </span>
                    </div>
                    
                    {result.status === 'running' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span>Executing...</span>
                      </div>
                    )}

                    {result.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                        <div className="flex items-center gap-2 text-red-800 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Error:</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">{result.error}</p>
                      </div>
                    )}

                    {result.output && result.status === 'completed' && (
                      <div className="bg-gray-50 rounded p-3 mt-2">
                        <div className="text-xs text-gray-600 mb-1">Output:</div>
                        <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                          {typeof result.output === 'string' 
                            ? result.output 
                            : JSON.stringify(result.output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
