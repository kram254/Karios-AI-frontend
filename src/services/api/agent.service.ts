import { ApiService } from './index';
import { Agent, AgentConfig, AgentStatus, AgentTestResult, AgentMetrics } from '../../types/agent';

const api = ApiService.getInstance().getApi();

export const agentService = {
    // Agent List Management
    getAgents: () => 
        api.get<Agent[]>('/api/v1/agents/list'),

    getAgentById: (id: string) => 
        api.get<Agent>(`/api/v1/agents/${id}`),

    // Agent Creation and Configuration
    createAgent: (agentData: AgentConfig) =>
        api.post<Agent>('/api/v1/agents/create', agentData),

    updateAgent: (id: string, data: Partial<Agent>) =>
        api.put<Agent>(`/api/v1/agents/${id}`, data),

    updateAgentConfig: (id: number, config: Partial<AgentConfig>) =>
        api.put<Agent>(`/api/v1/agents/${id}/config`, config),

    updateAgentStatus: (id: number, status: AgentStatus) =>
        api.put<Agent>(`/api/v1/agents/${id}/status`, { status }),

    deleteAgent: (id: string) =>
        api.delete(`/api/v1/agents/${id}`),

    // Agent Testing and Monitoring
    getAgentStats: (id: number) =>
        api.get<AgentMetrics>(`/api/v1/agents/${id}/stats`),

    getAgentMetrics: (id: string) =>
        api.get<AgentMetrics>(`/api/v1/agents/${id}/metrics`),

    testAgent: (id: string, input: string) =>
        api.post<AgentTestResult>(`/api/v1/agents/${id}/test`, { input }),

    // Knowledge Base Integration
    assignKnowledge: (agentId: string, knowledgeItemIds: number[]) =>
        api.post(`/api/v1/agents/${agentId}/knowledge`, { knowledge_item_ids: knowledgeItemIds }),

    removeKnowledge: (agentId: number, knowledgeIds: number[]) =>
        api.delete(`/api/v1/agents/${agentId}/knowledge`, { 
            data: { knowledge_ids: knowledgeIds }
        }),

    // Custom Actions
    executeAction: (agentId: number, actionType: string, actionData: any) =>
        api.post(`/api/v1/agents/${agentId}/actions/${actionType}`, actionData),

    // HTML Agent Specific
    updateHtmlConfig: (agentId: number, htmlConfig: {
        embedCode: string;
        styling: string;
        settings: Record<string, any>;
    }) =>
        api.put(`/api/v1/agents/${agentId}/html-config`, htmlConfig),
};
