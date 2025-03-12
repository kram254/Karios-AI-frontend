import { api } from './index';
import { Agent, AgentConfig, AgentStatus, AgentTestResult, AgentMetrics } from '../../types/agent';

export const agentService = {
    // Agent List Management
    getAgents: () => {
        console.log('Calling getAgents API endpoint: /api/v1/agents');
        return api.get<Agent[]>('/api/v1/agents');
    },

    getAgentById: (id: string) => {
        console.log(`Calling getAgentById API endpoint: /api/v1/agents/${id}`);
        return api.get<Agent>(`/api/v1/agents/${id}`);
    },

    // Agent Creation and Configuration
    createAgent: (agentData: AgentConfig) => {
        console.log('Calling createAgent API endpoint: /api/v1/agents');
        return api.post<Agent>('/api/v1/agents', agentData);
    },

    updateAgent: (id: string, data: Partial<Agent>) => {
        console.log(`Calling updateAgent API endpoint: /api/v1/agents/${id}`);
        return api.put<Agent>(`/api/v1/agents/${id}`, data);
    },

    updateAgentConfig: (id: string, config: Partial<AgentConfig>) => {
        console.log(`Calling updateAgentConfig API endpoint: /api/v1/agents/${id}/config`);
        return api.put<Agent>(`/api/v1/agents/${id}/config`, config);
    },

    updateAgentStatus: (id: string, status: AgentStatus) => {
        console.log(`Calling updateAgentStatus API endpoint: /api/v1/agents/${id}/status`);
        return api.put<Agent>(`/api/v1/agents/${id}/status`, { status });
    },

    deleteAgent: (id: string) => {
        console.log(`Calling deleteAgent API endpoint: /api/v1/agents/${id}`);
        return api.delete(`/api/v1/agents/${id}`);
    },

    // Agent Testing and Monitoring
    getAgentStats: (id: string) => {
        console.log(`Calling getAgentStats API endpoint: /api/v1/agents/${id}/stats`);
        return api.get<AgentMetrics>(`/api/v1/agents/${id}/stats`);
    },

    getAgentMetrics: (id: string) => {
        console.log(`Calling getAgentMetrics API endpoint: /api/v1/agents/${id}/metrics`);
        return api.get<AgentMetrics>(`/api/v1/agents/${id}/metrics`);
    },

    testAgent: (id: string, input: string) => {
        console.log(`Calling testAgent API endpoint: /api/v1/agents/${id}/test`);
        return api.post<AgentTestResult>(`/api/v1/agents/${id}/test`, { input });
    },

    // Knowledge Base Integration
    assignKnowledge: (agentId: string, knowledgeItemIds: number[]) => {
        console.log(`Calling assignKnowledge API endpoint: /api/v1/agents/${agentId}/knowledge`);
        return api.post(`/api/v1/agents/${agentId}/knowledge`, { knowledge_item_ids: knowledgeItemIds });
    },

    removeKnowledge: (agentId: string, knowledgeIds: number[]) => {
        console.log(`Calling removeKnowledge API endpoint: /api/v1/agents/${agentId}/knowledge`);
        return api.delete(`/api/v1/agents/${agentId}/knowledge`, { 
            data: { knowledge_ids: knowledgeIds }
        });
    },

    // Custom Actions
    executeAction: (agentId: string, actionType: string, actionData: any) => {
        console.log(`Calling executeAction API endpoint: /api/v1/agents/${agentId}/actions/${actionType}`);
        return api.post(`/api/v1/agents/${agentId}/actions/${actionType}`, actionData);
    },

    // HTML Agent Specific
    updateHtmlConfig: (agentId: string, htmlConfig: {
        embedCode: string;
        styling: string;
        settings: Record<string, any>;
    }) => {
        console.log(`Calling updateHtmlConfig API endpoint: /api/v1/agents/${agentId}/html-config`);
        return api.put(`/api/v1/agents/${agentId}/html-config`, htmlConfig);
    },
};
