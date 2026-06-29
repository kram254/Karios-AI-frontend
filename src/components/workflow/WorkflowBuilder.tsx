import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  BackgroundVariant,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Play, Settings, Plus, Download, Upload, Sparkles, AlertCircle, CheckCircle, Clock, Code, Snowflake, BarChart3, FileText, List, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize2 as Fit, History, X, LayoutGrid } from 'lucide-react';
import { useWorkflow } from '../../hooks/useWorkflow';
import { nodeTypes } from './CustomNodes';
import { NodePanel } from './NodePanel';
import { NodesLibrary } from './NodesLibrary';
import { ExecutionPanel } from './ExecutionPanel';
import { WorkflowSettings } from './WorkflowSettings';
import { AIWorkflowChat } from './AIWorkflowChat';
import { AICopilot } from './AICopilot';
import { PerformanceAnalytics } from './PerformanceAnalytics';
import { BreakpointDebugger } from './BreakpointDebugger';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { StreamingOutputDisplay } from './StreamingOutputDisplay';
import { ErrorRecoveryPanel } from './ErrorRecoveryPanel';
import { EnhancedAgentChatInterface } from './EnhancedAgentChatInterface';
import { CodePreview } from './CodePreview';
import { ExecutionLogs } from './ExecutionLogs';
import { ExecutionTimeline } from './ExecutionTimeline';
import { validateWorkflow, type ValidationError } from '../../utils/workflowValidator';
import { validateConnection as validateNodeConnection } from '../../utils/nodeTypeSystem';
import type { NodeType, Workflow as BuilderWorkflow } from '../../types/workflow';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ApprovalGate } from '../ApprovalGate';
import { WorkflowEmptyCanvas } from './WorkflowEmptyCanvas';

 const API_BASE_URL = String((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/$/, '');
 const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

interface WorkflowBuilderProps {
  workflowId?: string;
  onSave?: (workflowId: string) => void;
  onExecute?: (workflowId: string) => void;
  initialWorkflow?: BuilderWorkflow;
}

type StartInputField = {
  name: string;
  type: string;
  required: boolean;
  defaultValue: any;
  description: string;
};

type PreflightSummary = {
  agentNodeCount: number;
  externalActionCount: number;
  externalActionsWithApproval: number;
  estimatedTokenBudget: number;
  estimatedCostUsd: number;
  riskLevel: 'low' | 'medium' | 'high';
  dataBoundaries: string[];
};

export function WorkflowBuilder({ workflowId, onSave, onExecute, initialWorkflow }: WorkflowBuilderProps) {
  const { user } = useAuth();
  const {
    workflow,
    nodes,
    edges,
    selectedNode,
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNode,
    deleteNode,
    deleteEdge,
    saveWorkflow,
  } = useWorkflow(initialWorkflow);

  const [showNodePanel, setShowNodePanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'Untitled Workflow');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [frozenNodes, setFrozenNodes] = useState<Set<string>>(new Set());
  const [breakpoints, setBreakpoints] = useState<Set<string>>(new Set());
  const [executionState, setExecutionState] = useState({
    isPaused: false,
    currentNodeId: null as string | null,
    variables: {} as Record<string, any>
  });
  const [nodeExecutionStatus, setNodeExecutionStatus] = useState<Record<string, { status: string; result?: any }>>({});
  const [streamingOutput, setStreamingOutput] = useState<Record<string, string>>({});
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [errorFixes, setErrorFixes] = useState<Record<string, any>>({});
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [showExecutionLogs, setShowExecutionLogs] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [workflowVersions, setWorkflowVersions] = useState<any[]>([]);
  const [isVersionsLoading, setIsVersionsLoading] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState<'grid' | 'dots' | 'plain'>('dots');
  const [showRunConfigModal, setShowRunConfigModal] = useState(false);
  const [runInputValues, setRunInputValues] = useState<Record<string, any>>({});
  const [runInputErrors, setRunInputErrors] = useState<Record<string, string>>({});
  const initialZoomAppliedRef = React.useRef(false);
  const initialChatOpenedRef = React.useRef(false);
  const lastWorkflowIdRef = React.useRef<string | null>(null);
  const reactFlowInstanceRef = React.useRef<any>(null);
  const [undoStack, setUndoStack] = useState<{ nodes: typeof nodes; edges: typeof edges }[]>([]);
  const [redoStack, setRedoStack] = useState<{ nodes: typeof nodes; edges: typeof edges }[]>([]);
  const workflowDraftTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const webSocketRef = React.useRef<WebSocket | null>(null);

  const [pendingApproval, setPendingApproval] = useState<{
    action: string;
    tool: string;
    parameters: any;
    riskLevel: 'low' | 'medium' | 'high';
  } | null>(null);

  const workflowDraftKey = useMemo(() => {
    const uid = (user as any)?.id;
    const userPart = uid === undefined || uid === null ? 'anon' : String(uid);
    return `workflow_builder_draft_v1_${userPart}_current`;
  }, [user]);

  const persistWorkflowDraft = useCallback(() => {
    try {
      const now = new Date().toISOString();
      const existingCreatedAt = (workflow as any)?.createdAt;
      const createdAt = typeof existingCreatedAt === 'string' && existingCreatedAt ? existingCreatedAt : now;
      const wf: BuilderWorkflow = {
        ...(workflow as any),
        id: (workflow as any)?.id,
        name: workflowName || (workflow as any)?.name || 'Untitled Workflow',
        nodes,
        edges,
        createdAt,
        updatedAt: now,
        userId: (user as any)?.id ?? (workflow as any)?.userId,
      };
      const payload = {
        v: 1,
        savedAt: Date.now(),
        title: wf.name || 'Untitled Workflow',
        workflow: wf,
      };
      localStorage.setItem('workflow_builder_draft_v1', JSON.stringify(payload));
      localStorage.setItem(workflowDraftKey, JSON.stringify(payload));
    } catch {}
  }, [edges, nodes, user, workflow, workflowDraftKey, workflowName]);

  const clearWorkflowDraft = useCallback(() => {
    try {
      if (workflowDraftTimerRef.current) {
        clearTimeout(workflowDraftTimerRef.current);
        workflowDraftTimerRef.current = null;
      }
    } catch {}
    try { localStorage.removeItem('workflow_builder_draft_v1'); } catch {}
    try { localStorage.removeItem(workflowDraftKey); } catch {}
  }, [workflowDraftKey]);

  useEffect(() => {
    try {
      if (workflowDraftTimerRef.current) {
        clearTimeout(workflowDraftTimerRef.current);
      }
    } catch {}
    workflowDraftTimerRef.current = setTimeout(() => {
      persistWorkflowDraft();
    }, 350);
    return () => {
      try {
        if (workflowDraftTimerRef.current) {
          clearTimeout(workflowDraftTimerRef.current);
          workflowDraftTimerRef.current = null;
        }
      } catch {}
    };
  }, [persistWorkflowDraft]);

  const resumeExecution = useCallback(
    async (mode: 'continue' | 'step') => {
      if (!currentExecutionId) {
        setExecutionState({ isPaused: false, currentNodeId: null, variables: {} });
        return;
      }

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        try {
          const token = localStorage.getItem('token');
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
        const response = await fetch(
          apiUrl(`/api/workflows/executions/${currentExecutionId}/resume?mode=${encodeURIComponent(mode)}`),
          {
            method: 'POST',
            headers,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Resume failed with status ${response.status}`);
        }

        setExecutionState((prev) => ({ ...prev, isPaused: false, currentNodeId: null }));
      } catch (error: any) {
        console.error('[WORKFLOW EXECUTION] Resume error:', error);
        toast.error(`Failed to resume execution: ${error.message}`);
      }
    },
    [currentExecutionId]
  );

  const executeRef = React.useRef<(() => Promise<void>) | null>(null);
  const nextRunFromNodeIdRef = React.useRef<string | null>(null);
  const nextRunToNodeIdRef = React.useRef<string | null>(null);
  const frozenNodesRef = React.useRef<Set<string>>(frozenNodes);
  const updateNodeRef = React.useRef(updateNode);

  useEffect(() => {
    frozenNodesRef.current = frozenNodes;
  }, [frozenNodes]);

  useEffect(() => {
    updateNodeRef.current = updateNode;
  }, [updateNode]);

  const startInputFields = useMemo<StartInputField[]>(() => {
    const startNode = nodes.find((node: any) => {
      const t = (node?.data?.nodeType || node?.type || '').toString();
      return t === 'start';
    });

    const cfg = (startNode?.data as any)?.config || {};
    const schema = cfg?.inputSchema;
    let rawFields: any[] = [];

    if (Array.isArray(schema?.fields)) {
      rawFields = schema.fields;
    } else if (Array.isArray(schema)) {
      rawFields = schema;
    }

    if (rawFields.length === 0 && Array.isArray(cfg?.inputVariables)) {
      rawFields = cfg.inputVariables.map((name: string) => ({
        name,
        type: 'string',
        required: false,
        defaultValue: '',
        description: '',
      }));
    }

    return rawFields
      .map((field: any) => {
        if (typeof field === 'string') {
          const name = String(field || '').trim();
          if (!name) return null;
          return {
            name,
            type: 'string',
            required: false,
            defaultValue: '',
            description: '',
          } as StartInputField;
        }
        if (!field || typeof field !== 'object') return null;
        const name = String(field.name || '').trim();
        if (!name) return null;
        return {
          name,
          type: String(field.type || 'string').toLowerCase(),
          required: Boolean(field.required),
          defaultValue: field.defaultValue ?? '',
          description: String(field.description || ''),
        } as StartInputField;
      })
      .filter(Boolean) as StartInputField[];
  }, [nodes]);

  useEffect(() => {
    setRunInputValues((prev) => {
      const next: Record<string, any> = { ...prev };
      const names = new Set(startInputFields.map((field) => field.name));
      let changed = false;

      for (const field of startInputFields) {
        const existing = next[field.name];
        const hasExisting = !(existing === undefined || existing === null || existing === '');
        const hasDefault = !(field.defaultValue === undefined || field.defaultValue === null || field.defaultValue === '');
        if (!hasExisting && hasDefault) {
          next[field.name] = field.defaultValue;
          changed = true;
        }
      }

      Object.keys(next).forEach((key) => {
        if (!names.has(key)) {
          delete next[key];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [startInputFields]);

  const preflightSummary = useMemo<PreflightSummary>(() => {
    const agentNodes = nodes.filter((node: any) => String(node?.data?.nodeType || node?.type || '') === 'agent');
    const externalNodes = nodes.filter((node: any) => {
      const t = String(node?.data?.nodeType || node?.type || '');
      return t === 'integration' || t === 'mcp-tool' || t === 'mcp' || t === 'file-search';
    });

    const externalWithApproval = externalNodes.filter((node: any) => {
      const cfg = (node?.data?.config || {}) as any;
      const v = cfg.approvalRequired ?? cfg.approval_required ?? cfg.requireApproval;
      return v !== false;
    });

    const estimatedTokenBudget = agentNodes.reduce((sum: number, node: any) => {
      const cfg = (node?.data?.config || {}) as any;
      const raw = Number(cfg.maxTokens ?? cfg.max_tokens ?? 1200);
      const amount = Number.isFinite(raw) ? Math.max(0, raw) : 1200;
      return sum + amount;
    }, 0);

    const estimatedCostUsd = Number(((estimatedTokenBudget / 1000) * 0.002 + externalNodes.length * 0.0015).toFixed(4));

    const dataBoundariesSet = new Set<string>();
    externalNodes.forEach((node: any) => {
      const t = String(node?.data?.nodeType || node?.type || '');
      const cfg = (node?.data?.config || {}) as any;
      if (t === 'integration' && cfg.integration) {
        dataBoundariesSet.add(`integration:${String(cfg.integration)}`);
      } else if ((t === 'mcp-tool' || t === 'mcp') && cfg.tool) {
        dataBoundariesSet.add(`mcp:${String(cfg.tool)}`);
      } else if (t === 'file-search') {
        dataBoundariesSet.add('knowledge_base');
      }
    });

    let riskLevel: PreflightSummary['riskLevel'] = 'low';
    if (externalNodes.length > 0) {
      riskLevel = externalWithApproval.length === externalNodes.length ? 'medium' : 'high';
    }

    return {
      agentNodeCount: agentNodes.length,
      externalActionCount: externalNodes.length,
      externalActionsWithApproval: externalWithApproval.length,
      estimatedTokenBudget,
      estimatedCostUsd,
      riskLevel,
      dataBoundaries: Array.from(dataBoundariesSet),
    };
  }, [nodes]);

  const startInputSchemaPayload = useMemo(() => {
    return {
      fields: startInputFields.map((field) => ({
        name: String(field.name || ''),
        type: String(field.type || 'string').toLowerCase(),
        required: Boolean(field.required),
        defaultValue: field.defaultValue,
        description: String(field.description || ''),
      })),
    };
  }, [startInputFields]);

  const setRunInputFieldValue = useCallback((fieldName: string, value: any) => {
    setRunInputValues((prev) => ({ ...prev, [fieldName]: value }));
    setRunInputErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const coerceRunInputValue = useCallback((value: any, valueType: string) => {
    const type = String(valueType || 'string').toLowerCase();
    if (value === undefined || value === null) return value;
    if (type === 'string') return String(value);
    if (type === 'number') {
      if (value === '') return '';
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) throw new Error('must be a number');
      return numeric;
    }
    if (type === 'integer') {
      if (value === '') return '';
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) throw new Error('must be an integer');
      return Math.trunc(numeric);
    }
    if (type === 'boolean') {
      if (typeof value === 'boolean') return value;
      const lower = String(value).toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
      throw new Error('must be a boolean');
    }
    if (type === 'array') {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        const text = value.trim();
        if (!text) return [];
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
      }
      throw new Error('must be a JSON array');
    }
    if (type === 'object' || type === 'json') {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) return value;
      if (typeof value === 'string') {
        const text = value.trim();
        if (!text) return {};
        const parsed = JSON.parse(text);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed;
      }
      throw new Error('must be a JSON object');
    }
    return value;
  }, []);

  const validateRunInputs = useCallback(() => {
    const errors: Record<string, string> = {};
    const payload: Record<string, any> = {};

    startInputFields.forEach((field) => {
      let rawValue = runInputValues[field.name];
      const hasValue = !(rawValue === undefined || rawValue === null || rawValue === '');
      const hasDefault = !(field.defaultValue === undefined || field.defaultValue === null || field.defaultValue === '');

      if (!hasValue && hasDefault) {
        rawValue = field.defaultValue;
      }

      const nowHasValue = !(rawValue === undefined || rawValue === null || rawValue === '');
      if (!nowHasValue) {
        if (field.required) {
          errors[field.name] = 'Required';
        }
        return;
      }

      try {
        payload[field.name] = coerceRunInputValue(rawValue, field.type);
      } catch (error: any) {
        errors[field.name] = String(error?.message || 'Invalid value');
      }
    });

    setRunInputErrors(errors);
    return {
      valid: Object.keys(errors).length === 0,
      payload,
    };
  }, [coerceRunInputValue, runInputValues, startInputFields]);

  const runInputDisplayValue = useCallback((value: any, fieldType: string) => {
    const type = String(fieldType || 'string').toLowerCase();
    if (value === undefined || value === null) return '';
    if (type === 'array' || type === 'object' || type === 'json') {
      if (typeof value === 'string') return value;
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '';
      }
    }
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  }, []);

  const preflightRiskColor = useMemo(() => {
    if (preflightSummary.riskLevel === 'high') return '#ef4444';
    if (preflightSummary.riskLevel === 'medium') return '#f59e0b';
    return '#10b981';
  }, [preflightSummary.riskLevel]);

  const toggleBreakpointById = useCallback((nodeId: string) => {
    setBreakpoints(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const toggleNodeFreezeByIdSafe = useCallback(
    (nodeId: string) => {
      const wasFrozen = frozenNodesRef.current.has(nodeId);
      setFrozenNodes(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });

      const result = nodeExecutionStatus[nodeId]?.result;
      if (!wasFrozen) {
        updateNode(nodeId, {
          config: {
            pinnedEnabled: true,
            pinnedOutput: (result && typeof result === 'object' && 'output' in result) ? (result as any).output : result,
          },
        });
      } else {
        updateNode(nodeId, {
          config: {
            pinnedEnabled: false,
          },
        });
      }
    },
    [nodeExecutionStatus, updateNode]
  );

  const enhancedNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isRunning: executionState.currentNodeId === n.id && nodeExecutionStatus[n.id]?.status === 'running',
          executionStatus: nodeExecutionStatus[n.id]?.status,
          executionResult: nodeExecutionStatus[n.id]?.result,
          hasBreakpoint: breakpoints.has(n.id),
          isFrozen: frozenNodes.has(n.id),
          onToggleBreakpoint: () => toggleBreakpointById(n.id),
          onToggleFreeze: () => toggleNodeFreezeByIdSafe(n.id),
          onRunFromHere: () => {
            nextRunFromNodeIdRef.current = n.id;
            executeRef.current?.();
          },
        },
      })),
    [nodes, nodeExecutionStatus, breakpoints, frozenNodes, toggleBreakpointById, toggleNodeFreezeByIdSafe, executionState.currentNodeId]
  );

  const deriveWorkflowName = useCallback((prompt: string) => {
    const cleaned = String(prompt || '')
      .replace(/^[\s\n\r]+|[\s\n\r]+$/g, '')
      .replace(/[\u201C\u201D]/g, '"');
    if (!cleaned) return '';

    let s = cleaned
      .replace(/[\t\n\r]+/g, ' ')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    s = s
      .replace(/^\s*(hi|hello|hey)\b[\s,!:.-]*/i, '')
      .replace(/^\s*please\b\s*/i, '')
      .replace(/^\s*(i\s+(need|want|would\s+like|would\s+love)\s+(you\s+)?to\s+)/i, '')
      .replace(/^\s*(can|could|would|will)\s+you\s+/i, '')
      .replace(/^\s*help\s+me\s+(to\s+)?/i, '')
      .replace(/^\s*(create|build|generate|make|design|draft|write|develop|configure|setup|set\s+up)\s+(me\s+)?(a|an|the)?\s*/i, '')
      .replace(/^\s*(a|an|the)\s+/i, '')
      .trim();

    s = s.split(/[.!?]/)[0] || s;

    const cut = s.match(/^(.+?)(\s+(with|using|including|that|which|where|who|to|for|by|via)\b.+)?$/i);
    if (cut && cut[1]) s = cut[1];

    s = s
      .replace(/\bwebscraping\b/ig, 'web scraping')
      .replace(/\bwebscraper\b/ig, 'web scraper')
      .replace(/\s+/g, ' ')
      .trim();

    if (!s) return '';

    let words = s.split(' ').filter(Boolean);
    if (words.length > 6) words = words.slice(0, 6);
    let base = words.join(' ').trim();

    const needsAgentSuffix = !/\b(agent|assistant|bot|workflow)\b/i.test(base);
    if (needsAgentSuffix) base = `${base} Agent`;

    const titled = base
      .split(' ')
      .filter(Boolean)
      .map((w) => {
        const upper = w.toUpperCase();
        if (upper === 'AI' || upper === 'API' || upper === 'UI' || upper === 'UX' || upper === 'CRM' || upper === 'SQL') return upper;
        if (/^\d+$/.test(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(' ');

    return titled.length > 60 ? `${titled.slice(0, 57)}...` : titled;
  }, []);

  useEffect(() => {
    const validation = validateWorkflow(nodes as any, edges as any);
    setValidationErrors([...validation.errors, ...validation.warnings]);
  }, [nodes, edges]);

  useEffect(() => {
    const wid = (workflow as any)?.id ? String((workflow as any).id) : null;
    if (!wid) return;
    setActiveWorkflowId(wid);
    if (lastWorkflowIdRef.current !== wid) {
      lastWorkflowIdRef.current = wid;
      const nextName = (workflow as any)?.name;
      if (nextName) setWorkflowName(String(nextName));
    }
  }, [workflow]);

  useEffect(() => {
    if (initialChatOpenedRef.current) return;
    if (!workflow?.id) return;
    let openChat = false;
    try {
      openChat = sessionStorage.getItem('builder_open_workflow_chat') === '1';
      if (reactFlowInstanceRef.current) {
        reactFlowInstanceRef.current.fitView({ padding: 0.2, maxZoom: 1.2 });
        initialZoomAppliedRef.current = true;
      }
    } catch {}
    try { sessionStorage.removeItem('builder_open_workflow_chat'); } catch {}
    setCurrentExecutionId(`chat-${Date.now()}`);
    setExecutionSuccess(true);
    setShowAgentChat(true);
  }, [workflow?.id]);

  useEffect(() => {
    const loadVersions = async () => {
      if (!showVersions) return;
      if (!workflow?.id) return;
      setIsVersionsLoading(true);
      try {
        const headers: Record<string, string> = {};
        try {
          const token = localStorage.getItem('token');
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
        const res = await fetch(apiUrl(`/api/workflows/${workflow.id}/versions?limit=50`), { headers });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Failed to load versions');
        }
        const data = await res.json();
        const versions = Array.isArray((data as any)?.versions) ? (data as any).versions : [];
        setWorkflowVersions(versions);
      } catch {
        setWorkflowVersions([]);
      } finally {
        setIsVersionsLoading(false);
      }
    };
    loadVersions();
  }, [showVersions, workflow?.id]);

  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  const pushHistory = useCallback(() => {
    setUndoStack((stack) => [...stack.slice(-19), { nodes: nodes.map((n) => ({ ...n })), edges: edges.map((e) => ({ ...e })) }]);
    setRedoStack([]);
  }, [nodes, edges]);

  const applyNodesChange = useCallback(
    (changes: any[]) => {
      pushHistory();
      onNodesChange(changes);
    },
    [onNodesChange, pushHistory]
  );

  const applyEdgesChange = useCallback(
    (changes: any[]) => {
      pushHistory();
      handleEdgesChange(changes);
    },
    [handleEdgesChange, pushHistory]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (sourceNode && targetNode) {
        const validation = validateNodeConnection(
          sourceNode.data.nodeType,
          targetNode.data.nodeType,
          connection.sourceHandle || undefined,
          connection.targetHandle || undefined
        );
        
        if (!validation.valid) {
          toast.error(validation.message || 'Invalid connection');
          return;
        }
      }
      
      pushHistory();
      onConnect(connection);
    },
    [nodes, onConnect, pushHistory]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      setSelectedNode(node.id);
      setShowNodePanel(true);
    },
    [setSelectedNode]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowNodePanel(false);
    setSelectedEdge(null);
  }, [setSelectedNode]);

  const handleEdgeClick = useCallback((_event: React.MouseEvent, edge: any) => {
    setSelectedEdge(edge.id);
  }, []);

  const handleUndoRef = React.useRef<() => void>(() => {});
  const handleRedoRef = React.useRef<() => void>(() => {});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdge) {
        deleteEdge(selectedEdge);
        setSelectedEdge(null);
        e.preventDefault();
        return;
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedoRef.current();
        } else {
          handleUndoRef.current();
        }
        return;
      }
      if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedoRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdge, deleteEdge]);

  useEffect(() => {
    return () => {
      if (webSocketRef.current) {
        try {
          webSocketRef.current.close();
        } catch {}
        webSocketRef.current = null;
      }
    };
  }, []);

  const handleAutoLayout = useCallback(() => {
    const currentNodes = nodes;
    const currentEdges = edges;
    if (!currentNodes || currentNodes.length < 2) return;
    const nodeMap = new Map<string, { x: number; y: number }>();
    const adj = new Map<string, string[]>();
    const inDeg = new Map<string, number>();
    currentNodes.forEach((n: any) => {
      adj.set(n.id, []);
      inDeg.set(n.id, 0);
    });
    currentEdges.forEach((e: any) => {
      const src = adj.get(e.source);
      if (src) src.push(e.target);
      inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1);
    });
    const queue: string[] = [];
    inDeg.forEach((deg, id) => { if (deg === 0) queue.push(id); });
    const layers: string[][] = [];
    while (queue.length > 0) {
      const layer = [...queue];
      layers.push(layer);
      queue.length = 0;
      for (const id of layer) {
        for (const child of (adj.get(id) || [])) {
          const d = (inDeg.get(child) || 1) - 1;
          inDeg.set(child, d);
          if (d === 0) queue.push(child);
        }
      }
    }
    const LAYER_GAP = 180;
    const NODE_GAP = 220;
    layers.forEach((layer, li) => {
      const totalWidth = (layer.length - 1) * NODE_GAP;
      const startX = 400 - totalWidth / 2;
      layer.forEach((id, ni) => {
        nodeMap.set(id, { x: startX + ni * NODE_GAP, y: 80 + li * LAYER_GAP });
      });
    });
    currentNodes.forEach((n: any) => {
      if (!nodeMap.has(n.id)) {
        nodeMap.set(n.id, { x: n.position?.x || 100, y: n.position?.y || 100 });
      }
    });
    currentNodes.forEach((n: any) => {
      const pos = nodeMap.get(n.id);
      if (pos) {
        onNodesChange([{ type: 'position', id: n.id, position: pos }]);
      }
    });
  }, [nodes, edges, onNodesChange]);

  const handleAddNode = useCallback(
    (type: NodeType) => {
      const position = {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      };
      const nodeId = addNode(type, position);
      setSelectedNode(nodeId);
      setShowNodePanel(true);
    },
    [addNode, setSelectedNode]
  );

  const handleSave = useCallback(async () => {
    try {
      const savedWorkflow = await saveWorkflow(workflowName, undefined, user?.id);
      try {
        window.dispatchEvent(new CustomEvent('builder:workflow-saved', { detail: { workflowId: (savedWorkflow as any)?.id } }));
      } catch {}
    } catch (error) {
      console.error('Failed to save workflow:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save workflow');
    }
  }, [workflowName, saveWorkflow, user]);

  const handleExportCode = useCallback(() => {
    const code = {
      typescript: generateTypeScriptCode(nodes, edges),
      python: generatePythonCode(nodes, edges),
      config: { nodes, edges, name: workflowName }
    };
    const blob = new Blob([JSON.stringify(code, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}-export.json`;
    a.click();
  }, [nodes, edges, workflowName]);

  const toggleNodeFreezeById = useCallback(
    (nodeId: string) => {
      toggleNodeFreezeByIdSafe(nodeId);
    },
    [toggleNodeFreezeByIdSafe]
  );

  const toggleNodeFreeze = useCallback(() => {
    if (selectedNode) {
      toggleNodeFreezeById(selectedNode);
    }
  }, [selectedNode, toggleNodeFreezeById]);

  const handleToggleBreakpoint = useCallback((nodeId: string) => {
    toggleBreakpointById(nodeId);
  }, [toggleBreakpointById]);

  const handleContinueExecution = useCallback(() => {
    resumeExecution('continue');
  }, [resumeExecution]);

  const handleStepOver = useCallback(() => {
    resumeExecution('step');
  }, [resumeExecution]);

  const handleAIAddNode = useCallback((type: string, position: { x: number; y: number }) => {
    const nodeId = addNode(type as NodeType, position);
    setSelectedNode(nodeId);
    setShowNodePanel(true);
    return nodeId;
  }, [addNode, setSelectedNode]);

  // Handle AI-suggested node addition with pre-filled config
  const handleAddSuggestedNode = useCallback(
    (suggestion: any) => {
      const lastNode = nodes[nodes.length - 1];
      const position = lastNode
        ? { x: lastNode.position.x + 200, y: lastNode.position.y }
        : { x: 250, y: 250 };
      
      const nodeId = addNode(suggestion.nodeType as NodeType, position);
      
      // Apply pre-filled configuration
      if (suggestion.prefilledConfig && nodeId) {
        setTimeout(() => {
          updateNode(nodeId, { config: suggestion.prefilledConfig });
        }, 100);
      }
    },
    [nodes, addNode, updateNode]
  );

  // Handle applying AI-suggested fixes to nodes
  const handleApplyErrorFix = useCallback(
    async (nodeId: string, fixedConfig: any) => {
      updateNode(nodeId, { config: fixedConfig });
      
      // Clear error state
      setErrorFixes(prev => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
      
      // Retry execution if workflow is running
      if (workflow?.id) {
        console.log('Retrying workflow with fixed configuration...');
      }
    },
    [updateNode, workflow]
  );

  function generateTypeScriptCode(nodes: any[], edges: any[]): string {
    return `import { Agent, Runner } from '@openai/agents-sdk';

const workflow = async () => {
  const nodes = ${JSON.stringify(nodes, null, 2)};
  const edges = ${JSON.stringify(edges, null, 2)};
  
  const runner = new Runner();
  return await runner.execute(nodes, edges);
};

export default workflow;`;
  }

  function generatePythonCode(nodes: any[], edges: any[]): string {
    return `from agents import Agent, Runner

async def workflow():
    nodes = ${JSON.stringify(nodes, null, 2)}
    edges = ${JSON.stringify(edges, null, 2)}
    
    runner = Runner()
    return await runner.execute(nodes, edges)
`;
  }

  const handleExecute = async (executionInputVariables?: Record<string, any>) => {
    console.log('🚀 [RUN BUTTON] Clicked! Starting execution process...');
    console.log('🚀 [RUN BUTTON] Current workflow:', workflow);
    console.log('🚀 [RUN BUTTON] Workflow ID:', workflow?.id);
    console.log('🚀 [RUN BUTTON] Nodes count:', nodes.length);
    console.log('🚀 [RUN BUTTON] Edges count:', edges.length);

    // Store the actual workflow ID we'll use for execution
    // CRITICAL: We need to track this separately because if we auto-save,
    // the workflow state won't update immediately (React state is async)
    let workflowId = workflow?.id;

    // Auto-save workflow if not saved yet
    if (!workflowId) {
      console.log('⚠️ [RUN BUTTON] No workflow ID - attempting auto-save...');
      try {
        const savedWorkflow = await saveWorkflow(workflowName || 'Untitled Workflow', undefined, user?.id);
        console.log('✅ [RUN BUTTON] Auto-save successful:', savedWorkflow.id);
        
        if (!savedWorkflow?.id) {
          toast.error('Failed to save workflow. Please try saving manually first.');
          return;
        }
        
        // CRITICAL FIX: Use the saved workflow ID, not the stale state
        workflowId = savedWorkflow.id;
        console.log('✅ [RUN BUTTON] Using saved workflow ID:', workflowId);
        try {
          window.dispatchEvent(new CustomEvent('builder:workflow-saved', { detail: { workflowId: (savedWorkflow as any)?.id } }));
        } catch {}
      } catch (error) {
        console.error('❌ [RUN BUTTON] Auto-save failed:', error);
        toast.error(error instanceof Error ? error.message : 'Please save workflow first using the Save button');
        return;
      }
    }

    if (workflowId && user?.id) {
      const wfUser = (workflow as any)?.userId ?? (workflow as any)?.user_id;
      if (!wfUser) {
        try {
          const savedWorkflow = await saveWorkflow(workflowName || 'Untitled Workflow', undefined, user?.id);
          if (savedWorkflow?.id) {
            workflowId = savedWorkflow.id;
            try {
              window.dispatchEvent(new CustomEvent('builder:workflow-saved', { detail: { workflowId: (savedWorkflow as any)?.id } }));
            } catch {}
          }
        } catch (error) {
          console.error('❌ [RUN BUTTON] Save to attach userId failed:', error);
          toast.error(error instanceof Error ? error.message : 'Please save workflow first using the Save button');
          return;
        }
      }
    }

    if (workflowId && hasUnsavedChanges) {
      try {
        const savedWorkflow = await saveWorkflow(workflowName || 'Untitled Workflow', undefined, user?.id);
        if (savedWorkflow?.id) {
          workflowId = savedWorkflow.id;
          try {
            window.dispatchEvent(new CustomEvent('builder:workflow-saved', { detail: { workflowId: (savedWorkflow as any)?.id } }));
          } catch {}
        }
      } catch (error) {
        console.error('❌ [RUN BUTTON] Save before execute failed:', error);
        toast.error(error instanceof Error ? error.message : 'Please save workflow first using the Save button');
        return;
      }
    }

    // Double-check we have a workflow ID before proceeding
    if (!workflowId) {
      console.error('❌ [RUN BUTTON] CRITICAL: No workflow ID available after save attempt');
      toast.error('Failed to get workflow ID. Please try saving manually.');
      return;
    }

    // Validate workflow has start and end nodes
    const hasStartNode = nodes.some(n => n.data.nodeType === 'start');
    const hasEndNode = nodes.some(n => n.data.nodeType === 'end');

    console.log('🔍 [RUN BUTTON] Validation - Has START node:', hasStartNode);
    console.log('🔍 [RUN BUTTON] Validation - Has END node:', hasEndNode);

    if (!hasStartNode) {
      console.warn('⚠️ [RUN BUTTON] Missing START node');
      toast.error('Workflow must have a START node. Add one from the Nodes library.');
      return;
    }

    if (!hasEndNode) {
      console.warn('⚠️ [RUN BUTTON] Missing END node');
      toast.error('Workflow must have an END node. Add one from the Nodes library.');
      return;
    }

    console.log('✅ [RUN BUTTON] Validation passed - opening execution panel');
    clearWorkflowDraft();
    setActiveWorkflowId(String(workflowId));
    setCurrentExecutionId((prev) => prev || `pending-${Date.now()}`);
    setExecutionSuccess(true);
    setShowAgentChat(true);
    setShowExecution(true);
    
    try {
      // workflowId is guaranteed to exist here (from state or auto-save)
      console.log('[WORKFLOW EXECUTION] Starting execution for workflow:', workflowId);
      console.log('[WORKFLOW EXECUTION] Nodes:', nodes.length, 'Edges:', edges.length);
      console.log('[WORKFLOW EXECUTION] API endpoint:', '/api/workflows/execute');

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      
      const response = await fetch(apiUrl('/api/workflows/execute'), {
        method: 'POST',
        headers,
        body: (() => {
          const resolvedInputVariables =
            executionInputVariables && typeof executionInputVariables === 'object'
              ? executionInputVariables
              : {};

          const payload: any = {
            workflowId: workflowId,
            nodes,
            edges,
            inputVariables: resolvedInputVariables,
            inputSchema: startInputSchemaPayload,
            breakpoints: Array.from(breakpoints),
            usePinnedData: frozenNodes.size > 0,
          };

          const runFromNodeId = nextRunFromNodeIdRef.current;
          const runToNodeId = nextRunToNodeIdRef.current;
          nextRunFromNodeIdRef.current = null;
          nextRunToNodeIdRef.current = null;

          if (runFromNodeId) payload.runFromNodeId = runFromNodeId;
          if (runToNodeId) payload.runToNodeId = runToNodeId;

          return JSON.stringify(payload);
        })()
      });

      console.log('[WORKFLOW EXECUTION] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[WORKFLOW EXECUTION] Error response:', errorText);
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.detail || 'Execution failed');
        } catch {
          throw new Error(`Execution failed with status ${response.status}: ${errorText}`);
        }
      }

      const responseData = await response.json();
      console.log('[WORKFLOW EXECUTION] Raw response:', responseData);
      
      // Handle both wrapped and unwrapped response formats
      // Backend might return: { success: true, execution: {...} } OR just the execution object
      const execution = responseData.execution || responseData;
      console.log('[WORKFLOW EXECUTION] Execution started successfully:', execution);
      
      // Verify we have a valid execution ID
      if (!execution?.id) {
        console.error('[WORKFLOW EXECUTION] No execution ID in response:', responseData);
        throw new Error('Invalid response: missing execution ID');
      }
      
      console.log('[WORKFLOW EXECUTION] Execution ID:', execution.id);
      
      // Store execution ID for agent chat
      setCurrentExecutionId(execution.id);
      setExecutionSuccess(true);
      setTimelineEvents([]);
      setShowTimeline(true);
      
      // Connect to WebSocket for real-time updates
      connectExecutionWebSocket(execution.id);
      
      // Call onExecute callback with the workflow ID (using workflowId variable to avoid null check)
      if (onExecute && workflowId) onExecute(workflowId);
    } catch (error: any) {
      console.error('[WORKFLOW EXECUTION] Error:', error);
      toast.error(`Failed to execute workflow: ${error.message}`);
      setShowExecution(false);
    }
  };

  const executeWithCurrentInputs = useCallback(async () => {
    const validation = validateRunInputs();
    if (!validation.valid) {
      setShowRunConfigModal(true);
      return;
    }
    await handleExecute(validation.payload);
  }, [handleExecute, validateRunInputs]);

  const handleOpenRunConfig = useCallback(() => {
    if (nodes.length === 0) return;
    setShowRunConfigModal(true);
  }, [nodes.length]);

  const handleRunFromConfig = useCallback(async () => {
    const validation = validateRunInputs();
    if (!validation.valid) return;
    setShowRunConfigModal(false);
    await handleExecute(validation.payload);
  }, [handleExecute, validateRunInputs]);

  useEffect(() => {
    executeRef.current = executeWithCurrentInputs;
  }, [executeWithCurrentInputs]);

  const connectExecutionWebSocket = useCallback((executionId: string) => {
    if (webSocketRef.current) {
      try {
        webSocketRef.current.close();
      } catch {}
      webSocketRef.current = null;
    }

    let wsUrl = '';
    try {
      const base = API_BASE_URL ? new URL(API_BASE_URL) : new URL(window.location.origin);
      const protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${base.host}/api/workflows/executions/${executionId}/ws`;
    } catch {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/api/workflows/executions/${executionId}/ws`;
    }

    console.log('[WEBSOCKET] Connecting to:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;
      
      ws.onopen = () => {
        console.log('[WEBSOCKET] Connected successfully for execution:', executionId);
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WEBSOCKET] Received message:', message.type, message.data);
          
          if (message.type === 'node_started') {
            console.log('[NODE EXECUTION] Node started:', message.data.nodeId);
            setExecutionState(prev => ({
              ...prev,
              currentNodeId: message.data.nodeId
            }));
            setNodeExecutionStatus(prev => ({
              ...prev,
              [message.data.nodeId]: { status: 'running' }
            }));
            const node = nodes.find(n => n.id === message.data.nodeId);
            setTimelineEvents(prev => [...prev, {
              nodeId: message.data.nodeId,
              nodeLabel: node?.data?.label || message.data.nodeId,
              nodeType: message.data.nodeType || node?.data?.nodeType || 'unknown',
              status: 'running',
              startTime: Date.now()
            }]);
          } else if (message.type === 'agent_streaming') {
            // Real-time token streaming for AI agent responses
            setStreamingOutput(prev => ({
              ...prev,
              [message.data.nodeId]: message.data.accumulated
            }));
          } else if (message.type === 'node_completed') {
            console.log('[NODE EXECUTION] Node completed:', message.data.nodeId);
            setNodeExecutionStatus(prev => ({
              ...prev,
              [message.data.nodeId]: { status: 'completed', result: message.data.result }
            }));
            setTimelineEvents(prev => {
              const updated = [...prev];
              const eventIndex = updated.findIndex(e => e.nodeId === message.data.nodeId && !e.endTime);
              if (eventIndex !== -1) {
                const endTime = Date.now();
                updated[eventIndex] = {
                  ...updated[eventIndex],
                  status: 'completed',
                  endTime,
                  duration: endTime - updated[eventIndex].startTime,
                  tokenUsage: message.data.result?.tokenUsage,
                  apiCalls: message.data.result?.apiCalls
                };
              }
              return updated;
            });

            try {
              const nodeId = String(message.data.nodeId);
              if (frozenNodesRef.current.has(nodeId)) {
                const res = message.data.result;
                const pinned = (res && typeof res === 'object' && 'output' in res) ? (res as any).output : res;
                updateNodeRef.current(nodeId, {
                  config: {
                    pinnedEnabled: true,
                    pinnedOutput: pinned,
                  },
                });
              }
            } catch {}

            // Clear streaming output when node completes
            setStreamingOutput(prev => {
              const next = { ...prev };
              delete next[message.data.nodeId];
              return next;
            });
          } else if (message.type === 'node_failed') {
            console.error('[NODE EXECUTION] Node failed:', message.data.nodeId, message.data.error);
            setNodeExecutionStatus(prev => ({
              ...prev,
              [message.data.nodeId]: { status: 'failed', result: message.data }
            }));
            setTimelineEvents(prev => {
              const updated = [...prev];
              const eventIndex = updated.findIndex(e => e.nodeId === message.data.nodeId && !e.endTime);
              if (eventIndex !== -1) {
                const endTime = Date.now();
                updated[eventIndex] = {
                  ...updated[eventIndex],
                  status: 'failed',
                  endTime,
                  duration: endTime - updated[eventIndex].startTime,
                  error: message.data.error
                };
              }
              return updated;
            });
          } else if (message.type === 'execution_paused') {
            const reason = message.data?.reason;
            const hasApprovalMessage = Boolean(message.data?.message);
            const isDebugPause = reason === 'breakpoint' || reason === 'step';
            if (isDebugPause) {
              setExecutionState({
                isPaused: true,
                currentNodeId: message.data?.nodeId || null,
                variables: message.data?.variables || {}
              });
            } else if (hasApprovalMessage) {
              setExecutionState({ isPaused: false, currentNodeId: null, variables: {} });
            }
            if (!isDebugPause) {
              setPendingApproval({
                action: message.data?.action || 'Approve this step',
                tool: message.data?.tool || 'unknown',
                parameters: message.data?.parameters || {},
                riskLevel: message.data?.risk_level || 'medium',
              });
            }
          } else if (message.type === 'execution_completed') {
            console.log('[WORKFLOW EXECUTION] Completed with status:', message.data.status);
            
            // Show agent chat interface for successful execution
            if (message.data.status === 'completed' && !message.data.error) {
              console.log('[WORKFLOW EXECUTION] Success! Opening agent chat interface');
              setExecutionSuccess(true);
              setShowAgentChat(true);
            } else if (message.data.error) {
              console.error('[WORKFLOW EXECUTION] Failed with error:', message.data.error);
              toast.error(`Workflow execution failed: ${message.data.error}`);
            }
            
            // Clear node execution status after delay
            setTimeout(() => {
              setNodeExecutionStatus({});
              setStreamingOutput({});
            }, 2000);
          }
        } catch (parseError) {
          console.error('[WEBSOCKET] Error parsing message:', parseError);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[WEBSOCKET] Connection error:', error);
        // Don't block chat opening due to WebSocket errors
        // The timeout in handleExecute will still open the chat
      };
      
      ws.onclose = (event) => {
        console.log('[WEBSOCKET] Disconnected. Code:', event.code, 'Reason:', event.reason);
      };
    } catch (error) {
      console.error('[WEBSOCKET] Failed to create connection:', error);
      // Chat will still open via the timeout in handleExecute
    }
  }, []);

  const handleExport = () => {
    const data = JSON.stringify({ nodes, edges, name: workflowName }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.nodes && data.edges) {
              onNodesChange([{ type: 'reset', item: data.nodes }] as any);
              onEdgesChange([{ type: 'reset', item: data.edges }] as any);
              if (data.name) setWorkflowName(data.name);
            }
          } catch (error) {
            console.error('Failed to import workflow:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleWorkflowGenerated = useCallback((generatedNodes: any[], generatedEdges: any[], meta?: { prompt?: string }) => {
    if (generatedNodes && generatedNodes.length > 0) {
      if (meta?.prompt) {
        const nextName = deriveWorkflowName(meta.prompt);
        if (nextName) {
          setWorkflowName((prev) => {
            const current = String(prev || '').replace(/\s+/g, ' ').trim();
            const lower = current.toLowerCase();
            const isPromptLike =
              /^\s*(i\s+(need|want)|please\b|can\s+you\b|could\s+you\b|would\s+you\b|help\s+me\b|hi\b|hello\b|hey\b)/i.test(current) ||
              current.endsWith('?') ||
              current.split(' ').length > 8 ||
              (lower.includes('need you to') || lower.includes('want you to') || lower.includes('can you') || lower.includes('could you'));
            if (!current || current === 'Untitled Workflow' || isPromptLike) return nextName;
            return prev;
          });
        }
      }
      const validatedNodes = generatedNodes.map((node: any) => ({
        ...node,
        type: 'custom',
        data: {
          ...(node?.data || {}),
          onUpdate: (updates: any) => {
            updateNode(node.id, updates);
          }
        }
      }));

      const validatedEdges = (generatedEdges || []).map((edge: any) => {
        const t = edge?.type;
        const nextType = (t === 'default' || t === 'smoothstep' || t === 'step' || t === 'straight' || typeof t === 'undefined') ? t : 'smoothstep';
        return { ...edge, type: nextType };
      });
      
      onNodesChange([{ type: 'reset', item: validatedNodes }] as any);
      onEdgesChange([{ type: 'reset', item: validatedEdges }] as any);
      
      setShowAIChat(true);
      setShowLibrary(false);
      
      if (validatedNodes.length > 0) {
        setTimeout(() => {
          setSelectedNode(validatedNodes[1]?.id || validatedNodes[0]?.id);
          setShowNodePanel(true);
        }, 100);
      }
    }
  }, [deriveWorkflowName, onNodesChange, onEdgesChange, updateNode]);

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, { nodes, edges }]);
    onNodesChange([{ type: 'reset', item: prev.nodes }] as any);
    onEdgesChange([{ type: 'reset', item: prev.edges }] as any);
  }, [undoStack, nodes, edges, onNodesChange, onEdgesChange]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, { nodes, edges }]);
    onNodesChange([{ type: 'reset', item: next.nodes }] as any);
    onEdgesChange([{ type: 'reset', item: next.edges }] as any);
  }, [redoStack, nodes, edges, onNodesChange, onEdgesChange]);

  // Sync undo/redo refs so the keydown handler always calls the latest version
  React.useEffect(() => { handleUndoRef.current = handleUndo; }, [handleUndo]);
  React.useEffect(() => { handleRedoRef.current = handleRedo; }, [handleRedo]);

  const handleZoom = (delta: number) => {
    const instance = reactFlowInstanceRef.current;
    if (!instance) return;
    const current = instance.getZoom ? instance.getZoom() : 1;
    const next = Math.min(2, Math.max(0.25, current + delta));
    if (instance.zoomTo) instance.zoomTo(next);
  };

  const handleFit = () => {
    const instance = reactFlowInstanceRef.current;
    if (instance?.fitView) instance.fitView({ padding: 0.2, maxZoom: 1.2 });
  };

  const handleRestoreVersion = async (versionId: number) => {
    if (!workflow?.id) return;
    try {
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      const res = await fetch(apiUrl(`/api/workflows/${workflow.id}/versions/${versionId}/restore`), { method: 'POST', headers });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to restore version');
      }
      const restored = await res.json();
      const restoredNodes = Array.isArray((restored as any)?.nodes) ? (restored as any).nodes : [];
      const restoredEdges = Array.isArray((restored as any)?.edges) ? (restored as any).edges : [];

      const migratedNodes = restoredNodes.map((node: any) => ({
        ...node,
        type: 'custom',
        data: {
          ...(node?.data || {}),
          onUpdate: (updates: any) => {
            updateNode(node.id, updates);
          }
        }
      }));

      onNodesChange([{ type: 'reset', item: migratedNodes }] as any);
      onEdgesChange([{ type: 'reset', item: restoredEdges }] as any);
    } catch {
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', position: 'relative', overflowX: 'hidden' }}>
      {showLibrary && (
        <NodesLibrary onAddNode={handleAddNode} onClose={() => setShowLibrary(false)} />
      )}

      {pendingApproval && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', pointerEvents: 'auto' }}>
          <ApprovalGate
            action={pendingApproval.action}
            tool={pendingApproval.tool}
            parameters={pendingApproval.parameters}
            riskLevel={pendingApproval.riskLevel}
            onApprove={() => { setPendingApproval(null); }}
            onReject={() => { setPendingApproval(null); }}
          />
        </div>
      )}

      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        {nodes.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
            <WorkflowEmptyCanvas
              onSelectTemplate={(t) => {
                toast.success(`Loading ${t} template…`);
              }}
              onAskAI={() => {
                setShowAIChat(true);
              }}
            />
          </div>
        )}
        <ReactFlow
          nodes={enhancedNodes}
          edges={edges.map(edge => ({
            ...edge,
            selected: edge.id === selectedEdge,
            hidden: (() => {
              const sourceId = (edge as any)?.source;
              const targetId = (edge as any)?.target;
              if (!sourceId || !targetId) return true;
              const sourceExists = nodes.some((n: any) => n.id === sourceId);
              const targetExists = nodes.some((n: any) => n.id === targetId);
              return !(sourceExists && targetExists);
            })(),
            sourceHandle: (() => {
              const sourceId = (edge as any)?.source;
              const sourceHandle = (edge as any)?.sourceHandle;
              if (!sourceId) return undefined;
              if (!sourceHandle) return undefined;
              const sourceNode = nodes.find((n: any) => n.id === sourceId);
              const sourceType = (sourceNode as any)?.data?.nodeType;
              if (sourceType === 'agent') {
                const allowed = new Set(['chat-model', 'memory', 'tool']);
                return allowed.has(String(sourceHandle)) ? sourceHandle : undefined;
              }
              if (sourceType === 'if-else') {
                const allowed = new Set(['true', 'false']);
                return allowed.has(String(sourceHandle)) ? sourceHandle : undefined;
              }
              return undefined;
            })(),
            targetHandle: undefined,
            style: {
              stroke:
                edge.id === selectedEdge
                  ? '#ef4444'
                  : typeof (edge as any)?.style?.stroke !== 'undefined'
                    ? (edge as any).style.stroke
                    : 'rgba(255,255,255,0.55)',
              strokeWidth:
                edge.id === selectedEdge
                  ? 3
                  : typeof (edge as any)?.style?.strokeWidth !== 'undefined'
                    ? (edge as any).style.strokeWidth
                    : 1.6,
            },
          }))}
          onNodesChange={applyNodesChange}
          onEdgesChange={applyEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{ type: 'smoothstep', style: { stroke: 'rgba(255,255,255,0.55)', strokeWidth: 1.6 } }}
          connectionLineStyle={{ stroke: 'rgba(255,255,255,0.55)', strokeWidth: 1.6 }}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
          minZoom={0.1}
          maxZoom={10}
          onInit={(instance: any) => {
            reactFlowInstanceRef.current = instance;
            if (initialZoomAppliedRef.current) return;
            try {
              if (typeof instance?.fitView === 'function') {
                instance.fitView({ padding: 0.2, maxZoom: 1.2 });
              }
              setTimeout(() => {
                try {
                  if (typeof instance?.zoomTo === 'function') {
                    instance.zoomTo(0.85);
                  } else if (typeof instance?.setViewport === 'function') {
                    const viewport = typeof instance?.getViewport === 'function' ? instance.getViewport() : null;
                    instance.setViewport({ x: viewport?.x ?? 0, y: viewport?.y ?? 0, zoom: 0.85 });
                  }
                } catch {}
              }, 0);
            } catch {}
          }}
          deleteKeyCode="Delete"
          style={{ backgroundColor: '#0A0A0A' }}
        >
          <Background 
            color={canvasBackground === 'dots' ? '#60a5fa' : canvasBackground === 'grid' ? '#86efac' : 'rgba(255,255,255,0.06)'} 
            variant={canvasBackground === 'plain' ? BackgroundVariant.Lines : canvasBackground === 'grid' ? BackgroundVariant.Lines : BackgroundVariant.Dots} 
            gap={canvasBackground === 'plain' ? 0 : canvasBackground === 'grid' ? 12 : 20} 
            size={canvasBackground === 'dots' ? 1.5 : 0.5} 
            style={{ opacity: canvasBackground === 'plain' ? 0 : canvasBackground === 'grid' ? 0.3 : 1 }}
          />
          <Controls style={{ button: { backgroundColor: '#1a1a1a', borderColor: '#333' } }} />
          <MiniMap
            style={{ backgroundColor: '#1a1a1a' }}
            nodeColor={(node: any) => {
              if (node.data.isRunning) return '#3b82f6';
              if (node.data.executionStatus === 'completed') return '#10b981';
              if (node.data.executionStatus === 'failed') return '#ef4444';
              return '#666';
            }}
          />

          <Panel position="top-left" style={{ margin: 10 }}>
            <div style={{ display: 'flex', gap: 8, backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, border: '1px solid #333' }}>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                style={{
                  background: '#0a0a0a',
                  border: '1px solid #333',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 14,
                  minWidth: 200,
                }}
                placeholder="Workflow name"
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <Save size={14} />
                {isSaving ? 'Saving...' : !workflow?.id ? 'Save' : hasUnsavedChanges ? 'Save*' : 'Saved'}
              </button>
              <button
                onClick={handleAutoLayout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: '#1e1e3a',
                  color: '#a5b4fc',
                  border: '1px solid #333',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <LayoutGrid size={14} />
                Layout
              </button>
              {lastSaved && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: hasUnsavedChanges ? '#f59e0b' : '#10b981',
                }}>
                  {hasUnsavedChanges ? <Clock size={12} /> : <CheckCircle size={12} />}
                  {new Date(lastSaved).toLocaleTimeString()}
                </div>
              )}
              {validationErrors.length > 0 && (
                <button
                  onClick={() => setShowValidationPanel(!showValidationPanel)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    backgroundColor: validationErrors.some(e => e.type === 'error') ? '#ef4444' : '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  <AlertCircle size={14} />
                  {validationErrors.length}
                </button>
              )}
              <button
                onClick={handleOpenRunConfig}
                disabled={nodes.length === 0 || isSaving}
                title={isSaving ? 'Saving workflow...' : nodes.length === 0 ? 'Add nodes to your workflow first' : 'Run workflow (will auto-save if needed)'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: (nodes.length === 0 || isSaving) ? '#6b7280' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: (nodes.length === 0 || isSaving) ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  opacity: (nodes.length === 0 || isSaving) ? 0.5 : 1,
                }}
              >
                <Play size={14} />
                Run
              </button>
              <button
                onClick={handleUndo}
                style={{
                  padding: 8,
                  background: undoStack.length > 0 ? '#6b7280' : '#444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: undoStack.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  opacity: undoStack.length > 0 ? 1 : 0.5,
                }}
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={handleRedo}
                style={{
                  padding: 8,
                  background: redoStack.length > 0 ? '#6b7280' : '#444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: redoStack.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  opacity: redoStack.length > 0 ? 1 : 0.5,
                }}
              >
                <RotateCw size={14} />
              </button>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 8px', backgroundColor: '#1a1a1a', borderRadius: 6, border: '1px solid #333' }}>
                <button
                  onClick={() => setCanvasBackground('dots')}
                  title="Dots Background"
                  style={{
                    padding: 6,
                    background: canvasBackground === 'dots' ? '#60a5fa' : '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  •••
                </button>
                <button
                  onClick={() => setCanvasBackground('grid')}
                  title="Grid Background"
                  style={{
                    padding: 6,
                    background: canvasBackground === 'grid' ? '#86efac' : '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  ▦
                </button>
                <button
                  onClick={() => setCanvasBackground('plain')}
                  title="Plain Background"
                  style={{
                    padding: 6,
                    background: canvasBackground === 'plain' ? '#6b7280' : '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  ▢
                </button>
              </div>
              <button
                onClick={() => handleZoom(-0.1)}
                style={{
                  padding: 8,
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => handleZoom(0.1)}
                style={{
                  padding: 8,
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={handleFit}
                style={{
                  padding: 8,
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
                title="Fit view"
              >
                <Fit size={14} />
              </button>
              <button
                onClick={() => setShowLibrary(!showLibrary)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <Plus size={14} />
                Nodes
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <Settings size={14} />
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                title="Performance Analytics"
                style={{
                  padding: 8,
                  background: showAnalytics ? '#ffffff20' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                <BarChart3 size={14} />
              </button>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                title="AI Suggestions"
                style={{
                  padding: 8,
                  background: showSuggestions ? '#8b5cf6' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                <Sparkles size={14} />
              </button>
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                title="Execution Timeline"
                style={{
                  padding: 8,
                  background: showTimeline ? '#10b981' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                <Clock size={14} />
              </button>
              <button
                onClick={handleExport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <Download size={14} />
              </button>
              <button
                onClick={handleExportCode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                title="Export to TypeScript/Python"
              >
                <Code size={14} />
              </button>
              {workflow?.id && (
                <>
                  <button
                    onClick={() => setShowCodePreview(!showCodePreview)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      backgroundColor: showCodePreview ? '#3b82f6' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                    title="View Generated Code"
                  >
                    <FileText size={14} />
                  </button>
                  <button
                    onClick={() => setShowExecutionLogs(!showExecutionLogs)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      backgroundColor: showExecutionLogs ? '#10b981' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                    title="View Execution Logs"
                  >
                    <List size={14} />
                  </button>
                  <button
                    onClick={() => setShowVersions(!showVersions)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      backgroundColor: showVersions ? '#f59e0b' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                    title="Workflow Versions"
                  >
                    <History size={14} />
                  </button>
                </>
              )}
              {selectedNode && (
                <button
                  onClick={toggleNodeFreeze}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    backgroundColor: frozenNodes.has(selectedNode) ? '#06b6d4' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                  title={frozenNodes.has(selectedNode) ? "Unfreeze Node" : "Freeze Node for Testing"}
                >
                  <Snowflake size={14} />
                </button>
              )}
              <button
                onClick={handleImport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <Upload size={14} />
              </button>
            </div>
          </Panel>

          <Panel position="bottom-left" style={{ margin: 20 }}>
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                background: showAIChat
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                  : 'rgba(139, 92, 246, 0.15)',
                backdropFilter: 'blur(12px)',
                color: 'white',
                border: showAIChat ? 'none' : '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                boxShadow: showAIChat
                  ? '0 8px 24px rgba(139, 92, 246, 0.4)'
                  : '0 4px 12px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                if (!showAIChat) {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!showAIChat) {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }
              }}
            >
              <Sparkles size={18} />
              <span>AI Builder</span>
            </button>
          </Panel>

          {showValidationPanel && validationErrors.length > 0 && (
            <Panel position="top-right" style={{ margin: 10, maxWidth: 300 }}>
              <div style={{
                backgroundColor: '#1a1a1a',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #333',
                maxHeight: 400,
                overflowY: 'auto',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <h3 style={{ margin: 0, color: 'white', fontSize: 14 }}>Validation Issues</h3>
                  <button
                    onClick={() => setShowValidationPanel(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#999',
                      cursor: 'pointer',
                      fontSize: 18,
                    }}
                  >×</button>
                </div>
                {validationErrors.map((error, idx) => (
                  <div key={idx} style={{
                    padding: 8,
                    marginBottom: 8,
                    backgroundColor: error.type === 'error' ? '#7f1d1d' : '#78350f',
                    borderRadius: 4,
                    fontSize: 12,
                    color: 'white',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {error.type === 'error' ? '❌' : '⚠️'} {error.type.toUpperCase()}
                    </div>
                    <div>{error.message}</div>
                    {error.nodeId && <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>Node: {error.nodeId}</div>}
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {showRunConfigModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 1400,
          }}
        >
          <div
            style={{
              width: 'min(940px, 100%)',
              maxHeight: '88vh',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #1e293b',
              }}
            >
              <div style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>Run Configuration</div>
              <button
                onClick={() => setShowRunConfigModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
                gap: 16,
                padding: 16,
                overflowY: 'auto',
              }}
            >
              <div style={{ border: '1px solid #1e293b', borderRadius: 10, padding: 12, backgroundColor: '#111827' }}>
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Typed Start Inputs</div>
                {startInputFields.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: 12 }}>No start input fields configured.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {startInputFields.map((field) => {
                      const fieldType = String(field.type || 'string').toLowerCase();
                      const rawValue = runInputValues[field.name];
                      const error = runInputErrors[field.name];
                      const defaultText = field.defaultValue === undefined || field.defaultValue === null || field.defaultValue === ''
                        ? ''
                        : runInputDisplayValue(field.defaultValue, fieldType);

                      return (
                        <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600 }}>
                              {field.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  color: '#94a3b8',
                                  border: '1px solid #334155',
                                  borderRadius: 999,
                                  padding: '2px 8px',
                                  textTransform: 'lowercase',
                                }}
                              >
                                {fieldType}
                              </span>
                              {field.required && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: '#fecaca',
                                    border: '1px solid #7f1d1d',
                                    borderRadius: 999,
                                    padding: '2px 8px',
                                  }}
                                >
                                  required
                                </span>
                              )}
                            </div>
                          </div>

                          {(fieldType === 'object' || fieldType === 'array' || fieldType === 'json') ? (
                            <textarea
                              value={runInputDisplayValue(rawValue, fieldType)}
                              onChange={(e) => setRunInputFieldValue(field.name, e.target.value)}
                              style={{
                                width: '100%',
                                minHeight: 78,
                                backgroundColor: '#020617',
                                border: `1px solid ${error ? '#dc2626' : '#334155'}`,
                                borderRadius: 6,
                                color: 'white',
                                padding: '8px 10px',
                                fontSize: 12,
                                fontFamily: 'monospace',
                                resize: 'vertical',
                              }}
                              placeholder={defaultText || (fieldType === 'array' ? '["item"]' : '{"key":"value"}')}
                            />
                          ) : fieldType === 'boolean' ? (
                            <select
                              value={rawValue === true ? 'true' : rawValue === false ? 'false' : ''}
                              onChange={(e) => {
                                const next = e.target.value;
                                setRunInputFieldValue(field.name, next === '' ? '' : next === 'true');
                              }}
                              style={{
                                width: '100%',
                                backgroundColor: '#020617',
                                border: `1px solid ${error ? '#dc2626' : '#334155'}`,
                                borderRadius: 6,
                                color: 'white',
                                padding: '8px 10px',
                                fontSize: 12,
                              }}
                            >
                              <option value="">Select...</option>
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          ) : (
                            <input
                              type={fieldType === 'number' || fieldType === 'integer' ? 'number' : 'text'}
                              value={runInputDisplayValue(rawValue, fieldType)}
                              onChange={(e) => setRunInputFieldValue(field.name, e.target.value)}
                              style={{
                                width: '100%',
                                backgroundColor: '#020617',
                                border: `1px solid ${error ? '#dc2626' : '#334155'}`,
                                borderRadius: 6,
                                color: 'white',
                                padding: '8px 10px',
                                fontSize: 12,
                              }}
                              placeholder={defaultText || 'Enter value'}
                            />
                          )}

                          {error && <div style={{ color: '#fca5a5', fontSize: 11 }}>{error}</div>}
                          {field.description && <div style={{ color: '#64748b', fontSize: 11 }}>{field.description}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ border: '1px solid #1e293b', borderRadius: 10, padding: 12, backgroundColor: '#111827' }}>
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Preflight Cost & Risk</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: '#cbd5e1', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>Agent nodes</span>
                    <strong style={{ color: 'white' }}>{preflightSummary.agentNodeCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>External actions</span>
                    <strong style={{ color: 'white' }}>{preflightSummary.externalActionCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>Approval coverage</span>
                    <strong style={{ color: 'white' }}>
                      {preflightSummary.externalActionsWithApproval}/{preflightSummary.externalActionCount}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>Estimated token budget</span>
                    <strong style={{ color: 'white' }}>{preflightSummary.estimatedTokenBudget.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>Estimated cost</span>
                    <strong style={{ color: 'white' }}>${preflightSummary.estimatedCostUsd.toFixed(4)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span>Risk level</span>
                    <span
                      style={{
                        backgroundColor: `${preflightRiskColor}20`,
                        border: `1px solid ${preflightRiskColor}`,
                        color: preflightRiskColor,
                        borderRadius: 999,
                        padding: '2px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {preflightSummary.riskLevel}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>Data boundaries</div>
                  {preflightSummary.dataBoundaries.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: 11 }}>No external boundaries detected.</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {preflightSummary.dataBoundaries.map((boundary) => (
                        <span
                          key={boundary}
                          style={{
                            border: '1px solid #334155',
                            borderRadius: 999,
                            padding: '3px 8px',
                            fontSize: 10,
                            color: '#cbd5e1',
                            backgroundColor: '#0f172a',
                          }}
                        >
                          {boundary}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                padding: '12px 16px',
                borderTop: '1px solid #1e293b',
              }}
            >
              <button
                onClick={() => setShowRunConfigModal(false)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'transparent',
                  border: '1px solid #475569',
                  borderRadius: 6,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRunFromConfig}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: 6,
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Run Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {showNodePanel && selectedNodeData && (
        <NodePanel
          nodeId={selectedNode!}
          data={selectedNodeData.data}
          onUpdate={(updates) => updateNode(selectedNode!, updates)}
          onClose={() => {
            setShowNodePanel(false);
            setSelectedNode(null);
          }}
          onDelete={() => {
            deleteNode(selectedNode!);
            setShowNodePanel(false);
            setSelectedNode(null);
          }}
        />
      )}

      {showSettings && (
        <WorkflowSettings
          workflow={workflow}
          onClose={() => setShowSettings(false)}
          onUpdate={(updates) => console.log('Update workflow settings:', updates)}
        />
      )}

      {showExecution && (workflow || activeWorkflowId) && (
        <ExecutionPanel
          workflowId={String((workflow as any)?.id || activeWorkflowId)}
          nodes={nodes as any[]}
          edges={edges as any[]}
          currentExecutionId={currentExecutionId}
          onClose={() => setShowExecution(false)}
        />
      )}

      <AIWorkflowChat
        isOpen={showAIChat}
        onToggle={() => setShowAIChat(!showAIChat)}
        onWorkflowGenerated={handleWorkflowGenerated}
        currentNodes={nodes}
        currentEdges={edges}
      />

      <AICopilot
        selectedNodeId={selectedNode}
        nodes={nodes}
        edges={edges}
        onAddNode={handleAIAddNode}
        onUpdateNode={updateNode}
        onConnect={(source, target) => onConnect({ source, target, sourceHandle: null, targetHandle: null })}
        validationErrors={validationErrors}
      />

      {showAnalytics && workflow && (
        <PerformanceAnalytics
          workflowId={workflow.id}
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      <BreakpointDebugger
        nodes={nodes}
        onToggleBreakpoint={handleToggleBreakpoint}
        breakpoints={breakpoints}
        executionState={executionState}
        onContinue={handleContinueExecution}
        onStepOver={handleStepOver}
      />

      {/* AI Suggestions Panel - Smart node recommendations */}
      <AISuggestionsPanel
        nodes={nodes}
        edges={edges}
        workflowName={workflowName}
        onAddNode={handleAddSuggestedNode}
        show={showSuggestions}
        onClose={() => setShowSuggestions(false)}
      />

      {/* Streaming Output Display - Real-time AI response streaming */}
      {Object.entries(streamingOutput).map(([nodeId, output]) => (
        <div key={nodeId} style={{ position: 'relative' }}>
          <StreamingOutputDisplay
            nodeId={nodeId}
            output={output}
            isStreaming={nodeExecutionStatus[nodeId]?.status === 'running'}
          />
        </div>
      ))}

      {/* Error Recovery Panel - AI-powered error fixing */}
      {Object.entries(nodeExecutionStatus)
        .filter(([_, status]) => status.status === 'failed')
        .map(([nodeId, status]) => {
          const node = nodes.find(n => n.id === nodeId);
          if (!node || errorFixes[nodeId] === false) return null;
          
          return (
            <ErrorRecoveryPanel
              key={nodeId}
              nodeId={nodeId}
              node={node}
              error={status.result?.error || 'Unknown error'}
              executionContext={{ variables: {}, nodes, edges }}
              onApplyFix={handleApplyErrorFix}
              onDismiss={() => setErrorFixes(prev => ({ ...prev, [nodeId]: false }))}
            />
          );
        })}

      {/* Enhanced Agent Chat Interface - Professional agent testing console */}
      {showAgentChat && executionSuccess && currentExecutionId && (workflow || activeWorkflowId) && (
        <EnhancedAgentChatInterface
          workflowId={String((workflow as any)?.id || activeWorkflowId)}
          workflowName={workflowName}
          executionId={currentExecutionId}
          workflowNodes={nodes}
          workflowEdges={edges}
          onClose={() => {
            setShowAgentChat(false);
            setExecutionSuccess(false);
          }}
        />
      )}

      {showCodePreview && workflow?.id && (
        <CodePreview
          workflowId={workflow.id}
          onClose={() => setShowCodePreview(false)}
        />
      )}

      {showExecutionLogs && currentExecutionId && (
        <ExecutionLogs
          executionId={currentExecutionId}
          onClose={() => setShowExecutionLogs(false)}
        />
      )}

      {showVersions && workflow?.id && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '450px',
            height: '100%',
            backgroundColor: '#1a1a1a',
            borderLeft: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1200,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #333',
            }}
          >
            <span style={{ color: 'white', fontWeight: 600 }}>Workflow Versions</span>
            <button
              onClick={() => setShowVersions(false)}
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
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {isVersionsLoading ? (
              <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>Loading versions...</div>
            ) : workflowVersions.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>No versions available</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {workflowVersions.map((v: any) => (
                  <div
                    key={v.id}
                    style={{
                      backgroundColor: '#252525',
                      borderRadius: 8,
                      border: '1px solid #333',
                      padding: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{String(v.version || v.id)}</div>
                      <div style={{ color: '#777', fontSize: 11 }}>{v.createdAt ? new Date(v.createdAt).toLocaleString() : ''}</div>
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(Number(v.id))}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showTimeline && timelineEvents.length > 0 && (
        <ExecutionTimeline
          executionId={currentExecutionId || 'unknown'}
          events={timelineEvents}
          onReplayToNode={(nodeId) => {
            nextRunFromNodeIdRef.current = nodeId;
            setTimelineEvents([]);
            executeRef.current?.();
          }}
          onClose={() => setShowTimeline(false)}
        />
      )}
    </div>
  );
}
