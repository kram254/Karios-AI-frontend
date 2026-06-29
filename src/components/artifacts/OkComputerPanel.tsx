import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Terminal, 
  Table, 
  List, 
  X, 
  Maximize2, 
  Minimize2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader,
  Play,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for the panel props
interface OkComputerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string | null;
  workflowStatus: 'idle' | 'initializing' | 'planning' | 'executing' | 'complete' | 'error';
  currentStep: number;
  totalSteps: number;
  browserState: {
    url: string;
    screenshot?: string;
    screenshotMime?: string;
    action: string;
    isLoading: boolean;
  };
  logs: Array<{
    timestamp: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'task';
    message: string;
  }>;
  todoList: Array<{
    id: string;
    text: string;
    status: 'pending' | 'in_progress' | 'complete' | 'error';
  }>;
  structuredData?: any;
  onStop: () => void;
  isHeadless?: boolean;
}

export const OkComputerPanel: React.FC<OkComputerPanelProps> = ({
  isOpen,
  onClose,
  taskId,
  workflowStatus,
  currentStep,
  totalSteps,
  browserState,
  logs,
  todoList,
  structuredData,
  onStop,
  isHeadless = false
}) => {
  const [activeTab, setActiveTab] = useState<'browser' | 'logs' | 'data' | 'todo'>('browser');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (activeTab === 'logs') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  if (!isOpen) return null;

  const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 w-full font-sans overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${workflowStatus === 'executing' ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">OK Karios</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${
                workflowStatus === 'executing' ? 'bg-green-500 animate-pulse' : 
                workflowStatus === 'complete' ? 'bg-blue-500' : 
                workflowStatus === 'error' ? 'bg-red-500' : 'bg-slate-500'
              }`} />
              <span className="text-slate-400 uppercase tracking-wider font-medium">
                {workflowStatus === 'executing' ? `Task Progress ${currentStep}/${totalSteps}` : workflowStatus}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {workflowStatus === 'executing' && (
            <button 
              onClick={onStop}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium border border-transparent hover:border-red-500/20"
            >
              <Square className="w-3 h-3 fill-current" />
              STOP
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-800 w-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Action Status Bar */}
      <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300 truncate max-w-[80%]">
          {browserState.isLoading && <Loader className="w-3 h-3 animate-spin text-blue-400" />}
          <span className="font-mono">{browserState.action || "Ready"}</span>
        </div>
        <div className="text-slate-500 font-mono">
           Session {Math.floor(Date.now() / 1000) % 1000}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 pt-2 border-b border-slate-700 bg-slate-900 overflow-x-auto scrollbar-hide">
        {[
          { id: 'browser', label: 'Browser', icon: Globe },
          { id: 'logs', label: 'Terminal', icon: Terminal },
          { id: 'data', label: 'Data Output', icon: Table },
          { id: 'todo', label: 'Task Plan', icon: List },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all border-t border-x ${
              activeTab === tab.id 
                ? 'bg-slate-800 border-slate-700 text-blue-400 border-b-slate-800 -mb-px z-10' 
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.id === 'data' && structuredData && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-slate-800 relative">
        <AnimatePresence mode="wait">
          
          {/* Browser Tab */}
          {activeTab === 'browser' && (
            <motion.div 
              key="browser"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              {/* Browser Address Bar */}
              <div className="bg-slate-900 p-2 flex items-center gap-2 border-b border-slate-700">
                <div className="flex-1 bg-slate-950 rounded border border-slate-700 flex items-center px-3 py-1.5 text-xs text-slate-400 font-mono truncate">
                  <Globe className="w-3 h-3 mr-2 text-slate-500" />
                  {browserState.url || "about:blank"}
                </div>
              </div>
              
              {/* Browser Viewport */}
              <div className="flex-1 relative bg-white flex items-center justify-center overflow-hidden">
                {browserState.screenshot ? (
                  <img 
                    src={`data:${browserState.screenshotMime || 'image/png'};base64,${browserState.screenshot}`} 
                    alt="Browser View" 
                    className="max-w-full max-h-full object-contain shadow-lg"
                  />
                ) : isHeadless ? (
                  <div className="flex flex-col items-center gap-3 text-slate-400 p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
                      <Terminal className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Running in Headless Mode</h3>
                      <p className="text-sm">Browser automation is executing in the background for performance.</p>
                      <p className="text-xs text-slate-500 mt-2">Check the Terminal tab for detailed logs.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <Globe className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">Waiting for browser stream...</p>
                  </div>
                )}
                
                {/* Overlay Status */}
                {browserState.action && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-4 py-2 rounded-full text-xs font-medium backdrop-blur-sm border border-slate-700/50 shadow-xl flex items-center gap-2">
                    {browserState.isLoading && <Loader className="w-3 h-3 animate-spin" />}
                    {browserState.action}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-4 font-mono text-xs bg-[#0c0c0c]"
            >
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 group">
                    <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={`break-words ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      log.type === 'task' ? 'text-purple-400 font-bold' :
                      'text-slate-300'
                    }`}>
                      {log.type === 'task' && <span className="mr-2">📋</span>}
                      {log.type === 'success' && <span className="mr-2">✓</span>}
                      {log.type === 'error' && <span className="mr-2">✗</span>}
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </motion.div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <motion.div 
              key="data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-4 bg-slate-900"
            >
              {structuredData ? (
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                     <h3 className="text-sm font-semibold text-white mb-2">Extraction Summary</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900 p-3 rounded border border-slate-700">
                          <div className="text-slate-400 text-xs">Items Found</div>
                          <div className="text-xl font-bold text-green-400">{structuredData.products?.length || 0}</div>
                        </div>
                        <div className="bg-slate-900 p-3 rounded border border-slate-700">
                          <div className="text-slate-400 text-xs">Success Rate</div>
                          <div className="text-xl font-bold text-blue-400">100%</div>
                        </div>
                     </div>
                  </div>
                  
                  {/* Raw Data Preview */}
                  <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="bg-slate-950 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-400">JSON Output</span>
                      <button className="text-xs text-blue-400 hover:text-blue-300">Copy</button>
                    </div>
                    <pre className="p-4 overflow-x-auto text-xs text-slate-300 font-mono">
                      {JSON.stringify(structuredData, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Table className="w-12 h-12 mb-3 opacity-20" />
                  <p>No structured data collected yet</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Todo Tab */}
          {activeTab === 'todo' && (
            <motion.div 
              key="todo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-4 bg-slate-900"
            >
              <div className="space-y-3">
                {todoList.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">
                    <p>Analyzing requirements...</p>
                  </div>
                ) : (
                  todoList.map((task, i) => (
                    <div 
                      key={task.id || i}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        task.status === 'in_progress' ? 'bg-blue-500/10 border-blue-500/30' :
                        task.status === 'complete' ? 'bg-green-500/5 border-green-500/20' :
                        'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <div className="mt-0.5">
                        {task.status === 'complete' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : task.status === 'in_progress' ? (
                          <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${
                          task.status === 'complete' ? 'text-slate-400 line-through' :
                          task.status === 'in_progress' ? 'text-blue-100 font-medium' :
                          'text-slate-300'
                        }`}>
                          {task.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
