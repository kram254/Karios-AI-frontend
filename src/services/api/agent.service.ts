import { api } from './index';
import { Agent, AgentConfig, AgentStatus, AgentTestResult, AgentMetrics, AgentRole, AgentMode } from '../../types/agent';

// Define a type for agent creation that matches what the backend expects
interface AgentCreatePayload {
    name: string;
    ai_role: AgentRole;
    language: string;
    mode: AgentMode;
    response_style: number;
    response_length: number;
    knowledge_item_ids: number[];
    config?: {
        tools_enabled?: string[];
    };
}

export const agentService = {
    // Agent List Management
    getAgents: () => {
        console.log('Calling getAgents API endpoint: /api/v1/agents/list');
        return api.get<Agent[]>('/api/v1/agents/list');
    },

    getAgentById: (id: string) => {
        console.log(`Calling getAgentById API endpoint: /api/v1/agents/${id}`);
        return api.get<Agent>(`/api/v1/agents/${id}`);
    },

    // Agent Creation and Configuration
    createAgent: (agentData: Partial<AgentCreatePayload>) => {
        console.log('Calling createAgent API endpoint: /api/v1/agents/create');
        console.log('Agent data being sent:', JSON.stringify(agentData, null, 2));
        
        // Ensure we have the required fields for the backend
        const payload = {
            name: agentData.name || 'New Agent',
            ai_role: agentData.ai_role || AgentRole.CUSTOMER_SUPPORT,
            language: agentData.language || 'en',
            mode: agentData.mode || AgentMode.TEXT,
            response_style: agentData.response_style !== undefined ? agentData.response_style : 0.5,
            response_length: agentData.response_length || 150,
            knowledge_item_ids: agentData.knowledge_item_ids || [],
            config: {
                tools_enabled: agentData.config?.tools_enabled || []
            }
        };
        
        return api.post<Agent>('/api/v1/agents/create', payload);
    },

    updateAgent: (id: string, data: Partial<Agent>) => {
        console.log(`Calling updateAgent API endpoint: /api/v1/agents/${id}/config`);
        return api.put<Agent>(`/api/v1/agents/${id}/config`, data);
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
        const params = new URLSearchParams();
        knowledgeIds.forEach(id => params.append('knowledge_id', id.toString()));
        return api.delete(`/api/v1/agents/${agentId}/knowledge?${params.toString()}`);
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
    }
};
