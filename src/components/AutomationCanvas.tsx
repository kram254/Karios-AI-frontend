import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, IconButton, Typography, Chip, LinearProgress, Button } from '@mui/material';
import { PlayArrow, Pause, Stop, Visibility, Settings, CheckCircle, Error } from '@mui/icons-material';

interface AutomationCanvasProps {
  taskId?: string;
  onTaskUpdate?: (task: any) => void;
}

export const AutomationCanvas: React.FC<AutomationCanvasProps> = ({
  taskId,
  onTaskUpdate
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [screenshot, setScreenshot] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [task, setTask] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionId = useRef(`session_${Date.now()}`);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [automationSessionId, setAutomationSessionId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (sessionInitialized && automationSessionId) {
      initializeWebSocket();
    }
  }, [sessionInitialized, automationSessionId]);

  const initializeWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    
    const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
    const sessionIdToUse = automationSessionId || sessionId.current;
    const wsUrl = `${BACKEND_URL.replace('http', 'ws')}/api/web-automation/ws/automation/${sessionIdToUse}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'session_started') {
            addLog('✓ Browser session started');
            setSessionInitialized(true);
          } else if (data.type === 'task_created') {
            setTask(data.payload?.task || data.payload);
            if (onTaskUpdate) onTaskUpdate(data.payload?.task || data.payload);
          } else if (data.type === 'plan_created') {
            const stepsData = data.payload?.steps || [];
            setSteps(stepsData);
            addLog(`Plan created with ${stepsData.length} steps`);
          } else if (data.type === 'execution_started') {
            setIsRunning(true);
            addLog('Starting workflow execution...');
          } else if (data.type === 'step_started' || data.type === 'workflow_step_started') {
            const stepIndex = data.payload?.stepIndex ?? data.payload?.step_index ?? 0;
            const stepDesc = data.payload?.step?.description || data.payload?.description || 'Executing step';
            setCurrentStep(stepIndex);
            setIsRunning(true);
            addLog(`Starting step ${stepIndex + 1}: ${stepDesc}`);
          } else if (data.type === 'step_completed' || data.type === 'workflow_step_completed') {
            const stepIndex = data.payload?.stepIndex ?? data.payload?.step_index ?? 0;
            const stepDesc = data.payload?.step?.description || data.payload?.description || 'Step';
            const completedSteps = stepIndex + 1;
            if (steps.length > 0) {
              setProgress((completedSteps / steps.length) * 100);
            }
            addLog(`✓ Completed step ${completedSteps}: ${stepDesc}`);
          } else if (data.type === 'screenshot_taken' || data.type === 'screenshot') {
            const screenshotData = data.payload?.screenshot || data.screenshot || data.payload?.image;
            if (screenshotData) {
              setScreenshot(screenshotData);
              addLog('📸 Screenshot captured');
            }
          } else if (data.type === 'status_updated' || data.type === 'workflow_completed') {
            const status = data.payload?.status || data.status;
            if (status === 'completed' || data.type === 'workflow_completed') {
              setIsRunning(false);
              setProgress(100);
              addLog('🎉 Task completed successfully!');
            } else if (status === 'failed') {
              setIsRunning(false);
              addLog('❌ Task failed');
            }
          } else if (data.type === 'workflow_status_update') {
            const message = data.payload?.message || data.message || '';
            if (message) {
              addLog(message);
            }
          } else if (data.type === 'error' || data.type === 'workflow_error') {
            const errorMsg = data.payload?.error || data.error || 'An error occurred';
            addLog(`❌ Error: ${errorMsg}`);
            setIsRunning(false);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };
      
      wsRef.current.onopen = () => {
        addLog('Connected to automation server');
        if (!sessionInitialized) {
          setTimeout(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
          }, 1000);
        }
      };
      
      wsRef.current.onerror = (error) => {
        addLog('⚠️ Connection error');
      };

      wsRef.current.onclose = () => {
        addLog('Connection closed');
      };
      
    } catch (error) {
      addLog('❌ Failed to connect to automation server');
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handlePlayPause = async () => {
    if (!taskId) return;
    
    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const endpoint = isRunning ? 'pause' : 'resume';
      
      await fetch(`${BACKEND_URL}/api/web-automation/task/${taskId}/${endpoint}`, {
        method: 'POST'
      });
      
      setIsRunning(!isRunning);
    } catch (error) {
      addLog(`Failed to ${isRunning ? 'pause' : 'resume'} task`);
    }
  };

  const handleStop = async () => {
    if (!taskId && !automationSessionId) return;
    
    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      if (taskId) {
        await fetch(`${BACKEND_URL}/api/web-automation/task/${taskId}/pause`, {
          method: 'POST'
        });
      }
      
      setIsRunning(false);
      addLog('Task stopped');
    } catch (error) {
      addLog('Failed to stop task');
    }
  };

  const handleStartSession = () => {
    const newSessionId = `session_${Date.now()}`;
    setAutomationSessionId(newSessionId);
    setSessionInitialized(true);
    addLog('Initializing browser session...');
    
    window.dispatchEvent(new CustomEvent('automation:start', {
      detail: { sessionId: newSessionId }
    }));
  };

  useEffect(() => {
    const handleAutomationEvent = (e: any) => {
      const { sessionId: eventSessionId } = e.detail || {};
      if (eventSessionId) {
        setAutomationSessionId(eventSessionId);
        setSessionInitialized(true);
        addLog('Browser session connected');
      }
    };

    window.addEventListener('automation:session-started', handleAutomationEvent as EventListener);
    window.addEventListener('automation:start', handleAutomationEvent as EventListener);
    
    return () => {
      window.removeEventListener('automation:session-started', handleAutomationEvent as EventListener);
      window.removeEventListener('automation:start', handleAutomationEvent as EventListener);
    };
  }, []);

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#0a0a0a'
    }}>
      <Paper sx={{ 
        p: 2, 
        bgcolor: '#1a1a1a', 
        borderRadius: 0,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ color: 'white' }}>
            Automation Canvas
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              onClick={() => setIsRunning(!isRunning)}
              sx={{ color: isRunning ? '#ff9800' : '#4caf50' }}
            >
              {isRunning ? <Pause /> : <PlayArrow />}
            </IconButton>
            <IconButton sx={{ color: '#f44336' }}>
              <Stop />
            </IconButton>
            <IconButton sx={{ color: '#2196f3' }}>
              <Visibility />
            </IconButton>
            <IconButton sx={{ color: '#9e9e9e' }}>
              <Settings />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ flex: 1, display: 'flex' }}>
        <Box sx={{ 
          flex: 1, 
          position: 'relative',
          bgcolor: '#000',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {screenshot ? (
            <img 
              src={screenshot.startsWith('data:') ? screenshot : `data:image/png;base64,${screenshot}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              alt="Browser view"
            />
          ) : !sessionInitialized ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              gap: 2
            }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
                Start an automation session
              </Typography>
              <Button
                variant="contained"
                onClick={handleStartSession}
                startIcon={<PlayArrow />}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  px: 4,
                  py: 1.5
                }}
              >
                Start Session
              </Button>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(255,255,255,0.5)'
            }}>
              <Typography>Waiting for automation to begin...</Typography>
            </Box>
          )}
        </Box>

        <Paper sx={{ 
          width: 300, 
          bgcolor: '#1a1a1a',
          borderRadius: 0,
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="h6" sx={{ color: 'white' }}>Execution Log</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 1, overflow: 'auto' }}>
            {logs.map((log, index) => (
              <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {log}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AutomationCanvas;
