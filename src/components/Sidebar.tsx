import React, { useState, useEffect } from 'react';
import CommandPalette from './ui/CommandPalette';
import { MessageSquare, Plus, Settings, ChevronLeft, ChevronRight, Users, Database, LayoutDashboard, UserCircle, Bot, MoreVertical, Share2, Edit, Trash2, Zap, Paintbrush, Wrench, PlugZap, Clock, Shield, Layers, Monitor, Library, Gauge, Hash, Calendar, Cpu, Mail } from 'lucide-react';
import { scheduledTasksService } from '../services/api/scheduled-tasks.service';
import { useChat } from '../context/ChatContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/user';
import AgentSelectionModal, { AgentSelectionResult } from './agent/AgentSelectionModal';
import { Agent } from '../types/agent';
import { ThreadStatusBadge } from './canvas/ThreadStatusBadge';
import { useAllChatStatuses } from '../hooks/useChatStatus';

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
  const { translate } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [creatingChat, setCreatingChat] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<{ id: string, element: HTMLElement } | null>(null);
  const [runningTasksCount, setRunningTasksCount] = useState(0);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const chatStatuses = useAllChatStatuses();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [isCollapsed]);

  useEffect(() => {
    if (location.pathname === '/login' || !isAuthenticated || !user) return;
    const fetchRunning = () => {
      scheduledTasksService.listScheduledTasks({}).then(r => {
        setRunningTasksCount(r.data.items.filter(s => s.last_status === 'running').length);
      }).catch(() => {});
    };
    fetchRunning();
    const iv = setInterval(fetchRunning, 30000);
    return () => clearInterval(iv);
  }, [isAuthenticated, location.pathname, user]);

  // Cmd+K / Ctrl+K — open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);


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
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }; message?: string };
      const errorMsg = err?.response?.status === 401
        ? 'Session expired. Please refresh the page.'
        : err?.message?.includes('network') || err?.message?.includes('Network')
        ? 'Connection issue. Please check your internet.'
        : 'Failed to create new chat. Please try again.';
      toast.error(errorMsg);
    } finally {
      setCreatingChat(false);
    }
  };

  const handleChatSelect = (chat: { id: string }) => {
    window.dispatchEvent(new CustomEvent('chat:reset-browser-state'));
    setCurrentChat(chat as Parameters<typeof setCurrentChat>[0]);
    navigate('/chat');
  };

  const handleShowAgentModal = () => {
    try { sessionStorage.setItem('open_agent_modal', '1'); } catch {}
    navigate('/chat');
    setShowAgentModal(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-agent-selection-modal'));
    }, 100);
  };

  const handleSelectAgent = async (selection: AgentSelectionResult) => {
    try {
      setCreatingChat(true);
      if ((selection as unknown as { selection_type?: string })?.selection_type === 'workflow') {
        try {
          sessionStorage.setItem('builder_open_workflow_id', String((selection as unknown as { workflow_id: string }).workflow_id));
          sessionStorage.setItem('builder_open_workflow_chat', '1');
        } catch {}
        navigate('/builder');
        return;
      }

      const agent = selection as unknown as Agent;

      const chat = await createAgentChat(agent);
      if (chat) {
        setCurrentChat(chat);
        navigate('/chat');
        toast.success(`Started chat with ${agent.name}`);
      } else {
        throw new Error('Failed to create agent chat');
      }
    } catch {
      toast.error('Failed to create agent chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isActivePrefix = (prefix: string) => location.pathname.startsWith(prefix);

  const handleRenameStart = (chatId: string, currentTitle: string) => {
    setRenamingChatId(chatId);
    setRenameValue(currentTitle);
    setMenuAnchorEl(null);
  };

  const handleRenameSubmit = (chatId: string) => {
    if (renameValue.trim()) {
      updateChatTitle(chatId, renameValue.trim());
      toast.success('Chat renamed');
    }
    setRenamingChatId(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => {
    if (e.key === 'Enter') handleRenameSubmit(chatId);
    if (e.key === 'Escape') {
      setRenamingChatId(null);
      setRenameValue('');
    }
  };

  const handleDeleteChat = (chatId: string) => {
    deleteChat(chatId);
    toast.success('Chat deleted');
    setMenuAnchorEl(null);
  };

  const navItemBaseClass = `group relative flex w-full items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-[10px]'} gap-[10px] overflow-hidden rounded-[8px] py-[8px] text-[13px] leading-none tracking-[0.3px] transition-all duration-150 before:pointer-events-none before:absolute before:inset-0 before:rounded-[8px] before:bg-[rgba(0,212,180,0.08)] before:opacity-0 before:transition-opacity before:duration-150`;

  const getNavItemClass = (active = false, running = false) => {
    if (active || running) {
      return `${navItemBaseClass} bg-[rgba(0,212,180,0.04)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(0,212,180,0.14)] before:opacity-100`;
    }
    return `${navItemBaseClass} text-[#4A5568] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#8A9AB0] hover:before:opacity-100`;
  };

  const getNavIconClass = (active = false, running = false) => {
    if (active || running) {
      return `shrink-0 text-[#00D4B4] transition-all duration-150 ${running ? 'animate-pulse' : ''}`;
    }
    return 'shrink-0 text-[rgba(255,255,255,0.55)] transition-all duration-150 group-hover:text-[rgba(255,255,255,0.8)]';
  };

  const getNavLabelClass = (active = false, running = false) => {
    if (active) return 'text-[13px] font-semibold text-[#00D4B4]';
    if (running) return 'text-[13px] font-medium text-[#8A9AB0]';
    return 'text-[13px] font-medium text-[#4A5568] group-hover:text-[#8A9AB0]';
  };

  const navIconProps = { size: 15, strokeWidth: 1.8 };

  return (
    <aside
      className={`flex flex-col text-[#E8EDF5] transition-all duration-300 ${
        isCollapsed
          ? 'fixed left-3 top-3 bottom-3 z-40 w-20 rounded-2xl border border-[#1C2130] bg-[#0E1117]/85 backdrop-blur-xl shadow-[0_18px_48px_rgba(0,0,0,0.5)] overflow-hidden'
          : 'w-64 border-r border-[#1C2130] bg-[#0E1117]'
      }`}
      style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1C2130] bg-[#0A0D12] px-3 py-3">
        {!isCollapsed && <h1 className="text-[14px] font-semibold tracking-[0.3px] text-[#E8EDF5]">Karios AI</h1>}
        <button
          onClick={onCollapse}
          className="rounded-lg p-2 text-[rgba(255,255,255,0.55)] transition-colors hover:bg-[rgba(255,255,255,0.03)] hover:text-[rgba(255,255,255,0.8)]"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="px-2 py-2">
        {/* Chat */}
        <button
          onClick={() => navigate('/chat')}
          className={getNavItemClass(isActive('/chat'))}
          title="Chat"
        >
          <MessageSquare {...navIconProps} className={getNavIconClass(isActive('/chat'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/chat'))}>{translate('chat')}</span>}
        </button>

        {/* New Chat */}
        <button
          onClick={handleCreateNewChat}
          disabled={creatingChat}
          className={`${getNavItemClass(false)} ${isCollapsed ? 'justify-center' : 'justify-start'} ${creatingChat ? 'cursor-not-allowed opacity-60' : ''}`}
          title="New Chat"
        >
          <Plus {...navIconProps} className={getNavIconClass(false)} />
          {!isCollapsed && <span className={getNavLabelClass(false)}>New Chat</span>}
        </button>

        {/* Builder Studio */}
        <button
          onClick={() => navigate('/builder')}
          className={getNavItemClass(isActive('/builder'))}
          title="Builder Studio"
        >
          <Paintbrush {...navIconProps} className={getNavIconClass(isActive('/builder'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/builder'))}>{translate('builder')}</span>}
        </button>

        <button
          onClick={() => navigate('/agent-management')}
          className={getNavItemClass(isActive('/agent-management'))}
          title="Agent Management"
        >
          <Users {...navIconProps} className={getNavIconClass(isActive('/agent-management'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/agent-management'))}>Agents</span>}
        </button>

        {/* Scheduled Tasks */}
        <button
          onClick={() => navigate('/scheduled-tasks')}
          className={getNavItemClass(isActive('/scheduled-tasks'), runningTasksCount > 0)}
          title="Scheduled Tasks"
        >
          <div className="relative flex items-center">
            <Clock {...navIconProps} className={getNavIconClass(isActive('/scheduled-tasks'), runningTasksCount > 0)} />
            {runningTasksCount > 0 && isCollapsed && (
              <span className="absolute -right-1 top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full bg-[#00D4B4]" />
            )}
          </div>
          {!isCollapsed && <span className={getNavLabelClass(isActive('/scheduled-tasks'), runningTasksCount > 0)}>Scheduled Tasks</span>}
          {!isCollapsed && runningTasksCount > 0 && <span className="ml-auto h-[5px] w-[5px] rounded-full bg-[#00D4B4]" />}
        </button>

        {/* Agent Teams */}
        <button
          onClick={() => navigate('/teams')}
          className={getNavItemClass(isActive('/teams'))}
          title="Agent Teams"
        >
          <Users {...navIconProps} className={getNavIconClass(isActive('/teams'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/teams'))}>Agent Teams</span>}
        </button>

        {/* QA / Command Centre (quality assurance) */}
        <button
          onClick={() => navigate('/qa')}
          className={getNavItemClass(isActive('/qa'))}
          title="QA Centre"
        >
          <Shield {...navIconProps} className={getNavIconClass(isActive('/qa'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/qa'))}>QA Centre</span>}
        </button>

        {/* Fleet Dashboard — was /command-centre (broken), now correctly /command-center */}
        <button
          onClick={() => navigate('/command-center')}
          className={getNavItemClass(isActive('/command-center'))}
          title="Fleet Dashboard"
        >
          <Monitor {...navIconProps} className={getNavIconClass(isActive('/command-center'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/command-center'))}>{translate('fleet')}</span>an>}
        </button>

        {/* Agent Chat */}
        <button
          onClick={handleShowAgentModal}
          className={getNavItemClass(isActivePrefix('/agent-chat'))}
          title="Agent Chat"
        >
          <Bot {...navIconProps} className={getNavIconClass(isActivePrefix('/agent-chat'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActivePrefix('/agent-chat'))}>Agent Chat</span>}
        </button>

        {/* Knowledge Management */}
        <button
          onClick={() => navigate('/knowledge')}
          className={getNavItemClass(isActive('/knowledge'))}
          title="Knowledge"
        >
          <Database {...navIconProps} className={getNavIconClass(isActive('/knowledge'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/knowledge'))}>Knowledge</span>}
        </button>

        {/* Skills */}
        <button
          onClick={() => navigate('/skills')}
          className={getNavItemClass(isActive('/skills'))}
          title="Skills"
        >
          <Zap {...navIconProps} className={getNavIconClass(isActive('/skills'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/skills'))}>Skills</span>}
        </button>

        {/* Library */}
        <button
          onClick={() => navigate('/library')}
          className={getNavItemClass(isActive('/library'))}
          title="Library"
        >
          <Library {...navIconProps} className={getNavIconClass(isActive('/library'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/library'))}>Library</span>}
        </button>

        {/* Gauge / Analytics */}
        <button
          onClick={() => navigate('/analytics')}
          className={getNavItemClass(isActive('/analytics'))}
          title="Analytics"
        >
          <Gauge {...navIconProps} className={getNavIconClass(isActive('/analytics'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/analytics'))}>Analytics</span>}
        </button>

        {/* Integrations — was hidden behind showFooterAutomationLinks */}
        <button
          onClick={() => navigate('/integrations')}
          className={getNavItemClass(isActive('/integrations'))}
          title="Integrations"
        >
          <PlugZap {...navIconProps} className={getNavIconClass(isActive('/integrations'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/integrations'))}>Integrations</span>}
        </button>

        {/* Tool Manager — was hidden behind showFooterAutomationLinks */}
        <button
          onClick={() => navigate('/tools')}
          className={getNavItemClass(isActive('/tools'))}
          title="Tool Manager"
        >
          <Wrench {...navIconProps} className={getNavIconClass(isActive('/tools'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/tools'))}>Tool Manager</span>}
        </button>

        {/* Autonomous Tasks — was hidden behind showFooterAutomationLinks */}
        <button
          onClick={() => navigate('/autonomous-tasks')}
          className={getNavItemClass(isActive('/autonomous-tasks'))}
          title="Autonomous Tasks"
        >
          <Zap {...navIconProps} className={getNavIconClass(isActive('/autonomous-tasks'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/autonomous-tasks'))}>Autonomous Tasks</span>}
        </button>

        {/* Sumi Integration — was hidden behind showFooterAutomationLinks */}
        <button
          onClick={() => navigate('/sumi')}
          className={getNavItemClass(isActive('/sumi'))}
          title="Sumi Integration"
        >
          <Layers {...navIconProps} className={getNavIconClass(isActive('/sumi'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/sumi'))}>Sumi Integration</span>}
        </button>

        <button
          onClick={() => navigate('/slack-mappings')}
          className={getNavItemClass(isActive('/slack-mappings'))}
          title="Slack Mappings"
        >
          <Hash {...navIconProps} className={getNavIconClass(isActive('/slack-mappings'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/slack-mappings'))}>Slack Mappings</span>}
        </button>

        <button
          onClick={() => navigate('/cron-schedules')}
          className={getNavItemClass(isActive('/cron-schedules'))}
          title="Cron Schedules"
        >
          <Calendar {...navIconProps} className={getNavIconClass(isActive('/cron-schedules'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/cron-schedules'))}>Cron Schedules</span>}
        </button>

        <button
          onClick={() => navigate('/mcp-server')}
          className={getNavItemClass(isActive('/mcp-server'))}
          title="MCP Server"
        >
          <Cpu {...navIconProps} className={getNavIconClass(isActive('/mcp-server'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/mcp-server'))}>MCP Server</span>}
        </button>

        <button
          onClick={() => navigate('/email-config')}
          className={getNavItemClass(isActive('/email-config'))}
          title="Email Config"
        >
          <Mail {...navIconProps} className={getNavIconClass(isActive('/email-config'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/email-config'))}>Email Config</span>}
        </button>

        {/* Dashboard — was hidden behind showDashboardShortcut */}
        <button
          onClick={() => navigate('/dashboard')}
          className={getNavItemClass(isActive('/dashboard'))}
          title="Dashboard"
        >
          <LayoutDashboard {...navIconProps} className={getNavIconClass(isActive('/dashboard'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/dashboard'))}>Dashboard</span>}
        </button>

        {/* User Management — Only for SUPER_ADMIN and RESELLER */}
        {user && [UserRole.SUPER_ADMIN, UserRole.RESELLER].includes(user.role) && (
          <button
            onClick={() => navigate('/users')}
            className={getNavItemClass(isActive('/users'))}
            title="Users"
          >
            <Users {...navIconProps} className={getNavIconClass(isActive('/users'))} />
            {!isCollapsed && <span className={getNavLabelClass(isActive('/users'))}>Users</span>}
          </button>
        )}
      </div>

      {/* Conversations Heading */}
      <div className="px-3 pb-1 pt-2">
        {!isCollapsed && (
          <div className="text-[9px] font-semibold uppercase tracking-[1.2px] text-[#3D4A5C]">
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
              className={`group relative flex w-full items-center overflow-hidden border-b border-[#1C2130]/60 px-[10px] py-[7px] text-[13px] leading-none tracking-[0.3px] transition-all duration-150 before:pointer-events-none before:absolute before:inset-0 before:rounded-[8px] before:bg-[rgba(0,212,180,0.08)] before:opacity-0 before:transition-opacity before:duration-150 ${currentChat?.id === chat.id ? 'rounded-[8px] bg-[rgba(0,212,180,0.04)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(0,212,180,0.14)] before:opacity-100' : 'rounded-[8px] text-[#4A5568] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#8A9AB0] hover:before:opacity-100'}`}
            >
              {renamingChatId === chat.id ? (
                <input
                  autoFocus
                  className="flex-1 bg-transparent border border-[#00D4B4]/40 rounded px-2 py-0.5 text-[13px] text-white outline-none"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(chat.id)}
                  onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
                  aria-label="Rename chat"
                />
              ) : (
                <div
                  className="flex flex-1 cursor-pointer items-center gap-[10px]"
                  onClick={() => handleChatSelect(chat)}
                >
                  <MessageSquare {...navIconProps} className={getNavIconClass(currentChat?.id === chat.id)} />
                  {!isCollapsed && (
                    <div className="overflow-hidden text-left">
                      <div className={`truncate text-[13px] leading-none ${currentChat?.id === chat.id ? 'font-semibold text-[#00D4B4]' : 'font-medium text-[#4A5568] group-hover:text-[#8A9AB0]'}`}>
                        {chat.title}
                      </div>
                      {chatStatuses.get(chat.id) ? (
                        <div className="mt-[2px] flex items-center">
                          <ThreadStatusBadge
                            kind={chatStatuses.get(chat.id)!.kind}
                            label={chatStatuses.get(chat.id)!.label}
                          />
                        </div>
                      ) : (
                        <div className="truncate text-[11px] leading-none text-[#4A5568] group-hover:text-[#8A9AB0]">
                          {chat.messages && chat.messages.length > 0
                            ? chat.messages[chat.messages.length - 1]?.content.substring(0, 30) + '...'
                            : 'No messages yet'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isCollapsed && renamingChatId !== chat.id && (
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
                      height: '24px',
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
                          handleRenameStart(chat.id, chat.title);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        <span>Rename</span>
                      </button>

                      <button
                        className="w-full flex items-center px-3 py-2 hover:bg-[#3A3A3A] text-left text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
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
            <div className="px-3 py-2 text-gray-400 text-center">No chats yet</div>
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
      <div className="border-t border-[#1C2130] px-2 py-2">
        {/* Profile */}
        <button
          onClick={() => navigate('/profile')}
          className={getNavItemClass(isActive('/profile'))}
          title="Profile"
        >
          <UserCircle {...navIconProps} className={getNavIconClass(isActive('/profile'))} />
          {!isCollapsed && <span className={getNavLabelClass(isActive('/profile'))}>Profile</span>}
        </button>

        {/* Settings */}
        <button
          onClick={onSettingsClick}
          className={getNavItemClass(false)}
          title="Settings"
        >
          <Settings {...navIconProps} className={getNavIconClass(false)} />
          {!isCollapsed && <span className={getNavLabelClass(false)}>{translate('settings')}</span>}
        </button>
      </div>

      <AgentSelectionModal
        isOpen={showAgentModal && !location.pathname.startsWith('/chat')}
        onClose={() => setShowAgentModal(false)}
        onSelectAgent={handleSelectAgent}
        onCreateAgent={() => {
          setShowAgentModal(false);
          navigate('/builder');
        }}
      />

      <CommandPalette
        open={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </aside>
  );
};
