import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface AgentSkill {
  id: number;
  name: string;
  description: string;
  category: string;
  content?: string;
  enabled: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface SkillInstallRequest {
  name: string;
  description: string;
  category?: string;
  content: string;
  metadata?: Record<string, any>;
}

class AgentSkillsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getSkills(includeInternal: boolean = false): Promise<AgentSkill[]> {
    const response = await axios.get(`${API_URL}/api/agent-skills/`, {
      headers: this.getAuthHeaders(),
      params: { include_internal: includeInternal },
    });
    return response.data.skills;
  }

  async getSkill(skillId: number): Promise<AgentSkill> {
    const response = await axios.get(`${API_URL}/api/agent-skills/${skillId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async installSkill(skill: SkillInstallRequest): Promise<{ id: number; name: string; status: string }> {
    const response = await axios.post(`${API_URL}/api/agent-skills/install`, skill, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async toggleSkill(skillId: number, enabled: boolean): Promise<void> {
    await axios.patch(
      `${API_URL}/api/agent-skills/${skillId}/toggle`,
      { enabled },
      { headers: this.getAuthHeaders() }
    );
  }

  async removeSkill(skillId: number): Promise<void> {
    await axios.delete(`${API_URL}/api/agent-skills/${skillId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async syncSkills(): Promise<{ discovered: number; installed: number; updated: number }> {
    const response = await axios.post(`${API_URL}/api/agent-skills/sync`, {}, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getActiveSkillsContent(): Promise<string> {
    const response = await axios.get(`${API_URL}/api/agent-skills/active/content`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.content;
  }
}

export const agentSkillsService = new AgentSkillsService();
