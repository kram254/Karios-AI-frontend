/**
 * HyperAgentDashboard (Command Center) — Fleet Gallery
 *
 * Polished dark-neon fleet management view on the Karios token system.
 * Replaced all inline style={{}} hardcoded hex with Tailwind token classes.
 *
 * Tabs: Fleet overview · Agents · Skills · Rubrics
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Users, Shield, Zap, RefreshCw, Plus,
  Activity, DollarSign, Clock, CheckCircle2, AlertCircle,
  TrendingUp, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AgentCard } from '../hyperagent/components/AgentCard';
import { RubricCard } from '../hyperagent/components/RubricCard';
import { SkillCard } from '../hyperagent/components/SkillCard';
import hyperAgentService from '../hyperagent/hyperAgentService';
import type {
  HyperAgentIdentity, FleetOverview, HyperSkill, EvaluationRubric,
} from '../hyperagent/types';

// ---------------------------------------------------------------------------
// Skeleton block
// ---------------------------------------------------------------------------
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-white/[0.04] ${className}`} />
);

// ---------------------------------------------------------------------------
// Fleet summary card
// ---------------------------------------------------------------------------
const FleetSummaryRow: React.FC<{ fleet: FleetOverview }> = ({ fleet }) => {
  const { summary } = fleet;
  const stats = [
    { label: 'Total agents', value: summary.total_agents, icon: <Users className="w-4 h-4" />, color: 'text-white' },
    { label: 'Active now', value: summary.active_now, icon: <Activity className="w-4 h-4" />, color: 'text-brand-cyan' },
    { label: 'Avg score', value: `${summary.avg_rubric_score}%`, icon: <TrendingUp className="w-4 h-4" />, color: 'text-status-success' },
    { label: 'Hours saved', value: `${summary.estimated_human_hours_saved}h`, icon: <Clock className="w-4 h-4" />, color: 'text-brand-purple' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, icon, color }) => (
        <div
          key={label}
          className="rounded-xl border border-white/[0.06] bg-surface-raised p-4 flex flex-col gap-2"
        >
          <div className={`flex items-center gap-2 text-xs text-white/40`}>
            {icon}
            {label}
          </div>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Dark AgentCard wrapper (existing AgentCard uses light theme — re-skin inline)
// ---------------------------------------------------------------------------
const DarkAgentCard: React.FC<{ agent: HyperAgentIdentity; onClick: () => void }> = ({
  agent, onClick,
}) => {
  const statusMeta: Record<string, { color: string; label: string }> = {
    idle:        { color: 'text-white/40 bg-white/[0.05]', label: 'Idle' },
    working:     { color: 'text-brand-cyan bg-brand-cyan/10', label: 'Working' },
    learning:    { color: 'text-brand-purple bg-brand-purple/10', label: 'Learning' },
    deployed:    { color: 'text-status-success bg-status-success/10', label: 'Deployed' },
    maintenance: { color: 'text-status-warning bg-status-warning/10', label: 'Maintenance' },
  };
  const meta = statusMeta[agent.status] ?? statusMeta.idle;
  const avgScore = agent.skills.length > 0
    ? (agent.skills.reduce((a, s) => a + s.performance_score, 0) / agent.skills.length).toFixed(1)
    : '—';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="rounded-xl border border-white/[0.07] bg-surface-raised hover:border-brand-cyan/25 hover:shadow-glow-cyan/20 transition-all duration-base cursor-pointer p-4"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan/15 to-brand-purple/15 border border-white/[0.06] flex items-center justify-center">
            <Bot className="w-5 h-5 text-brand-cyan/80" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
            <p className="text-xs text-white/35 capitalize mt-0.5">{agent.role.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
          {meta.label}
        </span>
      </div>

      {agent.description && (
        <p className="text-xs text-white/40 mb-4 leading-relaxed line-clamp-2">{agent.description}</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Skills', value: agent.skills.length },
          { label: 'Avg score', value: avgScore },
          { label: 'Version', value: `v${agent.version}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/[0.03] rounded-lg p-2 text-center border border-white/[0.04]">
            <p className="text-sm font-semibold text-white">{value}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
        <span className="text-[10px] text-white/25">
          {new Date(agent.version).toLocaleDateString() !== 'Invalid Date'
            ? '' : `Updated ${new Date().toLocaleDateString()}`}
        </span>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); }}
          className="flex items-center gap-1 text-xs text-white/30 hover:text-brand-cyan transition-colors"
        >
          Manage <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
const EmptyState: React.FC<{ label: string; action?: () => void; actionLabel?: string }> = ({
  label, action, actionLabel,
}) => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4 text-center">
    <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
      <Bot className="w-5 h-5 text-white/20" />
    </div>
    <p className="text-sm text-white/35">{label}</p>
    {action && actionLabel && (
      <button
        type="button"
        onClick={action}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-cyan text-black text-sm font-semibold hover:bg-[#00D1DD] transition-all shadow-glow-cyan"
      >
        <Plus className="w-4 h-4" />
        {actionLabel}
      </button>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const HyperAgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [fleet, setFleet] = useState<FleetOverview | null>(null);
  const [agents, setAgents] = useState<HyperAgentIdentity[]>([]);
  const [skills, setSkills] = useState<HyperSkill[]>([]);
  const [rubrics, setRubrics] = useState<EvaluationRubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fleet' | 'agents' | 'skills' | 'rubrics'>('agents');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fleetRes, agentsRes, skillsRes, rubricsRes] = await Promise.allSettled([
        hyperAgentService.getFleetOverview(),
        hyperAgentService.listAgents(),
        hyperAgentService.listSkills(),
        hyperAgentService.listRubrics(),
      ]);
      if (fleetRes.status === 'fulfilled') setFleet(fleetRes.value);
      if (agentsRes.status === 'fulfilled')
        setAgents((agentsRes.value as any)?.agents || (agentsRes.value as any)?.items || []);
      if (skillsRes.status === 'fulfilled')
        setSkills((skillsRes.value as any)?.skills || (skillsRes.value as any)?.items || []);
      if (rubricsRes.status === 'fulfilled')
        setRubrics((rubricsRes.value as any)?.rubrics || (rubricsRes.value as any)?.items || []);
    } catch {
      setError('Failed to load fleet data. Is the backend running?');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const tabs = [
    { key: 'agents' as const, label: 'Agents', icon: <Bot className="w-3.5 h-3.5" />, count: agents.length },
    { key: 'fleet' as const, label: 'Fleet', icon: <Users className="w-3.5 h-3.5" />, count: null },
    { key: 'skills' as const, label: 'Skills', icon: <Zap className="w-3.5 h-3.5" />, count: skills.length },
    { key: 'rubrics' as const, label: 'Rubrics', icon: <Shield className="w-3.5 h-3.5" />, count: rubrics.length },
  ];

  return (
    <div className="min-h-full bg-surface-base text-white px-6 md:px-10 py-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Command Center</h1>
            <p className="text-sm text-white/40 mt-1">{agents.length > 0 ? `${agents.length} agent${agents.length !== 1 ? 's' : ''} · ` : ''}Your agent fleet at a glance</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-surface-raised text-sm text-white/60 hover:text-white hover:border-white/20 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-cyan text-black text-sm font-semibold hover:bg-[#00D1DD] shadow-glow-cyan transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New agent
            </button>
          </div>
        </div>

        {/* ── Error banner ────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-status-error/10 border border-status-error/20 text-sm text-status-error mb-6"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-white/[0.05] mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-base ${
                activeTab === tab.key
                  ? 'bg-surface-elevated text-brand-cyan border border-brand-cyan/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== null && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.key
                    ? 'bg-brand-cyan/15 text-brand-cyan'
                    : 'bg-white/[0.06] text-white/30'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >

              {/* Fleet overview */}
              {activeTab === 'fleet' && (
                <div>
                  {fleet
                    ? <FleetSummaryRow fleet={fleet} />
                    : <div className="grid col-span-full"><EmptyState label="Fleet data unavailable — create some agents first." /></div>
                  }
                </div>
              )}

              {/* Agents */}
              {activeTab === 'agents' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.length === 0
                    ? <EmptyState
                        label="No agents yet. Start a chat and say 'Build me an agent that…'"
                        action={() => navigate('/chat')}
                        actionLabel="Start a chat"
                      />
                    : agents.map(agent => (
                        <DarkAgentCard
                          key={agent.id}
                          agent={agent}
                          onClick={() => navigate(`/agent-chat/${agent.id}`)}
                        />
                      ))
                  }
                </div>
              )}

              {/* Skills */}
              {activeTab === 'skills' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skills.length === 0
                    ? <EmptyState label="No skills configured yet." />
                    : skills.map(skill => <SkillCard key={skill.id} skill={skill} />)
                  }
                </div>
              )}

              {/* Rubrics */}
              {activeTab === 'rubrics' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rubrics.length === 0
                    ? <EmptyState label="No rubrics defined yet." />
                    : rubrics.map(rubric => <RubricCard key={rubric.id} rubric={rubric} />)
                  }
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default HyperAgentDashboard;
