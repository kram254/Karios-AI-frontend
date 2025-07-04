import { api } from './index';
import { ContextState } from './context.service';

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
  isSearchResult?: boolean;
  metadata?: string | Record<string, any>;
  timestamp?: string;
  contextQuality?: number;
  contextState?: string;
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

// Export chatService object to fix the build error
export interface ContextEnrichedResponse {
  content: string;
  contextState: ContextState;
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
  
  addMessage: (chatId: string, content: string | ChatMessage | { content: string; role: 'user' | 'assistant' | 'system'; suppressAiResponse?: boolean; searchModeActive?: boolean }) => {
    console.log(`Adding message to chat ${chatId}`);
    // Match the structure used in the WebSocket service
    let payload;
    
    // Extract search mode flag if present
    const searchModeActive = typeof content === 'object' && 'searchModeActive' in content ? content.searchModeActive : false;
    
    if (typeof content === 'string') {
      // If just a string is passed, assume it's user content
      payload = { 
        content: content,
        attachments: [],
        role: 'user', // Default to user role for backward compatibility
        suppress_ai_response: false, // Default behavior - generate AI response
        search_only_mode: false
      };
    } else {
      // If an object is passed, extract the necessary properties
      const suppressAiResponse = 'suppressAiResponse' in content ? content.suppressAiResponse : false;
      
      payload = {
        content: content.content,
        attachments: 'attachments' in content ? content.attachments || [] : [],
        // Always include the role to ensure proper persistence
        role: content.role,
        // Add suppress_ai_response flag if provided (for internet search mode)
        suppress_ai_response: suppressAiResponse,
        // Add search_only_mode flag for enhanced directive handling
        search_only_mode: searchModeActive,
        // Add directive to avoid disclaimers when in search mode
        system_directive: searchModeActive ? 
          "Provide only search results. Never generate disclaimers about future events, knowledge cutoff, or AI limitations." : 
          undefined
      };
    }
    
    console.log(`Message payload with role=${payload.role}, suppress_ai_response=${payload.suppress_ai_response}, search_mode=${searchModeActive}`);
    return api.post<ChatMessage>(`/api/chat/chats/${chatId}/messages`, payload);
  },
  
  addMessageWithAttachments: async (
    chatId: string, 
    content: string, 
    attachments: Attachment[], 
    { suppressAiResponse = false, searchModeActive = false } = {}
  ) => {
    console.log(`Adding message with ${attachments.length} attachments to chat ${chatId}${suppressAiResponse ? ' (AI response suppressed)' : ''}`);
    
    // Create a payload with the message content, attachments and suppress flag
    const payload = {
      content,
      attachments,
      role: 'user',
      suppress_ai_response: suppressAiResponse,
      search_only_mode: searchModeActive,
      // Add directive to avoid disclaimers when in search mode
      system_directive: searchModeActive ? 
        "Provide only search results. Never generate disclaimers about future events, knowledge cutoff, or AI limitations." : 
        undefined
    };
    
    console.log(`🔄 [chat.service] Adding message with attachments, searchModeActive=${searchModeActive}, suppressAiResponse=${suppressAiResponse}`);
    return api.post(`/api/chat/chats/${chatId}/messages`, payload);
  },

  // Agent and Knowledge Integration
  chatWithAgent: (agentId: number | string, input: string) => {
    console.log(`Chatting with agent ${agentId} with input: ${input}`);
    return api.post(`/api/v1/agents/${agentId}/chat`, { input });
  },
  
  queryWithKnowledge: (chatId: string, input: string, categories: number[]) => {
    console.log(`Querying with knowledge for chat ${chatId} with categories: ${categories.join(', ')}`);
    return api.post(`/api/chat/chats/${chatId}/query`, {
      query: input,
      category_ids: categories.length > 0 ? categories : undefined
    });
  },

  // Context-aware message processing
  addContextEnrichedMessage(chatId: string, content: string, enableContext: boolean = true) {
    return api.post(`/api/chat/chats/${chatId}/context-message`, {
      content,
      enable_context: enableContext
    });
  },

  // Get context-enriched response with quality metrics
  getContextEnrichedResponse(chatId: string, input: string, includeContextDetails: boolean = true) {
    return api.post<ContextEnrichedResponse>(`/api/chat/chats/${chatId}/context-response`, {
      content: input,
      include_context_details: includeContextDetails
    });
  },

  // Get context information for a specific message
  getMessageContext(chatId: string, messageId: string) {
    return api.get(`/api/chat/chats/${chatId}/messages/${messageId}/context`);
  },

  // Get context state for the entire chat session
  getChatContextState(chatId: string) {
    return api.get(`/api/chat/chats/${chatId}/context-state`);
  },

  // Add feedback about context quality for specific message
  addContextFeedback(chatId: string, messageId: string, feedback: { helpful: boolean; comments?: string }) {
    return api.post(`/api/chat/chats/${chatId}/messages/${messageId}/context-feedback`, feedback);
  },

  // Get context summary statistics for all chats
  getContextAnalytics() {
    return api.get(`/api/chat/context-analytics`);
  },
};
