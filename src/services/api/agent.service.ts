import { ApiService } from './index';
import { Agent, AgentConfig, AgentStatus, AgentTestResult, AgentMetrics } from '../../types/agent';

const api = ApiService.getInstance().getApi();

export const agentService = {
    // Agent List Management
    getAgents: () => 
        api.get<Agent[]>('/agents/list'),

    // Agent Creation and Configuration
    createAgent: (config: AgentConfig) =>
        api.post<Agent>('/agents/create', config),

    updateAgentConfig: (id: number, config: Partial<AgentConfig>) =>
        api.put<Agent>(`/agents/${id}/config`, config),

    updateAgentStatus: (id: number, status: AgentStatus) =>
        api.put<Agent>(`/agents/${id}/status`, { status }),

    // Agent Testing and Monitoring
    getAgentStats: (id: number) =>
        api.get<AgentMetrics>(`/agents/${id}/stats`),

    testAgent: (id: number, input: string) =>
        api.post<AgentTestResult>(`/agents/${id}/test`, { input }),

    // Knowledge Base Integration
    assignKnowledge: (agentId: number, knowledgeIds: number[]) =>
        api.post(`/agents/${agentId}/knowledge`, { knowledge_ids: knowledgeIds }),

    removeKnowledge: (agentId: number, knowledgeIds: number[]) =>
        api.delete(`/agents/${agentId}/knowledge`, { 
            data: { knowledge_ids: knowledgeIds }
        }),

    // Custom Actions
    executeAction: (agentId: number, actionType: string, actionData: any) =>
        api.post(`/agents/${agentId}/actions/${actionType}`, actionData),

    // HTML Agent Specific
    updateHtmlConfig: (agentId: number, htmlConfig: {
        embedCode: string;
        styling: string;
        settings: Record<string, any>;
    }) =>
        api.put(`/agents/${agentId}/html-config`, htmlConfig),
};
