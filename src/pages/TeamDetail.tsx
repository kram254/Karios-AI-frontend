import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, LayoutGrid, Target, DollarSign, ShieldCheck, Play, Plus, Settings, Circle, Zap, GitBranch, AlertCircle, BookOpen, Plug, Download, Upload, FileText } from 'lucide-react';
import { agentTeamService, type Team, type TeamMember, type TeamGoal, type TeamTask, type TeamApproval, type OrgChartNode, type BudgetOverview, type TeamSummary, type TeamIssue, type TeamSkill, type TeamPlugin } from '../services/agentTeamService';
import OrgChart from '../components/team/OrgChart';
import TaskBoard from '../components/team/TaskBoard';
import BudgetDashboard from '../components/team/BudgetDashboard';
import ApprovalCenter from '../components/team/ApprovalCenter';
import DelegationFlow from '../components/team/DelegationFlow';

const TABS = [
  { key: 'org', label: 'Org Chart', icon: Users },
  { key: 'structure', label: 'Structure', icon: GitBranch },
  { key: 'tasks', label: 'Tasks', icon: LayoutGrid },
  { key: 'issues', label: 'Issues', icon: AlertCircle },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'skills', label: 'Skills', icon: BookOpen },
  { key: 'plugins', label: 'Plugins', icon: Plug },
  { key: 'budget', label: 'Budget', icon: DollarSign },
  { key: 'approvals', label: 'Approvals', icon: ShieldCheck },
];

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  paused: '#F59E0B',
  setup: '#3B82F6',
  archived: '#6B7280',
};

