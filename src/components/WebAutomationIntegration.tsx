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

  const handleOpenAutomation = () => {
    setIsOpen(true);
  };

  const handleCloseAutomation = () => {
    setIsOpen(false);
    if (isAutomationActive && currentSession) {
      stopAutomation();
    }
  };

  const startAutomation = async (url?: string) => {
    try {
      const sessionId = `session_${Date.now()}`;
      
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
        throw new Error('Failed to create Web Automation Agent chat');
      }
      
      const chatResult = await chatResponse.json();
      const chatId = chatResult.id;
      
      const response = await fetch('/api/web-automation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          url: url || 'https://example.com',
          visible: true,
          chatId
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentSession(sessionId);
        setIsAutomationActive(true);
        setAutomationStatus('running');
        
        if (onAutomationResult) {
          onAutomationResult({
            type: 'session_started',
            sessionId,
            status: 'running',
            chatId
          });
        }
      }
    } catch (error) {
      console.error('Failed to start automation:', error);
      setAutomationStatus('error');
    }
  };

  const stopAutomation = async () => {
    if (!currentSession) return;

    try {
      const response = await fetch('/api/web-automation/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSession })
      });

      if (response.ok) {
        setIsAutomationActive(false);
        setCurrentSession(null);
        setAutomationStatus('idle');
        
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
        onClick={handleOpenAutomation}
        variant="outlined"
        size="small"
        sx={{
          minWidth: 'auto',
          px: 1,
          color: isAutomationActive ? '#4caf50' : 'inherit',
          borderColor: isAutomationActive ? '#4caf50' : 'inherit',
          borderRadius: '10px',
        }}
      >
        Web Automation
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
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: '95vw',
            height: '90vh',
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
