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
  chat_type?: string; // Add chat_type for context engineering
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
  createAgentChat: (agent?: Agent) => Promise<Chat | null>; // Update createAgentChat method
  setCurrentChat: (chat: Chat) => void;
  addMessage: (message: { role: 'user' | 'assistant' | 'system'; content: string; chatId?: string }) => Promise<void>;
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
  toggleInternetSearch: (newState?: boolean) => void; // Function to toggle internet search with persistence
  avatarState: 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle';
  setAvatarState: (state: 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle') => void;
  avatarMessage: string;
  setAvatarMessage: (message: string) => void;
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
  const [internetEnabledChatIds, setInternetEnabledChatIds] = useState<Set<string>>(new Set()); // Track which chats have had internet search enabled
  const [avatarState, setAvatarState] = useState<'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle'>('idle');
  const [avatarMessage, setAvatarMessage] = useState<string>('');

  useEffect(() => {
    loadChats();
  }, []);
  
  // Update internet search state when current chat changes
  useEffect(() => {
    if (currentChat?.id) {
      // Uniformly enforce internet search context based on chat_type
      if (currentChat.chat_type === 'internet_search') {
        if (!internetEnabledChatIds.has(currentChat.id)) {
          setInternetEnabledChatIds(prev => new Set(prev).add(currentChat.id));
        }
        if (!internetSearchEnabled) {
          setInternetSearchEnabled(true);
        }
      } else {
        // For non-internet-search chats, allow toggling freely
        setInternetSearchEnabled(false);
      }
    }
  }, [currentChat?.id, currentChat?.chat_type, internetEnabledChatIds]);

  // Modified toggleInternetSearch to prevent disabling for locked chats
  const toggleInternetSearch = (newState?: boolean) => {
    if (currentChat?.id && internetEnabledChatIds.has(currentChat.id)) {
      // Once enabled for this chat, cannot be disabled
      setInternetSearchEnabled(true);
      return;
    }
    // Otherwise, allow toggling
    setInternetSearchEnabled(prev => typeof newState === 'boolean' ? newState : !prev);
  };


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
        chat_type: internetSearchEnabled ? 'internet_search' : 'default',
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

  const createAgentChat = async (agent?: Agent) => {
    // Use the provided agent parameter or fall back to selectedAgent
    const agentToUse = agent || selectedAgent;
    
    if (!agentToUse) {
      console.error('No agent selected for chat creation');
      toast.error('Please select an agent first');
      return null;
    }

    try {
      setLoading(true);
      console.log(`Creating a new chat with agent ${agentToUse.id}...`);
      
      // Update selectedAgent state if an agent was provided
      if (agent) {
        setSelectedAgent(agent);
      }
      
      const response = await chatService.createChat({
        agent_id: agentToUse.id.toString(),
        title: `Chat with ${agentToUse.name}`,
        chat_type: 'sales_agent',
        language: agentToUse.language || language.code
      });
      console.log('Agent chat created response:', response);
      
      const newChat = response.data;
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      
      toast.success(`Chat with ${agentToUse.name} created`);
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

  const addMessage = async ({ role, content, chatId }: { role: 'user' | 'assistant' | 'system'; content: string; chatId?: string }) => {
    let chatToUse = currentChat;

    // If a specific chatId is provided, route the message there
    if (chatId) {
      if (!chatToUse || chatToUse.id !== chatId) {
        // Try to find in existing chats
        const targetFromState = chats.find(c => c.id === chatId);
        if (targetFromState) {
          chatToUse = targetFromState;
        } else {
          try {
            const fetched = await chatService.getChat(chatId);
            chatToUse = fetched.data as Chat;
            // Merge into chats list
            setChats(prev => {
              const exists = prev.some(c => c.id === chatId);
              return exists ? prev.map(c => (c.id === chatId ? (chatToUse as Chat) : c)) : [chatToUse as Chat, ...prev];
            });
          } catch (e) {
            console.error('[ChatContext][addMessage] Failed to fetch target chat by ID:', chatId, e);
            toast.error('Cannot send message: target chat not found');
            return;
          }
        }
      }
    }
    
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
    if (chatToUse?.id === currentChat?.id) {
      setCurrentChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, tempMessage]
        };
      });
    } else if (chatToUse) {
      setChats(prev => prev.map(c => c.id === chatToUse!.id ? { ...c, messages: [...(c.messages || []), tempMessage] } : c));
    }

    try {
      // At this point chatToUse should always be defined
      const activeChatId = chatToUse.id;
      console.log(`[ChatContext][addMessage] Sending message to chat ${activeChatId}:`, { content, role });
      console.log(`[ChatContext][addMessage] Detailed chat info: ID=${chatToUse.id}, Title=${chatToUse.title}, MessageCount=${chatToUse.messages?.length || 0}`);

      const messageData = { content, role };
      await chatService.addMessage(activeChatId, messageData);
      console.log(`[ChatContext][addMessage] Message successfully added via API for chat ${activeChatId}.`);

      // Crucial Step: Refetch the entire chat to get the most up-to-date state from the server
      console.log(`[ChatContext][addMessage] Refetching chat ${activeChatId} to ensure UI consistency.`);
      const updatedChatResponse = await chatService.getChat(activeChatId);
      const fullyUpdatedChat: Chat = updatedChatResponse.data;

      console.log(`[ChatContext][addMessage] Successfully refetched chat ${activeChatId}. Full data:`, fullyUpdatedChat);
      console.log(`[ChatContext][addMessage] Messages in refetched chat:`, fullyUpdatedChat.messages);

      // Update the currentChat state only if we're updating the currently open chat
      if (currentChat?.id === activeChatId) {
        setCurrentChat(fullyUpdatedChat);
      }

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
    const newSearchMode = !isSearchMode;
    setIsSearchMode(newSearchMode);
    
    // Synchronize internetSearchEnabled with isSearchMode
    if (newSearchMode) {
      // When enabling search mode, also enable internet search
      toggleInternetSearch(true);
      setSearchResults([]);
    } else {
      // When disabling search mode, also disable internet search (if not locked)
      if (currentChat?.id && !internetEnabledChatIds.has(currentChat.id)) {
        toggleInternetSearch(false);
      }
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
    
    // Check if current chat is already internet_search type
    const isExistingInternetSearchChat = currentChat && currentChat.chat_type === 'internet_search';
    console.log(`[ChatContext][performSearch][${searchId}] Is existing internet search chat: ${isExistingInternetSearchChat}`);
    
    
    // Set search query for UI components to use
    setSearchQuery(query);
    
    // Set searching state to true to show loading indicators
    setIsSearching(true);
    toggleInternetSearch(true); // Mark that internet search is active
    
    // If we have a current chat, add its ID to the set of internet-enabled chats
    if (currentChat?.id) {
      setInternetEnabledChatIds(prevIds => {
        const newIds = new Set(prevIds);
        newIds.add(currentChat.id);
        console.log(`[ChatContext][performSearch][${searchId}] Added chat ${currentChat.id} to internet-enabled chats`);
        return newIds;
      });
    }
    
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
      
      if (newChat) {
        chatToUse = newChat;
        chatIdToUse = newChat.id;
        setCurrentChat(newChat); // Important: update the current chat in state
        
        // Add the new chat ID to the set of internet-enabled chats
        if (chatIdToUse) {
          const chatId = chatIdToUse; // Create a stable reference to the ID
          setInternetEnabledChatIds(prevIds => {
            const newIds = new Set(prevIds);
            newIds.add(chatId);
            console.log(`[ChatContext][performSearch][${searchId}] Added new chat ${chatId} to internet-enabled chats`);
            return newIds;
          });
        }
        
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
        // Only disable internet search if we don't have a current chat or if it's a new chat
        // that hasn't been added to the internet-enabled chats list yet
        toggleInternetSearch(false);
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
          suppressAiResponse: true, // CRITICAL: Suppress the standard AI response during search
          metadata: { wasReceivedDuringSearch: true } // Add metadata to track this was during search
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

    // If this is an existing internet search chat, we can skip the direct search API call
    // because the backend will handle the search when we submit the message
    if (isExistingInternetSearchChat) {
      console.log(`[ChatContext][performSearch][${searchId}] Skipping frontend search API call for existing internet search chat`);
      console.log(`[ChatContext][performSearch][${searchId}] The backend will handle search when processing this message`);
      
      // Update UI state to show search is complete
      setIsSearching(false);
      return;
    }

    try {
      // Only perform direct API search for new chats or non-internet-search chats
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
        console.log(`🔍 DEBUG: setSearchResults called with ${results.length} results:`, results);
        
        // Update accessed websites for monitoring and diagnostics
        const topWebsites = results.map(result => ({
          title: result.title,
          url: result.url
        })).slice(0, 7); // Limit to top 7 as requested
        
        console.log(`🔍 DEBUG: About to call setAccessedWebsites with ${topWebsites.length} websites:`, topWebsites);
        setAccessedWebsites(topWebsites);
        console.log(`🔍 DEBUG: setAccessedWebsites called successfully`);
        
        // Log accessed websites for debugging
        console.log(`🔍 [SEARCH][${searchId}] Top websites accessed:`, 
          topWebsites.map(site => site.title).join(', ') || 'None')
        
        // Format search results for display in chat - clean format like in the second image
        // Show top 10 relevant results as requested by the user
        console.log(`🔍 [SEARCH][${searchId}] Total results available: ${results.length}`);
        
        // Ensure we get up to 10 results, but don't try to show more than we have
        const maxResults = Math.min(10, results.length);
        const topResults = results.slice(0, maxResults);
        console.log(`🔍 [SEARCH][${searchId}] Displaying ${topResults.length} results`);
        
        // Format the message that shows in the chat bubble with a clean header
        const searchSummary = `Here's a comprehensive overview of the ${query}, including key details about the results:`;
        
        // Add a divider line for cleaner separation
        const dividerLine = '\n\n---\n\n';
        
        // Helper function to convert HTML tags to markdown
        const convertHtmlToMarkdown = (text: string): string => {
          // Replace common HTML tags with markdown equivalents
          return text
            .replace(/<strong>(.*?)<\/strong>/g, '**$1**') // Convert <strong> to **bold**
            .replace(/<b>(.*?)<\/b>/g, '**$1**') // Convert <b> to **bold**
            .replace(/<em>(.*?)<\/em>/g, '*$1*') // Convert <em> to *italic*
            .replace(/<i>(.*?)<\/i>/g, '*$1*') // Convert <i> to *italic*
            .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)') // Convert <a> to [text](url)
            .replace(/<br\s*\/?>/g, '\n') // Convert <br> to newline
            .replace(/<\/?p>/g, '\n\n') // Convert <p> to double newline
            .replace(/<\/?[^>]+(>|$)/g, ''); // Remove any other HTML tags
        };
        
        // Format each result with a clean bullet point style matching image 2
        const formattedResults = topResults.map((result, index) => {
          // Clean the title and snippet of HTML tags
          const cleanTitle = convertHtmlToMarkdown(result.title);
          const cleanSnippet = convertHtmlToMarkdown(result.snippet);
          
          // Add a section header for each result type if needed
          if (index === 0) {
            return `**${index + 1}. [${cleanTitle}](${result.url})**\n${cleanSnippet}`;
          }
          return `• **[${cleanTitle}](${result.url})**\n${cleanSnippet}`;
        }).join('\n\n');
        
        // Add a footnote with search results count and view all option
        const footnote = `\n\n*Found ${results.length} results for "${query}". Showing top 10 results. Click the search button to view all results.*`;
        
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
              suppressAiResponse: true, // Prevent additional AI responses
              isSearchResult: true, // Explicitly mark as search result to prevent filtering
              metadata: { wasReceivedDuringSearch: true } // Add metadata to track this was during search
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
      
      // CRITICAL: Check if the current chat ID is in the set of internet-enabled chats
      // If it is, keep internet search enabled for this chat
      if (chatIdToUse && internetEnabledChatIds.has(chatIdToUse)) {
        console.log(`[ChatContext][performSearch][${searchId}] Keeping internet search enabled for chat ${chatIdToUse}`);
        // Internet search remains enabled for this chat
      } else {
        console.log(`[ChatContext][performSearch][${searchId}] Resetting internet search flag`);
        toggleInternetSearch(false); // Reset internet search flag to prevent duplicate chats
      }
      
      // Calculate search duration using the searchStartTime from the beginning of the function
      const searchDuration = Date.now() - searchStartTime;
      
      // Final refresh of the chat to ensure UI is up to date
      try {
        if (chatIdToUse) {
          const refreshResponse = await chatService.getChat(chatIdToUse);
          if (refreshResponse?.data) {
            // Apply aggressive filtering to remove AI disclaimer messages
            // Use our imported filterDisclaimerMessages utility for consistent filtering
            const filteredChat = {
              ...refreshResponse.data,
              messages: refreshResponse.data.messages.filter(msg => {
                // Check if this is a search result message - these should ALWAYS be preserved
                if (msg.role === 'assistant' && 
                    (msg.isSearchResult === true || 
                     (msg.content && (
                       // Explicit search result markers
                       msg.content.includes('[SEARCH_RESULTS]') ||
                       
                       // Search result indicators - generic patterns
                       msg.content.startsWith('🔍') || // Magnifying glass emoji
                       msg.content.includes('Search results for') ||
                       msg.content.includes('Here are the search results') ||
                       msg.content.includes('Based on my search') ||
                       msg.content.includes('According to the search results') ||
                       msg.content.includes('Based on the information I found') ||
                       msg.content.includes('Based on the search results') ||
                       msg.content.includes('From the search results') ||
                       
                       // Additional search result patterns
                       msg.content.includes('I found information about') ||
                       msg.content.includes('According to my search') ||
                       msg.content.includes('The search results show') ||
                       msg.content.includes('Here is what I found') ||
                       msg.content.includes('comprehensive overview') ||
                       (msg.content.includes('results for') && msg.content.includes('query'))
                     ))
                    )) {
                  // This is a search result message, preserve it
                  console.log(`🟢 [SEARCH][${searchId}] PRESERVING search result message: "${msg.content.substring(0, 50)}..."`);
                  return true;
                }
                
                // For non-search result assistant messages, apply filtering
                if (msg.role === 'assistant') {
                  // PERMANENT SUPPRESSION: Always filter out AI disclaimer messages regardless of current search state
                  if (msg.content.includes("I'm sorry, but as an AI") ||
                      msg.content.includes("I can't predict future events") ||
                      msg.content.trim().startsWith("I'm sorry") ||
                      (msg.content.toLowerCase().includes("sorry") && msg.content.includes("AI")) ||
                      msg.content.includes("knowledge cutoff") ||
                      msg.content.includes("I cannot browse") ||
                      msg.content.includes("I don't have access to") ||
                      msg.content.includes("I don't have the ability")) {
                    console.log(`💥 [SEARCH][${searchId}] CRITICAL: Blocked exact disclaimer message from UI`);
                    return false;
                  }
                  
                  // Always use the filter utility regardless of internet search state
                  // This ensures consistent filtering behavior for all chats
                  const filteredMsg = filterDisclaimerMessages(msg, true);
                  if (filteredMsg === null) {
                    console.log(`🚫 [SEARCH][${searchId}] FILTERED OUT by utility: "${msg.content.substring(0, 50)}..."`);
                    return false;
                  }
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
      internetSearchEnabled, // Add to context so components can access this
      toggleInternetSearch, // Add the new function to toggle internet search
      avatarState,
      setAvatarState,
      avatarMessage,
      setAvatarMessage
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


