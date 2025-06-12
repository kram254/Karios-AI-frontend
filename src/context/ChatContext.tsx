import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { filterDisclaimerMessages } from '../utils/messageFilters';

// Extend the Window interface to include custom properties for search debugging
declare global {
  interface Window {
    _lastSearchUrl?: string;
    _lastSearchQuery?: string;
    _lastSearchError?: any;
    _lastSearchErrorText?: string;
    _lastSearchErrorResponse?: any;
    _debugChatState?: any;
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
  isSearchResult?: boolean;
  metadata?: string | Record<string, any>;
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
  performSearch: (query: string, addUserMessage?: boolean) => Promise<SearchResult[]>;
  isSearching: boolean;
  accessedWebsites: {title: string, url: string}[];
  searchQuery: string;
  isSearchSidebarOpen: boolean;
  toggleSearchSidebar: () => void;
  internetSearchEnabled: boolean; // Indicates if internet search is currently active
}

// Create the context with TypeScript typing
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Define the chat provider component with proper React return type
// Define the chat provider component with proper React return type
export const ChatProvider = ({ children }: { children: ReactNode }) => {
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
    
    // If we don't have a current chat, create one, but ONLY IF NECESSARY
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

  // Toggle the search mode and ensure we maintain state properly
  const toggleSearchMode = (): void => {
    const newSearchModeValue = !isSearchMode;
    console.debug(`🔍 [DEBUG][ChatContext] Toggling search mode from ${isSearchMode} to ${newSearchModeValue}`);
    
    // Set internet search enabled when turning on search mode
    if (newSearchModeValue) {
      console.debug('🔍 [DEBUG][ChatContext] Enabling internet search with search mode');
      setInternetSearchEnabled(true);
      
      // Safe access to window._debugChatState to avoid TypeScript errors
      try {
        if (typeof window !== 'undefined') {
          window._debugChatState = {
            ...(window._debugChatState || {}),
            internetSearchEnabled: true,
            toggledAt: new Date().toISOString(),
            searchModeEnabled: true
          };
        }
      } catch (error) {
        console.error('Error updating debug state:', error);
      }
    }
    
    setIsSearchMode(newSearchModeValue);
    
    if (!newSearchModeValue) {
      console.debug('🔍 [DEBUG][ChatContext] Clearing search results when disabling search mode');
      setSearchResults([]);
    }
  };

  // Toggle search sidebar visibility
  const toggleSearchSidebar = () => {
    const newValue = !isSearchSidebarOpen;
    console.debug(`🔍 [DEBUG][ChatContext] Toggling search sidebar from ${isSearchSidebarOpen} to ${newValue}`);
    setIsSearchSidebarOpen(newValue);
  };
  
  /**
   * Refresh chat with filtering functionality
   * This is a helper method used during search operations to refresh
   * the chat and apply filtering to remove AI disclaimers
   */
  const refreshChatWithFiltering = async (chatId: string, searchOpId: string): Promise<void> => {
    try {
      if (!chatId) {
        console.error(`❌ [FINAL REFRESH][${searchOpId}] No chat ID provided for refresh`);
        return;
      }
      
      const refreshResponse = await chatService.getChat(chatId);
      if (!refreshResponse?.data) {
        console.error(`❌ [FINAL REFRESH][${searchOpId}] Failed to fetch chat data`);
        return;
      }
      
      // Apply one last round of filtering when internet search is enabled
      // This catches any late-arriving AI disclaimers
      if (internetSearchEnabled) {
        console.log(`🔍 [FINAL REFRESH][${searchOpId}] Filtering messages during final refresh`);
        
        // First, identify and preserve any search result messages
        const preservedMessages = preserveSearchResultMessages(refreshResponse.data.messages);
        console.log(`🔍 [FINAL REFRESH][${searchOpId}] Found ${preservedMessages.length} search result messages to preserve`);
        
        // Filter out unwanted AI messages one last time
        const finalFilteredMessages = refreshResponse.data.messages.filter(msg => {
          // Always keep search results
          if ((msg.content && (msg.content.startsWith('🔍') || msg.content.includes('[SEARCH_RESULTS]'))) || 
              msg.isSearchResult === true || 
              (msg.metadata && typeof msg.metadata === 'string' && msg.metadata.includes('isSearchResult'))) {
            return true; // Always preserve search results
          }
          
          if (msg.role === 'assistant') {
            const processedMsg = processIncomingMessage(msg);
            return processedMsg !== null;
          }
          
          // Keep user messages
          return msg.role === 'user';
        });
        
        // Set the current chat with filtered messages
        setCurrentChat({
          ...refreshResponse.data,
          messages: finalFilteredMessages
        });
        
        console.log(`🔍 [FINAL REFRESH][${searchOpId}] Filtered ${refreshResponse.data.messages.length - finalFilteredMessages.length} messages during final refresh`);
      } else {
        // Normal mode - don't filter messages
        setCurrentChat(refreshResponse.data);
      }
      
      console.log(`🏁 [SEARCH][${searchOpId}] Successfully refreshed chat ${chatId} with ${refreshResponse.data.messages?.length || 0} messages`);
    } catch (error) {
      console.error(`❌ [FINAL REFRESH][${searchOpId}] Error during final refresh:`, error);
    }
  };

  /**
   * Pre-filter function with enhanced pattern matching to detect and block generic AI disclaimers
   * Also provides detailed debug logging to track message processing flow
   */
  const processIncomingMessage = (msg: Message | null) => {
    console.debug(`📝 [MESSAGE FILTER][Process] Processing message ID: ${msg?.id}, role: ${msg?.role}`); 
    
    // Use our enhanced filter utility to handle message filtering
    const filteredMsg = filterDisclaimerMessages(msg, internetSearchEnabled);
    
    // Add tracking for message filtering decisions
    if (filteredMsg === null && msg) {
      console.debug(`🚫 [MESSAGE FILTER][Rejected] Message blocked: ${msg.id}`);
      console.debug(`🧾 [MESSAGE FILTER][Content] Preview: "${msg.content?.substring(0, 50)}..."`); 
      
      // Handle server-side deletion of filtered messages for cleaner UI
      if (msg.id && currentChat?.id) {
        try {
          // Attempt to delete from the chat service to keep database clean
          chatService.deleteMessage(currentChat.id, msg.id)
            .then(() => console.log(`🚫 [MESSAGE FILTER][Delete] Successfully removed AI disclaimer: ${msg.id}`))
            .catch(err => console.error(`❌ [MESSAGE FILTER][Error] Failed to delete AI disclaimer: ${err}`));
        } catch (e) {
          console.error('❌ [MESSAGE FILTER][Error] Error attempting to delete AI disclaimer message', e);
        }
      }
    } else if (msg) {
      console.debug(`✅ [MESSAGE FILTER][Accepted] Message passed filtering: ${msg.id}`);
    }
    
    return filteredMsg;
  };

  /**
   * Robust function to identify and preserve search result messages that shouldn't be filtered
   * This ensures search results are properly maintained in the chat
   */
  const preserveSearchResultMessages = (messages: Message[]): Message[] => {
    if (!messages || !Array.isArray(messages)) {
      console.error('❌ [PRESERVE] Invalid messages array provided', messages);
      return [];
    }
    
    console.debug(`🔍 [SEARCH][Preserve] Analyzing ${messages.length} messages for search results`); 
    
    const updatedMessages = [...messages];
    
    const searchResults = updatedMessages.filter(msg => 
      msg.content && (
        msg.content.startsWith('🔍') || 
        msg.content.includes('[SEARCH_RESULTS]') ||
        msg.content.includes('Search results for:') ||
        msg.content.includes('Here are some search results')
      ) ||
      msg.isSearchResult === true || 
      (msg.metadata && (
        (typeof msg.metadata === 'string' && msg.metadata.includes('isSearchResult')) ||
        (typeof msg.metadata === 'object' && msg.metadata.isSearchResult)
      ))
    );
    
    searchResults.forEach(msg => {
      const index = updatedMessages.findIndex(m => m.id === msg.id);
      if (index !== -1) {
        updatedMessages[index] = {
          ...updatedMessages[index],
          isSearchResult: true,
          metadata: updatedMessages[index].metadata 
            ? typeof updatedMessages[index].metadata === 'string'
              ? updatedMessages[index].metadata + ';isSearchResult=true'
              : { ...updatedMessages[index].metadata, isSearchResult: true }
            : 'isSearchResult=true'
        };
        console.debug(`✅ [SEARCH][Preserve] Found search result to preserve: ${msg.id}`);
      }
    });
    
    console.log(`🔍 [PRESERVE] Marked ${searchResults.length} messages as search results`);
    return updatedMessages;
  };
  
  // Perform web search using the Search API
  // This function handles search functionality and returns search results
  // Explicitly declare return type to resolve type issues
  const performSearchInternal = async (query: string, addUserMessage = true): Promise<SearchResult[]> => {
    // Don't allow searches if there's no current chat or if already searching
    if (!currentChat || isSearching) {
      console.log('⚠️ [SEARCH] Cannot search, no current chat or search already in progress');
      return [];
    }
    
    // Start a new search operation with unique ID
    const searchId = `search-${Date.now()}`;
    const searchStartTime = Date.now();
    let chatIdToUse = currentChat?.id;
    let searchResults: SearchResult[] = [];
    let extractedResults: SearchResult[] = [];
    
    console.log(`🔍 [SEARCH][${searchId}] Starting search for: "${query}"`);
    
    if (!query || query.trim() === '') {
      // Empty query, just refresh the chat
      console.log(`ℹ️ [SEARCH][${searchId}] Empty search query. Refreshing chat.`);
      
      // For empty query, still perform refresh with filtering if internet search is enabled
      if (internetSearchEnabled) {
        console.log(`ℹ️ [SEARCH][${searchId}] Internet search mode enabled. Refreshing with filtering.`);
        try {
          setLoading(true);
          if (chatIdToUse) {
            await refreshChatWithFiltering(chatIdToUse, searchId);
          }
          
          // Refresh the chats list from the API
          const chatsResponse = await chatService.getChats();
          if (chatsResponse?.data) {
            setChats(chatsResponse.data);
          }
        } finally {
          setLoading(false);
          // Reset internet search mode since we're done
          setInternetSearchEnabled(false);
          console.log(`⚠️ [SEARCH][${searchId}] Empty query. Search mode disabled.`);
        }
      }
      return [];
    }
    
    // Ensure we have a valid chat to use
    if (!chatIdToUse) {
      console.log(`[ChatContext][performSearch][${searchId}] No chat ID available for search, creating new chat`);
      
      // Create a new chat if needed
      try {
        const newChat = await createNewChat(`Search: ${query}`);
        if (newChat && newChat.id) {
          chatIdToUse = newChat.id;
          console.log(`✅ [SEARCH][${searchId}] Successfully created new chat ${chatIdToUse} for search`);
        } else {
          console.error(`[ChatContext][performSearch][${searchId}] Failed to create new chat`);
          setInternetSearchEnabled(false);
          setIsSearching(false);
          return [];
        }
      } catch (error) {
        console.error(`❌ [SEARCH][${searchId}] Error creating new chat:`, error);
        setInternetSearchEnabled(false);
        setIsSearching(false);
        return [];
      }
    } else {
      console.log(`[ChatContext][performSearch][${searchId}] Using existing chat with ID: ${chatIdToUse}`);
    }
    
    // Add the user message if requested
    if (addUserMessage && chatIdToUse) {
      console.log(`[ChatContext][performSearch][${searchId}] Adding user query to chat ${chatIdToUse} with AI response suppressed`);
      try {
        // Send the user message directly to the chat service with suppressAiResponse=true
        await chatService.addMessage(chatIdToUse, { 
          role: 'user', 
          content: query,
          suppressAiResponse: true,
          searchModeActive: true,
        });
        
        // Refresh the chat to make sure we have the latest messages
        const updatedChat = await chatService.getChat(chatIdToUse);
        if (updatedChat?.data) {
          // Filter messages to ensure no disclaimers appear
          if (internetSearchEnabled) {
            console.log(`🔍 [SEARCH][${searchId}] Filtering messages during user message refresh`);
            const filteredMessages = updatedChat.data.messages.filter(msg => {
              // Always keep search results messages
              if (msg.content && (msg.content.startsWith('[SEARCH_RESULTS]') || msg.content.startsWith('🔍') || msg.isSearchResult === true)) {
                console.log("✅ [ChatContext] Keeping search results message during refresh");
                return true;
              }
              
              // For assistant messages, process through our filter
              if (msg.role === 'assistant') {
                // When in internet search mode, apply aggressive filtering
                if (internetSearchEnabled) {
                  // Detect the exact pattern seen in the screenshots
                  const knownDisclaimerPattern = /I('m| am) sorry, but as an AI (?:model )?developed by OpenAI and last trained on data up to (?:September|October) 2021, I don't have (?:the ability to provide|access to|information about)/i;
                  
                  if (knownDisclaimerPattern.test(msg.content)) {
                    console.log('🚨 [CRITICAL] Blocked exact match AI knowledge cutoff disclaimer');
                    // Try to delete the message if it has an ID
                    if (msg.id && chatIdToUse) {
                      try {
                        chatService.deleteMessage(chatIdToUse, msg.id)
                          .then(() => console.log(`🚫 [CRITICAL] Successfully deleted AI disclaimer message during refresh: ${msg.id}`))
                          .catch(e => console.error('Error deleting disclaimer message', e));
                      } catch (e) {
                        console.error('Failed to delete AI disclaimer message', e);
                      }
                    }
                    // Return null to completely remove this message
                    return false;
                  }
                  
                  // Apply standard pattern-based filtering for other cases
                  const preprocessed = processIncomingMessage(msg);
                  return preprocessed !== null;
                }
                
                // Default case for non-search mode
                return true;
              }
              
              // Always keep user messages
              return msg.role === 'user';
            });
            
            const filteredChat = {
              ...updatedChat.data,
              messages: filteredMessages
            };
            
            setCurrentChat(filteredChat);
            console.log(`🔍 [SEARCH][${searchId}] Filtered ${updatedChat.data.messages.length - filteredMessages.length} messages`);
            
            // Log if any generic AI messages are still present
            const genericMessages = filteredMessages.filter(msg => {
              if (msg.role !== 'assistant') return false;
              const content = msg.content?.toLowerCase() || '';
              return content.includes("i'm sorry") && content.includes("as an ai");
            });
            
            if (genericMessages.length > 0) {
              console.warn(`⚠️ [SEARCH][${searchId}] ${genericMessages.length} generic AI messages found in chat after filtering. These should be hidden in UI.`);
            }
          } else {
            setCurrentChat(updatedChat.data);
          }
        }
        
        console.log(`[ChatContext][performSearch][${searchId}] After adding user query. Messages count: ${updatedChat?.data?.messages?.length}`);
      } catch (error) {
        console.error(`[ChatContext][performSearch][${searchId}] Error adding user message:`, error);
      }
    }

    // Main search API request try block
    try {
      // Define the variable to store search results
      let extractedResults: SearchResult[] = [];
      
      // Check if the API endpoint is available - this prevents the entire app from crashing
      const apiEndpointAvailable = await checkApiEndpoint('/api/search');
      if (!apiEndpointAvailable) {
        console.error(`❌ [SEARCH][${searchId}] Search API endpoint unavailable`); 
        toast.error('Search is currently unavailable. Please try again later.');
        throw new Error(`Search API unavailable`); 
      }
      
      console.log(`[ChatContext][performSearch][${searchId}] Preparing search URL for query: "${query}"`); 
      
      // Debug logging
      try {
        if (typeof window !== 'undefined') {
          window._debugChatState = {
            ...(window._debugChatState || {}),
            lastSearchStarted: new Date().toISOString(),
            searchQuery: query,
            internetSearchEnabled: internetSearchEnabled
          };
        }
      } catch (error) {
        console.error('[DEBUG] Error updating debug state:', error);
      }
      
      // Create a URL for the search API request
      const searchUrl = `/api/search?q=${encodeURIComponent(query)}${internetSearchEnabled ? '&internet=true' : ''}`;
      
      // Set debug information for troubleshooting
      try {
        if (typeof window !== 'undefined') {
          window._lastSearchUrl = searchUrl;
          window._lastSearchQuery = query;
        }
      } catch (error) {
        console.error('Error setting debug data:', error);
      }
      
      // The main search function - fetch results from the API
      console.log(`[ChatContext][performSearch][${searchId}] Fetching search results from: ${searchUrl}`);
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        // Handle error response with safe window access
        try {
          if (typeof window !== 'undefined') {
            window._lastSearchErrorResponse = response;
            window._lastSearchErrorText = await response.text();
          }
        } catch (error) {
          console.error('Error setting error response debug data:', error);
        }
        throw new Error(`Search API returned ${response.status}: ${response.statusText}`);
      }
      
      // Parse the search results
      let searchData;
      try {
        searchData = await response.json();
        console.log(`[ChatContext][performSearch][${searchId}] Search response received:`, searchData);
      } catch (parseError) {
        console.error(`[ChatContext][performSearch][${searchId}] Error parsing search results:`, parseError);
        throw new Error('Invalid search results format');
      }
      
      // Process the search results based on multiple possible response formats
      // Handle various response structures we might get from different APIs
      
      if (searchData) {
        // First format: Direct SearchResult[] array
        if (Array.isArray(searchData) && searchData.length > 0 && 
          typeof searchData[0].title === 'string' && 
          typeof searchData[0].url === 'string' &&
          typeof searchData[0].snippet === 'string') {
          extractedResults = searchData as SearchResult[];
          console.log(`[ChatContext][performSearch][${searchId}] Direct array format detected with ${extractedResults.length} results`);
        } 
        // Second format: { results: SearchResult[] }
        else if (searchData.results && Array.isArray(searchData.results)) {
          extractedResults = searchData.results;
          console.log(`[ChatContext][performSearch][${searchId}] Results property format detected with ${extractedResults.length} results`);
        }
        // Third format: { organic: { results: {...}[] } } (like Brave Search API)
        else if (searchData.organic && Array.isArray(searchData.organic.results)) {
          extractedResults = searchData.organic.results.map((item: any) => ({
            title: item.title || '',
            url: item.url || '',
            snippet: item.description || ''
          }));
          console.log(`[ChatContext][performSearch][${searchId}] Brave Search format detected with ${extractedResults.length} results`);
        }
        // Fourth format: { items: [...] } (like Google Search API)
        else if (searchData.items && Array.isArray(searchData.items)) {
          extractedResults = searchData.items.map((item: any) => ({
            title: item.title || '',
            url: item.link || item.url || '',
            snippet: item.snippet || item.description || ''
          }));
          console.log(`[ChatContext][performSearch][${searchId}] Google-like format detected with ${extractedResults.length} results`);
        }
        else {
          console.error(`[ChatContext][performSearch][${searchId}] Unrecognized search results format:`, searchData);
          throw new Error('Unrecognized search results format');
        }
      } else {
        console.error(`[ChatContext][performSearch][${searchId}] Empty search data returned`);
        throw new Error('No search results returned');
      }
      
      // Update state with the search results
      searchResults = extractedResults;
      setSearchResults(extractedResults);
      console.log(`[ChatContext][performSearch][${searchId}] Search results set in state:`, extractedResults);
      
      // Update accessedWebsites for the search sidebar
      if (extractedResults.length > 0) {
        const websites = extractedResults.map(result => ({
          title: result.title,
          url: result.url
        }));
        setAccessedWebsites(websites);
        console.log(`[ChatContext][performSearch][${searchId}] Updated accessed websites:`, websites);
      }
      
      // If we have search results, add them to the chat as a message
      if (extractedResults.length > 0 && chatIdToUse) {
        try {
          // Prepare search result display information
          const searchResultsFormatted = extractedResults.map(r => `- [${r.title}](${r.url})\n${r.snippet}\n`).join('\n');
          
          const searchResultMessage = {
            role: 'assistant' as const,
            content: `🔍 [SEARCH_RESULTS] Search results for: "${query}"\n\n${searchResultsFormatted}`,
            metadata: 'isSearchResult=true;noFiltering=true'
          };
          
          console.log(`🔍 [SEARCH][${searchId}] Adding ${extractedResults.length} search results to chat ${chatIdToUse}`);
          
          // Add search result message to the chat
          await chatService.addMessage(chatIdToUse, searchResultMessage);
          
          // Set search query for UI
          setSearchQuery(query);
        } catch (searchResultError) {
          console.error(`❌ [SEARCH][${searchId}] Error adding search results:`, searchResultError);
        }
      }
    } catch (error) {
      console.error(`[ChatContext][performSearch][${searchId}] Error during search:`, error);
      
      // Save error for debugging with safe window access
      try {
        if (typeof window !== 'undefined') {
          window._lastSearchError = {
            error: error instanceof Error ? error : { message: String(error) },
            searchId,
            timestamp: new Date().toISOString(),
            query
          };
        }
      } catch (debugError) {
        console.error('Error setting search error debug data:', debugError);
      }
      
      // Reset search results and error state
      setSearchResults([]);
      setError('Failed to retrieve search results');
    } finally {
      // Always set isSearching to false when search completes or fails
      setIsSearching(false);
      
      // Calculate search duration for logging
      const searchDuration = Date.now() - searchStartTime;
      console.log(`🔍 [SEARCH][${searchId}] Search operation took ${searchDuration}ms, keeping internet search mode active until refresh`);
      
      // Call our helper method to perform final chat refresh with filtering
      // This is in a setTimeout to ensure it runs in a separate tick after all other state updates
      setTimeout(async () => {
        try {
          if (chatIdToUse && searchId) {
            // IMPORTANT: We need to keep internetSearchEnabled flag active until after the final refresh
            await refreshChatWithFiltering(chatIdToUse, searchId);
            
            // Only reset internetSearchEnabled after the final refresh
            // This avoids the critical bug where searchMode is disabled too early
            console.log(`🔍 [SEARCH][${searchId}] Final refresh complete, turning off internet search mode`);
            setInternetSearchEnabled(false);
          }
        } catch (finalError) {
          console.error(`❌ [SEARCH][${searchId}] Error in final refresh:`, finalError);
          // Also reset search mode in case of error
          setInternetSearchEnabled(false);
        }
      }, 100);
      
      console.log(`🏁 [SEARCH][${searchId}] Loading state reset to false`);
      console.log(`🏁 [SEARCH][${searchId}] Search operation COMPLETED in ${searchDuration}ms`);
      
      // CRITICAL: Only reset internet search flag AFTER the chat has been fully refreshed
      // Fixed critical bug where internetSearchEnabled flag was reset too early
      // This ensures all filters have been applied to any incoming messages
      console.log(`🔍 [SEARCH][${searchId}] Keeping internet search mode enabled until all messages processed`);
      
      // Add detailed logging to track search mode state changes
      console.log(`🔄 [SEARCH][${searchId}] Internet search enabled: ${internetSearchEnabled} → false`);
      setInternetSearchEnabled(false);
      console.log(`🔍 [SEARCH][${searchId}] Internet search mode disabled after final refresh`);
      
      // Update debug state with final status
      try {
        if (typeof window !== 'undefined') {
          window._debugChatState = {
            ...(window._debugChatState || {}),
            lastSearchResults: extractedResults.slice(0, 3), // Store first 3 results for debugging
            searchCompleted: true,
            completedAt: new Date().toISOString(),
            chatId: chatIdToUse
          };
        }
      } catch (error) {
        console.error('Error updating final debug state:', error);
      }
    }
    
    // Explicitly return the search results array to satisfy TypeScript
    return searchResults;
  };

  // Create a wrapper function that uses the internal implementation
  // This ensures we correctly expose the function in the context while preserving the return type
  const performSearch = async (query: string, addUserMessage = true): Promise<SearchResult[]> => {
    // Set search mode on when performing a search
    setInternetSearchEnabled(true);
    setIsSearching(true);
    
    try {
      return await performSearchInternal(query, addUserMessage);
    } catch (error) {
      console.error('[ChatContext][performSearch] Error in search:', error);
      setInternetSearchEnabled(false);
      return [];
    }
  };

  // Make ChatProvider return a JSX element, not SearchResult[]
  // This fixes the type error with Element vs SearchResult[]
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

// Create and export the hook for consuming the context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Export the hook as default export
export default useChat;
