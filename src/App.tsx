import React, { useState } from 'react';
import Chat from "./components/Chat";
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { AgentManagement } from './pages/AgentManagement';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00F3FF',
    },
    background: {
      default: '#121212',
      paper: '#1A1A1A',
    },
  },
});

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={
            <main className="h-screen w-screen flex bg-[#0A0A0A]">
              <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Chat />
              </div>
              <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
              <Toaster 
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#1A1A1A',
                    color: '#fff',
                    border: '1px solid rgba(0, 243, 255, 0.2)',
                  },
                }}
              />
            </main>
          } />
          <Route path="/agent-management" element={<AgentManagement />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;