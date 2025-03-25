import React, { useState } from 'react';
import Chat from "./components/Chat";
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AgentManagement } from './pages/AgentManagement';
import { SuperAdminDashboard } from './components/dashboard/SuperAdminDashboard';
import { ResellerDashboard } from './components/dashboard/ResellerDashboard';
import { CustomerDashboard } from './components/dashboard/CustomerDashboard';
import { KnowledgeManagement } from './pages/KnowledgeManagement';
import { UserManagement } from './pages/UserManagement';
import { UserProfile } from './pages/UserProfile';
import { Login } from './pages/Login';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { useAuth } from './context/AuthContext';
import { UserRole } from './types/user';
import { AgentChatInterface } from './components/agent/AgentChatInterface';
import { AgentKnowledgeManager } from './pages/AgentKnowledgeManager';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ErrorBoundary from './components/common/ErrorBoundary';

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
  const { user, isAuthenticated } = useAuth();
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
                <Route path="/chat" element={<Chat />} />
                
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
    </ThemeProvider>
  );
}

export default App;
