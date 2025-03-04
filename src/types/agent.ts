export enum AgentStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    ERROR = 'ERROR'
}

export enum AgentRole {
    CUSTOMER_SUPPORT = 'Customer Support',
    TECHNICAL_SUPPORT = 'Technical Support',
    SALES_SERVICES = 'Sales Services',
    CONSULTING = 'Consulting Services'
}

export enum AgentMode {
    TEXT = 'text',
    AUDIO = 'audio',
    VIDEO = 'video'
}

export interface ActionType {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
}

export interface AgentConfig {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    language: string;
    mode: AgentMode;
    response_style: number; // 0-1 scale, 0 = formal, 1 = casual
    response_length: number;
    knowledge_item_ids?: number[];
    actions?: string[];
    system_prompt?: string;
    webhook_url?: string;
    additional_context?: string;
}

export interface Agent {
    id: number;
    name: string;
    description: string;
    status: AgentStatus;
    ai_role: AgentRole;
    config: AgentConfig;
    category_id?: number;
    created_at: string;
    updated_at: string;
    last_active: string;
    created_by: number;
    updated_by: number;
    usage_statistics?: AgentMetrics;
}

export interface AgentMetrics {
    total_requests: number;
    success_rate: number;
    avg_response_time: number;
    total_tokens: number;
    total_cost: number;
    daily_usage?: {
        date: string;
        requests: number;
        tokens: number;
    }[];
    error_rate?: number;
    avg_conversation_length?: number;
}

export interface AgentTestResult {
    success: boolean;
    response: string;
    tokens_used: number;
    response_time: number;
    error?: string;
    sources?: {
        knowledge_id: number;
        content_snippet: string;
        relevance_score: number;
    }[];
}

export interface AgentDeployment {
    id: number;
    agent_id: number;
    deployment_type: 'website' | 'api' | 'mobile';
    config: {
        embed_code?: string;
        api_key?: string;
        webhook_url?: string;
        custom_css?: string;
        branding?: {
            logo_url?: string;
            primary_color?: string;
            secondary_color?: string;
            font_family?: string;
        };
    };
    status: 'active' | 'inactive' | 'pending';
    created_at: string;
    updated_at: string;
}

export interface AgentTrainingLog {
    id: number;
    agent_id: number;
    timestamp: string;
    action: 'knowledge_base_update' | 'config_change' | 'retraining';
    details: string;
    status: 'success' | 'failed' | 'in_progress';
    error?: string;
}
