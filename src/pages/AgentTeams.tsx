import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Crown, Code2, Megaphone, Search, DollarSign, Activity, ChevronRight, Circle, Sparkles, Settings } from 'lucide-react';
import { agentTeamService, type Team, type TeamSummary } from '../services/agentTeamService';
import TeamCreationWizard from '../components/team/TeamCreationWizard';

const ROLE_ICONS: Record<string, React.ElementType> = {
  ceo: Crown,
  cto: Code2,
  cmo: Megaphone,
  engineer: Code2,
  researcher: Search,
};

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  paused: '#F59E0B',
  setup: '#3B82F6',
  archived: '#6B7280',
};

const AgentTeams: React.FC = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [summaries, setSummaries] = useState<Record<number, TeamSummary>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await agentTeamService.listTeams();
      setTeams(list);
      const summaryMap: Record<number, TeamSummary> = {};
      for (const t of list) {
        try {
          const detail = await agentTeamService.getTeam(t.id);
          if (detail.summary) summaryMap[t.id] = detail.summary;
        } catch (_) {}
      }
      setSummaries(summaryMap);
    } catch (e) {
      console.error('Failed to load teams:', e);
      setLoadError('Failed to load teams.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleCreated = (teamId: number) => {
    setWizardOpen(false);
    loadTeams();
    navigate(`/teams/${teamId}`);
  };

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <Users size={18} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Agent Teams</h1>
            <p className="text-xs text-gray-500">Hire, manage, and orchestrate AI agent teams</p>
          </div>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-500/20 text-cyan-400 text-sm font-medium hover:border-cyan-500/40 transition-all"
        >
          <Plus size={14} /> Create Team
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loadError && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <span>{loadError}</span>
            <button type="button" onClick={loadTeams} className="ml-auto text-xs underline">Retry</button>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full" />
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-cyan-400/50" />
            </div>
            <h2 className="text-lg font-medium text-white mb-2">No Teams Yet</h2>
            <p className="text-sm text-gray-500 max-w-md mb-6">
              Create your first AI agent team. Choose from pre-built templates or build a custom team with CEO, CTO, engineers, and more.
            </p>
            <button
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={14} /> Create Your First Team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teams.map((team) => {
              const summary = summaries[team.id];
              const statusColor = STATUS_COLORS[team.status] || '#6B7280';

              return (
                <div
                  key={team.id}
                  onClick={() => navigate(`/teams/${team.id}`)}
                  className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5 cursor-pointer hover:border-[#3A3A3A] hover:bg-[#141414] transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/5 flex items-center justify-center">
                        <Users size={16} className="text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{team.name}</h3>
                        {team.template_id && (
                          <span className="text-[10px] text-gray-600 capitalize">{team.template_id.replace('_', ' ')} template</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Circle size={6} fill={statusColor} stroke="none" />
                      <span className="text-[10px] text-gray-500 capitalize">{team.status}</span>
                    </div>
                  </div>

                  {team.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{team.description}</p>
                  )}

                  {summary && (
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-white">{summary.member_count}</div>
                        <div className="text-[10px] text-gray-500">Members</div>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-white">{summary.tasks_in_progress}</div>
                        <div className="text-[10px] text-gray-500">Active</div>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-white">{summary.tasks_done}</div>
                        <div className="text-[10px] text-gray-500">Done</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A]">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <DollarSign size={10} />
                      {formatCents(team.spent_monthly_cents || 0)} / {formatCents(team.monthly_budget_cents || 0)}
                    </div>
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TeamCreationWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
};

export default AgentTeams;
