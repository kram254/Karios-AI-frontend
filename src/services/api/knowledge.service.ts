import { ApiService } from './index';
import { Category, KnowledgeItem, ContentType, UpdateFrequency } from '../../types/knowledge';

const api = ApiService.getInstance().getApi();

export const knowledgeService = {
    // Category Management
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

    // File Upload
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

    // Text Content
    addTextContent: (text: string, categoryId: number) =>
        api.post<KnowledgeItem>('/api/v1/knowledge/text', { text, category_id: categoryId }),

    // URL Content
    addUrlContent: (url: string, categoryId: number, updateFrequency: UpdateFrequency) =>
        api.post<KnowledgeItem>('/api/v1/knowledge/url', {
            url,
            category_id: categoryId,
            update_frequency: updateFrequency
        }),

    // Knowledge Items
    getKnowledgeItems: (categoryId: number) =>
        api.get<KnowledgeItem[]>(`/api/v1/knowledge/items/${categoryId}`),

    updateKnowledgeItem: (id: number, data: Partial<KnowledgeItem>) =>
        api.put<KnowledgeItem>(`/api/v1/knowledge/items/${id}`, data),

    deleteKnowledgeItem: (id: number) =>
        api.delete(`/api/v1/knowledge/items/${id}`)
};
