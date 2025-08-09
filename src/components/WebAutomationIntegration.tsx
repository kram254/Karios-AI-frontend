import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, IconButton, Chip, Typography, FormControlLabel, Switch } from '@mui/material';
import { Web, Close, PlayArrow, Stop } from '@mui/icons-material';
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
      }
    };
    
    return () => ws.close();
  }, [currentSession, BACKEND_URL]);

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
          url: url || 'https://example.com',
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
        onClose={handleCloseAutomation}
        maxWidth={false}
        sx={{
          '& .MuiDialog-paper': {
            width: '880px',
            height: '560px',
            maxWidth: 'none',
            m: 2,
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
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
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
            
            <IconButton type="button" onClick={handleCloseAutomation} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '10px', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: '#0b0f14' }}>
          <PlanContainer plan={currentPlan} isVisible={showPlan} />
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
            initialUrl="https://example.com"
          />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WebAutomationIntegration;
