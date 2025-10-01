import React, { useState } from 'react';
import Chat from './components/Chat';
import { TaskIdFixer } from './components/TaskIdFixer';
import WebAutomationIntegration from './components/WebAutomationIntegration';
import AutomationWorkspace from './components/AutomationWorkspace';
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { TaskPanel } from './components/tasks/TaskPanel';
import { useChat } from './context/ChatContext';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AgentManagement } from './pages/AgentManagement';
import { SuperAdminDashboard } from './components/dashboard/SuperAdminDashboard';
import { ResellerDashboard } from './components/dashboard/ResellerDashboard';
import { CustomerDashboard } from './components/dashboard/CustomerDashboard';
import AgentConfigDashboard from './components/dashboard/AgentConfigDashboard';
import { KnowledgeManagement } from './pages/KnowledgeManagement';
import { UserManagement } from './pages/UserManagement';
import { UserProfile } from './pages/UserProfile';
import { Login } from './pages/Login';
import AutonomousTasksPage from './pages/AutonomousTasksPage';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { useAuth } from './context/AuthContext';
import { UserRole } from './types/user';
import { AgentChatInterface } from './components/agent/AgentChatInterface';
import { AgentKnowledgeManager } from './pages/AgentKnowledgeManager';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ErrorBoundary from './components/common/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';
import { ProductionDebugConsole } from './components/ProductionDebugConsole';

// Create a dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00F3FF',
    },
    secondary: {
      main: '#FF00B8',
    },
    background: {
      default: '#080808',
      paper: '#1A1A1A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: '#00F3FF',
          color: '#000000',
          '&:hover': {
            backgroundColor: '#00D1DD',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.3)',
          color: '#FFFFFF',
          '&:hover': {
            borderColor: '#00F3FF',
            color: '#00F3FF',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A1A',
          color: '#FFFFFF',
        },
      },
    },
  },
});

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTaskMode, setIsTaskMode] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { currentChat } = useChat();
  const location = useLocation();

  // Determine which dashboard to show based on user role
  const DashboardComponent = () => {
    // if (!user) return <Navigate to="/login" replace />;
    if (!user) return <Navigate to="/chat" replace />;
    
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return <SuperAdminDashboard />;
      case UserRole.RESELLER:
        return <ResellerDashboard />;
      case UserRole.CUSTOMER:
        return <CustomerDashboard />;
      default:
        return <Navigate to="/chat" replace />;
    }
  };

  // For agent configuration dashboard access
  const AgentConfigDashboardComponent = () => {
    if (!user) return <Navigate to="/chat" replace />;
    return <AgentConfigDashboard />;
  };

  // Check if user has permission to access route
  const canAccessRoute = (requiredRoles: UserRole[]) => {
    if (!user) return false;
    return requiredRoles.includes(user.role);
  };

  // Commented out login requirement to allow direct access to all features
  // if (!isAuthenticated && location.pathname !== '/login') {
  //   return (
  //     <div className="app-container h-screen bg-[#0A0A0A] text-white">
  //       <Toaster 
  //         position="top-right"
  //         toastOptions={{
  //           style: {
  //             background: '#1A1A1A',
  //             color: '#fff',
  //             border: '1px solid rgba(0, 243, 255, 0.2)',
  //           },
  //         }}
  //       />
  //       <Routes>
  //         <Route path="/login" element={<Login />} />
  //         <Route path="*" element={<Navigate to="/login" replace />} />
  //       </Routes>
  //     </div>
  //   );
  // }

  return (
    <LanguageProvider>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <div className="app-container flex h-screen bg-[#0A0A0A] text-white">
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#1A1A1A',
                color: '#FFFFFF',
                border: '1px solid rgba(0, 243, 255, 0.2)',
              },
            }}
          />
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />
          {location.pathname === '/chat' && currentChat && (
            <div className="w-64 border-r border-[#2A2A2A] bg-[#0A0A0A] flex-shrink-0">
              <TaskPanel 
                chatId={currentChat.id} 
                isWebAutomation={currentChat.chat_type === 'web_automation'}
                onTaskModeChange={setIsTaskMode}
                onCreateTask={(taskInput) => {
                  (window as any).createTaskFromChat?.(taskInput);
                }}
              />
            </div>
          )}
          <main className="flex-1 overflow-hidden">
            <ErrorBoundary>
              <Routes>
                {/* Public Routes (commented out login route) */}
                {/* <Route path="/login" element={<Login />} /> */}
                
                {/* Protected Routes */}
                <Route element={<PrivateRoute />}>
                  {/* Default route */}
                  <Route path="/" element={<Navigate to="/chat" replace />} />
                  
                  {/* Chat */}
                  <Route path="/chat" element={
                    <>
                      {currentChat && (
                        <TaskIdFixer 
                          chatId={currentChat.id} 
                          onTaskIdReceived={(taskId) => {
                            console.log('🔥 APP - Received backend task ID:', taskId);
                            window.dispatchEvent(new CustomEvent('backend-task-id-received', { 
                              detail: { taskId, chatId: currentChat.id } 
                            }));
                          }} 
                        />
                      )}
                      <Chat isTaskMode={isTaskMode} />
                    </>
                  } />
                  
                  {/* Automation Workspace - Lindy-like Canvas UI */}
                  <Route path="/automation-workspace" element={<AutomationWorkspace />} />
                  
                  {/* Agent Chat Interface */}
                  <Route path="/agent-chat/:agentId" element={
                    <AgentChatInterface agentId={Number(window.location.pathname.split('/').pop())} />
                  } />
                  
                  {/* Agent Knowledge Manager */}
                  <Route path="/agent-knowledge/:agentId" element={<AgentKnowledgeManager />} />
                  
                  {/* Agent Management */}
                  <Route path="/agents" element={<AgentManagement />} />
                  
                  {/* Knowledge Management */}
                  <Route path="/knowledge" element={<KnowledgeManagement />} />
                  
                  {/* Dashboard - Access based on role */}
                  <Route path="/dashboard" element={<DashboardComponent />} />
                  
                  {/* Agent Config Dashboard - For all roles with dashboard access */}
                  <Route path="/agent-config" element={<AgentConfigDashboardComponent />} />
                  
                  {/* Autonomous Tasks */}
                  <Route path="/autonomous-tasks" element={<AutonomousTasksPage />} />
                  
                  {/* User Profile */}
                  <Route path="/profile" element={<UserProfile />} />
                </Route>
                
                {/* Role-restricted Routes */}
                <Route element={<PrivateRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.RESELLER]} />}>
                  {/* User Management - Only for SUPER_ADMIN and RESELLER */}
                  <Route path="/users" element={<UserManagement />} />
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/chat" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
          {isSettingsOpen && (
            <Settings
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
            />
          )}
        </div>
        <ProductionDebugConsole />
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
