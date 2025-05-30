import React, { createContext, useContext, useState, useEffect } from 'react';

// Extend the Window interface to include custom properties used for debugging
declare global {
  interface Window {
    _lastSearchUrl?: string;
    _lastSearchQuery?: string;
    _lastSearchError?: any;
    _lastSearchErrorText?: string;
  }
}

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

  // Check if an API endpoint is alive and responding
  const checkApiEndpoint = async (url: string): Promise<boolean> => {
    try {
      console.log(`🔌 Testing API connectivity to: ${url}`);
      const response = await fetch(`${url}/api/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        cache: 'no-cache',
      });
      
      if (response.ok) {
        console.log(`✅ API endpoint ${url} is alive!`);
        return true;
      } else {
        console.log(`❌ API endpoint ${url} returned status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Cannot connect to API endpoint ${url}:`, error);
      return false;
    }
  };
  
  // Perform web search using the Brave Search API
  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    // Check the API status first before attempting search
    console.log('📍 Checking API endpoint status before search...');
    const renderEndpoint = 'https://agentando-ai-backend-d7f9.onrender.com';
    const isApiAlive = await checkApiEndpoint(renderEndpoint);
    
    setIsSearching(true);
    try {
      // Debug log - search request
      console.log('🔍 Starting search for query:', query);
      
      // Determine the base URL based on API status check results
      // If the Render API is alive, use it directly
      // Otherwise, try other options in order
      let baseUrl = '';
      let apiUrls = [];
      
      if (isApiAlive) {
        baseUrl = renderEndpoint;
        console.log('💾 Using verified Render API endpoint:', baseUrl);
        
        // Still keep other URLs as fallback
        apiUrls = [
          renderEndpoint,                  // Known working Render endpoint
          window.location.origin,          // Same origin as frontend
          'http://localhost:8000',         // Local development
          ''                               // Relative path as last resort
        ];
      } else {
        console.log('⚠️ Render API endpoint is not responding, trying other options');
        
        if (process.env.NODE_ENV === 'development') {
          baseUrl = 'http://localhost:8000';
          console.log('🔧 Development environment detected, using:', baseUrl);
        } else {
          // Try relative path as main option since Render API is down
          baseUrl = window.location.origin;
          console.log('🚀 Using same-origin API endpoint:', baseUrl);
        }
        
        apiUrls = [
          window.location.origin,          // Same origin as frontend
          '',                              // Relative path
          'http://localhost:8000',         // Local development
          renderEndpoint                   // Render endpoint as last resort
        ];
      }
      
      console.log('🔍 Available API base URLs (in priority order):', apiUrls);
      
      // Use the new web-search endpoint which is more robust and has better error handling
      const searchUrl = `${baseUrl}/api/retrieve/web-search?q=${encodeURIComponent(query)}&count=5`;
      console.log('🔗 Primary Search API URL:', searchUrl);
      window._lastSearchUrl = searchUrl; // For debugging in browser
      window._lastSearchQuery = query;
      
      // Track if request succeeded
      let requestSucceeded = false;
      let response: Response | null = null;
      let lastError: Error | null = null;
      
      // Try the primary URL first
      try {
        console.log('🟢 [SEARCH] Triggered performSearch for query:', query, '| Mode:', isSearchMode, '| URL:', searchUrl);
        console.log('🕐 Attempting API call to primary URL:', searchUrl);
        
        response = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          // Don't use credentials for cross-origin requests to avoid CORS issues
          credentials: baseUrl === window.location.origin ? 'include' : 'omit'
        });
        
        // Log detailed information about the response
        console.log(`📢 [SEARCH] Response details - URL: ${searchUrl}, Status: ${response.status}`);
        console.log(`📢 [SEARCH] Response headers:`, Object.fromEntries([...response.headers.entries()]));
        if (!response.ok) {
          console.warn(`[SEARCH] Non-200 response received:`, response.status, await response.text());
        }
        console.log('📡 Primary API response status:', response.status);
        requestSucceeded = response.ok;
      } catch (error) {
        console.error('❌ [SEARCH] Primary API call failed:', error);
        window._lastSearchError = error;
        lastError = error as Error;
      }
      
      // If primary URL failed, try the fallback URLs
      if (!requestSucceeded) {
        console.log('⚠️ Primary API call failed, trying fallback URLs...');
        
        // Try each of the other URLs
        for (const apiUrl of apiUrls) {
          console.log('[SEARCH] Trying fallback API URL:', apiUrl);
          // Skip empty URL or the one we already tried
          if (!apiUrl || apiUrl === baseUrl) continue;
          
          const fallbackUrl = `${apiUrl}/api/retrieve/web-search?q=${encodeURIComponent(query)}&count=5`;
          console.log('🔗 Trying fallback URL:', fallbackUrl);
          
          try {
            response = await fetch(fallbackUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              // Fix CORS issues by not including credentials for cross-origin requests
              credentials: apiUrl === window.location.origin ? 'include' : 'omit',
              // Add more useful request options
              mode: 'cors',
              cache: 'no-cache'
            });
            
            // Log detailed response information
            console.log(`[SEARCH] Fallback response details - URL: ${fallbackUrl}, Status: ${response.status}`);
            console.log(`[SEARCH] Fallback response headers:`, Object.fromEntries([...response.headers.entries()]));
            if (!response.ok) {
              console.warn(`[SEARCH] Fallback non-200 response:`, response.status, await response.text());
            }
            console.log('📡 Fallback API response status:', response.status);
            
            if (response.ok) {
              console.log('✅ Fallback API call succeeded with URL:', fallbackUrl);
              requestSucceeded = true;
              break; // Exit the loop as we found a working URL
            }
          } catch (error) {
            console.error(`❌ Fallback API call to ${fallbackUrl} failed:`, error);
            lastError = error as Error;
          }
        }
      }
      
      // If all URLs failed, throw the last error
      if (!requestSucceeded || !response) {
        console.error('[SEARCH] All API endpoints failed! Last error:', lastError);
        throw new Error(`All API endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`);
      }
      
      console.log('📡 Final successful API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SEARCH] ❌ Search API error (${response.status}):`, errorText);
        window._lastSearchErrorText = errorText;
        throw new Error(`Search failed: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ [SEARCH] Search results received:', data);
      
      // Handle both successful results and error scenarios
      if (data.status === "error") {
        console.error('❌ [SEARCH] Search API returned error:', data.error);
        
        // Check if this is an API key error
        if (data.error && data.error.includes("BRAVE_SEARCH_API_KEY")) {
          toast.error('BRAVE_SEARCH_API_KEY environment variable is not set. Please configure it in your backend settings.');
          console.error('Search failed: The BRAVE_SEARCH_API_KEY is missing - search cannot work without a valid API key');
          
          // Clear search results to avoid showing stale data
          setSearchResults([]);
          throw new Error('Brave Search API key not configured');
        } else {
          toast.error(`[SEARCH] Search error: ${data.error}`);
          setSearchResults([]);
          throw new Error(`[SEARCH] Search API error: ${data.error}`);
        }
      } 
      else if (data && Array.isArray(data.results) && data.results.length > 0) {
        console.log(`[SEARCH] 📊 Found ${data.results.length} search results`);
        setSearchResults(data.results);
        toast.success(`[SEARCH] Found ${data.results.length} results for "${query}"`);
      } 
      else {
        console.warn('[SEARCH] ⚠️ No search results found or unexpected format:', data);
        toast.error('[SEARCH] No search results found');
        setSearchResults([]);
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
