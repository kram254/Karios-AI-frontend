import { useState, useCallback, useEffect } from 'react';
import { useNodesState, useEdgesState, addEdge, Connection, Edge } from '@xyflow/react';
import { nanoid } from 'nanoid';
import type { Workflow, WorkflowNode, WorkflowEdge, NodeType } from '../types/workflow';

export function useWorkflow(initialWorkflow?: Workflow) {
  const [workflow, setWorkflow] = useState<Workflow | null>(initialWorkflow || null);
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(initialWorkflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>(initialWorkflow?.edges || []);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialWorkflow) {
      setWorkflow(initialWorkflow);
      setNodes(initialWorkflow.nodes);
      setEdges(initialWorkflow.edges);
    }
  }, [initialWorkflow, setNodes, setEdges]);

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
        type,
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
      setNodes(loadedWorkflow.nodes);
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
  };
  return labels[type] || type;
}

function getDefaultConfig(type: NodeType): Record<string, any> {
  const defaults: Record<NodeType, Record<string, any>> = {
    'start': { inputVariables: [] },
    'agent': { prompt: '', model: 'gpt-4', temperature: 0.7, maxTokens: 2000 },
    'mcp-tool': { tool: '', toolArgs: {} },
    'transform': { code: '' },
    'if-else': { condition: '' },
    'while': { condition: '', maxIterations: 10 },
    'approval': { approvalMessage: '' },
    'end': { outputVariable: '' },
    'note': { noteText: 'Double-click to edit note' },
  };
  return defaults[type] || {};
}
