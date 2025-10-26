import React, { useState, useRef, useEffect } from 'react';
import { PhaseCard } from './PhaseCard';
import { Maximize2, Minimize2, Move, Upload, Check, Plus, Settings, Trash2, Link2, Download, UploadCloud, RotateCcw, Copy, ZoomIn, ZoomOut, Grid, ShieldCheck, Play } from 'lucide-react';

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
  const [positions, setPositions] = useState<{ [key: number]: { x: number; y: number } }>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  const API_BASE_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
  const ENABLE_VISUAL = true;
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
      return;
    }
    if (draggedItem === null) return;
    setPositions(prev => ({
      ...prev,
      [draggedItem]: { x, y }
    }));
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
    const grid: any = {};
    nodes.forEach((n, i) => { const col = i % 4; const row = Math.floor(i / 4); grid[n.id] = { x: 40 + col * 320, y: 40 + row * 260 }; });
    setNodePositions(grid);
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
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <h2 className="text-xl font-semibold">Workflow Canvas</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
                <button onClick={() => handleAddNode('phase')} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2"><Plus className="w-4 h-4" />Add Phase</button>
                <button onClick={() => handleAddNode('tool')} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2"><Plus className="w-4 h-4" />Add Tool</button>
                <button onClick={() => handleAddNode('condition')} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2"><Plus className="w-4 h-4" />Add Condition</button>
                <button onClick={() => handleAddNode('guardrail')} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2"><Plus className="w-4 h-4" />Add Guardrail</button>
                <button onClick={() => handleAddNode('loop')} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2"><Plus className="w-4 h-4" />Add Loop</button>
                <button onClick={() => setConnectMode(v => !v)} className={`px-3 py-2 rounded-md flex items-center gap-2 ${connectMode ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}><Link2 className="w-4 h-4" />{connectMode ? 'Connecting' : 'Connect'}</button>
                <button onClick={resetLayout} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2"><RotateCcw className="w-4 h-4" />Reset</button>
                <button onClick={exportDSL} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2"><Download className="w-4 h-4" />Export</button>
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2"><UploadCloud className="w-4 h-4" />Import</button>
                <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={onFileChange} />
              </div>
            <div className="flex items-center gap-2">
                <input value={workflowName} onChange={e => setWorkflowName(e.target.value)} placeholder="Workflow name" className="px-3 py-2 rounded-md border text-sm" />
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="px-2 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="px-2 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={() => setSnapToGrid(s => !s)} className={`px-3 py-2 rounded-md flex items-center gap-2 ${snapToGrid ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}><Grid className="w-4 h-4" />{snapToGrid ? 'Snap' : 'Free'}</button>
                <button onClick={copyDSL} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800">Copy DSL</button>
                <button onClick={validateGraph} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Validate</button>
              </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                Run
              </button>
            </div>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${publishing ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {publishedWorkflowId ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {publishedWorkflowId ? `Published ${publishedWorkflowId.slice(0,8)}...` : 'Publish'}
              </button>
            <button
              onClick={onToggleCanvas}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
              Exit Canvas
            </button>
          </div>
        </div>
        
        <div
          ref={canvasRef}
          className="relative w-full h-full overflow-auto p-8"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          <>
              <div className="relative" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: 3000, height: 2000 }}>
                {edges.length > 0 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {edges.map((e, i) => {
                      const s = nodePositions[e.from] || { x: i * 10 + 100, y: i * 10 + 100 };
                      const t = nodePositions[e.to] || { x: i * 10 + 420, y: i * 10 + 160 };
                      const x1 = (s.x || 0) + 150;
                      const y1 = (s.y || 0) + 50;
                      const x2 = (t.x || 0) + 150;
                      const y2 = (t.y || 0) + 50;
                      const cx = (x1 + x2) / 2;
                      return (
                        <g key={i}>
                          <path d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`} stroke="#6366f1" strokeWidth="2" fill="none" />
                        </g>
                      );
                    })}
                  </svg>
                )}
                {nodes.map((node, index) => (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={(e) => handleNodeDragStart(e, node.id)}
                    onDragEnd={() => setNodeDraggedId(null)}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`absolute max-w-md ${selectedNodeId === node.id ? 'ring-2 ring-indigo-500 rounded-lg' : ''}`}
                    style={{
                      left: nodePositions[node.id]?.x || index * 320 + 20,
                      top: nodePositions[node.id]?.y || Math.floor(index / 3) * 260 + 20,
                    }}
                  >
                    <div className="bg-white shadow-lg rounded-lg">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-t-md">
                        <div className="flex items-center gap-2">
                          <Move className="w-4 h-4 text-gray-400" />
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">{node.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditor(node.id)} className="p-1 rounded hover:bg-gray-200 text-gray-700"><Settings className="w-4 h-4" /></button>
                          <button onClick={() => handleDuplicateNode(node.id)} className="p-1 rounded hover:bg-gray-200 text-gray-700"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => beginConnect(node.id)} className={`p-1 rounded ${connectMode ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200 text-gray-700'}`}><Link2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteNode(node.id)} className="p-1 rounded hover:bg-red-100 text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="p-2">
                        {node.type === 'phase' ? (
                          <PhaseCard phase={{ title: node.title, subtitle: node.subtitle, items: node.items }} />
                        ) : (
                          <div className="p-3">
                            <div className="text-sm font-semibold text-gray-800">{node.title}</div>
                            <div className="text-xs text-gray-500">{node.subtitle}</div>
                            <div className="mt-2 text-xs text-gray-600">{JSON.stringify(node.data)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
            </>
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
