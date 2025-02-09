import React, { useState } from 'react';
import { PanelLeftOpen, PanelLeft, Plus, Settings as SettingsIcon, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useChat } from '../context/ChatContext';
import toast from 'react-hot-toast';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
}) => {
  const { chats, currentChat, setCurrentChat, createNewChat, deleteChat, updateChatTitle, loading } = useChat();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const handleCreateNewChat = async () => {
    setIsCreatingChat(true);
    try {
      await createNewChat();
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleEditTitle = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setNewTitle(currentTitle);
  };

  const handleSaveTitle = async (chatId: string) => {
    if (newTitle.trim()) {
      await updateChatTitle(chatId, newTitle.trim());
    }
    setEditingChatId(null);
    setNewTitle('');
  };

  const handleDeleteChat = async (chatId: string) => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      await deleteChat(chatId);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-16 h-screen bg-[#0A0A0A] border-r border-[#00F3FF]/20 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors mb-4"
        >
          <PanelLeft className="w-6 h-6 text-[#00F3FF]" />
        </button>
        <button
          onClick={handleCreateNewChat}
          disabled={isCreatingChat}
          className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors mb-4"
        >
          {isCreatingChat ? (
            <Loader2 className="w-6 h-6 text-[#00F3FF] animate-spin" />
          ) : (
            <Plus className="w-6 h-6 text-[#00F3FF]" />
          )}
        </button>
        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors mt-auto"
        >
          <SettingsIcon className="w-6 h-6 text-[#00F3FF]" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 h-screen bg-[#0A0A0A] border-r border-[#00F3FF]/20 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#00F3FF]/20 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Chats</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCreateNewChat}
            disabled={isCreatingChat}
            className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
          >
            {isCreatingChat ? (
              <Loader2 className="w-5 h-5 text-[#00F3FF] animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-[#00F3FF]" />
            )}
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
          >
            <PanelLeftOpen className="w-5 h-5 text-[#00F3FF]" />
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto py-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-[#00F3FF] animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center p-4">
            <p className="text-gray-400">No chats yet</p>
            <button
              onClick={handleCreateNewChat}
              className="mt-2 text-[#00F3FF] hover:underline"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {chats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`px-4 py-2 cursor-pointer group hover:bg-[#1A1A1A] transition-colors ${
                  currentChat?.id === chat.id ? 'bg-[#1A1A1A]' : ''
                }`}
                onClick={() => setCurrentChat(chat)}
              >
                <div className="flex items-center justify-between">
                  {editingChatId === chat.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="flex-1 bg-[#2A2A2A] text-white px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-[#00F3FF]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveTitle(chat.id)}
                        className="p-1 hover:bg-[#2A2A2A] rounded"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </button>
                      <button
                        onClick={() => setEditingChatId(null)}
                        className="p-1 hover:bg-[#2A2A2A] rounded"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h3 className="text-white font-medium truncate">{chat.title}</h3>
                        <p className="text-xs text-gray-400">
                          {format(new Date(chat.updated_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTitle(chat.id, chat.title);
                          }}
                          className="p-1 hover:bg-[#2A2A2A] rounded"
                        >
                          <Edit2 className="w-4 h-4 text-[#00F3FF]" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                          className="p-1 hover:bg-[#2A2A2A] rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#00F3FF]/20">
        <button
          onClick={onOpenSettings}
          className="w-full py-2 px-4 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#2A2A2A] transition-colors flex items-center justify-center space-x-2"
        >
          <SettingsIcon className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
