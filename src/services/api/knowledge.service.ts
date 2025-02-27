import { ApiService } from './index';
import { Category, KnowledgeItem, ContentType, UpdateFrequency } from '../../types/knowledge';

const api = ApiService.getInstance().getApi();

export const knowledgeService = {
    // Category Management
    getCategories: () => 
        api.get<Category[]>('/knowledge/categories'),

    createCategory: (data: Partial<Category>) =>
        api.post<Category>('/knowledge/categories', data),

    updateCategory: (id: number, data: Partial<Category>) =>
        api.put<Category>(`/knowledge/categories/${id}`, data),

    deleteCategory: (id: number) =>
        api.delete(`/knowledge/categories/${id}`),

    getCategoryContent: (id: number) =>
        api.get<KnowledgeItem[]>(`/knowledge/categories/${id}/content`),

    // File Upload
    uploadFile: (file: File, categoryId: number) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category_id', categoryId.toString());
        return api.post<KnowledgeItem>('/knowledge/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Text Content
    addTextContent: (text: string, categoryId: number) =>
        api.post<KnowledgeItem>('/knowledge/text', { text, category_id: categoryId }),

    // URL Content
    addUrlContent: (url: string, categoryId: number, updateFrequency: UpdateFrequency) =>
        api.post<KnowledgeItem>('/knowledge/url', {
            url,
            category_id: categoryId,
            update_frequency: updateFrequency
        }),

    // Knowledge Items
    getKnowledgeItems: (categoryId: number) =>
        api.get<KnowledgeItem[]>(`/knowledge/items/${categoryId}`),

    updateKnowledgeItem: (id: number, data: Partial<KnowledgeItem>) =>
        api.put<KnowledgeItem>(`/knowledge/items/${id}`, data),

    deleteKnowledgeItem: (id: number) =>
        api.delete(`/knowledge/items/${id}`)
};
