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
    
    const demoSteps = [
      { id: 'search_1', type: 'search_perplexity', name: 'Search Perplexity', status: 'pending' as const },
      { id: 'google_1', type: 'google_search', name: 'Google Search', status: 'pending' as const },
      { id: 'google_2', type: 'google_search', name: 'Google Search', status: 'pending' as const },
      { id: 'google_3', type: 'google_search', name: 'Google Search', status: 'pending' as const },
      { id: 'google_4', type: 'google_search', name: 'Google Search', status: 'pending' as const },
      { id: 'google_5', type: 'google_search', name: 'Google Search', status: 'pending' as const },
      { id: 'extract_1', type: 'extract_webpage_text', name: 'Extract Webpage Text', status: 'pending' as const },
      { id: 'google_6', type: 'google_search', name: 'Google Search', status: 'pending' as const },
      { id: 'google_7', type: 'google_search', name: 'Google Search', status: 'pending' as const },
      { id: 'extract_2', type: 'extract_webpage_text', name: 'Extract Webpage Text', status: 'pending' as const }
    ];
    
    setSteps(demoSteps);
    
    let currentStepIndex = 0;
    const simulateProgress = () => {
      if (currentStepIndex < demoSteps.length) {
        setSteps(prev => prev.map((step, index) => {
          if (index < currentStepIndex) {
            return { ...step, status: 'completed' as const };
          } else if (index === currentStepIndex) {
            return { ...step, status: 'running' as const };
          }
          return step;
        }));
        currentStepIndex++;
      } else {
        clearInterval(progressInterval);
        setTaskResult(`# Updated Research: Open Source Web Automation Projects in 2025

## 🚀 AI-Powered Automation Leaders

### 1. Browser-use - 70,200+ GitHub Stars
- Revolutionary AI-powered browser automation using natural language commands
- Supports multiple LLMs (OpenAI, Claude, Gemini)
- Active development with strong community adoption

### 2. Firecrawl - 58,700+ GitHub Stars  
- Web data API specifically designed for AI applications
- Converts websites into LLM-ready markdown and structured data
- Strong enterprise adoption with Y Combinator backing

[Full detailed report continues...]`);
      }
    };
    
    const progressInterval = setInterval(simulateProgress, 2000);
    simulateProgress();
    
    return () => {
      clearInterval(progressInterval);
    };
  }, [taskId]);

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
            {taskResult}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskMessage;
