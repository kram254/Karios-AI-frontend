import React from 'react';
import { Bot, Settings, Play, Pause, GitBranch, Star } from 'lucide-react';
import type { HyperAgentIdentity } from '../types';

interface AgentCardProps {
  agent: HyperAgentIdentity;
  onClick?: (agent: HyperAgentIdentity) => void;
  onEdit?: (agent: HyperAgentIdentity) => void;
  onToggleStatus?: (agent: HyperAgentIdentity) => void;
}

const statusColors: Record<string, string> = {
  idle: 'bg-gray-100 text-gray-700',
  working: 'bg-blue-100 text-blue-700',
  learning: 'bg-purple-100 text-purple-700',
  deployed: 'bg-green-100 text-green-700',
  maintenance: 'bg-yellow-100 text-yellow-700'
};

const roleLabels: Record<string, string> = {
  content_marketer: 'Content Marketer',
  market_researcher: 'Market Researcher',
  customer_email_responder: 'Email Responder',
  sales_development_rep: 'Sales Dev Rep',
  data_analyst: 'Data Analyst',
  code_reviewer: 'Code Reviewer',
  product_manager: 'Product Manager',
  customer_success_manager: 'Success Manager',
  social_media_manager: 'Social Media',
  research_assistant: 'Research Assistant',
  executive_assistant: 'Executive Assistant',
  custom: 'Custom Agent'
};

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onClick,
  onEdit,
  onToggleStatus
}) => {
  const avgScore = agent.skills.length > 0
    ? agent.skills.reduce((acc, s) => acc + s.performance_score, 0) / agent.skills.length
    : 0;

  return (
    <div
      onClick={() => onClick?.(agent)}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-500">{roleLabels[agent.role] || agent.role}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[agent.status]}`}>
          {agent.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded p-2">
          <p className="text-lg font-semibold text-gray-900">{agent.skills.length}</p>
          <p className="text-xs text-gray-500">Skills</p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className="text-lg font-semibold text-gray-900">{avgScore.toFixed(1)}</p>
          <p className="text-xs text-gray-500">Avg Score</p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className="text-lg font-semibold text-gray-900">v{agent.version}</p>
          <p className="text-xs text-gray-500">Version</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Star className="w-4 h-4" />
          <span>{agent.autonomy_level.replace('_', ' ')}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus?.(agent);
            }}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          >
            {agent.status === 'working' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(agent);
            }}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {agent.parent_agent_id && (
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
          <GitBranch className="w-3 h-3" />
          <span>Forked from {agent.parent_agent_id.slice(0, 8)}</span>
        </div>
      )}
    </div>
  );
};
