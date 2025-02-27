import React, { useState } from 'react';
import Chat from "./components/Chat";
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AgentManagement } from './pages/AgentManagement';
import './styles/theme.css';

// *Modizx* Removed ThemeProvider and added proper routing
function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="app-container flex h-screen bg-[#0A0A0A] text-white">
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
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/agents" element={<AgentManagement />} />
        </Routes>
      </main>
      {isSettingsOpen && (
        <Settings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
