import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  IconButton,
  Chip,
  TextField,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Visibility,
  VisibilityOff,
  Screenshot
} from '@mui/icons-material';

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || window.location.origin;


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

interface WorkflowStep {
  id: number | string;
  description: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details?: any;
}

interface WebAutomationSession {
  sessionId: string;
  url: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  actions: WebAutomationAction[];
  currentActionIndex: number;
  screenshots: string[];
  results?: any;
  score?: number;
}

interface WebAutomationBrowserProps {
  onActionExecute?: (action: WebAutomationAction) => void;
  onSessionUpdate?: (session: WebAutomationSession) => void;
  onClose?: () => void;
  initialUrl?: string;
  sessionId?: string;
}

export const WebAutomationBrowser: React.FC<WebAutomationBrowserProps> = ({
  onActionExecute,
  onSessionUpdate,
  onClose,
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
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastError, setLastError] = useState<any>(null);
  const [currentScreenshot, setCurrentScreenshot] = useState<string>('');
  const [actionOverlay, setActionOverlay] = useState<{x?: number, y?: number, type: string, message?: string, stepType?: string} | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [realTimeSteps, setRealTimeSteps] = useState<any[]>([]);
  const [currentExecutingStep, setCurrentExecutingStep] = useState(-1);

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
    console.log('🔌 WS_INIT - Starting WebSocket initialization');
    console.log('🔌 WS_INIT - Current sessionId:', sessionId);
    console.log('🔌 WS_INIT - Session object sessionId:', session.sessionId);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('🔌 WS_INIT - WebSocket already open, skipping initialization');
      return;
    }
    if (wsRef.current) {
      console.log('🔌 WS_INIT - Closing existing WebSocket connection');
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    const sid = sessionId || session.sessionId;
    console.log('🔌 WS_INIT - Using session ID:', sid);
    let wsUrl: string;
    try {
      const base = new URL(BACKEND_URL);
      const wsProto = base.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProto}//${base.host}/api/web-automation/ws/automation/${sid}`;
      console.log('🔌 WS_INIT - Generated WebSocket URL from BACKEND_URL:', wsUrl);
    } catch {
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProto}//${window.location.host}/api/web-automation/ws/automation/${sid}`;
      console.log('🔌 WS_INIT - Generated WebSocket URL from window.location:', wsUrl);
    }
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('🔌 WS_OPEN - WebSocket connected successfully for session:', sid);
      console.log('🔌 WS_OPEN - WebSocket readyState:', ws.readyState);
      setTimeout(() => {
        try {
          console.log('🔌 WS_OPEN - Sending get_status request');
          ws.send(JSON.stringify({ type: 'get_status' }));
        } catch (e) {
          console.error('🔌 WS_OPEN - Failed to send get_status:', e);
        }
      }, 100);
      
      // Start heartbeat to maintain connection
      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ type: 'ping' }));
          } catch (e) {
            console.error('Failed to send ping:', e);
            clearInterval(heartbeatInterval);
          }
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 45000); // Send ping every 45 seconds
      
      // Store interval reference for cleanup
      (ws as any).heartbeatInterval = heartbeatInterval;
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🔌 WS_MESSAGE - Received message type:', data.type);
        console.log('🔌 WS_MESSAGE - Full message data:', data);
        handleWebSocketMessage(data);
      } catch (e) {
        console.error('🔌 WS_MESSAGE - Parse error:', e);
        console.error('🔌 WS_MESSAGE - Raw event data:', event.data);
      }
    };
    
    ws.onclose = (event) => {
      console.log('🔌 WS_CLOSE - WebSocket disconnected');
      console.log('🔌 WS_CLOSE - Code:', event.code);
      console.log('🔌 WS_CLOSE - Reason:', event.reason);
      console.log('🔌 WS_CLOSE - Was clean:', event.wasClean);
      
      // Clear heartbeat interval
      if ((ws as any).heartbeatInterval) {
        clearInterval((ws as any).heartbeatInterval);
      }
      
      // Only reconnect if not a normal closure and session is still active
      if (event.code !== 1000 && event.code !== 1001 && sessionId && wsRef.current === ws) {
        console.log('WebSocket closed unexpectedly, attempting reconnection in 5 seconds...');
        setTimeout(() => {
          if (sessionId && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
            console.log('Attempting WebSocket reconnection...');
            initializeWebSocket();
          }
        }, 5000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsRef.current = ws;
  };

  useEffect(() => {
    if (!sessionId) return;
    if (session.sessionId !== sessionId) {
      setSession(prev => ({ ...prev, sessionId }));
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        initializeWebSocket();
      }
    }
  }, [sessionId]);


  const handleWebSocketMessage = (data: any) => {
    console.log('📨 WS_HANDLER - Processing message type:', data.type);
    switch (data.type) {
      case 'plan_created':
        console.log('📨 PLAN_CREATED - Received plan creation message');
        console.log('📨 PLAN_CREATED - Plan data:', data.plan);
        if (data.plan && data.plan.steps) {
          console.log('📨 PLAN_CREATED - Processing', data.plan.steps.length, 'steps');
          const steps = data.plan.steps.map((step: any, index: number) => ({
            id: step.id || (index + 1),
            description: step.description || step.title || `Step ${index + 1}`,
            action: step.action || step.action_type || 'unknown',
            status: step.status || 'pending',
            details: step.details || {}
          }));
          console.log('📨 PLAN_CREATED - Mapped steps:', steps);
          setRealTimeSteps(steps);
          setWorkflowSteps(data.plan.steps);
          setCurrentStepIndex(-1);
          setExecutionProgress(5);
          console.log('📨 PLAN_CREATED - State updated with plan data');
        } else {
          console.warn('📨 PLAN_CREATED - No plan or steps in message');
        }
        break;
        
      case 'workflow_step_started':
        if (data.step_number !== undefined) {
          setCurrentStepIndex(data.step_number - 1);
          setCurrentExecutingStep(data.step_number - 1);
          setExecutionProgress(Math.min(((data.step_number - 1) / Math.max(workflowSteps.length, 1)) * 100, 95));
          setRealTimeSteps(prev => prev.map((step, index) => 
            index === data.step_number - 1 
              ? { ...step, status: 'running' }
              : step
          ));
        }
        break;
        
      case 'workflow_step_completed':
        if (data.step_number !== undefined) {
          setCurrentStepIndex(data.step_number);
          const progress = data.total_steps > 0 ? (data.step_number / data.total_steps) * 100 : 0;
          setExecutionProgress(Math.min(progress, 95));
          setRealTimeSteps(prev => prev.map((step, index) => 
            index === data.step_number - 1 
              ? { ...step, status: 'completed' }
              : step
          ));
          if (data.screenshot) {
            setCurrentScreenshot(data.screenshot);
          }
        }
        break;
      case 'workflow_step_failed':
        console.warn('⚠️ WORKFLOW_STEP_FAILED:', data);
        if (data.step_number !== undefined) {
          setCurrentStepIndex(data.step_number);
          setRealTimeSteps(prev => prev.map((step, index) => 
            index === data.step_number - 1 
              ? { ...step, status: 'failed' }
              : step
          ));
        }
        setActionOverlay({
          type: 'error',
          message: data.message || `Step ${data.step_number} failed`,
          stepType: data.step_type
        });
        break;
        
      case 'step_started':
        if (data.step_index !== undefined) {
          setCurrentStepIndex(data.step_index);
        }
        break;
        
      case 'step_completed':
        if (data.step_index !== undefined) {
          setCurrentStepIndex(data.step_index + 1);
        }
        break;
        
      case 'execution_started':
        setCurrentStepIndex(0);
        setExecutionProgress(10);
        setSession(prev => {
          const next = { ...prev, status: 'running' as const };
          if (onSessionUpdate) onSessionUpdate(next);
          return next;
        });
        break;
        
      case 'workflow_completed':
        console.log('🎯 WORKFLOW_COMPLETED - Received workflow completion event:', data);
        setCurrentStepIndex(data.total_steps || workflowSteps.length);
        setExecutionProgress(100);
        setSession(prev => {
          const next = {
            ...prev,
            status: 'completed' as const,
            results: (data.results ?? data.result ?? prev.results),
            score: (typeof data.score === 'number' ? data.score : (data.results?.score ?? data.result?.score ?? prev.score))
          };
          if (onSessionUpdate) onSessionUpdate(next);
          return next;
        });
        
        const score = (typeof data.score === 'number' ? data.score : (data.results?.score ?? data.result?.score ?? 0));
        console.log('🎯 WORKFLOW_COMPLETED - Score received:', score);
        
        setActionOverlay({
          type: data.overall_success !== false ? 'success' : 'warning',
          message: `Workflow completed: ${data.successful_steps || 0}/${data.total_steps || 0} steps (${data.success_rate?.toFixed(1) || score}%)`,
          stepType: 'complete'
        });
        setTimeout(() => setActionOverlay(null), 3000);
        
        if (score >= 92) {
          console.log('🎯 WORKFLOW_COMPLETED - High score detected, auto-minimizing window');
          if (onClose) {
            setTimeout(() => {
              onClose();
            }, 2000);
          }
        }
        break;
        
      case 'status_update':
        setSession(prev => {
          const incoming = typeof data.status === 'string' ? data.status : prev.status;
          const mapped = (incoming === 'inactive' || incoming === 'stopped' || incoming === 'completed')
            ? 'idle'
            : ((incoming === 'initializing' || incoming === 'planning' || incoming === 'executing_workflow') ? 'running' : incoming);
          const next = {
            ...prev,
            status: mapped as WebAutomationSession['status'],
            url: typeof data.url === 'string' ? data.url : prev.url
          };
          if (onSessionUpdate) onSessionUpdate(next);
          return next;
        });
        break;
      case 'screenshot_update':
        setCurrentScreenshot(data.screenshot);
        break;
      case 'connection_established':
        // Sync sessionId from server and notify parent
        setSession(prev => {
          const next = { ...prev, sessionId: data.sessionId || prev.sessionId };
          if (onSessionUpdate) onSessionUpdate(next);
          return next;
        });
        break;
        
      case 'browser_initializing':
        setActionOverlay({
          type: 'loading',
          message: data.message || 'Initializing browser...',
          stepType: 'browser_init'
        });
        break;
        
      case 'browser_ready':
        setActionOverlay({
          type: 'success',
          message: data.message || 'Browser ready',
          stepType: 'browser_init'
        });
        setTimeout(() => setActionOverlay(null), 1500);
        break;
        
      case 'browser_fallback':
        setActionOverlay({
          type: 'warning',
          message: data.message || 'Using fallback mode',
          stepType: 'browser_init'
        });
        setTimeout(() => setActionOverlay(null), 2000);
        break;
        
      case 'action_started':
        setActionOverlay({
          type: 'executing',
          message: data.message || `${data.action}: ${data.target}`,
          stepType: data.action
        });
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
        if (data.screenshot) {
          setCurrentScreenshot(data.screenshot);
        }
        setActionOverlay({
          type: 'success',
          message: data.message || `${data.action} completed`,
          stepType: data.action
        });
        setTimeout(() => setActionOverlay(null), 1500);
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
        break;
        
      case 'pong':
        console.log('WebSocket heartbeat pong received');
        break;
        
      case 'keep_alive':
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({ type: 'keep_alive_response' }));
          } catch (e) {
            console.error('Failed to send keep_alive_response:', e);
          }
        }
        break;
        
      case 'keep_alive_response':
        console.log('WebSocket keep-alive response received');
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
        setSession(prev => {
          const incoming = typeof data?.session?.status === 'string' ? data.session.status : prev.status;
          const mapped = (incoming === 'inactive' || incoming === 'stopped' || incoming === 'completed')
            ? 'idle'
            : ((incoming === 'initializing' || incoming === 'planning' || incoming === 'executing_workflow') ? 'running' : incoming);
          const next = { ...prev, ...data.session, status: mapped as WebAutomationSession['status'] };
          if (onSessionUpdate) onSessionUpdate(next);
          return next;
        });
        break;
      case 'workflow_error':
        console.warn('⚠️ WORKFLOW_ERROR:', data);
        setErrorMessage(data.error || data.message || 'Workflow error occurred');
        setLastError(data);
        setSession(prev => {
          const next = { ...prev, status: 'error' as const };
          if (onSessionUpdate) onSessionUpdate(next);
          return next;
        });
        setActionOverlay(null);
        if (data.step_index !== undefined) {
          setCurrentStepIndex(data.step_index);
        }
        break;
      case 'quality_improvement_completed':
        console.log('✅ QUALITY_IMPROVEMENT_COMPLETED:', data);
        break;
      default:
        console.log('ℹ️ Unrecognized WebSocket message type in Browser:', data?.type, data);
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
    console.log('🚀 START_AUTOMATION - Beginning automation start process');
    console.log('🚀 START_AUTOMATION - Session ID:', session.sessionId);
    console.log('🚀 START_AUTOMATION - Current URL:', currentUrl);
    console.log('🚀 START_AUTOMATION - Visible mode:', isVisible);

    setIsStarting(true);
    setErrorMessage('');

    try {
      const requestPayload = {
        sessionId: session.sessionId,
        url: currentUrl || 'about:blank',
        visible: isVisible,
        task_description: 'Manual automation session'
      };
      console.log('🚀 START_AUTOMATION - Request payload:', requestPayload);

      const response = await fetch(`${BACKEND_URL}/api/web-automation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      console.log('🚀 START_AUTOMATION - Response status:', response.status);
      console.log('🚀 START_AUTOMATION - Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('🚀 START_AUTOMATION - Response data:', result);
        console.log('🚀 START_AUTOMATION - Automation started successfully');
        console.log('🚀 START_AUTOMATION - New session status:', result.status);
        setSession(prev => ({ ...prev, status: result.status || 'running' }));
      } else {
        const errorText = await response.text();
        console.error('🚀 START_AUTOMATION - HTTP Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to start automation:', error);
      setErrorMessage(`Failed to start automation: ${error instanceof Error ? error.message : String(error)}`);
      setSession(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsStarting(false);
    }
  };


  const stopAutomation = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/web-automation/stop`, {
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
        setExecutionProgress(0);
      }
    } catch (error) {
      console.error('Failed to stop automation:', error);
    }
  };

  const takeScreenshot = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/web-automation/screenshot`, {
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

  const handleNavigate = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/web-automation/navigate`, {
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

  const handleStart = () => {
    startAutomation();
  };

  const handlePause = () => {
    setSession(prev => ({ ...prev, status: 'paused' }));
  };

  const handleStop = () => {
    stopAutomation();
  };

  const handleTakeScreenshot = () => {
    takeScreenshot();
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
    if (actionOverlay.x === undefined || actionOverlay.y === undefined) return null;

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
            className="neon-input"
            size="small"
            placeholder="Enter URL..."
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
            sx={{ flex: 1 }}
          />
          <Button
            className="neon-btn-primary"
            variant="contained"
            onClick={handleNavigate}
            size="small"
          >
            Go
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            className="neon-btn-primary"
            variant="contained"
            startIcon={session.status === 'running' ? <Pause /> : <PlayArrow />}
            onClick={session.status === 'running' ? handlePause : handleStart}
            disabled={session.status === 'error' || isStarting}
          >
            {isStarting ? 'Starting...' : (session.status === 'running' ? 'Pause' : 'Start')}
          </Button>
          
          <Button
            className="neon-btn-secondary"
            variant="outlined"
            startIcon={<Stop />}
            onClick={handleStop}
            disabled={session.status === 'idle'}
          >
            Stop
          </Button>
          
          <IconButton onClick={handleTakeScreenshot} sx={{ color: '#2196f3' }}>
            <Screenshot />
          </IconButton>
          
          <Button
            className="neon-btn-secondary"
            variant="outlined"
            startIcon={isVisible ? <VisibilityOff /> : <Visibility />}
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? 'Hide' : 'Show'}
          </Button>
          
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

        {(session.status === 'running' || session.status === 'paused') && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#ccc' }}>
                {currentStepIndex >= 0 && workflowSteps.length > 0 
                  ? `Step ${currentStepIndex + 1} of ${workflowSteps.length}` 
                  : 'Initializing...'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#00f3ff' }}>
                {executionProgress.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              sx={{ 
                bgcolor: '#333', 
                '& .MuiLinearProgress-bar': { bgcolor: '#00f3ff' },
                height: 6,
                borderRadius: 3
              }}
              value={executionProgress}
              variant="determinate"
            />
            {currentStepIndex >= 0 && workflowSteps[currentStepIndex] && (
              <Typography variant="caption" sx={{ color: '#aaa', mt: 0.5, display: 'block' }}>
                {workflowSteps[currentStepIndex].description || workflowSteps[currentStepIndex].action || 'Processing...'}
              </Typography>
            )}
          </Box>
        )}

        {session.status === 'error' && errorMessage && (
          <Box sx={{ 
            mt: 1, 
            p: 1, 
            bgcolor: '#4d1a1a', 
            border: '1px solid #ff4444',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="body2" sx={{ color: '#ff9999', flex: 1 }}>
              ❌ {errorMessage}
            </Typography>
            <Button
              size="small"
              onClick={() => setErrorMessage('')}
              sx={{ color: '#ff9999', minWidth: 'auto', p: 0.5 }}
            >
              ✕
            </Button>
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'flex', flex: 1, gap: 1 }}>
        <Paper className="neon-card" sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            Browser View
          </Typography>
          
          <Box
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

        <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {realTimeSteps.length > 0 && (
            <Paper className="neon-card" sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                🎯 Automation Progress
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#00f3ff' }}>
                  {realTimeSteps.filter(s => s.status === 'completed').length} / {realTimeSteps.length} completed
                </Typography>
              </Box>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {realTimeSteps.map((step, index) => (
                  <Box
                    key={step.id}
                    sx={{
                      mb: 1,
                      p: 1.5,
                      border: currentExecutingStep === index ? '2px solid #00f3ff' : '1px solid #444',
                      borderRadius: 1,
                      bgcolor: step.status === 'completed' ? '#0d4f0d' : 
                               step.status === 'running' ? '#4d4d1a' : '#333',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                  >
                    {step.status === 'running' && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        bgcolor: '#00f3ff',
                        animation: 'pulse 1.5s infinite'
                      }} />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: step.status === 'completed' ? '#4caf50' : 
                                 step.status === 'running' ? '#ff9800' : '#666',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {step.status === 'completed' ? '✓' : 
                         step.status === 'running' ? '⚡' : 
                         index + 1}
                      </Box>
                      <Chip
                        label={step.status.toUpperCase()}
                        size="small"
                        color={
                          step.status === 'completed' ? 'success' :
                          step.status === 'running' ? 'warning' : 'default'
                        }
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                      {step.description}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#aaa' }}>
                      Action: {step.action}
                    </Typography>
                    {step.details && Object.keys(step.details).length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {Object.entries(step.details).map(([key, value]) => (
                          <Chip
                            key={key}
                            label={`${key}: ${String(value)}`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mt: 0.5, fontSize: '0.6rem', height: 18 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
          
          <Paper className="neon-card">
            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
              Actions
            </Typography>
            {session.actions.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '60%', 
                color: '#666',
                flexDirection: 'column',
                gap: 1
              }}>
                <Typography variant="body2">No actions recorded yet</Typography>
                <Typography variant="caption">
                  Actions will appear here during automation
                </Typography>
              </Box>
            ) : (
              session.actions.map((action, index) => (
                <Paper
                  key={action.id}
                  sx={{
                    p: 1,
                    mb: 1,
                    bgcolor: action.status === 'executing' ? '#1a4d1a' :
                             action.status === 'completed' ? '#0d4f0d' :
                             action.status === 'failed' ? '#4d1a1a' : '#333',
                    border: index === session.currentActionIndex ? '2px solid #00f3ff' : 'none',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {action.status === 'executing' && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      bgcolor: '#00f3ff',
                      animation: 'pulse 1.5s infinite'
                    }} />
                  )}
                  
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
                    {index === session.currentActionIndex && (
                      <Chip
                        label="CURRENT"
                        size="small"
                        color="info"
                        sx={{ fontSize: '0.6rem', height: 18 }}
                      />
                    )}
                  </Box>
                  
                  {action.target && (
                    <Typography variant="caption" sx={{ 
                      color: '#ccc', 
                      display: 'block',
                      wordBreak: 'break-all',
                      maxWidth: '100%'
                    }}>
                      Target: {action.target}
                    </Typography>
                  )}
                  
                  {action.value && (
                    <Typography variant="caption" sx={{ 
                      color: '#ccc', 
                      display: 'block',
                      wordBreak: 'break-word'
                    }}>
                      Value: {action.value}
                    </Typography>
                  )}
                  
                  {action.coordinates && (
                    <Typography variant="caption" sx={{ color: '#ccc', display: 'block' }}>
                      Coords: ({action.coordinates[0]}, {action.coordinates[1]})
                    </Typography>
                  )}
                  
                  <Typography variant="caption" sx={{ 
                    color: '#888', 
                    display: 'block', 
                    mt: 0.5,
                    fontSize: '0.65rem'
                  }}>
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </Typography>
                </Paper>
              ))
            )}
          </Paper>
        </Box>
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
