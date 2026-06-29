import { ApiService } from './index';
import { 
    Category, KnowledgeItem, ContentType, UpdateFrequency, WikiPageType,
    KnowledgeChunk, ChunkingStrategy, SearchMode,
    HybridSearchResult, EntityNode, EntityRelationship,
    SyncEvent, ConversationSummary, MemoryItem,
    QualityScore, CurationWorkflow, QualityAlert,
    InlineComment, EditSuggestion,
    KnowledgeAnalyticsOverview, KnowledgeGap, UsageHeatmap, OptimizationRecommendation
} from '../../types/knowledge';

const api = ApiService.getInstance().getApi();

export const knowledgeService = {
    getCategories: () => 
        api.get<Category[]>('/api/v1/knowledge/categories'),

    createCategory: (data: Partial<Category>) =>
        api.post<Category>('/api/v1/knowledge/categories', data),

    updateCategory: (id: number, data: Partial<Category>) =>
        api.put<Category>(`/api/v1/knowledge/categories/${id}`, data),

    deleteCategory: (id: number) =>
        api.delete(`/api/v1/knowledge/categories/${id}`),

    getCategoryContent: (id: number) =>
        api.get<KnowledgeItem[]>(`/api/v1/knowledge/categories/${id}/content`),

    uploadFile: (file: File, categoryId: number) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category_id', categoryId.toString());
        formData.append('title', file.name);
        formData.append('description', `Uploaded file: ${file.name}`);
        formData.append('content_type', 'file');
        formData.append('update_frequency', 'never');
        
        console.log('Knowledge service uploading file:', {
            fileName: file.name,
            fileSize: file.size,
            categoryId
        });
        
        return api.post<KnowledgeItem>('/api/v1/knowledge/categories/' + categoryId + '/file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    addTextContent: (text: string, categoryId: number) =>
        api.post<KnowledgeItem>('/api/v1/knowledge/text', { text, category_id: categoryId }),

    addUrlContent: (url: string, categoryId: number, updateFrequency: UpdateFrequency) =>
        api.post<KnowledgeItem>('/api/v1/knowledge/url', {
            url,
            category_id: categoryId,
            update_frequency: updateFrequency
        }),

    getKnowledgeItems: (categoryId: number) =>
        api.get<KnowledgeItem[]>(`/api/v1/knowledge/items/${categoryId}`),

    updateKnowledgeItem: (id: number, data: Partial<KnowledgeItem>) =>
        api.put<KnowledgeItem>(`/api/v1/knowledge/items/${id}`, data),

    deleteKnowledgeItem: (id: number) =>
        api.delete(`/api/v1/knowledge/items/${id}`),

    rechunkItem: (itemId: number, strategy: ChunkingStrategy = ChunkingStrategy.SEMANTIC, chunkSize: number = 1000, chunkOverlap: number = 200) =>
        api.post<KnowledgeChunk[]>(`/api/v1/knowledge/items/${itemId}/rechunk`, null, {
            params: { strategy, chunk_size: chunkSize, chunk_overlap: chunkOverlap }
        }),

    getChunks: (itemId: number) =>
        api.get<KnowledgeChunk[]>(`/api/v1/knowledge/items/${itemId}/chunks`),

    hybridSearch: (query: string, searchMode: SearchMode = SearchMode.HYBRID, categoryIds?: number[], limit: number = 10, scoreThreshold: number = 0.0) =>
        api.post<HybridSearchResult[]>('/api/v1/knowledge/search/hybrid', null, {
            params: { query, search_mode: searchMode, category_ids: categoryIds?.join(','), limit, score_threshold: scoreThreshold }
        }),

    getEntities: (knowledgeItemId?: number) =>
        api.get<EntityNode[]>('/api/v1/knowledge/graph/entities', {
            params: knowledgeItemId ? { knowledge_item_id: knowledgeItemId } : {}
        }),

    extractEntities: (itemId: number) =>
        api.post<EntityNode[]>(`/api/v1/knowledge/graph/entities/extract/${itemId}`),

    createRelationship: (sourceEntityId: string, targetEntityId: string, relationshipType: string, confidence: number = 1.0) =>
        api.post<EntityRelationship>('/api/v1/knowledge/graph/relationships', null, {
            params: { source_entity_id: sourceEntityId, target_entity_id: targetEntityId, relationship_type: relationshipType, confidence }
        }),

    syncItem: (itemId: number, force: boolean = false) =>
        api.post<SyncEvent>(`/api/v1/knowledge/items/${itemId}/sync`, null, {
            params: { force }
        }),

    getSyncStatus: (knowledgeItemId?: number) =>
        api.get('/api/v1/knowledge/sync/status', {
            params: knowledgeItemId ? { knowledge_item_id: knowledgeItemId } : {}
        }),

    getSyncHistory: (itemId: number) =>
        api.get<SyncEvent[]>(`/api/v1/knowledge/sync/history/${itemId}`),

    summarizeSession: (sessionId: string, messages: { role: string; content: string }[], agentId?: number) =>
        api.post<ConversationSummary>(`/api/v1/knowledge/memory/sessions/${sessionId}/summarize`, { messages, agent_id: agentId }),

    getUserFacts: (userId: string) =>
        api.get<MemoryItem[]>(`/api/v1/knowledge/memory/users/${userId}/facts`),

    extractFacts: (conversationId: string, messages: { role: string; content: string }[], userId: string) =>
        api.post<MemoryItem[]>('/api/v1/knowledge/memory/extract-facts', { messages }, {
            params: { conversation_id: conversationId, user_id: userId }
        }),

    getQualityScore: (itemId: number) =>
        api.get<QualityScore>(`/api/v1/knowledge/items/${itemId}/quality-score`),

    submitForReview: (knowledgeItemId: number, assignedReviewerId?: number) =>
        api.post<CurationWorkflow>('/api/v1/knowledge/curation/submit-for-review', null, {
            params: { knowledge_item_id: knowledgeItemId, assigned_reviewer_id: assignedReviewerId }
        }),

    approveCuration: (workflowId: string, approve: boolean, reviewNotes?: string) =>
        api.put<CurationWorkflow>(`/api/v1/knowledge/curation/${workflowId}/approve`, null, {
            params: { approve, review_notes: reviewNotes }
        }),

    getQualityAlerts: (knowledgeItemId?: number) =>
        api.get<QualityAlert[]>('/api/v1/knowledge/quality/alerts', {
            params: knowledgeItemId ? { knowledge_item_id: knowledgeItemId } : {}
        }),

    getAnalyticsOverview: (periodDays: number = 30) =>
        api.get<KnowledgeAnalyticsOverview>('/api/v1/knowledge/analytics/overview', {
            params: { period_days: periodDays }
        }),

    getKnowledgeGaps: () =>
        api.get<KnowledgeGap[]>('/api/v1/knowledge/analytics/gaps'),

    getUsageHeatmap: (itemId: number) =>
        api.get<UsageHeatmap>(`/api/v1/knowledge/analytics/usage-heatmap/${itemId}`),

    getRecommendations: () =>
        api.get<OptimizationRecommendation[]>('/api/v1/knowledge/analytics/recommendations'),

    addComment: (itemId: number, anchorStart: number, anchorEnd: number, content: string, parentCommentId?: number) =>
        api.post<InlineComment>(`/api/v1/knowledge/items/${itemId}/comments`, null, {
            params: { anchor_start: anchorStart, anchor_end: anchorEnd, content, parent_comment_id: parentCommentId }
        }),

    addSuggestion: (itemId: number, originalText: string, suggestedText: string) =>
        api.post<EditSuggestion>(`/api/v1/knowledge/items/${itemId}/suggestions`, null, {
            params: { original_text: originalText, suggested_text: suggestedText }
        }),

    reviewSuggestion: (suggestionId: string, accept: boolean, reviewerNotes?: string) =>
        api.put<EditSuggestion>(`/api/v1/knowledge/suggestions/${suggestionId}/review`, null, {
            params: { accept, reviewer_notes: reviewerNotes }
        }),

    transcribeContent: (itemId: number, language?: string) =>
        api.post(`/api/v1/knowledge/items/${itemId}/transcribe`, null, {
            params: language ? { language } : {}
        }),

    ocrContent: (itemId: number, language?: string) =>
        api.post(`/api/v1/knowledge/items/${itemId}/ocr`, null, {
            params: language ? { language } : {}
        }),

    describeVisual: (itemId: number, detailLevel: string = 'medium') =>
        api.post(`/api/v1/knowledge/items/${itemId}/describe-visual`, null, {
            params: { detail_level: detailLevel }
        }),

    getWikiPages: (pageType?: WikiPageType) =>
        api.get<KnowledgeItem[]>('/api/v1/knowledge/wiki/pages', {
            params: pageType ? { page_type: pageType } : {}
        }),

    searchWiki: (query: string, topK: number = 5) =>
        api.get<{ results: Array<{ id: number; title?: string; score: number; preview: string; page_type?: string }> }>('/api/v1/knowledge/wiki/search', {
            params: { query, top_k: topK }
        }),

    getWikiIndex: () =>
        api.get<KnowledgeItem>('/api/v1/knowledge/wiki/index'),

    regenerateWikiIndex: () =>
        api.post<{ message: string }>('/api/v1/knowledge/wiki/regenerate-index'),

    lintWiki: () =>
        api.get<{
            orphan_pages: Array<{ id: number; title?: string }>;
            stale_pages: Array<{ id: number; title?: string }>;
            contradictions: string[];
            suggested_pages: string[];
        }>('/api/v1/knowledge/wiki/lint'),

    generateWikiForSource: (knowledgeItemId: number) =>
        api.post<{ success: boolean; results?: any; error?: string }>(`/api/v1/knowledge/wiki/generate/${knowledgeItemId}`),

    wikiFirstSearch: (query: string, keywords?: string, topK: number = 5) =>
        api.post<{ results: Array<{
            id: number;
            content: string;
            vector_score: number;
            keyword_score: number;
            hybrid_score: number;
            metadata: Record<string, any>;
            full_item: Record<string, any>;
        }> }>('/api/v1/knowledge/search/wiki-first', {
            query,
            keywords,
            top_k: topK
        }),

    runWikiMaintenance: () =>
        api.post<{
            lint: {
                orphan_pages: Array<{ id: number; title?: string }>;
                stale_pages: Array<{ id: number; title?: string }>;
                contradictions: string[];
                suggested_pages: string[];
            };
            index_updated: boolean;
            pages_refreshed: number[];
            errors: string[];
        }>('/api/v1/knowledge/wiki/maintenance')
};
