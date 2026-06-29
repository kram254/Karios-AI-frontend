export enum ContentType {
    FILE = 'file',
    TEXT = 'text',
    URL = 'url',
    IMAGE = 'image',
    AUDIO = 'audio',
    VIDEO = 'video',
    STRUCTURED_DATA = 'structured_data',
    WIKI = 'wiki'
}

export enum WikiPageType {
    INDEX = 'index',
    ENTITY = 'entity',
    TOPIC = 'topic',
    SOURCE_SUMMARY = 'source_summary',
    COMPARISON = 'comparison',
    LOG = 'log'
}

export interface WikiMetadata {
    page_type: WikiPageType;
    parent_sources: number[];
    related_wiki_pages: number[];
    auto_generated: boolean;
    last_linted_at?: string;
    contradiction_flags?: string[];
}

export enum UpdateFrequency {
    NEVER = 'never',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    HOURLY = 'hourly',
    QUARTERLY = 'quarterly',
    MANUAL = 'manual'
}

export enum ProcessingStatus {
    QUEUED = 'queued',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    READY = 'ready'
}

export enum ChunkingStrategy {
    FIXED = 'fixed',
    SEMANTIC = 'semantic',
    DOCUMENT_STRUCTURE = 'document_structure',
    RECURSIVE = 'recursive',
    CONTEXTUAL_LLM = 'contextual_llm'
}

export enum SearchMode {
    VECTOR = 'vector',
    KEYWORD = 'keyword',
    GRAPH = 'graph',
    HYBRID = 'hybrid'
}

export enum SyncStatus {
    SYNCED = 'synced',
    PENDING = 'pending',
    SYNCING = 'syncing',
    CONFLICT = 'conflict',
    ERROR = 'error'
}

export enum CurationStatus {
    DRAFT = 'draft',
    PENDING_REVIEW = 'pending_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    ARCHIVED = 'archived'
}

export enum MemoryType {
    SESSION = 'session',
    USER = 'user',
    AGENT = 'agent',
    GLOBAL = 'global'
}

