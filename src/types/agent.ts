export enum AgentStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    ERROR = 'ERROR'
}

export interface AgentConfig {
    model: string;
    temperature: number;
    max_tokens: number;
    language: string;
    response_style: string;
    knowledge_base_ids: number[];
}

export interface Agent {
    id: number;
    name: string;
    description: string;
    status: AgentStatus;
    config: AgentConfig;
    created_at: string;
    updated_at: string;
    last_active: string;
    created_by: number;
    updated_by: number;
}

export interface AgentMetrics {
    total_requests: number;
    success_rate: number;
    avg_response_time: number;
    total_tokens: number;
    total_cost: number;
}

export interface AgentTestResult {
    success: boolean;
    response: string;
    tokens_used: number;
    response_time: number;
    error?: string;
}
