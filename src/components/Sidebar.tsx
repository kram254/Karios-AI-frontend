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
    <div className="w-80 h-screen bg-[#0A0A0A] border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center space-x-2">
        <MessageSquare className="w-6 h-6 text-[#00F3FF]" />
        <h1 className="text-xl font-semibold text-white">Agentando AI</h1>
      </div>

      {/* New Chat Button */}
      <button
        onClick={handleCreateNewChat}
        disabled={isCreatingChat}
        className="mx-4 mb-4 flex items-center space-x-2 px-4 py-2 bg-[#00F3FF] text-black rounded-lg hover:bg-[#00D4FF] transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">New Chat</span>
      </button>

      {/* Recent Conversations */}
      <div className="px-4 mb-2">
        <h2 className="text-sm font-medium text-gray-400">Recent Conversations</h2>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-[#00F3FF] text-sm">Loading conversations...</div>
          </div>
        ) : (
          <AnimatePresence>
            {chats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition-colors ${
                  currentChat?.id === chat.id ? 'bg-gray-800/50' : ''
                }`}
                onClick={() => setCurrentChat(chat)}
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
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
      <div className="mt-auto border-t border-gray-800">
        <button
          onClick={onOpenSettings}
          className="w-full px-4 py-3 flex items-center space-x-3 text-gray-400 hover:bg-gray-800/50 transition-colors"
        >
          <SettingsIcon className="w-5 h-5" />
          <span>Settings</span>
        </button>
        
        <button
          className="w-full px-4 py-3 flex items-center space-x-3 text-gray-400 hover:bg-gray-800/50 transition-colors"
        >
          <Shield className="w-5 h-5" />
          <span>Admin Dashboard</span>
        </button>

        {/* User Profile */}
        <div className="px-4 py-3 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#00F3FF] flex items-center justify-center">
            <span className="text-black font-medium">U</span>
          </div>
          <div>
            <div className="text-white text-sm font-medium">User Name</div>
            <div className="text-gray-400 text-xs">Customer</div>
          </div>
        </div>
      </div>
    </div>
  );
};
