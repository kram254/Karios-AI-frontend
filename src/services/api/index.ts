import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Backend API URL

export class ApiService {
    private static instance: ApiService;
    private api: AxiosInstance;

    private constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true, // Handle CORS
        });

        this.api.interceptors.request.use(
            (config) => {
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        this.api.interceptors.response.use(
            (response) => response,
            async (error) => {
                console.error('API Error:', error);
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
    public async getAllChats() {
        return this.api.get('/api/chat/chats');
    }

    public async createChat(title: string = "New Chat") {
        return this.api.post('/api/chat/chats', { title });
    }

    public async getChat(chatId: string) {
        return this.api.get(`/api/chat/chats/${chatId}`);
    }

    public async deleteChat(chatId: string) {
        return this.api.delete(`/api/chat/chats/${chatId}`);
    }

    public async updateChatTitle(chatId: string, title: string) {
        return this.api.put(`/api/chat/chats/${chatId}/title`, { title });
    }

    public async sendMessage(chatId: string, content: string) {
        return this.api.post(`/api/chat/chats/${chatId}/messages`, { 
            role: "user", 
            content 
        });
    }

    // Agent Methods
    public async getAllAgents() {
        return this.api.get('/api/admin/agents');
    }

    public async createAgent(data: any) {
        return this.api.post('/api/admin/agents', data);
    }

    public async updateAgent(agentId: string, data: any) {
        return this.api.put(`/api/admin/agents/${agentId}`, data);
    }

    public async deleteAgent(agentId: string) {
        return this.api.delete(`/api/admin/agents/${agentId}`);
    }
}
