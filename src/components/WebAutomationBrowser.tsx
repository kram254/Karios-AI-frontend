import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Paper, IconButton, TextField, Button, Typography, Chip, LinearProgress } from '@mui/material';
import { PlayArrow, Pause, Stop, Refresh, Screenshot, Visibility, VisibilityOff } from '@mui/icons-material';

interface WebAutomationAction {
  id: string;
  type: string;
  target?: string;
  value?: string;
  coordinates?: [number, number];
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: string;
  screenshot?: string;
}

interface WebAutomationSession {
  sessionId: string;
  url: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  actions: WebAutomationAction[];
  currentActionIndex: number;
  screenshots: string[];
}

interface WebAutomationBrowserProps {
  onActionExecute?: (action: WebAutomationAction) => void;
  onSessionUpdate?: (session: WebAutomationSession) => void;
  initialUrl?: string;
  sessionId?: string;
}

export const WebAutomationBrowser: React.FC<WebAutomationBrowserProps> = ({
  onActionExecute,
  onSessionUpdate,
  initialUrl = 'about:blank',
  sessionId
}) => {
  const [session, setSession] = useState<WebAutomationSession>({
    sessionId: sessionId || `session_${Date.now()}`,
    url: initialUrl,
    status: 'idle',
    actions: [],
    currentActionIndex: -1,
    screenshots: []
  });
  
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [isVisible, setIsVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [currentScreenshot, setCurrentScreenshot] = useState<string>('');
  const [actionOverlay, setActionOverlay] = useState<{x: number, y: number, type: string} | null>(null);
  
  const browserFrameRef = useRef<HTMLDivElement>(null);
  const screenshotCanvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const sid = sessionId || session.sessionId;
    const ws = new WebSocket(`${wsProtocol}//${wsHost}/api/web-automation/ws/automation/${sid}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected for automation session');
      try {
        ws.send(JSON.stringify({ type: 'get_status' }));
      } catch {}
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    wsRef.current = ws;
  };

  useEffect(() => {
    if (!sessionId) return;
    if (session.sessionId !== sessionId) {
      setSession(prev => ({ ...prev, sessionId }));
      initializeWebSocket();
    }
  }, [sessionId]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'status_update':
        setSession(prev => ({
          ...prev,
          status: data.status || prev.status,
          url: typeof data.url === 'string' ? data.url : prev.url
        }));
        break;
      case 'screenshot_update':
        setCurrentScreenshot(data.screenshot);
        break;
      case 'action_started':
        setSession(prev => {
          const exists = prev.actions.some(a => a.id === data.actionId);
          if (exists) return prev;
          const newAction: WebAutomationAction = {
            id: data.actionId,
            type: data.actionType || 'action',
            target: undefined,
            value: undefined,
            coordinates: Array.isArray(data.coordinates) ? [data.coordinates[0], data.coordinates[1]] : undefined,
            status: 'executing',
            timestamp: new Date().toISOString()
          };
          return { ...prev, actions: [...prev.actions, newAction] };
        });
        updateActionStatus(data.actionId, 'executing');
        if (data.coordinates) {
          setActionOverlay({
            x: data.coordinates[0],
            y: data.coordinates[1],
            type: data.actionType
          });
        }
        break;
      case 'action_completed':
        setSession(prev => {
          const exists = prev.actions.some(a => a.id === data.actionId);
          if (!exists) {
            const newAction: WebAutomationAction = {
              id: data.actionId,
              type: data.actionType || 'action',
              status: 'completed',
              timestamp: new Date().toISOString()
            } as WebAutomationAction;
            return { ...prev, actions: [...prev.actions, newAction] };
          }
          return prev;
        });
        updateActionStatus(data.actionId, 'completed');
        setActionOverlay(null);
        break;
      case 'action_failed':
        setSession(prev => {
          const exists = prev.actions.some(a => a.id === data.actionId);
          if (!exists) {
            const newAction: WebAutomationAction = {
              id: data.actionId,
              type: data.actionType || 'action',
              status: 'failed',
              timestamp: new Date().toISOString()
            } as WebAutomationAction;
            return { ...prev, actions: [...prev.actions, newAction] };
          }
          return prev;
        });
        updateActionStatus(data.actionId, 'failed');
        setActionOverlay(null);
        break;
      case 'session_update':
        setSession(prev => ({ ...prev, ...data.session }));
        break;
    }
  };

  const updateActionStatus = (actionId: string, status: WebAutomationAction['status']) => {
    setSession(prev => ({
      ...prev,
      actions: prev.actions.map(action =>
        action.id === actionId ? { ...action, status } : action
      )
    }));
  };

  const startAutomation = async () => {
    try {
      setSession(prev => ({ ...prev, status: 'running' }));
      
      const response = await fetch('/api/web-automation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          url: currentUrl,
          visible: isVisible
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Automation started:', result);
      }
    } catch (error) {
      console.error('Failed to start automation:', error);
      setSession(prev => ({ ...prev, status: 'error' }));
    }
  };

  const pauseAutomation = async () => {
    try {
      const response = await fetch('/api/web-automation/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId })
      });
      
      if (response.ok) {
        setSession(prev => ({ ...prev, status: 'paused' }));
      }
    } catch (error) {
      console.error('Failed to pause automation:', error);
    }
  };

  const stopAutomation = async () => {
    try {
      const response = await fetch('/api/web-automation/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId })
      });
      
      if (response.ok) {
        setSession(prev => ({ 
          ...prev, 
          status: 'idle',
          currentActionIndex: -1
        }));
        setActionOverlay(null);
      }
    } catch (error) {
      console.error('Failed to stop automation:', error);
    }
  };

  const takeScreenshot = async () => {
    try {
      const response = await fetch('/api/web-automation/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId })
      });
      
      if (response.ok) {
        const result = await response.json();
        setCurrentScreenshot(result.screenshot);
        setSession(prev => ({
          ...prev,
          screenshots: [...prev.screenshots, result.screenshot]
        }));
      }
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  };

  const navigateToUrl = async () => {
    try {
      const response = await fetch('/api/web-automation/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          url: currentUrl
        })
      });
      
      if (response.ok) {
        setSession(prev => ({ ...prev, url: currentUrl }));
      }
    } catch (error) {
      console.error('Failed to navigate:', error);
    }
  };

  const addAction = (actionType: string, target?: string, value?: string, coordinates?: [number, number]) => {
    const newAction: WebAutomationAction = {
      id: `action_${Date.now()}`,
      type: actionType,
      target,
      value,
      coordinates,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    setSession(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));

    if (onActionExecute) {
      onActionExecute(newAction);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isRecording) return;

    const canvas = screenshotCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((event.clientY - rect.top) * (canvas.height / rect.height));

    addAction('click', undefined, undefined, [x, y]);
  };

  const renderActionOverlay = () => {
    if (!actionOverlay || !screenshotCanvasRef.current) return null;

    const canvas = screenshotCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (actionOverlay.x / canvas.width) * rect.width;
    const y = (actionOverlay.y / canvas.height) * rect.height;

    return (
      <Box
        sx={{
          position: 'absolute',
          left: x - 10,
          top: y - 10,
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: actionOverlay.type === 'click' ? '#ff4444' : '#44ff44',
          border: '2px solid white',
          animation: 'pulse 1s infinite',
          pointerEvents: 'none',
          zIndex: 10
        }}
      />
    );
  };

  useEffect(() => {
    if (currentScreenshot && screenshotCanvasRef.current) {
      const canvas = screenshotCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
      
      img.src = `data:image/png;base64,${currentScreenshot}`;
    }
  }, [currentScreenshot]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#1a1a1a' }}>
      <Paper sx={{ p: 2, mb: 1, bgcolor: '#2a2a2a', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && navigateToUrl()}
            placeholder="Enter URL..."
            size="small"
            sx={{ 
              flex: 1,
              '& .MuiOutlinedInput-root': { color: 'white' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' }
            }}
          />
          <Button onClick={navigateToUrl} variant="outlined" size="small">
            Go
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={session.status === 'running' ? pauseAutomation : startAutomation}
            disabled={session.status === 'error'}
            sx={{ color: session.status === 'running' ? '#ff9800' : '#4caf50' }}
          >
            {session.status === 'running' ? <Pause /> : <PlayArrow />}
          </IconButton>
          
          <IconButton onClick={stopAutomation} sx={{ color: '#f44336' }}>
            <Stop />
          </IconButton>
          
          <IconButton onClick={takeScreenshot} sx={{ color: '#2196f3' }}>
            <Screenshot />
          </IconButton>
          
          <IconButton
            onClick={() => setIsVisible(!isVisible)}
            sx={{ color: isVisible ? '#4caf50' : '#757575' }}
          >
            {isVisible ? <Visibility /> : <VisibilityOff />}
          </IconButton>
          
          <Button
            onClick={() => setIsRecording(!isRecording)}
            variant={isRecording ? 'contained' : 'outlined'}
            size="small"
            color={isRecording ? 'error' : 'primary'}
          >
            {isRecording ? 'Stop Recording' : 'Record Actions'}
          </Button>

          <Chip
            label={session.status.toUpperCase()}
            color={
              session.status === 'running' ? 'success' :
              session.status === 'error' ? 'error' :
              session.status === 'paused' ? 'warning' : 'default'
            }
            size="small"
          />
        </Box>

        {session.status === 'running' && (
          <LinearProgress 
            sx={{ mt: 1, bgcolor: '#333', '& .MuiLinearProgress-bar': { bgcolor: '#00f3ff' } }}
            value={executionProgress}
            variant="determinate"
          />
        )}
      </Paper>

      <Box sx={{ display: 'flex', flex: 1, gap: 1 }}>
        <Paper sx={{ flex: 1, p: 1, bgcolor: '#2a2a2a', position: 'relative' }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            Browser View
          </Typography>
          
          <Box
            ref={browserFrameRef}
            sx={{
              width: '100%',
              height: 'calc(100% - 40px)',
              border: '1px solid #555',
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative',
              bgcolor: '#000'
            }}
          >
            {currentScreenshot ? (
              <>
                <canvas
                  ref={screenshotCanvasRef}
                  onClick={handleCanvasClick}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    cursor: isRecording ? 'crosshair' : 'default'
                  }}
                />
                {renderActionOverlay()}
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#666'
                }}
              >
                <Typography>No browser session active</Typography>
              </Box>
            )}
          </Box>
        </Paper>

        <Paper sx={{ width: 200, p: 1, bgcolor: '#2a2a2a', overflow: 'hidden' }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            Actions Queue ({session.actions.length})
          </Typography>
          
          <Box sx={{ height: 'calc(100% - 40px)', overflow: 'auto' }}>
            {session.actions.map((action, index) => (
              <Paper
                key={action.id}
                sx={{
                  p: 1,
                  mb: 1,
                  bgcolor: action.status === 'executing' ? '#1a4d1a' :
                           action.status === 'completed' ? '#0d4f0d' :
                           action.status === 'failed' ? '#4d1a1a' : '#333',
                  border: index === session.currentActionIndex ? '2px solid #00f3ff' : 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip
                    label={action.type}
                    size="small"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                  <Chip
                    label={action.status}
                    size="small"
                    color={
                      action.status === 'completed' ? 'success' :
                      action.status === 'failed' ? 'error' :
                      action.status === 'executing' ? 'warning' : 'default'
                    }
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                </Box>
                
                {action.target && (
                  <Typography variant="caption" sx={{ color: '#ccc', display: 'block' }}>
                    Target: {action.target}
                  </Typography>
                )}
                
                {action.value && (
                  <Typography variant="caption" sx={{ color: '#ccc', display: 'block' }}>
                    Value: {action.value}
                  </Typography>
                )}
                
                {action.coordinates && (
                  <Typography variant="caption" sx={{ color: '#ccc', display: 'block' }}>
                    Coords: ({action.coordinates[0]}, {action.coordinates[1]})
                  </Typography>
                )}
              </Paper>
            ))}
          </Box>
        </Paper>
      </Box>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default WebAutomationBrowser;
