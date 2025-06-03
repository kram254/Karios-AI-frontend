import axios from 'axios';
import { API_URL } from '../../utils/constants';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: Date | string;
  created_at?: string;
  chat_id?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id?: string;
  type: string;
  url: string;
  name: string;
  content_type?: string;
  preview_url?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at?: string;
  updated_at?: string;
  agent_id?: string;
  language?: string;
}

export const chatService = {
  // Get all chats
  getChats: () => {
    return axios.get(`${API_URL}/chats`);
  },

  // Get a specific chat by ID
  getChat: (chatId: string) => {
    return axios.get(`${API_URL}/chats/${chatId}`);
  },

  // Create a new chat
  createChat: (params: { title?: string; agent_id?: string; chat_type?: string; language?: string }) => {
    return axios.post(`${API_URL}/chats`, params);
  },

  // Update chat title
  updateChatTitle: (chatId: string, title: string) => {
    return axios.patch(`${API_URL}/chats/${chatId}`, { title });
  },

  // Delete a chat
  deleteChat: (chatId: string) => {
    return axios.delete(`${API_URL}/chats/${chatId}`);
  },

  // Add a message to a chat
  addMessage: (chatId: string, message: { content: string; role: string; timestamp?: string }) => {
    return axios.post(`${API_URL}/chats/${chatId}/messages`, message);
  },

  // Get search results
  search: (query: string) => {
    return axios.get(`${API_URL}/search`, { params: { q: query } });
  }
};
