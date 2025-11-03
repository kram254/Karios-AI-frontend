import React, { useState, useEffect } from 'react';
import { X, Play, Pause, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { WorkflowExecution, ExecutionLog } from '../../types/workflow';

interface ExecutionPanelProps {
  workflowId: string;
  onClose: () => void;
}

export function ExecutionPanel({ workflowId, onClose }: ExecutionPanelProps) {
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const startExecution = async () => {
    setIsExecuting(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to start execution');

      const executionData = await response.json();
      setExecution(executionData);

      pollExecution(executionData.id);
    } catch (error) {
      console.error('Failed to start execution:', error);
      setIsExecuting(false);
    }
  };

  const pollExecution = async (executionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/executions/${executionId}`);
        if (!response.ok) throw new Error('Failed to fetch execution');

        const data = await response.json();
        setExecution(data);

        if (data.logs) {
          setLogs(data.logs);
        }

        if (data.status === 'completed' || data.status === 'failed') {
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
