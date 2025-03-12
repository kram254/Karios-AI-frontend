import { api } from './index';

// Define interfaces for chat-related data
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
  agent_id?: string;
}

export interface ChatCreate {
  title?: string;
  chat_type?: string;
}

export interface ChatTitleUpdate {
  title: string;
}

export interface MessageCreate {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const chatService = {
  // Chat Management
  getChats: () => 
    api.get<Chat[]>('/api/chat/chats'),
  
  createChat: (chatData: ChatCreate = {}) => 
    api.post<Chat>('/api/chat/chats', chatData),
  
  getChat: (chatId: string) => 
    api.get<Chat>(`/api/chat/chats/${chatId}`),
  
  updateChat: (chatId: string, data: Partial<Chat>) => 
    api.put<Chat>(`/api/chat/chats/${chatId}`, data),
  
  deleteChat: (chatId: string) => 
    api.delete(`/api/chat/chats/${chatId}`),
  
  // Message Management
  getMessages: (chatId: string) => 
    api.get<ChatMessage[]>(`/api/chat/chats/${chatId}/messages`),
  
  createMessage: (chatId: string, messageData: MessageCreate) => 
    api.post<ChatMessage>(`/api/chat/chats/${chatId}/messages`, messageData),
  
  updateMessage: (chatId: string, messageId: string, data: Partial<ChatMessage>) => 
    api.put<ChatMessage>(`/api/chat/chats/${chatId}/messages/${messageId}`, data),
  
  deleteMessage: (chatId: string, messageId: string) => 
    api.delete(`/api/chat/chats/${chatId}/messages/${messageId}`),
  
  // Chat Actions
  clearChatHistory: (chatId: string) => 
    api.post(`/api/chat/chats/${chatId}/clear`),
  
  regenerateResponse: (chatId: string, messageId: string) => 
    api.post(`/api/chat/chats/${chatId}/messages/${messageId}/regenerate`),
  
  // Agent Integration
  assignAgent: (chatId: string, agentId: string) => 
    api.post(`/api/chat/chats/${chatId}/agent`, { agent_id: agentId }),
  
  removeAgent: (chatId: string) => 
    api.delete(`/api/chat/chats/${chatId}/agent`),
  
  // Chat Settings
  updateChatSettings: (chatId: string, settings: Record<string, any>) => 
    api.put(`/api/chat/chats/${chatId}/settings`, settings),
  
  // Export/Import
  exportChat: (chatId: string) => 
    api.get(`/api/chat/chats/${chatId}/export`),
  
  importChat: (data: any) => 
    api.post('/api/chat/chats/import', data),

  // WebSocket connection helpers
  getWebSocketUrl: () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/chat/ws`;
  },

  // System message management
  getSystemMessage: (chatId: string) => 
    api.get<ChatMessage>(`/api/chat/chats/${chatId}/system-message`),

  updateSystemMessage: (chatId: string, message: { message: string }) => 
    api.put<ChatMessage>(`/api/chat/chats/${chatId}/system-message`, message),

  // Knowledge-enhanced chat
  queryWithKnowledge: (chatId: string, query: string, categoryIds?: number[]) => {
    const payload = categoryIds ? { query, category_ids: categoryIds } : { query };
    return api.post<ChatMessage>(`/api/chat/chats/${chatId}/query`, payload);
  },

  // Agent-specific chat
  chatWithAgent: (agentId: number, message: string) => 
    api.post<ChatMessage>(`/api/chat/agents/${agentId}/chat`, { message }),

  // Chat Status
  getChatStatus: (chatId: string) => 
    api.get<{ status: string }>(`/api/chat/chats/${chatId}/status`),
    
  // Add the missing methods
  addMessage: (chatId: string, messageData: MessageCreate) => 
    api.post<Chat>(`/api/chat/chats/${chatId}/messages`, messageData),
    
  updateChatTitle: (chatId: string, title: string) => 
    api.put<Chat>(`/api/chat/chats/${chatId}/title`, { title })
};

export default chatService;
