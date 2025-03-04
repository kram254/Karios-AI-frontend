import { ApiService } from './index';
import { AxiosResponse } from 'axios';

// Define interfaces for chat-related data
export interface ChatMessage {
  id?: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatCreate {
  title?: string;
}

export interface ChatTitleUpdate {
  title: string;
}

export interface SystemMessageUpdate {
  message: string;
}

const api = ApiService.getInstance().getApi();

export const chatService = {
  // Chat Management
  createChat: (chatData: ChatCreate = {}) => 
    api.post<Chat>('/chats', chatData),

  getAllChats: () => 
    api.get<Chat[]>('/chats'),

  getChat: (chatId: string) => 
    api.get<Chat>(`/chats/${chatId}`),

  updateChatTitle: (chatId: string, titleData: ChatTitleUpdate) => 
    api.put<Chat>(`/chats/${chatId}/title`, titleData),

  deleteChat: (chatId: string) => 
    api.delete(`/chats/${chatId}`),

  // Message Management
  addMessage: (chatId: string, message: ChatMessage) => 
    api.post<Chat>(`/chats/${chatId}/messages`, message),

  // WebSocket connection helpers
  getWebSocketUrl: () => {
    const baseUrl = api.defaults.baseURL || '';
    // Replace http/https with ws/wss
    const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
    return `${wsBaseUrl}/ws/chat`;
  },

  // System message management
  getSystemMessage: () => 
    api.get<SystemMessageUpdate>('/chats/system-message'),

  updateSystemMessage: (message: SystemMessageUpdate) => 
    api.put<void>('/chats/system-message', message),

  // Knowledge-enhanced chat
  queryWithKnowledge: (query: string, categoryIds?: number[]) => 
    api.post<{response: string}>('/retrieve', { 
      query,
      category_ids: categoryIds 
    }),

  // Agent-specific chat
  chatWithAgent: (agentId: number, message: string) => 
    api.post<{response: string}>(`/agents/${agentId}/chat`, { message }),

  // Chat Status
  getChatStatus: () => 
    api.get<{status: string}>('/chats/status')
};

export default chatService;
