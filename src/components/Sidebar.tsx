import React from 'react';
import { MessageSquare, Plus, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapse: () => void;
  onSettingsClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onCollapse,
  onSettingsClick,
}) => {
  const { chats, currentChat, createNewChat, setCurrentChat } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCreateNewChat = async () => {
    try {
      await createNewChat();
      navigate('/chat');
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleChatSelect = (chat: any) => {
    setCurrentChat(chat);
    navigate('/chat');
  };

  return (
    <aside
      className={`bg-[#0A0A0A] text-white border-r border-[#2A2A2A] transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
        {!isCollapsed && <h1 className="text-xl font-bold">Chats</h1>}
        <button
          onClick={onCollapse}
          className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* New Chat Button */}
      <button
        onClick={handleCreateNewChat}
        className="m-4 p-3 bg-cyan-500 text-black rounded-lg hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        {!isCollapsed && <span>New Chat</span>}
      </button>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => handleChatSelect(chat)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-[#2A2A2A] transition-colors ${
              currentChat?.id === chat.id ? 'bg-[#2A2A2A]' : ''
            }`}
          >
            <MessageSquare className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 text-left truncate">
                <p className="truncate">{chat.title || 'New Chat'}</p>
                <p className="text-xs text-gray-400 truncate">
                  {chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1].content
                    : 'No messages'}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#2A2A2A]">
        <button
          onClick={onSettingsClick}
          className="w-full p-3 flex items-center gap-3 hover:bg-[#2A2A2A] rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
};
