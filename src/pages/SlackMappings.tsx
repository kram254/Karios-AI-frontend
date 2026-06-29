import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Hash, Plus, Trash2, RefreshCw, Bot, ShieldCheck, ShieldOff } from 'lucide-react';
import {
  slackMappingsService,
  SlackChannelMapping,
  SlackHealth,
  SlackResponseStrategy,
} from '../services/api/slack-mappings.service';

const STRATEGIES: SlackResponseStrategy[] = ['mentions_only', 'always', 'first_in_thread'];

export default function SlackMappings() {
  const [mappings, setMappings] = useState<SlackChannelMapping[]>([]);
  const [health, setHealth] = useState<SlackHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    channelId: '',
    channelName: '',
    workspaceId: '',
    agentId: '',
    responseStrategy: 'mentions_only' as SlackResponseStrategy,
    enabled: true,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [h, list] = await Promise.all([
        slackMappingsService.health(),
        slackMappingsService.list(),
      ]);
      setHealth(h);
      setMappings(list.mappings);
    } catch (e) {
      toast.error(`Failed to load Slack mappings: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onCreate = async () => {
    if (!form.channelId || !form.agentId) {
      toast.error('Channel ID and Agent ID are required');
      return;
    }
    try {
      const result = await slackMappingsService.upsert({
        channelId: form.channelId,
        agentId: parseInt(form.agentId, 10),
        channelName: form.channelName || undefined,
        workspaceId: form.workspaceId || undefined,
        responseStrategy: form.responseStrategy,
        enabled: form.enabled,
      });
      toast.success(`Mapping ${result.mapping.id.slice(0, 8)} saved`);
      setShowCreate(false);
      setForm({ channelId: '', channelName: '', workspaceId: '', agentId: '', responseStrategy: 'mentions_only', enabled: true });
      refresh();
    } catch (e) {
      toast.error(`Save failed: ${(e as Error).message}`);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this Slack channel mapping?')) return;
    try {
      await slackMappingsService.remove(id);
      toast.success('Mapping deleted');
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
              <Hash className="w-8 h-8 text-[#00F3FF]" />
              Slack Channel Mappings
            </h1>
            <p className="text-gray-400 mt-2">Route Slack channel events to specific Karios agents.</p>
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
              className="flex items-center gap-2 px-4 py-2 bg-[#00F3FF] text-black rounded hover:bg-[#00F3FF]/80 transition font-medium"
            >
              <Plus className="w-4 h-4" />
              New Mapping
            </button>
          </div>
        </div>

        {health && (
          <div className="mb-6 p-4 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                {health.signingSecretConfigured ? (
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                ) : (
                  <ShieldOff className="w-4 h-4 text-yellow-400" />
                )}
                <span className={health.signingSecretConfigured ? 'text-green-400' : 'text-yellow-400'}>
                  Signing secret: {health.signingSecretConfigured ? 'configured' : 'not set'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">
                  Bot user ID: {health.botUserIdConfigured ? 'configured' : 'unset (mention detection disabled)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 bg-[#1A1A1A] border border-[#00F3FF]/40 rounded"
          >
            <h2 className="text-xl font-semibold mb-4">New Channel Mapping</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Channel ID *</label>
                <input
                  type="text"
                  placeholder="C0123ABCD"
                  value={form.channelId}
                  onChange={(e) => setForm({ ...form, channelId: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 focus:border-[#00F3FF] outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Channel Name</label>
                <input
                  type="text"
                  placeholder="#sales"
                  value={form.channelName}
                  onChange={(e) => setForm({ ...form, channelName: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 focus:border-[#00F3FF] outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Workspace ID</label>
                <input
                  type="text"
                  placeholder="T0123ABCD"
                  value={form.workspaceId}
                  onChange={(e) => setForm({ ...form, workspaceId: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 focus:border-[#00F3FF] outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Agent ID *</label>
                <input
                  type="number"
                  placeholder="1"
                  value={form.agentId}
                  onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 focus:border-[#00F3FF] outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Response Strategy</label>
                <select
                  value={form.responseStrategy}
                  onChange={(e) => setForm({ ...form, responseStrategy: e.target.value as SlackResponseStrategy })}
                  className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 focus:border-[#00F3FF] outline-none"
                >
                  {STRATEGIES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enabled" className="text-sm">Enabled</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={onCreate} className="px-4 py-2 bg-[#00F3FF] text-black rounded font-medium">
                Save Mapping
              </button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-[#1A1A1A] border border-gray-700 rounded">
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        <div className="bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
          <div className="grid grid-cols-7 gap-4 px-4 py-3 border-b border-gray-800 text-xs uppercase text-gray-500 font-semibold">
            <div className="col-span-2">Channel</div>
            <div>Agent</div>
            <div>Workspace</div>
            <div>Strategy</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          {mappings.length === 0 && !loading && (
            <div className="px-4 py-12 text-center text-gray-500">
              No mappings yet. Click <span className="text-[#00F3FF]">New Mapping</span> to add one.
            </div>
          )}
          {mappings.map((m) => (
            <div key={m.id} className="grid grid-cols-7 gap-4 px-4 py-3 border-b border-gray-800 hover:bg-black/30 text-sm">
              <div className="col-span-2">
                <div className="text-white font-mono text-xs">{m.channelId}</div>
                <div className="text-gray-400 text-xs">{m.channelName || '(unnamed)'}</div>
              </div>
              <div className="text-[#00F3FF]">#{m.agentId}</div>
              <div className="text-gray-400 font-mono text-xs">{m.workspaceId || '—'}</div>
              <div className="text-gray-300">{m.responseStrategy.replace(/_/g, ' ')}</div>
              <div>
                <span className={`px-2 py-1 rounded text-xs ${m.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {m.enabled ? 'enabled' : 'paused'}
                </span>
              </div>
              <div>
                <button
                  onClick={() => onDelete(m.id)}
                  className="text-red-400 hover:text-red-300"
                  title="Delete mapping"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Slack Events API URL: <code className="text-[#00F3FF]">{`{your-host}/api/v1/slack/events`}</code>
        </div>
      </div>
    </div>
  );
}
