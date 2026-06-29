import { KnowledgeItem } from './knowledge';

export enum AgentStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
    TEST = 'test',
    MAINTENANCE = 'maintenance'
}

export enum AgentRole {
    // Sales Agents
    SALES_LEAD_QUALIFIER = 'sales_lead_qualifier',
    SALES_OUTREACH = 'sales_outreach',
    SALES_DEMO_SCHEDULER = 'sales_demo_scheduler',
    SALES_PROPOSAL_GENERATOR = 'sales_proposal_generator',
    SALES_COMPETITOR_INTEL = 'sales_competitor_intel',

    // Support Agents
    SUPPORT_TICKET_TRIAGE = 'support_ticket_triage',
    SUPPORT_FAQ_RESPONDER = 'support_faq_responder',
    SUPPORT_TECHNICAL = 'support_technical',
    SUPPORT_SENTIMENT_MONITOR = 'support_sentiment_monitor',
    SUPPORT_FEEDBACK_COLLECTOR = 'support_feedback_collector',

    // Research Agents
    DEEP_RESEARCH = 'deep_research',
    RESEARCH_MARKET_INTEL = 'research_market_intel',
    RESEARCH_ACADEMIC = 'research_academic',
    RESEARCH_PATENT = 'research_patent',
    RESEARCH_NEWS_MONITOR = 'research_news_monitor',

    // Code Agents
    CODE_REVIEWER = 'code_reviewer',
    CODE_GENERATOR = 'code_generator',
    CODE_DEBUGGER = 'code_debugger',
    CODE_DOCUMENTATION = 'code_documentation',
    CODE_TEST_GENERATOR = 'code_test_generator',
    QA_AUTOMATED_TESTER = 'testing_qa',
    TESTING_QA = 'testing_qa',

    // Data Agents
    DATA_ANALYSIS = 'data_analysis',
    DATA_ETL = 'data_etl',
    DATA_QUALITY = 'data_quality',
    DATA_VISUALIZATION = 'data_visualization',
    DATA_SQL_ASSISTANT = 'data_sql_assistant',

    // Content Agents
    CONTENT_CREATION = 'content_creation',
    CONTENT_SOCIAL_MEDIA = 'content_social_media',
    CONTENT_EMAIL_MARKETING = 'content_email_marketing',
    CONTENT_SEO = 'content_seo',
    CONTENT_VIDEO_SCRIPT = 'content_video_script',

    // Web Automation Agents
    WEB_SCRAPING = 'web_scraping',
    WEB_AUTOMATION = 'web_automation',
    WEB_MONITOR = 'web_monitor',
    WEB_TESTING = 'web_testing',
    WEB_API_INTEGRATION = 'web_api_integration',

    // Task & Workflow Agents
    TASK_AUTOMATION = 'task_automation',
    WORKFLOW_AUTOMATION = 'workflow_automation',
    OPS_SCHEDULING = 'ops_scheduling',

    // Communication Agents
    EMAIL_AUTOMATION = 'email_automation',
    MEETING_ASSISTANT = 'meeting_assistant',
    PERSONAL_ASSISTANT = 'personal_assistant',

    // Document Agents
    DOCUMENT_PROCESSING = 'document_processing',
    CONTRACT_REVIEW = 'contract_review',
    LEGAL_RESEARCH = 'legal_research',

    // Custom
    CUSTOM = 'custom'
}

export enum AgentMode {
    TEXT = 'text',
    AUDIO = 'audio',
    VIDEO = 'video'
}

// Action type constants
export const SEND_MAIL = 'SEND_MAIL';
export const SEARCH_INTERNET = 'SEARCH_INTERNET';
export const EXECUTE_CODE = 'EXECUTE_CODE';

export interface ActionType {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    config?: any;
}

export interface EmailConfig {
    email?: string;
    verified?: boolean;
    smtp_host?: string;
    smtp_port?: number;
    smtp_username?: string;
    smtp_password?: string;
    use_tls?: boolean;
    verification_code?: string;
    verification_expires?: string;
}

export interface SearchConfig {
    search_depth?: 'quick' | 'standard' | 'comprehensive';
    max_sources?: number;
    enable_browser_automation?: boolean;
    result_filtering?: 'basic' | 'advanced';
    fact_checking?: boolean;
}

export interface ModelConfig {
    provider: 'openai' | 'anthropic' | 'google' | 'custom';
    model_id: string;
    display_name: string;
    cost_per_1k_input?: number;
    cost_per_1k_output?: number;
    max_context?: number;
    capabilities?: string[];
}

export interface AdvancedModelSettings {
    frequency_penalty?: number;
    presence_penalty?: number;
    top_k?: number;
    stop_sequences?: string[];
    response_format?: 'text' | 'json' | 'markdown';
    seed?: number;
}

export interface MultiModelConfig {
    enabled: boolean;
    routing_rules?: {
        condition: 'complexity' | 'cost' | 'type' | 'custom';
        threshold?: number;
        model_id: string;
        description?: string;
    }[];
    fallback_model?: string;
}

export interface ParameterRecommendation {
    parameter: string;
    current_value: number | string;
    recommended_value: number | string;
    reason: string;
    impact: 'cost' | 'quality' | 'speed' | 'accuracy';
    confidence: number;
}

export interface AgentTemplate {
    id: string;
    name: string;
    category: string;
    description: string;
    icon: string;
    config: Partial<AgentConfig>;
    performance_metrics?: {
        avg_satisfaction: number;
        avg_cost_per_request: number;
        avg_response_time: number;
    };
    use_cases: string[];
    popularity: number;
}

export interface AgentConfig {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    language: string;
    mode: AgentMode;
    response_style: number;
    response_length: number;
    knowledge_item_ids?: number[];
    actions?: string[];
    system_prompt?: string;
    webhook_url?: string;
    additional_context?: string;
    email_config?: EmailConfig;
    search_config?: SearchConfig;
    advanced_settings?: AdvancedModelSettings;
    multi_model_config?: MultiModelConfig;
    selected_template?: string;
    allowed_domains?: string[];
    blocked_domains?: string[];
    security_profile?: 'standard' | 'regulated' | 'high_security' | string;
    policy_mode?: 'log_only' | 'enforce' | string;
    enforce_domain_allowlist?: boolean;
    enforce_tools_allowlist?: boolean;
    tools_allowlist?: string[];
    tools_blocklist?: string[];
    block_risky_actions?: boolean;
    approval_required?: boolean;
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
    skills?: { id: string; name: string }[];
    skill_ids?: string[];
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
