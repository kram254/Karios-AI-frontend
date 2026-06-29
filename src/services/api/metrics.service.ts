import { api } from './index';

export interface MetricsSummary {
  days: number;
  calls: number;
  costUsd: number;
  tokens: number;
  avgDurationMs: number;
  errors: number;
  errorRate: number;
  uniqueAgents: number;
  rubricScoreCount: number;
  rubricAvgScore: number | null;
}

export interface CostBucket {
  bucket: string;
  totalCostUsd: number;
  totalTokens: number;
  callCount: number;
  successCount: number;
  errorCount: number;
}

export interface CostOverTime {
  agentId: number | null;
  days: number;
  bucket: string;
  totalRows: number;
  series: CostBucket[];
}

export interface AgentInvocation {
  agentId: number;
  calls: number;
  costUsd: number;
  tokens: number;
  avgDurationMs: number;
  errors: number;
  errorRate: number;
}

export interface RubricHistogramBin {
  low: number;
  high: number;
  count: number;
  label: string;
}

export interface RubricHistogram {
  rubricId: number | null;
  agentId: number | null;
  days: number;
  binSize: number;
  totalScores: number;
  averageScore: number | null;
  triggeredCount: number;
  bins: RubricHistogramBin[];
}

export interface LatencyStats {
  agentId: number | null;
  model: string | null;
  days: number;
  sampleCount: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  p50: number | null;
  p95: number | null;
  p99: number | null;
}

export const metricsService = {
  async summary(days = 7): Promise<MetricsSummary> {
    const res = await api.get('/api/v1/metrics/summary', { params: { days } });
    return res.data;
  },
  async costOverTime(opts?: { agentId?: number; days?: number; bucket?: 'hour' | 'day' | 'week' | 'month' }): Promise<CostOverTime> {
    const params: Record<string, unknown> = { days: opts?.days ?? 30, bucket: opts?.bucket ?? 'day' };
    if (opts?.agentId !== undefined) params.agent_id = opts.agentId;
    const res = await api.get('/api/v1/metrics/cost-over-time', { params });
    return res.data;
  },
  async agentInvocations(days = 30, limit = 25): Promise<{ days: number; agents: AgentInvocation[] }> {
    const res = await api.get('/api/v1/metrics/agent-invocations', { params: { days, limit } });
    return res.data;
  },
  async rubricHistogram(opts?: { rubricId?: number; agentId?: number; days?: number; binSize?: number }): Promise<RubricHistogram> {
    const params: Record<string, unknown> = { days: opts?.days ?? 30, bin_size: opts?.binSize ?? 10 };
    if (opts?.rubricId !== undefined) params.rubric_id = opts.rubricId;
    if (opts?.agentId !== undefined) params.agent_id = opts.agentId;
    const res = await api.get('/api/v1/metrics/rubric-histogram', { params });
    return res.data;
  },
  async latency(opts?: { agentId?: number; days?: number; model?: string }): Promise<LatencyStats> {
    const params: Record<string, unknown> = { days: opts?.days ?? 30 };
    if (opts?.agentId !== undefined) params.agent_id = opts.agentId;
    if (opts?.model) params.model = opts.model;
    const res = await api.get('/api/v1/metrics/latency', { params });
    return res.data;
  },
};
