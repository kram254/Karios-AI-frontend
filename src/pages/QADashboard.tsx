import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Activity, AlertTriangle, CheckCircle, XCircle, Clock, Play, Eye, ChevronRight, TrendingUp, TrendingDown, Minus, Bug, Wrench } from 'lucide-react';
import { qaService, QASession } from '../services/qaService';

const severityColors: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  cosmetic: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
};

const statusIcons: Record<string, React.ReactNode> = {
  setup: <Clock className="w-4 h-4 text-gray-400" />,
  baseline: <Activity className="w-4 h-4 text-blue-400" />,
  testing: <Bug className="w-4 h-4 text-yellow-400" />,
  triaging: <AlertTriangle className="w-4 h-4 text-orange-400" />,
  fixing: <Wrench className="w-4 h-4 text-purple-400" />,
  final_qa: <Eye className="w-4 h-4 text-cyan-400" />,
  reporting: <Activity className="w-4 h-4 text-blue-400" />,
  completed: <CheckCircle className="w-4 h-4 text-green-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  stopped: <XCircle className="w-4 h-4 text-gray-400" />,
};

const tierLabels: Record<string, string> = {
  quick: 'Quick (Critical+High)',
  standard: 'Standard (+Medium)',
  exhaustive: 'Exhaustive (All)',
};

const QADashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<QASession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [tier, setTier] = useState('standard');
  const [creating, setCreating] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await qaService.listSessions(50);
      setSessions(data);
    } catch (err) {
      console.error('Failed to load QA sessions:', err);
      setLoadError('Failed to load QA sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const handleCreate = async () => {
    if (!targetUrl.trim()) return;
    setCreating(true);
    try {
      const session = await qaService.createSession({ target_url: targetUrl.trim(), tier });
      navigate(`/qa/${session.session_id}`);
    } catch (err) {
      console.error('Failed to create QA session:', err);
    } finally {
      setCreating(false);
    }
  };

  const getHealthColor = (score: number | null): string => {
    if (score === null) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getDeltaIcon = (delta: number | null) => {
    if (delta === null) return <Minus className="w-4 h-4 text-gray-400" />;
    if (delta > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (delta < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const activeSessions = sessions.filter(s => !['completed', 'failed', 'stopped'].includes(s.status));
  const completedSessions = sessions.filter(s => ['completed', 'failed', 'stopped'].includes(s.status));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-neon-cyan" />
          <div>
            <h1 className="text-2xl font-bold text-white">QA Dashboard</h1>
            <p className="text-sm text-gray-400">Browser-powered quality assurance with visual verification</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-lg hover:bg-neon-cyan/30 transition-colors"
        >
          <Play className="w-4 h-4" />
          New QA Session
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <span>{loadError}</span>
          <button type="button" onClick={loadSessions} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {showCreate && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Start QA Session</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Target URL</label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://your-app.com"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-neon-cyan outline-none"
              >
                <option value="quick">Quick</option>
                <option value="standard">Standard</option>
                <option value="exhaustive">Exhaustive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !targetUrl.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-gray-900 font-medium rounded-lg hover:bg-neon-cyan/90 transition-colors disabled:opacity-50"
            >
              {creating ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {creating ? 'Starting...' : 'Start QA'}
            </button>
          </div>
        </div>
      )}

      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-yellow-400" />
            Active Sessions ({activeSessions.length})
          </h2>
          <div className="grid gap-3">
            {activeSessions.map(session => (
              <div
                key={session.session_id}
                onClick={() => navigate(`/qa/${session.session_id}`)}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 cursor-pointer hover:border-neon-cyan/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcons[session.status] || <Clock className="w-4 h-4 text-gray-400" />}
                    <div>
                      <div className="text-white font-medium">{session.target_url}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">{tierLabels[session.tier] || session.tier}</span>
                        <span>Phase {session.current_phase}: {session.phase_description || session.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {session.total_issues_found > 0 && (
                      <div className="text-sm text-gray-400">
                        <span className="text-white font-medium">{session.total_issues_found}</span> issues
                      </div>
                    )}
                    {session.wtf_likelihood_pct > 0 && (
                      <div className="text-xs text-orange-400">
                        WTF: {session.wtf_likelihood_pct.toFixed(0)}%
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-neon-cyan transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Completed Sessions ({completedSessions.length})
        </h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading sessions...</div>
        ) : completedSessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No QA sessions yet. Start one to test your application.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {completedSessions.map(session => (
              <div
                key={session.session_id}
                onClick={() => navigate(`/qa/${session.session_id}`)}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 cursor-pointer hover:border-neon-cyan/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcons[session.status] || <CheckCircle className="w-4 h-4 text-gray-400" />}
                    <div>
                      <div className="text-white font-medium">{session.target_url}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">{tierLabels[session.tier] || session.tier}</span>
                        {session.started_at && (
                          <span>{new Date(session.started_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getHealthColor(session.baseline_health_score)}`}>
                        {session.baseline_health_score !== null ? `${session.baseline_health_score.toFixed(0)}` : '—'}
                      </div>
                      <div className="text-xs text-gray-500">Before</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getDeltaIcon(session.health_delta)}
                      <span className={`text-sm font-medium ${
                        session.health_delta !== null && session.health_delta > 0 ? 'text-green-400' :
                        session.health_delta !== null && session.health_delta < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {session.health_delta !== null ? (session.health_delta > 0 ? '+' : '') + session.health_delta.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getHealthColor(session.final_health_score)}`}>
                        {session.final_health_score !== null ? `${session.final_health_score.toFixed(0)}` : '—'}
                      </div>
                      <div className="text-xs text-gray-500">After</div>
                    </div>
                    <div className="text-sm text-gray-400 min-w-[80px] text-right">
                      <div><span className="text-white">{session.total_issues_found}</span> issues</div>
                      <div><span className="text-green-400">{session.fixes_verified}</span> fixed</div>
                    </div>
                    {session.stopped_by_wtf && (
                      <div className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/30 rounded text-xs text-orange-400">
                        WTF-stopped
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-neon-cyan transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QADashboard;
