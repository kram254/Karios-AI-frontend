import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bot, X, Plus } from 'lucide-react';
import { Agent } from '../../types/agent';
import { agentService } from '../../services/api/agent.service';
import type { Workflow } from '../../types/workflow';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE_URL = String((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {}
  return headers;
};

export type AgentSelectionResult =
  | (Agent & { selection_type?: 'agent' })
  | { selection_type: 'workflow'; workflow_id: string; name: string; description?: string };

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agent: AgentSelectionResult) => void;
  onCreateAgent?: () => void;
}

const AgentSelectionModal: React.FC<AgentSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectAgent,
  onCreateAgent
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const [agentsRes, workflowsRes] = await Promise.all([
        agentService.getAgents(),
        fetch(apiUrl('/api/workflows/'), { headers: getAuthHeaders() })
      ]);

      const allAgents = Array.isArray((agentsRes as any)?.data) ? ((agentsRes as any).data as Agent[]) : [];
      const userId = user?.id;
      const visibleAgents = typeof userId === 'number'
        ? allAgents.filter((agent: any) => {
            const ownerId = (agent as any)?.owner_id ?? (agent as any)?.ownerId ?? (agent as any)?.ownerID;
            if (ownerId === undefined || ownerId === null) return true;
            return String(ownerId) === String(userId);
          })
        : allAgents;
      setAgents(visibleAgents);
      try {
        const cacheKey = `builder_my_agents_cache_v1_${typeof userId === 'number' ? String(userId) : 'anon'}`;
        if (visibleAgents.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify({ v: 1, savedAt: Date.now(), agents: visibleAgents }));
        }
      } catch {}
      try {
        if ((workflowsRes as any)?.ok) {
          const data = await (workflowsRes as any).json();
          const list = Array.isArray((data as any)?.workflows) ? ((data as any).workflows as Workflow[]) : [];
          const userWorkflows = typeof userId === 'number'
            ? list.filter((wf: any) => !wf || !wf.userId || String(wf.userId) === String(userId))
            : list;
          setWorkflows(userWorkflows);
        } else {
          setWorkflows([]);
        }
      } catch {
        setWorkflows([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching agents:', err);
      let restoredFromCache = false;
      try {
        const userKey = typeof user?.id === 'number' ? String(user.id) : 'anon';
        const preferredCacheKey = `builder_my_agents_cache_v1_${userKey}`;
        const fallbackCacheKey = 'builder_my_agents_cache_v1_anon';
        const raw = localStorage.getItem(preferredCacheKey) || localStorage.getItem(fallbackCacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const cached = Array.isArray(parsed?.agents) ? parsed.agents : [];
          if (cached.length > 0) {
            setAgents(cached);
            setError(null);
            restoredFromCache = true;
          }
        }
      } catch {}
      if (!restoredFromCache) {
        setError('Failed to load agents. Please try again.');
        toast.error('Failed to load agents');
      }
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [fetchAgents, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = () => {
      fetchAgents();
    };
    try {
      window.addEventListener('builder:agent-saved', handler as any);
    } catch {}
    return () => {
      try {
        window.removeEventListener('builder:agent-saved', handler as any);
      } catch {}
    };
  }, [fetchAgents, isOpen]);

  const items = useMemo(() => {
    const agentItems: AgentSelectionResult[] = (agents || []).map((a) => ({ ...(a as any), selection_type: 'agent' }));
    const workflowItems: AgentSelectionResult[] = (workflows || [])
      .filter((wf) => wf && wf.id)
      .map((wf) => ({ selection_type: 'workflow', workflow_id: wf.id, name: wf.name, description: wf.description }));
    return [...workflowItems, ...agentItems];
  }, [agents, workflows]);

  const handleSelectAgent = (agent: AgentSelectionResult) => {
    onSelectAgent(agent);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] p-4">
          <h2 className="text-xl font-bold text-white">Select an Agent</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#2A2A2A] transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 text-center">
              {error}
              <button
                onClick={fetchAgents}
                className="mt-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded text-white block mx-auto"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-gray-400 p-4">
              <div className="flex items-center justify-between gap-6">
                <div className="text-sm text-gray-400">
                  No agents found. Create an agent first.
                </div>
                <button
                  onClick={onCreateAgent}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded text-white"
                >
                  <Plus className="w-4 h-4" />
                  Create Agent
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 p-2">
              {items.map((item: any) => (
                <button
                  key={item.selection_type === 'workflow' ? item.workflow_id : item.id}
                  onClick={() => handleSelectAgent(item)}
                  className="flex items-start gap-3 p-4 hover:bg-[#2A2A2A] rounded-lg transition-colors text-left border border-[#3A3A3A] focus:border-cyan-500 focus:outline-none"
                >
                  <div className="flex-shrink-0 bg-[#2A2A2A] p-3 rounded-full">
                    <Bot className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{item.name}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{item.selection_type === 'workflow' ? (item.description || 'Workflow agent') : (item.description || `A ${String(item.ai_role || '').replace('_', ' ')} agent`)}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      {item.selection_type === 'workflow' ? (
                        <span className="inline-block bg-[#2A2A2A] text-cyan-400 rounded-full px-2 py-1 mr-2">
                          Workflow
                        </span>
                      ) : (
                        item.ai_role && (
                          <span className="inline-block bg-[#2A2A2A] text-cyan-400 rounded-full px-2 py-1 mr-2">
                            {String(item.ai_role).replace('_', ' ')}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AgentSelectionModal;
