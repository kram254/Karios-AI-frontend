import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { WorkflowExecution, ExecutionLog } from '../../types/workflow';

 const API_BASE_URL = String((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/$/, '');
 const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

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
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pendingApproval = (execution as any)?.pendingApproval as { nodeId?: string; message?: string } | undefined;

  const mergeTimelineEntries = (prev: ExecutionLog[], nextItems: ExecutionLog[]) => {
    const existing = new Set<string>();
    (prev as any[]).forEach((p) => {
      const d = (p as any)?.data || {};
      const kind = typeof d?._kind === 'string' ? d._kind : 'log';
      const id = d?.id;
      if (id !== undefined && id !== null) {
        existing.add(`${kind}:${String(id)}`);
      }
    });

    const merged = [...prev];
    (nextItems || []).forEach((item) => {
      const d = (item as any)?.data || {};
      const kind = typeof d?._kind === 'string' ? d._kind : 'log';
      const id = d?.id;
      if (id !== undefined && id !== null) {
        const k = `${kind}:${String(id)}`;
        if (existing.has(k)) return;
        existing.add(k);
      }
      merged.push(item);
    });

    merged.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      if (!Number.isFinite(ta) || !Number.isFinite(tb)) return 0;
      return ta - tb;
    });

    return merged;
  };

  const mapDbLogToUiLog = (log: any): ExecutionLog | null => {
    if (!log || typeof log !== 'object') return null;
    const nodeId = typeof log.nodeId === 'string' ? log.nodeId : '';
    const status = typeof log.status === 'string' ? log.status : '';
    const createdAt = typeof log.createdAt === 'string' ? log.createdAt : new Date().toISOString();
    const isError = status === 'failed' || !!log.errorMessage;
    const isSuccess = status === 'completed';
    const level: ExecutionLog['level'] = isError ? 'error' : isSuccess ? 'success' : 'info';
    const message = nodeId ? `Node ${nodeId} ${status || 'updated'}` : `Node ${status || 'updated'}`;
    return {
      timestamp: createdAt,
      nodeId,
      message,
      level,
      data: {
        ...log,
        _kind: 'log',
        inputData: log.inputData,
        outputData: log.outputData,
        errorMessage: log.errorMessage
      }
    };
  };

  const mapArtifactToUiLog = (artifact: any): ExecutionLog | null => {
    if (!artifact || typeof artifact !== 'object') return null;
    const createdAt = typeof artifact.createdAt === 'string' ? artifact.createdAt : new Date().toISOString();
    const nodeId = typeof artifact.nodeId === 'string' ? artifact.nodeId : '';
    const type = typeof artifact.type === 'string' ? artifact.type : 'artifact';
    const name = typeof artifact.name === 'string' ? artifact.name : '';
    const message = name ? `${type}: ${name}` : type;
    return {
      timestamp: createdAt,
      nodeId,
      message,
      level: 'info',
      data: {
        ...artifact,
        _kind: 'artifact'
      }
    };
  };

  const mapApprovalToUiLog = (approval: any): ExecutionLog | null => {
    if (!approval || typeof approval !== 'object') return null;
    const createdAt = typeof approval.createdAt === 'string' ? approval.createdAt : new Date().toISOString();
    const resolvedAt = typeof approval.resolvedAt === 'string' ? approval.resolvedAt : '';
    const timestamp = resolvedAt || createdAt;
    const nodeId = typeof approval.nodeId === 'string' ? approval.nodeId : '';
    const status = typeof approval.status === 'string' ? approval.status : '';
    const approved = typeof approval.approved === 'boolean' ? approval.approved : null;

    const level: ExecutionLog['level'] =
      status === 'rejected' || approved === false ? 'error' : status === 'approved' || approved === true ? 'success' : 'warning';

    const message = nodeId ? `Approval ${nodeId} ${status || 'updated'}` : `Approval ${status || 'updated'}`;

    return {
      timestamp,
      nodeId,
      message,
      level,
      data: {
        ...approval,
        _kind: 'approval'
      }
    };
  };

  const fetchExecutionLogs = async (executionId: string) => {
    try {
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      const response = await fetch(apiUrl(`/api/workflows/executions/${executionId}/logs`), { headers });
      if (!response.ok) return;
      const data = await response.json();
      const rawLogs = (data as any).logs;
      if (!Array.isArray(rawLogs)) return;
      const mapped = rawLogs.map(mapDbLogToUiLog).filter(Boolean) as ExecutionLog[];
      setLogs(mapped);
    } catch (error) {
      console.error('Failed to fetch execution logs:', error);
    }
  };

  const fetchExecutionArtifacts = async (executionId: string) => {
    try {
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      const response = await fetch(apiUrl(`/api/workflows/executions/${executionId}/artifacts?limit=200`), { headers });
      if (!response.ok) return [];
      const data = await response.json();
      const raw = (data as any).artifacts;
      if (!Array.isArray(raw)) return [];
      return raw.map(mapArtifactToUiLog).filter(Boolean) as ExecutionLog[];
    } catch {
      return [];
    }
  };

  const fetchExecutionApprovals = async (executionId: string) => {
    try {
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      const response = await fetch(apiUrl(`/api/workflows/executions/${executionId}/approvals?limit=200`), { headers });
      if (!response.ok) return [];
      const data = await response.json();
      const raw = (data as any).approvals;
      if (!Array.isArray(raw)) return [];
      return raw.map(mapApprovalToUiLog).filter(Boolean) as ExecutionLog[];
    } catch {
      return [];
    }
  };

  const fetchExecutionTimeline = async (executionId: string) => {
    try {
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      const [logsRes, artifactsRes, approvalsRes] = await Promise.all([
        fetch(apiUrl(`/api/workflows/executions/${executionId}/logs`), { headers }),
        fetch(apiUrl(`/api/workflows/executions/${executionId}/artifacts?limit=200`), { headers }),
        fetch(apiUrl(`/api/workflows/executions/${executionId}/approvals?limit=200`), { headers })
      ]);

      const nextItems: ExecutionLog[] = [];

      try {
        if (logsRes.ok) {
          const data = await logsRes.json();
          const rawLogs = (data as any).logs;
          if (Array.isArray(rawLogs)) {
            nextItems.push(...((rawLogs.map(mapDbLogToUiLog).filter(Boolean) as ExecutionLog[]) || []));
          }
        }
      } catch {}

      try {
        if (artifactsRes.ok) {
          const data = await artifactsRes.json();
          const raw = (data as any).artifacts;
          if (Array.isArray(raw)) {
            nextItems.push(...((raw.map(mapArtifactToUiLog).filter(Boolean) as ExecutionLog[]) || []));
          }
        }
      } catch {}

      try {
        if (approvalsRes.ok) {
          const data = await approvalsRes.json();
          const raw = (data as any).approvals;
          if (Array.isArray(raw)) {
            nextItems.push(...((raw.map(mapApprovalToUiLog).filter(Boolean) as ExecutionLog[]) || []));
          }
        }
      } catch {}

      setLogs((prev) => mergeTimelineEntries([], nextItems));
    } catch (error) {
      console.error('Failed to fetch execution timeline:', error);
    }
  };

  const subscribeToExecutionWs = (executionId: string) => {
    try {
      const base = API_BASE_URL || '';
      const wsUrl = base
        ? base.replace(/^http/i, 'ws') + `/api/workflows/executions/${executionId}/ws`
        : `/api/workflows/executions/${executionId}/ws`;

      const ws = new WebSocket(wsUrl);

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const t = typeof msg?.type === 'string' ? msg.type : '';
          const d = (msg && typeof msg === 'object' ? (msg as any).data : null) || {};
          if (t === 'execution_log') {
            const mapped = mapDbLogToUiLog(d);
            if (mapped) {
              setLogs((prev) => {
                return mergeTimelineEntries(prev, [mapped]);
              });
            } else {
              fetchExecutionTimeline(executionId);
            }
          } else if (t === 'execution_artifact') {
            const mapped = mapArtifactToUiLog(d);
            if (mapped) {
              setLogs((prev) => mergeTimelineEntries(prev, [mapped]));
            } else {
              fetchExecutionTimeline(executionId);
            }
          } else if (t === 'execution_approval') {
            const mapped = mapApprovalToUiLog(d);
            if (mapped) {
              setLogs((prev) => mergeTimelineEntries(prev, [mapped]));
            } else {
              fetchExecutionTimeline(executionId);
            }
          } else if (t === 'node_started' || t === 'node_completed' || t === 'execution_paused' || t === 'execution_completed') {
            fetchExecutionTimeline(executionId);
          }
          if (t === 'execution_completed') {
            setIsExecuting(false);
          }
        } catch {}
      };

      ws.onerror = () => {};
      ws.onclose = () => {};

      return () => {
        try {
          ws.close();
        } catch {}
      };
    } catch {
      return () => {};
    }
  };

  const sendApproval = async (approved: boolean) => {
    if (!execution?.id) return;
    const nodeId = pendingApproval?.nodeId;
    if (!nodeId) return;
    try {
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      const response = await fetch(apiUrl(`/api/workflows/executions/${execution.id}/approve/${nodeId}?approved=${approved ? 'true' : 'false'}`), {
        method: 'POST',
        headers
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Approval failed');
      }
    } catch (error) {
      console.error('Approval error:', error);
    }
  };

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
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      const response = await fetch(apiUrl('/api/workflows/execute'), {
        method: 'POST',
        headers,
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

      if (executionData && executionData.id) {
        await fetchExecutionTimeline(executionData.id);
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

  const clearPollInterval = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const pollExecution = async (executionId: string) => {
    clearPollInterval();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const headers: Record<string, string> = {};
        try {
          const token = localStorage.getItem('token');
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
        const response = await fetch(apiUrl(`/api/workflows/executions/${executionId}`), { headers });
        if (!response.ok) throw new Error('Failed to fetch execution');

        const data = await response.json();
        const exec = (data as any).execution || data;
        setExecution(exec);

        fetchExecutionTimeline(executionId);

        if (exec.status === 'completed' || exec.status === 'failed') {
          clearPollInterval();
          setIsExecuting(false);
        }
      } catch (error) {
        console.error('Failed to poll execution:', error);
        clearPollInterval();
        setIsExecuting(false);
      }
    }, 1000);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const headers: Record<string, string> = {};
        try {
          const token = localStorage.getItem('token');
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
        const response = await fetch(apiUrl(`/api/workflows/${workflowId}/executions?limit=20`), { headers });
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
    return () => {
      clearPollInterval();
    };
  }, [currentExecutionId]);

  useEffect(() => {
    if (!execution?.id) return;
    fetchExecutionTimeline(execution.id);
    const unsubscribe = subscribeToExecutionWs(execution.id);
    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, [execution?.id]);

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
              {execution.status === 'paused' && <Pause size={12} />}
              {execution.status}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {execution?.status === 'paused' && pendingApproval?.nodeId && (
            <>
              <button
                onClick={() => sendApproval(true)}
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
                Approve
              </button>
              <button
                onClick={() => sendApproval(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Reject
              </button>
            </>
          )}
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
        {execution?.status === 'paused' && pendingApproval?.nodeId && (
          <div
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 6,
              border: '1px solid #f59e0b',
              backgroundColor: '#f59e0b20',
              color: 'white',
              fontSize: 12,
            }}
          >
            {pendingApproval?.message || 'Approval required'}
          </div>
        )}
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
                  fetchExecutionTimeline(item.id);
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
