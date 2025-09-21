import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Loader, Search, Globe, FileText, AlertCircle } from 'lucide-react';

interface TaskStep {
  id: string;
  type: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  expanded?: boolean;
}

interface TaskMessageProps {
  taskId: string;
  initialMessage: string;
  onComplete?: (result: string) => void;
}

const TaskMessage: React.FC<TaskMessageProps> = ({ taskId, initialMessage, onComplete }) => {
  const [steps, setSteps] = useState<TaskStep[]>([]);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [currentStage, setCurrentStage] = useState<string>('');
  const [taskResult, setTaskResult] = useState<string>('');

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'search_perplexity':
      case 'perplexity':
        return <Search className="w-4 h-4" />;
      case 'google_search':
      case 'search':
        return <Globe className="w-4 h-4" />;
      case 'extract_webpage_text':
      case 'extract':
        return <FileText className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const toggleExpand = (stepId: string) => {
    setExpanded(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  useEffect(() => {
    console.log('🔥 TaskMessage mounted for task:', taskId);
    
    let isPolling = true;
    let pollCount = 0;
    
    const pollTaskStatus = async () => {
      if (!isPolling) return;
      
      try {
        const response = await fetch(`/api/multi-agent/task/${taskId}/status`, {
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          
          if (data.workflow_stage) {
            setCurrentStage(data.workflow_stage);
          }
          
          if (data.execution_results?.step_results && data.execution_results.step_results.length > 0) {
            const taskSteps = data.execution_results.step_results.map((result: any, index: number) => ({
              id: `step_${index}`,
              type: result.tool_name || result.action || 'task',
              name: result.description || result.action || `Step ${index + 1}`,
              status: result.success ? 'completed' : result.error ? 'failed' : 'running',
              result: result.output
            }));
            setSteps(taskSteps);
          } else if (data.workflow_stage && data.workflow_stage !== 'CREATED') {
            setSteps([
              {
                id: 'stage_1',
                type: 'workflow',
                name: `Processing: ${data.workflow_stage}`,
                status: 'running' as const
              }
            ]);
          }
          
          if (data.formatted_output) {
            setTaskResult(data.formatted_output);
            if (onComplete) {
              onComplete(data.formatted_output);
            }
            isPolling = false;
          }
        }
      } catch (error) {
        console.error('Failed to poll task:', error);
      }
      
      pollCount++;
      if (pollCount >= 60) {
        isPolling = false;
      }
    };
    
    const initialSteps = [
      { id: 'init_1', type: 'task', name: 'Initializing task', status: 'running' as const }
    ];
    setSteps(initialSteps);
    
    const pollInterval = setInterval(pollTaskStatus, 2000);
    pollTaskStatus();
    
    return () => {
      isPolling = false;
      clearInterval(pollInterval);
    };
  }, [taskId, onComplete]);

  return (
    <div className="task-message">
      <div className="text-sm text-gray-400 mb-3">{initialMessage}</div>
      
      {steps.length > 0 && (
        <div className="space-y-2">
          {steps.map(step => (
            <div key={step.id} className="task-step-card">
              <div 
                className="task-step-header"
                onClick={() => toggleExpand(step.id)}
              >
                <div className="flex items-center gap-2">
                  <div className="task-step-icon">
                    {getIcon(step.type)}
                  </div>
                  <span className="task-step-name">{step.name}</span>
                  <div className="task-step-status">
                    {step.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400" />}
                    {step.status === 'running' && <Loader className="w-4 h-4 text-blue-400 animate-spin" />}
                    {step.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                </div>
                <div className="task-step-toggle">
                  {expanded[step.id] ? 
                    <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </div>
              
              {expanded[step.id] && (
                <div className="task-step-content">
                  {step.status === 'running' && (
                    <div className="text-sm text-blue-400">Processing...</div>
                  )}
                  {step.status === 'completed' && step.result && (
                    <div className="text-sm text-gray-300">{JSON.stringify(step.result)}</div>
                  )}
                  {step.status === 'pending' && (
                    <div className="text-sm text-gray-500">Waiting...</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {taskResult && (
        <div className="task-result mt-4 p-4 bg-gray-800 rounded-lg">
          <div className="prose prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: taskResult.replace(/\n/g, '<br />') }} />
          </div>
        </div>
      )}
      
      {currentStage && (
        <div className="text-xs text-gray-500 mt-2">
          Stage: {currentStage}
        </div>
      )}
    </div>
  );
};

export default TaskMessage;
