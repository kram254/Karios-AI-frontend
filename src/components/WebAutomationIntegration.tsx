import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, IconButton, Chip, Typography } from '@mui/material';
import { Web, Close, PlayArrow, Stop } from '@mui/icons-material';
import WebAutomationBrowser from './WebAutomationBrowser';

interface WebAutomationIntegrationProps {
  onAutomationResult?: (result: any) => void;
  isVisible?: boolean;
}

export const WebAutomationIntegration: React.FC<WebAutomationIntegrationProps> = ({
  onAutomationResult,
  isVisible = false
}) => {
  const [isOpen, setIsOpen] = useState(isVisible);
  const [isAutomationActive, setIsAutomationActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [automationStatus, setAutomationStatus] = useState<'idle' | 'running' | 'paused' | 'error'>('idle');

  useEffect(() => {
    setIsOpen(isVisible);
  }, [isVisible]);

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
      const chatResponse = await fetch('/api/chat/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Web Automation Agent',
          chat_type: 'sales_agent',
          agent_id: 1
        })
      });
      
      if (!chatResponse.ok) {
        console.log('Failed to create chat for Web Automation Agent');
        throw new Error('Failed to create Web Automation Agent chat');
      }
      
      const chatResult = await chatResponse.json();
      const chatId = chatResult.id;
      
      console.log('Starting backend automation session', { sessionId, url: url || 'https://example.com', visible: false, chatId });
      const response = await fetch('/api/web-automation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          url: url || 'https://example.com',
          visible: false,
          chatId
        })
      });

      if (response.ok) {
        setCurrentSession(sessionId);
        setIsAutomationActive(true);
        setAutomationStatus('running');
        setIsOpen(true);
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
        setIsAutomationActive(false);
        setAutomationStatus('idle');
      }
    } catch (error) {
      console.error('Failed to start automation:', error);
      setIsAutomationActive(false);
      setAutomationStatus('idle');
    }
  };

  const stopAutomation = async () => {
    if (!currentSession) return;

    try {
      console.log('Stopping WebAutomation session', { sessionId: currentSession });
      const response = await fetch('/api/web-automation/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSession })
      });

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
        startIcon={<Web />}
        onClick={() => {
          console.log('WebAutomation button clicked', { isAutomationActive, isOpen, currentSession });
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
          borderRadius: '20px'
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
            width: '420px',
            height: '360px',
            maxWidth: 'none',
            m: 1
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: '#1a1a1a',
          color: 'white',
          py: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Web />
            <Typography variant="h6">Web Automation Agent</Typography>
            
            {currentSession && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`Session: ${currentSession.slice(-8)}`}
                  size="small"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                />
                <Chip
                  label={automationStatus.toUpperCase()}
                  size="small"
                  color={getStatusColor()}
                />
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isAutomationActive ? (
              <Button
                startIcon={<PlayArrow />}
                onClick={() => startAutomation()}
                variant="contained"
                color="success"
                size="small"
              >
                Start Session
              </Button>
            ) : (
              <Button
                startIcon={<Stop />}
                onClick={stopAutomation}
                variant="contained"
                color="error"
                size="small"
              >
                Stop Session
              </Button>
            )}
            
            <IconButton onClick={handleCloseAutomation} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: '#1a1a1a' }}>
          <WebAutomationBrowser
            onActionExecute={handleActionExecute}
            onSessionUpdate={handleSessionUpdate}
            initialUrl="https://example.com"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WebAutomationIntegration;
