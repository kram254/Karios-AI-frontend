import React, { useState } from 'react';
import Chat from "./components/Chat";
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { Toaster } from 'react-hot-toast';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <div className="flex-1 overflow-hidden">
        <Chat />
      </div>
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'bg-[#1A1A1A] text-white border border-[#00F3FF]/20',
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid rgba(0, 243, 255, 0.2)',
          },
        }}
      />
    </div>
  );
}

export default App;