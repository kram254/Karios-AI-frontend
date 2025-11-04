import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Paper, IconButton, Typography, Chip, LinearProgress, Button, Card, CardContent } from '@mui/material';
import { PlayArrow, Pause, Stop, Visibility, Settings, CheckCircle, Error, Download, Upload, Refresh } from '@mui/icons-material';
import { ReactFlow, Background, Controls, MiniMap, Panel, BackgroundVariant, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

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
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [viewMode, setViewMode] = useState<'flow' | 'screenshot'>('flow');

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
            createFlowNodes(stepsData);
          } else if (data.type === 'execution_started') {
            setIsRunning(true);
            addLog('Starting workflow execution...');
          } else if (data.type === 'step_started' || data.type === 'workflow_step_started') {
            const stepIndex = data.payload?.stepIndex ?? data.payload?.step_index ?? 0;
            const stepDesc = data.payload?.step?.description || data.payload?.description || 'Executing step';
            setCurrentStep(stepIndex);
            setIsRunning(true);
            addLog(`Starting step ${stepIndex + 1}: ${stepDesc}`);
            updateNodeStatus(stepIndex, 'running');
          } else if (data.type === 'step_completed' || data.type === 'workflow_step_completed') {
            const stepIndex = data.payload?.stepIndex ?? data.payload?.step_index ?? 0;
            const stepDesc = data.payload?.step?.description || data.payload?.description || 'Step';
            const completedSteps = stepIndex + 1;
            if (steps.length > 0) {
              setProgress((completedSteps / steps.length) * 100);
            }
            addLog(`✓ Completed step ${completedSteps}: ${stepDesc}`);
            updateNodeStatus(stepIndex, 'completed');
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
              addLog('🎉 Automation completed successfully');
            }
          } else if (data.type === 'error' || data.type === 'error_occurred') {
            setIsRunning(false);
            const errorMessage = data.payload?.error || data.error || 'Unknown error';
            const nodeId = data.nodeId;
            addLog(`❌ Error: ${errorMessage}`);
            if (nodeId) {
              updateNodeStatus(parseInt(nodeId.replace('step-', '')), 'failed');
            }
          } else if (data.type === 'node_status_changed') {
            const nodeId = data.nodeId;
            const status = data.status;
            if (nodeId) {
              const stepIndex = parseInt(nodeId.replace('step-', ''));
              if (status === 'running') {
                updateNodeStatus(stepIndex, 'running');
              } else if (status === 'completed') {
                updateNodeStatus(stepIndex, 'completed');
              } else if (status === 'failed' || status === 'error') {
                updateNodeStatus(stepIndex, 'failed');
              }
            }
          } else if (data.type === 'screenshot' && data.screenshot) {
            setScreenshot(data.screenshot);
            if (data.nodeId) {
              addLog(`📸 Screenshot captured for ${data.nodeId}`);
            }
          } else if (data.type === 'display_limitation') {
            addLog(`⚠️ ${data.message || 'Running in headless mode'}`);
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

  const createFlowNodes = useCallback((stepsData: any[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    stepsData.forEach((step, index) => {
      const nodeId = `step-${index}`;
      newNodes.push({
        id: nodeId,
        type: 'default',
        position: { x: 50 + (index % 3) * 220, y: 100 + Math.floor(index / 3) * 120 },
        data: {
          label: step.description || step.action || `Step ${index + 1}`,
          status: 'pending',
          type: step.type || step.action,
        },
        style: {
          background: 'rgba(26,26,26,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '12px',
          color: 'white',
          fontSize: '12px',
          width: 180,
        },
      });
      
      if (index > 0) {
        newEdges.push({
          id: `edge-${index - 1}-${index}`,
          source: `step-${index - 1}`,
          target: nodeId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: 'rgba(139, 92, 246, 0.5)' },
        });
      }
    });
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  const updateNodeStatus = useCallback((stepIndex: number, status: 'running' | 'completed' | 'failed') => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === `step-${stepIndex}`) {
          const colors = {
            running: { border: '2px solid #3b82f6', background: 'rgba(59, 130, 246, 0.1)' },
            completed: { border: '2px solid #10b981', background: 'rgba(16, 185, 129, 0.1)' },
            failed: { border: '2px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)' },
          };
          return {
            ...node,
            data: { ...node.data, status },
            style: { ...node.style, ...colors[status] },
          };
        }
        return node;
      })
    );
    
    if (status === 'running') {
      setEdges(prevEdges => 
        prevEdges.map(edge => {
          if (edge.target === `step-${stepIndex}`) {
            return { ...edge, animated: true, style: { stroke: '#3b82f6' } };
          }
          return edge;
        })
      );
    }
  }, []);

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

  const handleExport = () => {
    const data = JSON.stringify({ steps, logs, screenshot }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              Automation Canvas
            </Typography>
            {steps.length > 0 && (
              <Chip 
                label={`${steps.length} steps`} 
                size="small" 
                sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}
              />
            )}
            {isRunning && (
              <Chip 
                label="Running" 
                size="small" 
                sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              onClick={() => setViewMode(viewMode === 'flow' ? 'screenshot' : 'flow')}
              sx={{ color: '#2196f3' }}
              title={viewMode === 'flow' ? 'Show Screenshot' : 'Show Flow'}
            >
              <Visibility />
            </IconButton>
            <IconButton 
              onClick={handleExport}
              sx={{ color: '#9e9e9e' }}
              title="Export"
            >
              <Download />
            </IconButton>
            <IconButton 
              onClick={() => setIsRunning(!isRunning)}
              sx={{ color: isRunning ? '#ff9800' : '#4caf50' }}
            >
              {isRunning ? <Pause /> : <PlayArrow />}
            </IconButton>
            <IconButton 
              onClick={handleStop}
              sx={{ color: '#f44336' }}
            >
              <Stop />
            </IconButton>
          </Box>
        </Box>
        {progress > 0 && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: progress === 100 ? '#10b981' : '#3b82f6'
                }
              }} 
            />
          </Box>
        )}
      </Paper>

      <Box sx={{ flex: 1, display: 'flex' }}>
        <Box sx={{ 
          flex: 1, 
          position: 'relative',
          bgcolor: '#0a0a0a'
        }}>
          {viewMode === 'flow' && nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              style={{ backgroundColor: '#0a0a0a' }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
            >
              <Background color="#333" variant={BackgroundVariant.Dots} gap={16} size={1} />
              <Controls style={{ button: { backgroundColor: '#1a1a1a', borderColor: '#333' } }} />
              <MiniMap
                style={{ backgroundColor: '#1a1a1a' }}
                nodeColor={(node: any) => {
                  if (node.data.status === 'running') return '#3b82f6';
                  if (node.data.status === 'completed') return '#10b981';
                  if (node.data.status === 'failed') return '#ef4444';
                  return '#666';
                }}
              />
              <Panel position="top-right" style={{ margin: 10 }}>
                <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200 }}>
                  <CardContent>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Progress
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white', mt: 1 }}>
                      {Math.round(progress)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1, display: 'block' }}>
                      Step {currentStep + 1} of {steps.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Panel>
            </ReactFlow>
          ) : viewMode === 'screenshot' && screenshot ? (
            <Box sx={{ width: '100%', height: '100%', p: 2 }}>
              <img 
                src={screenshot.startsWith('data:') ? screenshot : `data:image/png;base64,${screenshot}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
                alt="Browser view"
              />
            </Box>
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
          width: 320, 
          bgcolor: '#1a1a1a',
          borderRadius: 0,
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="h6" sx={{ color: 'white' }}>Execution Log</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              {logs.length} events
            </Typography>
          </Box>
          <Box sx={{ flex: 1, p: 1.5, overflow: 'auto' }}>
            {logs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                  No logs yet
                </Typography>
              </Box>
            ) : (
              logs.map((log, index) => {
                const isError = log.includes('❌') || log.includes('Error');
                const isSuccess = log.includes('✓') || log.includes('Completed');
                const isInfo = log.includes('📸') || log.includes('🎉');
                
                return (
                  <Box 
                    key={index} 
                    sx={{ 
                      mb: 1, 
                      p: 1.5, 
                      bgcolor: isError ? 'rgba(239, 68, 68, 0.1)' : 
                               isSuccess ? 'rgba(16, 185, 129, 0.1)' : 
                               'rgba(255,255,255,0.05)', 
                      borderRadius: 1,
                      borderLeft: isError ? '3px solid #ef4444' : 
                                  isSuccess ? '3px solid #10b981' : 
                                  isInfo ? '3px solid #3b82f6' : 'none'
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isError ? '#fca5a5' : 
                               isSuccess ? '#86efac' : 
                               'rgba(255,255,255,0.9)',
                        fontSize: '11px',
                        lineHeight: 1.5,
                        display: 'block',
                        wordBreak: 'break-word'
                      }}
                    >
                      {log}
                    </Typography>
                  </Box>
                );
              })
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AutomationCanvas;
