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
        api.get<Category[]>('/categories'),

    getCategoryById: (id: number) => 
        api.get<Category>(`/categories/${id}`),

    createCategory: (data: CategoryCreate) => 
        api.post<Category>('/categories', data),

    updateCategory: (id: number, data: CategoryUpdate) => 
        api.put<Category>(`/categories/${id}`, data),

    deleteCategory: (id: number) => 
        api.delete(`/categories/${id}`),

    // Category Items
    getCategoryItems: (categoryId: number) => 
        api.get(`/categories/${categoryId}/items`),

    // File Upload
    uploadFile: (categoryId: number, file: File, formData?: any) => {
        const data = new FormData();
        data.append('file', file);
        
        if (formData) {
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
        }
        
        return api.post(`/categories/${categoryId}/upload`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // URL Management
    addUrl: (categoryId: number, url: string, description?: string) => 
        api.post(`/categories/${categoryId}/url`, { url, description }),

    // Text Content
    addTextContent: (categoryId: number, content: string, title: string) => 
        api.post(`/categories/${categoryId}/text`, { content, title }),

    deleteKnowledgeItem: (id: number) => api.delete(`/knowledge/${id}`),
};
