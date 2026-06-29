import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Star, Activity, Zap, Globe, 
  Code, FileText, Bot, Cpu, Users, ChevronRight,
  ExternalLink, TrendingUp, Shield, CheckCircle
} from 'lucide-react';
import { 
  agentRegistryService, 
  AgentIdentity, 
  AgentCapability,
  RegistryStats 
} from '../../services/sumi';

const CAPABILITY_ICONS: Record<AgentCapability, React.ReactNode> = {
  chat: <Bot className="w-4 h-4" />,
  research: <Globe className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  analysis: <Activity className="w-4 h-4" />,
  automation: <Zap className="w-4 h-4" />,
  web_scraping: <Globe className="w-4 h-4" />,
  document_processing: <FileText className="w-4 h-4" />,
  translation: <Globe className="w-4 h-4" />,
  summarization: <FileText className="w-4 h-4" />,
  multi_agent: <Users className="w-4 h-4" />
};

const CAPABILITY_COLORS: Record<AgentCapability, string> = {
  chat: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  research: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  code: 'bg-green-500/20 text-green-400 border-green-500/30',
  analysis: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  automation: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  web_scraping: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  document_processing: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  translation: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  summarization: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  multi_agent: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
};

interface AgentRegistryBrowserProps {
  onSelectAgent?: (agent: AgentIdentity) => void;
  selectedCapabilities?: AgentCapability[];
  minReputation?: number;
  showStats?: boolean;
}

export const AgentRegistryBrowser: React.FC<AgentRegistryBrowserProps> = ({
  onSelectAgent,
  selectedCapabilities = [],
  minReputation = 0,
  showStats = true
}) => {
  const [agents, setAgents] = useState<AgentIdentity[]>([]);
  const [stats, setStats] = useState<RegistryStats | null>(null);
  const [allCapabilities, setAllCapabilities] = useState<AgentCapability[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCapabilities, setFilterCapabilities] = useState<AgentCapability[]>(selectedCapabilities);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentIdentity | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [agentsResult, statsResult, capsResult] = await Promise.all([
        agentRegistryService.searchAgents({
          capabilities: filterCapabilities.length > 0 ? filterCapabilities : undefined,
          min_reputation: minReputation,
          query: searchQuery || undefined,
          limit: 50
        }),
        showStats ? agentRegistryService.getStats() : Promise.resolve(null),
        agentRegistryService.getCapabilities()
      ]);

      setAgents(agentsResult.agents);
      setStats(statsResult);
      setAllCapabilities(capsResult.capabilities);
      setError(null);
    } catch (err) {
      setError('Failed to fetch agent registry data');
    } finally {
      setLoading(false);
    }
  }, [filterCapabilities, minReputation, searchQuery, showStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleCapability = (cap: AgentCapability) => {
    setFilterCapabilities(prev => 
      prev.includes(cap) 
        ? prev.filter(c => c !== cap)
        : [...prev, cap]
    );
  };

  const handleSelectAgent = (agent: AgentIdentity) => {
    setSelectedAgent(agent);
    onSelectAgent?.(agent);
  };

  const getReputationStars = (score: number) => {
    const stars = Math.round(score / 2);
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3 h-3 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {showStats && stats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-3"
        >
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-400">Total Agents</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total_agents}</p>
          </div>
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-400">Services</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total_services}</p>
          </div>
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.avg_reputation_score.toFixed(1)}
            </p>
          </div>
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {(stats.avg_success_rate * 100).toFixed(0)}%
            </p>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by name or capability..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-cyan-500/50 outline-none"
          />
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <Filter className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {allCapabilities.map(cap => (
          <button
            key={cap}
            onClick={() => toggleCapability(cap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
              filterCapabilities.includes(cap)
                ? CAPABILITY_COLORS[cap]
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
            }`}
          >
            {CAPABILITY_ICONS[cap]}
            <span className="capitalize">{cap.replace('_', ' ')}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {agents.map((agent, index) => (
            <motion.div
              key={agent.agent_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelectAgent(agent)}
              className={`p-4 bg-gray-800/50 rounded-lg border transition-all cursor-pointer ${
                selectedAgent?.agent_id === agent.agent_id
                  ? 'border-cyan-500/50 bg-cyan-500/5'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{agent.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{agent.agent_id.slice(0, 12)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getReputationStars(agent.reputation_score)}
                  <span className="text-xs text-gray-400">({agent.total_transactions})</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {agent.capabilities.map(cap => (
                  <span
                    key={cap}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${CAPABILITY_COLORS[cap as AgentCapability]}`}
                  >
                    {CAPABILITY_ICONS[cap as AgentCapability]}
                    <span className="capitalize">{cap.replace('_', ' ')}</span>
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span>{(agent.success_rate * 100).toFixed(0)}% success</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span>{agent.total_transactions} transactions</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {agents.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-500">
            <Bot className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>No agents found matching your criteria</p>
          </div>
        )}

        {loading && (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentRegistryBrowser;
