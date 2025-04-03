import axios from 'axios';
import { AgentRole } from '../types/agent';

const API_URL = '/api/v1';

export interface AgentCreateRequest {
  name: string;
  ai_role: AgentRole;
  description?: string;
  role_description?: string;
  model?: string;
  response_style?: number;
  response_length?: number;
}

export interface AgentUpdateRequest {
  name?: string;
  description?: string;
  ai_role?: AgentRole;
  role_description?: string;
  model?: string;
  response_style?: number;
  response_length?: number;
}

export const agentService = {
  getAgents: async () => {
    return await axios.get(`${API_URL}/agents`);
  },

  getAgent: async (id: string) => {
    return await axios.get(`${API_URL}/agents/${id}`);
  },

  createAgent: async (agent: AgentCreateRequest) => {
    return await axios.post(`${API_URL}/agents`, agent);
  },

  updateAgent: async (id: string, agent: AgentUpdateRequest) => {
    return await axios.put(`${API_URL}/agents/${id}`, agent);
  },

  deleteAgent: async (id: string) => {
    return await axios.delete(`${API_URL}/agents/${id}`);
  },

  getAgentMetrics: async (id: string) => {
    return await axios.get(`${API_URL}/agents/${id}/metrics`);
  },
};
