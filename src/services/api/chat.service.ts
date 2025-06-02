import { api } from './index';

// Define interfaces for chat-related data
export interface Attachment {
  id?: string;
  type: string;
  url: string;
  name: string;
  content_type?: string;
  preview_url?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  attachments?: Attachment[];
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
  agent_id?: string;
  language?: string;
}

export interface ChatTitleUpdate {
  title: string;
}

export interface MessageCreate {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentChatCreate {
  agent_id: string;
  title?: string;
}

export const chatService = {
  // Chat Management
  getChats: () => {
    console.log('Calling getChats API endpoint: /api/chat/chats');
    return api.get<Chat[]>('/api/chat/chats');
  },
  
  createChat: (chatData: ChatCreate = {}) => {
    console.log(`Creating new chat with title: ${chatData.title || 'New Chat'} and type: ${chatData.chat_type || 'default'}`);
    return api.post<Chat>('/api/chat/chats', chatData);
  },
  
  createAgentChat: (agentChatData: AgentChatCreate) => {
    console.log(`Creating new agent chat with agent ID: ${agentChatData.agent_id}`);
    return api.post<Chat>('/api/chat/chats', {
      title: agentChatData.title || 'Agent Chat',
      chat_type: 'agent_chat',  
      agent_id: agentChatData.agent_id,
      language: 'en' 
    }).catch(error => {
      console.error('Error creating agent chat:', error.response || error);
      throw error; 
    });
  },
  
  getChat: (chatId: string) => {
    console.log(`Getting chat with ID: ${chatId}`);
    return api.get<Chat>(`/api/chat/chats/${chatId}`);
  },
  
  updateChat: (chatId: string, data: Partial<Chat>) => {
    console.log(`Updating chat ${chatId}`);
    return api.put<Chat>(`/api/chat/chats/${chatId}`, data);
  },
  
  deleteChat: (chatId: string) => {
    console.log(`Deleting chat with ID: ${chatId}`);
    return api.delete(`/api/chat/chats/${chatId}`);
  },
  
  updateChatTitle: (chatId: string, title: string) => {
    console.log(`Updating title for chat ${chatId} to: ${title}`);
    return api.put(`/api/chat/chats/${chatId}/title`, { title });
  },
  
  // Message Management
  getMessages: (chatId: string) => {
    console.log(`Getting messages for chat ${chatId}`);
    return api.get<ChatMessage[]>(`/api/chat/chats/${chatId}/messages`);
  },
  
  createMessage: (chatId: string, messageData: MessageCreate) => {
    console.log(`Creating message in chat ${chatId}`);
    // Match the structure used in the WebSocket service
    const payload = { 
      content: messageData.content,
      attachments: []
    };
    console.log('Message payload:', payload);
    return api.post<ChatMessage>(`/api/chat/chats/${chatId}/messages`, payload);
  },
  
  updateMessage: (chatId: string, messageId: string, data: Partial<ChatMessage>) => {
    console.log(`Updating message ${messageId} in chat ${chatId}`);
    return api.put<ChatMessage>(`/api/chat/chats/${chatId}/messages/${messageId}`, data);
  },
  
  deleteMessage: (chatId: string, messageId: string) => {
    console.log(`Deleting message ${messageId} from chat ${chatId}`);
    return api.delete(`/api/chat/chats/${chatId}/messages/${messageId}`);
  },
  
  addMessage: (chatId: string, content: string | ChatMessage | { content: string; role: 'user' | 'assistant' | 'system' }) => {
    console.log(`Adding message to chat ${chatId}`);
    // Match the structure used in the WebSocket service
    let payload;
    
    if (typeof content === 'string') {
      // If just a string is passed, assume it's user content
      payload = { 
        content: content,
        attachments: [],
        role: 'user' // Default to user role for backward compatibility
      };
    } else {
      // If an object is passed, extract the necessary properties
      payload = {
        content: content.content,
        attachments: 'attachments' in content ? content.attachments || [] : [],
        // Always include the role to ensure proper persistence
        role: content.role
      };
    }
    
    console.log('Message payload with role:', payload);
    return api.post<ChatMessage>(`/api/chat/chats/${chatId}/messages`, payload);
  },
  
  // Upload and send message with image attachments
  addMessageWithAttachments: (chatId: string, content: string, attachments: Attachment[]) => {
    console.log(`Adding message with ${attachments.length} attachments to chat ${chatId}`);
    
    // Create a payload with the message content and attachments
    const payload = {
      content: content,
      attachments: attachments
    };
    
    console.log('Message with attachments payload:', payload);
    return api.post<Chat>(`/api/chat/chats/${chatId}/messages`, payload);
  },
  
  // Chat Actions
  clearChatHistory: (chatId: string) => {
    console.log(`Clearing history for chat ${chatId}`);
    return api.post(`/api/chat/chats/${chatId}/clear`);
  },
  
  regenerateResponse: (chatId: string, messageId: string) => {
    console.log(`Regenerating response for message ${messageId} in chat ${chatId}`);
    return api.post<ChatMessage>(`/api/chat/chats/${chatId}/regenerate/${messageId}`);
  },
  
  // Chat Query
  queryChat: (chatId: string, query: string, options: any = {}) => {
    console.log(`Querying chat ${chatId} with: ${query}`);
    const payload = {
      query,
      ...options
    };
    return api.post<ChatMessage>(`/api/chat/chats/${chatId}/query`, payload);
  },
  
  queryWithKnowledge: (chatId: string, query: string, categoryIds?: number[]) => {
    console.log(`Querying chat ${chatId} with knowledge categories`);
    const payload = {
      query,
      category_ids: categoryIds
    };
    return api.post<ChatMessage>(`/api/chat/chats/${chatId}/query`, payload);
  },

  // Agent-specific chat
  chatWithAgent: (agentId: number, message: string) => {
    console.log(`Chatting with agent ${agentId}`);
    return api.post<ChatMessage>(`/api/v1/chat/agents/${agentId}/chat`, { message });
  },

  // Chat Status
  getChatStatus: (chatId: string) => {
    console.log(`Getting status for chat ${chatId}`);
    return api.get<{ status: string }>(`/api/chat/chats/${chatId}/status`);
  },
    
  // Debug info
  getDebugInfo: () => {
    return {
      baseUrl: api.defaults.baseURL,
      headers: api.defaults.headers
    };
  }
};

export default chatService;
