import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Clock, Plus, Trash2, RefreshCw, Play, Pause, Zap } from 'lucide-react';
import {
  cronSchedulesService,
  CronSchedule,
  CronTriggerType,
} from '../services/api/cron-schedules.service';

type Mode = 'cron' | 'interval' | 'once';

export default function CronSchedules() {
  const [schedules, setSchedules] = useState<CronSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [mode, setMode] = useState<Mode>('cron');
  const [form, setForm] = useState({
    name: '',
    objective: '',
    agentId: '',
    cronExpression: '0 9 * * *',
    intervalSeconds: '3600',
    runAt: '',
    timezone: 'UTC',
    memoryEnabled: true,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await cronSchedulesService.list({ limit: 100 });
      setSchedules(r.schedules);
    } catch (e) {
      toast.error(`Failed to load: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onCreate = async () => {
    if (!form.name || !form.objective) {
      toast.error('Name and objective are required');
      return;
    }
    const payload: Record<string, unknown> = {
      name: form.name,
      objective: form.objective,
      timezone: form.timezone,
      memoryEnabled: form.memoryEnabled,
    };
    if (form.agentId) payload.agentId = parseInt(form.agentId, 10);
    if (mode === 'cron') payload.cronExpression = form.cronExpression;
    if (mode === 'interval') payload.intervalSeconds = parseInt(form.intervalSeconds, 10);
    if (mode === 'once') payload.runAt = form.runAt;
    try {
      const result = await cronSchedulesService.create(payload as never);
      toast.success(`Schedule "${result.schedule.name}" created`);
      setShowCreate(false);
      setForm({ ...form, name: '', objective: '' });
      refresh();
    } catch (e) {
      toast.error(`Create failed: ${(e as Error).message}`);
    }
  };

  const onPauseResume = async (s: CronSchedule) => {
    try {
      if (s.enabled) await cronSchedulesService.pause(s.scheduleId);
      else await cronSchedulesService.resume(s.scheduleId);
      toast.success(s.enabled ? 'Paused' : 'Resumed');
      refresh();
    } catch (e) {
      toast.error(`Action failed: ${(e as Error).message}`);
    }
  };

  const onTrigger = async (s: CronSchedule) => {
    try {
      await cronSchedulesService.trigger(s.scheduleId);
      toast.success(`Triggered "${s.name}"`);
      refresh();
    } catch (e) {
      toast.error(`Trigger failed: ${(e as Error).message}`);
    }
  };

  const onDelete = async (s: CronSchedule) => {
    if (!confirm(`Delete schedule "${s.name}"?`)) return;
    try {
      await cronSchedulesService.remove(s.scheduleId);
      toast.success('Deleted');
      refresh();
    } catch (e) {
      toast.error(`Delete failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Clock className="w-8 h-8 text-[#00F3FF]" />
              Cron Schedules
            </h1>
            <p className="text-gray-400 mt-2">Schedule agents to run on cron, interval, or one-shot triggers.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded hover:border-[#00F3FF]/50 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#00F3FF] text-black rounded font-medium"
            >
              <Plus className="w-4 h-4" />
              New Schedule
            </button>
          </div>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 bg-[#1A1A1A] border border-[#00F3FF]/40 rounded"
          >
            <h2 className="text-xl font-semibold mb-4">New Schedule</h2>
            <div className="flex gap-2 mb-4">
              {(['cron', 'interval', 'once'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded text-sm ${mode === m ? 'bg-[#00F3FF] text-black font-medium' : 'bg-[#0A0A0A] border border-gray-700'}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Daily standup digest"
                  className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Agent ID</label>
                <input
                  type="number"
                  value={form.agentId}
                  onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                  placeholder="optional"
                  className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-400 block mb-1">Objective *</label>
                <textarea
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  placeholder="Pull yesterday's GitHub activity and post a summary"
                  className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 h-20"
                />
              </div>
              {mode === 'cron' && (
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Cron expression</label>
                  <input
                    type="text"
                    value={form.cronExpression}
                    onChange={(e) => setForm({ ...form, cronExpression: e.target.value })}
                    placeholder="0 9 * * *"
                    className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 font-mono"
                  />
                </div>
              )}
              {mode === 'interval' && (
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Interval (seconds)</label>
                  <input
                    type="number"
                    value={form.intervalSeconds}
                    onChange={(e) => setForm({ ...form, intervalSeconds: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2"
                  />
                </div>
              )}
              {mode === 'once' && (
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Run at (ISO 8601)</label>
                  <input
                    type="datetime-local"
                    value={form.runAt}
                    onChange={(e) => setForm({ ...form, runAt: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2"
                  />
                </div>
              )}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Timezone</label>
                <input
                  type="text"
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={onCreate} className="px-4 py-2 bg-[#00F3FF] text-black rounded font-medium">
                Save
              </button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-[#1A1A1A] border border-gray-700 rounded">
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        <div className="bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
          <div className="grid grid-cols-7 gap-3 px-4 py-3 border-b border-gray-800 text-xs uppercase text-gray-500 font-semibold">
            <div className="col-span-2">Schedule</div>
            <div>Trigger</div>
            <div>Next run</div>
            <div>Status</div>
            <div>Runs</div>
            <div>Actions</div>
          </div>
          {schedules.length === 0 && !loading && (
            <div className="px-4 py-12 text-center text-gray-500">No schedules yet.</div>
          )}
          {schedules.map((s) => (
            <div key={s.scheduleId} className="grid grid-cols-7 gap-3 px-4 py-3 border-b border-gray-800 hover:bg-black/30 text-sm">
              <div className="col-span-2">
                <div className="text-white font-medium">{s.name}</div>
                <div className="text-gray-500 text-xs truncate">{s.objective}</div>
              </div>
              <div>
                <div className="text-[#00F3FF] text-xs uppercase">{s.triggerType}</div>
                <div className="text-gray-400 font-mono text-xs">
                  {s.cronExpression || (s.intervalSeconds ? `${s.intervalSeconds}s` : s.runAt) || '—'}
                </div>
              </div>
              <div className="text-gray-300 text-xs">{s.nextRunAt ? new Date(s.nextRunAt).toLocaleString() : '—'}</div>
              <div>
                <span className={`px-2 py-1 rounded text-xs ${s.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {s.enabled ? 'enabled' : 'paused'}
                </span>
              </div>
              <div className="text-gray-300">{s.runCount}{s.maxRuns ? `/${s.maxRuns}` : ''}</div>
              <div className="flex gap-2">
                <button onClick={() => onPauseResume(s)} title={s.enabled ? 'Pause' : 'Resume'} className="text-gray-300 hover:text-[#00F3FF]">
                  {s.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => onTrigger(s)} title="Trigger now" className="text-yellow-400 hover:text-yellow-300">
                  <Zap className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(s)} title="Delete" className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
