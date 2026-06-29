import { api } from '../api';

export type AgentCapability =
  | 'chat'
  | 'research'
  | 'code'
  | 'analysis'
  | 'automation'
  | 'web_scraping'
  | 'document_processing'
  | 'translation'
  | 'summarization'
  | 'multi_agent';

export interface AgentIdentity {
  agent_id: string;
  name: string;
  capabilities: AgentCapability[];
  reputation_score: number;
  success_rate: number;
  total_transactions: number;
  successful_transactions: number;
  created_at: string;
  metadata: Record<string, any>;
  did?: string;
}

export interface ServiceEndpoint {
  path: string;
  method: string;
  description: string;
  price_per_call: number;
  currency: string;
  rate_limit: number;
}

export interface RegisteredService {
  service_id: string;
  agent_id: string;
  name: string;
  description: string;
  version: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  endpoints: ServiceEndpoint[];
}

export interface AgentSearchRequest {
  capabilities?: AgentCapability[];
  min_reputation?: number;
  min_success_rate?: number;
  query?: string;
  limit?: number;
}

export interface AgentWithServices {
  agent: AgentIdentity;
  services: RegisteredService[];
}

export interface RegistryStats {
  total_agents: number;
  total_services: number;
  agents_by_capability: Record<string, number>;
  avg_reputation_score: number;
  avg_success_rate: number;
}

class AgentRegistryService {
  async registerAgent(
    agentId: string,
    name: string,
    capabilities: AgentCapability[],
    metadata?: Record<string, any>
  ): Promise<AgentIdentity> {
    const response = await api.post('/api/v1/sumi/registry/agents/register', {
      agent_id: agentId,
      name,
      capabilities,
      metadata
    });
    return response.data;
  }

  async registerService(
    agentId: string,
    name: string,
    description: string,
    endpoints: Omit<ServiceEndpoint, 'input_schema' | 'output_schema'>[],
    version: string = '1.0.0',
    tags?: string[]
  ): Promise<RegisteredService> {
    const response = await api.post('/api/v1/sumi/registry/services/register', {
      agent_id: agentId,
      name,
      description,
      endpoints: endpoints.map(e => ({
        ...e,
        input_schema: {},
        output_schema: {}
      })),
      version,
      tags
    });
    return response.data;
  }

  async searchAgents(request: AgentSearchRequest = {}): Promise<{ agents: AgentIdentity[]; total: number }> {
    const response = await api.post('/api/v1/sumi/registry/agents/search', request);
    return response.data;
  }

  async getAgent(agentId: string): Promise<AgentWithServices> {
    const response = await api.get(`/api/v1/sumi/registry/agents/${agentId}`);
    return response.data;
  }

  async updateReputation(
    agentId: string,
    success: boolean,
    rating?: number
  ): Promise<AgentIdentity> {
    const response = await api.post(`/api/v1/sumi/registry/agents/${agentId}/reputation`, {
      agent_id: agentId,
      capability: 'general',
      success,
      rating
    });
    return response.data;
  }

  async getStats(): Promise<RegistryStats> {
    const response = await api.get('/api/v1/sumi/registry/stats');
    return response.data;
  }

  async getCapabilities(): Promise<{ capabilities: AgentCapability[] }> {
    const response = await api.get('/api/v1/sumi/registry/capabilities');
    return response.data;
  }

  async findAgentsForTask(
    capabilities: AgentCapability[],
    minAgents: number = 1,
    maxAgents: number = 5
  ): Promise<{ agents: AgentIdentity[] }> {
    const response = await api.post('/api/v1/sumi/registry/find-for-task', null, {
      params: { min_agents: minAgents, max_agents: maxAgents },
      data: capabilities
    });
    return response.data;
  }

  async getBestAgentForCapability(capability: AgentCapability): Promise<AgentIdentity | null> {
    const result = await this.searchAgents({
      capabilities: [capability],
      limit: 1
    });
    return result.agents[0] || null;
  }

  async getAgentsByCapabilities(
    requiredCapabilities: AgentCapability[]
  ): Promise<AgentIdentity[]> {
    const result = await this.searchAgents({
      capabilities: requiredCapabilities,
      min_success_rate: 0.7
    });
    return result.agents;
  }
}

export const agentRegistryService = new AgentRegistryService();
