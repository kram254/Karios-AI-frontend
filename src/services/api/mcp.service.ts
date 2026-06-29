import { api } from './index';

export interface MCPInfo {
  protocolVersion: string;
  serverInfo: { name: string; version: string };
  authRequired: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  metadata: {
    timeoutSeconds: number;
    requiresApproval: boolean;
    isDestructive: boolean;
    costEstimateUsd: number;
    tags: string[];
  };
}

export interface MCPSkill {
  id: string;
  name: string;
  description: string;
  category: string | null;
  version: number;
  toolDefinitions: Array<Record<string, unknown>>;
  pinned: boolean;
}

export interface MCPResource {
  uri: string;
  name: string;
  mimeType: string;
  description: string;
}

export const mcpService = {
  async info(): Promise<MCPInfo> {
    const res = await api.get('/api/v1/mcp/info');
    return res.data;
  },
  async health(): Promise<{ status: string; protocolVersion: string; authRequired: boolean }> {
    const res = await api.get('/api/v1/mcp/health');
    return res.data;
  },
  async listTools(opts?: { agentId?: number; tag?: string; apiKey?: string }): Promise<{ count: number; tools: MCPTool[] }> {
    const params: Record<string, unknown> = {};
    if (opts?.agentId !== undefined) params.agent_id = opts.agentId;
    if (opts?.tag) params.tag = opts.tag;
    const headers: Record<string, string> = {};
    if (opts?.apiKey) headers['X-MCP-API-Key'] = opts.apiKey;
    const res = await api.get('/api/v1/mcp/tools', { params, headers });
    return res.data;
  },
  async callTool(body: {
    name: string;
    arguments?: Record<string, unknown>;
    agentId?: number;
    timeoutSeconds?: number;
    apiKey?: string;
  }): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {};
    if (body.apiKey) headers['X-MCP-API-Key'] = body.apiKey;
    const payload: Record<string, unknown> = {
      name: body.name,
      arguments: body.arguments || {},
    };
    if (body.agentId !== undefined) payload.agentId = body.agentId;
    if (body.timeoutSeconds !== undefined) payload.timeoutSeconds = body.timeoutSeconds;
    const res = await api.post('/api/v1/mcp/tools/call', payload, { headers });
    return res.data;
  },
  async listSkills(opts?: { agentId?: number; apiKey?: string }): Promise<{ count: number; skills: MCPSkill[] }> {
    const params: Record<string, unknown> = {};
    if (opts?.agentId !== undefined) params.agent_id = opts.agentId;
    const headers: Record<string, string> = {};
    if (opts?.apiKey) headers['X-MCP-API-Key'] = opts.apiKey;
    const res = await api.get('/api/v1/mcp/skills', { params, headers });
    return res.data;
  },
  async listResources(opts?: { agentId?: number; apiKey?: string }): Promise<{ count: number; resources: MCPResource[] }> {
    const params: Record<string, unknown> = {};
    if (opts?.agentId !== undefined) params.agent_id = opts.agentId;
    const headers: Record<string, string> = {};
    if (opts?.apiKey) headers['X-MCP-API-Key'] = opts.apiKey;
    const res = await api.get('/api/v1/mcp/resources', { params, headers });
    return res.data;
  },
};
