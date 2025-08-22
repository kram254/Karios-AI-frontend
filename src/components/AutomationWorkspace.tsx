import React, { useState, useEffect } from 'react';
import { Box, Drawer, IconButton, Typography, Chip } from '@mui/material';
import { ChevronLeft, ChevronRight, PlayArrow, Pause, Stop } from '@mui/icons-material';
import { AutomationCanvas } from './AutomationCanvas';
import Chat from './Chat';

interface AutomationWorkspaceProps {
  chatId?: string;
  onChatMessage?: (message: string) => void;
}

export const AutomationWorkspace: React.FC<AutomationWorkspaceProps> = ({
  chatId,
  onChatMessage
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [taskStatus, setTaskStatus] = useState<string>('idle');

  const sidebarWidth = 400;

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#0a0a0a' }}>
      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            boxSizing: 'border-box',
            bgcolor: '#1a1a1a',
            borderRight: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      >
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative'
        }}>
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              AI Agent
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={taskStatus} 
                size="small" 
                color={taskStatus === 'executing' ? 'warning' : taskStatus === 'completed' ? 'success' : 'default'}
              />
              <IconButton 
                onClick={() => setSidebarOpen(false)}
                sx={{ color: 'rgba(255,255,255,0.7)' }}
                size="small"
              >
                <ChevronLeft />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Chat 
              chatId={chatId}
              onMessage={onChatMessage}
              compact={true}
            />
          </Box>

          {currentTask && (
            <Box sx={{ 
              p: 2, 
              borderTop: '1px solid rgba(255,255,255,0.1)',
              bgcolor: 'rgba(0,0,0,0.3)'
            }}>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                Current Task
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                {currentTask.prompt}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" sx={{ color: '#4caf50' }}>
                  <PlayArrow />
                </IconButton>
                <IconButton size="small" sx={{ color: '#ff9800' }}>
                  <Pause />
                </IconButton>
                <IconButton size="small" sx={{ color: '#f44336' }}>
                  <Stop />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>

      <Box sx={{ 
        flexGrow: 1, 
        ml: sidebarOpen ? 0 : `-${sidebarWidth}px`,
        transition: 'margin-left 0.3s',
        position: 'relative'
      }}>
        {!sidebarOpen && (
          <IconButton
            onClick={() => setSidebarOpen(true)}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 1000,
              bgcolor: 'rgba(26,26,26,0.9)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(26,26,26,1)' }
            }}
          >
            <ChevronRight />
          </IconButton>
        )}

        <AutomationCanvas 
          taskId={currentTask?.id}
          onTaskUpdate={setCurrentTask}
        />
      </Box>
    </Box>
  );
};

export default AutomationWorkspace;
