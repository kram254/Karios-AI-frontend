import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bot, Clock, Plus, Play, Trash2, ToggleLeft, ToggleRight,
  CheckCircle, XCircle, Loader, ChevronRight, Mail, Webhook,
  Brain, Settings2, History, Bell, X, ExternalLink, Zap, RefreshCw
} from 'lucide-react';
import {
  scheduledTasksService,
  ScheduledTask,
  ScheduledTaskRun,
  AgentMemoryEntry,
  NotificationChannel,
  CreateScheduledTaskPayload,
} from '../services/api/scheduled-tasks.service';
import { agentService } from '../services/api/agent.service';
import { Agent } from '../types/agent';

const API_BASE_URL = String((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/$/, '');

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);
  const prefix = diff > 0 ? 'in ' : '';
  const suffix = diff <= 0 ? ' ago' : '';
  if (mins < 1) return diff > 0 ? 'Now' : 'Just now';
  if (mins < 60) return `${prefix}${mins}m${suffix}`;
  if (hours < 24) return `${prefix}${hours}h${suffix}`;
  return `${prefix}${days}d${suffix}`;
}

function triggerBadge(type: string) {
  const map: Record<string, { color: string; label: string }> = {
    cron: { color: 'border-violet-500 text-violet-400', label: 'Cron' },
    interval: { color: 'border-cyan-500 text-cyan-400', label: 'Interval' },
    once: { color: 'border-amber-500 text-amber-400', label: 'Once' },
    webhook: { color: 'border-green-500 text-green-400', label: 'Webhook' },
  };
  const c = map[type] || { color: 'border-gray-500 text-gray-400', label: type };
  return (
    <span className={`text-xs border rounded-full px-2 py-0.5 font-medium ${c.color}`}>
      {c.label}
    </span>
  );
}

function StatusDot({ status }: { status: string | null }) {
  if (status === 'running') return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
  if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-400" />;
  if (status === 'failed') return <XCircle className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-gray-500" />;
}

const DETAIL_TABS = ['Overview', 'Run History', 'Memory', 'Notifications', 'Settings'] as const;
type DetailTab = typeof DETAIL_TABS[number];

const TRIGGER_TYPES = [
  { value: 'cron', label: 'Cron (schedule expression)' },
  { value: 'interval', label: 'Interval (every N minutes/hours)' },
  { value: 'once', label: 'Once (specific datetime)' },
  { value: 'webhook', label: 'Webhook (triggered externally)' },
] as const;

function humanCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;
  const [min, hour, dom, month, dow] = parts;
  if (min === '0' && dom === '*' && month === '*' && dow === '*') return `Every day at ${hour}:00 UTC`;
  if (min === '0' && dom === '*' && month === '*') return `Every weekday at ${hour}:00 UTC`;
  if (min.startsWith('*/')) return `Every ${min.slice(2)} minutes`;
  if (min === '0' && hour === '*') return 'Every hour';
  return expr;
}

