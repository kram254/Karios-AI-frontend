import { api } from '../services/api';
import type {
  HyperAgentIdentity,
  HyperSkill,
  EvaluationRubric,
  RubricScore,
  CreateAgentRequest,
  UpdateAgentRequest,
  CreateSkillRequest,
  CreateRubricRequest,
  RecordScoreRequest,
  FleetOverview,
  RoleDistribution,
  AgentActivity,
  ModelDowngradeSuggestion,
  DeploymentHealth,
  OptimizationSuggestion,
  HyperAgentRole,
  HyperAgentStatus,
  PinnedSkill,
  HyperSkillCategory,
  RubricDimension,
  AgentDeployment
} from './types';

const API_BASE = '/api/v2/hyperagent';

export const hyperAgentService = {
  async createAgent(request: CreateAgentRequest): Promise<HyperAgentIdentity> {
    const response = await api.post(`${API_BASE}/agents`, request);
    return response.data;
  },

  async listAgents(
    role?: HyperAgentRole,
    status?: HyperAgentStatus,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ agents: HyperAgentIdentity[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await api.get(`${API_BASE}/agents?${params.toString()}`);
    return response.data;
  },

  async getAgent(agentId: number): Promise<HyperAgentIdentity> {
    const response = await api.get(`${API_BASE}/agents/${agentId}`);
    return response.data;
  },

  async updateAgent(agentId: number, request: UpdateAgentRequest): Promise<HyperAgentIdentity> {
    const response = await api.patch(`${API_BASE}/agents/${agentId}`, request);
    return response.data;
  },

  async deleteAgent(agentId: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${API_BASE}/agents/${agentId}`);
    return response.data;
  },

  async forkAgent(agentId: number, newName: string): Promise<HyperAgentIdentity> {
    const response = await api.post(`${API_BASE}/agents/${agentId}/fork`, { new_name: newName });
    return response.data;
  },

  async pinSkill(agentId: number, skillId: string, skillName: string, config: Record<string, any> = {}): Promise<{ success: boolean; agent_id: number; skills: PinnedSkill[] }> {
    const response = await api.post(`${API_BASE}/agents/${agentId}/skills`, {
      skill_id: skillId,
      skill_name: skillName,
      config
    });
    return response.data;
  },

  async unpinSkill(agentId: number, skillId: string): Promise<{ success: boolean; agent_id: number; skills_count: number }> {
    const response = await api.delete(`${API_BASE}/agents/${agentId}/skills/${skillId}`);
    return response.data;
  },

  async createSkill(request: CreateSkillRequest): Promise<HyperSkill> {
    const response = await api.post(`${API_BASE}/skills`, request);
    return response.data;
  },

  async listSkills(
    category?: HyperSkillCategory,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ skills: HyperSkill[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await api.get(`${API_BASE}/skills?${params.toString()}`);
    return response.data;
  },

  async getSkill(skillId: number): Promise<HyperSkill> {
    const response = await api.get(`${API_BASE}/skills/${skillId}`);
    return response.data;
  },

  async createRubric(request: CreateRubricRequest): Promise<EvaluationRubric> {
    const response = await api.post(`${API_BASE}/rubrics`, request);
    return response.data;
  },

  async listRubrics(
    agentId?: number,
    limit: number = 100
  ): Promise<{ rubrics: EvaluationRubric[]; total: number }> {
    const params = new URLSearchParams();
    if (agentId) params.append('agent_id', agentId.toString());
    params.append('limit', limit.toString());
    
    const response = await api.get(`${API_BASE}/rubrics?${params.toString()}`);
    return response.data;
  },

  async recordRubricScore(
    rubricId: number,
    agentId: number,
    request: RecordScoreRequest
  ): Promise<RubricScore> {
    const response = await api.post(`${API_BASE}/rubrics/${rubricId}/scores`, {
      ...request,
      agent_id: agentId
    });
    return response.data;
  },

  async getFleetOverview(): Promise<FleetOverview> {
    const response = await api.get(`${API_BASE}/fleet/overview`);
    return response.data;
  },

  async getRoleSummary(role: HyperAgentRole): Promise<RoleDistribution> {
    const response = await api.get(`${API_BASE}/fleet/roles/${role}`);
    return response.data;
  },

  async getAllRolesSummary(): Promise<{ roles: RoleDistribution[]; total_roles_with_agents: number }> {
    const response = await api.get(`${API_BASE}/fleet/roles`);
    return response.data;
  },

  async compareAgents(agentIds: number[], metric: string = 'performance'): Promise<{
    metric: string;
    compared_agents: number;
    rankings: Array<{
      agent_id: number;
      name: string;
      role: string;
      status: string;
      version: number;
      skills_count: number;
      avg_performance: number;
      autonomy_level: string;
    }>;
  }> {
    const response = await api.post(`${API_BASE}/fleet/compare`, {
      agent_ids: agentIds,
      metric
    });
    return response.data;
  },

  async getDeploymentHealth(): Promise<DeploymentHealth> {
    const response = await api.get(`${API_BASE}/fleet/health`);
    return response.data;
  },

  async getOptimizationSuggestions(): Promise<{ suggestions: OptimizationSuggestion[]; count: number }> {
    const response = await api.get(`${API_BASE}/fleet/optimization-suggestions`);
    return response.data;
  },

  async suggestModelDowngrade(
    agentId: number,
    currentModel: string,
    minConsecutiveHighScores: number = 5
  ): Promise<ModelDowngradeSuggestion | null> {
    const response = await api.get(`${API_BASE}/agents/${agentId}/suggest-downgrade`, {
      params: {
        current_model: currentModel,
        min_consecutive: minConsecutiveHighScores
      }
    });
    return response.data;
  }
};

export default hyperAgentService;
