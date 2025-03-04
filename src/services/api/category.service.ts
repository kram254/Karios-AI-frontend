import { ApiService } from './index';
import { Category } from '../../types/knowledge';

// Define the interfaces here since they're not in the knowledge.ts file
interface CategoryCreate {
    name: string;
    description: string;
    parent_id?: number;
}

interface CategoryUpdate {
    name?: string;
    description?: string;
    parent_id?: number;
}

const api = ApiService.getInstance().getApi();

export const categoryService = {
    // Category Management
    getCategories: () => 
        api.get<Category[]>('/api/v1/knowledge/categories'),

    getCategoryById: (id: number) => 
        api.get<Category>(`/api/v1/knowledge/categories/${id}`),

    createCategory: (data: CategoryCreate) => 
        api.post<Category>('/api/v1/knowledge/categories', data),

    updateCategory: (id: number, data: CategoryUpdate) => 
        api.put<Category>(`/api/v1/knowledge/categories/${id}`, data),

    deleteCategory: (id: number) => 
        api.delete(`/api/v1/knowledge/categories/${id}`),

    // Category Items
    getCategoryItems: (categoryId: number) => 
        api.get(`/api/v1/knowledge/categories/${categoryId}/items`),

    // File Upload
    uploadFile: (categoryId: number, file: File, formData?: any) => {
        const data = new FormData();
        data.append('file', file);
        
        if (formData) {
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
        }
        
        return api.post(`/api/v1/knowledge/categories/${categoryId}/upload`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // URL Management
    addUrl: (categoryId: number, url: string, description?: string) => 
        api.post(`/api/v1/knowledge/categories/${categoryId}/url`, { url, description }),

    // Text Content
    addTextContent: (categoryId: number, content: string, title: string) => 
        api.post(`/api/v1/knowledge/categories/${categoryId}/text`, { content, title }),

    deleteKnowledgeItem: (id: number) => api.delete(`/api/v1/knowledge/items/${id}`),
};
