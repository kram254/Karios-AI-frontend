import React, { useState, useRef, useEffect } from 'react';
import { PhaseCard } from './PhaseCard';
import { Maximize2, Minimize2, Move, Upload, Check, Plus, Settings, Trash2, Link2, Download, UploadCloud, RotateCcw, Copy, ZoomIn, ZoomOut, Grid, ShieldCheck, Play, Workflow, Layers, Eye } from 'lucide-react';
import { TemplateSelector } from './workflow/TemplateSelector';
import { ExecutionViewer } from './workflow/ExecutionViewer';
import { autoLayoutNodes } from '../utils/edgeCleanup';
import { Workflow as WorkflowType } from '../types/workflow.types';

interface WorkflowCanvasProps {
  phases: any[];
  isCanvasMode?: boolean;
  onToggleCanvas?: () => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  phases,
  isCanvasMode = false,
  onToggleCanvas
}) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const API_BASE_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
  const [publishing, setPublishing] = useState(false);
  const [publishedWorkflowId, setPublishedWorkflowId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<{ from: string; to: string }[]>([]);
  const [nodeCounter, setNodeCounter] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [nodeDraggedId, setNodeDraggedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorState, setEditorState] = useState<any>({ title: '', subtitle: '', type: 'phase', data: {}, items: [] });
  const [workflowName, setWorkflowName] = useState('Canvas Workflow');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [issues, setIssues] = useState<any[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<{ id: string; name: string } | null>(null);
  const [canvasBackground, setCanvasBackground] = useState<'grid' | 'dots' | 'plain'>('dots');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (phases && phases.length > 0) {
      const initNodes = phases.map((p, i) => ({ id: `phase_${i + 1}`, type: 'phase', title: p.title, subtitle: p.subtitle || '', items: p.items || [], data: {} }));
      const initEdges = initNodes.slice(0, -1).map((n, i) => ({ from: n.id, to: initNodes[i + 1].id }));
      setNodes(initNodes);
      setEdges(initEdges);
      setNodeCounter(initNodes.length);
      const layout: any = {};
      initNodes.forEach((n, i) => { const col = i % 4; const row = Math.floor(i / 4); layout[n.id] = { x: 40 + col * 320, y: 40 + row * 260 }; });
      setNodePositions(layout);
      setTimeout(() => {
        if (canvasRef.current && initNodes.length > 0) {
          const positions = Object.values(layout);
          const minX = Math.min(...positions.map((p: any) => p.x));
          const maxX = Math.max(...positions.map((p: any) => p.x));
          const minY = Math.min(...positions.map((p: any) => p.y));
          const maxY = Math.max(...positions.map((p: any) => p.y));
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          const canvasWidth = canvasRef.current.clientWidth;
          const canvasHeight = canvasRef.current.clientHeight;
          setPan({ x: canvasWidth / 2 - centerX - 160, y: canvasHeight / 2 - centerY - 100 });
        }
      }, 100);
    }
  }, [phases]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (nodeDraggedId !== null) {
      const wx = (x - pan.x) / zoom;
      const wy = (y - pan.y) / zoom;
      setNodePositions(prev => ({
        ...prev,
        [nodeDraggedId]: { x: snapToGrid ? Math.round(wx / 20) * 20 : wx, y: snapToGrid ? Math.round(wy / 20) * 20 : wy }
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const compileDSL = () => {
    if (nodes.length > 0) {
      const outNodes = nodes.map(n => ({ id: n.id, type: n.type, title: n.title, subtitle: n.subtitle || '', items: n.items || [], data: n.data || {} }));
      const outEdges = edges.map(e => ({ from: e.from, to: e.to }));
      return { nodes: outNodes, edges: outEdges, name: workflowName } as any;
    }
    const fbNodes = (phases || []).map((phase, index) => ({ id: `phase_${index + 1}`, type: 'phase', title: phase.title, subtitle: phase.subtitle || '', items: phase.items || [] }));
    const fbEdges: { from: string; to: string }[] = [];
    for (let i = 0; i < fbNodes.length - 1; i++) fbEdges.push({ from: fbNodes[i].id, to: fbNodes[i + 1].id });
    return { nodes: fbNodes, edges: fbEdges, name: workflowName } as any;
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const dsl = compileDSL();
      const res = await fetch(`${API_BASE_URL}/api/workflows/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dsl, name: workflowName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.workflow_id) {
          setPublishedWorkflowId(data.workflow_id);
        }
      }
    } catch (e) {
      console.error('Failed to publish workflow:', e);
    } finally {
      setPublishing(false);
    }
  };

  const handleRun = async () => {
    if (nodes.length === 0) {
      setIssues([{ type: 'no_nodes', message: 'No nodes to execute' }]);
      return;
    }

    const ids = new Set(nodes.map(n => n.id));
    const indeg: any = {}; const outdeg: any = {};
    nodes.forEach(n => { indeg[n.id] = 0; outdeg[n.id] = 0; });
    const errs: any[] = [];
    edges.forEach(e => { if (!ids.has(e.from) || !ids.has(e.to)) errs.push({ type: 'invalid_edge', from: e.from, to: e.to }); else { outdeg[e.from] = (outdeg[e.from] || 0) + 1; indeg[e.to] = (indeg[e.to] || 0) + 1; } });
    nodes.forEach(n => { if ((indeg[n.id] || 0) === 0 && (outdeg[n.id] || 0) === 0 && nodes.length > 1) errs.push({ type: 'isolated', id: n.id }); });
    const color: any = {}; nodes.forEach(n => color[n.id] = 0);
    let hasCycle = false;
    const adj: any = {}; nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => { if (ids.has(e.from) && ids.has(e.to)) adj[e.from].push(e.to); });
    const dfs = (u: string) => { color[u] = 1; for (const v of adj[u]) { if (color[v] === 0) dfs(v); else if (color[v] === 1) hasCycle = true; } color[u] = 2; };
    nodes.forEach(n => { if (color[n.id] === 0) dfs(n.id); });
    if (hasCycle) errs.push({ type: 'cycle' });
    setIssues(errs);
    if (errs.length > 0) return;
    
    try { 
      await handlePublish();
      window.dispatchEvent(new CustomEvent('automation:show'));
      const sessionId = `workflow_${Date.now()}`;
      window.dispatchEvent(new CustomEvent('automation:start', { detail: { sessionId } }));
    } catch (e) {
      console.error('Failed to run workflow:', e);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedNodeId) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleDeleteNode(selectedNodeId);
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          handleDuplicateNode(selectedNodeId);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedNodeId, nodes]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.shiftKey) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !panStartRef.current) return;
    setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };

  const loadTemplate = (template: WorkflowType) => {
    setNodes(template.nodes.map(n => ({ ...n, title: n.data.label, subtitle: '', items: [], data: n.data || {} })));
    setEdges(template.edges.map(e => ({ from: e.source || e.from || '', to: e.target || e.to || '' })));
    setWorkflowName(template.name);
    const positions = autoLayoutNodes(template.nodes);
    const posObj: any = {};
    positions.forEach((pos, id) => { posObj[id] = pos; });
    setNodePositions(posObj);
    setShowTemplateSelector(false);
  };

  const handleRunExecution = async () => {
    const workflow = {
      id: publishedWorkflowId || `temp_${Date.now()}`,
      name: workflowName,
      nodes,
      edges: edges.map(e => ({ source: e.from, target: e.to, id: `${e.from}-${e.to}` }))
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/workflows/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: workflow.id, inputVariables: {} })
      });
      const execution = await response.json();
      setCurrentExecution({ id: execution.id, name: workflowName });
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * 0.1;
      const next = Math.min(2, Math.max(0.5, zoom + delta));
      setZoom(next);
    }
  };

  const copyDSL = async () => {
    const dsl = JSON.stringify(compileDSL(), null, 2);
    try { await navigator.clipboard.writeText(dsl); } catch {}
  };

  const validateGraph = () => {
    const errs: any[] = [];
    const ids = new Set(nodes.map(n => n.id));
    const indeg: any = {}; const outdeg: any = {};
    nodes.forEach(n => { indeg[n.id] = 0; outdeg[n.id] = 0; });
    edges.forEach(e => {
      if (!ids.has(e.from) || !ids.has(e.to)) errs.push({ type: 'invalid_edge', from: e.from, to: e.to });
      else { outdeg[e.from] = (outdeg[e.from] || 0) + 1; indeg[e.to] = (indeg[e.to] || 0) + 1; }
    });
    nodes.forEach(n => { if ((indeg[n.id] || 0) === 0 && (outdeg[n.id] || 0) === 0) errs.push({ type: 'isolated', id: n.id }); });
    const color: any = {}; nodes.forEach(n => color[n.id] = 0);
    let hasCycle = false;
    const adj: any = {}; nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => { if (ids.has(e.from) && ids.has(e.to)) adj[e.from].push(e.to); });
    const dfs = (u: string) => {
      color[u] = 1;
      for (const v of adj[u]) { if (color[v] === 0) dfs(v); else if (color[v] === 1) hasCycle = true; }
      color[u] = 2;
    };
    nodes.forEach(n => { if (color[n.id] === 0) dfs(n.id); });
    if (hasCycle) errs.push({ type: 'cycle' });
    setIssues(errs);
  };

  const handleNodeDragStart = (e: React.DragEvent, id: string) => {
    setNodeDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAddNode = (type: string) => {
    const id = `${type}_${nodeCounter + 1}`;
    const titleMap: any = {
      phase: 'New Phase',
      tool: 'Tool Node',
      condition: 'Condition Node',
      guardrail: 'Guardrail Node',
      loop: 'Loop Node'
    };
    const title = titleMap[type] || type;
    const newNode: any = { id, type, title, subtitle: '', items: [], data: {} };
    setNodes(prev => [...prev, newNode]);
    setNodeCounter(prev => prev + 1);
    const existingCount = Object.keys(nodePositions).length;
    const col = existingCount % 4;
    const row = Math.floor(existingCount / 4);
    setNodePositions(prev => ({ ...prev, [id]: { x: 40 + col * 320, y: 40 + row * 260 } }));
  };

  const handleDuplicateNode = (id: string) => {
    const n = nodes.find(x => x.id === id);
    if (!n) return;
    const newId = `${n.type}_${nodeCounter + 1}`;
    const copyNode = { ...n, id: newId } as any;
    setNodes(prev => [...prev, copyNode]);
    setNodeCounter(prev => prev + 1);
    setNodePositions(prev => ({ ...prev, [newId]: { x: (prev[id]?.x || 100) + 40, y: (prev[id]?.y || 100) + 40 } }));
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
    setNodePositions(prev => { const p = { ...prev } as any; delete p[id]; return p; });
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const beginConnect = (id: string) => {
    if (!connectMode) return;
    if (!connectSourceId) { setConnectSourceId(id); return; }
    if (connectSourceId === id) return;
    setEdges(prev => [...prev, { from: connectSourceId, to: id }]);
    setConnectSourceId(null);
  };

  const removeEdge = (i: number) => {
    setEdges(prev => prev.filter((_, idx) => idx !== i));
  };

  const resetLayout = () => {
    const layout: any = {};
    nodes.forEach((n, i) => { const col = i % 4; const row = Math.floor(i / 4); layout[n.id] = { x: 40 + col * 320, y: 40 + row * 260 }; });
    setNodePositions(layout);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const centerView = () => {
    if (nodes.length === 0) return;
    const positions = Object.values(nodePositions);
    if (positions.length === 0) return;
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const canvasWidth = canvasRef.current?.clientWidth || 1000;
    const canvasHeight = canvasRef.current?.clientHeight || 600;
    setPan({ x: canvasWidth / 2 - centerX, y: canvasHeight / 2 - centerY });
    setZoom(1);
  };

  const openEditor = (id: string) => {
    const n = nodes.find(x => x.id === id);
    if (!n) return;
    setSelectedNodeId(id);
    setEditorState({ title: n.title || '', subtitle: n.subtitle || '', type: n.type, data: n.data || {}, items: n.items || [] });
    setShowEditor(true);
  };

  const saveEditor = () => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, title: editorState.title, subtitle: editorState.subtitle, type: editorState.type, data: editorState.data, items: editorState.items } : n));
    setShowEditor(false);
  };

  const exportDSL = () => {
    const dsl = compileDSL();
    const blob = new Blob([JSON.stringify(dsl, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDSL = (obj: any) => {
    if (!obj || !Array.isArray(obj.nodes)) return;
    const nn = obj.nodes.map((n: any, i: number) => ({ id: n.id || `node_${i + 1}`, type: n.type || 'phase', title: n.title || n.type || 'node', subtitle: n.subtitle || '', items: n.items || [], data: n.data || {} }));
    const ee = Array.isArray(obj.edges) ? obj.edges.filter((e: any) => e && e.from && e.to).map((e: any) => ({ from: e.from, to: e.to })) : [];
    setNodes(nn);
    setEdges(ee);
    const layout: any = {};
    nn.forEach((n: any, i: number) => { const col = i % 4; const row = Math.floor(i / 4); layout[n.id] = { x: 40 + col * 320, y: 40 + row * 260 }; });
    setNodePositions(layout);
    setNodeCounter(nn.length);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const text = await f.text();
    try { const json = JSON.parse(text); importDSL(json); } catch {}
    e.target.value = '';
  };

  if (isCanvasMode) {
    return (
      <div className="fixed inset-0 bg-gray-100 z-50">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Workflow className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Workflow Builder</h2>
              <p className="text-xs text-gray-400">Design your automation workflow</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowTemplateSelector(true)} className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2 transition-colors"><Layers className="w-4 h-4" />Templates</button>
            <div className="flex items-center gap-2">
                <button onClick={exportDSL} className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2 transition-colors"><Download className="w-4 h-4" />Export</button>
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2 transition-colors"><UploadCloud className="w-4 h-4" />Import</button>
                <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={onFileChange} />
              </div>
            <div className="flex items-center gap-2">
                <input value={workflowName} onChange={e => setWorkflowName(e.target.value)} placeholder="Workflow name" className="px-3 py-2 rounded-md bg-gray-800 border border-gray-600 text-white placeholder-gray-400 text-sm focus:border-indigo-500 focus:outline-none" />
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="px-2 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-colors"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-xs text-gray-400">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="px-2 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-colors"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={() => setSnapToGrid(s => !s)} className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${snapToGrid ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}><Grid className="w-4 h-4" />{snapToGrid ? 'Snap' : 'Free'}</button>
                <button onClick={validateGraph} className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2 transition-colors"><ShieldCheck className="w-4 h-4" />Validate</button>
              </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-500/50"
              >
                <Play className="w-4 h-4" />
                Run
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shadow-lg ${publishing ? 'bg-gray-600 text-gray-400' : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-blue-500/50'}`}
              >
                {publishedWorkflowId ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {publishedWorkflowId ? 'Published' : 'Publish'}
              </button>
            <button
              onClick={onToggleCanvas}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
              Exit
            </button>
          </div>
        </div>
        
        <div className="flex h-full overflow-hidden">
          <div className="w-72 flex-shrink-0 bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto flex flex-col">
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Nodes
                  </h3>
                <div className="space-y-2">
                  <button onClick={() => handleAddNode('phase')} className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 flex items-center gap-2 transition-all text-sm">
                    <div className="w-8 h-8 rounded bg-purple-400 flex items-center justify-center">
                      <span className="text-xs font-bold">P</span>
                    </div>
                    Phase Node
                  </button>
                  <button onClick={() => handleAddNode('tool')} className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 flex items-center gap-2 transition-all text-sm">
                    <div className="w-8 h-8 rounded bg-blue-400 flex items-center justify-center">
                      <span className="text-xs font-bold">T</span>
                    </div>
                    Tool Node
                  </button>
                  <button onClick={() => handleAddNode('condition')} className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-yellow-600 to-yellow-500 text-white hover:from-yellow-700 hover:to-yellow-600 flex items-center gap-2 transition-all text-sm">
                    <div className="w-8 h-8 rounded bg-yellow-400 flex items-center justify-center">
                      <span className="text-xs font-bold">C</span>
                    </div>
                    Condition
                  </button>
                  <button onClick={() => handleAddNode('guardrail')} className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 flex items-center gap-2 transition-all text-sm">
                    <div className="w-8 h-8 rounded bg-red-400 flex items-center justify-center">
                      <span className="text-xs font-bold">G</span>
                    </div>
                    Guardrail
                  </button>
                  <button onClick={() => handleAddNode('loop')} className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 flex items-center gap-2 transition-all text-sm">
                    <div className="w-8 h-8 rounded bg-green-400 flex items-center justify-center">
                      <span className="text-xs font-bold">L</span>
                    </div>
                    Loop Node
                  </button>
                  <button onClick={() => handleAddNode('agent')} className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-700 hover:to-cyan-600 flex items-center gap-2 transition-all text-sm">
                    <div className="w-8 h-8 rounded bg-cyan-400 flex items-center justify-center">
                      <span className="text-xs font-bold">A</span>
                    </div>
                    Agent Node
                  </button>
                  <button onClick={() => handleAddNode('mcp')} className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 flex items-center gap-2 transition-all text-sm">
                    <div className="w-8 h-8 rounded bg-orange-400 flex items-center justify-center">
                      <span className="text-xs font-bold">M</span>
                    </div>
                    MCP Tools
                  </button>
                  <button onClick={() => handleAddNode('transform')} className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-pink-600 to-pink-500 text-white hover:from-pink-700 hover:to-pink-600 flex items-center gap-2 transition-all text-sm">
                    <div className="w-8 h-8 rounded bg-pink-400 flex items-center justify-center">
                      <span className="text-xs font-bold">T</span>
                    </div>
                    Transform
                  </button>
                  <button onClick={() => handleAddNode('user-approval')} className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-700 hover:to-teal-600 flex items-center gap-2 transition-all text-sm">
                    <div className="w-8 h-8 rounded bg-teal-400 flex items-center justify-center">
                      <span className="text-xs font-bold">U</span>
                    </div>
                    User Approval
                  </button>
                  <button onClick={() => handleAddNode('set-state')} className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-700 hover:to-amber-600 flex items-center gap-2 transition-all text-sm">
                    <div className="w-8 h-8 rounded bg-amber-400 flex items-center justify-center">
                      <span className="text-xs font-bold">S</span>
                    </div>
                    Set State
                  </button>
                  <button onClick={() => handleAddNode('note')} className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-slate-600 to-slate-500 text-white hover:from-slate-700 hover:to-slate-600 flex items-center gap-2 transition-all text-sm">
                    <div className="w-8 h-8 rounded bg-slate-400 flex items-center justify-center">
                      <span className="text-xs font-bold">N</span>
                    </div>
                    Note
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center justify-between">
                  <span>Canvas Tools</span>
                  <button onClick={() => setShowSettings(!showSettings)} className="p-1 rounded hover:bg-gray-800 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </h3>
                <div className="space-y-2">
                  <button onClick={() => setConnectMode(v => !v)} className={`w-full px-3 py-2 rounded-md flex items-center gap-2 transition-all text-sm ${connectMode ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                    <Link2 className="w-4 h-4" />
                    {connectMode ? 'Connecting...' : 'Connect Nodes'}
                  </button>
                  <button onClick={centerView} className="w-full px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center gap-2 transition-all text-sm">
                    <Eye className="w-4 h-4" />
                    Center View
                  </button>
                  <button onClick={resetLayout} className="w-full px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center gap-2 transition-all text-sm">
                    <RotateCcw className="w-4 h-4" />
                    Reset Layout
                  </button>
                </div>
              </div>
              {nodes.length > 0 && (
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Workflow Stats</h3>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Nodes:</span>
                      <span className="text-white font-semibold">{nodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Connections:</span>
                      <span className="text-white font-semibold">{edges.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issues:</span>
                      <span className={issues.length > 0 ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>{issues.length}</span>
                    </div>
                  </div>
                </div>
              )}
              {showSettings && (
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Canvas Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Background Style</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setCanvasBackground('dots')} className={`px-2 py-1.5 rounded text-xs ${canvasBackground === 'dots' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Dots</button>
                        <button onClick={() => setCanvasBackground('grid')} className={`px-2 py-1.5 rounded text-xs ${canvasBackground === 'grid' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Grid</button>
                        <button onClick={() => setCanvasBackground('plain')} className={`px-2 py-1.5 rounded text-xs ${canvasBackground === 'plain' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Plain</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Zoom: {Math.round(zoom * 100)}%</label>
                      <div className="flex gap-2">
                        <button onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} className="flex-1 px-2 py-1.5 rounded text-xs bg-gray-800 text-gray-300 hover:bg-gray-700"><ZoomOut className="w-3 h-3 mx-auto" /></button>
                        <button onClick={() => setZoom(1)} className="flex-1 px-2 py-1.5 rounded text-xs bg-gray-800 text-gray-300 hover:bg-gray-700">100%</button>
                        <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="flex-1 px-2 py-1.5 rounded text-xs bg-gray-800 text-gray-300 hover:bg-gray-700"><ZoomIn className="w-3 h-3 mx-auto" /></button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 flex items-center justify-between">
                        <span>Snap to Grid</span>
                        <button onClick={() => setSnapToGrid(!snapToGrid)} className={`w-10 h-5 rounded-full transition-colors ${snapToGrid ? 'bg-indigo-600' : 'bg-gray-700'} relative`}>
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${snapToGrid ? 'transform translate-x-5' : ''}`}></div>
                        </button>
                      </label>
                    </div>
                    <div className="pt-2 border-t border-gray-700 mt-2">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">Ctrl</kbd>
                          <span>+ Scroll to zoom</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">Shift</kbd>
                          <span>+ Drag to pan</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
          <div
          ref={canvasRef}
          className={`relative flex-1 overflow-hidden ${canvasBackground === 'plain' ? 'bg-gray-950' : 'bg-gray-900'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onWheel={handleWheel}
          style={{
            backgroundImage: canvasBackground === 'dots' 
              ? 'radial-gradient(circle, #374151 1.5px, transparent 1.5px)' 
              : canvasBackground === 'grid'
              ? 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)'
              : 'none',
            backgroundSize: canvasBackground === 'dots' ? '24px 24px' : canvasBackground === 'grid' ? '24px 24px' : 'auto',
            backgroundPosition: canvasBackground === 'plain' ? '0 0' : `${pan.x}px ${pan.y}px`
          }}
        >
          <>
              <div className="relative p-8" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: 10000, height: 10000 }}>
                {edges.length > 0 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.3))' }}>
                    {edges.map((e, i) => {
                      const s = nodePositions[e.from] || { x: i * 10 + 100, y: i * 10 + 100 };
                      const t = nodePositions[e.to] || { x: i * 10 + 420, y: i * 10 + 160 };
                      const x1 = (s.x || 0) + 150;
                      const y1 = (s.y || 0) + 50;
                      const x2 = (t.x || 0) + 150;
                      const y2 = (t.y || 0) + 50;
                      return (
                        <g key={i}>
                          <defs>
                            <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                              <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                            </linearGradient>
                            <marker id={`arrow-${i}`} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                              <path d="M0,0 L0,6 L9,3 z" fill="url(#grad-${i})" />
                            </marker>
                          </defs>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#grad-${i})" strokeWidth="3" markerEnd={`url(#arrow-${i})`} strokeLinecap="round" />
                        </g>
                      );
                    })}
                  </svg>
                )}
                {nodes.map((node, index) => {
                  const getNodeColor = (type: string) => {
                    switch(type) {
                      case 'phase': return 'from-purple-500 to-purple-600';
                      case 'tool': return 'from-blue-500 to-blue-600';
                      case 'condition': return 'from-yellow-500 to-yellow-600';
                      case 'guardrail': return 'from-red-500 to-red-600';
                      case 'loop': return 'from-green-500 to-green-600';
                      case 'agent': return 'from-cyan-500 to-cyan-600';
                      case 'mcp': return 'from-orange-500 to-orange-600';
                      case 'transform': return 'from-pink-500 to-pink-600';
                      case 'user-approval': return 'from-teal-500 to-teal-600';
                      case 'set-state': return 'from-amber-500 to-amber-600';
                      case 'note': return 'from-slate-500 to-slate-600';
                      case 'if-else': return 'from-yellow-500 to-yellow-600';
                      case 'while': return 'from-green-500 to-green-600';
                      case 'start': return 'from-emerald-500 to-emerald-600';
                      case 'end': return 'from-rose-500 to-rose-600';
                      default: return 'from-gray-500 to-gray-600';
                    }
                  };
                  const getNodeIcon = (type: string) => {
                    switch(type) {
                      case 'phase': return 'P';
                      case 'tool': return 'T';
                      case 'condition': return 'C';
                      case 'guardrail': return 'G';
                      case 'loop': return 'L';
                      case 'agent': return 'A';
                      case 'mcp': return 'M';
                      case 'transform': return 'T';
                      case 'user-approval': return 'U';
                      case 'set-state': return 'S';
                      case 'note': return 'N';
                      case 'if-else': return '?';
                      case 'while': return 'W';
                      case 'start': return '▶';
                      case 'end': return '■';
                      default: return '?';
                    }
                  };
                  return (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={(e) => handleNodeDragStart(e, node.id)}
                    onDragEnd={() => setNodeDraggedId(null)}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`absolute w-80 cursor-move transition-all ${selectedNodeId === node.id ? 'ring-4 ring-indigo-400 shadow-2xl scale-105' : 'hover:shadow-xl'}`}
                    style={{
                      left: nodePositions[node.id]?.x || index * 320 + 20,
                      top: nodePositions[node.id]?.y || Math.floor(index / 3) * 260 + 20,
                    }}
                  >
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl rounded-xl border border-gray-700 overflow-hidden">
                      <div className={`flex items-center justify-between p-3 bg-gradient-to-r ${getNodeColor(node.type)}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center backdrop-blur">
                            <span className="text-xs font-bold text-white">{getNodeIcon(node.type)}</span>
                          </div>
                          <Move className="w-4 h-4 text-white/80" />
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold">{node.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); openEditor(node.id); }} className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"><Settings className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDuplicateNode(node.id); }} className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"><Copy className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); beginConnect(node.id); }} className={`p-1.5 rounded transition-colors ${connectMode ? 'bg-white text-indigo-600' : 'hover:bg-white/20 text-white'}`}><Link2 className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }} className="p-1.5 rounded hover:bg-red-500 text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-800">
                        {node.type === 'phase' ? (
                          <div className="space-y-2">
                            <div className="text-base font-bold text-white">{node.title}</div>
                            {node.subtitle && <div className="text-sm text-gray-400">{node.subtitle}</div>}
                            {node.items && node.items.length > 0 && (
                              <div className="mt-3 space-y-1">
                                {node.items.slice(0, 3).map((item: any, idx: number) => (
                                  <div key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                    {item.title || item}
                                  </div>
                                ))}
                                {node.items.length > 3 && (
                                  <div className="text-xs text-gray-500 italic">+{node.items.length - 3} more</div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-base font-bold text-white">{node.title}</div>
                            {node.subtitle && <div className="text-sm text-gray-400">{node.subtitle}</div>}
                            {node.data && Object.keys(node.data).length > 0 && (
                              <div className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-300 font-mono">
                                {JSON.stringify(node.data, null, 2).slice(0, 100)}{JSON.stringify(node.data).length > 100 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
              {edges.length > 0 && (
                <div className="absolute bottom-4 right-4 bg-white border rounded-md shadow p-2 max-w-md">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Edges</div>
                  <div className="flex flex-wrap gap-2">
                    {edges.map((e, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 rounded">
                        <span>{e.from} → {e.to}</span>
                        <button onClick={() => removeEdge(i)} className="ml-1 text-red-600">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {issues.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-white border rounded-md shadow p-2 max-w-md">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Issues</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {issues.map((it, idx) => (
                      <div key={idx} className="text-xs text-gray-700">{JSON.stringify(it)}</div>
                    ))}
                  </div>
                </div>
              )}
              <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur border border-gray-700 rounded-lg shadow-lg px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-400">Zoom:</div>
                  <div className="text-sm font-semibold text-white">{Math.round(zoom * 100)}%</div>
                  <div className="h-4 w-px bg-gray-700"></div>
                  <div className="text-xs text-gray-400">Background:</div>
                  <div className="text-sm font-semibold text-white capitalize">{canvasBackground}</div>
                </div>
              </div>
            </>
          </div>
        </div>

        <div className={`fixed inset-0 z-50 ${showEditor ? '' : 'hidden'}`}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditor(false)}></div>
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="font-semibold">Edit Node</div>
                <button onClick={() => setShowEditor(false)} className="text-gray-600">✕</button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Title</div>
                  <input value={editorState.title} onChange={e => setEditorState((s: any) => ({ ...s, title: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Subtitle</div>
                  <input value={editorState.subtitle} onChange={e => setEditorState((s: any) => ({ ...s, subtitle: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Type</div>
                  <select value={editorState.type} onChange={e => setEditorState((s: any) => ({ ...s, type: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="phase">phase</option>
                    <option value="tool">tool</option>
                    <option value="condition">condition</option>
                    <option value="guardrail">guardrail</option>
                    <option value="loop">loop</option>
                    <option value="agent">agent</option>
                    <option value="mcp">mcp</option>
                    <option value="transform">transform</option>
                    <option value="user-approval">user-approval</option>
                    <option value="set-state">set-state</option>
                    <option value="note">note</option>
                    <option value="if-else">if-else</option>
                    <option value="while">while</option>
                    <option value="start">start</option>
                    <option value="end">end</option>
                  </select>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Data (JSON)</div>
                  <textarea value={JSON.stringify(editorState.data || {})} onChange={e => { try { const v = JSON.parse(e.target.value || '{}'); setEditorState((s: any) => ({ ...s, data: v })); } catch {} }} className="w-full border rounded px-3 py-2 text-sm h-28" />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Items (JSON)</div>
                  <textarea value={JSON.stringify(editorState.items || [])} onChange={e => { try { const v = JSON.parse(e.target.value || '[]'); setEditorState((s: any) => ({ ...s, items: v })); } catch {} }} className="w-full border rounded px-3 py-2 text-sm h-28" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowEditor(false)} className="px-4 py-2 rounded bg-gray-100 text-gray-800">Cancel</button>
                  <button onClick={saveEditor} className="px-4 py-2 rounded bg-indigo-600 text-white">Save</button>
                </div>
              </div>
            </div>
          </div>
        
          <TemplateSelector
            isOpen={showTemplateSelector}
            onClose={() => setShowTemplateSelector(false)}
            onSelectTemplate={loadTemplate}
          />
          
          {currentExecution && (
            <ExecutionViewer
              executionId={currentExecution.id}
              workflowName={currentExecution.name}
              onClose={() => setCurrentExecution(null)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Workflow Progress</h2>
        <div className="flex items-center gap-2">
          <button
              onClick={handlePublish}
              disabled={publishing}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${publishing ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {publishedWorkflowId ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {publishedWorkflowId ? `Published ${publishedWorkflowId.slice(0,8)}...` : 'Publish'}
            </button>
          <button
            onClick={onToggleCanvas}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
            Canvas Mode
          </button>
        </div>
      </div>
      
      {phases.map((phase, index) => (
        <PhaseCard key={index} phase={phase} />
      ))}
    </div>
  );
};
