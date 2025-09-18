import { ApiService } from './index';

const api = ApiService.getInstance().getApi();

export interface SearchFilters {
    knowledgeType?: string;
    sourceType?: string;
    tags?: string[];
    dateRange?: {
        start: string;
        end: string;
    };
    hasCodeExamples?: boolean;
    minWordCount?: number;
    maxWordCount?: number;
}

export interface SearchResult {
    id: number;
    title: string;
    url?: string;
    excerpt: string;
    score: number;
    sourceType: string;
    knowledgeType: string;
    wordCount: number;
    codeExamplesCount: number;
    chunksCount: number;
    lastUpdated: string;
    metadata: any;
}

export interface SearchResponse {
    results: SearchResult[];
    total: number;
    page: number;
    perPage: number;
    facets: {
        knowledgeTypes: Array<{ value: string; count: number }>;
        sourceTypes: Array<{ value: string; count: number }>;
        tags: Array<{ value: string; count: number }>;
    };
}

export const searchService = {
    searchKnowledge: (
        query: string, 
        filters?: SearchFilters, 
        page: number = 1, 
        perPage: number = 20
    ) => 
        api.post<SearchResponse>('/knowledge/search', {
            query,
            filters,
            page,
            per_page: perPage
        }),

    searchCodeExamples: (
        query: string, 
        language?: string, 
        page: number = 1, 
        perPage: number = 10
    ) => 
        api.post('/knowledge/search/code', {
            query,
            language,
            page,
            per_page: perPage
        }),

    getSimilarItems: (itemId: number, limit: number = 5) =>
        api.get(`/knowledge/items/${itemId}/similar`, {
            params: { limit }
        }),

    getSearchSuggestions: (query: string) =>
        api.get('/knowledge/search/suggestions', {
            params: { query }
        }),

    getSearchFacets: () =>
        api.get('/knowledge/search/facets')
};
