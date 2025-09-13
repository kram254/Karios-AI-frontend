import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Button,
  Alert,
  Chip,
  LinearProgress,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Fullscreen,
  FullscreenExit,
  Refresh,
  Visibility,
  VisibilityOff,
  PlayArrow,
  Stop,
  Screenshot,
  Settings,
  Pause
} from '@mui/icons-material';
import { sandboxService, type SandboxSession, type ExecutionResult } from '../services/sandboxService';

interface LiveViewBrowserProps {
  sessionId?: string;
  liveViewUrl?: string;
  onSessionUpdate?: (sessionId: string, url: string) => void;
  onStatusChange?: (status: string) => void;
  onError?: (error: string) => void;
  height?: string | number;
}

export const LiveViewBrowser: React.FC<LiveViewBrowserProps> = ({
  sessionId,
  liveViewUrl,
  onSessionUpdate,
  onStatusChange,
  onError,
  height = '600px'
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'connecting' | 'active' | 'connected' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<SandboxSession | null>(null);
  const [automationType] = useState<string>('hybrid');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liveViewUrl && sessionId) {
      setSessionStatus('connecting');
      setConnectionError(null);
    } else if (!liveViewUrl && sessionId) {
      setSessionStatus('error');
      setConnectionError('Live View URL not available');
    } else {
      setSessionStatus('idle');
    }
  }, [liveViewUrl, sessionId]);

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(sessionStatus);
    }
  }, [sessionStatus, onStatusChange]);

  const handleCreateSession = async () => {
    try {
      setIsCreatingSession(true);
      setConnectionError(null);
      
      const session = await sandboxService.createSession({
        automation_type: automationType,
        record_session: isRecording,
        proxy_enabled: false
      });

      setCurrentSession(session);
      setSessionStatus('active');
      
      if (onSessionUpdate && session.live_view_url) {
        onSessionUpdate(session.session_id, session.live_view_url);
      }
      
    } catch (error) {
      setSessionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Failed to create session');
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to create session');
      }
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleTerminateSession = async () => {
    if (!currentSession) return;
    
    try {
      await sandboxService.terminateSession(currentSession.session_id);
      setCurrentSession(null);
      setSessionStatus('idle');
      setExecutionResult(null);
      
      if (onSessionUpdate) {
        onSessionUpdate('', '');
      }
      
    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  };

  const handleTestWorkflow = async () => {
    if (!currentSession) return;
    
    try {
      const testSteps = sandboxService.createWorkflowFromGoal('Take a screenshot of the current page');
      
      const result = await sandboxService.executeWorkflow({
        session_id: currentSession.session_id,
        workflow_steps: testSteps,
        execution_strategy: 'adaptive'
      });
      
      setExecutionResult(result);
      
    } catch (error) {
      console.error('Failed to execute test workflow:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to execute test workflow');
      }
    }
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleVisibilityToggle = () => {
    setIsVisible(!isVisible);
  };

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
    if (onSessionUpdate && sessionId) {
      onSessionUpdate(sessionId, liveViewUrl || '');
    }
  };

  const handleTakeScreenshot = async () => {
    if (!currentSession) return;
    try {
      console.log('Taking screenshot for session:', currentSession.session_id);
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleIframeLoad = () => {
    setConnectionError(null);
    setSessionStatus('connected');
  };

  const handleIframeError = () => {
    setConnectionError('Failed to load browser view');
    setSessionStatus('error');
  };

  const getStatusColor = () => {
    switch (sessionStatus) {
      case 'active': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    switch (sessionStatus) {
      case 'active': return 'Live';
      case 'connecting': return 'Connecting';
      case 'connected': return 'Connected';
      case 'error': return 'Error';
      default: return 'Idle';
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: height,
        bgcolor: '#000',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
          padding: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={getStatusText()}
            size="small"
            color={getStatusColor() as any}
            sx={{ height: 24, fontSize: '11px' }}
          />
          {sessionId && (
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'monospace',
                fontSize: '10px'
              }}
            >
              {sessionId.substring(0, 8)}...
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={handleRefresh}
            sx={{ color: 'rgba(255,255,255,0.8)' }}
          >
            <Refresh fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleVisibilityToggle}
            sx={{ color: 'rgba(255,255,255,0.8)' }}
          >
            {isVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </IconButton>

          <IconButton
            size="small"
            onClick={handleFullscreenToggle}
            sx={{ color: 'rgba(255,255,255,0.8)' }}
          >
            {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
          </IconButton>

        </Box>
      </Box>

      {/* Sandbox Controls */}
      {sessionStatus === 'idle' && !currentSession && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 5
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            Create Sandbox Session
          </Typography>
          <Button
            variant="contained"
            onClick={handleCreateSession}
            disabled={isCreatingSession}
            startIcon={<PlayArrow />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              mr: 1
            }}
          >
            {isCreatingSession ? 'Creating...' : 'Start Session'}
          </Button>
        </Box>
      )}

      {/* Session Active Controls */}
      {currentSession && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            display: 'flex',
            gap: 1,
            zIndex: 10
          }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={handleTestWorkflow}
            startIcon={<PlayArrow />}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': { borderColor: 'rgba(255,255,255,0.5)' }
            }}
          >
            Test
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleTerminateSession}
            startIcon={<Stop />}
            sx={{
              color: '#f44336',
              borderColor: 'rgba(244,67,54,0.3)',
              '&:hover': { borderColor: 'rgba(244,67,54,0.5)' }
            }}
          >
            Stop
          </Button>
        </Box>
      )}

      {sessionStatus === 'connecting' && (
        <Box
          sx={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            zIndex: 5
          }}
        >
          <LinearProgress
            sx={{
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
              }
            }}
          />
        </Box>
      )}

      {connectionError && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20
          }}
        >
          <Alert
            severity="error"
            sx={{
              bgcolor: 'rgba(211,47,47,0.1)',
              border: '1px solid rgba(211,47,47,0.3)',
              color: '#ff5252'
            }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleRefresh}
              >
                RETRY
              </Button>
            }
          >
            {connectionError}
          </Alert>
        </Box>
      )}

      {liveViewUrl && isVisible ? (
        <iframe
          ref={iframeRef}
          src={liveViewUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#000'
          }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="Live Browser View"
          allowFullScreen
        />
      ) : !liveViewUrl && sessionId ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'rgba(255,255,255,0.6)'
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Browser Session Active
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', maxWidth: 300 }}>
            Live view is not available for this session. The browser is running in the background.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleTakeScreenshot()}
            startIcon={<Screenshot />}
            sx={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            Take Screenshot
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'rgba(255,255,255,0.4)'
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            No Active Session
          </Typography>
          <Typography variant="body2">
            Start a browser automation to see live view
          </Typography>
        </Box>
      )}

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(26,26,26,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            '& .MuiMenuItem-root': {
              color: 'rgba(255,255,255,0.8)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }
          }
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Settings fontSize="small" sx={{ mr: 1 }} />
          Session Settings
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <PlayArrow fontSize="small" sx={{ mr: 1 }} />
          Resume Automation
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Pause fontSize="small" sx={{ mr: 1 }} />
          Pause Automation
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Stop fontSize="small" sx={{ mr: 1 }} />
          Stop Session
        </MenuItem>
      </Menu>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default LiveViewBrowser;
