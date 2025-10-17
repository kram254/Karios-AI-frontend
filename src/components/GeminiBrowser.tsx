import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Minimize2, Play, StopCircle, RefreshCw, Loader2 } from 'lucide-react';

interface GeminiBrowserProps {
  taskInstruction: string;
  onClose: () => void;
  onMinimize?: () => void;
  chatId?: string;
  taskId?: string;
}

const KariosBrowser: React.FC<GeminiBrowserProps> = ({ 
  taskInstruction, 
  onClose, 
  onMinimize,
  chatId,
  taskId
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('about:blank');
  const [sessionTime, setSessionTime] = useState(0);
  const [browserView, setBrowserView] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [workflowStage, setWorkflowStage] = useState<string>('Initializing');
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const EXECUTION_TIMEOUT = 600000;

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

  const addLog = useCallback((log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setExecutionLogs(prev => [...prev, `[${timestamp}] ${log}`]);
    console.log(`🔵 BROWSER LOG - ${log}`);
  }, []);

  const executeWithGemini = useCallback(async () => {
    console.log('🚀🚀🚀 GEMINI BROWSER - executeWithGemini called');
    console.log('🚀🚀🚀 GEMINI BROWSER - Task instruction:', taskInstruction);
    console.log('🚀🚀🚀 GEMINI BROWSER - Chat ID:', chatId);
    console.log('🚀🚀🚀 GEMINI BROWSER - Task ID:', taskId);
    
    setIsExecuting(true);
    setTaskStatus('running');
    setSessionTime(0);
    setExecutionLogs([]);
    
    addLog('🎯 Browser automation initiated');
    addLog(`📋 Task: ${taskInstruction}`);
    addLog('🔗 Linking to multi-agent workflow system');
    
    if (chatId) {
      addLog(`✅ Connected to chat: ${chatId}`);
    } else {
      addLog('⚠️ No chat ID provided');
    }
    
    if (taskId) {
      addLog(`✅ Tracking task: ${taskId}`);
    } else {
      addLog('⚠️ No task ID provided');
    }
    
    addLog('⏳ Waiting for multi-agent workflow to complete');
    addLog('💡 Check the workflow card in the chat panel for detailed progress');
    
    timeoutRef.current = setTimeout(() => {
      console.error('🚀🚀🚀 GEMINI BROWSER - EXECUTION TIMEOUT REACHED');
      addLog('⚠️ TIMEOUT: Execution exceeded 10 minutes');
      addLog('⚠️ Check backend logs for potential issues');
      setTaskStatus('failed');
      setIsExecuting(false);
    }, EXECUTION_TIMEOUT);
    
    console.log('🚀🚀🚀 GEMINI BROWSER - Timeout set for', EXECUTION_TIMEOUT / 1000, 'seconds');
  }, [taskInstruction, chatId, taskId, addLog, EXECUTION_TIMEOUT]);

  const handleStop = useCallback(() => {
    setIsExecuting(false);
    setTaskStatus('idle');
  }, []);

  const handleRestart = useCallback(() => {
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
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        console.log('🌐 GEMINI BROWSER - Timeout cleared on unmount');
      }
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [taskInstruction, executeWithGemini]);

  useEffect(() => {
    if (!chatId) {
      console.warn('🌐 GEMINI BROWSER - No chatId, cannot listen to workflow updates');
      return;
    }

    console.log('🌐 GEMINI BROWSER - Setting up workflow listener for chat:', chatId);
    
    const handleWorkflowUpdate = (event: CustomEvent) => {
      const { stage, agent_type, status, message } = event.detail;
      console.log('📡 BROWSER - Workflow update received:', event.detail);
      
      if (stage) {
        setWorkflowStage(stage);
        addLog(`🔄 Stage: ${stage}`);
      }
      
      if (agent_type && status) {
        addLog(`⚙️ ${agent_type}: ${status}`);
      }
      
      if (message) {
        addLog(`💬 ${message}`);
      }
    };

    const handleTaskComplete = (event: CustomEvent) => {
      console.log('✅ BROWSER - Task completed:', event.detail);
      addLog('✅ Task execution completed successfully!');
      setTaskStatus('completed');
      setIsExecuting(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleTaskError = (event: CustomEvent) => {
      console.error('❌ BROWSER - Task failed:', event.detail);
      addLog(`❌ Task failed: ${event.detail.error || 'Unknown error'}`);
      setTaskStatus('failed');
      setIsExecuting(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    window.addEventListener('workflow:update', handleWorkflowUpdate as EventListener);
    window.addEventListener('workflow:completed', handleTaskComplete as EventListener);
    window.addEventListener('workflow:error', handleTaskError as EventListener);

    return () => {
      window.removeEventListener('workflow:update', handleWorkflowUpdate as EventListener);
      window.removeEventListener('workflow:completed', handleTaskComplete as EventListener);
      window.removeEventListener('workflow:error', handleTaskError as EventListener);
    };
  }, [chatId, addLog]);

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
                      <div className="text-center p-8 h-full flex flex-col">
                        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                        <p className="text-gray-800 font-semibold text-lg mb-2">Multi-Agent Workflow Running</p>
                        <p className="text-gray-600 max-w-md mx-auto mb-4">Current Stage: <strong>{workflowStage}</strong></p>
                        <p className="text-gray-500 text-sm mb-6">Task: "{taskInstruction}"</p>
                        
                        <div className="flex-1 max-w-2xl mx-auto w-full overflow-hidden">
                          <div className="bg-gray-100 rounded-lg p-4 h-full">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 Execution Log</h3>
                            <div className="bg-black rounded p-3 text-left overflow-y-auto h-[calc(100%-2rem)] font-mono text-xs">
                              {executionLogs.length > 0 ? (
                                executionLogs.map((log, idx) => (
                                  <div key={idx} className="text-green-400 mb-1">{log}</div>
                                ))
                              ) : (
                                <div className="text-gray-500">Waiting for execution logs...</div>
                              )}
                            </div>
                          </div>
                        </div>
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
