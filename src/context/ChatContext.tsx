import React, { createContext, useContext, useState, useEffect } from 'react';
import { chatService } from '../services/api/chat.service';
import toast from 'react-hot-toast';
import { generateTitleFromMessage } from '../utils/titleGenerator';
import { Agent } from '../types/agent';
import { useLanguage } from './LanguageContext';

interface Attachment {
  id?: string;
  type: string;
  url: string;
  name: string;
  content_type?: string;
  preview_url?: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: Date | string;
  created_at?: string;
  chat_id?: string;
  attachments?: Attachment[];
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  created_at?: string; // For backend compatibility
  updated_at?: string; // For backend compatibility
  agent_id?: string; // Add agent_id to Chat interface
  language?: string; // Add language property to Chat interface
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface ChatContextType {
  currentChat: Chat | null;
  chats: Chat[];
  loading: boolean;
  error: string | null;
  createNewChat: (customTitle?: string) => Promise<Chat | null>;
  createAgentChat: () => Promise<Chat | null>; // Update createAgentChat method
  setCurrentChat: (chat: Chat) => void;
  addMessage: (message: { role: 'user' | 'assistant' | 'system'; content: string }) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  selectedAgent: Agent | null; // Add selectedAgent state
  setSelectedAgent: (agent: Agent | null) => void; // Add setSelectedAgent method
  // Search-related properties and methods
  isSearchMode: boolean;
  toggleSearchMode: () => void;
  searchResults: SearchResult[];
  performSearch: (query: string) => Promise<void>;
  isSearching: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null); // Initialize selectedAgent state
  const { language } = useLanguage(); // Get the current language
  
  // Search-related state
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatService.getChats();
      console.log('Chats loaded:', response.data);
      setChats(response.data);
      
      // Don't automatically set the first chat as current to allow welcome screen to show
      // Only uncomment this if you want to auto-load the first chat
      // if (response.data.length > 0 && !currentChat) {
      //   setCurrentChat(response.data[0]);
      // }
      
