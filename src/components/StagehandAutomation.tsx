import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, Chip, LinearProgress, IconButton, Tooltip } from '@mui/material';
import { PlayArrow, Stop, Refresh, Monitor, Code, FlashOn, Visibility, MyLocation, CloudQueue } from '@mui/icons-material';

export const StagehandAutomation: React.FC = () => {
  const [instruction, setInstruction] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [screenshot, setScreenshot] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [browserStatus, setBrowserStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [actionMode, setActionMode] = useState<'act' | 'extract' | 'observe' | 'agent'>('act');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const sid = `stagehand_${Date.now()}`;
    setSessionId(sid);
    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  const initializeBrowser = async () => {
    setBrowserStatus('connecting');
    addLog('Initializing Stagehand browser...');

    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/web-automation/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          browser_type: 'chromium',
          headless: false
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setBrowserStatus('connected');
        addLog('✅ Stagehand browser initialized successfully');
        connectWebSocket();
      } else {
        setBrowserStatus('disconnected');
        addLog(`❌ Browser initialization failed: ${data.message}`);
      }
    } catch (error) {
      setBrowserStatus('disconnected');
      addLog(`❌ Error: ${error}`);
    }
  };

  const connectWebSocket = () => {
    const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
    const wsUrl = `${BACKEND_URL.replace('http', 'ws')}/api/web-automation/ws/automation/${sessionId}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'screenshot_taken' || data.type === 'screenshot') {
            setScreenshot(data.payload?.screenshot || data.screenshot);
          } else if (data.type === 'navigation_completed') {
            setCurrentUrl(data.payload?.url || '');
            addLog(`Navigated to: ${data.payload?.url}`);
          } else if (data.type === 'action_completed') {
            addLog(`✓ ${data.message || 'Action completed'}`);
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
      addLog('Please enter an instruction');
      return;
    }

    setIsRunning(true);
    addLog(`Executing ${actionMode}: ${instruction}`);

    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/web-automation/execute-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          action_type: actionMode,
          instruction: instruction,
          mode: 'stagehand'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        addLog(`✅ Action completed successfully`);
        if (data.screenshot) {
          setScreenshot(data.screenshot);
        }
        if (data.url) {
          setCurrentUrl(data.url);
        }
      } else {
        addLog(`❌ Action failed: ${data.message}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const stopBrowser = async () => {
    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      await fetch(`${BACKEND_URL}/api/web-automation/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      
      setBrowserStatus('disconnected');
      addLog('Browser session closed');
      
      if (wsRef.current) {
        wsRef.current.close();
      }
    } catch (error) {
      addLog(`Cleanup error: ${error}`);
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const quickActions = [
    { label: 'Navigate', instruction: 'go to https://example.com', mode: 'act' as const },
    { label: 'Click Login', instruction: 'click the login button', mode: 'act' as const },
    { label: 'Extract Data', instruction: 'extract all product names and prices', mode: 'extract' as const },
    { label: 'Observe Page', instruction: 'what do you see on this page?', mode: 'observe' as const }
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0A0A0A', p: 3, gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FlashOn sx={{ fontSize: 32, color: '#00F3FF' }} />
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            Stagehand Browser Automation
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip 
            label={browserStatus === 'connected' ? 'Connected' : browserStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            color={browserStatus === 'connected' ? 'success' : browserStatus === 'connecting' ? 'warning' : 'default'}
            size="small"
            sx={{ bgcolor: browserStatus === 'connected' ? '#10b981' : browserStatus === 'connecting' ? '#f59e0b' : '#4a4a4a' }}
          />
          
          {browserStatus === 'disconnected' ? (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={initializeBrowser}
              sx={{ 
                bgcolor: '#00F3FF', 
                color: '#000',
                '&:hover': { bgcolor: '#00D9E6' }
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
                '&:hover': { borderColor: '#dc2626', bgcolor: '#ef444410' }
              }}
            >
              Stop
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {['act', 'extract', 'observe', 'agent'].map((mode) => (
          <Chip
            key={mode}
            label={mode.charAt(0).toUpperCase() + mode.slice(1)}
            onClick={() => setActionMode(mode as any)}
            sx={{
              bgcolor: actionMode === mode ? '#00F3FF' : '#1A1A1A',
              color: actionMode === mode ? '#000' : '#888',
              border: '1px solid',
              borderColor: actionMode === mode ? '#00F3FF' : '#2A2A2A',
              cursor: 'pointer',
              '&:hover': { borderColor: '#00F3FF' }
            }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, flex: 1, minHeight: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
          <Paper sx={{ p: 2, bgcolor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <Typography variant="subtitle2" sx={{ color: '#00F3FF', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MyLocation sx={{ fontSize: 18 }} />
              Instruction
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={
                actionMode === 'act' ? "e.g., click the 'Sign In' button" :
                actionMode === 'extract' ? "e.g., extract all product prices from the page" :
                actionMode === 'observe' ? "e.g., what elements are visible on this page?" :
                "e.g., complete the checkout process"
              }
              disabled={browserStatus !== 'connected'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  bgcolor: '#0A0A0A',
                  '& fieldset': { borderColor: '#2A2A2A' },
                  '&:hover fieldset': { borderColor: '#00F3FF' },
                  '&.Mui-focused fieldset': { borderColor: '#00F3FF' }
                },
                mb: 2
              }}
            />

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {quickActions.map((action, idx) => (
                <Chip
                  key={idx}
                  label={action.label}
                  size="small"
                  onClick={() => {
                    setInstruction(action.instruction);
                    setActionMode(action.mode);
                  }}
                  sx={{
                    bgcolor: '#2A2A2A',
                    color: '#888',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#3A3A3A', color: '#00F3FF' }
                  }}
                />
              ))}
            </Box>

            <Button
              fullWidth
              variant="contained"
              startIcon={isRunning ? <Refresh className="animate-spin" /> : <FlashOn />}
              onClick={executeStagehandAction}
              disabled={browserStatus !== 'connected' || isRunning || !instruction.trim()}
              sx={{
                bgcolor: '#00F3FF',
                color: '#000',
                fontWeight: 600,
                '&:hover': { bgcolor: '#00D9E6' },
                '&:disabled': { bgcolor: '#2A2A2A', color: '#666' }
              }}
            >
              {isRunning ? 'Executing...' : `Execute ${actionMode.charAt(0).toUpperCase() + actionMode.slice(1)}`}
            </Button>
          </Paper>

          {currentUrl && (
            <Paper sx={{ p: 2, bgcolor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
              <Typography variant="subtitle2" sx={{ color: '#00F3FF', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudQueue sx={{ fontSize: 18 }} />
                Current URL
              </Typography>
              <Typography variant="body2" sx={{ color: '#888', wordBreak: 'break-all' }}>
                {currentUrl}
              </Typography>
            </Paper>
          )}

          <Paper sx={{ p: 2, bgcolor: '#1A1A1A', border: '1px solid #2A2A2A', flex: 1, overflow: 'auto', minHeight: 0 }}>
            <Typography variant="subtitle2" sx={{ color: '#00F3FF', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Code sx={{ fontSize: 18 }} />
              Activity Log
            </Typography>
            <Box sx={{ 
              fontFamily: 'monospace', 
              fontSize: '0.75rem',
              color: '#888',
              '& > div': { py: 0.5, borderBottom: '1px solid #2A2A2A' }
            }}>
              {logs.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                  No activity yet. Start the browser to begin.
                </Typography>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))
              )}
            </Box>
          </Paper>
        </Box>

        <Paper sx={{ p: 2, bgcolor: '#1A1A1A', border: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Typography variant="subtitle2" sx={{ color: '#00F3FF', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Monitor sx={{ fontSize: 18 }} />
            Live Browser View
          </Typography>
          <Box sx={{ 
            flex: 1,
            bgcolor: '#0A0A0A',
            borderRadius: 1,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 0,
            position: 'relative'
          }}>
            {screenshot ? (
              <img 
                src={screenshot.startsWith('data:') ? screenshot : `data:image/png;base64,${screenshot}`}
                alt="Browser screenshot"
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <Box sx={{ textAlign: 'center', color: '#666' }}>
                <Visibility sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                <Typography variant="body2">
                  {browserStatus === 'connected' ? 'Waiting for screenshot...' : 'Start browser to view live feed'}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
