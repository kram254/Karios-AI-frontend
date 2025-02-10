import React, { useState } from 'react';
import Chat from "./components/Chat";
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { Toaster } from 'react-hot-toast';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
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
  );
}

export default App;