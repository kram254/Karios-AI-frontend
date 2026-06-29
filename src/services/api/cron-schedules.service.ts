import { api } from './index';

export type CronTriggerType = 'cron' | 'interval' | 'once' | 'webhook';

export interface CronSchedule {
  id: number;
  scheduleId: string;
  userId: number | null;
  orgId: number | null;
  agentId: number | null;
  name: string;
  objective: string;
  triggerType: CronTriggerType;
  cronExpression: string | null;
  intervalSeconds: number | null;
  runAt: string | null;
  timezone: string;
  enabled: boolean;
  maxRuns: number | null;
  runCount: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastTaskId: string | null;
  lastStatus: string | null;
  notificationChannels: Array<Record<string, unknown>>;
  memoryEnabled: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  metadata: Record<string, unknown>;
}

export interface CronScheduleCreate {
  name: string;
  objective: string;
  agentId?: number | null;
  cronExpression?: string;
  intervalSeconds?: number;
  runAt?: string;
  timezone?: string;
  maxRuns?: number;
  notificationChannels?: Array<Record<string, unknown>>;
  memoryEnabled?: boolean;
  metadata?: Record<string, unknown>;
}

export const cronSchedulesService = {
  async list(filters?: {
    agentId?: number;
    userId?: number;
    enabledOnly?: boolean;
    limit?: number;
  }): Promise<{ count: number; schedules: CronSchedule[] }> {
    const params: Record<string, unknown> = {};
    if (filters?.agentId !== undefined) params.agent_id = filters.agentId;
    if (filters?.userId !== undefined) params.user_id = filters.userId;
    if (filters?.enabledOnly) params.enabled_only = true;
    if (filters?.limit) params.limit = filters.limit;
    const res = await api.get('/api/v1/cron/schedules', { params });
    return res.data;
  },
  async create(body: CronScheduleCreate): Promise<{ status: string; schedule: CronSchedule }> {
    const res = await api.post('/api/v1/cron/schedules', body);
    return res.data;
  },
  async get(scheduleId: string): Promise<{ schedule: CronSchedule }> {
    const res = await api.get(`/api/v1/cron/schedules/${scheduleId}`);
    return res.data;
  },
  async pause(scheduleId: string): Promise<{ status: string; schedule: CronSchedule }> {
    const res = await api.post(`/api/v1/cron/schedules/${scheduleId}/pause`);
    return res.data;
  },
  async resume(scheduleId: string): Promise<{ status: string; schedule: CronSchedule }> {
    const res = await api.post(`/api/v1/cron/schedules/${scheduleId}/resume`);
    return res.data;
  },
  async remove(scheduleId: string): Promise<{ status: string; id: string }> {
    const res = await api.delete(`/api/v1/cron/schedules/${scheduleId}`);
    return res.data;
  },
  async upcoming(limit = 25): Promise<{ count: number; schedules: CronSchedule[] }> {
    const res = await api.get('/api/v1/cron/upcoming', { params: { limit } });
    return res.data;
  },
  async trigger(scheduleId: string): Promise<Record<string, unknown>> {
    const res = await api.post(`/api/v1/cron/schedules/${scheduleId}/trigger`);
    return res.data;
  },
};