export enum EditPermission {
    VIEW = 'view',
    COMMENT = 'comment',
    SUGGEST = 'suggest',
    EDIT = 'edit',
    ADMIN = 'admin'
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

export interface ChunkMetadata {
    chunk_id: string;
    parent_document_id: number;
    chunk_index: number;
    total_chunks: number;
    token_count: number;
    semantic_score: number;
    heading_context: string[];
    source_page?: number;
    source_section?: string;
}

export interface KnowledgeChunk extends ChunkMetadata {
    content: string;
    chunking_strategy: ChunkingStrategy;
    created_at: string;
    updated_at: string;
}

export interface RechunkRequest {
    strategy: ChunkingStrategy;
    chunk_size: number;
    chunk_overlap: number;
    preserve_structure: boolean;
}

export interface EntityNode {
    entity_id: string;
    name: string;
    entity_type: string;
    properties: Record<string, any>;
    knowledge_item_id?: number;
    created_at: string;
    updated_at: string;
}

export interface EntityRelationship {
    id: number;
    source_entity_id: string;
    target_entity_id: string;
    relationship_type: string;
    confidence: number;
    temporal_valid_from?: string;
    temporal_valid_to?: string;
    properties: Record<string, any>;
    created_at: string;
}

export interface HybridSearchRequest {
    query: string;
    search_mode: SearchMode;
    category_ids?: number[];
    agent_id?: number;
    filters?: Record<string, any>;
    limit: number;
    score_threshold: number;
    include_entities: boolean;
    include_relationships: boolean;
}

export interface HybridSearchResult {
    item_id: number;
    chunk_id?: string;
    content: string;
    vector_score: number;
    keyword_score: number;
    graph_score: number;
    fused_score: number;
    matched_entities: EntityNode[];
    relationship_path: EntityRelationship[];
    metadata: Record<string, any>;
}

export interface SyncConfig {
    id: number;
    knowledge_item_id: number;
    source_type: string;
    polling_interval_minutes?: number;
    webhook_url?: string;
    auth_config: Record<string, any>;
    change_detection_method: string;
    last_sync_at?: string;
    next_sync_at?: string;
    sync_status: SyncStatus;
    created_at: string;
    updated_at: string;
}

export interface SyncEvent {
    event_id: string;
    knowledge_item_id: number;
    event_type: string;
    previous_hash?: string;
    new_hash: string;
    changes_detected: number;
    chunks_affected: number;
    sync_details: Record<string, any>;
    created_at: string;
}

export interface MetadataFilter {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';
    value: any;
    llm_description?: string;
}

export interface FilterExpression {
    type: 'and' | 'or' | 'not';
    conditions: (MetadataFilter | FilterExpression)[];
}

export interface RetrievalContext {
    agent_id?: number;
    agent_role?: string;
    user_id?: number;
    conversation_id?: string;
    active_filters?: FilterExpression;
    query_rewrite_enabled: boolean;
    chunk_limit: number;
    score_threshold: number;
}

export interface MemoryConfig {
    max_turns: number;
    summarization_enabled: boolean;
    summarization_threshold_tokens: number;
    fact_extraction_enabled: boolean;
    retention_days?: number;
}

export interface ConversationSummary {
    summary_id: string;
    conversation_id: string;
    agent_id?: number;
    user_id?: number;
    summary_text: string;
    key_facts: string[];
    entities_mentioned: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    turn_count: number;
    created_at: string;
}

export interface MemoryItem {
    memory_id: string;
    memory_type: MemoryType;
    owner_id: string;
    conversation_id?: string;
    content: string;
    importance_score: number;
    access_count: number;
    last_accessed?: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;
}

export interface QualityScore {
    knowledge_item_id: number;
    overall: number;
    freshness: number;
    accuracy: number;
    completeness: number;
    usage_relevance: number;
    last_evaluated: string;
}

export interface CurationWorkflow {
    workflow_id: string;
    knowledge_item_id: number;
    curation_status: CurationStatus;
    assigned_reviewer_id?: number;
    review_notes?: string;
    quality_issues: string[];
    created_at: string;
    reviewed_at?: string;
}

export interface QualityAlert {
    alert_id: string;
    knowledge_item_id: number;
    alert_type: 'stale' | 'conflicting' | 'low_usage' | 'negative_feedback' | 'broken_link';
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggested_action?: string;
    is_resolved: boolean;
    resolved_at?: string;
    created_at: string;
}

export interface InlineComment {
    comment_id: string;
    knowledge_item_id: number;
    anchor_start: number;
    anchor_end: number;
    content: string;
    author_id: number;
    parent_comment_id?: number;
    is_resolved: boolean;
    created_at: string;
    updated_at: string;
    replies: InlineComment[];
}

export interface EditSuggestion {
    suggestion_id: string;
    knowledge_item_id: number;
    original_text: string;
    suggested_text: string;
    author_id: number;
    suggestion_status: 'pending' | 'accepted' | 'rejected';
    reviewer_notes?: string;
    created_at: string;
    reviewed_at?: string;
}

export interface CollaboratorPresence {
    user_id: number;
    user_name: string;
    avatar_url?: string;
    cursor_position?: number;
    last_active: string;
}

export interface KnowledgeAnalyticsOverview {
    total_items: number;
    total_queries: number;
    successful_retrievals: number;
    failed_retrievals: number;
    average_relevance_score: number;
    cost_per_query: number;
    period_start: string;
    period_end: string;
}

export interface KnowledgeGap {
    gap_id: string;
    query_pattern: string;
    occurrence_count: number;
    sample_queries: string[];
    suggested_topics: string[];
    priority: 'low' | 'medium' | 'high';
    is_addressed: boolean;
    addressed_by_item_id?: number;
    created_at: string;
    updated_at: string;
}

export interface UsageHeatmap {
    item_id: number;
    daily_usage: { date: string; count: number }[];
    peak_hours: number[];
    user_segments: { segment: string; percentage: number }[];
}

export interface OptimizationRecommendation {
    id: string;
    type: 'merge_duplicates' | 'archive_stale' | 'improve_chunking' | 'add_metadata' | 'fill_gap';
    description: string;
    affected_items: number[];
    estimated_impact: string;
    effort: 'low' | 'medium' | 'high';
}

export interface ImageMetadata {
    knowledge_item_id: number;
    ocr_text?: string;
    visual_description?: string;
    detected_objects: string[];
    width?: number;
    height?: number;
    created_at: string;
}

export interface AudioVideoMetadata {
    knowledge_item_id: number;
    duration_seconds: number;
    transcript?: string;
    transcript_segments: { start: number; end: number; text: string }[];
    speakers: string[];
    language?: string;
    created_at: string;
}

export interface StructuredDataMetadata {
    knowledge_item_id: number;
    schema_definition: Record<string, string>;
    row_count: number;
    column_count: number;
    sample_rows: Record<string, any>[];
    created_at: string;
}

export interface ChunkingSettings {
    default_strategy: ChunkingStrategy;
    default_chunk_size: number;
    default_chunk_overlap: number;
    preserve_document_structure: boolean;
    semantic_similarity_threshold: number;
}
