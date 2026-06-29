import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Always-rendered / layout-critical components (not lazy)
import Chat from './components/Chat';
import { TaskIdFixer } from './components/TaskIdFixer';
import WebAutomationIntegration from './components/WebAutomationIntegration';
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { PrivateRoute } from './components/auth/PrivateRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import PageLoader from './components/common/PageLoader';
import { LanguageProvider } from './context/LanguageContext';
import { useChat } from './context/ChatContext';
import { useAuth } from './context/AuthContext';
import { UserRole } from './types/user';

// Design tokens — single source of truth for the MUI theme
import { muiTheme } from './styles/tokens';

// ---------------------------------------------------------------------------
// Route-level lazy imports
// All page components are code-split so they are only fetched when navigated to.
// Heavy libs (Three.js, React Flow, Vega, Mermaid) are pulled in lazily with each page.
// ---------------------------------------------------------------------------

// Dashboards
const SuperAdminDashboard  = lazy(() => import('./components/dashboard/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const ResellerDashboard    = lazy(() => import('./components/dashboard/ResellerDashboard').then(m => ({ default: m.ResellerDashboard })));
const CustomerDashboard    = lazy(() => import('./components/dashboard/CustomerDashboard').then(m => ({ default: m.CustomerDashboard })));
const AgentConfigDashboard = lazy(() => import('./components/dashboard/AgentConfigDashboard'));

// Pages
const HomeScreen           = lazy(() => import('./pages/HomeScreen'));
const LandingV2            = lazy(() => import('./pages/LandingV2'));
const Login                = lazy(() => import('./pages/Login'));
const BuilderStudio        = lazy(() => import('./pages/BuilderStudio'));
const ScheduledTasks       = lazy(() => import('./pages/ScheduledTasks'));
const AgentTeams           = lazy(() => import('./pages/AgentTeams'));
const TeamDetail           = lazy(() => import('./pages/TeamDetail'));
const CommandCentre        = lazy(() => import('./pages/CommandCentre'));
const QASessionDetail      = lazy(() => import('./pages/QASessionDetail'));
const SumiIntegration      = lazy(() => import('./pages/SumiIntegration'));
const AutomationWorkspace  = lazy(() => import('./components/AutomationWorkspace'));
const AgentKnowledgeManager= lazy(() => import('./pages/AgentKnowledgeManager').then(m => ({ default: m.AgentKnowledgeManager })));
const KnowledgeManagement  = lazy(() => import('./pages/KnowledgeManagement').then(m => ({ default: m.KnowledgeManagement })));
const AgentAnalyticsDashboard = lazy(() => import('./pages/AgentAnalyticsDashboard').then(m => ({ default: m.AgentAnalyticsDashboard })));
const AutonomousTasksPage  = lazy(() => import('./pages/AutonomousTasksPage'));
const ToolManagementPanel  = lazy(() => import('./components/tools/ToolManagementPanel'));
const AgentSkillsManager   = lazy(() => import('./components/AgentSkillsManager').then(m => ({ default: m.AgentSkillsManager })));
const UserProfile          = lazy(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfile })));
const UserManagement       = lazy(() => import('./pages/UserManagement').then(m => ({ default: m.UserManagement })));
const Pricing              = lazy(() => import('./pages/Pricing'));
const BillingSuccess       = lazy(() => import('./pages/BillingSuccess'));
const Integrations         = lazy(() => import('./pages/Integrations'));
const ArtifactLibrary      = lazy(() => import('./pages/ArtifactLibrary'));
const HyperAgentDashboard  = lazy(() => import('./pages/HyperAgentDashboard'));
const AgentChatInterface   = lazy(() => import('./components/agent/AgentChatInterface').then(m => ({ default: m.AgentChatInterface })));
const SlackMappings        = lazy(() => import('./pages/SlackMappings'));
const CronSchedules        = lazy(() => import('./pages/CronSchedules'));
const MCPServer            = lazy(() => import('./pages/MCPServer'));
const EmailConfig          = lazy(() => import('./pages/EmailConfig'));
const AgentManagement      = lazy(() => import('./pages/AgentManagement'));

