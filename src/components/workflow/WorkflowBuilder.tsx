import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Play, Settings, Plus, Download, Upload } from 'lucide-react';
import { useWorkflow } from '../../hooks/useWorkflow';
import { nodeTypes } from './CustomNodes';
import { NodePanel } from './NodePanel';
import { NodesLibrary } from './NodesLibrary';
import { ExecutionPanel } from './ExecutionPanel';
import { WorkflowSettings } from './WorkflowSettings';
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
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'Untitled Workflow');

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
          onConnect={onConnect}
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
                {isSaving ? 'Saving...' : 'Save'}
              </button>
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
    </div>
  );
}
