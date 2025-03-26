import React, { useEffect, useState } from 'react';
import { Agent } from '../../types/agent';
import { Bot, Info } from 'lucide-react';
import { agentService } from '../../services/api/agent.service';

interface AgentInfoBannerProps {
  agentId: string;
}

const AgentInfoBanner: React.FC<AgentInfoBannerProps> = ({ agentId }) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchAgentInfo = async () => {
      try {
        setLoading(true);
        const response = await agentService.getAgentById(agentId);
        setAgent(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching agent info:', err);
        setError('Failed to load agent information');
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      fetchAgentInfo();
    }
  }, [agentId]);

  if (loading) {
    return (
      <div className="bg-[#1A1A1A] border-b border-[#2A2A2A] p-3 flex items-center">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="rounded-full bg-[#2A2A2A] h-8 w-8"></div>
          <div className="h-3 bg-[#2A2A2A] rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="bg-[#1A1A1A] border-b border-[#2A2A2A] p-3 flex items-center text-red-400">
        <Info className="w-5 h-5 mr-2" />
        <span>Failed to load agent information</span>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] border-b border-[#2A2A2A] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-[#2A2A2A] p-2 rounded-full mr-3">
            <Bot className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h3 className="font-medium text-white">{agent.name}</h3>
            <div className="text-xs text-gray-400">{agent.ai_role.replace('_', ' ')}</div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-cyan-500 text-sm hover:underline focus:outline-none"
        >
          {expanded ? 'Less info' : 'More info'}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-3 p-3 bg-[#222222] rounded-md text-sm">
          <p className="text-gray-300 mb-2">{agent.description || `A ${agent.ai_role.replace('_', ' ')} agent designed to assist you.`}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="text-gray-400">Language:</div>
            <div className="text-white">{agent.language}</div>
            
            <div className="text-gray-400">Response Style:</div>
            <div className="text-white">
              {agent.response_style < 0.33 ? 'Formal' : 
               agent.response_style < 0.66 ? 'Balanced' : 'Casual'}
            </div>
            
            <div className="text-gray-400">Mode:</div>
            <div className="text-white">{agent.mode}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentInfoBanner;
