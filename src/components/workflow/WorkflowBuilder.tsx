import React, { useCallback, useState, useEffect } from 'react';
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
import { Save, Play, Settings, Plus, Download, Upload, Sparkles, AlertCircle, CheckCircle, Clock, Code, Snowflake, BarChart3 } from 'lucide-react';
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
import { validateWorkflow, type ValidationError } from '../../utils/workflowValidator';
import { validateConnection as validateNodeConnection } from '../../utils/nodeTypeSystem';
import type { NodeType } from '../../types/workflow';

interface WorkflowBuilderProps {
  workflowId?: string;
  onSave?: (workflowId: string) => void;
  onExecute?: (workflowId: string) => void;
}

export function WorkflowBuilder({ workflowId, onSave, onExecute }: WorkflowBuilderProps) {
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
  } = useWorkflow();

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
  const [executionSuccess, setExecutionSuccess] = useState(false);

  useEffect(() => {
    const validation = validateWorkflow(nodes as any, edges as any);
    setValidationErrors([...validation.errors, ...validation.warnings]);
  }, [nodes, edges]);

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
          alert(validation.message || 'Invalid connection');
          return;
        }
      }
      
      onConnect(connection);
    },
    [nodes, onConnect]
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

  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdge) {
        deleteEdge(selectedEdge);
        setSelectedEdge(null);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdge, deleteEdge]);

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
      await saveWorkflow(workflowName);
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  }, [workflowName, saveWorkflow]);

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

  const toggleNodeFreeze = useCallback(() => {
    if (selectedNode) {
      setFrozenNodes(prev => {
        const next = new Set(prev);
        if (next.has(selectedNode)) {
          next.delete(selectedNode);
        } else {
          next.add(selectedNode);
        }
        return next;
      });
    }
  }, [selectedNode]);

  const handleToggleBreakpoint = useCallback((nodeId: string) => {
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

  const handleContinueExecution = useCallback(() => {
    setExecutionState({ isPaused: false, currentNodeId: null, variables: {} });
  }, []);

  const handleStepOver = useCallback(() => {
    setExecutionState({ isPaused: false, currentNodeId: null, variables: {} });
  }, []);

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

  const handleExecute = async () => {
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
        const savedWorkflow = await saveWorkflow(workflowName || 'Untitled Workflow');
        console.log('✅ [RUN BUTTON] Auto-save successful:', savedWorkflow.id);
        
        if (!savedWorkflow?.id) {
          alert('Failed to save workflow. Please try saving manually first.');
          return;
        }
        
        // CRITICAL FIX: Use the saved workflow ID, not the stale state
        workflowId = savedWorkflow.id;
        console.log('✅ [RUN BUTTON] Using saved workflow ID:', workflowId);
      } catch (error) {
        console.error('❌ [RUN BUTTON] Auto-save failed:', error);
        alert('Please save workflow first using the Save button');
        return;
      }
    }

    // Double-check we have a workflow ID before proceeding
    if (!workflowId) {
      console.error('❌ [RUN BUTTON] CRITICAL: No workflow ID available after save attempt');
      alert('Failed to get workflow ID. Please try saving manually.');
      return;
    }

    // Validate workflow has start and end nodes
    const hasStartNode = nodes.some(n => n.data.nodeType === 'start');
    const hasEndNode = nodes.some(n => n.data.nodeType === 'end');
    
    console.log('🔍 [RUN BUTTON] Validation - Has START node:', hasStartNode);
    console.log('🔍 [RUN BUTTON] Validation - Has END node:', hasEndNode);
    
    if (!hasStartNode) {
      console.warn('⚠️ [RUN BUTTON] Missing START node');
      alert('Workflow must have a START node. Add one from the Nodes library.');
      return;
    }
    
    if (!hasEndNode) {
      console.warn('⚠️ [RUN BUTTON] Missing END node');
      alert('Workflow must have an END node. Add one from the Nodes library.');
      return;
    }

    console.log('✅ [RUN BUTTON] Validation passed - opening execution panel');
    setShowExecution(true);
    
    try {
      // workflowId is guaranteed to exist here (from state or auto-save)
      console.log('[WORKFLOW EXECUTION] Starting execution for workflow:', workflowId);
      console.log('[WORKFLOW EXECUTION] Nodes:', nodes.length, 'Edges:', edges.length);
      console.log('[WORKFLOW EXECUTION] API endpoint:', `/api/workflows/${workflowId}/execute`);
      
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflowId,
          nodes,
          edges,
          inputVariables: {}
        })
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
      setExecutionSuccess(false);
      
      // Connect to WebSocket for real-time updates
      connectExecutionWebSocket(execution.id);
      
      // Show chat interface immediately after successful execution start
      // This ensures users can interact even if WebSocket updates are delayed
      setTimeout(() => {
        if (execution.id) {
          console.log('[WORKFLOW EXECUTION] Opening agent chat interface');
          setExecutionSuccess(true);
          setShowAgentChat(true);
        }
      }, 1500); // Give 1.5 seconds for initial execution setup
      
      // Call onExecute callback with the workflow ID (using workflowId variable to avoid null check)
      if (onExecute && workflowId) onExecute(workflowId);
    } catch (error: any) {
      console.error('[WORKFLOW EXECUTION] Error:', error);
      alert(`Failed to execute workflow: ${error.message}`);
      setShowExecution(false);
    }
  };

  const connectExecutionWebSocket = useCallback((executionId: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/workflows/executions/${executionId}/ws`;
    
    console.log('[WEBSOCKET] Connecting to:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[WEBSOCKET] Connected successfully for execution:', executionId);
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WEBSOCKET] Received message:', message.type, message.data);
          
          if (message.type === 'node_started') {
            console.log('[NODE EXECUTION] Node started:', message.data.nodeId);
            setNodeExecutionStatus(prev => ({
              ...prev,
              [message.data.nodeId]: { status: 'running' }
            }));
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
          } else if (message.type === 'execution_completed') {
            console.log('[WORKFLOW EXECUTION] Completed with status:', message.data.status);
            
            // Show agent chat interface for successful execution
            if (message.data.status === 'completed' && !message.data.error) {
              console.log('[WORKFLOW EXECUTION] Success! Opening agent chat interface');
              setExecutionSuccess(true);
              setShowAgentChat(true);
            } else if (message.data.error) {
              console.error('[WORKFLOW EXECUTION] Failed with error:', message.data.error);
              alert(`Workflow execution failed: ${message.data.error}`);
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

  const handleWorkflowGenerated = useCallback((generatedNodes: any[], generatedEdges: any[]) => {
    if (generatedNodes && generatedNodes.length > 0) {
      const validatedNodes = generatedNodes.map(node => ({
        ...node,
        type: 'custom',
        data: {
          ...node.data,
          onUpdate: (updates: any) => {
            updateNode(node.id, updates);
          }
        }
      }));
      
      onNodesChange([{ type: 'reset', item: validatedNodes }] as any);
      onEdgesChange([{ type: 'reset', item: generatedEdges || [] }] as any);
      
      setShowAIChat(false);
      setShowLibrary(false);
      
      if (validatedNodes.length > 0) {
        setTimeout(() => {
          setSelectedNode(validatedNodes[1]?.id || validatedNodes[0]?.id);
          setShowNodePanel(true);
        }, 100);
      }
    }
  }, [onNodesChange, onEdgesChange, updateNode]);

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
      {showLibrary && (
        <NodesLibrary onAddNode={handleAddNode} onClose={() => setShowLibrary(false)} />
      )}

      <div style={{ flex: 1, height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges.map(edge => ({
            ...edge,
            selected: edge.id === selectedEdge,
            style: {
              stroke: edge.id === selectedEdge ? '#ef4444' : undefined,
              strokeWidth: edge.id === selectedEdge ? 3 : undefined,
            },
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode="Delete"
          style={{ backgroundColor: '#0A0A0A' }}
        >
          <Background color="#333" variant={BackgroundVariant.Dots} gap={16} size={1} />
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
                {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save*' : 'Saved'}
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
                onClick={handleExecute}
                disabled={nodes.length === 0}
                title={nodes.length === 0 ? 'Add nodes to your workflow first' : 'Run workflow (will auto-save if needed)'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: nodes.length === 0 ? '#6b7280' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  opacity: nodes.length === 0 ? 0.5 : 1,
                }}
              >
                <Play size={14} />
                Run
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

      {showExecution && workflow && (
        <ExecutionPanel
          workflowId={workflow.id}
          onClose={() => setShowExecution(false)}
        />
      )}

      <AIWorkflowChat
        isOpen={showAIChat}
        onToggle={() => setShowAIChat(!showAIChat)}
        onWorkflowGenerated={handleWorkflowGenerated}
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
      {showAgentChat && executionSuccess && currentExecutionId && workflow && (
        <EnhancedAgentChatInterface
          workflowId={workflow.id}
          workflowName={workflowName}
          executionId={currentExecutionId}
          onClose={() => {
            setShowAgentChat(false);
            setExecutionSuccess(false);
          }}
        />
      )}
    </div>
  );
}
