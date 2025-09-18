import { ApiService } from './index';

const api = ApiService.getInstance().getApi();

export interface ProgressUpdate {
    progressId: string;
    percentage: number;
    status: string;
    message: string;
    currentUrl?: string;
    processedPages?: number;
    totalPages?: number;
    chunksStored?: number;
    wordCount?: number;
    codeExamplesCount?: number;
    error?: string;
}

export const progressService = {
    getProgress: (progressId: string) => 
        api.get<ProgressUpdate>(`/api/progress/${progressId}`),

    cancelCrawl: (progressId: string) => 
        api.post(`/api/progress/${progressId}/cancel`),

    getKnowledgeMetrics: () => 
        api.get('/knowledge/metrics'),

    getKnowledgeSummary: (page: number = 1, perPage: number = 20, knowledgeType?: string, search?: string) => 
        api.get('/knowledge/items/summary', {
            params: { page, per_page: perPage, knowledge_type: knowledgeType, search }
        })
};
