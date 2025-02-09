import React, { memo } from 'react';
import { MessageSquare, Settings, Shield, ChevronLeft, ChevronRight, Plus, MessageCircle, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChat } from '../context/ChatContext';
import { format } from 'date-fns';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
}

const ConversationItem = memo(({ chat, onSelect, onDelete, onEdit, isActive }: {
  chat: any;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isActive: boolean;
}) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    className={`w-full p-3 rounded-lg transition-colors group relative ${
      isActive ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]'
    }`}
  >
    <button
      onClick={onSelect}
      className="w-full flex items-center space-x-3 text-left"
    >
      <MessageCircle className={`w-5 h-5 ${isActive ? 'text-[#00F3FF]' : 'text-gray-400 group-hover:text-[#00F3FF]'}`} />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-white truncate">{chat.title}</span>
        <span className="text-xs text-gray-500">
          {format(new Date(chat.updated_at), 'MMM d, yyyy')}
        </span>
      </div>
    </button>
    
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={onEdit}
        className="p-1 hover:bg-[#2A2A2A] rounded-md"
      >
        <Edit2 className="w-4 h-4 text-gray-400 hover:text-[#00F3FF]" />
      </button>
      <button
        onClick={onDelete}
        className="p-1 hover:bg-[#2A2A2A] rounded-md"
      >
        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
      </button>
    </div>
  </motion.div>
));

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
}) => {
  const {
    chats,
    currentChat,
    createNewChat,
    setCurrentChat,
    deleteChat,
    updateChatTitle,
  } = useChat();

  const handleNewChat = () => {
    createNewChat();
  };

  const handleEditTitle = async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const newTitle = prompt('Enter new title:', chat.title);
    if (newTitle && newTitle !== chat.title) {
      await updateChatTitle(chatId, newTitle);
    }
  };

  return (
    <div
      className={`${
        isCollapsed ? 'w-16' : 'w-72'
      } h-full flex flex-col bg-[#0A0A0A] border-r border-[#00F3FF]/20 transition-all duration-300 ease-in-out relative`}
    >
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-4">
          <MessageSquare className="w-6 h-6 text-[#00F3FF] flex-shrink-0" />
          {!isCollapsed && <h1 className="text-xl font-bold text-white">Agentando AI</h1>}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewChat}
          className={`w-full p-2 bg-[#00F3FF] text-black rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 mb-4`}
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && <span>New Chat</span>}
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {!isCollapsed && (
          <div className="space-y-2">
            {chats.map((chat) => (
              <ConversationItem
                key={chat.id}
                chat={chat}
                isActive={currentChat?.id === chat.id}
                onSelect={() => setCurrentChat(chat)}
                onDelete={() => deleteChat(chat.id)}
                onEdit={() => handleEditTitle(chat.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#00F3FF]/20">
        <button
          onClick={onOpenSettings}
          className="w-full p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Settings className="w-5 h-5 text-[#00F3FF]" />
          {!isCollapsed && <span className="text-white">Settings</span>}
        </button>
        <button
          onClick={onToggleCollapse}
          className="w-full p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors flex items-center justify-center space-x-2 mt-2"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-[#00F3FF]" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 text-[#00F3FF]" />
              <span className="text-white">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
