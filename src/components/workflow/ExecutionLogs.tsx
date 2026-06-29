import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

 const API_BASE_URL = String((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/$/, '');
 const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

interface ExecutionLog {
  id: number;
  executionId: string;
  nodeId: string;
  nodeType: string;
  status: string;
  inputData: any;
  outputData: any;
  errorMessage: string | null;
  durationMs: number | null;
  tokensUsed: number | null;
  createdAt: string;
}

interface ExecutionLogsProps {
  executionId: string;
  onClose: () => void;
}

export function ExecutionLogs({ executionId, onClose }: ExecutionLogsProps) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      const response = await fetch(apiUrl(`/api/workflows/executions/${executionId}/logs`), { headers });
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (executionId) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [executionId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} color="#10b981" />;
      case 'failed':
        return <XCircle size={14} color="#ef4444" />;
      case 'running':
        return <Clock size={14} color="#3b82f6" />;
      default:
        return <AlertCircle size={14} color="#f59e0b" />;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '450px',
      height: '100%',
      backgroundColor: '#1a1a1a',
      borderLeft: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #333',
      }}>
        <span style={{ color: 'white', fontWeight: 600 }}>Execution Logs</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={fetchLogs}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {isLoading && logs.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>
            No logs available yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  backgroundColor: '#252525',
                  borderRadius: 8,
                  border: '1px solid #333',
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {getStatusIcon(log.status)}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>
                      {log.nodeType}
                    </div>
                    <div style={{ color: '#666', fontSize: 11 }}>
                      {log.nodeId.substring(0, 20)}...
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {formatDuration(log.durationMs)}
                    </div>
                    {log.tokensUsed && (
                      <div style={{ color: '#666', fontSize: 10 }}>
                        {log.tokensUsed} tokens
                      </div>
                    )}
                  </div>
                </div>
                {expandedLog === log.id && (
                  <div style={{
                    borderTop: '1px solid #333',
                    padding: 12,
                    backgroundColor: '#1a1a1a',
                  }}>
                    {log.errorMessage && (
                      <div style={{
                        backgroundColor: '#3f1515',
                        border: '1px solid #ef4444',
                        borderRadius: 4,
                        padding: 8,
                        marginBottom: 8,
                        color: '#ef4444',
                        fontSize: 12,
                      }}>
                        {log.errorMessage}
                      </div>
                    )}
                    {log.outputData && (
                      <div>
                        <div style={{ color: '#999', fontSize: 11, marginBottom: 4 }}>Output:</div>
                        <pre style={{
                          backgroundColor: '#0a0a0a',
                          padding: 8,
                          borderRadius: 4,
                          color: '#d4d4d4',
                          fontSize: 11,
                          overflow: 'auto',
                          maxHeight: 200,
                          margin: 0,
                        }}>
                          {JSON.stringify(log.outputData, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div style={{ color: '#666', fontSize: 10, marginTop: 8 }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
