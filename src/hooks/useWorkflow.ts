import { useState, useCallback, useEffect, useRef } from 'react';
import { useNodesState, useEdgesState, addEdge, Connection, Edge } from '@xyflow/react';
import { nanoid } from 'nanoid';
import type { Workflow, WorkflowNode, WorkflowEdge, NodeType } from '../types/workflow';

export function useWorkflow(initialWorkflow?: Workflow) {
  const [workflow, setWorkflow] = useState<Workflow | null>(initialWorkflow || null);
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(initialWorkflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>(initialWorkflow?.edges || []);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string>('');

  useEffect(() => {
    if (initialWorkflow) {
      setWorkflow(initialWorkflow);
      const migratedNodes = initialWorkflow.nodes.map(node => ({
        ...node,
        type: 'custom' as const,
        data: {
          ...node.data,
          nodeType: node.data.nodeType || (node.type as NodeType),
        },
      }));
      setNodes(migratedNodes as any);
      setEdges(initialWorkflow.edges);
      lastSavedStateRef.current = JSON.stringify({ nodes: migratedNodes, edges: initialWorkflow.edges });
      setLastSaved(new Date());
    }
  }, [initialWorkflow, setNodes, setEdges]);

  useEffect(() => {
    const currentState = JSON.stringify({ nodes, edges });
    if (currentState !== lastSavedStateRef.current && workflow?.id) {
      setHasUnsavedChanges(true);
      
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        autoSave();
      }, 3000);
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [nodes, edges, workflow?.id]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const autoSave = useCallback(async () => {
    if (!workflow?.id || !hasUnsavedChanges) return;
    
    try {
      const workflowData: Workflow = {
        ...workflow,
        nodes,
        edges,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData),
      });

      if (response.ok) {
        lastSavedStateRef.current = JSON.stringify({ nodes, edges });
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [workflow, nodes, edges, hasUnsavedChanges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: WorkflowEdge = {
        id: `edge-${nanoid(8)}`,
        source: params.source!,
        target: params.target!,
        sourceHandle: params.sourceHandle || undefined,
        targetHandle: params.targetHandle || undefined,
        type: 'smoothstep',
      };
      setEdges((eds) => addEdge(newEdge as Edge, eds));
    },
    [setEdges]
  );

  const addNode = useCallback(
    (type: NodeType, position: { x: number; y: number }) => {
      const nodeId = `node-${nanoid(8)}`;
      const newNode: WorkflowNode = {
        id: nodeId,
        type: 'custom',
        position,
        data: {
          label: getNodeLabel(type),
          nodeType: type,
          config: getDefaultConfig(type),
        },
      };
      setNodes((nds) => [...nds, newNode]);
      return nodeId;
    },
    [setNodes]
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<WorkflowNode['data']>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...updates,
                config: {
                  ...node.data.config,
                  ...updates.config,
                },
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    },
    [setEdges]
  );

  const saveWorkflow = useCallback(async (name: string, description?: string) => {
    setIsSaving(true);
    try {
      const workflowData: Workflow = {
        id: workflow?.id || `workflow-${nanoid(8)}`,
        name,
        description,
        nodes,
        edges,
        createdAt: workflow?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/workflows', {
        method: workflow?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) throw new Error('Failed to save workflow');

      const savedWorkflow = await response.json();
      setWorkflow(savedWorkflow);
      lastSavedStateRef.current = JSON.stringify({ nodes, edges });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      return savedWorkflow;
    } catch (error) {
      console.error('Error saving workflow:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [workflow, nodes, edges]);

  const loadWorkflow = useCallback(async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`);
      if (!response.ok) throw new Error('Failed to load workflow');

      const loadedWorkflow: Workflow = await response.json();
      setWorkflow(loadedWorkflow);
      const migratedNodes = loadedWorkflow.nodes.map(node => ({
        ...node,
        type: 'custom' as const,
        data: {
          ...node.data,
          nodeType: node.data.nodeType || (node.type as NodeType),
        },
      }));
      setNodes(migratedNodes as any);
      setEdges(loadedWorkflow.edges);
      return loadedWorkflow;
    } catch (error) {
      console.error('Error loading workflow:', error);
      throw error;
    }
  }, [setNodes, setEdges]);

  const clearWorkflow = useCallback(() => {
    setWorkflow(null);
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  return {
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
    loadWorkflow,
    clearWorkflow,
  };
}

function getNodeLabel(type: NodeType): string {
  const labels: Record<NodeType, string> = {
    'start': 'Start',
    'agent': 'AI Agent',
    'mcp-tool': 'MCP Tool',
    'transform': 'Transform',
    'if-else': 'If/Else',
    'while': 'While Loop',
    'approval': 'User Approval',
    'end': 'End',
    'note': 'Note',
    'guardrail': 'Guardrail',
    'set-state': 'Set State',
    'file-search': 'File Search',
  };
  return labels[type] || type;
}

function getDefaultConfig(type: NodeType): Record<string, any> {
  const defaults: Record<NodeType, Record<string, any>> = {
    'start': { inputVariables: [] },
    'agent': { 
      prompt: '', 
      model: 'gpt-4', 
      temperature: 0.7, 
      maxTokens: 2000,
      reasoningEffort: 'medium',
      outputFormat: 'text',
      verbosity: 'medium',
      includeChatHistory: true,
      writeConversationHistory: false,
      showReasoning: false
    },
    'mcp-tool': { tool: '', toolArgs: {} },
    'transform': { code: '' },
    'if-else': { condition: '' },
    'while': { condition: '', maxIterations: 10, iterationMode: 'sequential' },
    'approval': { approvalMessage: '', requireMultiLevelApproval: false, approvers: [] },
    'end': { outputVariable: '' },
    'note': { noteText: 'Double-click to edit note' },
    'guardrail': { guardrailType: 'moderation', guardrailRules: [] },
    'set-state': { stateKey: '', stateValue: '' },
    'file-search': { vectorStoreId: '', searchQuery: '', topK: 5 },
  };
  return defaults[type] || {};
}
