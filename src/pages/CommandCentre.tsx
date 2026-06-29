import React, { useState, useEffect, useCallback } from 'react';
import { Monitor, Activity, CheckCircle, Clock, DollarSign, TrendingUp, Zap, RefreshCw, BarChart2, Cpu, Play } from 'lucide-react';
import { analyticsService, MetricsSummary, AgentPerformance, CostBreakdown } from '../services/api/analytics.service';
import { scheduledTasksService, ScheduledTask } from '../services/api/scheduled-tasks.service';
import { useAuth } from '../context/AuthContext';

const CommandCentre: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const getPeriodDates = (period: '7d' | '30d' | '90d') => {
    const end = new Date();
    const start = new Date();
    if (period === '7d') start.setDate(start.getDate() - 7);
    else if (period === '30d') start.setDate(start.getDate() - 30);
    else start.setDate(start.getDate() - 90);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      const { startDate, endDate } = getPeriodDates(selectedPeriod);
      const [summaryData, perfData, costData, tasksData] = await Promise.allSettled([
        analyticsService.getMetricsSummary(startDate, endDate),
        analyticsService.getAgentPerformance(),
        analyticsService.getCostBreakdown(),
        scheduledTasksService.listScheduledTasks({}),
      ]);
      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
      if (perfData.status === 'fulfilled') setAgentPerformance(perfData.value);
      if (costData.status === 'fulfilled') setCostBreakdown(costData.value);
      if (tasksData.status === 'fulfilled') {
        const items = (tasksData.value as any)?.data?.items || [];
        setScheduledTasks(items);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load Command Centre data:', err);
      setLoadError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const runningTasks = scheduledTasks.filter((t) => t.last_status === 'running');
  const activeTasks = scheduledTasks.filter((t) => t.enabled);
  const totalCostAllAgents = costBreakdown.reduce((s, c) => s + c.cost, 0);

  return (
    <div style={{ overflowY: 'auto', height: '100%', minHeight: 0 }}>
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor className="w-8 h-8 text-neon-cyan" />
          <div>
            <h1 className="text-2xl font-bold text-white">Command Centre</h1>
            <p className="text-sm text-gray-400">Real-time monitoring and analytics across all agents</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <RefreshCw className="w-3 h-3" />
            {lastUpdated.toLocaleTimeString()}
          </div>
          <div className="flex bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedPeriod === p
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-lg border border-gray-700 hover:border-neon-cyan/40 transition-colors text-gray-400 hover:text-neon-cyan"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <span>{loadError}</span>
          <button type="button" onClick={loadData} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: 'Total Executions',
            value: summary?.totalExecutions ?? '—',
            icon: <Activity className="w-5 h-5" />,
            color: 'text-blue-400',
          },
          {
            label: 'Success Rate',
            value: summary ? `${(summary.successRate * 100).toFixed(1)}%` : '—',
            icon: <CheckCircle className="w-5 h-5" />,
            color: 'text-green-400',
          },
          {
            label: 'Active Agents',
            value: agentPerformance.length || '—',
            icon: <Zap className="w-5 h-5" />,
            color: 'text-neon-cyan',
          },
          {
            label: 'Running Tasks',
            value: runningTasks.length,
            icon: <Play className="w-5 h-5" />,
            color: 'text-yellow-400',
          },
          {
            label: 'Total Cost',
            value: summary ? `$${summary.totalCost.toFixed(4)}` : '—',
            icon: <DollarSign className="w-5 h-5" />,
            color: 'text-purple-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
          >
            <div className={`${stat.color} mb-2`}>{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-neon-cyan" />
            <h2 className="font-semibold text-white">Agent Performance</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : agentPerformance.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Cpu className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No agent data yet. Build and run agents to see performance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-700">
                    <th className="text-left p-3 font-medium">Agent</th>
                    <th className="text-right p-3 font-medium">Runs</th>
                    <th className="text-right p-3 font-medium">Success</th>
                    <th className="text-right p-3 font-medium">Avg Time</th>
                    <th className="text-right p-3 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerformance.map((agent) => (
                    <tr
                      key={agent.agentId}
                      className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-neon-cyan flex-shrink-0" />
                          <span className="text-sm text-white truncate max-w-[140px]">
                            {agent.agentName}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right text-sm text-gray-300">
                        {agent.executions}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`text-sm font-medium ${
                            agent.successRate >= 0.9
                              ? 'text-green-400'
                              : agent.successRate >= 0.7
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          {(agent.successRate * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-3 text-right text-sm text-gray-300">
                        {agent.avgDuration.toFixed(1)}s
                      </td>
                      <td className="p-3 text-right text-sm text-neon-cyan">
                        ${agent.totalCost.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-neon-cyan" />
            <h2 className="font-semibold text-white">Cost Breakdown</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : costBreakdown.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No cost data yet.</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {costBreakdown.map((item) => {
                const pct =
                  totalCostAllAgents > 0
                    ? (item.cost / totalCostAllAgents) * 100
                    : 0;
                return (
                  <div key={item.agentName}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 truncate max-w-[200px]">
                        {item.agentName}
                      </span>
                      <span className="text-neon-cyan font-medium">
                        ${item.cost.toFixed(4)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neon-cyan/60 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.executions} executions · {pct.toFixed(1)}% of total
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-neon-cyan" />
            <h2 className="font-semibold text-white">Scheduled Tasks</h2>
            {runningTasks.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded-full">
                {runningTasks.length} running
              </span>
            )}
          </div>
          <span className="text-sm text-gray-400">
            {activeTasks.length} active / {scheduledTasks.length} total
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : scheduledTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No scheduled tasks yet. Create one in Scheduled Tasks.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-700">
                  <th className="text-left p-3 font-medium">Task</th>
                  <th className="text-left p-3 font-medium">Schedule</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Last Run</th>
                  <th className="text-center p-3 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {scheduledTasks.slice(0, 15).map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors"
                  >
                    <td className="p-3">
                      <span className="text-sm text-white truncate max-w-[200px] block">
                        {task.name || task.title || 'Unnamed Task'}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-400 font-mono">
                      {task.cron_expression || task.schedule || '—'}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          task.last_status === 'running'
                            ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30'
                            : task.last_status === 'success'
                            ? 'bg-green-400/10 text-green-400 border border-green-400/30'
                            : task.last_status === 'failed'
                            ? 'bg-red-400/10 text-red-400 border border-red-400/30'
                            : 'bg-gray-500/10 text-gray-400 border border-gray-600/30'
                        }`}
                      >
                        {task.last_status || 'idle'}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-400">
                      {task.last_run_at
                        ? new Date(task.last_run_at).toLocaleString()
                        : '—'}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`w-2 h-2 rounded-full inline-block ${
                          task.enabled ? 'bg-green-400' : 'bg-gray-600'
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-neon-cyan" />
          <h2 className="font-semibold text-white">Usage Transparency</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
            <div className="text-xs text-gray-400 mb-2">Total Platform Cost</div>
            <div className="text-2xl font-bold text-neon-cyan">
              {summary ? `$${summary.totalCost.toFixed(4)}` : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Real LLM API charges</div>
          </div>
          <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
            <div className="text-xs text-gray-400 mb-2">Avg. Cost per Execution</div>
            <div className="text-2xl font-bold text-white">
              {summary && summary.totalExecutions > 0
                ? `$${(summary.totalCost / summary.totalExecutions).toFixed(5)}`
                : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Across all agent runs</div>
          </div>
          <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
            <div className="text-xs text-gray-400 mb-2">Avg. Response Time</div>
            <div className="text-2xl font-bold text-white">
              {summary ? `${summary.avgDuration.toFixed(1)}s` : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Mean execution duration</div>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20 text-sm text-gray-300">
          Cost data reflects actual charges from your configured LLM providers (OpenAI, Anthropic, Gemini, etc.). Token-level granularity is available when your backend token tracking is enabled per provider via BYOK settings.
        </div>
      </div>
    </div>
    </div>
  );
};

export default CommandCentre;
