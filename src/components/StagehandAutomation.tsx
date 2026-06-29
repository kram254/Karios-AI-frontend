import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, Chip, LinearProgress, IconButton, Tooltip, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
import { PlayArrow, Stop, Refresh, Monitor, Code, FlashOn, Visibility, MyLocation, CloudQueue, ExpandMore, AccountTree, History, Bolt, Diamond, SmartToy, Add, Send, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { WorkflowAutomationBridge } from './WorkflowAutomationBridge';

export const StagehandAutomation: React.FC = () => {
  const PINS_STORAGE_KEY = 'automation_studio_pins_v1';
  const [instruction, setInstruction] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [screenshot, setScreenshot] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [browserStatus, setBrowserStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [actionMode, setActionMode] = useState<'act' | 'extract' | 'observe' | 'agent'>('act');
  const wsRef = useRef<WebSocket | null>(null);
  const [screenshotHistory, setScreenshotHistory] = useState<Array<{url: string, screenshot: string, timestamp: string}>>([]);
  const [retryInfo, setRetryInfo] = useState<{attempt: number, maxRetries: number} | null>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentGoal, setAgentGoal] = useState('');
  const screenshotContainerRef = useRef<HTMLDivElement>(null);
  const [useSandbox, setUseSandbox] = useState(false);
  const [sandboxActive, setSandboxActive] = useState(false);
  const [lastPreviewActionJson, setLastPreviewActionJson] = useState<string>('');
  const [lastSomImage, setLastSomImage] = useState<string>('');
  const [workflowNodes, setWorkflowNodes] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string>('');
  const [replaySessionId, setReplaySessionId] = useState<string>('');
  const [replayData, setReplayData] = useState<any>(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayError, setReplayError] = useState<string>('');
  const [selectedReplayIndex, setSelectedReplayIndex] = useState<number>(-1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<any>(null);
  const [pinnedResults, setPinnedResults] = useState<any[]>([]);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [rerunRunning, setRerunRunning] = useState(false);
  const [lastActionData, setLastActionData] = useState<any>(null);
  const [lastActionInfo, setLastActionInfo] = useState<any>(null);
  const [riskBypassIndex, setRiskBypassIndex] = useState<number>(-1);
  const [selectedPlaybookMode, setSelectedPlaybookMode] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const recentChatItems = logs.slice(-12).reverse();
  const recentScreens = screenshotHistory.slice(-4).reverse();
  const browserPathLabel = useSandbox ? 'Sandbox / E2B' : 'Visible Chrome / Gstack';
  const browserHealthLabel = browserStatus === 'connected' ? 'Ready' : browserStatus === 'connecting' ? 'Launching' : 'Idle';
  const sessionRows = sessions.slice(0, 6);
  const activeSessionRecord = sessions.find((item: any) => String((item as any)?.sessionId || '') === sessionId);
  const modeLabel = actionMode.charAt(0).toUpperCase() + actionMode.slice(1);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PINS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setPinnedResults(parsed);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(pinnedResults.slice(-50)));
    } catch (e) {}
  }, [pinnedResults]);

  const normalizeScreenshot = (raw: any, mime?: string) => {
    const s = typeof raw === 'string' ? raw : '';
    if (!s) return '';
    if (s.startsWith('data:')) return s;
    const m = typeof mime === 'string' && mime ? mime : 'image/png';
    return `data:${m};base64,${s}`;
  };

  const getReplayScreenshotForIndex = (idx: number) => {
    try {
      const actions = Array.isArray(replayData?.actions) ? replayData.actions : [];
      const screenshots = Array.isArray(replayData?.screenshots) ? replayData.screenshots : [];
      if (idx < 0 || idx >= actions.length || screenshots.length === 0) return '';
      const at = String((actions[idx] as any)?.timestamp || '');
      let best: any = null;
      for (let i = 0; i < screenshots.length; i++) {
        const sc = screenshots[i];
        const ts = String((sc as any)?.timestamp || '');
        if (!ts) continue;
        if (!at || ts <= at) {
          best = sc;
        }
      }
      if (!best) {
        best = screenshots[screenshots.length - 1];
      }
      if (best && typeof best === 'object') {
        return normalizeScreenshot((best as any).screenshot, (best as any).mime);
      }
      return normalizeScreenshot(best, 'image/png');
    } catch (e) {
      return '';
    }
  };

  const isHighRiskInstruction = (text: string) => {
    const t = String(text || '').toLowerCase();
    if (!t.trim()) return false;
    return (
      t.includes('purchase') ||
      t.includes('buy') ||
      t.includes('checkout') ||
      t.includes('place order') ||
      t.includes('send email') ||
      t.includes('email ') ||
      t.includes('delete') ||
      t.includes('remove') ||
      t.includes('unsubscribe')
    );
  };

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      setSessionsError('');
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const resp = await fetch(`${BACKEND_URL}/api/web-automation/sessions`);
      const data = await resp.json().catch(() => ({}));
      const list = (data as any)?.active_sessions;
      if (Array.isArray(list)) {
        setSessions(list);
      } else {
        setSessions([]);
      }
    } catch (e: any) {
      setSessionsError(e?.message || String(e));
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (!inspectorOpen) return;
    fetchSessions();
  }, [inspectorOpen]);

  const pinReplayItem = (entry: any, idx: number) => {
    try {
      setPinnedResults(prev => {
        const sid = replaySessionId;
        const next = [...prev.filter(p => !(p?.sessionId === sid && p?.index === idx)), { sessionId: sid, index: idx, entry, pinnedAt: new Date().toISOString() }];
        return next.slice(-50);
      });
    } catch (e) {}
  };

  const loadEntryIntoPrompt = (entry: any) => {
    try {
      const a = (entry as any)?.action || {};
      const rawType = String((a as any)?.type || (a as any)?.action_type || (a as any)?.actionType || '').toLowerCase();
      const nextMode = (rawType === 'extract' || rawType === 'observe' || rawType === 'agent' || rawType === 'act') ? rawType : 'act';
      const nextInstruction = String((a as any)?.instruction || '').trim();
      if (!nextInstruction) return;
      setActionMode(nextMode as any);
      setInstruction(nextInstruction);
      addLog('📌 Loaded pinned step into prompt');
    } catch (e) {}
  };

  const rerunFromSelected = async () => {
    const actions = Array.isArray(replayData?.actions) ? replayData.actions : [];
    if (selectedReplayIndex < 0 || selectedReplayIndex >= actions.length) return;
    await rerunFromIndex(selectedReplayIndex);
  };

  const fetchReplay = async (sid: string) => {
    if (!sid) return;
    try {
      setReplayLoading(true);
      setReplayError('');
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const resp = await fetch(`${BACKEND_URL}/api/web-automation/replay/${sid}`);
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = (data as any)?.detail || (data as any)?.message || `HTTP ${resp.status}`;
        throw new Error(msg);
      }
      setReplayData(data);
      setSelectedReplayIndex(-1);
    } catch (e: any) {
      setReplayData(null);
      setReplayError(e?.message || String(e));
      setSelectedReplayIndex(-1);
    } finally {
      setReplayLoading(false);
    }
  };

  useEffect(() => {
    const sid = `stagehand_${Date.now()}`;
    setSessionId(sid);
    const loadWorkflowDraft = () => {
      try {
        const tryParseNodes = (raw: string | null) => {
          if (!raw) return null;
          try {
            const parsed = JSON.parse(raw);
            const wf = (parsed as any)?.workflow || (parsed as any)?.data?.workflow;
            const nodes = (wf as any)?.nodes;
            return Array.isArray(nodes) ? nodes : null;
          } catch {
            return null;
          }
        };

        const direct = tryParseNodes(localStorage.getItem('workflow_builder_draft_v1'));
        if (direct) {
          setWorkflowNodes(direct);
          return;
        }
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (k.startsWith('workflow_builder_draft_v1_') && k.endsWith('_current')) {
            const cand = tryParseNodes(localStorage.getItem(k));
            if (cand) {
              setWorkflowNodes(cand);
              return;
            }
          }
        }
        setWorkflowNodes([]);
      } catch {
        setWorkflowNodes([]);
      }
    };

    loadWorkflowDraft();
    const onWorkflowSaved = () => loadWorkflowDraft();
    try {
      window.addEventListener('builder:workflow-saved', onWorkflowSaved as any);
    } catch {}
    return () => {
      try {
        window.removeEventListener('builder:workflow-saved', onWorkflowSaved as any);
      } catch {}
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  const initializeBrowser = async () => {
    const sid = sessionId || `stagehand_${Date.now()}`;
    if (!sessionId) {
      setSessionId(sid);
    }
    setBrowserStatus('connecting');
    if (useSandbox) {
      addLog('🚀 Initializing E2B sandbox environment...');
    } else {
      addLog('Initializing visible Chrome browser...');
    }

    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/web-automation/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          browser_type: 'chromium',
          visible: !useSandbox,
          use_sandbox: useSandbox
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setBrowserStatus('connected');
        setSandboxActive(data.sandbox || false);
        
        if (data.sandbox) {
          addLog('✅ E2B sandbox initialized successfully');
          addLog('📦 Running in secure isolated environment');
        } else {
          addLog('✅ Visible Chrome browser initialized successfully');
          if (data.stagehand_available) {
            addLog('✅ Stagehand mode active');
          }
        }
        connectWebSocket(sid);
      } else {
        setBrowserStatus('disconnected');
        const errorMsg = data.message || 'Unknown initialization error';
        addLog(`❌ Browser initialization failed: ${errorMsg}`);
      }
    } catch (error: any) {
      setBrowserStatus('disconnected');
      const errorMsg = error.message || String(error);
      addLog(`❌ Connection error: ${errorMsg}`);
      console.error('Browser initialization error:', error);
    }
  };

  const connectWebSocket = (sid?: string) => {
    const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
    const idToUse = sid || sessionId;
    if (!idToUse) {
      addLog('WebSocket connection failed: missing session id');
      return;
    }
    const wsUrl = `${BACKEND_URL.replace('http', 'ws')}/api/web-automation/ws/automation/${idToUse}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        addLog('WebSocket connected');
        try {
          wsRef.current?.send(JSON.stringify({ type: 'get_status' }));
          wsRef.current?.send(JSON.stringify({ type: 'start_stream', intervalMs: 750 }));
        } catch (e) {}
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'screenshot_taken' || data.type === 'screenshot' || data.type === 'screenshot_update') {
            const screenshotData = data.payload?.screenshot || data.screenshot;
            const mime = data.payload?.mime || data.mime;
            const nextShot = typeof screenshotData === 'string' && screenshotData
              ? (screenshotData.startsWith('data:') ? screenshotData : (mime ? `data:${mime};base64,${screenshotData}` : screenshotData))
              : '';
            setScreenshot(nextShot);
            if (data.url) {
              setCurrentUrl(data.url);
            }
            if (data.timestamp) {
              setScreenshotHistory(prev => [...prev, {
                url: data.url || currentUrl,
                screenshot: nextShot || screenshotData,
                timestamp: data.timestamp
              }].slice(-10));
            }
          } else if (data.type === 'navigation_completed') {
            setCurrentUrl(data.payload?.url || '');
            addLog(`📍 Navigated to: ${data.payload?.url}`);
          } else if (data.type === 'action_started') {
            if (data.instruction) {
              addLog(`⏳ ${data.instruction}`);
            }
          } else if (data.type === 'action_completed') {
            addLog(`✅ ${data.message || 'Action completed'}`);
            setRetryInfo(null);
          } else if (data.type === 'action_retry') {
            setRetryInfo({
              attempt: data.attempt,
              maxRetries: data.maxRetries
            });
            addLog(`🔄 Retry ${data.attempt}/${data.maxRetries}${data.error ? ': ' + data.error : ''}`);
          } else if (data.type === 'agent_completed') {
            setAgentRunning(false);
            addLog(`🤖 Agent completed: ${JSON.stringify(data.result).substring(0, 100)}`);
            if (data.screenshot) {
              setScreenshot(data.screenshot);
            }
          } else if (data.type === 'agent_error') {
            setAgentRunning(false);
            addLog(`❌ Agent error: ${data.error}`);
          } else if (data.type === 'status_update') {
            const st = String(data.status || '').toLowerCase();
            if (st && st !== 'inactive') {
              setBrowserStatus('connected');
            }
            if (data.url) {
              setCurrentUrl(data.url);
            }
          } else if (data.type === 'browser_initialized') {
            if (data.success) {
              setBrowserStatus('connected');
              setSandboxActive(Boolean(data.sandbox));
            }
          } else if (data.type === 'browser_cleaned') {
            setBrowserStatus('disconnected');
            setSandboxActive(false);
            setScreenshot('');
            setCurrentUrl('');
          } else if (data.type === 'log') {
            addLog(data.message);
          }
        } catch (e) {
          console.error('WebSocket message error:', e);
        }
      };

      wsRef.current.onerror = (error) => {
        addLog('WebSocket error occurred');
      };

      wsRef.current.onclose = () => {
        addLog('WebSocket connection closed');
      };
    } catch (error) {
      addLog(`WebSocket connection failed: ${error}`);
    }
  };

  const executeStagehandAction = async () => {
    if (!instruction.trim()) {
      addLog('⚠️ Please enter an instruction');
      return;
    }

    if (isHighRiskInstruction(instruction)) {
      setConfirmPayload({ kind: 'single', instruction, mode: actionMode });
      setConfirmOpen(true);
      return;
    }

    await performStagehandAction({ instruction, mode: actionMode });
  };

  const performStagehandAction = async ({ instruction, mode }: { instruction: string; mode: string }) => {
    if (!String(instruction || '').trim()) {
      addLog('⚠️ Please enter an instruction');
      return;
    }

    setIsRunning(true);
    addLog(`⚡ Executing ${mode}: ${instruction}`);
    setLastActionInfo({ mode, instruction, timestamp: new Date().toISOString() });

    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/web-automation/execute-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          action_type: mode,
          instruction: instruction,
          mode: 'stagehand'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setLastActionData(data);
      
      if (data.success) {
        addLog(`✅ Action completed successfully`);
        try {
          const payload = data.data;
          const previewArr = payload?.preview_actions_json;
          if (Array.isArray(previewArr) && previewArr.length > 0 && typeof previewArr[0] === 'string') {
            setLastPreviewActionJson(previewArr[0]);
            addLog('🧩 Preview action ready');
          }
          const somImg = payload?.observation?.som?.img;
          if (typeof somImg === 'string' && somImg) {
            setLastSomImage(somImg);
            addLog('🧿 SoM view available');
          }
        } catch (e) {}
        if (data.screenshot) {
          setScreenshot(normalizeScreenshot(data.screenshot, 'image/png'));
        }
        if (data.url) {
          setCurrentUrl(data.url);
        }
        if (data.data) {
          addLog(`📊 Result: ${JSON.stringify(data.data).substring(0, 200)}`);
        }
      } else {
        const errorMsg = data.message || 'Unknown action error';
        addLog(`❌ Action failed: ${errorMsg}`);
      }
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      addLog(`❌ Execution error: ${errorMsg}`);
      console.error('Action execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const rerunFromIndex = async (startIndex: number) => {
    const actions = Array.isArray(replayData?.actions) ? replayData.actions : [];
    if (startIndex < 0 || startIndex >= actions.length) return;
    if (browserStatus !== 'connected') {
      addLog('⚠️ Start the browser before re-running steps');
      return;
    }
    try {
      setRerunRunning(true);
      for (let i = startIndex; i < actions.length; i++) {
        const it = actions[i];
        const a = (it as any)?.action || {};
        const rawType = String((a as any)?.type || (a as any)?.action_type || (a as any)?.actionType || '').toLowerCase();
        const nextMode = (rawType === 'extract' || rawType === 'observe' || rawType === 'agent' || rawType === 'act') ? rawType : 'act';
        const nextInstruction = String((a as any)?.instruction || '').trim();
        if (!nextInstruction) {
          addLog(`⚠️ Replay step ${i + 1} skipped (missing instruction)`);
          continue;
        }
        if (isHighRiskInstruction(nextInstruction) && i !== riskBypassIndex) {
          setSelectedReplayIndex(i);
          setConfirmPayload({ kind: 'rerun', startIndex: i });
          setConfirmOpen(true);
          return;
        }
        setActionMode(nextMode as any);
        setInstruction(nextInstruction);
        await performStagehandAction({ instruction: nextInstruction, mode: nextMode });
        if (riskBypassIndex === i) {
          setRiskBypassIndex(-1);
        }
      }
      addLog('✅ Replay run completed');
    } catch (e: any) {
      addLog(`❌ Replay run error: ${e?.message || String(e)}`);
    } finally {
      setRerunRunning(false);
    }
  };

  const stopBrowser = async () => {
    try {
      addLog('Stopping browser session...');
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/web-automation/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId })
      });
      
      const data = await response.json().catch(() => ({ success: true }));
      
      setBrowserStatus('disconnected');
      setScreenshot('');
      setCurrentUrl('');
      
      if (wsRef.current) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'stop_stream' }));
        } catch (e) {}
        wsRef.current.close();
        wsRef.current = null;
      }
      
      if (data.success) {
        addLog('✅ Browser session closed successfully');
      } else {
        addLog(`⚠️ Browser closed with warnings: ${data.message || 'Unknown'}`);
      }
    } catch (error: any) {
      setBrowserStatus('disconnected');
      const errorMsg = error.message || String(error);
      addLog(`❌ Cleanup error: ${errorMsg}`);
      console.error('Cleanup error:', error);
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const executeAutonomousAgent = async () => {
    if (!agentGoal.trim()) {
      addLog('⚠️ Please enter a goal for the autonomous agent');
      return;
    }

    setAgentRunning(true);
    addLog(`🤖 Starting autonomous agent with goal: ${agentGoal}`);

    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/web-automation/autonomous-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          goal: agentGoal,
          maxSteps: 10
        })
      });

      const data = await response.json();
      
      if (data.success) {
        addLog(`✅ Agent started successfully`);
      } else {
        setAgentRunning(false);
        addLog(`❌ Agent failed to start: ${data.message}`);
      }
    } catch (error: any) {
      setAgentRunning(false);
      const errorMsg = error.message || String(error);
      addLog(`❌ Agent error: ${errorMsg}`);
      console.error('Agent execution error:', error);
    }
  };

  const handleScreenshotClick = async (event: React.MouseEvent<HTMLImageElement>) => {
    if (sandboxActive) {
      addLog('⚠️ Element selection is available in Local Mode');
      return;
    }
    if (!screenshotContainerRef.current) return;
    
    const rect = screenshotContainerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/web-automation/select-element`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          x: x,
          y: y
        })
      });

      const data = await response.json();
      
      if (data.success && data.selectors) {
        setSelectedElement(data.selectors);
        addLog(`🎯 Element selected: ${data.selectors.tag} "${data.selectors.text}"`);
        addLog(`   CSS: ${data.selectors.css}`);
        setInstruction(`click on element with selector: ${data.selectors.css}`);
      }
    } catch (error: any) {
      addLog(`❌ Element selection error: ${error.message}`);
    }
  };

  const quickActions = [
    { label: 'Start Research', instruction: 'research the current page and summarize the most important findings', mode: 'observe' as const },
    { label: 'Navigate', instruction: 'go to https://example.com', mode: 'act' as const },
    { label: 'Compare Options', instruction: 'compare the visible options and explain the best choice', mode: 'observe' as const },
    { label: 'Fill Form', instruction: 'fill the form fields with the requested information', mode: 'act' as const },
    { label: 'Extract Data', instruction: 'extract all product names, prices, and links', mode: 'extract' as const },
    { label: 'Inspect Page', instruction: 'identify the page structure and what elements are available to interact with', mode: 'observe' as const }
  ];

  const playbookModes = [
    { key: 'act', label: 'Act', icon: <FlashOn sx={{ fontSize: 18, color: '#00F3FF' }} /> },
    { key: 'extract', label: 'Extract', icon: <Code sx={{ fontSize: 18, color: '#10b981' }} /> },
    { key: 'observe', label: 'Observe', icon: <Visibility sx={{ fontSize: 18, color: '#8b5cf6' }} /> }
  ];

  useEffect(() => {
    if (sandboxActive && actionMode === 'agent') {
      setActionMode('act');
    }
  }, [sandboxActive, actionMode]);

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: '#0A0A0A', 
      p: { xs: 2, sm: 3, md: 4 }, 
      gap: 2.5,
      maxWidth: '1600px',
      mx: 'auto',
      width: '100%',
      background: 'transparent',
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: 2,
        pb: 2,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            background: 'rgba(0, 243, 255, 0.1)',
            borderRadius: '12px',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0, 243, 255, 0.2)'
          }}>
            <FlashOn sx={{ fontSize: 24, color: '#00F3FF' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ 
              color: 'white', 
              fontWeight: 700,
              letterSpacing: '-0.01em',
              fontSize: '1.1rem'
            }}>
              Stagehand Browser
            </Typography>
            <Typography variant="caption" sx={{ color: '#888', fontSize: '0.75rem' }}>
              Command Center • {sessionId ? sessionId.slice(-8) : '—'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip 
            label={browserStatus === 'connected' ? 'Connected' : browserStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            color={browserStatus === 'connected' ? 'success' : browserStatus === 'connecting' ? 'warning' : 'default'}
            size="small"
            sx={{ 
              bgcolor: browserStatus === 'connected' ? 'rgba(16, 185, 129, 0.12)' : browserStatus === 'connecting' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(42, 42, 42, 0.8)',
              backdropFilter: 'none',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: browserStatus === 'connected' ? '#10b981' : browserStatus === 'connecting' ? '#f59e0b' : '#A3A3A3',
              fontWeight: 600,
              animation: 'none',
              transition: 'all 0.3s ease'
            }}
          />

          {sandboxActive && (
            <Chip 
              label="🔒 E2B Sandbox"
              size="small"
              sx={{ 
                bgcolor: 'rgba(0, 243, 255, 0.12)',
                backdropFilter: 'none',
                border: '1px solid rgba(0, 243, 255, 0.2)',
                color: '#00F3FF',
                fontWeight: 600
              }}
            />
          )}

          {browserStatus === 'disconnected' && (
            <Chip 
              label={useSandbox ? "Sandbox Mode" : "Visible Chrome"}
              size="small"
              onClick={() => setUseSandbox(!useSandbox)}
              sx={{ 
                bgcolor: useSandbox ? 'rgba(255, 0, 184, 0.12)' : 'rgba(0, 243, 255, 0.12)',
                backdropFilter: 'none',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: useSandbox ? '#FF00B8' : '#00F3FF',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'none',
                  boxShadow: 'none'
                }
              }}
            />
          )}
          
          {browserStatus === 'disconnected' ? (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={initializeBrowser}
              sx={{ 
                background: '#00F3FF',
                color: '#000000',
                fontWeight: 700,
                borderRadius: '10px',
                boxShadow: 'none',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  background: '#00D1DD',
                  transform: 'none',
                  boxShadow: 'none'
                }
              }}
            >
              Start Browser
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Stop />}
              onClick={stopBrowser}
              sx={{ 
                borderColor: '#ef4444', 
                color: '#ef4444',
                fontWeight: 600,
                backdropFilter: 'none',
                bgcolor: 'rgba(239, 68, 68, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  borderColor: '#dc2626', 
                  bgcolor: 'rgba(239, 68, 68, 0.15)',
                  transform: 'none'
                }
              }}
            >
              Stop
            </Button>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<History />}
            onClick={() => setInspectorOpen(true)}
            sx={{ 
              borderColor: 'rgba(255, 255, 255, 0.12)', 
              color: '#A3A3A3',
              '&:hover': { borderColor: '#00F3FF', color: '#00F3FF', bgcolor: 'rgba(0, 243, 255, 0.05)' }
            }}
          >
            Session Logs
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{ 
              borderColor: 'rgba(255, 255, 255, 0.12)', 
              color: '#A3A3A3',
              '&:hover': { borderColor: '#00F3FF', color: '#00F3FF', bgcolor: 'rgba(0, 243, 255, 0.05)' }
            }}
          >
            Settings
          </Button>
        </Box>
      </Box>

      {(lastPreviewActionJson || lastSomImage) && browserStatus === 'connected' && (
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap'
        }}>
          {lastPreviewActionJson && (
            <Chip
              label="Use Preview"
              size="small"
              onClick={() => {
                setInstruction(lastPreviewActionJson);
                setActionMode('act');
                addLog('🧩 Applied preview action');
              }}
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.18)' }
              }}
            />
          )}

          {lastSomImage && (
            <Chip
              label="Show SoM"
              size="small"
              onClick={() => {
                setScreenshot(lastSomImage);
                addLog('🧿 Showing SoM view');
              }}
              sx={{
                bgcolor: 'rgba(139, 92, 246, 0.12)',
                color: '#8b5cf6',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.18)' }
              }}
            />
          )}
        </Box>
      )}

      {useSandbox && browserStatus === 'disconnected' && (
        <Paper sx={{ 
          p: 2, 
          bgcolor: 'rgba(139, 92, 246, 0.05)', 
          border: '1px solid rgba(139, 92, 246, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#8b5cf6', mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            🔒 Sandbox Mode Enabled
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', fontSize: '0.85rem' }}>
            Your automation will run in a secure E2B isolated environment with Playwright pre-installed. Perfect for production deployments and untrusted code execution.
          </Typography>
        </Paper>
      )}

      {retryInfo && (
        <Paper sx={{ 
          p: 2, 
          bgcolor: 'rgba(245, 158, 11, 0.1)', 
          border: '1px solid rgba(245, 158, 11, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          animation: 'slideInLeft 0.3s ease-out'
        }}>
          <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 600 }}>
            🔄 Retrying action... Attempt {retryInfo.attempt}/{retryInfo.maxRetries}
          </Typography>
        </Paper>
      )}

      {actionMode === 'agent' && (
        <Paper sx={{ 
          p: 2, 
          bgcolor: 'rgba(139, 92, 246, 0.1)', 
          border: '1px solid rgba(139, 92, 246, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#8b5cf6', mb: 2, fontWeight: 600 }}>
            🤖 Autonomous Browser Agent
          </Typography>
          <TextField
            fullWidth
            value={agentGoal}
            onChange={(e) => setAgentGoal(e.target.value)}
            placeholder="Enter goal (e.g., 'Find and purchase the cheapest laptop')"
            disabled={browserStatus !== 'connected' || agentRunning}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                bgcolor: 'rgba(10, 10, 10, 0.8)',
                backdropFilter: 'blur(5px)',
                borderRadius: '8px',
                '& fieldset': { borderColor: 'rgba(139, 92, 246, 0.3)' },
                '&:hover fieldset': { borderColor: '#8b5cf6' },
                '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
              },
              mb: 1
            }}
          />
          <Button
            fullWidth
            variant="contained"
            disabled={browserStatus !== 'connected' || agentRunning || !agentGoal.trim()}
            onClick={executeAutonomousAgent}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: 'white',
              fontWeight: 600,
              '&:hover': { background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' },
              '&:disabled': { background: 'rgba(42, 42, 42, 0.6)', color: '#666' }
            }}
          >
            {agentRunning ? '🤖 Agent Running...' : 'Start Autonomous Agent'}
          </Button>
        </Paper>
      )}

      {selectedElement && (
        <Paper sx={{ 
          p: 2, 
          bgcolor: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          animation: 'slideInLeft 0.3s ease-out'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#10b981', mb: 1, fontWeight: 600 }}>
            🎯 Selected Element
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            Tag: {selectedElement.tag} | Text: "{selectedElement.text}"
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            CSS: {selectedElement.css}
          </Typography>
        </Paper>
      )}

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          lg: leftCollapsed ? (rightCollapsed ? '1fr' : '1fr 320px') : (rightCollapsed ? '280px 1fr' : '280px 1fr 320px') 
        },
        gap: 2,
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {!leftCollapsed && (
        <Paper sx={{
          p: 2,
          bgcolor: '#141418',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative'
        }}>
          <IconButton
            size="small"
            onClick={() => setLeftCollapsed(true)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: '#666',
              '&:hover': { color: '#00F3FF' }
            }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="caption" sx={{ 
              color: '#A3A3A3', 
              fontWeight: 700, 
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              display: 'block',
              mb: 0.5
            }}>
              Intelligence Hub
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
              Sovereign State
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            startIcon={<FlashOn />}
            onClick={() => {
              const newSid = `stagehand_${Date.now()}`;
              setSessionId(newSid);
              setLogs([]);
              setScreenshot('');
              setCurrentUrl('');
              addLog(`🆕 New session created: ${newSid.slice(-8)}`);
            }}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              fontWeight: 600,
              borderRadius: '10px',
              py: 1,
              textTransform: 'none',
              '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }
            }}
          >
            New Session
          </Button>

          <TextField
            fullWidth
            size="small"
            placeholder="Search sessions..."
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                bgcolor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
              }
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, overflow: 'auto' }}>
            {sessionRows.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px' }}>
                <Typography variant="caption" sx={{ color: '#555' }}>
                  No sessions yet. Start the browser to create your first task session.
                </Typography>
              </Box>
            ) : (
              sessionRows.slice(0, 5).map((item: any, idx) => {
                const sid = String((item as any)?.sessionId || '');
                const st = String((item as any)?.status || 'unknown');
                const url = String((item as any)?.url || '');
                const isCurrent = sid === sessionId;
                const statusColor = st === 'active' ? '#10b981' : st === 'completed' ? '#8b5cf6' : '#f59e0b';
                return (
                  <Box
                    key={sid || idx}
                    onClick={() => {
                      if (sid) {
                        setReplaySessionId(sid);
                        fetchReplay(sid);
                      }
                    }}
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isCurrent ? 'rgba(0, 243, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                      bgcolor: isCurrent ? 'rgba(0, 243, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: 'rgba(0, 243, 255, 0.2)', bgcolor: 'rgba(0, 243, 255, 0.05)' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                      <FlashOn sx={{ color: statusColor, fontSize: 16 }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>
                          Session {sid.slice(-6)}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: statusColor, 
                          fontWeight: 600,
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {st}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover': { color: '#00F3FF' } }}>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                📖 Documentation
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover': { color: '#00F3FF' } }}>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                🛟 Support
              </Typography>
            </Box>
          </Box>
        </Paper>
        )}

        {leftCollapsed && (
          <IconButton
            onClick={() => setLeftCollapsed(false)}
            sx={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(20, 20, 24, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#666',
              width: 32,
              height: 32,
              zIndex: 10,
              '&:hover': { bgcolor: 'rgba(30, 30, 35, 0.9)', color: '#00F3FF', borderColor: 'rgba(0, 243, 255, 0.3)' }
            }}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          <Paper sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#141418',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '20px',
            overflow: 'hidden',
            minHeight: 0
          }}>
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              {recentChatItems.length === 0 ? (
                <Box sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <FlashOn sx={{ color: '#10b981', fontSize: 16 }} />
                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, letterSpacing: '0.05em' }}>
                      KARIOS AGENT
                    </Typography>
                  </Box>
                  
                  <Box sx={{
                    p: 2.5,
                    bgcolor: 'rgba(20, 20, 24, 0.8)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderLeft: '3px solid #10b981',
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: '#10b981',
                        animation: 'pulse 2s infinite'
                      }} />
                      <Typography variant="body2" sx={{ color: '#A3A3A3' }}>
                        Initializing Stagehand Browser in headed mode...
                      </Typography>
                    </Box>
                    
                    <Box sx={{
                      p: 1.5,
                      bgcolor: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    }}>
                      <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                        {'>'} spawning_process: browser_engine_v2
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                        {'>'} bypass_detection: enabled
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                        {'>'} target: {currentUrl || 'waiting for command'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {['Search for latest AI research', 'Extract product prices from Amazon', 'Navigate to news site'].map((suggestion, i) => (
                      <Chip
                        key={i}
                        label={suggestion}
                        size="small"
                        onClick={() => {
                          setInstruction(suggestion);
                          setActionMode('act');
                        }}
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          color: '#888',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.1)', color: '#00F3FF', borderColor: 'rgba(0, 243, 255, 0.3)' }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                recentChatItems.map((log, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: idx % 2 === 0 ? 'flex-start' : 'flex-end',
                      gap: 1.5
                    }}
                  >
                    {idx % 2 === 0 && (
                      <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '10px',
                        bgcolor: 'rgba(0, 243, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FlashOn sx={{ color: '#00F3FF', fontSize: 16 }} />
                      </Box>
                    )}
                    <Paper
                      elevation={0}
                      sx={{
                        maxWidth: '75%',
                        px: 2.5,
                        py: 2,
                        borderRadius: idx % 2 === 0 ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                        bgcolor: idx % 2 === 0 ? 'rgba(30, 30, 35, 0.8)' : 'rgba(0, 243, 255, 0.08)',
                        border: '1px solid',
                        borderColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 243, 255, 0.2)'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: idx % 2 === 0 ? '#00F3FF' : '#888', display: 'block', mb: 0.5, fontWeight: 600 }}>
                        {idx % 2 === 0 ? 'Browser Agent' : 'You'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {log}
                      </Typography>
                    </Paper>
                    {idx % 2 !== 0 && (
                      <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '10px',
                        bgcolor: 'rgba(139, 92, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Typography sx={{ color: '#8b5cf6', fontSize: 14, fontWeight: 700 }}>U</Typography>
                      </Box>
                    )}
                  </Box>
                ))
              )}
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.06)', bgcolor: 'rgba(20, 20, 24, 0.8)' }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<Bolt sx={{ fontSize: 14, color: actionMode === 'act' ? '#00F3FF' : '#888' }} />}
                  label="ACT"
                  size="small"
                  onClick={() => setActionMode('act')}
                  sx={{
                    bgcolor: actionMode === 'act' ? 'rgba(0, 243, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: actionMode === 'act' ? '#00F3FF' : '#888',
                    border: '1px solid',
                    borderColor: actionMode === 'act' ? 'rgba(0, 243, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    fontWeight: actionMode === 'act' ? 600 : 400,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.05em',
                    '& .MuiChip-icon': { ml: 0.5 }
                  }}
                />
                <Chip
                  icon={<Diamond sx={{ fontSize: 14, color: actionMode === 'extract' ? '#10b981' : '#888' }} />}
                  label="EXTRACT"
                  size="small"
                  onClick={() => setActionMode('extract')}
                  sx={{
                    bgcolor: actionMode === 'extract' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: actionMode === 'extract' ? '#10b981' : '#888',
                    border: '1px solid',
                    borderColor: actionMode === 'extract' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    fontWeight: actionMode === 'extract' ? 600 : 400,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.05em',
                    '& .MuiChip-icon': { ml: 0.5 }
                  }}
                />
                <Chip
                  icon={<Visibility sx={{ fontSize: 14, color: actionMode === 'observe' ? '#8b5cf6' : '#888' }} />}
                  label="OBSERVE"
                  size="small"
                  onClick={() => setActionMode('observe')}
                  sx={{
                    bgcolor: actionMode === 'observe' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: actionMode === 'observe' ? '#8b5cf6' : '#888',
                    border: '1px solid',
                    borderColor: actionMode === 'observe' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    fontWeight: actionMode === 'observe' ? 600 : 400,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.05em',
                    '& .MuiChip-icon': { ml: 0.5 }
                  }}
                />
                <Chip
                  icon={<SmartToy sx={{ fontSize: 14, color: actionMode === 'agent' ? '#f59e0b' : '#888' }} />}
                  label="AGENT"
                  size="small"
                  onClick={() => {
                    if (sandboxActive) {
                      addLog('⚠️ Autonomous agent requires Local Mode');
                      return;
                    }
                    setActionMode('agent');
                  }}
                  sx={{
                    bgcolor: actionMode === 'agent' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: actionMode === 'agent' ? '#f59e0b' : '#888',
                    border: '1px solid',
                    borderColor: actionMode === 'agent' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    fontWeight: actionMode === 'agent' ? 600 : 400,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.05em',
                    opacity: sandboxActive ? 0.5 : 1,
                    '& .MuiChip-icon': { ml: 0.5 }
                  }}
                />
              </Box>

              <Box sx={{ 
                display: 'flex', 
                gap: 1.5, 
                alignItems: 'center',
                p: 2,
                bgcolor: 'rgba(20, 20, 24, 0.6)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 0 20px rgba(0, 243, 255, 0.05)'
              }}>
                <IconButton
                  size="small"
                  sx={{ 
                    color: '#666',
                    '&:hover': { color: '#00F3FF', bgcolor: 'rgba(0, 243, 255, 0.1)' }
                  }}
                >
                  <Add fontSize="small" />
                </IconButton>
                <TextField
                  fullWidth
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && browserStatus === 'connected' && !isRunning && instruction.trim()) {
                      e.preventDefault();
                      executeStagehandAction();
                    }
                  }}
                  placeholder="What can Karios help you Automate."
                  disabled={browserStatus !== 'connected'}
                  variant="standard"
                  InputProps={{
                    disableUnderline: true
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      color: 'white',
                      bgcolor: 'transparent',
                      fontSize: '0.95rem',
                      '&::before': { display: 'none' },
                      '&::after': { display: 'none' }
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#666',
                      opacity: 1
                    }
                  }}
                />
                <IconButton
                  onClick={executeStagehandAction}
                  disabled={browserStatus !== 'connected' || isRunning || !instruction.trim()}
                  sx={{
                    color: browserStatus === 'connected' && !isRunning && instruction.trim() ? '#00F3FF' : '#666',
                    '&:hover': { 
                      color: '#00F3FF', 
                      bgcolor: 'rgba(0, 243, 255, 0.1)',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isRunning ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <Send fontSize="small" />}
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Box>

        {!rightCollapsed && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0, position: 'relative' }}>
          <IconButton
            size="small"
            onClick={() => setRightCollapsed(true)}
            sx={{
              position: 'absolute',
              top: 8,
              left: -12,
              zIndex: 10,
              color: '#666',
              bgcolor: 'rgba(20, 20, 24, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '&:hover': { color: '#00F3FF', borderColor: 'rgba(0, 243, 255, 0.3)' }
            }}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
          <Paper sx={{ 
            p: 2, 
            bgcolor: '#141418',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="caption" sx={{ 
                color: '#A3A3A3', 
                fontWeight: 700, 
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '0.65rem'
              }}>
                Agent Core
              </Typography>
              <Box sx={{
                px: 1,
                py: 0.25,
                bgcolor: 'rgba(16, 185, 129, 0.2)',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <Typography variant="caption" sx={{ color: '#10b981', fontSize: '0.65rem', fontWeight: 700 }}>
                  ACTIVE
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                  Claude-3.5-Sonnet
                </Typography>
                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                  Stagehand Protocol v2.4
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 700 }}>
                  124.5
                </Typography>
                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.65rem' }}>
                  TOKENS/S
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ 
                color: '#A3A3A3', 
                fontWeight: 700, 
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '0.65rem'
              }}>
                Live Browser Preview
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', animation: 'pulse 2s infinite' }} />
                <Typography variant="caption" sx={{ color: '#10b981', fontSize: '0.65rem', fontWeight: 600 }}>
                  LIVE
                </Typography>
              </Box>
            </Box>

            <Box 
              ref={screenshotContainerRef}
              sx={{ 
                height: 180,
                bgcolor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                mb: 2
              }}
            >
              {screenshot ? (
                <>
                  <img 
                    src={screenshot.startsWith('data:') ? screenshot : `data:image/png;base64,${screenshot}`}
                    alt="Browser screenshot"
                    onClick={handleScreenshotClick}
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  {currentUrl && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      right: 8,
                      bgcolor: 'rgba(0, 0, 0, 0.8)',
                      backdropFilter: 'blur(10px)',
                      px: 1.5,
                      py: 0.75,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}>
                      <Box component="span" sx={{ color: '#10b981', fontSize: '0.7rem' }}>🔒</Box>
                      <Typography variant="caption" sx={{ color: '#A3A3A3', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentUrl.replace(/^https?:\/\//, '')}
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ 
                  height: '100%',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: '#555'
                }}>
                  <Visibility sx={{ fontSize: 32, opacity: 0.4, mb: 1 }} />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    Start browser to view
                  </Typography>
                </Box>
              )}
            </Box>

            <Typography variant="caption" sx={{ 
              color: '#666', 
              fontWeight: 600, 
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontSize: '0.6rem',
              mb: 1
            }}>
              Navigation History
            </Typography>

            {screenshotHistory.length > 0 && (
              <Box sx={{ 
                display: 'flex', 
                gap: 0.75, 
                mb: 2,
                overflowX: 'auto',
                pb: 0.5
              }}>
                {recentScreens.map((item, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setScreenshot(item.screenshot)}
                    sx={{
                      minWidth: '60px',
                      height: '40px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: screenshot === item.screenshot ? '#00F3FF' : 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: '#00F3FF' }
                    }}
                  >
                    <img 
                      src={item.screenshot.startsWith('data:') ? item.screenshot : `data:image/png;base64,${item.screenshot}`}
                      alt="History"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>Runtime</Typography>
                <Typography variant="caption" sx={{ color: '#A3A3A3', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                  {browserStatus === 'connected' ? '00:12:45.82' : '00:00:00.00'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>Resources</Typography>
                <Typography variant="caption" sx={{ color: '#A3A3A3', fontSize: '0.7rem' }}>
                  2.4 GB / 8 GB
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>Browser Mode</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box component="span" sx={{ fontSize: '0.7rem' }}>🖥️</Box>
                  <Typography variant="caption" sx={{ color: '#A3A3A3', fontSize: '0.7rem' }}>
                    {useSandbox ? 'Sandbox' : 'Headed'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
        )}

        {rightCollapsed && (
          <IconButton
            onClick={() => setRightCollapsed(false)}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(20, 20, 24, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#666',
              width: 32,
              height: 32,
              zIndex: 10,
              '&:hover': { bgcolor: 'rgba(30, 30, 35, 0.9)', color: '#00F3FF', borderColor: 'rgba(0, 243, 255, 0.3)' }
            }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmPayload(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'rgba(10, 10, 10, 0.95)', color: 'white' }}>
          Confirm action
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'rgba(10, 10, 10, 0.95)', color: 'white' }}>
          <Typography variant="body2" sx={{ color: '#A3A3A3', mb: 1 }}>
            This instruction looks potentially risky. Confirm before continuing.
          </Typography>
          <Paper sx={{ p: 1.5, bgcolor: 'rgba(26, 26, 26, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
            <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Instruction
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', whiteSpace: 'pre-wrap' }}>
              {String((confirmPayload as any)?.instruction || instruction || '')}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'rgba(10, 10, 10, 0.95)' }}>
          <Button
            onClick={() => {
              setConfirmOpen(false);
              setConfirmPayload(null);
            }}
            sx={{ color: '#A3A3A3' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              const payload = confirmPayload;
              setConfirmOpen(false);
              setConfirmPayload(null);
              if (payload?.kind === 'single') {
                await performStagehandAction({ instruction: String(payload.instruction || ''), mode: String(payload.mode || actionMode) });
                return;
              }
              if (payload?.kind === 'rerun') {
                const idx = typeof payload.startIndex === 'number' ? payload.startIndex : -1;
                if (idx >= 0) {
                  setRiskBypassIndex(idx);
                  await rerunFromIndex(idx);
                }
              }
            }}
            sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', color: '#000', fontWeight: 700 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'rgba(10, 10, 10, 0.95)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History />
            <Typography sx={{ fontWeight: 700, color: 'white' }}>Execution Inspector</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={`Session: ${sessionId || '-'}`}
              size="small"
              sx={{ bgcolor: 'rgba(0, 243, 255, 0.12)', border: '1px solid rgba(0, 243, 255, 0.25)', color: '#00F3FF' }}
            />
            {pinnedResults.length > 0 && (
              <Chip
                label={`Pinned ${pinnedResults.length}`}
                size="small"
                sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981' }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'rgba(10, 10, 10, 0.95)', color: 'white' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px 1fr' }, gap: 2, mt: 1 }}>
            <Paper sx={{ p: 2, bgcolor: '#1A1A1A', border: '1px solid rgba(42, 42, 42, 0.9)', borderRadius: '16px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#00F3FF', fontWeight: 700 }}>Sessions</Typography>
                <Button
                  size="small"
                  onClick={fetchSessions}
                  disabled={sessionsLoading}
                  sx={{ color: '#A3A3A3' }}
                >
                  Refresh
                </Button>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  const sid = sessionId;
                  setReplaySessionId(sid);
                  fetchReplay(sid);
                }}
                disabled={!sessionId}
                sx={{
                  mb: 1,
                  borderColor: 'rgba(0, 243, 255, 0.25)',
                  color: '#00F3FF',
                  bgcolor: 'rgba(0, 243, 255, 0.06)'
                }}
              >
                Load current session
              </Button>
              {sessionsError && (
                <Typography variant="body2" sx={{ color: '#ef4444', mb: 1 }}>
                  {sessionsError}
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '52vh', overflow: 'auto' }}>
                {sessions.map((s, idx) => {
                  const sid = String((s as any)?.sessionId || '');
                  const st = String((s as any)?.status || '');
                  const u = String((s as any)?.url || '');
                  const cnt = (s as any)?.actions_count;
                  return (
                    <Button
                      key={sid || idx}
                      fullWidth
                      variant="outlined"
                      onClick={() => {
                        setReplaySessionId(sid);
                        fetchReplay(sid);
                      }}
                      sx={{
                        justifyContent: 'space-between',
                        borderColor: replaySessionId === sid ? 'rgba(0, 243, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                        color: 'white',
                        bgcolor: replaySessionId === sid ? 'rgba(0, 243, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        textTransform: 'none',
                        '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.08)', borderColor: 'rgba(0, 243, 255, 0.25)' }
                      }}
                    >
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="caption" sx={{ color: '#A3A3A3', display: 'block' }}>{sid}</Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>{st}{cnt !== undefined ? ` · ${cnt}` : ''}</Typography>
                        {u ? (
                          <Typography variant="caption" sx={{ color: '#666', display: 'block', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u}</Typography>
                        ) : null}
                      </Box>
                    </Button>
                  );
                })}
                {sessions.length === 0 && (
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {sessionsLoading ? 'Loading...' : 'No active sessions'}
                  </Typography>
                )}
              </Box>
              {pinnedResults.length > 0 && (
                <>
                  <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
                  <Typography variant="subtitle2" sx={{ color: '#10b981', fontWeight: 700, mb: 1 }}>Pinned</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '22vh', overflow: 'auto' }}>
                    {pinnedResults.slice().reverse().map((p, i) => (
                      <Paper
                        key={i}
                        sx={{ p: 1, bgcolor: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.14)', borderRadius: '12px' }}
                      >
                        <Typography variant="caption" sx={{ color: '#10b981', display: 'block' }}>{String((p as any)?.pinnedAt || '')}</Typography>
                        <Typography variant="caption" sx={{ color: '#A3A3A3', display: 'block' }}>{String((p as any)?.sessionId || '')} · #{Number((p as any)?.index ?? -1) + 1}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              const sid = String((p as any)?.sessionId || '');
                              const idx = Number((p as any)?.index ?? -1);
                              if (sid) {
                                setReplaySessionId(sid);
                                fetchReplay(sid);
                                if (idx >= 0) setSelectedReplayIndex(idx);
                              }
                            }}
                            sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', color: '#A3A3A3' }}
                          >
                            Jump
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => loadEntryIntoPrompt((p as any)?.entry)}
                            sx={{ borderColor: 'rgba(16, 185, 129, 0.25)', color: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.06)' }}
                          >
                            Load
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setPinnedResults(prev => prev.filter((x: any) => !(x?.pinnedAt === (p as any)?.pinnedAt && x?.sessionId === (p as any)?.sessionId && x?.index === (p as any)?.index)));
                            }}
                            sx={{ borderColor: 'rgba(239, 68, 68, 0.25)', color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.06)' }}
                          >
                            Remove
                          </Button>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </>
              )}
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'rgba(26, 26, 26, 0.55)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', minHeight: '60vh' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" sx={{ color: '#00F3FF', fontWeight: 700 }}>Replay</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip
                    label={replaySessionId ? `Session ${replaySessionId}` : 'No session selected'}
                    size="small"
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#A3A3A3' }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => fetchReplay(replaySessionId)}
                    disabled={!replaySessionId || replayLoading}
                    sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', color: '#A3A3A3' }}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>

              {replayError && (
                <Typography variant="body2" sx={{ color: '#ef4444', mb: 1 }}>
                  {replayError}
                </Typography>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 360px' }, gap: 2, mt: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: { xs: '44vh', lg: '56vh' }, overflow: 'auto' }}>
                  {(Array.isArray(replayData?.actions) ? replayData.actions : []).map((it: any, i: number) => {
                    const a = it?.action || {};
                    const t = String(a?.type || a?.action_type || a?.actionType || 'act');
                    const instr = String(a?.instruction || '');
                    const ok = it?.result?.success;
                    const ts = String(it?.timestamp || '');
                    return (
                      <Button
                        key={i}
                        fullWidth
                        variant="outlined"
                        onClick={() => setSelectedReplayIndex(i)}
                        sx={{
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          borderColor: selectedReplayIndex === i ? 'rgba(0, 243, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                          color: 'white',
                          bgcolor: selectedReplayIndex === i ? 'rgba(0, 243, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                          textTransform: 'none'
                        }}
                      >
                        <Box>
                          <Typography variant="caption" sx={{ color: '#A3A3A3', display: 'block' }}>#{i + 1} · {t}{typeof ok === 'boolean' ? (ok ? ' · success' : ' · failed') : ''}</Typography>
                          <Typography variant="body2" sx={{ color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 820 }}>{instr || JSON.stringify(a).substring(0, 140)}</Typography>
                          {ts ? <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>{ts}</Typography> : null}
                        </Box>
                      </Button>
                    );
                  })}
                  {(Array.isArray(replayData?.actions) ? replayData.actions.length : 0) === 0 && (
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {replayLoading ? 'Loading...' : 'No actions found'}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(10, 10, 10, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px' }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>Step</Typography>
                    {selectedReplayIndex >= 0 ? (
                      <>
                        <Typography variant="caption" sx={{ color: '#A3A3A3', display: 'block', mb: 0.5 }}>
                          Selected #{selectedReplayIndex + 1}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              const actions = Array.isArray(replayData?.actions) ? replayData.actions : [];
                              const it = actions[selectedReplayIndex];
                              const a = (it as any)?.action || {};
                              const rawType = String((a as any)?.type || (a as any)?.action_type || (a as any)?.actionType || '').toLowerCase();
                              const nextMode = (rawType === 'extract' || rawType === 'observe' || rawType === 'agent' || rawType === 'act') ? rawType : 'act';
                              const nextInstruction = String((a as any)?.instruction || '').trim();
                              if (nextInstruction) {
                                setActionMode(nextMode as any);
                                setInstruction(nextInstruction);
                                addLog(`🧠 Loaded replay step ${selectedReplayIndex + 1} into prompt`);
                              }
                            }}
                            sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', color: '#A3A3A3' }}
                          >
                            Load into prompt
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => rerunFromIndex(selectedReplayIndex)}
                            disabled={rerunRunning || browserStatus !== 'connected'}
                            sx={{ background: 'linear-gradient(135deg, #00F3FF 0%, #0077FF 100%)', color: '#000', fontWeight: 700 }}
                          >
                            {rerunRunning ? 'Running...' : 'Run from here'}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              const actions = Array.isArray(replayData?.actions) ? replayData.actions : [];
                              const it = actions[selectedReplayIndex];
                              pinReplayItem(it, selectedReplayIndex);
                            }}
                            sx={{ borderColor: 'rgba(16, 185, 129, 0.25)', color: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.06)' }}
                          >
                            Pin
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              const shot = getReplayScreenshotForIndex(selectedReplayIndex);
                              if (shot) {
                                setScreenshot(shot);
                                addLog(`🖼️ Loaded replay screenshot for step ${selectedReplayIndex + 1}`);
                              }
                            }}
                            sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', color: '#A3A3A3' }}
                          >
                            Show screenshot
                          </Button>
                        </Box>
                        <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
                        <Typography variant="caption" sx={{ color: '#A3A3A3', display: 'block', mb: 0.5 }}>Action</Typography>
                        <Paper sx={{ p: 1.25, bgcolor: 'rgba(26, 26, 26, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
                          <Typography variant="body2" sx={{ color: 'white', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {(() => {
                              const actions = Array.isArray(replayData?.actions) ? replayData.actions : [];
                              const it = actions[selectedReplayIndex];
                              const a = (it as any)?.action || {};
                              const instr = String((a as any)?.instruction || '').trim();
                              return instr ? instr : JSON.stringify(a).substring(0, 600);
                            })()}
                          </Typography>
                        </Paper>
                        <Typography variant="caption" sx={{ color: '#A3A3A3', display: 'block', mt: 1.5, mb: 0.5 }}>Result</Typography>
                        <Paper sx={{ p: 1.25, bgcolor: 'rgba(26, 26, 26, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
                          <Typography variant="body2" sx={{ color: '#A3A3A3', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {(() => {
                              const actions = Array.isArray(replayData?.actions) ? replayData.actions : [];
                              const it = actions[selectedReplayIndex];
                              const r = (it as any)?.result;
                              try {
                                return JSON.stringify(r, null, 2).substring(0, 1600);
                              } catch (e) {
                                return String(r);
                              }
                            })()}
                          </Typography>
                        </Paper>
                      </>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#666' }}>Select a step to inspect</Typography>
                    )}
                  </Paper>
                </Box>
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'rgba(10, 10, 10, 0.95)' }}>
          <Button onClick={() => setInspectorOpen(false)} sx={{ color: '#A3A3A3' }}>Close</Button>
        </DialogActions>
      </Dialog>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};
