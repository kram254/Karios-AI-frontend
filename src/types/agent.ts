import { KnowledgeItem } from './knowledge';

export enum AgentStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
    TEST = 'test',
    MAINTENANCE = 'maintenance'
}

export enum AgentRole {
    CUSTOMER_SUPPORT = 'customer_support',
    TECHNICAL_SUPPORT = 'technical_support',
    SALES_SERVICES = 'sales_services',
    CONSULTING = 'consulting',
    SALES_ASSISTANT = 'sales_assistant',
    CUSTOM = 'custom'
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
    description?: string;
    role_description?: string; // For storing custom role descriptions
    ai_role: AgentRole;
    custom_role?: string;
    owner_id: number;
    status: AgentStatus;
    language: string;
    mode: AgentMode;
    response_style: number;
    response_length: number;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    config?: AgentConfig;
    knowledge_items?: KnowledgeItem[];
    actions?: string[];
    behavior?: {
        tone: string;
        personality: string;
    };
    role_config?: {
        custom_fields?: {
            [key: string]: string;
        };
    };
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
