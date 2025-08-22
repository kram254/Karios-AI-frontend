import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, IconButton, Typography, Chip, LinearProgress } from '@mui/material';
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

  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
    const wsUrl = `${BACKEND_URL.replace('http', 'ws')}/api/web-automation/ws/automation/${sessionId.current}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'task_created') {
          setTask(data.payload.task);
          if (onTaskUpdate) onTaskUpdate(data.payload.task);
        } else if (data.type === 'plan_created') {
          setSteps(data.payload.steps);
          addLog(`Plan created with ${data.payload.steps.length} steps`);
        } else if (data.type === 'step_started') {
          setCurrentStep(data.payload.stepIndex);
          setIsRunning(true);
          addLog(`Starting step ${data.payload.stepIndex + 1}: ${data.payload.step.description}`);
        } else if (data.type === 'step_completed') {
          const completedSteps = data.payload.stepIndex + 1;
          setProgress((completedSteps / steps.length) * 100);
          addLog(`✓ Completed step ${completedSteps}: ${data.payload.step.description}`);
        } else if (data.type === 'screenshot_taken') {
          setScreenshot(data.payload.screenshot);
        } else if (data.type === 'status_updated') {
          if (data.payload.status === 'completed') {
            setIsRunning(false);
            addLog('🎉 Task completed successfully!');
          } else if (data.payload.status === 'failed') {
            setIsRunning(false);
            addLog('❌ Task failed');
          }
        }
      };
      
      wsRef.current.onopen = () => {
        addLog('Connected to automation server');
      };
      
      wsRef.current.onerror = (error) => {
        addLog('Connection error');
      };
      
    } catch (error) {
      addLog('Failed to connect to automation server');
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
    if (!taskId) return;
    
    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      await fetch(`${BACKEND_URL}/api/web-automation/task/${taskId}/pause`, {
        method: 'POST'
      });
      
      setIsRunning(false);
      addLog('Task stopped');
    } catch (error) {
      addLog('Failed to stop task');
    }
  };

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
              src={`data:image/png;base64,${screenshot}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              alt="Browser view"
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(255,255,255,0.5)'
            }}>
              <Typography>Browser view will appear here</Typography>
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
