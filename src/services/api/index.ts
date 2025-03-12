import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Endpoints } from '../../config/endpoints';

export class ApiService {
    private static instance: ApiService;
    private api: AxiosInstance = axios.create(); // Initialize with a default instance

    private constructor() {
        const baseURL = Endpoints.API_BASE_URL;
        
        this.api = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        // Add a development token for authentication bypass
        const devToken = 'fake_token_for_development';
        localStorage.setItem('token', devToken);
        this.api.defaults.headers.common['Authorization'] = `Bearer ${devToken}`;
        
        // Add response interceptor
        this.api.interceptors.response.use(
            response => response,
            error => {
                // Handle 401 errors without redirecting
                if (error.response && error.response.status === 401) {
                    console.error('Authentication error:', error);
                    // Don't redirect, just log the error
                }
                return Promise.reject(error);
            }
        );
    }

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    public getApi(): AxiosInstance {
        return this.api;
    }

    // Chat Methods - Updated to use correct backend API endpoints
    public async getChats(): Promise<AxiosResponse> {
        return this.api.get('/api/v1/chat/chats');
    }

    public async createChat(title: string = "New Chat", chat_type: string = "default"): Promise<AxiosResponse> {
        return this.api.post('/api/v1/chat/chats', { title, chat_type });
    }

    public async getChat(chatId: string): Promise<AxiosResponse> {
        return this.api.get(`/api/v1/chat/chats/${chatId}`);
    }

    public async deleteChat(chatId: string): Promise<AxiosResponse> {
        return this.api.delete(`/api/v1/chat/chats/${chatId}`);
    }

    public async updateChatTitle(chatId: string, title: string): Promise<AxiosResponse> {
        return this.api.put(`/api/v1/chat/chats/${chatId}/title`, { title });
    }

    public async sendMessage(chatId: string, message: string): Promise<AxiosResponse> {
        return this.api.post(`/api/v1/chat/chats/${chatId}/messages`, { content: message });
    }

    // Agent Methods
    public async getAllAgents(): Promise<AxiosResponse> {
        return this.api.get('/api/admin/agents');
    }

    public async createAgent(data: any): Promise<AxiosResponse> {
        return this.api.post('/api/admin/agents', data);
    }

    public async updateAgent(agentId: string, data: any): Promise<AxiosResponse> {
        return this.api.put(`/api/admin/agents/${agentId}`, data);
    }

    public async deleteAgent(agentId: string): Promise<AxiosResponse> {
        return this.api.delete(`/api/admin/agents/${agentId}`);
    }
}

// Create a singleton instance of the API service
const apiService = ApiService.getInstance();
const api = apiService.getApi();

export { api };
