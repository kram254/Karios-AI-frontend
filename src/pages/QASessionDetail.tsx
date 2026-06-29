import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, Activity, AlertTriangle, CheckCircle, XCircle, Clock,
  Eye, Bug, Wrench, TrendingUp, TrendingDown, Minus, FileText, Image,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { qaService, QASession, QAIssue, QAHealthScore, QAFix, QAReport } from '../services/qaService';

const severityColors: Record<string, string> = {
  critical: 'border-red-500/40 bg-red-500/5',
  high: 'border-orange-500/40 bg-orange-500/5',
  medium: 'border-yellow-500/40 bg-yellow-500/5',
  low: 'border-blue-500/40 bg-blue-500/5',
  cosmetic: 'border-gray-500/40 bg-gray-500/5',
};

const severityBadge: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cosmetic: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const statusBadge: Record<string, string> = {
  found: 'bg-gray-500/20 text-gray-400',
  triaged: 'bg-blue-500/20 text-blue-400',
  fixing: 'bg-purple-500/20 text-purple-400',
  verified: 'bg-green-500/20 text-green-400',
  best_effort: 'bg-yellow-500/20 text-yellow-400',
  reverted: 'bg-red-500/20 text-red-400',
  deferred: 'bg-gray-500/20 text-gray-500',
  wont_fix: 'bg-gray-600/20 text-gray-500',
};

const fixClassColors: Record<string, string> = {
  verified: 'text-green-400',
  best_effort: 'text-yellow-400',
  reverted: 'text-red-400',
  failed: 'text-red-500',
};

const QASessionDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<QASession | null>(null);
  const [issues, setIssues] = useState<QAIssue[]>([]);
  const [healthScores, setHealthScores] = useState<QAHealthScore[]>([]);
  const [fixes, setFixes] = useState<QAFix[]>([]);
  const [report, setReport] = useState<QAReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'issues' | 'fixes' | 'health' | 'report'>('issues');
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!sessionId) return;
    setLoadError(null);
    try {
      const [s, i, h, f] = await Promise.all([
        qaService.getSession(sessionId),
        qaService.getIssues(sessionId),
        qaService.getHealthScores(sessionId),
        qaService.getFixes(sessionId),
      ]);
      setSession(s);
      setIssues(i);
      setHealthScores(h);
      setFixes(f);
      if (s.status === 'completed' || s.report_data) {
        try {
          const r = await qaService.getReport(sessionId);
          setReport(r);
        } catch (_) {}
      }
    } catch (err) {
      console.error('Failed to load QA session:', err);
      setLoadError('Failed to load session details.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const toggleIssue = (issueId: string) => {
    setExpandedIssues(prev => {
      const next = new Set(prev);
      if (next.has(issueId)) next.delete(issueId);
      else next.add(issueId);
      return next;
    });
  };

  const getHealthColor = (score: number | null): string => {
    if (score === null) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getHealthBg = (score: number | null): string => {
    if (score === null) return 'bg-gray-500/10';
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    if (score >= 40) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400 flex items-center gap-2">
          <Clock className="w-5 h-5 animate-spin" />
          Loading QA session...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-400">QA session not found</p>
        <button onClick={() => navigate('/qa')} className="text-neon-cyan hover:underline">Back to Dashboard</button>
      </div>
    );
  }

  const isActive = !['completed', 'failed', 'stopped'].includes(session.status);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {loadError && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <span>{loadError}</span>
          <button type="button" onClick={loadData} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/qa')} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <Shield className="w-6 h-6 text-neon-cyan" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {session.target_url}
            <a href={session.target_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-neon-cyan">
              <ExternalLink className="w-4 h-4" />
            </a>
          </h1>
          <div className="text-sm text-gray-400 flex items-center gap-3">
            <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">{session.tier}</span>
            <span className={isActive ? 'text-yellow-400' : session.status === 'completed' ? 'text-green-400' : 'text-red-400'}>
              {session.status}
            </span>
            {isActive && session.phase_description && (
              <span>Phase {session.current_phase}: {session.phase_description}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`rounded-xl p-4 border border-gray-700 ${getHealthBg(session.baseline_health_score)}`}>
          <div className="text-xs text-gray-400 mb-1">Baseline</div>
          <div className={`text-2xl font-bold ${getHealthColor(session.baseline_health_score)}`}>
            {session.baseline_health_score !== null ? session.baseline_health_score.toFixed(0) : '—'}
          </div>
        </div>
        <div className={`rounded-xl p-4 border border-gray-700 ${getHealthBg(session.final_health_score)}`}>
          <div className="text-xs text-gray-400 mb-1">Final</div>
          <div className={`text-2xl font-bold ${getHealthColor(session.final_health_score)}`}>
            {session.final_health_score !== null ? session.final_health_score.toFixed(0) : '—'}
          </div>
        </div>
        <div className="rounded-xl p-4 border border-gray-700 bg-gray-800/50">
          <div className="text-xs text-gray-400 mb-1">Delta</div>
          <div className="flex items-center gap-1">
            {session.health_delta !== null && session.health_delta > 0 && <TrendingUp className="w-5 h-5 text-green-400" />}
            {session.health_delta !== null && session.health_delta < 0 && <TrendingDown className="w-5 h-5 text-red-400" />}
            {(session.health_delta === null || session.health_delta === 0) && <Minus className="w-5 h-5 text-gray-400" />}
            <span className={`text-2xl font-bold ${
              session.health_delta !== null && session.health_delta > 0 ? 'text-green-400' :
              session.health_delta !== null && session.health_delta < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {session.health_delta !== null ? (session.health_delta > 0 ? '+' : '') + session.health_delta.toFixed(1) : '—'}
            </span>
          </div>
        </div>
        <div className="rounded-xl p-4 border border-gray-700 bg-gray-800/50">
          <div className="text-xs text-gray-400 mb-1">Issues / Fixes</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{session.total_issues_found}</span>
            <span className="text-gray-500">/</span>
            <span className="text-lg font-bold text-green-400">{session.fixes_verified}</span>
          </div>
        </div>
        <div className="rounded-xl p-4 border border-gray-700 bg-gray-800/50">
          <div className="text-xs text-gray-400 mb-1">WTF Risk</div>
          <div className={`text-2xl font-bold ${session.wtf_likelihood_pct > 15 ? 'text-orange-400' : 'text-gray-400'}`}>
            {session.wtf_likelihood_pct.toFixed(0)}%
          </div>
          {session.stopped_by_wtf && (
            <div className="text-xs text-orange-400 mt-1">Stopped by WTF</div>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-700 gap-1">
        {(['issues', 'fixes', 'health', 'report'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-neon-cyan border-b-2 border-neon-cyan'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'issues' && <Bug className="w-4 h-4 inline mr-1" />}
            {tab === 'fixes' && <Wrench className="w-4 h-4 inline mr-1" />}
            {tab === 'health' && <Activity className="w-4 h-4 inline mr-1" />}
            {tab === 'report' && <FileText className="w-4 h-4 inline mr-1" />}
            {tab} ({tab === 'issues' ? issues.length : tab === 'fixes' ? fixes.length : tab === 'health' ? healthScores.length : report ? 1 : 0})
          </button>
        ))}
      </div>

      {activeTab === 'issues' && (
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {isActive ? 'Issues will appear as testing progresses...' : 'No issues found'}
            </div>
          ) : (
            issues.map(issue => (
              <div
                key={issue.issue_id}
                className={`border rounded-xl p-4 ${severityColors[issue.severity] || 'border-gray-700 bg-gray-800/50'}`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleIssue(issue.issue_id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`px-2 py-0.5 text-xs font-medium border rounded ${severityBadge[issue.severity] || ''}`}>
                      {issue.severity}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded ${statusBadge[issue.status] || ''}`}>
                      {issue.status}
                    </span>
                    <span className="text-white font-medium">{issue.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {issue.has_screenshot_before && <Image className="w-4 h-4 text-gray-500" />}
                    {expandedIssues.has(issue.issue_id) ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>
                {expandedIssues.has(issue.issue_id) && (
                  <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-2">
                    {issue.description && (
                      <p className="text-sm text-gray-300">{issue.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      {issue.page_url && <span>URL: {issue.page_url}</span>}
                      {issue.element_ref && <span>Ref: <code className="text-neon-cyan">{issue.element_ref}</code></span>}
                      {issue.selector && <span>Selector: <code className="text-neon-cyan">{issue.selector}</code></span>}
                      {issue.flow_name && <span>Flow: {issue.flow_name}</span>}
                      {issue.step_description && <span>Step: {issue.step_description}</span>}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'fixes' && (
        <div className="space-y-3">
          {fixes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {isActive ? 'Fixes will appear during the fix loop...' : 'No fixes applied'}
            </div>
          ) : (
            fixes.map(fix => (
              <div key={fix.fix_id} className="border border-gray-700 rounded-xl p-4 bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm">#{fix.fix_order}</span>
                    <span className={`font-medium ${fixClassColors[fix.classification] || 'text-gray-400'}`}>
                      {fix.classification}
                    </span>
                    {fix.description && <span className="text-gray-300 text-sm">{fix.description}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {fix.file_count > 0 && <span>{fix.file_count} file(s)</span>}
                    {fix.wtf_penalty_applied > 0 && (
                      <span className="text-orange-400">+{fix.wtf_penalty_applied.toFixed(0)}% WTF</span>
                    )}
                    {fix.has_screenshot_before && <Image className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-3">
          {healthScores.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Health measurements will appear after baseline...</div>
          ) : (
            healthScores.map((h, idx) => (
              <div key={idx} className="border border-gray-700 rounded-xl p-4 bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">{h.phase}</span>
                  <span className={`text-2xl font-bold ${getHealthColor(h.score)}`}>{h.score.toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      h.score >= 80 ? 'bg-green-500' : h.score >= 60 ? 'bg-yellow-500' : h.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, h.score)}%` }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-gray-400">
                  {h.critical_count > 0 && <span className="text-red-400">{h.critical_count} critical</span>}
                  {h.high_count > 0 && <span className="text-orange-400">{h.high_count} high</span>}
                  {h.medium_count > 0 && <span className="text-yellow-400">{h.medium_count} medium</span>}
                  {h.low_count > 0 && <span className="text-blue-400">{h.low_count} low</span>}
                  {h.console_error_count > 0 && <span>{h.console_error_count} console errors</span>}
                  {h.network_failure_count > 0 && <span>{h.network_failure_count} network failures</span>}
                  {h.broken_link_count > 0 && <span>{h.broken_link_count} broken links</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'report' && (
        <div className="space-y-4">
          {!report ? (
            <div className="text-center py-12 text-gray-500">
              {isActive ? 'Report will be generated after QA completes...' : 'No report available'}
            </div>
          ) : (
            <div className="border border-gray-700 rounded-xl p-6 bg-gray-800/50 space-y-4">
              <h3 className="text-lg font-semibold text-white">QA Report</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-400">Baseline</div>
                  <div className={`text-xl font-bold ${getHealthColor(report.baseline_health_score)}`}>
                    {report.baseline_health_score?.toFixed(0) ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Final</div>
                  <div className={`text-xl font-bold ${getHealthColor(report.final_health_score)}`}>
                    {report.final_health_score?.toFixed(0) ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Issues</div>
                  <div className="text-xl font-bold text-white">{report.total_issues_found}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Fixes Verified</div>
                  <div className="text-xl font-bold text-green-400">{report.fixes_verified}</div>
                </div>
              </div>
              {report.severity_breakdown && (
                <div>
                  <div className="text-sm text-gray-400 mb-2">Severity Breakdown</div>
                  <div className="flex gap-3">
                    {Object.entries(report.severity_breakdown).map(([sev, count]) => (
                      count > 0 && (
                        <span key={sev} className={`px-2 py-1 text-xs border rounded ${severityBadge[sev] || ''}`}>
                          {sev}: {count}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}
              {report.wtf_likelihood && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">WTF Likelihood</div>
                  <div className="text-sm text-gray-300">
                    {report.wtf_likelihood.pct.toFixed(1)}% (threshold: {report.wtf_likelihood.threshold}%) —
                    {report.wtf_likelihood.revert_count} reverts, {report.wtf_likelihood.large_fix_count} large fixes
                    {report.stopped_by_wtf && <span className="text-orange-400 ml-2">⚠ Session stopped by WTF</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QASessionDetail;
