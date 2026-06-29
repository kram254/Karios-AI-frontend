import { api } from './index';

export type SlackResponseStrategy = 'always' | 'mentions_only' | 'first_in_thread';

export interface SlackChannelMapping {
  id: string;
  workspaceId: string | null;
  channelId: string;
  channelName: string | null;
  agentId: number;
  responseStrategy: SlackResponseStrategy;
  enabled: boolean;
  signingSecretHint: string | null;
  createdBy: number | null;
  extraConfig: Record<string, unknown>;
  lastEventTs: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SlackHealth {
  status: string;
  signingSecretConfigured: boolean;
  botUserIdConfigured: boolean;
}

export interface SlackMappingCreate {
  channelId: string;
  agentId: number;
  workspaceId?: string;
  channelName?: string;
  responseStrategy?: SlackResponseStrategy;
  enabled?: boolean;
  signingSecretHint?: string;
  extraConfig?: Record<string, unknown>;
}

export const slackMappingsService = {
  async health(): Promise<SlackHealth> {
    const res = await api.get('/api/v1/slack/health');
    return res.data;
  },
  async list(filters?: {
    agentId?: number;
    workspaceId?: string;
    channelId?: string;
    enabledOnly?: boolean;
  }): Promise<{ count: number; mappings: SlackChannelMapping[] }> {
    const params: Record<string, unknown> = {};
    if (filters?.agentId !== undefined) params.agent_id = filters.agentId;
    if (filters?.workspaceId) params.workspace_id = filters.workspaceId;
    if (filters?.channelId) params.channel_id = filters.channelId;
    if (filters?.enabledOnly) params.enabled_only = true;
    const res = await api.get('/api/v1/slack/mappings', { params });
    return res.data;
  },
  async upsert(body: SlackMappingCreate): Promise<{ status: string; mapping: SlackChannelMapping }> {
    const res = await api.post('/api/v1/slack/mappings', body);
    return res.data;
  },
  async remove(mappingId: string): Promise<{ status: string; id: string }> {
    const res = await api.delete(`/api/v1/slack/mappings/${mappingId}`);
    return res.data;
  },
};
