import React, { useEffect, useState } from 'react';
import { Bot, X } from 'lucide-react';
import { Agent } from '../../types/agent';
import { agentService } from '../../services/api/agent.service';
import toast from 'react-hot-toast';

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agent: Agent) => void;
}

const AgentSelectionModal: React.FC<AgentSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectAgent,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await agentService.getAgents();
      setAgents(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents. Please try again.');
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgent = (agent: Agent) => {
    onSelectAgent(agent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
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
          ) : agents.length === 0 ? (
            <div className="text-gray-400 p-4 text-center">
              No agents found. Create an agent first.
            </div>
          ) : (
            <div className="grid gap-3 p-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className="flex items-start gap-3 p-4 hover:bg-[#2A2A2A] rounded-lg transition-colors text-left border border-[#3A3A3A] focus:border-cyan-500 focus:outline-none"
                >
                  <div className="flex-shrink-0 bg-[#2A2A2A] p-3 rounded-full">
                    <Bot className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{agent.name}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{agent.description || `A ${agent.ai_role.replace('_', ' ')} agent`}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      {agent.ai_role && (
                        <span className="inline-block bg-[#2A2A2A] text-cyan-400 rounded-full px-2 py-1 mr-2">
                          {agent.ai_role.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentSelectionModal;
