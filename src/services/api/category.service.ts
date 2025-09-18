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
        api.get(`/api/v1/knowledge/items/${categoryId}`),

    getKnowledgeItemsByCategory: (categoryId: number) => 
        api.get(`/api/v1/knowledge/items/${categoryId}`),

    // File Upload
    uploadFile: (categoryId: number, file: File, formData?: any) => {
        const data = new FormData();
        data.append('file', file);
        
        // We need to ensure we're passing exactly what the backend expects
        // Add title and description (backend requires these fields)
        if (formData && formData.description) {
            data.append('title', formData.description);
            data.append('description', formData.description);
        } else {
            data.append('title', file.name);
            data.append('description', `Uploaded file: ${file.name}`);
        }
        
        // Include content type and update frequency (required by backend)
        data.append('content_type', 'file');
        data.append('update_frequency', 'never');
        
        // Add metadata if present
        if (formData) {
            data.append('metadata', JSON.stringify({
                description: formData.description || file.name
            }));
        }
        
        console.log('Uploading file with data:', {
            categoryId,
            fileName: file.name,
            fileSize: file.size,
            formData: formData
        });
        
        // Use the same endpoint pattern as text and url uploads
        return api.post(`/api/v1/knowledge/categories/${categoryId}/file`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // URL Management
    addUrl: (
        categoryId: number, 
        url: string, 
        description?: string, 
        updateFrequency: string = 'never',
        maxDepth: number = 2,
        extractCodeExamples: boolean = true,
        knowledgeType: string = 'technical'
    ) => 
        api.post(`/api/v1/knowledge/categories/${categoryId}/url`, { 
            url, 
            description, 
            content_type: 'url',
            update_frequency: updateFrequency,
            max_depth: maxDepth,
            extract_code_examples: extractCodeExamples,
            knowledge_type: knowledgeType
        }),

    // Text Content
    addTextContent: (categoryId: number, content: string, title: string, updateFrequency: string = 'never') => 
        api.post(`/api/v1/knowledge/categories/${categoryId}/text`, { 
            content, 
            title, 
            content_type: 'text',
            update_frequency: updateFrequency 
        }),

    deleteKnowledgeItem: (id: number) => api.delete(`/api/v1/knowledge/items/${id}`),
    
    // Get a specific knowledge item by ID
    getKnowledgeItem: (id: number) => api.get(`/api/v1/knowledge/item/${id}`),
};
