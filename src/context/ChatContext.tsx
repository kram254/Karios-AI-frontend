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
import { filterDisclaimerMessages } from '../utils/messageFilters';

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
  performSearch: (query: string, addUserMessage?: boolean) => Promise<void>;
  isSearching: boolean;
  accessedWebsites: {title: string, url: string}[];
  searchQuery: string;
  isSearchSidebarOpen: boolean;
  toggleSearchSidebar: () => void;
  internetSearchEnabled: boolean; // Indicates if internet search is currently active
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Define the chat provider component with proper React return type
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
  const [accessedWebsites, setAccessedWebsites] = useState<{title: string, url: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchSidebarOpen, setIsSearchSidebarOpen] = useState(false);
  const [internetSearchEnabled, setInternetSearchEnabled] = useState(false); // Track if internet search is active

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

  // Effect to load full chat details (including messages) when currentChat.id changes
  useEffect(() => {
    const loadCurrentChatMessages = async () => {
      if (currentChat?.id) {
        // Optimization: If the currentChat object already has messages, and it's the same ID,
        // assume they are sufficiently loaded. This avoids redundant fetches if the full chat object
        // was already set (e.g., after creating a new chat or adding a message).
        // A more robust check might involve looking at a `messages_loaded_fully` flag if available.
        if (currentChat.messages && currentChat.messages.length > 0) {
          console.log(`[ChatContext][useEffect] Chat ${currentChat.id} already has ${currentChat.messages.length} messages in state. Optimization: Skipping fetch. First message ID: ${currentChat.messages[0]?.id}`);
          return;
        }

        console.log(`[ChatContext][useEffect] Chat ${currentChat.id} has no messages or messages are empty. Fetching full details... Current messages count: ${currentChat.messages?.length || 0}`);
        setLoading(true);
        try {
          const freshChatResponse = await chatService.getChat(currentChat.id);
          console.log(`[ChatContext][useEffect] Full chat ${currentChat.id} loaded:`, freshChatResponse.data);
          // Update the currentChat state with the fully loaded chat object from the server
          setCurrentChat(freshChatResponse.data);
          console.log(`[ChatContext][useEffect] Successfully fetched and set messages for chat ${currentChat.id}. New messages count: ${freshChatResponse.data.messages?.length || 0}. Messages:`, freshChatResponse.data.messages);
          setError(null);
        } catch (err: unknown) {
          console.error(`Error loading messages for chat ${currentChat.id}:`, err);
          setError(`Failed to load messages for chat ${currentChat.title || 'the selected chat'}`);
          toast.error(`Failed to load messages for ${currentChat.title || 'the selected chat'}`);
        } finally {
          setLoading(false);
        }
      }
    };

    loadCurrentChatMessages();
  }, [currentChat?.id]); // Dependency array ensures this runs when currentChat.id changes

  const createNewChat = async (customTitle?: string) => {
    try {
      setLoading(true);
      console.log('Attempting to create a new chat with title:', customTitle || 'New Conversation');
      
      // Format title appropriately if it's a search query
      let finalTitle = customTitle || 'New Conversation';
      if (customTitle?.startsWith('Search:')) {
        // Title is already in search format
        finalTitle = customTitle;
      } else if (customTitle && !customTitle.startsWith('Search:') && internetSearchEnabled) {
        // For search queries, add a prefix and truncate if necessary
        finalTitle = `Search: ${customTitle.slice(0, 40)}${customTitle.length > 40 ? '...' : ''}`;
      }
      
      const response = await chatService.createChat({
        title: finalTitle,
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
    } catch (err) {
      console.error('Failed to create new chat:', err);
      toast.error('Failed to create new chat. Please try again.');
      setError('Failed to create new chat');
      return null;
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
  // This function is kept for future language handling but currently not used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getChatLanguage = (chat: Chat | null) => {
    if (chat && chat.language) {
      return chat.language;
    }
    return language.code;
  };

  const addMessage = async ({ role, content }: { role: 'user' | 'assistant' | 'system'; content: string }) => {
    let chatToUse = currentChat;
    
    // If we don't have a current chat, create one and ensure it's set in state
    if (!chatToUse) {
      console.log('[ChatContext][addMessage] No current chat found. Creating a new chat first.');
      try {
        // Create a new chat and get the newly created chat object
        const newChat = await createNewChat();
        
        if (!newChat) {
          console.error('[ChatContext][addMessage] Failed to create a new chat - createNewChat returned null/undefined');
          toast.error('Cannot send message: Unable to create a chat.');
          return;
        }
        
        // Use this newly created chat for our message
        chatToUse = newChat;
        console.log(`[ChatContext][addMessage] Successfully created new chat with ID: ${chatToUse.id}`);
      } catch (err: unknown) {
        console.error('[ChatContext][addMessage] Error creating new chat for message:', err);
        console.error('[ChatContext][addMessage] Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
        toast.error('Cannot send message: Failed to create a chat.');
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
      chat_id: chatToUse.id // Use chatToUse instead of currentChat
    };

    // Optimistically add the message to the UI
    setCurrentChat(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, tempMessage]
      };
    });

    try {
      // At this point chatToUse should always be defined
      const activeChatId = chatToUse.id;
      console.log(`[ChatContext][addMessage] Sending message to chat ${activeChatId}:`, { content, role });
      console.log(`[ChatContext][addMessage] Detailed chat info: ID=${chatToUse.id}, Title=${chatToUse.title}, MessageCount=${chatToUse.messages?.length || 0}`);

      const messageData = { content, role };
      const addedMessageResponse = await chatService.addMessage(activeChatId, messageData);
      const newlyAddedMessage: Message = addedMessageResponse.data;

      console.log(`[ChatContext][addMessage] Message successfully added via API for chat ${activeChatId}. New message ID: ${newlyAddedMessage.id}.`);

      // Crucial Step: Refetch the entire chat to get the most up-to-date state from the server
      console.log(`[ChatContext][addMessage] Refetching chat ${activeChatId} to ensure UI consistency.`);
      const updatedChatResponse = await chatService.getChat(activeChatId);
      const fullyUpdatedChat: Chat = updatedChatResponse.data;

      console.log(`[ChatContext][addMessage] Successfully refetched chat ${activeChatId}. Full data:`, fullyUpdatedChat);
      console.log(`[ChatContext][addMessage] Messages in refetched chat:`, fullyUpdatedChat.messages);

      // Update the currentChat state with the fully loaded chat object
      setCurrentChat(fullyUpdatedChat);

      // Update the chats array in the state
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === activeChatId ? fullyUpdatedChat : chat
        )
      );

      // Generate title for the chat if this is the first user message and title is still default
      if (role === 'user' && 
          fullyUpdatedChat.title === 'New Chat' && 
          fullyUpdatedChat.messages.filter(msg => msg.role === 'user').length === 1) {
        console.log(`[ChatContext][addMessage] First user message in 'New Chat'. Generating title for chat ${activeChatId}.`);
        const generatedTitle = generateTitleFromMessage(content);
        await updateChatTitle(activeChatId, generatedTitle); // This might trigger another fetch if updateChatTitle modifies and refetches.
      }

      setError(null);
    } catch (err: unknown) {
      console.error(`[ChatContext][addMessage] Error during addMessage for chat ${chatToUse?.id || 'UNKNOWN_CHAT_ID'}:`, err);
      toast.error('Failed to send message. Please try again.');

      // Revert optimistic message on error
      setCurrentChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== tempId)
        };
      });
      setError('Failed to send message');
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

  // Toggle search sidebar visibility
  const toggleSearchSidebar = () => {
    setIsSearchSidebarOpen(!isSearchSidebarOpen);
  };

  // Perform web search using the Brave Search API
  const performSearch = async (query: string, addUserMessage = true) => {
    const searchId = `websearch-${Date.now()}`;
    const searchStartTime = Date.now();
    
    if (!query.trim()) {
      console.log(`[ChatContext][performSearch][${searchId}] Empty query, aborting search`);
      return;
    }
    
    // Set search query for UI components to use
    setSearchQuery(query);
    
    // Set searching state to true to show loading indicators
    setIsSearching(true);
    setInternetSearchEnabled(true); // Mark that internet search is active
    console.log(`[ChatContext][performSearch][${searchId}] Internet search enabled for query: "${query}"`);
    
    // CRITICAL: Store the chat ID at the beginning of the process
    // and use this same chat throughout the entire search process
    let chatToUse = currentChat;
    let chatIdToUse = currentChat?.id;
    
    // If there's no current chat, create one, but ONLY IF NECESSARY
    if (!chatToUse) {
      console.log(`[ChatContext][performSearch][${searchId}] No current chat, creating one first`);
      // Generate a title based on the search query
      const chatTitle = `Search: ${query.slice(0, 30)}${query.length > 30 ? '...' : ''}`;
      const newChat = await createNewChat(chatTitle);
      
      if (newChat && newChat.id) {
        chatToUse = newChat;
        chatIdToUse = newChat.id;
        setCurrentChat(newChat); // Important: update the current chat in state
        
        // Refresh the chats list
        const chatsResponse = await chatService.getChats();
        if (chatsResponse?.data) {
          setChats(chatsResponse.data);
        }
        
        // Small delay to ensure chat creation is complete
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`[ChatContext][performSearch][${searchId}] New chat created with ID: ${chatIdToUse}`);
      } else {
        console.error(`[ChatContext][performSearch][${searchId}] Failed to create new chat`);
        setInternetSearchEnabled(false);
        setIsSearching(false);
        return;
      }
    } else {
      console.log(`[ChatContext][performSearch][${searchId}] Using existing chat with ID: ${chatIdToUse}`);
    }
    
    // Check if user message should be added
    // Note: In Chat.tsx the user message is usually already added before calling performSearch
    // so we set addUserMessage=false in many cases to avoid duplicates
    if (addUserMessage && chatToUse && chatIdToUse) {
      console.log(`[ChatContext][performSearch][${searchId}] Adding user query to chat ${chatIdToUse} with AI response suppressed`);
      try {
        // Send the user message directly to the chat service with suppressAiResponse=true
        // This prevents the standard "I'm sorry, but as an AI..." response when in search mode
        await chatService.addMessage(chatIdToUse, { 
          role: 'user', 
          content: query,
          suppressAiResponse: true // CRITICAL: Suppress the standard AI response during search
        });
        
        // Refresh the chat to make sure we have the latest messages
        const updatedChat = await chatService.getChat(chatIdToUse);
        if (updatedChat?.data) {
          chatToUse = updatedChat.data;
          setCurrentChat(updatedChat.data);
        }
        
        console.log(`[ChatContext][performSearch][${searchId}] After adding user query. Messages count: ${chatToUse?.messages?.length}`);
      } catch (error) {
        console.error(`[ChatContext][performSearch][${searchId}] Error adding user message:`, error);
      }
    }

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
          error: lastError,
          searchId,
          timestamp: new Date().toISOString(),
          query
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
        
        // Update accessed websites for monitoring and diagnostics
        const topWebsites = results.map(result => ({
          title: result.title,
          url: result.url
        })).slice(0, 7); // Limit to top 7 as requested
        setAccessedWebsites(topWebsites);
        
        // Log accessed websites for debugging
        console.log(`🔍 [SEARCH][${searchId}] Top websites accessed:`, 
          topWebsites.map(site => site.title).join(', ') || 'None')
        
        // Format search results for display in chat - clean format like in the second image
        // First limit to top relevant results to not overwhelm the chat
        const topResults = results.slice(0, 5);
        
        // Format the message that shows in the chat bubble with a clean header
        const searchSummary = `Here's a comprehensive overview of the ${query}, including key details about the results:`;
        
        // Add a divider line for cleaner separation
        const dividerLine = '\n\n---\n\n';
        
        // Format each result with a clean bullet point style matching image 2
        const formattedResults = topResults.map((result, index) => {
          // Add a section header for each result type if needed
          if (index === 0) {
            return `**${index + 1}. [${result.title}](${result.url})**\n${result.snippet}`;
          }
          return `• **[${result.title}](${result.url})**\n${result.snippet}`;
        }).join('\n\n');
        
        // Add a footnote with search results count and view all option
        const footnote = `\n\n*Found ${results.length} results for "${query}". Click the search button to view all results.*`;
        
        // Create a clean message that matches the second image style (including the footnote)
        const searchResponseMessage = `${searchSummary}${dividerLine}${formattedResults}${footnote}`;
        console.log(`[ChatContext][performSearch][${searchId}] Before adding assistant search results. Current chat ID: ${chatIdToUse}, Messages count: ${chatToUse?.messages?.length}`);
        
        // Add the search results to the chat as an assistant message
        // CRITICAL: Use chatIdToUse to ensure we're adding to the same chat
        console.log(`📝 [SEARCH][${searchId}] Adding search results directly to chat ${chatIdToUse}`);
        try {
          if (chatIdToUse) {
            // Use direct service call to avoid creating a new chat
            // Add search results message with suppress AI response flag
            // This helps prevent generic AI fallback messages
            await chatService.addMessage(chatIdToUse, { 
              role: 'assistant', 
              content: `[SEARCH_RESULTS] ${searchResponseMessage}`, // Prefix to help identify search results
              suppressAiResponse: true // Prevent additional AI responses
            });
            
            // Now refresh the chat to get the latest messages
            const updatedChat = await chatService.getChat(chatIdToUse);
            if (updatedChat?.data) {
              console.log(`📝 [SEARCH][${searchId}] Successfully refreshed chat after adding search results`);
              setCurrentChat(updatedChat.data);
              
              // Log if there are any generic AI messages still present
              const genericMessages = updatedChat.data.messages.filter(msg => {
                if (msg.role !== 'assistant') return false;
                const content = msg.content?.toLowerCase() || '';
                return content.includes("i'm sorry") && content.includes("as an ai");
              });
              
              if (genericMessages.length > 0) {
                console.warn(`⚠️ [SEARCH][${searchId}] ${genericMessages.length} generic AI messages found in chat after search. These will be filtered in the UI.`);
              }
            }
          } else {
            console.error(`📝 [SEARCH][${searchId}] Cannot add search results: No chat ID available`);
          }
        } catch (error) {
          console.error(`📝 [SEARCH][${searchId}] Error adding search results:`, error);
        }
        console.log(`[ChatContext][performSearch][${searchId}] After adding assistant search results. Current chat ID: ${chatIdToUse}`);
      } else {
        console.warn('⚠️ [SEARCH] Search returned empty or invalid results:', data);
        // Set empty results
        setSearchResults([]);
        
        // If there are no results but the API didn't report an error, we'll use mock data in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log(`💭 [SEARCH][${searchId}] Using mock search results for development`);
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
          
          // Add mock results to chat for better UX during development
          // Format the message that shows in the chat bubble
          const mockSearchSummary = `I found ${mockResults.length} results for "${query}". Here are the most relevant ones:`;
          
          // Format each result with a clean numbered style like the real search results
          const mockFormattedResults = mockResults.map((result, index) => {
            return `**${index + 1}. [${result.title}](${result.url})**\n${result.snippet}`;
          }).join('\n\n');
          
          const mockResponseMessage = `${mockSearchSummary}\n\n${mockFormattedResults}\n\nYou can view all search results by clicking the search button.\n\n*This is a development environment. Mock results are shown.*`;
          
          // Add mock results to chat
          console.log(`📝 [SEARCH][${searchId}] Adding mock search results to chat conversation`);
          await addMessage({
            role: 'assistant',
            content: mockResponseMessage
          });
        } else {
          // Only show no results message if we're not in development mode or not using mock data
          await addMessage({
            role: 'assistant',
            content: `I couldn't find any results for "${query}". Please try a different search term.`
          });
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
      setInternetSearchEnabled(false); // CRITICAL: Reset internet search flag to prevent duplicate chats
      
      // Calculate search duration using the searchStartTime from the beginning of the function
      const searchDuration = Date.now() - searchStartTime;
      
      // Final refresh of the chat to ensure UI is up to date
      try {
        if (chatIdToUse) {
          const refreshResponse = await chatService.getChat(chatIdToUse);
          if (refreshResponse?.data) {
            // Apply aggressive filtering to remove AI disclaimer messages
            const filteredChat = {
              ...refreshResponse.data,
              messages: refreshResponse.data.messages.filter(msg => {
                // Skip filtering for non-assistant messages
                if (msg.role !== 'assistant') return true;
                
                // Filter out any assistant message that contains disclaimer text
                if (msg.content.includes("Sorry, as an AI developed by OpenAI") ||
                    msg.content.includes("I don't have real-time data") ||
                    msg.content.includes("As of my last update")) {
                  console.log(`🚫 [SEARCH][${searchId}] FILTERED OUT disclaimer message: "${msg.content.substring(0, 50)}..."`);
                  return false;
                }
                
                // Keep all other messages
                return true;
              })
            };
            
            setCurrentChat(filteredChat);
            console.log(`🏁 [SEARCH][${searchId}] Successfully refreshed chat ${chatIdToUse} with ${filteredChat.messages?.length} messages after filtering`);
          }
        }
      } catch (refreshError) {
        console.error(`🛑 [SEARCH][${searchId}] Error refreshing chat after search:`, refreshError);
      }
      
      console.log(`🏁 [SEARCH][${searchId}] Search operation COMPLETED in ${searchDuration}ms`);
      console.log(`🏁 [SEARCH][${searchId}] Loading state reset to false`);
      
      // Complete logging of workflow
      console.log(`📋 [SEARCH][${searchId}] SEARCH WORKFLOW SUMMARY:`);
      console.log(`📋 [SEARCH][${searchId}] - Query: "${query}"`);
      console.log(`📋 [SEARCH][${searchId}] - Duration: ${searchDuration}ms`);
      console.log(`📋 [SEARCH][${searchId}] - Results: ${searchResults?.length || 0}`);
      console.log(`📋 [SEARCH][${searchId}] - Final chat ID: ${chatIdToUse}`);
      console.log(`📋 [SEARCH][${searchId}] - Status: ${searchResults?.length > 0 ? 'SUCCESS' : 'FAILED'}`);
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
      isSearching,
      accessedWebsites,
      searchQuery,
      isSearchSidebarOpen,
      toggleSearchSidebar,
      internetSearchEnabled // Add to context so components can access this
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




























// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { filterDisclaimerMessages } from '../utils/messageFilters';

// Import for direct message filtering during search operations

// // Extend the Window interface to include custom properties for search debugging
// declare global {
//   interface Window {
//     _lastSearchUrl?: string;
//     _lastSearchQuery?: string;
//     _lastSearchError?: any;
//     _lastSearchErrorText?: string;
//     _lastSearchErrorResponse?: any;
//     _debugChatState?: any;
//   }
// }

// import { chatService } from '../services/api/chat.service';
// import toast from 'react-hot-toast';
// import { generateTitleFromMessage } from '../utils/titleGenerator';
// import { Agent } from '../types/agent';
// import { useLanguage } from './LanguageContext';
// import { checkApiEndpoint } from '../utils/apiUtils';


// interface Attachment {
//   id?: string;
//   type: string;
//   url: string;
//   name: string;
//   content_type?: string;
//   preview_url?: string;
// }

// interface Message {
//   id: string;
//   content: string;
//   role: 'user' | 'assistant' | 'system';
//   timestamp?: Date | string;
//   created_at?: string;
//   chat_id?: string;
//   attachments?: Attachment[];
//   isSearchResult?: boolean;
//   metadata?: string | Record<string, any>;
// }

// interface Chat {
//   id: string;
//   title: string;
//   messages: Message[];
//   created_at?: string; // For backend compatibility
//   updated_at?: string; // For backend compatibility
//   agent_id?: string; // Add agent_id to Chat interface
//   language?: string; // Add language property to Chat interface
// }

// export interface SearchResult {
//   title: string;
//   url: string;
//   snippet: string;
// }

// interface ChatContextType {
//   currentChat: Chat | null;
//   chats: Chat[];
//   loading: boolean;
//   error: string | null;
//   createNewChat: (customTitle?: string) => Promise<Chat | null>;
//   createAgentChat: () => Promise<Chat | null>; // Update createAgentChat method
//   setCurrentChat: (chat: Chat) => void;
//   addMessage: (message: { role: 'user' | 'assistant' | 'system'; content: string }) => Promise<void>;
//   deleteChat: (chatId: string) => Promise<void>;
//   updateChatTitle: (chatId: string, title: string) => Promise<void>;
//   selectedAgent: Agent | null; // Add selectedAgent state
//   setSelectedAgent: (agent: Agent | null) => void; // Add setSelectedAgent method
//   // Search-related properties and methods
//   isSearchMode: boolean;
//   toggleSearchMode: () => void;
//   searchResults: SearchResult[];
//   performSearch: (query: string, addUserMessage?: boolean) => Promise<SearchResult[]>;
//   isSearching: boolean;
//   accessedWebsites: {title: string, url: string}[];
//   searchQuery: string;
//   isSearchSidebarOpen: boolean;
//   toggleSearchSidebar: () => void;
//   internetSearchEnabled: boolean; // Indicates if internet search is currently active
//   setInternetSearchEnabled: (enabled: boolean) => void; // Add method to toggle internet search
// }

// // Create the context with TypeScript typing
// const ChatContext = createContext<ChatContextType | undefined>(undefined);

// // Define the chat provider component with proper React return type
// export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
//   const [currentChat, setCurrentChat] = useState<Chat | null>(null);
//   const [chats, setChats] = useState<Chat[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [errorState, setError] = useState<string | null>(null);
//   const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null); // Initialize selectedAgent state
//   const { language } = useLanguage(); // Get the current language
  
//   // Search-related state
//   const [isSearchMode, setIsSearchMode] = useState(false);
//   const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [accessedWebsites, setAccessedWebsites] = useState<{title: string, url: string}[]>([]);
//   const [searchQuery, setSearchQuery] = useState<string>('');
//   const [isSearchSidebarOpen, setIsSearchSidebarOpen] = useState(false);
//   const [internetSearchEnabled, setInternetSearchEnabled] = useState(false); // Track if internet search is active

//   useEffect(() => {
//     loadChats();
//   }, []);

//   const loadChats = async () => {
//     try {
//       setLoading(true);
//       const response = await chatService.getChats();
//       console.log('Chats loaded:', response.data);
//       setChats(response.data);
      
//       // Don't automatically set the first chat as current to allow welcome screen to show
//       // Only uncomment this if you want to auto-load the first chat
//       // if (response.data.length > 0 && !currentChat) {
//       //   setCurrentChat(response.data[0]);
//       // }
      
//       setError(null);
//     } catch (err: unknown) {
//       console.error('Error loading chats:', err);
//       console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
//       setError('Failed to load chats');
//       toast.error('Failed to load chats');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Effect to load full chat details (including messages) when currentChat.id changes
//   useEffect(() => {
//     const loadCurrentChatMessages = async () => {
//       if (currentChat?.id) {
//         // Optimization: If the currentChat object already has messages, and it's the same ID,
//         // assume they are sufficiently loaded. This avoids redundant fetches if the full chat object
//         // was already set (e.g., after creating a new chat or adding a message).
//         // A more robust check might involve looking at a `messages_loaded_fully` flag if available.
//         if (currentChat.messages && currentChat.messages.length > 0) {
//           console.log(`[ChatContext][useEffect] Chat ${currentChat.id} already has ${currentChat.messages.length} messages in state. Optimization: Skipping fetch. First message ID: ${currentChat.messages[0]?.id}`);
//           return;
//         }

//         console.log(`[ChatContext][useEffect] Chat ${currentChat.id} has no messages or messages are empty. Fetching full details... Current messages count: ${currentChat.messages?.length || 0}`);
//         setLoading(true);
//         try {
//           const freshChatResponse = await chatService.getChat(currentChat.id);
//           console.log(`[ChatContext][useEffect] Full chat ${currentChat.id} loaded:`, freshChatResponse.data);
//           // Update the currentChat state with the fully loaded chat object from the server
//           setCurrentChat(freshChatResponse.data);
//           console.log(`[ChatContext][useEffect] Successfully fetched and set messages for chat ${currentChat.id}. New messages count: ${freshChatResponse.data.messages?.length || 0}. Messages:`, freshChatResponse.data.messages);
//           setError(null);
//         } catch (err: unknown) {
//           console.error(`Error loading messages for chat ${currentChat.id}:`, err);
//           setError(`Failed to load messages for chat ${currentChat.title || 'the selected chat'}`);
//           toast.error(`Failed to load messages for ${currentChat.title || 'the selected chat'}`);
//         } finally {
//           setLoading(false);
//         }
//       }
//     };

//     loadCurrentChatMessages();
//   }, [currentChat?.id]); // Dependency array ensures this runs when currentChat.id changes

//   const createNewChat = async (customTitle?: string) => {
//     try {
//       setLoading(true);
//       console.log('Attempting to create a new chat with title:', customTitle || 'New Conversation');
      
//       // Format title appropriately if it's a search query
//       let finalTitle = customTitle || 'New Conversation';
//       if (customTitle?.startsWith('Search:')) {
//         // Title is already in search format
//         finalTitle = customTitle;
//       } else if (customTitle && !customTitle.startsWith('Search:') && internetSearchEnabled) {
//         // For search queries, add a prefix and truncate if necessary
//         finalTitle = `Search: ${customTitle.slice(0, 40)}${customTitle.length > 40 ? '...' : ''}`;
//       }
      
//       const response = await chatService.createChat({
//         title: finalTitle,
//         chat_type: 'default',
//         language: language.code // Include the selected language
//       });
//       console.log('Chat created response:', response);
      
//       const newChat = response.data;
//       setChats(prev => [newChat, ...prev]);
//       setCurrentChat(newChat);
      
//       toast.success('New chat created');
//       setError(null);
//       return newChat;
//     } catch (err) {
//       console.error('Failed to create new chat:', err);
//       toast.error('Failed to create new chat. Please try again.');
//       setError('Failed to create new chat');
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createAgentChat = async () => {
//     if (!selectedAgent) {
//       console.error('');
//       toast.error('');
//       return null;
//     }

//     try {
//       setLoading(true);
//       console.log(`Creating a new chat with agent ${selectedAgent.id}...`);
//       const response = await chatService.createChat({
//         agent_id: selectedAgent.id.toString(),
//         title: `Chat with ${selectedAgent.name}`,
//         chat_type: 'sales_agent',
//         language: selectedAgent.language || language.code
//       });
//       console.log('Agent chat created response:', response);
      
//       const newChat = response.data;
//       setChats(prev => [newChat, ...prev]);
//       setCurrentChat(newChat);
      
//       toast.success(`Chat with ${selectedAgent.name} created`);
//       setError(null);
//       return newChat;
//     } catch (err: unknown) {
//       console.error('Error creating agent chat:', err);
//       console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
//       setError('Failed to create agent chat');
//       toast.error('Failed to create agent chat');
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Add this function to get the chat's language or default to app language
//   // This function is kept for future language handling but currently not used
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const getChatLanguage = (chat: Chat | null) => {
//     if (chat && chat.language) {
//       return chat.language;
//     }
//     return language.code;
//   };

//   const addMessage = async ({ role, content }: { role: 'user' | 'assistant' | 'system'; content: string }) => {
//     let chatToUse = currentChat;
    
//     // If we don't have a current chat, create one, but ONLY IF NECESSARY
//     if (!chatToUse) {
//       console.log('[ChatContext][addMessage] No current chat found. Creating a new chat first.');
//       try {
//         // Create a new chat and get the newly created chat object
//         const newChat = await createNewChat();
        
//         if (!newChat) {
//           console.error('[ChatContext][addMessage] Failed to create a new chat - createNewChat returned null/undefined');
//           toast.error('Cannot send message: Unable to create a chat.');
//           return;
//         }
        
//         // Use this newly created chat for our message
//         chatToUse = newChat;
//         console.log(`[ChatContext][addMessage] Successfully created new chat with ID: ${chatToUse.id}`);
//       } catch (err: unknown) {
//         console.error('[ChatContext][addMessage] Error creating new chat for message:', err);
//         console.error('[ChatContext][addMessage] Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
//         toast.error('Cannot send message: Failed to create a chat.');
//         return;
//       }
//     }
    
//     // Create optimistic update
//     const tempId = Date.now().toString();
//     const tempMessage: Message = {
//       id: tempId,
//       content,
//       role,
//       timestamp: new Date().toISOString(),
//       created_at: new Date().toISOString(),
//       chat_id: chatToUse.id // Use chatToUse instead of currentChat
//     };

//     // Optimistically add the message to the UI
//     setCurrentChat(prev => {
//       if (!prev) return null;
//       return {
//         ...prev,
//         messages: [...prev.messages, tempMessage]
//       };
//     });

//     try {
//       // At this point chatToUse should always be defined
//       const activeChatId = chatToUse.id;
//       console.log(`[ChatContext][addMessage] Sending message to chat ${activeChatId}:`, { content, role });
//       console.log(`[ChatContext][addMessage] Detailed chat info: ID=${chatToUse.id}, Title=${chatToUse.title}, MessageCount=${chatToUse.messages?.length || 0}`);

//       // Include internetSearchEnabled flag in the message data
//       const messageData = { 
//         content, 
//         role,
//         searchModeActive: internetSearchEnabled // Pass the current search mode state
//       };
//       console.log(`[ChatContext][addMessage] Sending message with searchModeActive=${internetSearchEnabled}`);
//       const addedMessageResponse = await chatService.addMessage(activeChatId, messageData);
//       const newlyAddedMessage: Message = addedMessageResponse.data;

//       console.log(`[ChatContext][addMessage] Message successfully added via API for chat ${activeChatId}. New message ID: ${newlyAddedMessage.id}.`);

//       // Crucial Step: Refetch the entire chat to get the most up-to-date state from the server
//       console.log(`[ChatContext][addMessage] Refetching chat ${activeChatId} to ensure UI consistency.`);
//       const updatedChatResponse = await chatService.getChat(activeChatId);
//       const fullyUpdatedChat: Chat = updatedChatResponse.data;

//       console.log(`[ChatContext][addMessage] Successfully refetched chat ${activeChatId}. Full data:`, fullyUpdatedChat);
//       console.log(`[ChatContext][addMessage] Messages in refetched chat:`, fullyUpdatedChat.messages);

//       // Update the currentChat state with the fully loaded chat object
//       setCurrentChat(fullyUpdatedChat);

//       // Update the chats array in the state
//       setChats(prevChats =>
//         prevChats.map(chat =>
//           chat.id === activeChatId ? fullyUpdatedChat : chat
//         )
//       );

//       // Generate title for the chat if this is the first user message and title is still default
//       if (role === 'user' && 
//           fullyUpdatedChat.title === 'New Chat' && 
//           fullyUpdatedChat.messages.filter(msg => msg.role === 'user').length === 1) {
//         console.log(`[ChatContext][addMessage] First user message in 'New Chat'. Generating title for chat ${activeChatId}.`);
//         const generatedTitle = generateTitleFromMessage(content);
//         await updateChatTitle(activeChatId, generatedTitle); // This might trigger another fetch if updateChatTitle modifies and refetches.
//       }

//       setError(null);
//     } catch (err: unknown) {
//       console.error(`[ChatContext][addMessage] Error during addMessage for chat ${chatToUse?.id || 'UNKNOWN_CHAT_ID'}:`, err);
//       toast.error('Failed to send message. Please try again.');

//       // Revert optimistic message on error
//       setCurrentChat(prev => {
//         if (!prev) return null;
//         return {
//           ...prev,
//           messages: prev.messages.filter(msg => msg.id !== tempId)
//         };
//       });
//       setError('Failed to send message');
//     }
//   };

//   const deleteChat = async (chatId: string) => {
//     try {
//       await chatService.deleteChat(chatId);
      
//       setChats(prev => prev.filter(chat => chat.id !== chatId));
      
//       if (currentChat?.id === chatId) {
//         const remainingChats = chats.filter(chat => chat.id !== chatId);
//         setCurrentChat(remainingChats.length > 0 ? remainingChats[0] : null);
//       }
      
//       toast.success('Chat deleted');
//     } catch (err: unknown) {
//       console.error('Error deleting chat:', err);
//       console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
//       toast.error('Failed to delete chat');
//     }
//   };

//   const updateChatTitle = async (chatId: string, title: string) => {
//     try {
//       const response = await chatService.updateChatTitle(chatId, title);
//       const updatedChat = response.data as Chat;
      
//       setChats(prev => 
//         prev.map(chat => chat.id === chatId ? updatedChat : chat)
//       );
      
//       if (currentChat?.id === chatId) {
//         setCurrentChat(updatedChat);
//       }
      
//       toast.success('Chat title updated');
//     } catch (err: unknown) {
//       console.error('Error updating chat title:', err);
//       console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
//       toast.error('Failed to update chat title');
//     }
//   };

//   // Toggle the search mode and ensure we maintain state properly
//   const toggleSearchMode = (): void => {
//     const newSearchModeValue = !isSearchMode;
//     console.debug(`🔍 [DEBUG][ChatContext] Toggling search mode from ${isSearchMode} to ${newSearchModeValue}`);
    
//     // Set internet search enabled when turning on search mode
//     if (newSearchModeValue) {
//       console.debug('🔍 [DEBUG][ChatContext] Enabling internet search with search mode');
//       setInternetSearchEnabled(true);
      
//       // Safe access to window._debugChatState to avoid TypeScript errors
//       try {
//         if (typeof window !== 'undefined') {
//           window._debugChatState = {
//             ...(window._debugChatState || {}),
//             internetSearchEnabled: true,
//             toggledAt: new Date().toISOString(),
//             searchModeEnabled: true
//           };
//         }
//       } catch (error) {
//         console.error('Error updating debug state:', error);
//       }
//     }
    
//     setIsSearchMode(newSearchModeValue);
    
//     if (!newSearchModeValue) {
//       console.debug('🔍 [DEBUG][ChatContext] Clearing search results when disabling search mode');
//       setSearchResults([]);
//     }
//   };

//   // Toggle search sidebar visibility
//   const toggleSearchSidebar = () => {
//     const newValue = !isSearchSidebarOpen;
//     console.debug(`🔍 [DEBUG][ChatContext] Toggling search sidebar from ${isSearchSidebarOpen} to ${newValue}`);
//     setIsSearchSidebarOpen(newValue);
//   };
  
//   /**
//    * Refresh chat with filtering functionality
//    * This is a helper method used during search operations to refresh
//    * the chat and apply filtering to remove AI disclaimers
//    */
//   const refreshChatWithFiltering = async (chatId: string, searchOpId: string): Promise<void> => {
//     try {
//       if (!chatId) {
//         console.error(`❌ [FINAL REFRESH][${searchOpId}] No chat ID provided for refresh`);
//         return;
//       }
      
//       const refreshResponse = await chatService.getChat(chatId);
//       if (!refreshResponse?.data) {
//         console.error(`❌ [FINAL REFRESH][${searchOpId}] Failed to fetch chat data`);
//         return;
//       }
      
//       // Apply one last round of filtering when internet search is enabled
//       // This catches any late-arriving AI disclaimers
//       // Apply one last round of filtering when internet search is enabled
//       // This catches any late-arriving AI disclaimers
//       let finalMessages = refreshResponse.data.messages;
      
//       if (internetSearchEnabled) {
//         console.log(`🔍 [FINAL REFRESH][${searchOpId}] Internet search active - applying aggressive filtering to ${refreshResponse.data.messages.length} messages`);
        
//         // First, identify and preserve any search result messages
//         const preservedMessages = preserveSearchResultMessages(refreshResponse.data.messages);
//         console.log(`🔍 [FINAL REFRESH][${searchOpId}] Found ${preservedMessages.filter(m => m.isSearchResult).length} search result messages to preserve`);
        
//         // Filter out unwanted AI messages one last time
//         const finalFilteredMessages = refreshResponse.data.messages.filter(msg => {
//           // Debug logging for each message during filtering
//           console.debug(`🔍 [FINAL REFRESH][${searchOpId}][Message:${msg.id}] Processing role=${msg.role}, isSearchResult=${!!msg.isSearchResult}`);
          
//           // Always keep search results
//           if ((msg.content && (msg.content.startsWith('🔍') || msg.content.includes('[SEARCH_RESULTS]'))) || 
//               msg.isSearchResult === true || 
//               (msg.metadata && typeof msg.metadata === 'string' && msg.metadata.includes('isSearchResult'))) {
//             console.debug(`✅ [FINAL REFRESH][${searchOpId}][Message:${msg.id}] KEEPING - confirmed search result`);
//             return true; // Always preserve search results
//           }
          
//           if (msg.role === 'assistant') {
//             console.debug(`🔍 [FINAL REFRESH][${searchOpId}][Message:${msg.id}] Processing assistant message: "${msg.content.substring(0, 100)}..."`);
//             const processedMsg = processIncomingMessage(msg);
            
//             if (processedMsg === null) {
//               console.warn(`⛔ [FINAL REFRESH][${searchOpId}][Message:${msg.id}] FILTERED OUT - identified as knowledge cutoff disclaimer`);
//               return false;
//             }
            
//             console.debug(`✅ [FINAL REFRESH][${searchOpId}][Message:${msg.id}] KEEPING - passed filtering`);
//             return true;
//           }
          
//           // Keep user messages
//           if (msg.role === 'user') {
//             console.debug(`✅ [FINAL REFRESH][${searchOpId}][Message:${msg.id}] KEEPING - user message`);
//             return true;
//           }
          
//           console.debug(`⚠️ [FINAL REFRESH][${searchOpId}][Message:${msg.id}] Default keep for role: ${msg.role}`);
//           return true; // Default keep
//         });
        
//         finalMessages = finalFilteredMessages;
        
//         // Set the current chat with filtered messages
//         setCurrentChat({
//           ...refreshResponse.data,
//           messages: finalFilteredMessages
//         });
        
//         console.log(`🔍 [FINAL REFRESH][${searchOpId}] Filtered ${refreshResponse.data.messages.length - finalFilteredMessages.length} messages during final refresh`);
//       } else {
//         // Normal mode - don't filter messages
//         setCurrentChat(refreshResponse.data);
//       }
      
//       console.log(`🏁 [SEARCH][${searchOpId}] Successfully refreshed chat ${chatId} with ${refreshResponse.data.messages?.length || 0} messages`);
//       console.log(`🏁 [SEARCH][${searchOpId}] Internet search state: ${internetSearchEnabled ? 'ENABLED' : 'DISABLED'}`);
      
//       // Important: Update debug state to track interactivity
//       try {
//         if (typeof window !== 'undefined') {
//           window._debugChatState = {
//             ...(window._debugChatState || {}),
//             lastRefreshComplete: new Date().toISOString(),
//             finalMessageCount: refreshResponse.data.messages?.length,
//             filteredMessageCount: finalMessages.length,
//             messagesFiltered: refreshResponse.data.messages?.length - finalMessages.length,
//             internetSearchStillEnabled: internetSearchEnabled
//           };
//         }
//       } catch (error) {
//         console.error('[DEBUG] Error updating debug state:', error);
//       }
//     } catch (error) {
//       console.error(`❌ [FINAL REFRESH][${searchOpId}] Error during final refresh:`, error);
//     }
//   };

//   /**
//    * Pre-filter function with enhanced pattern matching to detect and block generic AI disclaimers
//    * Also provides detailed debug logging to track message processing flow
//    */
//   const processIncomingMessage = (msg: Message | null) => {
//     if (!msg) {
//       console.debug(`🚫 [MESSAGE FILTER][Process] Skipping null message`);
//       return null;
//     }
    
//     console.log(`📝 [MESSAGE FILTER][${msg.id}][Process] Processing message - role=${msg.role}, internetSearch=${internetSearchEnabled}`);
    
//     // Always allow user messages to pass through
//     if (msg.role === 'user') {
//       console.debug(`✅ [MESSAGE FILTER][${msg.id}] User message - always allow`);
//       return msg;
//     }
    
//     // ENHANCED: More robust detection of search result messages that should ALWAYS be preserved
//     // Check multiple indicators that this might be a search result
//     const isSearchResultMessage = (
//       // Content indicators
//       msg.content?.startsWith('🔍') || 
//       msg.content?.includes('[SEARCH_RESULTS]') ||
//       msg.content?.includes('Search results for') ||
//       msg.content?.includes('Here are some search results') ||
//       msg.content?.includes('Based on my search') ||
//       msg.content?.includes('According to the search results') ||
//       // Flag indicators
//       msg.isSearchResult === true || 
//       // Metadata indicators
//       (msg.metadata && (
//         (typeof msg.metadata === 'string' && msg.metadata.includes('isSearchResult')) ||
//         (typeof msg.metadata === 'object' && msg.metadata.isSearchResult)
//       ))
//     );
    
//     if (isSearchResultMessage) {
//       console.log(`✅ [MESSAGE FILTER][${msg.id}] PRESERVING search result message`);
//       console.debug(`💡 [MESSAGE FILTER][${msg.id}] Search result content preview: "${msg.content?.substring(0, 50)}..."`);
      
//       // Force setting searchResult flag
//       return {
//         ...msg,
//         isSearchResult: true,
//         // Update metadata to indicate this is a search result
//         metadata: msg.metadata 
//           ? typeof msg.metadata === 'string'
//             ? msg.metadata.includes('isSearchResult') 
//               ? msg.metadata 
//               : `${msg.metadata};isSearchResult=true`
//             : { ...msg.metadata, isSearchResult: true }
//           : 'isSearchResult=true'
//       };
//     }
    
//     // SUPER AGGRESSIVE FILTERING: First apply our own direct checks for knowledge cutoff
//     if (internetSearchEnabled && msg.role === 'assistant' && msg.content) {
      
//       // ENHANCED: More comprehensive patterns to detect knowledge cutoff disclaimers
//       const knowledgeCutoffPatterns = [
//         // Standard AI model disclaimers
//         /(?:I('m| am) an AI language model|As an AI language model|I('m| am) an AI assistant|As an AI assistant)(?:.*?)(?:trained up to|knowledge cutoff|latest|current|real-time)/i,
        
//         // Disclaimers about browsing/search capabilities
//         /(?:I don't have|I do not have)(?:.*?)(?:ability to browse|search the web|access to the internet|browse the internet|search capabilities|browsing capabilities)/i,
        
//         // Disclaimers about knowledge timeframe
//         /(?:I don't have|I do not have)(?:.*?)(?:information beyond|information after|trained with data|trained on data|data only goes|last updated|last trained)/i,
        
//         // Specific date cutoff mentions
//         /(?:knowledge|training|data)(?:.*?)(?:cutoff|up to|until)(?:.*?)(?:202[0-3]|January|February|March|April|May|June|July|August|September|October|November|December)/i,
        
//         // Apologies for not having current information
//         /(?:I apologize|I'm sorry|Sorry)(?:.*?)(?:don't have|do not have|cannot access|can't access|unable to access)(?:.*?)(?:current|latest|up-to-date|real-time|recent)/i,
        
//         // Direct OpenAI model mentions
//         /(?:as a|I am a|I'm a)(?:.*?)(?:GPT|ChatGPT|language model|AI model)(?:.*?)(?:developed by|created by|made by|from)(?:.*?)(?:OpenAI)/i,
        
//         // Knowledge limitations
//         /(?:my knowledge|my information|my training data|my training|what I know)(?:.*?)(?:limited to|only up to|only includes|has a cutoff|ends at)/i
//       ];
      
//       // ENHANCED: More comprehensive list of disclaimer phrases
//       const disclaimerPhrases = [
//         // Internet access disclaimers
//         "I don't have the ability to browse",
//         "I don't have access to the internet",
//         "I don't have access to real-time information",
//         "I don't have access to current information",
//         "I don't have the ability to search the web",
//         "I cannot browse the internet",
//         "I cannot search the web",
//         "I cannot access the internet",
//         "I cannot access real-time information",
//         "I cannot access current information",
//         "I don't have the capability to search",
//         "I don't have the capability to browse",
//         "I'm unable to browse the internet",
//         "I'm unable to search the web",
//         "I'm not able to access the internet",
//         "I'm not able to browse the web",
//         "I'm not able to search online",
        
//         // Knowledge limitation disclaimers
//         "my knowledge is limited to",
//         "my training data only goes up to",
//         "my training only includes information up to",
//         "my training data has a cutoff date",
//         "I was last trained on",
//         "my knowledge cutoff is",
//         "my training cutoff is",
//         "my training data is limited to",
//         "I only have information up to",
//         "I only have data until",
//         "I only have knowledge until",
//         "my knowledge base only extends to",
//         "my information is not up to date beyond",
//         "I don't have information about events after",
//         "I don't have information about events that occurred after",
//         "I don't have information about events that have occurred after",
//         "I don't have information about events that took place after",
//         "I don't have information about events that have taken place after",
//         "I don't have access to information beyond",
//         "I don't have access to information after",
//         "I don't have access to data beyond",
//         "I don't have access to data after",
        
//         // Model identity disclaimers
//         "I am an AI language model",
//         "I'm an AI language model",
//         "as an AI language model",
//         "I am an AI assistant",
//         "I'm an AI assistant",
//         "as an AI assistant",
//         "I am a large language model",
//         "I'm a large language model",
//         "as a large language model",
//         "I am an artificial intelligence",
//         "I'm an artificial intelligence",
//         "as an artificial intelligence",
//       ];
      
//       // Check for regex patterns first
//       for (const pattern of knowledgeCutoffPatterns) {
//         if (pattern.test(msg.content)) {
//           console.log(`🔍 [MESSAGE FILTER][${msg.id}] Detected knowledge cutoff pattern, removing message`);
//           console.log(`🔍 [MESSAGE FILTER][${msg.id}] Matched pattern: ${pattern}`);
//           console.log(`🔍 [MESSAGE FILTER][${msg.id}] Message preview: "${msg.content.substring(0, 150)}..."`);
          
//           // Try to delete the message if it has an ID and we have a chat ID
//           if (msg.id && currentChat?.id) {
//             try {
//               chatService.deleteMessage(currentChat.id, msg.id)
//                 .then(() => console.log(`🚫 [MESSAGE FILTER][${msg.id}] Successfully deleted AI disclaimer message`))
//                 .catch(e => console.error(`❌ [MESSAGE FILTER][${msg.id}] Error deleting disclaimer message`, e));
//             } catch (e) {
//               console.error(`❌ [MESSAGE FILTER][${msg.id}] Failed to delete AI disclaimer message`, e);
//             }
//           }
          
//           // Return null to completely remove this message
//           return null;
//         }
//       }
      
//       // Check for specific disclaimer phrases
//       for (const phrase of disclaimerPhrases) {
//         if (msg.content.toLowerCase().includes(phrase.toLowerCase())) {
//           console.log(`🔍 [MESSAGE FILTER][${msg.id}] Detected disclaimer phrase: "${phrase}", removing message`);
//           console.log(`🔍 [MESSAGE FILTER][${msg.id}] Message preview: "${msg.content.substring(0, 150)}..."`);
          
//           // Try to delete the message if it has an ID and we have a chat ID
//           if (msg.id && currentChat?.id) {
//             try {
//               chatService.deleteMessage(currentChat.id, msg.id)
//                 .then(() => console.log(`🚫 [MESSAGE FILTER][${msg.id}] Successfully deleted AI disclaimer message`))
//                 .catch(e => console.error(`❌ [MESSAGE FILTER][${msg.id}] Error deleting disclaimer message`, e));
//             } catch (e) {
//               console.error(`❌ [MESSAGE FILTER][${msg.id}] Failed to delete AI disclaimer message`, e);
//             }
//           }
          
//           // Return null to completely remove this message
//           return null;
//         }
//       }
      
//       // Special case: Check for messages that are ONLY apologies
//       // These are often the start of disclaimers
//       if (msg.content.length < 150 && /^(I('m| am) sorry|Sorry|I apologize)/i.test(msg.content.trim())) {
//         console.log(`🔍 [MESSAGE FILTER][${msg.id}] Detected standalone apology message, likely a disclaimer start`);
//         console.log(`🔍 [MESSAGE FILTER][${msg.id}] Message preview: "${msg.content}"`);
        
//         // Try to delete the message if it has an ID and we have a chat ID
//         if (msg.id && currentChat?.id) {
//           try {
//             chatService.deleteMessage(currentChat.id, msg.id)
//               .then(() => console.log(`🚫 [MESSAGE FILTER][${msg.id}] Successfully deleted standalone apology message`))
//               .catch(e => console.error(`❌ [MESSAGE FILTER][${msg.id}] Error deleting apology message`, e));
//           } catch (e) {
//             console.error(`❌ [MESSAGE FILTER][${msg.id}] Failed to delete apology message`, e);
//           }
//         }
        
//         // Return null to completely remove this message
//         return null;
//       }
      
//       console.debug(`🔍 [MESSAGE FILTER][${msg.id}] Message passed all filters and will be displayed`);
//     }
    
//     return msg;
//   };

//   /**
//    * Robust function to identify and preserve search result messages that shouldn't be filtered
//    * This ensures search results are properly maintained in the chat
//    */
//   const preserveSearchResultMessages = (messages: Message[]): Message[] => {
//     if (!messages || !Array.isArray(messages)) {
//       console.error('❌ [PRESERVE] Invalid messages array provided', messages);
//       return [];
//     }
    
//     console.debug(`🔍 [SEARCH][Preserve] Analyzing ${messages.length} messages for search results`); 
    
//     const updatedMessages = [...messages];
    
//     // ENHANCED: More comprehensive detection of search result messages
//     const searchResults = updatedMessages.filter(msg => {
//       // Skip null messages or non-assistant messages
//       if (!msg || msg.role !== 'assistant') return false;
      
//       // Check explicit flags first
//       if (msg.isSearchResult === true) {
//         console.debug(`✅ [SEARCH][Preserve] Message ${msg.id} already flagged as search result`);
//         return true;
//       }
      
//       // Check metadata
//       if (msg.metadata) {
//         if (typeof msg.metadata === 'string' && msg.metadata.includes('isSearchResult')) {
//           console.debug(`✅ [SEARCH][Preserve] Message ${msg.id} has string metadata indicating search result`);
//           return true;
//         }
//         if (typeof msg.metadata === 'object' && msg.metadata.isSearchResult) {
//           console.debug(`✅ [SEARCH][Preserve] Message ${msg.id} has object metadata indicating search result`);
//           return true;
//         }
//       }
      
//       // Check content patterns
//       if (msg.content) {
//         // Direct indicators
//         if (msg.content.startsWith('🔍') || 
//             msg.content.includes('[SEARCH_RESULTS]')) {
//           console.debug(`✅ [SEARCH][Preserve] Message ${msg.id} has direct search result indicator`);
//           return true;
//         }
        
//         // Common search result phrases
//         const searchPhrases = [
//           'Search results for:',
//           'Here are some search results',
//           'Based on my search',
//           'According to the search results',
//           'From the search results',
//           'The search results show',
//           'Based on the information I found',
//           'According to the information I found online',
//           'From what I could find online',
//           'Based on the latest information available',
//           'According to recent information',
//           'From my search, I found that',
//           'The search indicates that',
//           'Based on current information',
//           'According to the latest data',
//           'From the sources I found',
//           'Based on the articles I found',
//           'According to the websites I checked',
//           'From reliable sources online',
//         ];
        
//         for (const phrase of searchPhrases) {
//           if (msg.content.includes(phrase)) {
//             console.debug(`✅ [SEARCH][Preserve] Message ${msg.id} contains search phrase: "${phrase}"`);
//             return true;
//           }
//         }
        
//         // Check for URLs in the content which often indicate search results
//         if (/https?:\/\/[\w\.-]+\.[a-zA-Z]{2,}/.test(msg.content)) {
//           console.debug(`✅ [SEARCH][Preserve] Message ${msg.id} contains URLs, likely search result`);
//           return true;
//         }
//       }
      
//       return false;
//     });
    
//     searchResults.forEach(msg => {
//       const index = updatedMessages.findIndex(m => m.id === msg.id);
//       if (index !== -1) {
//         updatedMessages[index] = {
//           ...updatedMessages[index],
//           isSearchResult: true,
//           metadata: updatedMessages[index].metadata 
//             ? typeof updatedMessages[index].metadata === 'string'
//               ? updatedMessages[index].metadata.includes('isSearchResult') 
//                 ? updatedMessages[index].metadata 
//                 : updatedMessages[index].metadata + ';isSearchResult=true'
//               : { ...updatedMessages[index].metadata, isSearchResult: true }
//             : 'isSearchResult=true'
//         };
//         console.debug(`✅ [SEARCH][Preserve] Marked message ${msg.id} as search result`);
//       }
//     });
    
//     console.log(`🔍 [PRESERVE] Marked ${searchResults.length} messages as search results`);
//     return updatedMessages;
//   };
  
//   // Perform web search using the Search API
//   // This function handles search functionality and returns search results
//   // Explicitly declare return type to resolve type issues
//   const performSearchInternal = async (query: string, addUserMessage = true): Promise<SearchResult[]> => {
//     // Don't allow searches if already searching
//     if (isSearching) {
//       console.log('⚠️ [SEARCH] Cannot search, search already in progress');
//       return [];
//     }
    
//     // We can proceed even without a current chat - we'll create one

//     // Declare all shared variables at the top
//     const searchId = `search-${Date.now()}`;
//     const searchStartTime = Date.now();
//     let chatIdToUse = currentChat?.id;
//     let searchResults: SearchResult[] = [];
//     let suppressInitialResponse = false;

//     // Early return for empty query with refresh logic
//     if (!query || query.trim() === '') {
//       // Empty query, just refresh the chat
//       console.log(`ℹ️ [SEARCH][${searchId}] Empty search query. Refreshing chat.`);
//       if (internetSearchEnabled) {
//         console.log(`ℹ️ [SEARCH][${searchId}] Internet search mode enabled. Refreshing with filtering.`);
//         try {
//           setLoading(true);
//           if (chatIdToUse) {
//             await refreshChatWithFiltering(chatIdToUse, searchId);
//           }
//           // Refresh the chats list from the API
//           const chatsResponse = await chatService.getChats();
//           if (chatsResponse?.data) {
//             setChats(chatsResponse.data);
//           }
//         } finally {
//           setLoading(false);
//           // Keep internet search mode enabled until explicitly disabled by user
//           console.log(`⚠️ [SEARCH][${searchId}] Empty query, but keeping internet search mode enabled.`);
//         }
//       }
//       return []; // Explicit return
//     }

//     // Ensure we have a valid chat to use
//     if (!chatIdToUse) {
//       console.log(`[ChatContext][performSearch][${searchId}] No chat ID available for search, creating new chat`);
//       // Create a new chat if needed
//       try {
//         // Force create a new chat for search with proper title
//         const newChat = await chatService.createChat({
//           title: `Search: ${query.slice(0, 40)}${query.length > 40 ? '...' : ''}`,
//           chat_type: 'default',
//           language: language.code
//         });
        
//         if (newChat?.data && newChat.data.id) {
//           chatIdToUse = newChat.data.id;
//           // Update the chats list and set current chat
//           setChats(prev => [newChat.data, ...prev]);
//           setCurrentChat(newChat.data);
//           console.log(`✅ [SEARCH][${searchId}] Successfully created new chat ${chatIdToUse} for search`);
//         } else {
//           console.error(`[ChatContext][performSearch][${searchId}] Failed to create new chat`);
//           setInternetSearchEnabled(false);
//           setIsSearching(false);
//           return []; // Explicit return
//         }
//       } catch (error) {
//         console.error(`❌ [SEARCH][${searchId}] Error creating new chat:`, error);
//         setInternetSearchEnabled(false);
//         setIsSearching(false);
//         return []; // Explicit return
//       }
//     } else {
//       console.log(`[ChatContext][performSearch][${searchId}] Using existing chat with ID: ${chatIdToUse}`);
//     }

//     // Add the user message to the chat if requested
//     // This way we will see the user's query in the UI
//     if (addUserMessage && query.trim()) {
//       console.log(`[ChatContext][performSearch][${searchId}] Adding user query as message to chat ${chatIdToUse}`);
//       try {
//         // Send the user message directly to the chat service with suppressAiResponse=true
//         await chatService.addMessage(chatIdToUse, { 
//           role: 'user', 
//           content: query,
//           suppressAiResponse: true,
//           searchModeActive: true,
//         });
        
//         // Refresh the chat to make sure we have the latest messages
//         const updatedChat = await chatService.getChat(chatIdToUse);
//         if (updatedChat?.data) {
//           // Update the current chat to show the user message immediately
//           setCurrentChat(updatedChat.data);
//           console.log(`✅ [SEARCH][${searchId}] Updated current chat with user message`);
          
//           // Filter messages to ensure no disclaimers appear
//           if (internetSearchEnabled) {
//             console.log(`🔍 [SEARCH][${searchId}] Filtering messages during user message refresh`);
//             const filteredMessages = updatedChat.data.messages.filter(msg => {
//               // Always keep search results messages
//               if (msg.content && (msg.content.startsWith('[SEARCH_RESULTS]') || msg.content.startsWith('🔍') || msg.isSearchResult === true)) {
//                 console.log("✅ [ChatContext] Keeping search results message during refresh");
//                 return true;
//               }
              
//               // For assistant messages, process through our filter
//               if (msg.role === 'assistant') {
//                 // When in internet search mode, apply aggressive filtering
//                 if (internetSearchEnabled) {
//                   // CRITICAL: Always preserve messages explicitly marked as search results
//                   if (msg.isSearchResult === true) {
//                     console.log(`✅ [REFRESH] Preserving search result message: ${msg.id}`);
//                     return true;
//                   }
                  
//                   // Process the message through our filter
//                   const processedMsg = processIncomingMessage(msg);
//                   return processedMsg !== null;
//                 }
//               }
              
//               return true;
//             });
            
//             const filteredChat = {
//               ...updatedChat.data,
//               messages: filteredMessages
//             };
            
//             setCurrentChat(filteredChat);
//           }
//         }
//       } catch (error) {
//         console.error(`❌ [SEARCH][${searchId}] Error adding user message:`, error);
//       }
      
//       setLoading(true);
      
//       // CRITICAL - Set internet search flag to true whenever we perform a search
//       // This ensures the disclaimer filtering will be active
//       if (!internetSearchEnabled) {
//         console.log(`🔍 [SEARCH][${searchId}][FLAGS] Internet search was OFF, explicitly enabling it now`);
//         setInternetSearchEnabled(true);
//       } else {
//         console.log(`🔍 [SEARCH][${searchId}][FLAGS] Internet search already enabled`);
//       }
      
//       // Verify the internet search flag is active in window debug state
//       try {
//         if (typeof window !== 'undefined') {
//           window._debugChatState = {
//             ...(window._debugChatState || {}),
//             searchStarted: new Date().toISOString(),
//             searchId,
//             searchQuery: query,
//             internetSearchEnabled: true,
//             suppressInitialResponse: suppressInitialResponse // <-- Fix for line 876
//           };
//           console.log(`🔍 [SEARCH][${searchId}][DEBUG] Updated window debug state, internetSearchEnabled=${window._debugChatState.internetSearchEnabled}`);
//         }
//       } catch (error) {
//         console.error(`❌ [SEARCH][${searchId}][ERROR] Failed to update debug state:`, error);
//       }
      
//       let extractedResults: SearchResult[] = [];
      
//       // Check if the API endpoint is available - this prevents the entire app from crashing
//       console.log(`🔍 [SEARCH][${searchId}][API] Checking if search API is available...`);
//       const apiEndpointAvailable = await checkApiEndpoint('/api/search');
      
//       if (!apiEndpointAvailable) {
//         console.error(`❌ [SEARCH][${searchId}][API] Search API endpoint unavailable!`); 
//         toast.error('Search is currently unavailable. Please try again later.');
//         throw new Error(`Search API unavailable`); 
//       }
      
//       console.log(`✅ [SEARCH][${searchId}][API] Search API endpoint is available and responding`);

      
//       console.log(`[ChatContext][performSearch][${searchId}] Preparing search URL for query: "${query}"`); 
      
//       // Debug logging
//       try {
//         if (typeof window !== 'undefined') {
//           window._debugChatState = {
//             ...(window._debugChatState || {}),
//             lastSearchStarted: new Date().toISOString(),
//             searchQuery: query,
//             internetSearchEnabled: internetSearchEnabled
//           };
//         }
//       } catch (error) {
//         console.error('[DEBUG] Error updating debug state:', error);
//       }
      
//       // Create a URL for the search API request
//       const searchUrl = `/api/search?q=${encodeURIComponent(query)}${internetSearchEnabled ? '&internet=true' : ''}`;
      
//       // Set debug information for troubleshooting
//       try {
//         if (typeof window !== 'undefined') {
//           window._lastSearchUrl = searchUrl;
//           window._lastSearchQuery = query;
//         }
//       } catch (error) {
//         console.error('Error setting debug data:', error);
//       }
      
//       // The main search function - fetch results from the API
//       console.log(`[ChatContext][performSearch][${searchId}] Fetching search results from: ${searchUrl}`);
//       const response = await fetch(searchUrl);
      
//       if (!response.ok) {
//         // Handle error response with safe window access
//         try {
//           if (typeof window !== 'undefined') {
//             window._lastSearchErrorResponse = response;
//             window._lastSearchErrorText = await response.text();
//           }
//         } catch (error) {
//           console.error('Error setting error response debug data:', error);
//         }
//         throw new Error(`Search API returned ${response.status}: ${response.statusText}`);
//       }
      
//       // Parse the search results
//       let searchData;
//       try {
//         searchData = await response.json();
//         console.log(`[ChatContext][performSearch][${searchId}] Search response received:`, searchData);
//       } catch (parseError) {
//         console.error(`[ChatContext][performSearch][${searchId}] Error parsing search results:`, parseError);
//         throw new Error('Invalid search results format');
//       }
      
//       // Process the search results based on multiple possible response formats
//       // Handle various response structures we might get from different APIs
      
//       if (searchData) {
//         // First format: Direct SearchResult[] array
//         if (Array.isArray(searchData) && searchData.length > 0 && 
//           typeof searchData[0].title === 'string' && 
//           typeof searchData[0].url === 'string' &&
//           typeof searchData[0].snippet === 'string') {
//           extractedResults = searchData as SearchResult[];
//           console.log(`[ChatContext][performSearch][${searchId}] Direct array format detected with ${extractedResults.length} results`);
//         } 
//         // Second format: { results: SearchResult[] }
//         else if (searchData.results && Array.isArray(searchData.results)) {
//           extractedResults = searchData.results;
//           console.log(`[ChatContext][performSearch][${searchId}] Results property format detected with ${extractedResults.length} results`);
//         }
//         // Third format: { organic: { results: {...}[] } } (like Brave Search API)
//         else if (searchData.organic && Array.isArray(searchData.organic.results)) {
//           extractedResults = searchData.organic.results.map((item: any) => ({
//             title: item.title || '',
//             url: item.url || '',
//             snippet: item.description || ''
//           }));
//           console.log(`[ChatContext][performSearch][${searchId}] Brave Search format detected with ${extractedResults.length} results`);
//         }
//         // Fourth format: { items: [...] } (like Google Search API)
//         else if (searchData.items && Array.isArray(searchData.items)) {
//           extractedResults = searchData.items.map((item: any) => ({
//             title: item.title || '',
//             url: item.link || item.url || '',
//             snippet: item.snippet || item.description || ''
//           }));
//           console.log(`[ChatContext][performSearch][${searchId}] Google-like format detected with ${extractedResults.length} results`);
//         }
//         else {
//           console.error(`[ChatContext][performSearch][${searchId}] Unrecognized search results format:`, searchData);
//           throw new Error('Unrecognized search results format');
//         }
//       } else {
//         console.error(`[ChatContext][performSearch][${searchId}] Empty search data returned`);
//         throw new Error('No search results returned');
//       }
      
//       // Update state with the search results
//       searchResults = extractedResults;
//       setSearchResults(extractedResults);
//       console.log(`[ChatContext][performSearch][${searchId}] Search results set in state:`, extractedResults);
      
//       // Update accessedWebsites for the search sidebar
//       if (extractedResults.length > 0) {
//         const websites = extractedResults.map(result => ({
//           title: result.title,
//           url: result.url
//         }));
//         setAccessedWebsites(websites);
//         console.log(`[ChatContext][performSearch][${searchId}] Updated accessed websites:`, websites);
//       }
      
//       // If we have search results, add them to the chat as a message
//       const searchDuration = Date.now() - searchStartTime;
//       console.log(`🔍 [SEARCH][${searchId}] Search operation took ${searchDuration}ms, keeping internet search mode active until refresh`);
      
//       // Add search results as an assistant message
//       if (extractedResults.length > 0) {
//         try {
//           if (chatIdToUse) {
//             console.log(`🔍 [SEARCH][${searchId}] Adding search results as assistant message to chat ${chatIdToUse}`);
            
//             // Format search results for display
//             const formattedResults = extractedResults.map((result, index) => {
//               return `${index + 1}. **[${result.title}](${result.url})**\n${result.snippet}\n`;
//             }).join('\n');
            
//             // Add the search results as an assistant message
//             // Use the correct type format expected by chatService.addMessage
//             const searchResultMessage = {
//               role: 'assistant' as 'assistant', // Type assertion to match expected role type
//               content: `🔍 **Search Results for "${query}"**\n\n${formattedResults}`,
//               searchModeActive: true // Use the supported property
//             };
            
//             // Add the search results message to the chat
//             await chatService.addMessage(chatIdToUse, searchResultMessage);
//             console.log(`✅ [SEARCH][${searchId}] Successfully added search results message to chat`);
            
//             // Get the latest messages including our new search results
//             const latestChatResponse = await chatService.getChat(chatIdToUse);
//             if (latestChatResponse?.data) {
//               // Mark the search result messages with isSearchResult flag
//               const updatedMessages = latestChatResponse.data.messages.map(msg => {
//                 // If this is a recent assistant message that contains search results, mark it
//                 if (msg.role === 'assistant' && 
//                     msg.content && 
//                     msg.content.includes('Search Results for') && 
//                     new Date(msg.created_at).getTime() > Date.now() - 30000) {
//                   return {...msg, isSearchResult: true};
//                 }
//                 return msg;
//               });
              
//               // Update the current chat with the modified messages
//               const updatedChat = {...latestChatResponse.data, messages: updatedMessages};
//               setCurrentChat(updatedChat);
//               console.log(`✅ [SEARCH][${searchId}] Updated current chat with search results and marked them`);
//             }
//           }
//         } catch (error) {
//           console.error(`❌ [SEARCH][${searchId}] Error adding search results message:`, error);
//         }
//       }
      
//       // Mark any existing assistant messages as search results to prevent filtering
//       console.log(`🔍 [SEARCH][${searchId}] Marking recent messages as search results to prevent filtering`);
      
//       try {
//         if (chatIdToUse) {
//           // Get the latest messages
//           const latestChatResponse = await chatService.getChat(chatIdToUse);
//           if (latestChatResponse?.data?.messages) {
//             // Find the most recent assistant message - this is likely the search result
//             const recentMessages = latestChatResponse.data.messages;
//             const recentAssistantMessages = recentMessages.filter(msg => 
//               msg.role === 'assistant' && 
//               // Only consider messages from the last 30 seconds (likely from this search operation)
//               new Date(msg.created_at).getTime() > Date.now() - 30000
//             );
            
//             console.log(`🔍 [SEARCH][${searchId}] Found ${recentAssistantMessages.length} recent assistant messages to mark as search results`);
            
//             // Mark each recent assistant message as a search result
//             for (const msg of recentAssistantMessages) {
//               try {
//                 console.log(`🔍 [SEARCH][${searchId}] Marking message ${msg.id} as search result`);
//                 // Update the message with isSearchResult flag
//                 await chatService.updateMessage(chatIdToUse, msg.id, {
//                   ...msg,
//                   isSearchResult: true,
//                   metadata: msg.metadata 
//                     ? typeof msg.metadata === 'string'
//                       ? msg.metadata.includes('isSearchResult') 
//                         ? msg.metadata 
//                         : `${msg.metadata};isSearchResult=true`
//                       : { ...msg.metadata, isSearchResult: true }
//                     : 'isSearchResult=true'
//                 });
//               } catch (updateError) {
//                 console.error(`❌ [SEARCH][${searchId}] Error marking message as search result:`, updateError);
//               }
//             }
//           }
//         }
//       } catch (markingError) {
//         console.error(`❌ [SEARCH][${searchId}] Error marking messages as search results:`, markingError);
//       }
      
//       // Call our helper method to perform final chat refresh with filtering
//       // This is in a setTimeout to ensure it runs in a separate tick after all other state updates
//       // CRITICAL: We need to keep internetSearchEnabled flag active until after the final refresh
//       setTimeout(async () => {
//         try {
//           if (chatIdToUse && searchId) {
//             console.log(`🔍 [SEARCH][${searchId}] Performing final refresh with filtering, internetSearchEnabled=${internetSearchEnabled}`);
//             await refreshChatWithFiltering(chatIdToUse, searchId);
            
//             // Double-check that search results are preserved after filtering
//             const finalCheckResponse = await chatService.getChat(chatIdToUse);
//             if (finalCheckResponse?.data?.messages) {
//               const searchResultCount = finalCheckResponse.data.messages.filter(msg => 
//                 msg.isSearchResult === true || 
//                 (msg.content && msg.content.includes('Search Results for'))
//               ).length;
//               console.log(`🔍 [SEARCH][${searchId}] Final check: ${searchResultCount} search result messages preserved`);
              
//               // Update the current chat one last time to ensure we have the latest state
//               setCurrentChat(finalCheckResponse.data);
//             }
            
//             // Reset search state
//             setIsSearching(false);
            
//             // Only reset internetSearchEnabled after the final refresh
//             // This avoids the critical bug where searchMode is disabled too early
//             console.log(`🔍 [SEARCH][${searchId}] Final refresh complete, turning off internet search mode`);
//             setInternetSearchEnabled(false);
//           }
//         } catch (finalError) {
//           console.error(`❌ [SEARCH][${searchId}] Error in final refresh:`, finalError);
//           // Also reset search mode in case of error
//           setIsSearching(false);
//           setInternetSearchEnabled(false);
//         }
//       }, 1000); // Increased timeout to ensure all operations complete
      
//       console.log(`🏁 [SEARCH][${searchId}] Loading state reset to false`);
//       setLoading(false); // Explicitly reset loading state
//       console.log(`🏁 [SEARCH][${searchId}] Search operation COMPLETED in ${searchDuration}ms`);
      
//       // CRITICAL: We're NOT disabling internet search mode here anymore
//       // Instead, we'll let the setTimeout callback handle it after the final refresh
//       console.log(`🔍 [SEARCH][${searchId}] Keeping internet search mode enabled until final refresh completes`);
      
//       // Update debug state with final status
//       try {
//         if (typeof window !== 'undefined') {
//           window._debugChatState = {
//             ...(window._debugChatState || {}),
//             lastSearchResults: extractedResults.slice(0, 3), // Store first 3 results for debugging
//             searchCompleted: true,
//             completedAt: new Date().toISOString(),
//             chatId: chatIdToUse
//           };
//         }
//       } catch (error) {
//         console.error('Error updating final debug state:', error);
//       }
//     }
    
//     // Explicitly return the search results array to satisfy TypeScript
//     return Array.isArray(searchResults) ? searchResults : [];
//   // Defensive: Always return SearchResult[]
//   };

//   // Create a wrapper function that uses the internal implementation
//   // This ensures we correctly expose the function in the context while preserving the return type
//   const performSearch = async (query: string, addUserMessage = true): Promise<SearchResult[]> => {
//     // Set search mode on when performing a search
//     setInternetSearchEnabled(true);
//     setIsSearching(true);
//     setSearchQuery(query); // Store the search query for reference
    
//     // Open the search sidebar to show results
//     if (!isSearchSidebarOpen) {
//       setIsSearchSidebarOpen(true);
//       console.log('[ChatContext][performSearch] Opening search sidebar to show results');
//     }
    
//     try {
//       console.log('[ChatContext][performSearch] Starting search for:', query);
//       // Call the internal implementation and return the results
//       const results = await performSearchInternal(query, addUserMessage);
//       console.log(`[ChatContext][performSearch] Search complete, got ${results.length} results`);
//       return results;
//     } catch (error) {
//       console.error('[ChatContext][performSearch] Error in search:', error);
//       setInternetSearchEnabled(false);
//       setIsSearching(false); // Make sure to reset search state
//       setLoading(false); // Also reset loading state in case of error
//       return [];
//     }
//   };

//   // Return context provider with all state and functions
//   return (
//     <ChatContext.Provider value={{
//       currentChat,
//       chats,
//       loading,
//       error: errorState,
//       createNewChat,
//       createAgentChat,
//       setCurrentChat,
//       addMessage,
//       deleteChat,
//       updateChatTitle,
//       selectedAgent,
//       setSelectedAgent,
//       // Search-related properties and methods
//       isSearchMode,
//       toggleSearchMode,
//       searchResults,
//       performSearch,
//       isSearching,
//       accessedWebsites,
//       searchQuery,
//       isSearchSidebarOpen,
//       toggleSearchSidebar,
//       internetSearchEnabled, // Add to context so components can access this
//       setInternetSearchEnabled // Allow components to toggle internet search
//     }}>
//       {children}
//     </ChatContext.Provider>
//   );
// };

// // Create and export the hook for consuming the context
// export const useChat = (): ChatContextType => {
//   const context = useContext(ChatContext);
//   if (context === undefined) {
//     throw new Error('useChat must be used within a ChatProvider');
//   }
//   return context;
// };
