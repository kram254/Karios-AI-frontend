export enum ContentType {
    FILE = 'file',
    TEXT = 'text',
    URL = 'url'
}

export enum UpdateFrequency {
    NEVER = 'never',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly'
}

export enum ProcessingStatus {
    QUEUED = 'queued',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    READY = 'ready'
}

export interface Category {
    id: number;
    name: string;
    description: string;
    parent_id?: number;
    item_count?: number;
    created_at: string;
    updated_at: string;
    created_by?: number;
    knowledge_items?: KnowledgeItem[];
}

export interface KnowledgeItem {
    id: number;
    category_id: number;
    title?: string;
    content_type: ContentType;
    content?: string;
    file_path?: string;
    file_name?: string;
    file_size?: number;
    file_type?: string;
    url?: string;
    update_frequency: UpdateFrequency;
    processing_status?: ProcessingStatus;
    metadata: Record<string, any>;
    tags?: string[];
    created_at: string;
    updated_at: string;
    created_by?: number;
    relevant_agents?: number[];
}

export interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
}

export interface KnowledgeItemSearchParams {
    categoryId?: number;
    query?: string;
    contentType?: ContentType;
    tags?: string[];
    processingStatus?: ProcessingStatus;
    page?: number;
    pageSize?: number;
}

export interface KnowledgeItemAnalytics {
    usage_count: number;
    last_used: string;
    relevance_score: number;
    agent_usage: {
        agent_id: number;
        agent_name: string;
        usage_count: number;
    }[];
}
