import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Square, Activity, Zap, CheckCircle, 
  XCircle, Clock, Terminal, ChevronRight, MoreHorizontal 
} from 'lucide-react';
import { 
  flowEngineService, 
  FlowExecutionStatus, 
  FlowEvent,
  FlowNode,
  FlowEdge
} from '../../services/sumi';
import { HITLApprovalGate } from './HITLApprovalGate';

interface SumiFlowExecutionProps {
  workflowId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  inputData?: Record<string, any>;
  onComplete?: (status: FlowExecutionStatus) => void;
  onError?: (error: Error) => void;
}

type ExecutionPhase = 'idle' | 'starting' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

interface ExecutionState {
  phase: ExecutionPhase;
  executionId: string | null;
  events: FlowEvent[];
  nodeResults: Map<string, { status: string; output?: any; error?: string }>;
  currentNodeId: string | null;
  progress: number;
  startTime: number | null;
  elapsedTime: number;
}

export const SumiFlowExecution: React.FC<SumiFlowExecutionProps> = ({
  workflowId,
  nodes,
  edges,
  inputData = {},
  onComplete,
  onError
}) => {
  const [state, setState] = useState<ExecutionState>({
    phase: 'idle',
    executionId: null,
    events: [],
    nodeResults: new Map(),
    currentNodeId: null,
    progress: 0,
    startTime: null,
    elapsedTime: 0
  });

  const [showLogs, setShowLogs] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<FlowEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const updateElapsedTime = useCallback(() => {
    if (state.startTime && (state.phase === 'running' || state.phase === 'paused')) {
      setState(prev => ({
        ...prev,
        elapsedTime: Date.now() - prev.startTime!
      }));
    }
  }, [state.startTime, state.phase]);

  useEffect(() => {
    if (state.phase === 'running' || state.phase === 'paused') {
      timerRef.current = setInterval(updateElapsedTime, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.phase, updateElapsedTime]);

  const connectWebSocket = useCallback((executionId: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = flowEngineService.connectWebSocket(executionId);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data: FlowEvent = JSON.parse(event.data);
      
      if (data.type === 'ping') return;

      setState(prev => {
        const newEvents = [...prev.events, data];
        const newResults = new Map(prev.nodeResults);
        
        if (data.type === 'node_completed' && data.node_id) {
          newResults.set(data.node_id, { status: 'completed', output: data.data });
        } else if (data.type === 'node_failed' && data.node_id) {
          newResults.set(data.node_id, { status: 'failed', error: data.data?.error });
        }

        const progress = nodes.length > 0 
          ? (newResults.size / nodes.length) * 100 
          : 0;

        return {
          ...prev,
          events: newEvents,
          nodeResults: newResults,
          currentNodeId: data.node_id || prev.currentNodeId,
          progress
        };
      });
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      wsRef.current = null;
    };
  }, [nodes.length]);

  const startExecution = async () => {
    try {
      setState(prev => ({
        ...prev,
        phase: 'starting',
        events: [],
        nodeResults: new Map(),
        progress: 0,
        startTime: Date.now(),
        elapsedTime: 0
      }));

      const response = await flowEngineService.executeFlow({
        workflow_id: workflowId,
        nodes,
        edges,
        input_data: inputData,
        metadata: { timeout_seconds: 300 }
      });

      setState(prev => ({
        ...prev,
        phase: 'running',
        executionId: response.execution_id
      }));

      connectWebSocket(response.execution_id);

      flowEngineService.pollExecution(
        response.execution_id,
        (status) => {
          if (['completed', 'failed', 'cancelled'].includes(status.status)) {
            setState(prev => ({
              ...prev,
              phase: status.status as ExecutionPhase,
              currentNodeId: status.current_node_id
            }));
            
            if (wsRef.current) {
              wsRef.current.close();
            }

            if (status.status === 'completed') {
              onComplete?.(status);
            } else if (status.status === 'failed') {
              onError?.(new Error(status.error_message || 'Execution failed'));
            }
          }
        }
      );
    } catch (error) {
      setState(prev => ({ ...prev, phase: 'failed' }));
      onError?.(error as Error);
    }
  };

  const pauseExecution = async () => {
    if (!state.executionId) return;
    
    try {
      await flowEngineService.pauseExecution(state.executionId);
      setState(prev => ({ ...prev, phase: 'paused' }));
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  };

  const resumeExecution = async () => {
    if (!state.executionId) return;
    
    try {
      await flowEngineService.resumeExecution(state.executionId);
      setState(prev => ({ ...prev, phase: 'running' }));
    } catch (error) {
      console.error('Failed to resume:', error);
    }
  };

  const cancelExecution = async () => {
    if (!state.executionId) return;
    
    try {
      await flowEngineService.cancelExecution(state.executionId);
      if (wsRef.current) {
        wsRef.current.close();
      }
      setState(prev => ({ ...prev, phase: 'cancelled' }));
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatElapsedTime = (ms: number) => {
    if (ms < 1000) return `${Math.floor(ms / 10) / 100}s`;
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const getPhaseIcon = () => {
    switch (state.phase) {
      case 'running': return <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />;
      case 'paused': return <Pause className="w-5 h-5 text-amber-400" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'cancelled': return <Square className="w-5 h-5 text-gray-400" />;
      default: return <Zap className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getPhaseColor = () => {
    switch (state.phase) {
      case 'running': return 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10';
      case 'paused': return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
      case 'completed': return 'text-green-400 border-green-500/50 bg-green-500/10';
      case 'failed': return 'text-red-400 border-red-500/50 bg-red-500/10';
      case 'cancelled': return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
      default: return 'text-gray-400 border-gray-700 bg-gray-800';
    }
  };

  return (
    <div className="w-full bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
      <div className={`p-4 border-b border-gray-800 flex items-center justify-between ${getPhaseColor()}`}>
        <div className="flex items-center gap-3">
          {getPhaseIcon()}
          <div>
            <h3 className="text-sm font-semibold capitalize">{state.phase}</h3>
            {state.executionId && (
              <p className="text-xs text-gray-500 font-mono">{state.executionId.slice(0, 8)}...</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {state.startTime && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{formatElapsedTime(state.elapsedTime)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {state.phase === 'idle' && (
              <button
                onClick={startExecution}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span className="text-sm font-medium">Start</span>
              </button>
            )}
            
            {state.phase === 'running' && (
              <button
                onClick={pauseExecution}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span className="text-sm font-medium">Pause</span>
              </button>
            )}
            
            {state.phase === 'paused' && (
              <button
                onClick={resumeExecution}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span className="text-sm font-medium">Resume</span>
              </button>
            )}
            
            {(state.phase === 'running' || state.phase === 'paused') && (
              <button
                onClick={cancelExecution}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                <Square className="w-4 h-4" />
                <span className="text-sm font-medium">Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="h-1 bg-gray-800">
        <motion.div
          className="h-full bg-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${state.progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Terminal className="w-4 h-4" />
            <span>Event Stream</span>
            <span className="text-xs text-gray-600">({state.events.length} events)</span>
          </div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            {showLogs ? 'Hide' : 'Show'}
          </button>
        </div>

        <AnimatePresence>
          {showLogs && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 240, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="h-60 bg-gray-950 rounded-lg border border-gray-800 overflow-y-auto font-mono text-sm">
                {state.events.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-600">
                    No events yet...
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {state.events.slice(-50).map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                          selectedEvent?.id === event.id 
                            ? 'bg-cyan-500/10 border border-cyan-500/30' 
                            : 'hover:bg-gray-900'
                        }`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <span className="text-xs text-gray-600">{index + 1}</span>
                        <span className="text-xs text-cyan-500">{event.type}</span>
                        {event.node_id && (
                          <span className="text-xs text-purple-400">node:{event.node_id.slice(0, 6)}</span>
                        )}
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-cyan-400">Event Details</span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-xs text-gray-500 hover:text-gray-400"
              >
                Close
              </button>
            </div>
            <pre className="text-xs text-gray-400 overflow-x-auto">
              {JSON.stringify(selectedEvent.data, null, 2)}
            </pre>
          </motion.div>
        )}
      </div>

      {state.executionId && (
        <HITLApprovalGate
          executionId={state.executionId}
          onApprove={(lockId) => {
            console.log('Approved:', lockId);
          }}
          onReject={(lockId, reason) => {
            console.log('Rejected:', lockId, reason);
          }}
        />
      )}
    </div>
  );
};

export default SumiFlowExecution;
