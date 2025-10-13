import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Minimize2, Play, StopCircle, RefreshCw, Loader2 } from 'lucide-react';
import { nextLevelAutomationService } from '../services/nextLevelAutomation';

interface ToolCall {
  name: string;
  args: Record<string, any>;
  result?: any;
}

interface ExecutionStep {
  step: number;
  description: string;
  toolCall: ToolCall;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface GeminiBrowserProps {
  taskInstruction: string;
  onClose: () => void;
  onMinimize?: () => void;
}

const KariosBrowser: React.FC<GeminiBrowserProps> = ({ 
  taskInstruction, 
  onClose, 
  onMinimize 
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentUrl, setCurrentUrl] = useState('about:blank');
  const [sessionTime, setSessionTime] = useState(0);
  const [browserView, setBrowserView] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isExecuting) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    }
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isExecuting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const executeWithGemini = useCallback(async () => {
    console.log('🚀🚀🚀 GEMINI BROWSER - executeWithGemini called');
    console.log('🚀🚀🚀 GEMINI BROWSER - Task instruction:', taskInstruction);
    
    setIsExecuting(true);
    setTaskStatus('running');
    setSessionTime(0);
    
    console.log('🚀🚀🚀 GEMINI BROWSER - Status set to running, calling nextLevelAutomationService');
    
    try {
      const workflowPayload = {
        user_instruction: taskInstruction,
        workflow_steps: [],
        strategy: 'gemini_computer_use',
        context: {
          headless: false,
          enable_browser_view: true
        }
      };
      
      console.log('🚀🚀🚀 GEMINI BROWSER - Workflow payload:', workflowPayload);
      
      const result = await nextLevelAutomationService.executeWorkflow(workflowPayload);
      
      console.log('🚀🚀🚀 GEMINI BROWSER - Workflow result:', result);
      
      if (result.success) {
        console.log('🚀🚀🚀 GEMINI BROWSER - Workflow succeeded');
        setTaskStatus('completed');
        if (result.steps) {
          console.log('🚀🚀🚀 GEMINI BROWSER - Setting steps:', result.steps.length);
          setSteps(result.steps.map((step: any, idx: number) => ({
            step: idx + 1,
            description: step.description,
            toolCall: step.toolCall,
            status: 'completed'
          })));
        }
        if (result.data?.screenshot) {
          console.log('🚀🚀🚀 GEMINI BROWSER - Setting screenshot');
          setBrowserView(`data:image/png;base64,${result.data.screenshot}`);
        }
      } else {
        console.error('🚀🚀🚀 GEMINI BROWSER - Workflow failed:', result);
        setTaskStatus('failed');
      }
    } catch (error) {
      console.error('🚀🚀🚀 GEMINI BROWSER - Execution error:', error);
      setTaskStatus('failed');
    } finally {
      console.log('🚀🚀🚀 GEMINI BROWSER - Execution finished, setting isExecuting to false');
      setIsExecuting(false);
    }
  }, [taskInstruction]);

  const handleStop = useCallback(() => {
    setIsExecuting(false);
    setTaskStatus('idle');
  }, []);

  const handleRestart = useCallback(() => {
    setSteps([]);
    setCurrentUrl('about:blank');
    setBrowserView(null);
    setSessionTime(0);
    setTaskStatus('idle');
    executeWithGemini();
  }, [executeWithGemini]);

  useEffect(() => {
    console.log('🌐🌐🌐 GEMINI BROWSER MOUNTED - Task instruction:', taskInstruction);
    if (taskInstruction) {
      console.log('🌐🌐🌐 GEMINI BROWSER - Starting execution automatically');
      executeWithGemini();
    } else {
      console.warn('🌐🌐🌐 GEMINI BROWSER - No task instruction provided');
    }
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-orange-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00F3FF] rounded flex items-center justify-center text-black font-bold">
              K
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Karios AI</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="p-2 hover:bg-gray-200 rounded"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-full flex flex-col bg-gray-900">
            {taskStatus === 'completed' && (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-4">Task completed</h2>
                  <p className="text-gray-300 mb-6 max-w-xl">
                    "{taskInstruction}"
                  </p>
                  <button
                    onClick={handleRestart}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Restart
                  </button>
                </div>
              </div>
            )}

            {taskStatus === 'running' && (
              <div className="flex-1 bg-white">
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-b">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <div className="flex-1 bg-white rounded px-3 py-1 text-sm text-gray-600">
                      {currentUrl}
                    </div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center bg-gray-50">
                    {browserView ? (
                      <iframe
                        src={browserView}
                        className="w-full h-full border-0"
                        title="Browser View"
                      />
                    ) : (
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                        <p className="text-gray-600">Loading browser...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {taskStatus === 'idle' && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Click Deploy to start automation</p>
                </div>
              </div>
            )}

            {taskStatus === 'failed' && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-400">Task failed</p>
                  <button
                    onClick={handleRestart}
                    className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
            </svg>
            <span>Session time: {formatTime(sessionTime)} / 5:00</span>
          </div>
          
          {isExecuting && (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Stop
            </button>
          )}
        </div>
    </div>
  );
};

export default KariosBrowser;
