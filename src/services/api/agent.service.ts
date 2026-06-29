import { api } from './index';
import { Agent, AgentConfig, AgentStatus, AgentTestResult, AgentMetrics, AgentRole, AgentMode } from '../../types/agent';

// Define a type for agent creation that matches what the backend expects
interface AgentCreatePayload {
    name: string;
    description?: string;
    ai_role: AgentRole;
    role_description?: string;
    language: string;
    mode: AgentMode;
    response_style: number;
    response_length: number;
    knowledge_item_ids: number[];
    config?: Partial<AgentConfig>;
    actions?: string[];
    skill_ids?: string[];
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

        const skillIdsRaw = (agentData as any).skill_ids ?? (agentData as any).skillIds;
        const skill_ids = Array.isArray(skillIdsRaw)
            ? skillIdsRaw.map((x: any) => String(x)).filter((x: string) => x.trim())
            : (skillIdsRaw ? [String(skillIdsRaw)] : undefined);

        const rawConfig = (agentData as any).config && typeof (agentData as any).config === 'object' ? (agentData as any).config : undefined;
        const allowedConfigKeys = new Set([
            'model',
            'temperature',
            'max_tokens',
            'top_p',
            'knowledge_item_ids',
            'use_agentic_rag',
            'tools_enabled',
            'system_prompt',
            'actions',
            'email_config',
            'search_config',
            'advanced_settings',
            'multi_model_config',
            'selected_template',
            'browser_automation_enabled',
            'max_automation_steps',
            'max_automation_runtime_seconds',
            'allowed_domains',
            'blocked_domains',
            'security_profile',
            'policy_mode',
            'enforce_domain_allowlist',
            'enforce_tools_allowlist',
            'tools_allowlist',
            'tools_blocklist',
            'block_risky_actions',
            'approval_required',
            'planner_type',
            'execution_strategy',
            'validation_required',
            'min_validation_score',
            'semantic_action_memory_enabled',
            'autonomous_tool_synthesis_enabled',
            'adversarial_quality_loop_enabled',
            'visual_consistency_verification_enabled',
            'reactive_environment_masking_enabled',
            'speculative_path_harvesting_enabled',
            'recursive_task_decomposition_enabled',
            'automated_sandbox_provisioning_enabled',
            'knowledge_graph_cross_pollination_enabled',
            'agentic_discourse_debate_enabled'
        ]);

        const sanitizedConfig: Record<string, any> | undefined = rawConfig
            ? Object.fromEntries(Object.entries(rawConfig).filter(([k]) => allowedConfigKeys.has(k)))
            : undefined;

        // Ensure we have the required fields for the backend
        const payload = {
            name: agentData.name || 'New Agent',
            description: (agentData as any).description,
            ai_role: agentData.ai_role || AgentRole.WEB_SCRAPING,
            role_description: (agentData as any).role_description || (agentData as any).custom_role,
            language: agentData.language || 'en',
            mode: agentData.mode || AgentMode.TEXT,
            response_style: typeof agentData.response_style === 'number' ? 
                Math.max(0, Math.min(1, agentData.response_style)) : 0.5, // Ensure between 0 and 1
            response_length: typeof agentData.response_length === 'number' ? 
                Math.max(50, Math.min(500, agentData.response_length)) : 150, // Ensure between 50 and 500
            knowledge_item_ids: Array.isArray(agentData.knowledge_item_ids) ? 
                agentData.knowledge_item_ids.map(id => parseInt(String(id), 10)) :
                (Array.isArray((rawConfig as any)?.knowledge_item_ids) ? (rawConfig as any).knowledge_item_ids.map((id: any) => parseInt(String(id), 10)) : []),
            skill_ids,
            config: sanitizedConfig ? {
                ...sanitizedConfig,
                knowledge_item_ids: Array.isArray((sanitizedConfig as any).knowledge_item_ids)
                    ? (sanitizedConfig as any).knowledge_item_ids.map((id: any) => parseInt(String(id), 10))
                    : undefined,
                actions: Array.isArray((agentData as any).actions)
                    ? (agentData as any).actions
                    : (Array.isArray((sanitizedConfig as any).actions) ? (sanitizedConfig as any).actions : undefined)
            } : (Array.isArray((agentData as any).actions) ? { actions: (agentData as any).actions } : undefined)
        };

        console.log('Final payload being sent:', JSON.stringify(payload, null, 2));
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