const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState('org');
  const [team, setTeam] = useState<Team | null>(null);
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [orgChart, setOrgChart] = useState<OrgChartNode[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [goals, setGoals] = useState<TeamGoal[]>([]);
  const [budgetOverview, setBudgetOverview] = useState<BudgetOverview | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<TeamApproval[]>([]);
  const [issues, setIssues] = useState<TeamIssue[]>([]);
  const [skills, setSkills] = useState<TeamSkill[]>([]);
  const [plugins, setPlugins] = useState<TeamPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newPluginName, setNewPluginName] = useState('');

  const tid = teamId ? parseInt(teamId) : 0;

  const loadData = useCallback(async (isRetry = false) => {
    if (!tid) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [teamData, membersData, orgData, tasksData, goalsData, budgetData, incidentsData, approvalsData, issuesData, skillsData, pluginsData] = await Promise.all([
        agentTeamService.getTeam(tid),
        agentTeamService.listMembers(tid),
        agentTeamService.getOrgChart(tid),
        agentTeamService.listTasks(tid),
        agentTeamService.listGoals(tid),
        agentTeamService.getBudgetOverview(tid).catch(() => null),
        agentTeamService.listBudgetIncidents(tid).catch(() => []),
        agentTeamService.listApprovals(tid).catch(() => []),
        agentTeamService.listIssues(tid).catch(() => []),
        agentTeamService.listSkills(tid).catch(() => []),
        agentTeamService.listPlugins(tid).catch(() => []),
      ]);
      setTeam(teamData?.team || null);
      setSummary(teamData?.summary || null);
      setMembers(membersData || []);
      setOrgChart(orgData || []);
      setTasks(tasksData || []);
      setGoals(goalsData || []);
      setBudgetOverview(budgetData);
      setIncidents(incidentsData || []);
      setApprovals(approvalsData || []);
      setIssues(issuesData || []);
      setSkills(skillsData || []);
      setPlugins(pluginsData || []);
      
      if (!teamData?.team && !isRetry) {
        setTimeout(() => loadData(true), 1000);
      }
    } catch (e) {
      console.error('Failed to load team data:', e);
      setLoadError('Failed to load team data.');
      if (!isRetry) {
        setTimeout(() => loadData(true), 1000);
      }
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateTask = async (taskId: number, updates: Partial<TeamTask>) => {
    try {
      await agentTeamService.updateTask(tid, taskId, updates);
      loadData();
    } catch (e) {
      console.error('Failed to update task:', e);
    }
  };

  const handleResolveApproval = async (approvalId: number, approved: boolean, notes?: string) => {
    try {
      await agentTeamService.resolveApproval(tid, approvalId, approved, notes);
      loadData();
    } catch (e) {
      console.error('Failed to resolve approval:', e);
    }
  };

  const handleExecuteGoal = async () => {
    if (!goalInput.trim() || executing) return;
    setExecuting(true);
    try {
      await agentTeamService.executeGoal(tid, goalInput.trim());
      setGoalInput('');
      setShowGoalInput(false);
      loadData();
    } catch (e) {
      console.error('Failed to execute goal:', e);
    } finally {
      setExecuting(false);
    }
  };

  if (loading && !team) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0A0A0A]">
        <div className="animate-spin w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0A0A0A] text-gray-500">
        <Users size={32} className="mb-3 opacity-20" />
        <span className="text-sm">{loading ? 'Loading team...' : 'Team not found'}</span>
        {!loading && (
          <div className="flex items-center gap-3 mt-4">
            <button 
              onClick={() => loadData()} 
              className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={() => navigate('/teams')} 
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Back to Teams
            </button>
          </div>
        )}
      </div>
    );
  }

  const statusColor = STATUS_COLORS[team.status] || '#6B7280';
  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const openIssueCount = issues.filter(i => !['done', 'cancelled'].includes(i.status)).length;

  const handleCreateIssue = async () => {
    if (!newIssueTitle.trim()) return;
    try {
      await agentTeamService.createIssue(tid, { title: newIssueTitle.trim() });
      setNewIssueTitle('');
      loadData();
    } catch (e) { console.error('Failed to create issue:', e); }
  };

  const handleUpdateIssueStatus = async (issueId: number, status: string) => {
    try {
      await agentTeamService.updateIssue(tid, issueId, { status } as any);
      loadData();
    } catch (e) { console.error('Failed to update issue:', e); }
  };

  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) return;
    try {
      await agentTeamService.createSkill(tid, { name: newSkillName.trim() });
      setNewSkillName('');
      loadData();
    } catch (e) { console.error('Failed to create skill:', e); }
  };

  const handleCreatePlugin = async () => {
    if (!newPluginName.trim()) return;
    try {
      await agentTeamService.createPlugin(tid, { name: newPluginName.trim() });
      setNewPluginName('');
      loadData();
    } catch (e) { console.error('Failed to create plugin:', e); }
  };

  const handleExportTeam = async () => {
    try {
      const data = await agentTeamService.exportTeam(tid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${team.name.replace(/\s+/g, '_').toLowerCase()}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('Failed to export team:', e); }
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] overflow-hidden">
      {loadError && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mx-6 mt-4">
          <span>{loadError}</span>
          <button type="button" onClick={() => loadData()} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}
      <div className="px-6 py-4 border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/teams')} className="text-gray-500 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
              <Users size={18} className="text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white">{team.name}</h1>
                <div className="flex items-center gap-1">
                  <Circle size={6} fill={statusColor} stroke="none" />
                  <span className="text-[10px] text-gray-500 capitalize">{team.status}</span>
                </div>
              </div>
              {team.description && <p className="text-xs text-gray-500 mt-0.5">{team.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showGoalInput ? (
              <button
                onClick={() => setShowGoalInput(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:border-cyan-500/40 transition-all"
              >
                <Zap size={12} /> Execute Goal
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExecuteGoal()}
                  placeholder="Describe your goal..."
                  className="w-64 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleExecuteGoal}
                  disabled={executing || !goalInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-40"
                >
                  {executing ? 'Running...' : 'Go'}
                </button>
                <button
                  onClick={() => { setShowGoalInput(false); setGoalInput(''); }}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {summary && (
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Users size={12} />
              <span>{summary.member_count} members</span>
              <span className="text-gray-600">({summary.active_members} active)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <LayoutGrid size={12} />
              <span>{summary.tasks_in_progress} in progress</span>
              <span className="text-gray-600">/ {summary.task_count} total</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Target size={12} />
              <span>{summary.goal_count} goals</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <DollarSign size={12} />
              <span>${((summary.spent_monthly_cents || 0) / 100).toFixed(2)}</span>
              <span className="text-gray-600">/ ${((summary.monthly_budget_cents || 0) / 100).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 px-6 py-2 border-b border-[#1A1A1A]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            >
              <Icon size={12} />
              {t.label}
              {t.key === 'approvals' && pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px]">{pendingCount}</span>
              )}
              {t.key === 'issues' && openIssueCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px]">{openIssueCount}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'org' && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-300">Organization Chart</span>
            </div>
            <OrgChart nodes={orgChart} onMemberClick={(id) => console.log('Member clicked:', id)} />
          </div>
        )}

        {tab === 'structure' && (
          <div className="max-w-4xl">
            <DelegationFlow members={members} tasks={tasks} />
          </div>
        )}

        {tab === 'tasks' && (
          <TaskBoard
            tasks={tasks}
            members={members}
            onUpdateTask={handleUpdateTask}
            onCreateTask={() => {}}
            onTaskClick={(task) => console.log('Task clicked:', task)}
          />
        )}

        {tab === 'goals' && (
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Team Goals</span>
            </div>
            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Target size={24} className="mb-2 opacity-40" />
                <span className="text-sm">No goals defined</span>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <div key={goal.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-white">{goal.title}</h3>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400 uppercase">{goal.level}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${goal.status === 'active' ? 'bg-green-500/15 text-green-400' : goal.status === 'completed' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-gray-500/15 text-gray-400'}`}>
                            {goal.status}
                          </span>
                        </div>
                        {goal.description && <p className="text-xs text-gray-500 mt-1">{goal.description}</p>}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-white">{(goal.progress_pct || 0).toFixed(0)}%</div>
                        <div className="w-20 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                            style={{ width: `${Math.min(goal.progress_pct || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'budget' && (
          <div className="max-w-4xl">
            <BudgetDashboard overview={budgetOverview} incidents={incidents} />
          </div>
        )}

        {tab === 'issues' && (
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Issues</span>
              <div className="flex items-center gap-2">
                <input
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateIssue()}
                  placeholder="New issue title..."
                  className="w-56 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none"
                />
                <button onClick={handleCreateIssue} disabled={!newIssueTitle.trim()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-40">
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
            {issues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <AlertCircle size={24} className="mb-2 opacity-40" />
                <span className="text-sm">No issues yet</span>
              </div>
            ) : (
              <div className="space-y-2">
                {issues.map((issue) => {
                  const statusColors: Record<string, string> = { backlog: 'bg-gray-500/15 text-gray-400', todo: 'bg-blue-500/15 text-blue-400', in_progress: 'bg-amber-500/15 text-amber-400', in_review: 'bg-purple-500/15 text-purple-400', done: 'bg-green-500/15 text-green-400', blocked: 'bg-red-500/15 text-red-400', cancelled: 'bg-gray-500/15 text-gray-500' };
                  const priorityColors: Record<string, string> = { critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-gray-400' };
                  return (
                    <div key={issue.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`text-xs font-bold ${priorityColors[issue.priority] || 'text-gray-400'}`}>{issue.priority?.charAt(0).toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{issue.title}</div>
                          {issue.description && <div className="text-xs text-gray-500 truncate mt-0.5">{issue.description}</div>}
                        </div>
                        {issue.labels && issue.labels.length > 0 && (
                          <div className="flex gap-1">{issue.labels.map((l, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400">{l}</span>)}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <select
                          value={issue.status}
                          onChange={(e) => handleUpdateIssueStatus(issue.id, e.target.value)}
                          className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-2 py-1 text-[10px] text-gray-300 focus:outline-none"
                        >
                          <option value="backlog">Backlog</option>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="in_review">In Review</option>
                          <option value="done">Done</option>
                          <option value="blocked">Blocked</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[issue.status] || 'bg-gray-500/15 text-gray-400'}`}>{issue.status?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'skills' && (
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Team Skills</span>
              <div className="flex items-center gap-2">
                <input
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSkill()}
                  placeholder="New skill name..."
                  className="w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none"
                />
                <button onClick={handleCreateSkill} disabled={!newSkillName.trim()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-40">
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
            {skills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <BookOpen size={24} className="mb-2 opacity-40" />
                <span className="text-sm">No skills defined</span>
                <span className="text-xs text-gray-600 mt-1">Skills are markdown-based instructions injected into agent context</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {skills.map((skill) => (
                  <div key={skill.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-cyan-400" />
                        <span className="text-sm font-medium text-white">{skill.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400">v{skill.version}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">{skill.scope}</span>
                      </div>
                    </div>
                    {skill.description && <p className="text-xs text-gray-500 mb-2">{skill.description}</p>}
                    {skill.content && (
                      <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-2 max-h-24 overflow-y-auto">
                        <pre className="text-[10px] text-gray-400 whitespace-pre-wrap font-mono">{skill.content.slice(0, 300)}{skill.content.length > 300 ? '...' : ''}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'plugins' && (
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Plugins & Tools</span>
              <div className="flex items-center gap-2">
                <input
                  value={newPluginName}
                  onChange={(e) => setNewPluginName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePlugin()}
                  placeholder="New plugin name..."
                  className="w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none"
                />
                <button onClick={handleCreatePlugin} disabled={!newPluginName.trim()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-40">
                  <Plus size={12} /> Add
                </button>
                <button onClick={handleExportTeam} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors">
                  <Download size={12} /> Export Team
                </button>
              </div>
            </div>
            {plugins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Plug size={24} className="mb-2 opacity-40" />
                <span className="text-sm">No plugins installed</span>
                <span className="text-xs text-gray-600 mt-1">Plugins extend agent capabilities with tools and integrations</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plugins.map((plugin) => {
                  const typeColors: Record<string, string> = { tool: 'bg-cyan-500/15 text-cyan-400', integration: 'bg-purple-500/15 text-purple-400', automation: 'bg-amber-500/15 text-amber-400', observer: 'bg-green-500/15 text-green-400' };
                  return (
                    <div key={plugin.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Plug size={14} className="text-purple-400" />
                          <span className="text-sm font-medium text-white">{plugin.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {plugin.version && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400">{plugin.version}</span>}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeColors[plugin.plugin_type] || 'bg-gray-500/15 text-gray-400'}`}>{plugin.plugin_type}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${plugin.is_active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>{plugin.is_active ? 'Active' : 'Disabled'}</span>
                        </div>
                      </div>
                      {plugin.description && <p className="text-xs text-gray-500 mb-2">{plugin.description}</p>}
                      {plugin.tools_provided && plugin.tools_provided.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {plugin.tools_provided.map((t, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-mono">{t}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'approvals' && (
          <div className="max-w-3xl">
            <ApprovalCenter approvals={approvals} onResolve={handleResolveApproval} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;
