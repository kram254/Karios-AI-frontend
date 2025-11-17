import React, { useState, useEffect } from 'react';
import { X, Play, Pause, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { WorkflowExecution, ExecutionLog } from '../../types/workflow';

interface ExecutionPanelProps {
  workflowId: string;
  nodes: any[];
  edges: any[];
  currentExecutionId?: string | null;
  onClose: () => void;
}

export function ExecutionPanel({ workflowId, nodes, edges, currentExecutionId, onClose }: ExecutionPanelProps) {
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<WorkflowExecution[]>([]);

  const buildLogsFromExecution = (exec: any): ExecutionLog[] => {
    const newLogs: ExecutionLog[] = [];
    if (exec && exec.nodeResults) {
      Object.entries(exec.nodeResults as Record<string, any>).forEach(([nodeId, result]: any) => {
        const status = result.status || 'completed';
        const level: ExecutionLog['level'] =
          status === 'failed' ? 'error' : status === 'completed' ? 'success' : 'info';
        newLogs.push({
          timestamp: (result.completedAt as string) || exec.completedAt || new Date().toISOString(),
          nodeId: nodeId as string,
          message: `Node ${nodeId} ${status}`,
          level,
          data: result
        });
      });
    }
    return newLogs;
  };

  const startExecution = async () => {
    setIsExecuting(true);
    setExecution(null);
    setLogs([]);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          nodes,
          edges,
          inputVariables: {}
        })
      });

      if (!response.ok) throw new Error('Failed to start execution');

      const raw = await response.json();
      const executionData = (raw as any).execution || raw;
      setExecution(executionData);

      const newLogs = buildLogsFromExecution(executionData);
      if (newLogs.length > 0) {
        setLogs(newLogs);
      }

      if (executionData && executionData.id) {
        pollExecution(executionData.id);
      } else {
        setIsExecuting(false);
      }
    } catch (error) {
      console.error('Failed to start execution:', error);
      setIsExecuting(false);
    }
  };

  const pollExecution = async (executionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/workflows/executions/${executionId}`);
        if (!response.ok) throw new Error('Failed to fetch execution');

        const data = await response.json();
        const exec = (data as any).execution || data;
        setExecution(exec);

        const newLogs = buildLogsFromExecution(exec);
        if (newLogs.length > 0) {
          setLogs(newLogs);
        }

        if (exec.status === 'completed' || exec.status === 'failed') {
          clearInterval(interval);
          setIsExecuting(false);
        }
      } catch (error) {
        console.error('Failed to poll execution:', error);
        clearInterval(interval);
        setIsExecuting(false);
      }
    }, 1000);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/workflows/${workflowId}/executions?limit=20`);
        if (!response.ok) return;

        const data = await response.json();
        const executions = (data as any).executions || data;
        if (Array.isArray(executions)) {
          setHistory(executions as WorkflowExecution[]);
        }
      } catch (error) {
        console.error('Failed to load execution history:', error);
      }
    };

    fetchHistory();
  }, [workflowId]);

  useEffect(() => {
    if (currentExecutionId) {
      setIsExecuting(true);
      setExecution(null);
      setLogs([]);
      pollExecution(currentExecutionId);
    }
  }, [currentExecutionId]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '300px',
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: 14, fontWeight: 600 }}>Execution</h3>
          {execution && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: 11,
                fontWeight: 500,
                backgroundColor: getStatusColor(execution.status),
              }}
            >
              {execution.status === 'running' && <Loader size={12} className="animate-spin" />}
              {execution.status === 'completed' && <CheckCircle size={12} />}
              {execution.status === 'failed' && <AlertCircle size={12} />}
              {execution.status}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isExecuting && (
            <button
              onClick={startExecution}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <Play size={14} />
              Start
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {history.length > 0 && (
          <div
            style={{
              marginBottom: 12,
              maxHeight: 120,
              overflowY: 'auto',
              borderBottom: '1px solid #333',
              paddingBottom: 8,
            }}
          >
            {history.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  borderRadius: 4,
                  backgroundColor:
                    execution && execution.id === item.id ? '#111827' : 'transparent',
                }}
                onClick={() => {
                  setExecution(item);
                  const historyLogs = buildLogsFromExecution(item);
                  setLogs(historyLogs);
                  if (item.status === 'running') {
                    setIsExecuting(true);
                    pollExecution(item.id);
                  } else {
                    setIsExecuting(false);
                  }
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'white', fontSize: 11 }}>Run {item.id}</span>
                  <span style={{ color: '#6b7280', fontSize: 10 }}>
                    {new Date(item.startedAt).toLocaleTimeString()} • {item.status}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: getStatusColor(item.status),
                  }}
                >
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        )}

        {logs.length === 0 && !isExecuting && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#666',
              fontSize: 13,
            }}
          >
            Click "Start" to begin execution
          </div>
        )}

        {logs.map((log, index) => (
          <div
            key={index}
            style={{
              padding: '8px',
              marginBottom: '4px',
              backgroundColor: '#0a0a0a',
              borderLeft: `3px solid ${getLogColor(log.level)}`,
              borderRadius: '4px',
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: getLogColor(log.level), fontWeight: 600 }}>
                [{log.level.toUpperCase()}]
              </span>
              <span style={{ color: '#666', fontSize: 11 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <div style={{ color: '#ccc' }}>{log.message}</div>
            {log.data && (
              <pre style={{ marginTop: 4, color: '#999', fontSize: 11, overflow: 'auto' }}>
                {JSON.stringify(log.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'running':
      return '#3b82f6';
    case 'completed':
      return '#10b981';
    case 'failed':
      return '#ef4444';
    case 'paused':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
}

function getLogColor(level: string): string {
  switch (level) {
    case 'error':
      return '#ef4444';
    case 'warning':
      return '#f59e0b';
    case 'success':
      return '#10b981';
    default:
      return '#3b82f6';
  }
}
