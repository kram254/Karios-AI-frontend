import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Settings, ChevronLeft, ChevronRight, Users, Database, LayoutDashboard, UserCircle, Bot } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/user';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [creatingChat, setCreatingChat] = useState(false);

  const handleCreateNewChat = async () => {
    if (creatingChat) return;
    
    try {
      setCreatingChat(true);
      await createNewChat();
      navigate('/chat');
      toast.success('New chat created successfully');
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error('Failed to create new chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  const handleChatSelect = (chat: any) => {
    setCurrentChat(chat);
    navigate('/chat');
  };

  const handleNavigateToAgents = async () => {
    try {
      console.log('Navigating to Agents page');
      navigate('/agents', { replace: true });
    } catch (error) {
      console.error('Error navigating to agents:', error);
      toast.error('Failed to navigate to agents page');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside
      className={`bg-[#0A0A0A] text-white border-r border-[#2A2A2A] transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
        {!isCollapsed && <h1 className="text-xl font-bold">Agentando AI</h1>}
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

      {/* Main Navigation */}
      <div className="border-b border-[#2A2A2A] py-2">
        {/* Chat Section */}
        <button
          onClick={() => navigate('/chat')}
          className={`w-full flex items-center p-4 hover:bg-[#2A2A2A] transition-colors ${
            isActive('/chat') ? 'bg-[#2A2A2A]' : ''
          }`}
        >
          <MessageSquare className="w-5 h-5 text-cyan-500" />
          {!isCollapsed && <span className="ml-3">Chat</span>}
        </button>

        {/* New Chat Button */}
        <button
          onClick={handleCreateNewChat}
          disabled={creatingChat}
          className={`flex items-center p-4 hover:bg-[#2A2A2A] transition-colors ${
            creatingChat ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Plus className="w-5 h-5 text-cyan-500" />
          {!isCollapsed && <span className="ml-3">New Chat</span>}
        </button>

        {/* Agent Management */}
        <button
          onClick={handleNavigateToAgents}
          className={`w-full flex items-center p-4 hover:bg-[#2A2A2A] transition-colors ${
            isActive('/agents') ? 'bg-[#2A2A2A]' : ''
          }`}
        >
          <Users className="w-5 h-5 text-cyan-500" />
          {!isCollapsed && <span className="ml-3">Agents</span>}
        </button>

        {/* Agent Chat */}
        <button
          onClick={() => navigate('/agent-chat')}
          className={`w-full flex items-center p-4 hover:bg-[#2A2A2A] transition-colors ${
            location.pathname.includes('/agent-chat') ? 'bg-[#2A2A2A]' : ''
          }`}
        >
          <Bot className="w-5 h-5 text-cyan-500" />
          {!isCollapsed && <span className="ml-3">Agent Chat</span>}
        </button>

        {/* Knowledge Management */}
        <button
          onClick={() => navigate('/knowledge')}
          className={`w-full flex items-center p-4 hover:bg-[#2A2A2A] transition-colors ${
            isActive('/knowledge') ? 'bg-[#2A2A2A]' : ''
          }`}
        >
          <Database className="w-5 h-5 text-cyan-500" />
          {!isCollapsed && <span className="ml-3">Knowledge</span>}
        </button>

        {/* Divider */}
        <div className="py-2 border-b border-[#2A2A2A]" />

        {/* Dashboard - Only for SUPER_ADMIN, RESELLER or CUSTOMER */}
        {user && [UserRole.SUPER_ADMIN, UserRole.RESELLER, UserRole.CUSTOMER].includes(user.role) && (
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center p-4 hover:bg-[#2A2A2A] transition-colors ${
              isActive('/dashboard') ? 'bg-[#2A2A2A]' : ''
            }`}
          >
            <LayoutDashboard className="w-5 h-5 text-cyan-500" />
            {!isCollapsed && <span className="ml-3">Dashboard</span>}
          </button>
        )}

        {/* User Management - Only for SUPER_ADMIN and RESELLER */}
        {user && [UserRole.SUPER_ADMIN, UserRole.RESELLER].includes(user.role) && (
          <button
            onClick={() => navigate('/users')}
            className={`w-full flex items-center p-4 hover:bg-[#2A2A2A] transition-colors ${
              isActive('/users') ? 'bg-[#2A2A2A]' : ''
            }`}
          >
            <Users className="w-5 h-5 text-cyan-500" />
            {!isCollapsed && <span className="ml-3">Users</span>}
          </button>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats && chats.length > 0 ? (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleChatSelect(chat)}
              className={`w-full flex items-center p-4 hover:bg-[#2A2A2A] transition-colors ${
                currentChat?.id === chat.id ? 'bg-[#2A2A2A]' : ''
              }`}
            >
              <MessageSquare className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              {!isCollapsed && (
                <div className="ml-3 text-left overflow-hidden">
                  <div className="font-medium truncate">{chat.title}</div>
                  <div className="text-sm text-gray-400 truncate">
                    {chat.messages && chat.messages.length > 0
                      ? chat.messages[chat.messages.length - 1]?.content.substring(0, 30) + '...'
                      : 'No messages yet'}
                  </div>
                </div>
              )}
            </button>
          ))
        ) : (
          !isCollapsed && (
            <div className="p-4 text-gray-400 text-center">No chats yet</div>
          )
        )}
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-[#2A2A2A]">
        {/* Profile */}
        <button
          onClick={() => navigate('/profile')}
          className={`w-full flex items-center p-4 hover:bg-[#2A2A2A] transition-colors ${
            isActive('/profile') ? 'bg-[#2A2A2A]' : ''
          }`}
        >
          <UserCircle className="w-5 h-5 text-cyan-500" />
          {!isCollapsed && <span className="ml-3">Profile</span>}
        </button>

        {/* Settings */}
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center p-4 hover:bg-[#2A2A2A] transition-colors"
        >
          <Settings className="w-5 h-5 text-cyan-500" />
          {!isCollapsed && <span className="ml-3">Settings</span>}
        </button>
      </div>
    </aside>
  );
};
