export enum ContentType {
    FILE = 'FILE',
    TEXT = 'TEXT',
    URL = 'URL'
}

export enum UpdateFrequency {
    NEVER = 'NEVER',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY'
}

export interface Category {
    id: number;
    name: string;
    description: string;
    parent_id?: number;
    created_at: string;
    updated_at: string;
}

export interface KnowledgeItem {
    id: number;
    category_id: number;
    content_type: ContentType;
    content?: string;
    file_path?: string;
    url?: string;
    update_frequency: UpdateFrequency;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
}
