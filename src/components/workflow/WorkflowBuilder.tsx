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
import { Save, Play, Settings, Plus, Download, Upload, Sparkles, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useWorkflow } from '../../hooks/useWorkflow';
import { nodeTypes } from './CustomNodes';
import { NodePanel } from './NodePanel';
import { NodesLibrary } from './NodesLibrary';
import { ExecutionPanel } from './ExecutionPanel';
import { WorkflowSettings } from './WorkflowSettings';
import { AIWorkflowChat } from './AIWorkflowChat';
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
    saveWorkflow,
  } = useWorkflow();

  const [showNodePanel, setShowNodePanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'Untitled Workflow');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationPanel, setShowValidationPanel] = useState(false);

  useEffect(() => {
    const validation = validateWorkflow(nodes, edges);
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
  }, [setSelectedNode]);

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

  const handleSave = async () => {
    try {
      const saved = await saveWorkflow(workflowName);
      if (onSave) onSave(saved.id);
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  };

  const handleExecute = () => {
    if (workflow?.id) {
      setShowExecution(true);
      if (onExecute) onExecute(workflow.id);
    }
  };

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
    if (generatedNodes.length > 0) {
      onNodesChange([{ type: 'reset', item: generatedNodes }] as any);
      onEdgesChange([{ type: 'reset', item: generatedEdges }] as any);
    }
  }, [onNodesChange, onEdgesChange]);

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
      {showLibrary && (
        <NodesLibrary onAddNode={handleAddNode} onClose={() => setShowLibrary(false)} />
      )}

      <div style={{ flex: 1, height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
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
                disabled={!workflow?.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
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
    </div>
  );
}
