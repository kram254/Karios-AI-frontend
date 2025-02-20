import React, { useState } from 'react';
import { MessageSquare, Plus, Settings as SettingsIcon, Shield, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useChat } from '../context/ChatContext';
import toast from 'react-hot-toast';

interface SidebarProps {
  onOpenSettings: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings, isCollapsed, onToggleCollapse }) => {
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
    <div className={`flex flex-col h-full bg-[#1A1A1A] border-r border-[#2A2A2A] transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && <h2 className="text-lg font-semibold text-white">Chats</h2>}
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
        >
          <ChevronLeft className={`h-5 w-5 text-gray-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`cursor-pointer p-3 ${
                currentChat?.id === chat.id ? 'bg-[#2A2A2A]' : 'hover:bg-[#2A2A2A]'
              } transition-colors`}
              onClick={() => setCurrentChat(chat)}
            >
              {!isCollapsed ? (
                <>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-300 truncate">{chat.title || 'New Chat'}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {format(new Date(chat.created_at), 'MMM d, yyyy')}
                  </div>
                </>
              ) : (
                <div className="flex justify-center">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-[#2A2A2A]">
        <button
          onClick={handleCreateNewChat}
          disabled={loading || isCreatingChat}
          className={`w-full flex items-center justify-center gap-2 p-2 ${
            isCollapsed ? '' : 'px-4'
          } bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Plus className="h-5 w-5" />
          {!isCollapsed && <span>New Chat</span>}
        </button>
        
        <button
          onClick={onOpenSettings}
          className={`mt-2 w-full flex items-center justify-center gap-2 p-2 ${
            isCollapsed ? '' : 'px-4'
          } text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors`}
        >
          <SettingsIcon className="h-5 w-5" />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>
    </div>
  );
};
