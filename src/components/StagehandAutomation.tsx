import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, Chip, LinearProgress, IconButton, Tooltip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { PlayArrow, Stop, Refresh, Monitor, Code, FlashOn, Visibility, MyLocation, CloudQueue, ExpandMore, AccountTree } from '@mui/icons-material';
import { WorkflowAutomationBridge } from './WorkflowAutomationBridge';

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
  const [screenshotHistory, setScreenshotHistory] = useState<Array<{url: string, screenshot: string, timestamp: string}>>([]);
  const [retryInfo, setRetryInfo] = useState<{attempt: number, maxRetries: number} | null>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentGoal, setAgentGoal] = useState('');
  const screenshotContainerRef = useRef<HTMLDivElement>(null);

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
          sessionId: sessionId,
          browser_type: 'chromium',
          visible: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setBrowserStatus('connected');
        addLog('✅ Stagehand browser initialized successfully');
        if (data.stagehand_available) {
          addLog('✅ Stagehand mode active');
        }
        connectWebSocket();
      } else {
        setBrowserStatus('disconnected');
        const errorMsg = data.message || 'Unknown initialization error';
        addLog(`❌ Browser initialization failed: ${errorMsg}`);
      }
    } catch (error: any) {
      setBrowserStatus('disconnected');
      const errorMsg = error.message || String(error);
      addLog(`❌ Connection error: ${errorMsg}`);
      console.error('Browser initialization error:', error);
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
          
          if (data.type === 'screenshot_taken' || data.type === 'screenshot' || data.type === 'screenshot_update') {
            const screenshotData = data.payload?.screenshot || data.screenshot;
            setScreenshot(screenshotData);
            if (data.url) {
              setCurrentUrl(data.url);
            }
            if (data.timestamp) {
              setScreenshotHistory(prev => [...prev, {
                url: data.url || currentUrl,
                screenshot: screenshotData,
                timestamp: data.timestamp
              }].slice(-10));
            }
          } else if (data.type === 'navigation_completed') {
            setCurrentUrl(data.payload?.url || '');
            addLog(`📍 Navigated to: ${data.payload?.url}`);
          } else if (data.type === 'action_completed') {
            addLog(`✅ ${data.message || 'Action completed'}`);
            setRetryInfo(null);
          } else if (data.type === 'action_retry') {
            setRetryInfo({
              attempt: data.attempt,
              maxRetries: data.maxRetries
            });
            addLog(`🔄 Retry ${data.attempt}/${data.maxRetries}${data.error ? ': ' + data.error : ''}`);
          } else if (data.type === 'agent_completed') {
            setAgentRunning(false);
            addLog(`🤖 Agent completed: ${JSON.stringify(data.result).substring(0, 100)}`);
            if (data.screenshot) {
              setScreenshot(data.screenshot);
            }
          } else if (data.type === 'agent_error') {
            setAgentRunning(false);
            addLog(`❌ Agent error: ${data.error}`);
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
      addLog('⚠️ Please enter an instruction');
      return;
    }

    setIsRunning(true);
    addLog(`⚡ Executing ${actionMode}: ${instruction}`);

    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/web-automation/execute-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          action_type: actionMode,
          instruction: instruction,
          mode: 'stagehand'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        addLog(`✅ Action completed successfully`);
        if (data.screenshot) {
          setScreenshot(data.screenshot);
        }
        if (data.url) {
          setCurrentUrl(data.url);
        }
        if (data.data) {
          addLog(`📊 Result: ${JSON.stringify(data.data).substring(0, 200)}`);
        }
      } else {
        const errorMsg = data.message || 'Unknown action error';
        addLog(`❌ Action failed: ${errorMsg}`);
      }
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      addLog(`❌ Execution error: ${errorMsg}`);
      console.error('Action execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const stopBrowser = async () => {
    try {
      addLog('Stopping browser session...');
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/web-automation/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId })
      });
      
      const data = await response.json().catch(() => ({ success: true }));
      
      setBrowserStatus('disconnected');
      setScreenshot('');
      setCurrentUrl('');
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      if (data.success) {
        addLog('✅ Browser session closed successfully');
      } else {
        addLog(`⚠️ Browser closed with warnings: ${data.message || 'Unknown'}`);
      }
    } catch (error: any) {
      setBrowserStatus('disconnected');
      const errorMsg = error.message || String(error);
      addLog(`❌ Cleanup error: ${errorMsg}`);
      console.error('Cleanup error:', error);
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const executeAutonomousAgent = async () => {
    if (!agentGoal.trim()) {
      addLog('⚠️ Please enter a goal for the autonomous agent');
      return;
    }

    setAgentRunning(true);
    addLog(`🤖 Starting autonomous agent with goal: ${agentGoal}`);

    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/web-automation/autonomous-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          goal: agentGoal,
          maxSteps: 10
        })
      });

      const data = await response.json();
      
      if (data.success) {
        addLog(`✅ Agent started successfully`);
      } else {
        setAgentRunning(false);
        addLog(`❌ Agent failed to start: ${data.message}`);
      }
    } catch (error: any) {
      setAgentRunning(false);
      const errorMsg = error.message || String(error);
      addLog(`❌ Agent error: ${errorMsg}`);
      console.error('Agent execution error:', error);
    }
  };

  const handleScreenshotClick = async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!screenshotContainerRef.current) return;
    
    const rect = screenshotContainerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/web-automation/select-element`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          x: x,
          y: y
        })
      });

      const data = await response.json();
      
      if (data.success && data.selectors) {
        setSelectedElement(data.selectors);
        addLog(`🎯 Element selected: ${data.selectors.tag} "${data.selectors.text}"`);
        addLog(`   CSS: ${data.selectors.css}`);
        setInstruction(`click on element with selector: ${data.selectors.css}`);
      }
    } catch (error: any) {
      addLog(`❌ Element selection error: ${error.message}`);
    }
  };

  const quickActions = [
    { label: 'Navigate', instruction: 'go to https://example.com', mode: 'act' as const },
    { label: 'Click Login', instruction: 'click the login button', mode: 'act' as const },
    { label: 'Extract Data', instruction: 'extract all product names and prices', mode: 'extract' as const },
    { label: 'Observe Page', instruction: 'what do you see on this page?', mode: 'observe' as const }
  ];

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: '#0A0A0A', 
      p: 3, 
      gap: 2,
      background: 'radial-gradient(circle at 20% 20%, rgba(0, 243, 255, 0.05) 0%, transparent 50%)',
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: 2,
        animation: 'fadeInDown 0.6s ease-out'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            background: 'linear-gradient(135deg, #00F3FF 0%, #0077FF 100%)',
            borderRadius: '12px',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 243, 255, 0.3)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <FlashOn sx={{ fontSize: 32, color: '#000' }} />
          </Box>
          <Typography variant="h5" sx={{ 
            color: 'white', 
            fontWeight: 600,
            background: 'linear-gradient(135deg, #fff 0%, #00F3FF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Stagehand Browser Automation
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip 
            label={browserStatus === 'connected' ? 'Connected' : browserStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            color={browserStatus === 'connected' ? 'success' : browserStatus === 'connecting' ? 'warning' : 'default'}
            size="small"
            sx={{ 
              bgcolor: browserStatus === 'connected' ? 'rgba(16, 185, 129, 0.2)' : browserStatus === 'connecting' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(74, 74, 74, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid',
              borderColor: browserStatus === 'connected' ? '#10b981' : browserStatus === 'connecting' ? '#f59e0b' : '#4a4a4a',
              color: browserStatus === 'connected' ? '#10b981' : browserStatus === 'connecting' ? '#f59e0b' : '#888',
              fontWeight: 600,
              animation: browserStatus === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none',
              transition: 'all 0.3s ease'
            }}
          />
          
          {browserStatus === 'disconnected' ? (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={initializeBrowser}
              sx={{ 
                background: 'linear-gradient(135deg, #00F3FF 0%, #0077FF 100%)',
                color: '#000',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(0, 243, 255, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  background: 'linear-gradient(135deg, #00D9E6 0%, #0066DD 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0, 243, 255, 0.4)'
                }
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
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                bgcolor: 'rgba(239, 68, 68, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  borderColor: '#dc2626', 
                  bgcolor: 'rgba(239, 68, 68, 0.15)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Stop
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        flexWrap: 'wrap',
        animation: 'fadeIn 0.8s ease-out 0.2s both'
      }}>
        {['act', 'extract', 'observe', 'agent'].map((mode) => (
          <Chip
            key={mode}
            label={mode.charAt(0).toUpperCase() + mode.slice(1)}
            onClick={() => setActionMode(mode as any)}
            sx={{
              bgcolor: actionMode === mode ? 'rgba(0, 243, 255, 0.2)' : 'rgba(26, 26, 26, 0.6)',
              color: actionMode === mode ? '#00F3FF' : '#888',
              border: '1px solid',
              borderColor: actionMode === mode ? '#00F3FF' : 'rgba(42, 42, 42, 0.6)',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              fontWeight: actionMode === mode ? 600 : 400,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: actionMode === mode ? 'scale(1.05)' : 'scale(1)',
              boxShadow: actionMode === mode ? '0 0 20px rgba(0, 243, 255, 0.3)' : 'none',
              '&:hover': { 
                borderColor: '#00F3FF',
                transform: 'scale(1.05) translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 243, 255, 0.2)'
              }
            }}
          />
        ))}
      </Box>

      <Accordion 
        sx={{
          bgcolor: 'rgba(26, 26, 26, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 243, 255, 0.2)',
          borderRadius: '12px !important',
          '&:before': { display: 'none' },
          boxShadow: 'none'
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: '#00F3FF' }} />}
          sx={{
            '& .MuiAccordionSummary-content': {
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }
          }}
        >
          <AccountTree sx={{ fontSize: 20, color: '#00F3FF' }} />
          <Typography sx={{ color: 'white', fontWeight: 600 }}>
            Workflow Integration
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <WorkflowAutomationBridge 
            nodes={[]}
            onExecute={(steps) => {
              addLog(`🔄 Workflow started with ${steps.length} steps`);
            }}
          />
        </AccordionDetails>
      </Accordion>

      {retryInfo && (
        <Paper sx={{ 
          p: 2, 
          bgcolor: 'rgba(245, 158, 11, 0.1)', 
          border: '1px solid rgba(245, 158, 11, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          animation: 'slideInLeft 0.3s ease-out'
        }}>
          <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 600 }}>
            🔄 Retrying action... Attempt {retryInfo.attempt}/{retryInfo.maxRetries}
          </Typography>
        </Paper>
      )}

      {actionMode === 'agent' && (
        <Paper sx={{ 
          p: 2, 
          bgcolor: 'rgba(139, 92, 246, 0.1)', 
          border: '1px solid rgba(139, 92, 246, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#8b5cf6', mb: 2, fontWeight: 600 }}>
            🤖 Autonomous Agent Mode
          </Typography>
          <TextField
            fullWidth
            value={agentGoal}
            onChange={(e) => setAgentGoal(e.target.value)}
            placeholder="Enter goal (e.g., 'Find and purchase the cheapest laptop')"
            disabled={browserStatus !== 'connected' || agentRunning}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                bgcolor: 'rgba(10, 10, 10, 0.8)',
                backdropFilter: 'blur(5px)',
                borderRadius: '8px',
                '& fieldset': { borderColor: 'rgba(139, 92, 246, 0.3)' },
                '&:hover fieldset': { borderColor: '#8b5cf6' },
                '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
              },
              mb: 1
            }}
          />
          <Button
            fullWidth
            variant="contained"
            disabled={browserStatus !== 'connected' || agentRunning || !agentGoal.trim()}
            onClick={executeAutonomousAgent}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: 'white',
              fontWeight: 600,
              '&:hover': { background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' },
              '&:disabled': { background: 'rgba(42, 42, 42, 0.6)', color: '#666' }
            }}
          >
            {agentRunning ? '🤖 Agent Running...' : 'Start Autonomous Agent'}
          </Button>
        </Paper>
      )}

      {selectedElement && (
        <Paper sx={{ 
          p: 2, 
          bgcolor: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          animation: 'slideInLeft 0.3s ease-out'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#10b981', mb: 1, fontWeight: 600 }}>
            🎯 Selected Element
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            Tag: {selectedElement.tag} | Text: "{selectedElement.text}"
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            CSS: {selectedElement.css}
          </Typography>
        </Paper>
      )}

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, 
        gap: 2, 
        flex: 1, 
        minHeight: 0,
        animation: 'fadeIn 1s ease-out 0.4s both'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
          <Paper sx={{ 
            p: 2, 
            bgcolor: 'rgba(26, 26, 26, 0.6)', 
            border: '1px solid rgba(0, 243, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
            '&:hover': {
              borderColor: 'rgba(0, 243, 255, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 243, 255, 0.1)'
            }
          }}>
            <Typography variant="subtitle2" sx={{ 
              color: '#00F3FF', 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontWeight: 600
            }}>
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
                  bgcolor: 'rgba(10, 10, 10, 0.8)',
                  backdropFilter: 'blur(5px)',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '& fieldset': { borderColor: 'rgba(42, 42, 42, 0.6)' },
                  '&:hover fieldset': { 
                    borderColor: '#00F3FF',
                    boxShadow: '0 0 10px rgba(0, 243, 255, 0.2)'
                  },
                  '&.Mui-focused fieldset': { 
                    borderColor: '#00F3FF',
                    boxShadow: '0 0 20px rgba(0, 243, 255, 0.3)'
                  }
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
                    bgcolor: 'rgba(42, 42, 42, 0.6)',
                    backdropFilter: 'blur(5px)',
                    color: '#888',
                    cursor: 'pointer',
                    border: '1px solid transparent',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      bgcolor: 'rgba(0, 243, 255, 0.1)', 
                      color: '#00F3FF',
                      borderColor: 'rgba(0, 243, 255, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 243, 255, 0.2)'
                    }
                  }}
                />
              ))}
            </Box>

            <Button
              fullWidth
              variant="contained"
              startIcon={isRunning ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <FlashOn />}
              onClick={executeStagehandAction}
              disabled={browserStatus !== 'connected' || isRunning || !instruction.trim()}
              sx={{
                background: 'linear-gradient(135deg, #00F3FF 0%, #0077FF 100%)',
                color: '#000',
                fontWeight: 600,
                borderRadius: '12px',
                py: 1.5,
                boxShadow: '0 4px 15px rgba(0, 243, 255, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { 
                  background: 'linear-gradient(135deg, #00D9E6 0%, #0066DD 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0, 243, 255, 0.4)'
                },
                '&:disabled': { 
                  background: 'rgba(42, 42, 42, 0.6)', 
                  color: '#666',
                  boxShadow: 'none'
                }
              }}
            >
              {isRunning ? 'Executing...' : `Execute ${actionMode.charAt(0).toUpperCase() + actionMode.slice(1)}`}
            </Button>
          </Paper>

          {currentUrl && (
            <Paper sx={{ 
              p: 2, 
              bgcolor: 'rgba(26, 26, 26, 0.6)', 
              border: '1px solid rgba(0, 243, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
              animation: 'slideInLeft 0.5s ease-out',
              '&:hover': {
                borderColor: 'rgba(0, 243, 255, 0.4)',
                boxShadow: '0 8px 32px rgba(0, 243, 255, 0.1)'
              }
            }}>
              <Typography variant="subtitle2" sx={{ 
                color: '#00F3FF', 
                mb: 1, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontWeight: 600
              }}>
                <CloudQueue sx={{ fontSize: 18 }} />
                Current URL
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#888', 
                wordBreak: 'break-all',
                bgcolor: 'rgba(0, 243, 255, 0.05)',
                p: 1,
                borderRadius: '8px',
                border: '1px solid rgba(0, 243, 255, 0.1)'
              }}>
                {currentUrl}
              </Typography>
            </Paper>
          )}

          <Paper sx={{ 
            p: 2, 
            bgcolor: 'rgba(26, 26, 26, 0.6)', 
            border: '1px solid rgba(0, 243, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            flex: 1, 
            overflow: 'auto', 
            minHeight: 0,
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
            '&:hover': {
              borderColor: 'rgba(0, 243, 255, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 243, 255, 0.1)'
            }
          }}>
            <Typography variant="subtitle2" sx={{ 
              color: '#00F3FF', 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontWeight: 600
            }}>
              <Code sx={{ fontSize: 18 }} />
              Activity Log
            </Typography>
            <Box sx={{ 
              fontFamily: 'monospace', 
              fontSize: '0.75rem',
              color: '#888',
              '& > div': { 
                py: 0.5, 
                borderBottom: '1px solid rgba(42, 42, 42, 0.5)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(0, 243, 255, 0.05)',
                  borderLeftColor: '#00F3FF',
                  borderLeftWidth: '2px',
                  borderLeftStyle: 'solid',
                  pl: 1
                }
              }
            }}>
              {logs.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                  No activity yet. Start the browser to begin.
                </Typography>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} style={{ animation: 'slideInLeft 0.3s ease-out' }}>{log}</div>
                ))
              )}
            </Box>
          </Paper>
        </Box>

        <Paper sx={{ 
          p: 2, 
          bgcolor: 'rgba(26, 26, 26, 0.6)', 
          border: '1px solid rgba(0, 243, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: 0,
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
          '&:hover': {
            borderColor: 'rgba(0, 243, 255, 0.4)',
            boxShadow: '0 8px 32px rgba(0, 243, 255, 0.1)'
          }
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ 
              color: '#00F3FF', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontWeight: 600
            }}>
              <Monitor sx={{ fontSize: 18 }} />
              Live Browser View
            </Typography>
            {screenshotHistory.length > 0 && (
              <Typography variant="caption" sx={{ color: '#888' }}>
                History: {screenshotHistory.length}
              </Typography>
            )}
          </Box>
          <Box 
            ref={screenshotContainerRef}
            sx={{ 
              flex: 1,
              bgcolor: 'rgba(10, 10, 10, 0.8)',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              position: 'relative',
              border: '1px solid rgba(0, 243, 255, 0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: screenshot && browserStatus === 'connected' ? 'crosshair' : 'default',
              position: 'relative'
            }}>
              {screenshot ? (
                <>
                  <img 
                    src={screenshot.startsWith('data:') ? screenshot : `data:image/png;base64,${screenshot}`}
                    alt="Browser screenshot"
                    onClick={handleScreenshotClick}
                    style={{ 
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      animation: 'fadeIn 0.5s ease-out',
                      cursor: browserStatus === 'connected' ? 'crosshair' : 'default'
                    }}
                  />
                  <Box sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0, 243, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 243, 255, 0.3)'
                  }}>
                    <Typography variant="caption" sx={{ color: '#00F3FF', fontSize: '0.7rem' }}>
                      Click to select element
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  color: '#666',
                  animation: 'pulse 2s ease-in-out infinite'
                }}>
                  <Visibility sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                  <Typography variant="body2">
                    {browserStatus === 'connected' ? 'Waiting for screenshot...' : 'Start browser to view live feed'}
                  </Typography>
                </Box>
              )}
            </Box>
            {screenshotHistory.length > 1 && (
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                p: 1, 
                overflowX: 'auto',
                bgcolor: 'rgba(0, 0, 0, 0.3)',
                borderTop: '1px solid rgba(0, 243, 255, 0.1)'
              }}>
                {screenshotHistory.slice(-5).reverse().map((item, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setScreenshot(item.screenshot)}
                    sx={{
                      minWidth: '60px',
                      height: '40px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: screenshot === item.screenshot ? '#00F3FF' : 'rgba(42, 42, 42, 0.5)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#00F3FF',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <img 
                      src={item.screenshot.startsWith('data:') ? item.screenshot : `data:image/png;base64,${item.screenshot}`}
                      alt="History"
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};
