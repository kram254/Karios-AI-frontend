import React, { useState } from 'react';
import { MessageSquare, Plus, Settings, ChevronLeft, ChevronRight, Users, Database, LayoutDashboard, UserCircle, Bot, MoreVertical, Share2, Edit, Trash2, Zap } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/user';
import AgentSelectionModal from './agent/AgentSelectionModal';
import { Agent } from '../types/agent';

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
  const { chats, currentChat, createNewChat, setCurrentChat, createAgentChat, deleteChat, updateChatTitle } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [creatingChat, setCreatingChat] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<{ id: string, element: HTMLElement } | null>(null);

  const handleCreateNewChat = async () => {
    if (creatingChat) return;
    
    try {
      setCreatingChat(true);
      
      window.dispatchEvent(new CustomEvent('chat:reset-browser-state'));
      
      const newChat = await createNewChat();
      if (newChat) {
        navigate('/chat');
        toast.success('New chat created successfully');
      } else {
        throw new Error('Failed to create new chat');
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error('Failed to create new chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  const handleChatSelect = (chat: any) => {
    window.dispatchEvent(new CustomEvent('chat:reset-browser-state'));
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

  const handleShowAgentModal = () => {
    setShowAgentModal(true);
  };

  const handleSelectAgent = async (agent: Agent) => {
    try {
      setCreatingChat(true);
      console.log('Selected agent for chat creation:', agent);
      
      // Pass the agent directly to createAgentChat to avoid race condition
      const chat = await createAgentChat(agent);
      if (chat) {
        setCurrentChat(chat);
        navigate('/chat');
        toast.success(`Started chat with ${agent.name}`);
      } else {
        throw new Error('Failed to create agent chat');
      }
    } catch (error) {
      console.error('Error creating agent chat:', error);
      toast.error('Failed to create agent chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside
      className={`neon-card border-r border-neon-purple/20 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 neon-section-header flex items-center justify-between">
        {!isCollapsed && <h1 className="text-xl font-bold">Karios AI</h1>}
        <button
          onClick={onCollapse}
          className="neon-btn-secondary p-2 rounded-lg"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="border-b border-neon-purple/20 py-2">
        {/* Chat Section */}
        <button
          onClick={() => navigate('/chat')}
          className={`w-full flex items-center p-4 transition-colors ${
            isActive('/chat') ? 'neon-tab-active' : 'neon-btn-secondary'
          }`}
        >
          <MessageSquare className="w-5 h-5 text-neon-cyan neon-icon" />
          {!isCollapsed && <span className="ml-3">Chat</span>}
        </button>

        {/* New Chat Button */}
        <button
          onClick={handleCreateNewChat}
          disabled={creatingChat}
          className={`w-full flex items-center p-4 neon-btn-secondary transition-colors ${
            creatingChat ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Plus className="w-5 h-5 text-neon-cyan neon-icon" />
          {!isCollapsed && <span className="ml-3">New Chat</span>}
        </button>

        {/* Agent Management */}
        <button
          onClick={handleNavigateToAgents}
          className={`w-full flex items-center p-4 transition-colors ${
            isActive('/agents') ? 'neon-tab-active' : 'neon-btn-secondary'
          }`}
        >
          <Bot className="w-5 h-5 text-neon-cyan neon-icon" />
          {!isCollapsed && <span className="ml-3">Agents</span>}
        </button>

        {/* Agent Chat */}
        <button
          onClick={handleShowAgentModal}
          className={`w-full flex items-center p-4 transition-colors ${
            location.pathname.includes('/agent-chat') ? 'neon-tab-active' : 'neon-btn-secondary'
          }`}
        >
          <Bot className="w-5 h-5 text-neon-cyan neon-icon" />
          {!isCollapsed && <span className="ml-3">Agent Chat</span>}
        </button>

        {/* Knowledge Management */}
        <button
          onClick={() => navigate('/knowledge')}
          className={`w-full flex items-center p-4 transition-colors ${
            isActive('/knowledge') ? 'neon-tab-active' : 'neon-btn-secondary'
          }`}
        >
          <Database className="w-5 h-5 text-neon-cyan neon-icon" />
          {!isCollapsed && <span className="ml-3">Knowledge</span>}
        </button>

        {/* Divider */}
        <div className="py-2 border-b border-[#2A2A2A]" />

        {/* Dashboard - Only for SUPER_ADMIN, RESELLER or CUSTOMER */}
        {user && [UserRole.SUPER_ADMIN, UserRole.RESELLER, UserRole.CUSTOMER].includes(user.role) && (
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full flex items-center p-4 transition-colors ${
                isActive('/dashboard') ? 'neon-tab-active' : 'neon-btn-secondary'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 text-neon-cyan neon-icon" />
              {!isCollapsed && <span className="ml-3">Main Dashboard</span>}
            </button>
            {!isCollapsed && (
              <>
                <button
                  onClick={() => navigate('/agent-config')}
                  className={`w-full flex items-center px-4 py-2 ml-2 transition-colors ${
                    isActive('/agent-config') ? 'neon-tab-active' : 'neon-btn-secondary'
                  }`}
                >
                  <Bot className="w-4 h-4 text-neon-cyan neon-icon" />
                  <span className="ml-3 text-sm">Agent Config</span>
                </button>
                <button
                  onClick={() => navigate('/autonomous-tasks')}
                  className={`w-full flex items-center px-4 py-2 ml-2 transition-colors ${
                    isActive('/autonomous-tasks') ? 'neon-tab-active' : 'neon-btn-secondary'
                  }`}
                >
                  <Zap className="w-4 h-4 text-neon-cyan neon-icon" />
                  <span className="ml-3 text-sm">Task Builder</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="py-2 border-b border-neon-purple/20" />


        {/* User Management - Only for SUPER_ADMIN and RESELLER */}
        {user && [UserRole.SUPER_ADMIN, UserRole.RESELLER].includes(user.role) && (
          <button
            onClick={() => navigate('/users')}
            className={`w-full flex items-center p-4 transition-colors ${
              isActive('/users') ? 'neon-tab-active' : 'neon-btn-secondary'
            }`}
          >
            <Users className="w-5 h-5 text-neon-cyan neon-icon" />
            {!isCollapsed && <span className="ml-3">Users</span>}
          </button>
        )}
      </div>

      {/* Conversations Heading */}
      <div className="py-2 border-b border-neon-purple/20">
        {!isCollapsed && (
          <div className="px-4 py-2 text-sm font-medium text-gray-400">
            Conversations
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats && chats.length > 0 ? (
          chats.map((chat) => (
            <div 
              key={chat.id}
              className={`relative w-full flex items-center p-4 group transition-colors ${
                currentChat?.id === chat.id ? 'neon-tab-active' : 'neon-btn-secondary'
              }`}
              style={{ position: 'relative' }}
            >
              <div 
                className="flex-1 flex items-center cursor-pointer" 
                onClick={() => handleChatSelect(chat)}
              >
                <MessageSquare className="w-5 h-5 text-neon-cyan neon-icon flex-shrink-0" />
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
              </div>
              
              {!isCollapsed && (
                <div className="absolute right-0 mr-2" style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAnchorEl({ id: chat.id, element: e.currentTarget as HTMLElement });
                    }}
                    className="p-1 hover:bg-[#3A3A3A] rounded-full transition-colors flex items-center justify-center group-hover:bg-[#3A3A3A]"
                    style={{ 
                      display: 'flex', 
                      visibility: 'visible', 
                      opacity: 1,
                      zIndex: 50,
                      backgroundColor: '#2A2A2A',
                      width: '24px',
                      height: '24px'
                    }}
                    aria-label="Chat options"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  {menuAnchorEl?.id === chat.id && (
                    <div className="absolute right-0 top-8 bg-[#292929] shadow-lg rounded-md overflow-hidden z-10 w-36 border border-[#3A3A3A]">
                      <button 
                        className="w-full flex items-center px-3 py-2 hover:bg-[#3A3A3A] text-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Share chat:', chat.id);
                          // Implement share functionality here
                          toast.success('Chat sharing feature coming soon');
                          setMenuAnchorEl(null);
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        <span>Share</span>
                      </button>
                      
                      <button 
                        className="w-full flex items-center px-3 py-2 hover:bg-[#3A3A3A] text-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Rename chat:', chat.id);
                          const newTitle = prompt('Enter a new name for this chat:', chat.title);
                          if (newTitle && newTitle.trim() !== '') {
                            // Call the updateChatTitle function from context
                            updateChatTitle(chat.id, newTitle);
                          }
                          setMenuAnchorEl(null);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        <span>Rename</span>
                      </button>
                      
                      <button 
                        className="w-full flex items-center px-3 py-2 hover:bg-[#3A3A3A] text-left text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Delete chat:', chat.id);
                          if (confirm('Are you sure you want to delete this chat?')) {
                            // Call the deleteChat function from context
                            deleteChat(chat.id);
                          }
                          setMenuAnchorEl(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          !isCollapsed && (
            <div className="p-4 text-gray-400 text-center">No chats yet</div>
          )
        )}
      </div>
      
      {/* Click outside to close menu */}
      {menuAnchorEl && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setMenuAnchorEl(null)}
        />
      )}

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
      <AgentSelectionModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        onSelectAgent={handleSelectAgent}
      />
    </aside>
  );
};
