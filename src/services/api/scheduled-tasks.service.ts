import { api } from './index';

export type TriggerType = 'cron' | 'interval' | 'once' | 'webhook';

export interface NotificationChannel {
  type: 'email' | 'webhook' | 'slack';
  target: string;
}

export interface ScheduledTask {
  schedule_id: string;
  name: string;
  objective: string;
  agent_id: number | null;
  trigger_type: TriggerType;
  cron_expression: string | null;
  interval_seconds: number | null;
  run_at: string | null;
  timezone: string;
  enabled: boolean;
  max_runs: number | null;
  run_count: number;
  last_run_at: string | null;
  next_run_at: string | null;
  last_task_id: string | null;
  last_status: string | null;
  notification_channels: NotificationChannel[];
  memory_enabled: boolean;
  created_at: string;
  updated_at: string;
  webhook_secret?: string;
}

export interface ScheduledTaskRun {
  task_id: string;
  status: string;
  quality_score: number | null;
  created_at: string;
  completed_at: string | null;
  result_preview: string | null;
}

export interface AgentMemoryEntry {
  memory_id: string;
  summary: string;
  objective: string;
  quality_score: number | null;
  created_at: string;
  task_id: string | null;
}

export interface CreateScheduledTaskPayload {
  name: string;
  objective: string;
  agent_id?: number;
  trigger_type: TriggerType;
  cron_expression?: string;
  interval_seconds?: number;
  run_at?: string;
  timezone?: string;
  enabled?: boolean;
  max_runs?: number;
  notification_channels?: NotificationChannel[];
  memory_enabled?: boolean;
}

export interface UpdateScheduledTaskPayload {
  name?: string;
  objective?: string;
  agent_id?: number;
  trigger_type?: TriggerType;
  cron_expression?: string;
  interval_seconds?: number;
  run_at?: string;
  timezone?: string;
  enabled?: boolean;
  max_runs?: number;
  notification_channels?: NotificationChannel[];
  memory_enabled?: boolean;
}

export const scheduledTasksService = {
  listScheduledTasks: (params?: { enabled?: boolean; agent_id?: number; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.enabled !== undefined) query.set('enabled', String(params.enabled));
    if (params?.agent_id !== undefined) query.set('agent_id', String(params.agent_id));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    const qs = query.toString();
    return api.get<{ items: ScheduledTask[]; total: number }>(`/api/scheduled-tasks${qs ? '?' + qs : ''}`);
  },

  getScheduledTask: (scheduleId: string) =>
    api.get<ScheduledTask>(`/api/scheduled-tasks/${scheduleId}`),

  createScheduledTask: (payload: CreateScheduledTaskPayload) =>
    api.post<ScheduledTask>('/api/scheduled-tasks', payload),

  updateScheduledTask: (scheduleId: string, payload: UpdateScheduledTaskPayload) =>
    api.patch<ScheduledTask>(`/api/scheduled-tasks/${scheduleId}`, payload),

  deleteScheduledTask: (scheduleId: string) =>
    api.delete(`/api/scheduled-tasks/${scheduleId}`),

  runNow: (scheduleId: string) =>
    api.post<{ task_id: string; message: string }>(`/api/scheduled-tasks/${scheduleId}/run-now`, {}),

  toggleScheduledTask: (scheduleId: string) =>
    api.post<{ enabled: boolean }>(`/api/scheduled-tasks/${scheduleId}/toggle`, {}),

  getRunHistory: (scheduleId: string, limit = 20) =>
    api.get<ScheduledTaskRun[]>(`/api/scheduled-tasks/${scheduleId}/runs?limit=${limit}`),

  getMemory: (scheduleId: string) =>
    api.get<AgentMemoryEntry[]>(`/api/scheduled-tasks/${scheduleId}/memory`),

  deleteMemory: (scheduleId: string, memoryId: string) =>
    api.delete(`/api/scheduled-tasks/${scheduleId}/memory/${memoryId}`),
};
