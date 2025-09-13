import React, { useState, useEffect } from 'react';
import { Box, Drawer, IconButton, Typography, Chip, Avatar, Card, Button, Fade, Grow, Tab, Tabs } from '@mui/material';
import { ChevronLeft, ChevronRight, PlayArrow, Pause, Stop, Person, Settings, Visibility, Computer, Web } from '@mui/icons-material';
import { AutomationCanvas } from './AutomationCanvas';
import Chat from './Chat';
import { LiveViewBrowser } from './LiveViewBrowser';

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
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [activeProfile, setActiveProfile] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [sandboxSession, setSandboxSession] = useState<string | undefined>(undefined);
  const [liveViewUrl, setLiveViewUrl] = useState<string | undefined>(undefined);

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
                onClick={() => setProfileExpanded(!profileExpanded)}
                sx={{ color: 'rgba(255,255,255,0.7)' }}
                size="small"
              >
                <Person />
              </IconButton>
              <IconButton 
                onClick={() => setSidebarOpen(false)}
                sx={{ color: 'rgba(255,255,255,0.7)' }}
                size="small"
              >
                <ChevronLeft />
              </IconButton>
            </Box>
          </Box>

          <Fade in={profileExpanded}>
            <Box sx={{ 
              p: 2,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(180deg, rgba(10,10,10,0.9) 0%, rgba(26,26,26,0.9) 100%)'
            }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center' }}>
                {[0, 1, 2].map((index) => (
                  <Button
                    key={index}
                    size="small"
                    variant={activeProfile === index ? "contained" : "outlined"}
                    onClick={() => setActiveProfile(index)}
                    sx={{
                      minWidth: '60px',
                      height: '24px',
                      fontSize: '10px',
                      color: activeProfile === index ? '#000' : 'rgba(255,255,255,0.7)',
                      borderColor: 'rgba(255,255,255,0.2)',
                      background: activeProfile === index ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.4)',
                        background: activeProfile === index ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)'
                      }
                    }}
                  >
                    {index + 1}
                  </Button>
                ))}
              </Box>

              <Grow in={activeProfile === 0}>
                <Box sx={{ display: activeProfile === 0 ? 'block' : 'none' }}>
                  <Card sx={{
                    background: 'linear-gradient(145deg, rgba(26,26,26,0.8) 0%, rgba(42,42,42,0.6) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{
                        width: 60,
                        height: 60,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: '3px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
                        fontSize: '24px',
                        fontWeight: 600
                      }}>D</Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          color: 'white', 
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          demo_user
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          demo@example.com
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label="PREMIUM" size="small" sx={{
                        background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                        color: 'white',
                        fontSize: '10px',
                        height: '20px'
                      }} />
                      <Chip label="ACTIVE" size="small" sx={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        fontSize: '10px',
                        height: '20px'
                      }} />
                    </Box>
                  </Card>
                </Box>
              </Grow>

              <Grow in={activeProfile === 1}>
                <Box sx={{ display: activeProfile === 1 ? 'block' : 'none' }}>
                  <Card sx={{
                    background: 'rgba(26,26,26,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '20px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(32,32,32,0.95)'
                    }
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Avatar sx={{
                        width: 80,
                        height: 80,
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        margin: '0 auto 16px',
                        border: '2px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: '0 0 30px rgba(240,147,251,0.4)'
                        }
                      }}>D</Avatar>
                      <Typography variant="h6" sx={{ 
                        color: 'white', 
                        fontWeight: 600,
                        mb: 1
                      }}>
                        demo_user
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'rgba(255,255,255,0.6)',
                        mb: 2
                      }}>
                        AI Automation Specialist
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '12px',
                        padding: '8px 12px'
                      }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Credits</Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#4ade80',
                          fontWeight: 600
                        }}>2,450</Typography>
                      </Box>
                    </Box>
                  </Card>
                </Box>
              </Grow>

              <Grow in={activeProfile === 2}>
                <Box sx={{ display: activeProfile === 2 ? 'block' : 'none' }}>
                  <Card sx={{
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #4f46e5, #06b6d4, #10b981)',
                      borderTopLeftRadius: '12px',
                      borderTopRightRadius: '12px'
                    }
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{
                          width: 48,
                          height: 48,
                          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                          border: '2px solid rgba(255,255,255,0.1)',
                          fontSize: '18px'
                        }}>D</Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ 
                            color: 'white', 
                            fontWeight: 600,
                            lineHeight: 1.2
                          }}>
                            demo_user
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: 'rgba(255,255,255,0.5)'
                          }}>
                            Online • Last seen 2m ago
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        <Settings fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 2,
                      mb: 2
                    }}>
                      <Box sx={{ 
                        background: 'rgba(79,70,229,0.1)',
                        border: '1px solid rgba(79,70,229,0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <Typography variant="h6" sx={{ color: '#4f46e5', fontWeight: 700 }}>94</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Tasks</Typography>
                      </Box>
                      <Box sx={{ 
                        background: 'rgba(6,182,212,0.1)',
                        border: '1px solid rgba(6,182,212,0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 700 }}>98%</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Success</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      background: 'rgba(16,185,129,0.05)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Account Status</Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#10b981',
                        fontWeight: 600,
                        background: 'rgba(16,185,129,0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>PREMIUM</Typography>
                    </Box>
                  </Card>
                </Box>
              </Grow>
            </Box>
          </Fade>

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

        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            bgcolor: 'rgba(26,26,26,0.9)',
            backdropFilter: 'blur(10px)'
          }}>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              sx={{
                minHeight: 48,
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.6)',
                  minHeight: 48,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: '#4f46e5'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#4f46e5',
                  height: 3
                }
              }}
            >
              <Tab
                icon={<Computer />}
                label="Automation Canvas"
                iconPosition="start"
              />
              <Tab
                icon={<Web />}
                label="Live Browser View"
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {activeTab === 0 && (
              <AutomationCanvas 
                taskId={currentTask?.id}
                onTaskUpdate={setCurrentTask}
              />
            )}
            
            {activeTab === 1 && (
              <LiveViewBrowser 
                sessionId={sandboxSession}
                liveViewUrl={liveViewUrl}
                onSessionUpdate={(sessionId, url) => {
                  setSandboxSession(sessionId);
                  setLiveViewUrl(url);
                }}
                onStatusChange={(status) => {
                  setTaskStatus(status);
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AutomationWorkspace;
