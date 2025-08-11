import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, IconButton, Chip, Typography, FormControlLabel, Switch } from '@mui/material';
import { Web, Close, PlayArrow, Stop, Minimize } from '@mui/icons-material';
import WebAutomationBrowser from './WebAutomationBrowser';
import PlanContainer from './PlanContainer';

interface WebAutomationIntegrationProps {
  onAutomationResult?: (result: any) => void;
  isVisible?: boolean;
}

export const WebAutomationIntegration: React.FC<WebAutomationIntegrationProps> = ({
  onAutomationResult,
  isVisible = false
}) => {
  const BACKEND_URL: string = (import.meta as any).env.VITE_BACKEND_URL;
  const [isOpen, setIsOpen] = useState(isVisible);
  const [isAutomationActive, setIsAutomationActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [automationStatus, setAutomationStatus] = useState<'idle' | 'running' | 'paused' | 'error'>('idle');
  const [visibleMode, setVisibleMode] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [showPlan, setShowPlan] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dialogPos, setDialogPos] = useState<{ x: number; y: number }>({ x: 120, y: 120 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [workflowDispatched, setWorkflowDispatched] = useState(false);
  const paperRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const posRef = useRef<{ x: number; y: number }>({ x: 120, y: 120 });

  useEffect(() => {
    setIsOpen(isVisible);
  }, [isVisible]);

  useEffect(() => {
    const onShow = () => setIsOpen(true);
    window.addEventListener('automation:show', onShow as any);
    return () => window.removeEventListener('automation:show', onShow as any);
  }, []);

  useEffect(() => {
    if (!currentSession) return;
    
    const wsUrl = `${BACKEND_URL.replace('http', 'ws')}/api/web-automation/ws/automation/${currentSession}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'plan_created') {
        setCurrentPlan(data.plan);
        setShowPlan(true);
        if (!workflowDispatched && currentSession) {
          try {
            const steps = (data.plan && (data.plan.steps || data.plan.plan?.steps)) || [];
            const task = (data.plan && (data.plan.task || data.plan.goal || data.plan.title)) || '';
            fetch(`${BACKEND_URL}/api/web-automation/execute-workflow`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: currentSession, workflow_steps: Array.isArray(steps) ? steps : [], task_description: typeof task === 'string' ? task : '' })
            }).then(() => setWorkflowDispatched(true)).catch(() => {});
          } catch {}
        }
        if (onAutomationResult) {
          onAutomationResult({ type: 'plan_created', plan: data.plan, sessionId: currentSession });
        }
      } else if (data.type === 'execution_started') {
        setIsOpen(true);
        if (onAutomationResult) {
          onAutomationResult({ type: 'execution_started', sessionId: currentSession });
        }
      } else if (data.type === 'workflow_completed') {
        if (onAutomationResult) {
          onAutomationResult({ type: 'workflow_completed', sessionId: currentSession, result: data.result, score: data.score });
        }
        try {
          const score = typeof data.score === 'number' ? data.score : (typeof data.result?.score === 'number' ? data.result.score : undefined);
          if (typeof score === 'number' && score >= 92) {
            setIsOpen(false);
          }
        } catch {}
      }
    };
    
    return () => ws.close();
  }, [currentSession, BACKEND_URL, workflowDispatched, onAutomationResult]);

  useEffect(() => {
    setWorkflowDispatched(false);
  }, [currentSession]);

  useEffect(() => {
    posRef.current = dialogPos;
  }, [dialogPos]);

  useEffect(() => {
    if (!isOpen || isMinimized) return;
    const handler = (e: MouseEvent) => {
      const node = paperRef.current;
      if (!node) return;
      const target = e.target as Node | null;
      if (target && !node.contains(target)) {
        setIsMinimized(true);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (!dragStart) return;
    draggingRef.current = true;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = e instanceof TouchEvent ? (e.touches[0]?.clientX || 0) : (e as MouseEvent).clientX;
      const clientY = e instanceof TouchEvent ? (e.touches[0]?.clientY || 0) : (e as MouseEvent).clientY;
      if (!draggingRef.current) return;
      if (e instanceof TouchEvent) {
        try { (e as any).preventDefault(); } catch {}
      }
      const nx = clientX - dragStart.x;
      const ny = clientY - dragStart.y;
      const w = (paperRef.current && (paperRef.current as HTMLElement).offsetWidth) || 880;
      const h = (paperRef.current && (paperRef.current as HTMLElement).offsetHeight) || 560;
      const maxX = Math.max(8, (window.innerWidth || 0) - w - 8);
      const maxY = Math.max(8, (window.innerHeight || 0) - h - 8);
      const cx = Math.min(Math.max(8, nx), maxX);
      const cy = Math.min(Math.max(8, ny), maxY);
      if (frameRef.current == null) {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = null;
          setDialogPos({ x: cx, y: cy });
        });
      }
    };
    const onUp = () => {
      draggingRef.current = false;
      setDragStart(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp as any, { once: true });
    return () => {
      draggingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp as any);
      window.removeEventListener('touchmove', onMove as any);
      window.removeEventListener('touchend', onUp as any);
    };
  }, [dragStart]);

  const handleCloseAutomation = () => {
    setIsOpen(false);
    if (isAutomationActive && currentSession) {
      stopAutomation();
    }
  };

  const startAutomation = async (url?: string) => {
    try {
      console.log('WebAutomation start requested');
      const sessionId = `session_${Date.now()}`;
      
      console.log('Creating chat for Web Automation Agent');
      const chatResponse = await fetch(`${BACKEND_URL}/api/chat/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Web Automation Agent',
          chat_type: 'sales_agent',
          agent_id: '1',
          language: 'en'
        })
      });
      
      if (!chatResponse.ok) {
        console.log('Failed to create chat for Web Automation Agent');
        throw new Error('Failed to create Web Automation Agent chat');
      }
      
      const chatResult = await chatResponse.json();
      const chatId = chatResult.id;
      
      console.log('Starting backend automation session', { sessionId, url: url || 'https://example.com', visible: false, chatId });
      const startUrl = `${BACKEND_URL}/api/web-automation/start`;
      console.log('WebAutomation start URL', startUrl);
      const response = await fetch(startUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          url: url || 'about:blank',
          visible: visibleMode,
          chatId
        })
      });

      const status = response.status;
      const text = await response.text().catch(() => '');
      console.log('WebAutomation start response', { status, body: text });
      if (response.ok) {
        setCurrentSession(sessionId);
        setIsAutomationActive(true);
        setAutomationStatus('running');
        console.log('WebAutomation session started', { sessionId });
        
        if (onAutomationResult) {
          onAutomationResult({
            type: 'session_started',
            sessionId,
            status: 'running',
            chatId
          });
        }
      } else {
        console.log('WebAutomation start response not ok');
        setAutomationStatus('error');
        setIsAutomationActive(false);
      }
    } catch (error) {
      console.error('Failed to start automation:', error);
      setAutomationStatus('error');
      setIsAutomationActive(false);
    }
  };

  const stopAutomation = async () => {
    if (!currentSession) return;

    try {
      console.log('Stopping WebAutomation session', { sessionId: currentSession });
      const stopUrl = `${BACKEND_URL}/api/web-automation/stop`;
      console.log('WebAutomation stop URL', stopUrl);
      const response = await fetch(stopUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSession })
      });

      const status = response.status;
      const text = await response.text().catch(() => '');
      console.log('WebAutomation stop response', { status, body: text });
      if (response.ok) {
        setIsAutomationActive(false);
        setCurrentSession(null);
        setAutomationStatus('idle');
        console.log('WebAutomation session stopped');
        
        if (onAutomationResult) {
          onAutomationResult({
            type: 'session_stopped',
            sessionId: currentSession,
            status: 'stopped'
          });
        }
      }
    } catch (error) {
      console.error('Failed to stop automation:', error);
    }
  };

  const handleActionExecute = (action: any) => {
    if (onAutomationResult) {
      onAutomationResult({
        type: 'action_executed',
        action,
        sessionId: currentSession
      });
    }
  };

  const handleSessionUpdate = (session: any) => {
    setAutomationStatus(session.status);
    if (onAutomationResult) {
      onAutomationResult({
        type: 'session_updated',
        session,
        sessionId: currentSession
      });
    }
  };

  const getStatusColor = () => {
    switch (automationStatus) {
      case 'running': return 'success';
      case 'paused': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const initialUrl = React.useMemo(() => {
    try {
      const steps = (currentPlan && (currentPlan.steps || currentPlan.plan?.steps)) || [];
      if (Array.isArray(steps)) {
        const nav = steps.find((s: any) => (s.action_type || s.type) === 'navigate');
        const u = (nav && (nav.target || nav.value)) || '';
        if (typeof u === 'string' && /^https?:\/\//i.test(u)) return u;
      }
    } catch {}
    return 'about:blank';
  }, [currentPlan]);

  return (
    <>
      <Button
        type="button"
        startIcon={<Web />}
        onClick={async () => {
          console.log('WebAutomation button clicked', { isAutomationActive, isOpen, currentSession });
          try { await fetch(`${BACKEND_URL}/api/web-automation/enable`, { method: 'POST' }); } catch {}
          if (!isAutomationActive) {
            setIsAutomationActive(true);
            setAutomationStatus('running');
            startAutomation();
          } else {
            const next = !isOpen;
            console.log('Toggling WebAutomation panel', { open: next });
            setIsOpen(next);
          }
        }}
        variant={'outlined'}
        color={'inherit'}
        size="small"
        className={(() => { const c = `search-text-button ${isAutomationActive ? 'search-active' : ''}`; console.log('WebAutomation button class', { className: c }); return c; })()}
        sx={{
          minWidth: 'auto',
          px: 1.5,
          textTransform: 'none',
          borderRadius: '20px',
          ...(isAutomationActive && {
            backgroundColor: 'rgba(0, 180, 216, 0.2)',
            borderColor: '#00b4d8',
            color: '#00b4d8'
          })
        }}
      >
        {(() => { console.log('WebAutomation button render', { active: isAutomationActive }); return 'Web Automation'; })()}
        {isAutomationActive && (
          <Chip
            label={automationStatus.toUpperCase()}
            size="small"
            color={getStatusColor()}
            sx={{ ml: 1, height: 20, fontSize: '0.6rem' }}
          />
        )}
      </Button>

      <Dialog
        open={isOpen}
        PaperProps={{ ref: paperRef }}
        onClose={(_event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            setIsMinimized(true);
            return;
          }
          handleCloseAutomation();
        }}
        maxWidth={false}
        hideBackdrop
        disableEscapeKeyDown
        disableEnforceFocus
        disableAutoFocus
        disableScrollLock
        keepMounted
        sx={{
          '&.MuiModal-root': {
            position: 'static',
            inset: 'auto',
            overflow: 'visible',
            width: 0,
            height: 0
          },
          '& .MuiDialog-container': {
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            pointerEvents: 'none',
            position: 'static',
            inset: 'auto',
            overflow: 'visible',
            width: 0,
            height: 0
          },
          '& .MuiDialog-paper': {
            position: 'fixed',
            transform: `translate3d(${dialogPos.x}px, ${dialogPos.y}px, 0)`,
            willChange: 'transform',
            pointerEvents: 'auto',
            width: '880px',
            height: isMinimized ? 'auto' : '560px',
            maxWidth: 'none',
            m: 0,
            borderRadius: '16px',
            boxShadow: '0px 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
            bgcolor: '#0f1115',
            border: '1px solid rgba(255,255,255,0.08)'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#0f1115',
          color: 'white',
          py: 1.5,
          px: 2,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          userSelect: 'none',
          cursor: dragStart ? 'grabbing' : 'grab'
        }}
        onMouseDown={(e) => {
          const sx = e.clientX - dialogPos.x;
          const sy = e.clientY - dialogPos.y;
          setDragStart({ x: sx, y: sy });
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (!t) return;
          const sx = t.clientX - dialogPos.x;
          const sy = t.clientY - dialogPos.y;
          setDragStart({ x: sx, y: sy });
        }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              bgcolor: 'rgba(59,130,246,0.15)',
              color: '#60a5fa'
            }}>
              <Web fontSize="small" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Web Automation Agent</Typography>
            
            {currentSession && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`Session: ${currentSession.slice(-8)}`}
                  size="small"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.24)', borderRadius: '8px' }}
                />
                <Chip
                  label={automationStatus.toUpperCase()}
                  size="small"
                  color={getStatusColor()}
                  sx={{ borderRadius: '8px' }}
                />
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={<Switch size="small" checked={visibleMode} onChange={(e) => setVisibleMode(e.target.checked)} />}
              label={visibleMode ? 'Headed' : 'Headless'}
              sx={{ mr: 1, color: 'rgba(255,255,255,0.8)', '& .MuiFormControlLabel-label': { fontSize: 12 } }}
            />
            {!isAutomationActive ? (
              <Button
                type="button"
                startIcon={<PlayArrow />}
                onClick={() => startAutomation()}
                variant="contained"
                color="success"
                size="small"
                sx={{ borderRadius: '10px', boxShadow: '0 6px 14px rgba(16,185,129,0.25)' }}
              >
                Start Session
              </Button>
            ) : (
              <Button
                type="button"
                startIcon={<Stop />}
                onClick={stopAutomation}
                variant="contained"
                color="error"
                size="small"
                sx={{ borderRadius: '10px', boxShadow: '0 6px 14px rgba(239,68,68,0.25)' }}
              >
                Stop Session
              </Button>
            )}
            
            <IconButton type="button" onClick={() => setIsMinimized((v) => !v)} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '10px', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}>
              <Minimize />
            </IconButton>
            <IconButton type="button" onClick={handleCloseAutomation} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '10px', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: '#0b0f14', display: isMinimized ? 'none' : 'block' }}>
          <PlanContainer plan={currentPlan} isVisible={false} />
          <Box sx={{
            width: '100%',
            height: showPlan ? 'calc(100% - 200px)' : '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
            margin: '0 16px 16px 16px'
          }}>
          <WebAutomationBrowser
            onActionExecute={handleActionExecute}
            onSessionUpdate={handleSessionUpdate}
            sessionId={currentSession || undefined}
            initialUrl={initialUrl}
          />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WebAutomationIntegration;
