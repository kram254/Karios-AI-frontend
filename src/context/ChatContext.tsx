import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Extend the Window interface to include custom properties// Types for storing debug info on window object
declare global {
  interface Window {
    _lastSearchUrl?: string;
    _lastSearchQuery?: string;
    _lastSearchError?: any;
    _lastSearchErrorText?: string;
    _lastSearchErrorResponse?: any;
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
  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    // Log the search request start time
    const searchStartTime = Date.now();
    console.log(`🕒 [SEARCH] Search request received at ${new Date(searchStartTime).toISOString()}`);
    console.log(`🔍 [SEARCH] User query: "${query}"`);

    // Set searching state to true to show loading indicator
    setIsSearching(true);
    console.log(`🔄 [SEARCH] Set search loading state to true`);

    // Generate a unique ID for this search request for tracing and debugging
    const searchId = `search-${Date.now()}`;
    console.log(`🏷️ [SEARCH][${searchId}] Generated unique search ID: ${searchId}`);
    console.log(`🔍 [SEARCH][${searchId}] WORKFLOW STARTED - User requested search for: "${query}"`);

    // Store the query for debugging
    window._lastSearchQuery = query;
    console.log(`💾 [SEARCH][${searchId}] Stored search query for debugging: "${query}"`);

    try {
      // Check the API status first before attempting search
      console.log(`📍 [SEARCH][${searchId}] Checking API endpoint status before search...`);
      // Updated to use the correct production endpoint
      const renderEndpoint = 'https://agentando-ai-backend-lrv9.onrender.com';
      console.log(`🔌 [SEARCH][${searchId}] Using primary API endpoint: ${renderEndpoint}`);
      const isApiAlive = await checkApiEndpoint(renderEndpoint);
      console.log(`🔌 [SEARCH][${searchId}] API status check result: ${isApiAlive ? 'ONLINE' : 'OFFLINE'}`);

      // Debug log - search request
      console.log(`🔍 [SEARCH][${searchId}] Starting search for query: "${query}"`);
      console.log(`🔍 [SEARCH][${searchId}] Search workflow: 1. API endpoint check → 2. Build URL → 3. API request → 4. Process results`);

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
      const searchEndpoint = `api/retrieve/web-search?q=${encodeURIComponent(query)}&count=5`;
      
      // Ensure proper URL construction without double slashes
      const searchUrl = baseUrl.endsWith('/') 
        ? `${baseUrl}${searchEndpoint}` 
        : `${baseUrl}/${searchEndpoint}`;
        
      console.log(`🔧 [SEARCH][${searchId}] URL construction details:`); 
      console.log(`🔧 [SEARCH][${searchId}] - Base URL: ${baseUrl}`); 
      console.log(`🔧 [SEARCH][${searchId}] - Search endpoint: ${searchEndpoint}`); 
      console.log(`🔧 [SEARCH][${searchId}] - Constructed URL: ${searchUrl}`);
      
      console.log(`🌐 [SEARCH][${searchId}] ENDPOINT DETAILS:`);
      console.log(`🌐 [SEARCH][${searchId}] - API endpoint: /api/retrieve/web-search`);
      console.log(`🌐 [SEARCH][${searchId}] - Query parameter: q=${encodeURIComponent(query)}`);
      console.log(`🌐 [SEARCH][${searchId}] - Results count: 5`);

      // Full URL logging for debugging
      console.log(`🔍 [SEARCH][${searchId}] Building search URL with:`);
      console.log(`🔍 [SEARCH][${searchId}] - Base URL: ${baseUrl}`);
      console.log(`🔍 [SEARCH][${searchId}] - Endpoint: ${searchEndpoint}`);
      console.log(`🔍 [SEARCH][${searchId}] - Full URL: ${searchUrl}`);

      // Store on window for debugging in browser console
      window._lastSearchUrl = searchUrl;

      // Track request status and details
      let requestSucceeded = false;
      let response: Response | null = null;
      let lastError: Error | null = null;
      let requestStartTime = Date.now();
      
      console.log(`⏱️ [SEARCH][${searchId}] Request tracking initialized. Start time: ${new Date(requestStartTime).toISOString()}`);

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

        console.log(`🚀 [SEARCH][${searchId}] SENDING REQUEST to ${searchUrl}`);
        response = await fetch(searchUrl, fetchOptions);
        
        const requestDuration = Date.now() - requestStartTime;
        requestSucceeded = response.ok;
        
        console.log(`📡 [SEARCH][${searchId}] RESPONSE RECEIVED in ${requestDuration}ms`);
        console.log(`📡 [SEARCH][${searchId}] Status: ${response.status} ${response.statusText}`);
        
        // Log additional response details
        if (response.headers) {
          const contentType = response.headers.get('content-type');
          console.log(`📡 [SEARCH][${searchId}] Content-Type: ${contentType || 'none'}`);
        }
        
        if (response.ok) {
          console.log(`✅ [SEARCH][${searchId}] API call SUCCEEDED with status: ${response.status}`);
        } else {
          console.log(`❌ [SEARCH][${searchId}] API call FAILED with status: ${response.status}`);
        }
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

      // If all URLs failed, throw the last error with detailed diagnostic info
      if (!requestSucceeded || !response) {
        const errorMessage = `All API endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`;
        console.error(`❌ [SEARCH][${searchId}] FATAL ERROR: ${errorMessage}`);
        console.error(`❌ [SEARCH][${searchId}] API endpoints attempted: ${apiUrls.join(', ')}`);
        console.error(`❌ [SEARCH][${searchId}] Last error details:`, lastError);
        
        // Store diagnostic info on window object
        window._lastSearchError = {
          message: errorMessage,
          lastError,
          apiUrls,
          searchId,
          timestamp: new Date().toISOString()
        };
        
        throw new Error(errorMessage);
      }

      console.log(`📡 [SEARCH][${searchId}] Final successful API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [SEARCH][${searchId}] Search API error (${response.status}):`, errorText);
        window._lastSearchErrorText = errorText;
        
        // Log detailed error diagnostics
        console.error(`❌ [SEARCH][${searchId}] ERROR DETAILS:`);
        console.error(`❌ [SEARCH][${searchId}] - Status: ${response.status} ${response.statusText}`);
        console.error(`❌ [SEARCH][${searchId}] - URL: ${searchUrl}`);
        console.error(`❌ [SEARCH][${searchId}] - Error: ${errorText}`);
        
        throw new Error(`Search failed: ${response.statusText} - ${errorText}`);
      }

      // Parse JSON response
      console.log(`🔄 [SEARCH][${searchId}] Parsing JSON response...`);
      let data;
      try {
        data = await response.json();
        console.log(`✅ [SEARCH][${searchId}] Search results successfully parsed:`, data);
        console.log(`📊 [SEARCH][${searchId}] Response structure: ${Object.keys(data).join(', ')}`);
      } catch (parseError: unknown) {
        console.error(`❌ [SEARCH][${searchId}] Failed to parse JSON response:`, parseError);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        throw new Error(`Failed to parse search results: ${errorMessage}`);
      }

      // Handle both successful results and error scenarios
      if (data.status === "error") {
        console.error(`❌ [SEARCH][${searchId}] Search API returned error status in JSON response`);
        console.error(`❌ [SEARCH][${searchId}] Error details:`, data.error);
        console.error(`❌ [SEARCH][${searchId}] Full error response:`, data);
        
        // Store error details for debugging
        window._lastSearchErrorResponse = data;
        
        throw new Error(`Search API error: ${data.error || 'Unknown error'}`);
      }
      
      // Log request ID from backend for correlation
      if (data.request_id) {
        console.log(`🔄 [SEARCH][${searchId}] Backend request ID: ${data.request_id}`);
      }

      // If we got search results successfully, process them
      if (data.results && Array.isArray(data.results)) {
        const resultCount = data.results.length;
        console.log(`✅ [SEARCH][${searchId}] Successfully received ${resultCount} search results`);
        console.log(`📊 [SEARCH][${searchId}] RESULT STATS:`);
        console.log(`📊 [SEARCH][${searchId}] - Total results: ${resultCount}`);
        console.log(`📊 [SEARCH][${searchId}] - Query: "${query}"`);
        console.log(`📊 [SEARCH][${searchId}] - Process time: ${data.process_time_ms || 'unknown'}ms`);

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
    } catch (error: unknown) {
      console.error(`🔴 [SEARCH][${searchId}] UNHANDLED ERROR in performSearch:`, error);
      if (error instanceof Error) {
        console.error(`🔴 [SEARCH][${searchId}] Error type: ${error.constructor.name}`);
        console.error(`🔴 [SEARCH][${searchId}] Error message: ${error.message}`);
        if (error.stack) {
          console.error(`🔴 [SEARCH][${searchId}] Stack trace:`, error.stack);
        }
      } else {
        console.error(`🔴 [SEARCH][${searchId}] Unknown error type`); 
      }
      
      // Clear search results
      setSearchResults([]);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`🔴 [SEARCH][${searchId}] Showing error toast: ${errorMessage}`);
      toast.error('Search failed: ' + errorMessage);
      
      // Save error for debugging
      window._lastSearchError = {
        error: error instanceof Error ? error : { message: String(error) },
        searchId,
        timestamp: new Date().toISOString(),
        query
      };
    } finally {
      // Always set isSearching to false when search completes or fails
      setIsSearching(false);
      
      // Calculate search duration using the searchStartTime from the beginning of the function
      const searchDuration = Date.now() - searchStartTime;
      console.log(`🏁 [SEARCH][${searchId}] Search operation COMPLETED in ${searchDuration}ms`);
      console.log(`🏁 [SEARCH][${searchId}] Loading state reset to false`);
      
      // Complete logging of workflow
      console.log(`📋 [SEARCH][${searchId}] SEARCH WORKFLOW SUMMARY:`);
      console.log(`📋 [SEARCH][${searchId}] - Query: "${query}"`);
      console.log(`📋 [SEARCH][${searchId}] - Duration: ${searchDuration}ms`);
      console.log(`📋 [SEARCH][${searchId}] - Results: ${searchResults.length}`);
      console.log(`📋 [SEARCH][${searchId}] - Status: ${searchResults.length > 0 ? 'SUCCESS' : 'FAILED'}`);
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