      setError(null);
    } catch (err: unknown) {
      console.error('Error loading chats:', err);
      console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
      setError('Failed to load chats');
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async (customTitle?: string) => {
    try {
      setLoading(true);
      console.log('Attempting to create a new chat...');
      const response = await chatService.createChat({
        title: customTitle || 'New Conversation',
        chat_type: 'default',
        language: language.code // Include the selected language
      });
      console.log('Chat created response:', response);
      
      const newChat = response.data;
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      
      toast.success('New chat created');
      setError(null);
      return newChat;
    } catch (err: unknown) {
      console.error('Error creating chat:', err);
      console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
      setError('Failed to create chat');
      toast.error('Failed to create chat');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createAgentChat = async () => {
    if (!selectedAgent) {
      console.error('');
      toast.error('');
      return null;
    }

    try {
      setLoading(true);
      console.log(`Creating a new chat with agent ${selectedAgent.id}...`);
      const response = await chatService.createChat({
        agent_id: selectedAgent.id.toString(),
        title: `Chat with ${selectedAgent.name}`,
        chat_type: 'sales_agent',
        language: selectedAgent.language || language.code
      });
      console.log('Agent chat created response:', response);
      
      const newChat = response.data;
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      
      toast.success(`Chat with ${selectedAgent.name} created`);
      setError(null);
      return newChat;
    } catch (err: unknown) {
      console.error('Error creating agent chat:', err);
      console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
      setError('Failed to create agent chat');
      toast.error('Failed to create agent chat');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add this function to get the chat's language or default to app language
  const getChatLanguage = (chat: Chat | null) => {
    if (chat && chat.language) {
      return chat.language;
    }
    return language.code;
  };

  const addMessage = async ({ role, content }: { role: 'user' | 'assistant' | 'system'; content: string }) => {
    if (!currentChat) {
      try {
        await createNewChat();
      } catch (err: unknown) {
        console.error('Error creating new chat for message:', err);
        console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
        return;
      }
    }

    // Create optimistic update
    const tempId = Date.now().toString();
    const tempMessage: Message = {
      id: tempId,
      content,
      role,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      chat_id: currentChat?.id
    };

    setCurrentChat(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, tempMessage]
      };
    });

    try {
      if (!currentChat) return;
      
      console.log(`Sending message to chat ${currentChat.id}:`, { content, role });
      // Pass only the content to match our updated API function
      const response = await chatService.addMessage(currentChat.id, content);
      console.log('Message sent response:', response);
      console.log('Response data:', response.data);
      
      // Replace optimistic message with real one from server
      // Handle the response based on its structure
      let updatedChat: Chat;
      if (response.data && typeof response.data === 'object') {
        if ('messages' in response.data && Array.isArray(response.data.messages) && 'title' in response.data) {
          // If the response is a full chat object with all required Chat properties
          updatedChat = response.data as Chat;
        } else {
          // If the response is just the new message or another format
          // Create an updated chat with the new message
          const responseData = response.data as any; // Use any to avoid type errors
          
          // Keep the optimistic message but update with server data if available
          updatedChat = {
            ...currentChat,
            messages: currentChat.messages.map(msg => 
              msg.id === tempId && responseData.id 
                ? { ...msg, id: responseData.id, content: responseData.content || msg.content } 
                : msg
            )
          };
        }
      } else {
        // If we didn't get a valid response, keep the optimistic update
        updatedChat = {
          ...currentChat,
          messages: currentChat.messages
        };
      }
      
      setCurrentChat(updatedChat);
      
      // Update chat in chats list
      setChats(prev => 
        prev.map(chat => chat.id === updatedChat.id ? updatedChat : chat)
      );

      // Generate title for the chat if this is the first user message and title is still default
      if (role === 'user' && 
          updatedChat.title === 'New Chat' && 
          updatedChat.messages.filter(msg => msg.role === 'user').length === 1) {
        const generatedTitle = generateTitleFromMessage(content);
        await updateChatTitle(updatedChat.id, generatedTitle);
      }
      
      setError(null);
    } catch (err: unknown) {
      console.error('Error sending message:', err);
      console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
      setError('Failed to send message');
      toast.error('Failed to send message');
      
      // Revert optimistic update
      setCurrentChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== tempId)
        };
      });
      
      throw err;
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);
      
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (currentChat?.id === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        setCurrentChat(remainingChats.length > 0 ? remainingChats[0] : null);
      }
      
      toast.success('Chat deleted');
    } catch (err: unknown) {
      console.error('Error deleting chat:', err);
      console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
      toast.error('Failed to delete chat');
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    try {
      const response = await chatService.updateChatTitle(chatId, title);
      const updatedChat = response.data as Chat;
      
      setChats(prev => 
        prev.map(chat => chat.id === chatId ? updatedChat : chat)
      );
      
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedChat);
      }
      
      toast.success('Chat title updated');
    } catch (err: unknown) {
      console.error('Error updating chat title:', err);
      console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
      toast.error('Failed to update chat title');
    }
  };

  // Toggle search mode
  const toggleSearchMode = () => {
    setIsSearchMode(!isSearchMode);
    if (isSearchMode) {
      // Clear any previous search results when exiting search mode
      setSearchResults([]);
    }
  };

  // Perform web search using the Brave Search API
  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      // Debug log - search request
      console.log('🔍 Starting search for query:', query);
      
      // Determine the base URL - handle different environments
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000' 
        : window.location.origin;
      
      const searchUrl = `${baseUrl}/api/retrieve/search?q=${encodeURIComponent(query)}&count=5`;
      console.log('🔗 Search API URL:', searchUrl);
      
      // Use the correct API path that matches our backend route registration
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies for authentication if needed
      });
      
      console.log('📡 Search API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Search API error (${response.status}):`, errorText);
        throw new Error(`Search failed: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Search results received:', data);
      
      if (data && Array.isArray(data.results)) {
        console.log(`📊 Found ${data.results.length} search results`);
        setSearchResults(data.results);
        toast.success(`Found ${data.results.length} results for "${query}"`);
      } else {
        console.warn('⚠️ Unexpected search response format:', data);
        // Check if we have a note from the backend about missing API key
        if (data?.note && data.note.includes("mock data")) {
          toast.error('Backend API key not configured - using sample results');
          console.error('Backend API key not configured, received mock data');
        } else {
          toast.error('Invalid search response format');
        }
        // Fallback to mock results if the API response is invalid
        provideFallbackSearchResults(query);
      }
    } catch (error) {
      console.error('❌ Error performing search:', error);
      
      // More specific error message
      let errorMessage = 'Search failed - using demo results';
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Network connection error - backend may be unreachable';
        console.error('Network error details:', error);
      } else if (error instanceof Error) {
        errorMessage = `${error.message}`;
        console.error('Error details:', error);
      }
      
      toast.error(errorMessage);
      // Provide fallback search results when the API call fails
      provideFallbackSearchResults(query);
    } finally {
      setIsSearching(false);
    }
  };

  // Provide fallback search results when the API is not available
  const provideFallbackSearchResults = (query: string) => {
    // Create mock search results for demonstration purposes
    const mockResults: SearchResult[] = [
      {
        title: `${query} - Latest News and Updates`,
        url: 'https://example.com/news',
        snippet: `Find the latest information about ${query}. This is a sample search result provided for demonstration purposes.`
      },
      {
        title: `Everything You Need to Know About ${query}`,
        url: 'https://example.com/info',
        snippet: 'This is a demo search result. In production, this would display real search results from Brave Search API.'
      },
      {
        title: `${query} - Wikipedia`,
        url: 'https://en.wikipedia.org',
        snippet: `Wikipedia article about ${query}. This sample result is shown because the real search API is not connected.`
      }
    ];
    setSearchResults(mockResults);
  };

  // Find the latest version of a chat in the chats array
  const getLatestChat = (chatId: string) => {
    return chats.find(chat => chat.id === chatId) || null;
  };

  return (
    <ChatContext.Provider value={{
      currentChat,
      chats,
      loading,
      error,
      createNewChat,
      createAgentChat,
      setCurrentChat,
      addMessage,
      deleteChat,
      updateChatTitle,
      selectedAgent,
      setSelectedAgent,
      // Search-related properties and methods
      isSearchMode,
      toggleSearchMode,
      searchResults,
      performSearch,
      isSearching
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