// ---------------------------------------------------------------------------
// MUI theme (sourced from tokens — no hardcoded hex here)
// ---------------------------------------------------------------------------
const darkTheme = createTheme(muiTheme as Parameters<typeof createTheme>[0]);

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTaskMode, setIsTaskMode] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { currentChat } = useChat();
  const location = useLocation();

  // Sidebar collapse events from browser-automation and canvas
  React.useEffect(() => {
    const collapse = (e: CustomEvent) => {
      if (e.detail?.collapse !== undefined) setIsSidebarCollapsed(true);
    };
    window.addEventListener('browser-automation:sidebar-collapse' as any, collapse);
    window.addEventListener('canvas:sidebar-collapse' as any, collapse);
    return () => {
      window.removeEventListener('browser-automation:sidebar-collapse' as any, collapse);
      window.removeEventListener('canvas:sidebar-collapse' as any, collapse);
    };
  }, []);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-base">
        <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-brand-cyan animate-spin" />
      </div>
    );
  }

  // Role-based dashboard dispatcher
  const DashboardComponent = () => {
    if (!user) return <Navigate to="/chat" replace />;
    switch (user.role) {
      case UserRole.SUPER_ADMIN: return <SuperAdminDashboard />;
      case UserRole.RESELLER:    return <ResellerDashboard />;
      case UserRole.CUSTOMER:    return <CustomerDashboard />;
      default:                   return <Navigate to="/chat" replace />;
    }
  };

  const AgentConfigDashboardComponent = () => {
    if (!user) return <Navigate to="/chat" replace />;
    return <AgentConfigDashboard />;
  };

  const hideSidebar = location.pathname === '/';

  return (
    <LanguageProvider>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <div className="app-container flex h-screen bg-surface-base text-white overflow-hidden w-full max-w-full min-w-0">

          <Toaster
            position="top-right"
            gutter={8}
            containerStyle={{ top: 16, right: 16 }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1A1A1A',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '13px',
                maxWidth: '380px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
              },
              success: {
                duration: 3000,
                style: {
                  border: '1px solid rgba(16,185,129,0.3)',
                },
                iconTheme: { primary: '#10B981', secondary: '#000' },
              },
              error: {
                duration: 5000,
                style: {
                  border: '1px solid rgba(239,68,68,0.3)',
                },
                iconTheme: { primary: '#EF4444', secondary: '#000' },
              },
              loading: {
                style: {
                  border: '1px solid rgba(0,243,255,0.2)',
                },
                iconTheme: { primary: '#00F3FF', secondary: '#000' },
              },
            }}
          />

          {!hideSidebar && (
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onSettingsClick={() => setIsSettingsOpen(true)}
            />
          )}

          <main className="flex-1 overflow-hidden min-w-0">
            <ErrorBoundary>
              {/* Suspense wraps all lazy routes — PageLoader keeps the shell visible */}
              <Suspense fallback={<PageLoader />}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    style={{ height: '100%', width: '100%', overflow: 'hidden' }}
                  >
                    <Routes>

                      {/* ── Public ─────────────────────────────────────────── */}
                      <Route path="/"        element={<HomeScreen />} />
                      <Route path="/landing" element={<LandingV2 />} />
                      <Route path="/login"   element={<Login />} />

                      {/* ── Protected ──────────────────────────────────────── */}
                      <Route element={<PrivateRoute />}>

                        {/* Chat — kept synchronous for fastest perceived load */}
                        <Route path="/chat" element={
                          <>
                            {currentChat && (
                              <TaskIdFixer
                                chatId={currentChat.id}
                                onTaskIdReceived={(taskId) => {
                                  window.dispatchEvent(new CustomEvent('backend-task-id-received', {
                                    detail: { taskId, chatId: currentChat.id },
                                  }));
                                }}
                              />
                            )}
                            <Chat isTaskMode={isTaskMode} />
                          </>
                        } />

                        {/* Builder Studio */}
                        <Route path="/builder"            element={<Suspense fallback={<div className="flex h-full items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-white/15 border-t-brand-cyan animate-spin" /></div>}><BuilderStudio /></Suspense>} />

                        {/* Automation */}
                        <Route path="/automation-workspace" element={<Suspense fallback={<div className="flex h-full items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-white/15 border-t-brand-cyan animate-spin" /></div>}><AutomationWorkspace /></Suspense>} />
                        <Route path="/scheduled-tasks"    element={<ScheduledTasks />} />
                        <Route path="/autonomous-tasks"   element={<AutonomousTasksPage />} />

                        {/* Teams */}
                        <Route path="/teams"              element={<AgentTeams />} />
                        <Route path="/teams/:teamId"      element={<TeamDetail />} />

                        {/* Command / QA */}
                        <Route path="/qa"                 element={<CommandCentre />} />
                        <Route path="/qa/:sessionId"      element={<QASessionDetail />} />
                        <Route path="/command-center"     element={<Suspense fallback={<div className="flex h-full items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-white/15 border-t-brand-cyan animate-spin" /></div>}><HyperAgentDashboard /></Suspense>} />

                        {/* Sumi */}
                        <Route path="/sumi"               element={<SumiIntegration />} />

                        {/* Agent surfaces */}
                        <Route path="/agent-chat/:agentId"     element={<AgentChatInterfaceWrapper />} />
                        <Route path="/agent-knowledge/:agentId" element={<AgentKnowledgeManager />} />
                        <Route path="/agent-config"        element={<AgentConfigDashboardComponent />} />
                        <Route path="/agent-management"    element={<AgentManagement />} />

                        {/* Knowledge / Skills / Tools */}
                        <Route path="/knowledge"          element={<KnowledgeManagement />} />
                        <Route path="/skills"             element={<AgentSkillsManager />} />
                        <Route path="/tools"              element={<ToolManagementPanel />} />

                        {/* Dashboards */}
                        <Route path="/dashboard"          element={<DashboardComponent />} />
                        <Route path="/analytics"          element={<Suspense fallback={<div className="flex h-full items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-white/15 border-t-brand-cyan animate-spin" /></div>}><AgentAnalyticsDashboard /></Suspense>} />

                        {/* User */}
                        <Route path="/profile"            element={<UserProfile />} />
                        <Route path="/pricing"            element={<Pricing />} />
                        <Route path="/billing/success"    element={<BillingSuccess />} />
                        <Route path="/integrations"       element={<Integrations />} />
                        <Route path="/library"            element={<ArtifactLibrary />} />
                        <Route path="/slack-mappings"     element={<SlackMappings />} />
                        <Route path="/cron-schedules"     element={<CronSchedules />} />
                        <Route path="/mcp-server"         element={<MCPServer />} />
                        <Route path="/email-config"       element={<EmailConfig />} />

                      </Route>

                      {/* ── Role-gated ─────────────────────────────────────── */}
                      <Route element={<PrivateRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.RESELLER]} />}>
                        <Route path="/users" element={<UserManagement />} />
                      </Route>

                      {/* ── 404 ────────────────────────────────────────────── */}
                      <Route path="*" element={<NotFound />} />

                    </Routes>
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </ErrorBoundary>
          </main>

          {isSettingsOpen && (
            <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          )}

          <WebAutomationIntegration showButton={false} />
        </div>
      </ThemeProvider>
    </LanguageProvider>
  );
}

// ---------------------------------------------------------------------------
// Helpers — extracted to avoid hooks-in-callback violations
// ---------------------------------------------------------------------------

/** Reads :agentId from URL params cleanly (replaces the window.location.split hack). */
function AgentChatInterfaceWrapper() {
  const { agentId } = useParams<{ agentId: string }>();
  return <AgentChatInterface agentId={Number(agentId ?? 0)} />;
}

/** Simple 404 page */
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-surface-base text-white p-8 gap-6">
      <h1 className="text-6xl font-bold text-brand-cyan">404</h1>
      <p className="text-xl text-white/60">Page not found</p>
      <a
        href="/chat"
        className="px-6 py-2 rounded-lg border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
      >
        Back to chat
      </a>
    </div>
  );
}

export default App;
