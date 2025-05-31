import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
import { checkApiEndpoint } from '../utils/apiUtils';

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

// Define the chat provider component with proper React return type
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }): JSX.Element => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setError] = useState<string | null>(null);
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
  const toggleSearchMode = (): void => {
    setIsSearchMode(!isSearchMode);
    if (!isSearchMode) {
      setSearchResults([]);
    }
  };

  // Perform web search using the Brave Search API
  const performSearch = async (query: string): Promise<void> => {
    if (!query.trim()) return;

    // Generate a unique ID for this search request for tracing and debugging
    const searchId = `search-${Date.now()}`;
    console.log(`🏷️ [SEARCH] Generated unique search ID: ${searchId}`);

    // Set searching state to true to show loading indicator
    setIsSearching(true);

    // Store the query for debugging
    window._lastSearchQuery = query;

    try {
      // Check the API status first before attempting search
      console.log('📍 Checking API endpoint status before search...');
      const renderEndpoint = 'https://agentando-ai-backend-d7f9.onrender.com';
      const isApiAlive = await checkApiEndpoint(renderEndpoint);

      // Debug log - search request
      console.log('🔍 Starting search for query:', query);

      // Determine the base URL based on API status check results
      let baseUrl = '';
      let apiUrls: string[] = [];

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
        // If the main API is not available, try various fallback options
        console.log('❗ Render API is not responding, using fallback URLs');
        
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
          'http://localhost:8000',         // Local development
          'https://localhost:8000',        // Local development with HTTPS
          '',                              // Relative path as last resort
          renderEndpoint                   // Still try Render as last resort
        ];
      }
      
      // Filter out empty URLs
      apiUrls = apiUrls.filter(url => url);
      console.log('🔍 Available API base URLs (in priority order):', apiUrls);

      // Use the web-search endpoint which is robust and has better error handling
      const searchEndpoint = `/api/retrieve/web-search?q=${encodeURIComponent(query)}&count=5`;
      const searchUrl = `${baseUrl}${searchEndpoint}`;

      // Full URL logging for debugging
      console.log(`🔍 [SEARCH][${searchId}] Building search URL with:`);
      console.log(`🔍 [SEARCH][${searchId}] - Base URL: ${baseUrl}`);
      console.log(`🔍 [SEARCH][${searchId}] - Endpoint: ${searchEndpoint}`);
      console.log(`🔍 [SEARCH][${searchId}] - Full URL: ${searchUrl}`);

      // Store on window for debugging in browser console
      window._lastSearchUrl = searchUrl;

      // Track if request succeeded
      let requestSucceeded = false;
      let response: Response | null = null;
      let lastError: Error | null = null;

      try {
        // Make the fetch call - use searchUrl at first attempt
        const isCrossOrigin = !baseUrl.includes(window.location.host) && baseUrl !== '';
        const fetchOptions: RequestInit = {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: isCrossOrigin ? 'omit' : 'include',
          mode: isCrossOrigin ? 'cors' : 'same-origin',
        };

        console.log(`🔧 [SEARCH][${searchId}] Fetch options:`, fetchOptions);
        console.log(`🕐 [SEARCH][${searchId}] Attempting API call to: ${searchUrl}`);

        response = await fetch(searchUrl, fetchOptions);
        requestSucceeded = response.ok;
        console.log(`✅ [SEARCH][${searchId}] API call succeeded with status: ${response.status}`);
      } catch (error) {
        console.error(`❌ [SEARCH][${searchId}] Initial API call failed with error:`, error);
        lastError = error as Error;
        window._lastSearchError = error;

        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          console.error(`🔴 [SEARCH][${searchId}] NETWORK ERROR - This could be due to:`);
          console.error('- The backend server is not running');
          console.error('- There is a CORS configuration issue');
          console.error('- The URL is incorrect:', searchUrl);
          console.error('- There is a network connectivity issue');
        }

        // Try fallback URLs one by one
        console.log(`⚠️ [SEARCH][${searchId}] Attempting ${apiUrls.length} fallback URLs...`);

        for (const fallbackBaseUrl of apiUrls) {
          // Skip empty URLs or the one we already tried
          if (!fallbackBaseUrl || fallbackBaseUrl === baseUrl) continue;

          const fallbackUrl = `${fallbackBaseUrl}${searchEndpoint}`;
          console.log(`🔄 [SEARCH][${searchId}] Trying fallback URL: ${fallbackUrl}`);

          const isCrossOrigin = !fallbackBaseUrl.includes(window.location.host) && fallbackBaseUrl !== '';
          const fallbackOptions: RequestInit = {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            credentials: isCrossOrigin ? 'omit' : 'include',
            mode: isCrossOrigin ? 'cors' : 'same-origin',
          };

          try {
            response = await fetch(fallbackUrl, fallbackOptions);
            requestSucceeded = response.ok;
            console.log(`✅ [SEARCH][${searchId}] Fallback API call to ${fallbackUrl} succeeded with status: ${response.status}`);
            if (response.ok) break; // Exit the loop if successful
          } catch (error) {
            console.error(`❌ Fallback API call to ${fallbackBaseUrl} failed:`, error);
            lastError = error as Error;
            window._lastSearchError = error;
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

      // Parse JSON response
      const data = await response.json();
      console.log('✅ [SEARCH] Search results received:', data);

      // Handle both successful results and error scenarios
      if (data.status === "error") {
        console.error('❌ [SEARCH] Search API returned error:', data.error);
        throw new Error(`Search API error: ${data.error || 'Unknown error'}`);
      }

      // If we got search results successfully, process them
      if (data.results && Array.isArray(data.results)) {
        console.log(`✅ [SEARCH][${searchId}] Successfully processed ${data.results.length} search results`);

        // Map the API response to our SearchResult type
        const results: SearchResult[] = data.results.map((result: any) => ({
          title: result.title || 'No Title',
          url: result.url || '#',
          snippet: result.description || result.snippet || 'No description available.'
        }));

        // Update search results in state
        setSearchResults(results);
      } else {
        console.warn('⚠️ [SEARCH] Search returned empty or invalid results:', data);
        // Set empty results
        setSearchResults([]);

        // If there are no results but the API didn't report an error, we'll use mock data
        if (process.env.NODE_ENV === 'development') {
          console.log('💭 [SEARCH] Using mock search results for development');
          // Mock search results for development
          const mockResults: SearchResult[] = [
            {
              title: 'Mock Result 1 for "' + query + '"',
              url: 'https://example.com/1',
              snippet: 'This is a mock search result for development purposes. Your search was: ' + query
            },
            {
              title: 'Mock Result 2 for "' + query + '"',
              url: 'https://example.com/2',
              snippet: 'Another mock search result. Search engines might be down or unreachable.'
            }
          ];
          setSearchResults(mockResults);
        }
      }
    } catch (error) {
      console.error('🔴 [SEARCH] Unhandled error in performSearch:', error);
      setSearchResults([]);
      toast.error('Search failed: ' + (error instanceof Error ? error.message : String(error)));
      window._lastSearchError = error;
    } finally {
      // Always set isSearching to false when search completes or fails
      setIsSearching(false);
      console.log('🏁 [SEARCH] Search operation completed');
    }
  };

  // Return the chat context provider
  return (
    <ChatContext.Provider value={{
      currentChat,
      chats,
      loading,
      error: errorState,
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

// Export the hook for consuming the context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// This ensures the useChat hook is properly exported
// It will be imported and used by other components elsewhere in the application
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const _useChatExport = useChat;