export default function ScheduledTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ScheduledTask | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('Overview');
  const [runs, setRuns] = useState<ScheduledTaskRun[]>([]);
  const [memory, setMemory] = useState<AgentMemoryEntry[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [runNowLoading, setRunNowLoading] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannel, setNewChannel] = useState<NotificationChannel>({ type: 'email', target: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, setForm] = useState<CreateScheduledTaskPayload>({
    name: '',
    objective: '',
    agent_id: undefined,
    trigger_type: 'cron',
    cron_expression: '0 9 * * *',
    interval_seconds: undefined,
    run_at: undefined,
    timezone: 'UTC',
    enabled: true,
    max_runs: undefined,
    notification_channels: [],
    memory_enabled: true,
  });

  const [editForm, setEditForm] = useState<Partial<ScheduledTask>>({});

  const loadTasks = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await scheduledTasksService.listScheduledTasks({ limit: 100 });
      setTasks(res.data.items);
      setTotal(res.data.total);
    } catch {
      setLoadError('Failed to load scheduled tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    agentService.getAgents().then(r => setAgents(r.data)).catch(() => {});
    const iv = setInterval(loadTasks, 30000);
    return () => clearInterval(iv);
  }, [loadTasks]);

  const loadDetail = useCallback(async (s: ScheduledTask, tab: DetailTab) => {
    if (tab === 'Run History') {
      try {
        const r = await scheduledTasksService.getRunHistory(s.schedule_id);
        setRuns(r.data);
      } catch { setRuns([]); }
    }
    if (tab === 'Memory') {
      try {
        const r = await scheduledTasksService.getMemory(s.schedule_id);
        setMemory(r.data);
      } catch { setMemory([]); }
    }
  }, []);

  const selectTask = (s: ScheduledTask) => {
    setSelected(s);
    setEditForm({ ...s });
    setActiveTab('Overview');
    loadDetail(s, 'Overview');
  };

  const handleTabChange = (tab: DetailTab) => {
    setActiveTab(tab);
    if (selected) loadDetail(selected, tab);
  };

  const handleToggle = async (s: ScheduledTask) => {
    try {
      await scheduledTasksService.toggleScheduledTask(s.schedule_id);
      await loadTasks();
      if (selected?.schedule_id === s.schedule_id) {
        const updated = tasks.find(t => t.schedule_id === s.schedule_id);
        if (updated) setSelected({ ...updated, enabled: !s.enabled });
      }
      toast.success(s.enabled ? 'Schedule disabled' : 'Schedule enabled');
    } catch {
      toast.error('Toggle failed');
    }
  };

  const handleRunNow = async () => {
    if (!selected) return;
    setRunNowLoading(true);
    try {
      await scheduledTasksService.runNow(selected.schedule_id);
      toast.success('Task triggered! Check Run History.');
      await loadTasks();
    } catch {
      toast.error('Failed to trigger task');
    } finally {
      setRunNowLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await scheduledTasksService.deleteScheduledTask(selected.schedule_id);
      toast.success('Schedule deleted');
      setSelected(null);
      setShowDeleteConfirm(false);
      await loadTasks();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleDeleteMemory = async (memId: string) => {
    if (!selected) return;
    try {
      await scheduledTasksService.deleteMemory(selected.schedule_id, memId);
      setMemory(m => m.filter(e => e.memory_id !== memId));
      toast.success('Memory entry deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleSaveSettings = async () => {
    if (!selected) return;
    try {
      const payload: any = { ...editForm };
      if (payload.run_at && typeof payload.run_at === 'string') payload.run_at = payload.run_at;
      await scheduledTasksService.updateScheduledTask(selected.schedule_id, payload);
      toast.success('Settings saved');
      await loadTasks();
    } catch {
      toast.error('Save failed');
    }
  };

  const handleAddChannel = async () => {
    if (!selected || !newChannel.target) return;
    const channels = [...(selected.notification_channels || []), newChannel];
    try {
      await scheduledTasksService.updateScheduledTask(selected.schedule_id, { notification_channels: channels });
      setSelected({ ...selected, notification_channels: channels });
      setShowAddChannel(false);
      setNewChannel({ type: 'email', target: '' });
      toast.success('Notification channel added');
    } catch {
      toast.error('Failed to add channel');
    }
  };

  const handleRemoveChannel = async (idx: number) => {
    if (!selected) return;
    const channels = (selected.notification_channels || []).filter((_, i) => i !== idx);
    try {
      await scheduledTasksService.updateScheduledTask(selected.schedule_id, { notification_channels: channels });
      setSelected({ ...selected, notification_channels: channels });
    } catch {
      toast.error('Failed to remove channel');
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.objective) {
      toast.error('Name and objective are required');
      return;
    }
    setCreating(true);
    try {
      const payload: CreateScheduledTaskPayload = { ...form };
      if (form.trigger_type === 'interval' && form.interval_seconds) {
        payload.interval_seconds = Number(form.interval_seconds);
      }
      const res = await scheduledTasksService.createScheduledTask(payload);
      toast.success('Schedule created!');
      setShowCreate(false);
      setCreateStep(0);
      setForm({
        name: '', objective: '', agent_id: undefined, trigger_type: 'cron',
        cron_expression: '0 9 * * *', interval_seconds: undefined, run_at: undefined,
        timezone: 'UTC', enabled: true, max_runs: undefined, notification_channels: [], memory_enabled: true,
      });
      await loadTasks();
      const found = tasks.find(t => t.schedule_id === res.data.schedule_id) || res.data;
      selectTask(found);
    } catch {
      toast.error('Failed to create schedule');
    } finally {
      setCreating(false);
    }
  };

  const agentName = (id: number | null) => {
    if (!id) return 'Any agent';
    const a = agents.find(ag => ag.id === id);
    return a?.name || `Agent #${id}`;
  };

  const webhookUrl = selected
    ? `${API_BASE_URL}/api/scheduled-tasks/${selected.schedule_id}/webhook-trigger`
    : '';

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Left panel */}
      <div className="w-80 flex-shrink-0 border-r border-[#1e1e2e] flex flex-col">
        <div className="p-4 border-b border-[#1e1e2e] flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Scheduled Tasks</h1>
            <p className="text-xs text-gray-500">Run agents automatically</p>
          </div>
          <button
            onClick={() => { setShowCreate(true); setCreateStep(0); }}
            className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 px-3 py-1.5 rounded-lg text-sm hover:bg-cyan-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadError && (
            <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mx-2 mt-2">
              <span>{loadError}</span>
              <button type="button" onClick={loadTasks} className="ml-auto text-xs underline">Retry</button>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Bot className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm font-medium">No scheduled tasks yet</p>
              <p className="text-gray-600 text-xs mt-1">Create one to run agents automatically</p>
            </div>
          ) : (
            tasks.map(s => (
              <button
                key={s.schedule_id}
                onClick={() => selectTask(s)}
                className={`w-full text-left p-3 border-b border-[#1e1e2e] hover:bg-[#111218] transition-colors ${selected?.schedule_id === s.schedule_id ? 'bg-[#111218]' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <StatusDot status={s.last_status} />
                  <span className="text-sm font-medium text-white truncate flex-1">{s.name}</span>
                  {triggerBadge(s.trigger_type)}
                </div>
                <div className="flex items-center gap-2 ml-6">
                  <span className="text-xs text-gray-500">
                    {s.next_run_at ? `Runs ${formatRelative(s.next_run_at)}` : s.last_run_at ? `Ran ${formatRelative(s.last_run_at)}` : 'Not scheduled'}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleToggle(s); }}
                    className="ml-auto"
                  >
                    {s.enabled
                      ? <ToggleRight className="w-4 h-4 text-green-400" />
                      : <ToggleLeft className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right detail panel */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Clock className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Select a scheduled task to view details</p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-[#1e1e2e] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusDot status={selected.last_status} />
                <div>
                  <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {triggerBadge(selected.trigger_type)}
                    <span className="text-xs text-gray-500">{agentName(selected.agent_id)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRunNow}
                disabled={runNowLoading}
                className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 px-4 py-2 rounded-lg text-sm hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
              >
                {runNowLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Run Now
              </button>
            </div>

            <div className="flex border-b border-[#1e1e2e] px-6">
              {DETAIL_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeTab === 'Overview' && (
                    <div className="space-y-4 max-w-2xl">
                      <div className="bg-[#111218] border border-[#1e1e2e] rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-2">Objective</p>
                        <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono bg-[#0a0a0f] rounded-lg p-3 text-xs leading-relaxed">{selected.objective}</pre>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#111218] border border-[#1e1e2e] rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">Trigger</p>
                          <p className="text-sm text-white">
                            {selected.trigger_type === 'cron' && selected.cron_expression ? humanCron(selected.cron_expression) : null}
                            {selected.trigger_type === 'interval' && selected.interval_seconds ? `Every ${selected.interval_seconds}s` : null}
                            {selected.trigger_type === 'once' && selected.run_at ? new Date(selected.run_at).toLocaleString() : null}
                            {selected.trigger_type === 'webhook' ? 'Externally triggered' : null}
                          </p>
                        </div>
                        <div className="bg-[#111218] border border-[#1e1e2e] rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">Next Run</p>
                          <p className="text-sm text-white">{formatRelative(selected.next_run_at)}</p>
                        </div>
                        <div className="bg-[#111218] border border-[#1e1e2e] rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">Run Count</p>
                          <p className="text-sm text-white">{selected.run_count}{selected.max_runs ? ` / ${selected.max_runs}` : ''}</p>
                        </div>
                        <div className="bg-[#111218] border border-[#1e1e2e] rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">Memory</p>
                          <p className={`text-sm ${selected.memory_enabled ? 'text-violet-400' : 'text-gray-500'}`}>{selected.memory_enabled ? 'Enabled' : 'Disabled'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Run History' && (
                    <div className="space-y-3 max-w-2xl">
                      {runs.length === 0 ? (
                        <div className="text-center py-12">
                          <History className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No runs yet</p>
                        </div>
                      ) : runs.map(run => (
                        <div key={run.task_id} className="bg-[#111218] border border-[#1e1e2e] rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <StatusDot status={run.status} />
                              <span className="text-sm font-medium text-white capitalize">{run.status}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {run.quality_score != null && (
                                <span className="text-xs text-cyan-400">{Math.round(run.quality_score)}%</span>
                              )}
                              <span className="text-xs text-gray-500">{run.created_at ? new Date(run.created_at).toLocaleString() : '—'}</span>
                              <button
                                onClick={() => navigate(`/chat?task=${run.task_id}`)}
                                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View
                              </button>
                            </div>
                          </div>
                          {run.result_preview && (
                            <p className="text-xs text-gray-400 font-mono bg-[#0a0a0f] rounded p-2 truncate">{run.result_preview}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'Memory' && (
                    <div className="max-w-2xl">
                      <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Brain className="w-4 h-4 text-violet-400" />
                          <span className="text-sm font-medium text-violet-400">Episodic Memory</span>
                        </div>
                        <p className="text-xs text-gray-400">Each completed run saves a memory that is automatically injected into the next run to give your agent context about past results.</p>
                      </div>
                      {memory.length === 0 ? (
                        <div className="text-center py-12">
                          <Brain className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No memory entries yet</p>
                          <p className="text-gray-600 text-xs mt-1">Memory is saved automatically after each completed run</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {memory.map(e => (
                            <div key={e.memory_id} className="bg-[#111218] border border-[#1e1e2e] rounded-xl p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 mb-1">{new Date(e.created_at).toLocaleString()}</p>
                                  <p className="text-sm text-gray-200">{e.summary}</p>
                                  {e.quality_score != null && (
                                    <p className="text-xs text-cyan-400 mt-1">Quality: {Math.round(e.quality_score)}%</p>
                                  )}
                                </div>
                                <button onClick={() => handleDeleteMemory(e.memory_id)} className="text-gray-600 hover:text-red-400 transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'Notifications' && (
                    <div className="max-w-2xl space-y-4">
                      {(selected.notification_channels || []).length === 0 && !showAddChannel ? (
                        <div className="text-center py-8">
                          <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No notification channels configured</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(selected.notification_channels || []).map((ch, i) => (
                            <div key={i} className="bg-[#111218] border border-[#1e1e2e] rounded-xl p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {ch.type === 'email' && <Mail className="w-4 h-4 text-cyan-400" />}
                                {ch.type === 'webhook' && <Webhook className="w-4 h-4 text-green-400" />}
                                {ch.type === 'slack' && <Bell className="w-4 h-4 text-amber-400" />}
                                <span className="text-sm text-white capitalize">{ch.type}</span>
                                <span className="text-xs text-gray-500 truncate max-w-xs">{ch.target}</span>
                              </div>
                              <button onClick={() => handleRemoveChannel(i)} className="text-gray-600 hover:text-red-400">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {showAddChannel ? (
                        <div className="bg-[#111218] border border-cyan-500/30 rounded-xl p-4 space-y-3">
                          <select
                            value={newChannel.type}
                            onChange={e => setNewChannel({ ...newChannel, type: e.target.value as any })}
                            className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white"
                          >
                            <option value="email">Email</option>
                            <option value="webhook">Webhook URL</option>
                            <option value="slack">Slack Webhook URL</option>
                          </select>
                          <input
                            value={newChannel.target}
                            onChange={e => setNewChannel({ ...newChannel, target: e.target.value })}
                            placeholder={newChannel.type === 'email' ? 'user@example.com' : 'https://...'}
                            className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white"
                          />
                          <div className="flex gap-2">
                            <button onClick={handleAddChannel} className="flex-1 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 py-2 rounded-lg text-sm hover:bg-cyan-500/20">Add</button>
                            <button onClick={() => setShowAddChannel(false)} className="flex-1 bg-gray-500/10 border border-gray-500/40 text-gray-400 py-2 rounded-lg text-sm hover:bg-gray-500/20">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddChannel(true)}
                          className="w-full flex items-center justify-center gap-2 border border-dashed border-[#2a2a3e] rounded-xl py-3 text-sm text-gray-500 hover:text-gray-300 hover:border-[#3a3a4e] transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add notification channel
                        </button>
                      )}

                      {selected.trigger_type === 'webhook' && (
                        <div className="bg-[#111218] border border-green-500/30 rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-2">Webhook Trigger URL</p>
                          <code className="text-xs text-green-400 break-all">{webhookUrl}?webhook_secret=YOUR_SECRET</code>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'Settings' && (
                    <div className="max-w-2xl space-y-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Name</label>
                        <input
                          value={editForm.name || ''}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Objective</label>
                        <textarea
                          value={editForm.objective || ''}
                          onChange={e => setEditForm({ ...editForm, objective: e.target.value })}
                          rows={4}
                          className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Agent</label>
                        <select
                          value={editForm.agent_id || ''}
                          onChange={e => setEditForm({ ...editForm, agent_id: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white"
                        >
                          <option value="">Any agent</option>
                          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Trigger Type</label>
                          <select
                            value={editForm.trigger_type || 'cron'}
                            onChange={e => setEditForm({ ...editForm, trigger_type: e.target.value as any })}
                            className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white"
                          >
                            {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Max Runs</label>
                          <input
                            type="number"
                            value={editForm.max_runs || ''}
                            onChange={e => setEditForm({ ...editForm, max_runs: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="Unlimited"
                            className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white"
                          />
                        </div>
                      </div>
                      {editForm.trigger_type === 'cron' && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Cron Expression</label>
                          <input
                            value={editForm.cron_expression || ''}
                            onChange={e => setEditForm({ ...editForm, cron_expression: e.target.value })}
                            placeholder="0 9 * * *"
                            className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white font-mono"
                          />
                          {editForm.cron_expression && (
                            <p className="text-xs text-violet-400 mt-1">{humanCron(editForm.cron_expression)}</p>
                          )}
                        </div>
                      )}
                      {editForm.trigger_type === 'interval' && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Interval (seconds)</label>
                          <input
                            type="number"
                            value={editForm.interval_seconds || ''}
                            onChange={e => setEditForm({ ...editForm, interval_seconds: Number(e.target.value) })}
                            className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-400">Enabled</label>
                        <button onClick={() => setEditForm({ ...editForm, enabled: !editForm.enabled })} className="text-gray-400">
                          {editForm.enabled ? <ToggleRight className="w-6 h-6 text-green-400" /> : <ToggleLeft className="w-6 h-6 text-gray-500" />}
                        </button>
                        <label className="text-sm text-gray-400 ml-4">Memory</label>
                        <button onClick={() => setEditForm({ ...editForm, memory_enabled: !editForm.memory_enabled })} className="text-gray-400">
                          {editForm.memory_enabled ? <ToggleRight className="w-6 h-6 text-violet-400" /> : <ToggleLeft className="w-6 h-6 text-gray-500" />}
                        </button>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={handleSaveSettings} className="flex-1 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 py-2.5 rounded-xl text-sm hover:bg-cyan-500/20 transition-colors">
                          Save Changes
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center gap-2 bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-2.5 rounded-xl text-sm hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111218] border border-[#1e1e2e] rounded-2xl w-full max-w-lg"
            >
              <div className="p-6 border-b border-[#1e1e2e] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">New Scheduled Task</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {['Basic', 'Trigger', 'Notifications', 'Review'].map((step, i) => (
                      <React.Fragment key={step}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === createStep ? 'bg-cyan-500 text-black' : i < createStep ? 'bg-cyan-500/30 text-cyan-400' : 'bg-[#1e1e2e] text-gray-500'}`}>
                          {i + 1}
                        </div>
                        {i < 3 && <div className={`h-0.5 w-8 ${i < createStep ? 'bg-cyan-500/50' : 'bg-[#1e1e2e]'}`} />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {createStep === 0 && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Name *</label>
                      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Daily competitor analysis" className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Objective *</label>
                      <textarea value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} rows={4} placeholder="Describe what the agent should do..." className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Agent (optional)</label>
                      <select value={form.agent_id || ''} onChange={e => setForm({ ...form, agent_id: e.target.value ? Number(e.target.value) : undefined })} className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white">
                        <option value="">Any agent</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {createStep === 1 && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Trigger Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {TRIGGER_TYPES.map(t => (
                          <button
                            key={t.value}
                            onClick={() => setForm({ ...form, trigger_type: t.value as any })}
                            className={`p-3 rounded-xl border text-left text-sm ${form.trigger_type === t.value ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-[#2a2a3e] text-gray-400 hover:border-[#3a3a4e]'}`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {form.trigger_type === 'cron' && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Cron Expression</label>
                        <input value={form.cron_expression || ''} onChange={e => setForm({ ...form, cron_expression: e.target.value })} placeholder="0 9 * * *" className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white font-mono" />
                        {form.cron_expression && <p className="text-xs text-violet-400 mt-1">{humanCron(form.cron_expression)}</p>}
                      </div>
                    )}
                    {form.trigger_type === 'interval' && (
                      <div className="flex gap-2">
                        <input type="number" placeholder="60" onChange={e => setForm({ ...form, interval_seconds: Number(e.target.value) * 60 })} className="flex-1 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white" />
                        <span className="text-sm text-gray-500 flex items-center">minutes</span>
                      </div>
                    )}
                    {form.trigger_type === 'once' && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Run At</label>
                        <input type="datetime-local" onChange={e => setForm({ ...form, run_at: new Date(e.target.value).toISOString() })} className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white" />
                      </div>
                    )}
                    {form.trigger_type === 'webhook' && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs text-green-400">
                        A webhook URL will be generated after creation. Use it with a secret key to trigger this task externally.
                      </div>
                    )}
                  </>
                )}

                {createStep === 2 && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">Optional — add email, webhook, or Slack notifications when the task completes.</p>
                    {(form.notification_channels || []).map((ch, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-400 capitalize">{ch.type}:</span>
                        <span className="text-xs text-white truncate flex-1">{ch.target}</span>
                        <button onClick={() => setForm({ ...form, notification_channels: (form.notification_channels || []).filter((_, j) => j !== i) })} className="text-gray-600 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <select value={newChannel.type} onChange={e => setNewChannel({ ...newChannel, type: e.target.value as any })} className="bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-2 py-2 text-xs text-white">
                        <option value="email">Email</option>
                        <option value="webhook">Webhook</option>
                        <option value="slack">Slack</option>
                      </select>
                      <input value={newChannel.target} onChange={e => setNewChannel({ ...newChannel, target: e.target.value })} placeholder="Enter target..." className="flex-1 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-xs text-white" />
                      <button onClick={() => { if (newChannel.target) { setForm({ ...form, notification_channels: [...(form.notification_channels || []), { ...newChannel }] }); setNewChannel({ type: 'email', target: '' }); } }} className="bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 px-3 py-2 rounded-lg text-xs"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}

                {createStep === 3 && (
                  <div className="space-y-3">
                    <div className="bg-[#0a0a0f] rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="text-white">{form.name}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Trigger</span>{triggerBadge(form.trigger_type)}</div>
                      {form.cron_expression && form.trigger_type === 'cron' && (
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Schedule</span><span className="text-violet-400">{humanCron(form.cron_expression)}</span></div>
                      )}
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Agent</span><span className="text-white">{agentName(form.agent_id || null)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Notifications</span><span className="text-white">{(form.notification_channels || []).length}</span></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[#1e1e2e] flex gap-3">
                {createStep > 0 && (
                  <button onClick={() => setCreateStep(s => s - 1)} className="flex-1 bg-gray-500/10 border border-gray-500/40 text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-500/20">
                    Back
                  </button>
                )}
                {createStep < 3 ? (
                  <button onClick={() => setCreateStep(s => s + 1)} className="flex-1 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 py-2.5 rounded-xl text-sm hover:bg-cyan-500/20 flex items-center justify-center gap-2">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleCreate} disabled={creating} className="flex-1 bg-cyan-500 text-black py-2.5 rounded-xl text-sm font-bold hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2">
                    {creating ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Create Schedule
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#111218] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-white font-bold mb-2">Delete Schedule?</h3>
              <p className="text-gray-400 text-sm mb-4">This will permanently delete "{selected?.name}" and all its memory entries. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-500/10 border border-gray-500/40 text-gray-400 py-2.5 rounded-xl text-sm">Cancel</button>
                <button onClick={handleDelete} className="flex-1 bg-red-500/10 border border-red-500/40 text-red-400 py-2.5 rounded-xl text-sm hover:bg-red-500/20">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
