import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, CheckCircle, AlertCircle, Loader, Search, Brain, FileText, Eye, PenTool } from 'lucide-react';

interface TaskStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  duration?: number;
  results?: any;
  icon: React.ReactNode;
}

interface TaskExecutionPanelProps {
  taskId: string;
  taskTitle: string;
  onComplete?: (results: any) => void;
}

const TaskExecutionPanel: React.FC<TaskExecutionPanelProps> = ({ taskId, taskTitle, onComplete }) => {
  const [steps, setSteps] = useState<TaskStep[]>([
    {
      id: 'refining',
      name: 'Prompt Refinement',
      description: 'Analyzing and structuring your request into clear requirements',
      status: 'pending',
      icon: <Brain className="w-4 h-4" />
    },
    {
      id: 'planning',
      name: 'Execution Planning',
      description: 'Creating detailed action plan with optimal tool selection',
      status: 'pending',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'research',
      name: 'Deep Research',
      description: 'Performing comprehensive research on green building in East Africa',
      status: 'pending',
      icon: <Search className="w-4 h-4" />
    },
    {
      id: 'analysis',
      name: 'Data Analysis',
      description: 'Analyzing research data and LLM training methodologies',
      status: 'pending',
      icon: <Eye className="w-4 h-4" />
    },
    {
      id: 'formatting',
      name: 'Report Generation',
      description: 'Creating comprehensive report with actionable insights',
      status: 'pending',
      icon: <PenTool className="w-4 h-4" />
    }
  ]);

  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  useEffect(() => {
    const pollTaskStatus = async () => {
      try {
        const response = await fetch(`/api/multi-agent-tasks/${taskId}/status`);
        if (response.ok) {
          const taskData = await response.json();
          const stage = taskData.workflow_stage;
          
          console.log(`🔄 Task ${taskId} status: ${stage}`);
          
          const updatedSteps = steps.map(step => {
            if (stage === 'refining' && step.id === 'refining') {
              return { ...step, status: 'running' as const };
            } else if (stage === 'planning' && step.id === 'refining') {
              return { ...step, status: 'completed' as const };
            } else if (stage === 'planning' && step.id === 'planning') {
              return { ...step, status: 'running' as const };
            } else if (stage === 'executing' && step.id === 'planning') {
              return { ...step, status: 'completed' as const };
            } else if (stage === 'executing' && (step.id === 'research' || step.id === 'analysis')) {
              return { ...step, status: 'running' as const };
            } else if (stage === 'reviewing' && (step.id === 'research' || step.id === 'analysis')) {
              return { ...step, status: 'completed' as const };
            } else if (stage === 'formatting' && step.id === 'formatting') {
              return { ...step, status: 'running' as const };
            } else if (stage === 'completed') {
              return { ...step, status: 'completed' as const };
            }
            return step;
          });
          
          setSteps(updatedSteps);
          setCurrentStep(stage);
          
          if (stage === 'completed' && taskData.formatted_output) {
            onComplete?.(taskData.formatted_output);
          }
        }
      } catch (error) {
        console.error('❌ Failed to poll task status:', error);
      }
    };

    const interval = setInterval(pollTaskStatus, 1000);
    pollTaskStatus();

    return () => clearInterval(interval);
  }, [taskId, onComplete]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Task Execution</h3>
        <div className="text-sm text-gray-500">
          {steps.filter(s => s.status === 'completed').length}/{steps.length} completed
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        {taskTitle}
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={step.id} className={`border rounded-lg transition-all duration-200 ${getStatusColor(step.status)}`}>
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-opacity-80"
              onClick={() => toggleStepExpansion(step.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="text-gray-600">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{step.name}</span>
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{step.description}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {step.status === 'running' && (
                  <div className="animate-pulse bg-blue-500 rounded-full w-2 h-2"></div>
                )}
                {expandedSteps.has(step.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            
            {expandedSteps.has(step.id) && (
              <div className="px-3 pb-3 border-t border-gray-100 mt-2 pt-2">
                <div className="text-sm text-gray-600">
                  {step.status === 'running' && (
                    <div className="flex items-center space-x-2">
                      <Loader className="w-3 h-3 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                  {step.status === 'completed' && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      <span>Completed successfully</span>
                    </div>
                  )}
                  {step.status === 'pending' && (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Waiting to start...</span>
                    </div>
                  )}
                </div>
                {step.results && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <pre className="text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(step.results, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskExecutionPanel;
