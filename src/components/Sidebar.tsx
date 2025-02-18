import React, { useState } from 'react';
import { MessageSquare, Plus, Settings as SettingsIcon, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useChat } from '../context/ChatContext';
import toast from 'react-hot-toast';

interface SidebarProps {
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const { chats, currentChat, setCurrentChat, createNewChat, loading } = useChat();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const handleCreateNewChat = async () => {
    setIsCreatingChat(true);
    try {
      await createNewChat();
    } catch (error) {
      toast.error('Failed to create new chat');
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="w-80 h-screen bg-[#0A0A0A] border-r border-[#00F3FF] shadow-[0_0_15px_-3px_rgba(0,243,255,0.4)] flex flex-col relative">
      {/* Neon border effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-[#00F3FF] to-transparent opacity-50" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent opacity-50" />
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent opacity-50" />
      </div>

      {/* Header */}
      <div className="p-4 flex items-center space-x-2 relative z-10">
        <MessageSquare className="w-6 h-6 text-[#00F3FF] animate-pulse" />
        <h1 className="text-xl font-semibold text-white">Agentando AI</h1>
      </div>

      {/* New Chat Button */}
      <button
        onClick={handleCreateNewChat}
        disabled={isCreatingChat}
        className="mx-4 mb-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#00F3FF] to-[#00D4FF] text-black rounded-lg hover:from-[#00D4FF] hover:to-[#00F3FF] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_10px_-3px_rgba(0,243,255,0.5)]"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">New Chat</span>
      </button>

      {/* Recent Conversations */}
      <div className="px-4 mb-2">
        <h2 className="text-sm font-medium text-[#00F3FF]">Recent Conversations</h2>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#00F3FF] scrollbar-track-gray-800">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-[#00F3FF] text-sm animate-pulse">Loading conversations...</div>
          </div>
        ) : (
          <AnimatePresence>
            {chats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`px-4 py-3 cursor-pointer transition-all duration-300 ${
                  currentChat?.id === chat.id 
                    ? 'bg-gradient-to-r from-[#00F3FF]/10 to-transparent border-l-2 border-[#00F3FF] shadow-[0_0_10px_-3px_rgba(0,243,255,0.2)]' 
                    : 'hover:bg-[#00F3FF]/5 hover:border-l-2 hover:border-[#00F3FF]/50'
                }`}
                onClick={() => setCurrentChat(chat)}
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className={`w-5 h-5 ${currentChat?.id === chat.id ? 'text-[#00F3FF]' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-sm font-medium truncate">
                      {chat.title}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {format(new Date(chat.created_at), 'yyyy-MM-dd')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-[#00F3FF]/20 bg-gradient-to-t from-[#0A0A0A] to-transparent pt-4">
        <button
          onClick={onOpenSettings}
          className="w-full px-4 py-3 flex items-center space-x-3 text-gray-400 hover:bg-gradient-to-r hover:from-[#00F3FF]/10 hover:to-transparent transition-all duration-300"
        >
          <SettingsIcon className="w-5 h-5" />
          <span>Settings</span>
        </button>
        
        <button
          className="w-full px-4 py-3 flex items-center space-x-3 text-gray-400 hover:bg-gradient-to-r hover:from-[#00F3FF]/10 hover:to-transparent transition-all duration-300"
        >
          <Shield className="w-5 h-5" />
          <span>Admin Dashboard</span>
        </button>

        {/* User Profile */}
        <div className="px-4 py-3 flex items-center space-x-3 border-t border-[#00F3FF]/20">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00F3FF] to-[#00D4FF] flex items-center justify-center shadow-[0_0_10px_-3px_rgba(0,243,255,0.5)]">
            <span className="text-black font-medium">U</span>
          </div>
          <div>
            <div className="text-white text-sm font-medium">User Name</div>
            <div className="text-[#00F3FF]/70 text-xs">Customer</div>
          </div>
        </div>
      </div>
    </div>
  );
};
