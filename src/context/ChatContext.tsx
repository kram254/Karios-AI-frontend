import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

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

const ChatContext = createContext<ChatContextType | undefined>(undefined);

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

  // Pre-filter function to detect and block generic AI disclaimers
  const processIncomingMessage = (msg: Message | null) => {
    // Skip processing for null messages or non-assistant messages
    if (!msg || msg.role !== 'assistant') return msg;
    
    // Always keep search result messages
    if (msg.content.startsWith('[SEARCH_RESULTS]') || 
        msg.content.startsWith('🔍') || 
        (msg.metadata && typeof msg.metadata === 'string' && msg.metadata.includes('isSearchResult'))) {
      console.log("✅ [ChatContext] Keeping search results message");
      return msg;
    }
    
    // When in internet search mode, pre-process all assistant messages
    if (internetSearchEnabled) {
      const content = msg.content.toLowerCase();
      
      // STRUCTURAL PATTERNS that identify disclaimers (not topic specific)
      // Pattern 1: Starts with apology or limitations
      const startsWithApology = /^(i['']m sorry|i apologize|sorry)/i.test(content);
      const startsWithLimitation = /^(as|being)\s+(an|a)\s+(ai|assistant|language model)/i.test(content);
      
      // Pattern 2: Contains limitation statements (more comprehensive patterns)
      const limitationPatterns = [
        // AI identity patterns
        /(as|being)\s+(an|a)\s+(ai|assistant|language model|artificial intelligence)/i,
        
        // Knowledge limitation patterns
        /(cannot|can't|unable to|don't have|do not have|lacks?|without)\s+(access|provide|predict|browse|search|see|know|tell|determine|check|verify)/i,
        /(my|the)\s+(knowledge|data|training|information|database)\s+(is|was|has been|are|were)\s+(limited|outdated|restricted|updated|only|up to|as of|current|cut off|not current)/i,
        /(no|without|lack\s+of)\s+(access|ability|capability|way)\s+to\s+(current|real-time|latest|future|upcoming|live|internet|web)/i,
        /I\s+(don't|do not|cannot|can't)\s+(access|browse|search|retrieve|get)\s+(the internet|current|future|real-time|live data|post-\w+|after\s+\w+)/i,
        
        // Temporal limitation patterns
        /(information|data|knowledge|training|awareness)\s+(only|just)\s+(goes|extends|up)\s+(to|through|until)/i,
        /(trained|last updated|knowledge cutoff|data cutoff)\s+(is|was|in|on|as of|date|point)/i,
        /(cutoff|cut-off|cut\s+off)\s+date\s+of\s+September\s+2021/i,  // Specific to September 2021
        /(September\s+2021)/i,  // Direct match for the date
        /(training|knowledge)\s+data\s+(only)?\s+includes/i,  // Matches "training data only includes"
        /unable\s+to\s+provide\s+information/i,  // Common phrase in disclaimers
        /cannot\s+predict\s+(future|upcoming)\s+events/i,  // Prediction limitation
        
        // Request for external verification patterns
        /(please|would need to|you('d| would) (need|have) to)\s+(check|verify|consult|refer to|look at)\s+(official|current|latest|up-to-date|recent)/i,
        /(recommend|suggest|advise)\s+(checking|visiting|consulting|referring to)\s+(official|recent|current|latest)/i,
        
        // Future event patterns
        /(hasn't|has not|have not|haven't)\s+(happened|occurred|taken place|been|started)/i,
        /(future|upcoming|scheduled|not yet|after my|beyond my)\s+(event|information|data|release|update|knowledge)/i,
        /(would need|need)\s+(real-time|current|more recent|up-to-date)\s+(information|data|sources)/i
      ];
      
      // Count how many limitation patterns are in the message
      const patternMatches = limitationPatterns.filter(pattern => pattern.test(content)).length;
      
      // Check for specific temporal indicators (especially knowledge cutoff dates)
      const temporalIndicators = [
        /(20\d\d|knowledge cutoff|training|data cutoff|last updated|information up to|not include|after|post-|only have information up to)/i.test(content),
        /(as of|until|up to|through)\s+(20\d\d|january|february|march|april|may|june|july|august|september|october|november|december)/i.test(content),
        /my\s+(knowledge|training|data)\s+(is|was)\s+(limited|cut off|only up to|current as of)/i.test(content),
        // Direct mention of specific cutoff dates (occurs frequently in disclaimers)
        /training data only includes information up to/i.test(content),
        /information up to september 2021/i.test(content),
        // OpenAI specific cutoff language
        /developed by openai/i.test(content) && /don't have real-time capabilities/i.test(content),
        // Very specific to the issue you're seeing - broad match for the exact message
        content.includes("september 2021") ? 3 : 0 // High weight for mentions of September 2021
      ].filter(Boolean).length;
      
      // Check for phrases suggesting checking external sources
      const externalSourceReferences = [/check\s+(with|the|official|latest|current|recent)\s+(sources|website|information|data)/i.test(content),
                                      /visit\s+(the|official|their)\s+website/i.test(content),
                                      /refer\s+to\s+(the|official|authoritative|up-to-date)/i.test(content)]
                                    .filter(Boolean).length;
      
      // Calculate pattern strength score based on combined factors
      let disclaimerScore = 0;
      if (startsWithApology) disclaimerScore += 2;
      if (startsWithLimitation) disclaimerScore += 2;
      disclaimerScore += patternMatches * 1.5;
      disclaimerScore += temporalIndicators * 2; // Stronger weight for temporal indicators
      disclaimerScore += externalSourceReferences * 1.5;
      
      // Additional detection: Disclaimer-like structure
      if (content.length > 50 && content.includes('please') && 
          (content.includes('check') || content.includes('refer'))) {
        disclaimerScore += 1;
      }
      
      // Messages containing search responses generally don't have these disclaimer patterns
      // Use a lower threshold (1.5) to be more aggressive with filtering when internet search is enabled
      if (disclaimerScore >= 1.5) {
        console.log(`🚫 [ChatContext] BLOCKED AI disclaimer message (score: ${disclaimerScore})`);
        console.log(`   - Starts with apology/limitation: ${startsWithApology || startsWithLimitation}`);
        console.log(`   - Limitation patterns: ${patternMatches}`);
        console.log(`   - Temporal indicators: ${temporalIndicators}`);
        console.log(`   - External source references: ${externalSourceReferences}`);
        console.log(`   - Preview: ${msg.content.substring(0, 50)}...`);
        
        // Return null to indicate this message should be filtered out
        return null;
      }
      
      // Double-check for classic disclaimer opening followed by any limitation pattern
      // This catches subtler cases that might slip through scoring
      if ((content.startsWith("i'm sorry") || content.startsWith("i apologize") || content.startsWith("sorry")) && 
          patternMatches > 0) {
        console.log(`🚫 [ChatContext] BLOCKED AI disclaimer message (direct pattern match)`);
        console.log(`   - Preview: ${msg.content.substring(0, 50)}...`);
        return null;
      }
    }
    
    return msg;
  };

  // Perform web search using the Brave Search API
  const performSearch = async (query: string, addUserMessage = true): Promise<SearchResult[]> => {
    // Generate a unique search ID for this search operation
    const searchId = `websearch-${Date.now()}`;
    const searchStartTime = Date.now(); // Used in finally block for duration calculation
    
    // Define chatIdToUse here so it's available throughout the function
    let chatIdToUse = currentChat?.id;
    
    // Initialize searchResults at the top level so it's available throughout the function
    let searchResults: SearchResult[] = [];
    
    if (!query.trim()) {
      console.log(`[ChatContext][performSearch][${searchId}] Empty query, aborting search`);
      setSearchResults([]);
      return [];
    }
    
    // Set search query for UI components to use
    setSearchQuery(query);
    
    // Set searching state to true to show loading indicators
    setIsSearching(true);
    setInternetSearchEnabled(true); // Mark that internet search is active
    console.log(`[ChatContext][performSearch][${searchId}] Internet search enabled for query: "${query}"`);
    
    try {
      // CRITICAL: Store the chat ID at the beginning of the process
      // and use this same chat throughout the entire search process
      let chatToUse = currentChat;
      chatIdToUse = currentChat?.id;
    
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

          // Define a helper function to refresh the chat
          const refreshChat = async (chatId: string) => {
            try {
              const response = await chatService.getChat(chatId);
              if (response?.data) {
                // When internet search is enabled, filter out generic AI messages
                if (internetSearchEnabled) {
                  console.log('🔍 [ChatContext] Filtering messages during chat refresh');
                  // Filter out any unwanted AI disclaimer messages
                  const filteredMessages = response.data.messages.filter(msg => {
                    const processedMsg = processIncomingMessage(msg);
                    return processedMsg !== null;
                  });
                  
                  // Set current chat with filtered messages
                  setCurrentChat({
                    ...response.data,
                    messages: filteredMessages
                  });
                  
                  console.log(`🔍 [ChatContext] Filtered ${response.data.messages.length - filteredMessages.length} messages during refresh`);
                } else {
                  // Normal mode - don't filter messages
                  setCurrentChat(response.data);
                }
              }
            } catch (error) {
              console.error('❌ [ChatContext] Error refreshing chat:', error);
            }
          };

        await refreshChat(chatIdToUse);
        
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
        return [];
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
          suppressAiResponse: true, // Critical: prevent further AI response
          searchModeActive: true // Signal this is a search mode message to trigger backend directive
        });
        
        // Refresh the chat to make sure we have the latest messages
        const updatedChat = await chatService.getChat(chatIdToUse);
        if (updatedChat?.data) {
          // Filter messages to ensure no disclaimers appear
          if (internetSearchEnabled) {
            console.log(`🔍 [SEARCH][${searchId}] Filtering messages during user message refresh`);
            const filteredMessages = updatedChat.data.messages.filter(msg => {
              // Always keep search results messages
              if (msg.content.startsWith('[SEARCH_RESULTS]') || msg.content.startsWith('🔍') || msg.isSearchResult === true) {
                console.log("✅ [ChatContext] Keeping search results message during refresh");
                return true;
              }
              
              // For assistant messages, process through our filter
              if (msg.role === 'assistant') {
                const processedMsg = processIncomingMessage(msg);
                return processedMsg !== null;
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
        
        console.log(`[ChatContext][performSearch][${searchId}] After adding user query. Messages count: ${chatToUse?.messages?.length}`);
      } catch (error) {
        console.error(`[ChatContext][performSearch][${searchId}] Error adding user message:`, error);
      }
    }

    // Outer try block for API endpoint check and URL preparation
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

      // Store on window for debugging
      window._lastSearchUrl = searchUrl;

      // Track request details
      let response: Response | null = null;
      const requestStartTime = Date.now();
      
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

        // Parse JSON response
        console.log(`🔄 [SEARCH][${searchId}] Parsing JSON response...`);
        let data: any;
        try {
          data = await response.json();
          console.log(`✅ [SEARCH][${searchId}] Search results successfully parsed:`, data);
          console.log(`📊 [SEARCH][${searchId}] Response structure: ${Object.keys(data).join(', ')}`);
          
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
          if (data?.web?.results && Array.isArray(data.web.results)) {
            const resultCount = data.web.results.length;
            console.log(`✅ [SEARCH][${searchId}] Successfully received ${resultCount} search results`);
            
            if (resultCount > 0) {
              // Process search results here
              const mappedResults = data.web.results.map((result: any) => ({
                title: result.title || 'No Title',
                url: result.url || '#',
                snippet: result.description || result.snippet || 'No description available.'
              }));
              setSearchResults(mappedResults);
              searchResults = mappedResults;
              
              // Update accessed websites for monitoring and diagnostics
              const topWebsites = mappedResults.map((result: SearchResult) => ({
                title: result.title,
                url: result.url
              })).slice(0, 7); // Limit to top 7
              setAccessedWebsites(topWebsites);
              
              // CRITICAL: Add search results as a formatted message to the chat
              if (chatIdToUse && mappedResults.length > 0) {
                console.log(`🔍 [SEARCH][${searchId}] Adding search results to chat ${chatIdToUse}`);
                try {
                  // Format search results for display - ensure they start with the search identifier
                  // Add an additional emoji at the very beginning to ensure it's recognized by our filters
                  const searchResultsContent = `🔍 [SEARCH_RESULTS] Found ${mappedResults.length} results for "${query}":\n\n` + 
                    mappedResults.map((result: SearchResult, index: number) => 
                      `${index + 1}. **${result.title}**\n   ${result.url}\n   ${result.snippet}\n`
                    ).join('\n');
                  
                  // Add formatted search results as an assistant message with special metadata
                  await chatService.addMessage(chatIdToUse, {
                    role: 'assistant',
                    content: searchResultsContent,
                    metadata: JSON.stringify({
                      isSearchResult: true,
                      searchId: searchId,
                      resultCount: mappedResults.length,
                      query: query
                    })
                  });
                  
                  console.log(`✅ [SEARCH][${searchId}] Successfully added search results to chat`);
                } catch (addMessageError) {
                  console.error(`❌ [SEARCH][${searchId}] Error adding search results to chat:`, addMessageError);
                }
              }
            } else {
              // Handle empty results
              console.warn(`⚠️ [SEARCH][${searchId}] Search returned empty results array`);
              setSearchResults([]);
              searchResults = [];
            }

          } else {
            console.warn(`⚠️ [SEARCH][${searchId}] Search returned invalid or missing results property`);
            setSearchResults([]);
            searchResults = [];
          }
        } catch (parseError: unknown) {
          console.error(`❌ [SEARCH][${searchId}] Failed to parse JSON response:`, parseError);
          const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
          throw new Error(`Failed to parse search results: ${errorMessage}`);
        }
      } catch (error: unknown) {
        console.error(`❌ [SEARCH][${searchId}] Failed to fetch or process search results:`, error);
        // On error, set empty results and clear search state
        setSearchResults([]);
        searchResults = [];
        
        // In development mode, provide mock results on error for testing
        if (process.env.NODE_ENV === 'development') {
          console.log(`💭 [SEARCH][${searchId}] Using mock search results after error in development`);
          const mockResults: SearchResult[] = [
            {
              title: 'Error Recovery Mock Result for "' + query + '"',
              url: 'https://example.com/error',
              snippet: 'This is shown because an error occurred: ' + (error instanceof Error ? error.message : 'Unknown error')
            }
          ];
          setSearchResults(mockResults);
          searchResults = mockResults;
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
      searchResults = [];
      
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
            // When internet search is enabled, filter out generic AI messages
            if (internetSearchEnabled) {
              console.log(`🔍 [SEARCH][${searchId}] Filtering messages during final refresh`);
              
              // Filter out any unwanted AI disclaimer messages
              const filteredMessages = refreshResponse.data.messages.filter(msg => {
                // Always keep search result messages
                if (msg.content.startsWith('[SEARCH_RESULTS]') || 
                    msg.content.startsWith('🔍') || 
                    msg.isSearchResult === true || 
                    (msg.metadata && typeof msg.metadata === 'string' && msg.metadata.includes('isSearchResult'))) {
                  console.log("✅ [ChatContext] Keeping search results message during final refresh");
                  return true;
                }
                
                // For assistant messages, process through our filter
                if (msg.role === 'assistant') {
                  const processedMsg = processIncomingMessage(msg);
                  return processedMsg !== null;
                }
                
                // Always keep user messages
                return msg.role === 'user';
              });
              
              // Special handling: if we filtered out all assistant messages (including search results),
              // it means something is wrong - the search results message isn't being properly identified
              // In this case, add a backup search results message if we have results
              const hasAssistantMessages = filteredMessages.some(msg => msg.role === 'assistant');
              if (!hasAssistantMessages && searchResults && searchResults.length > 0) {
                console.log(`⚠️ [SEARCH][${searchId}] No assistant messages found after filtering, adding backup search results message`);
                
                // Add search results from our state directly to the filtered messages
                filteredMessages.push({
                  id: `backup-search-${Date.now()}`,
                  role: 'assistant',
                  content: `🔍 [SEARCH_RESULTS] Found ${searchResults.length} results for "${query}":\n\n` + 
                    searchResults.map((result: SearchResult, index: number) => 
                      `${index + 1}. **${result.title}**\n   ${result.url}\n   ${result.snippet}\n`
                    ).join('\n'),
                  created_at: new Date().toISOString(),
                  isSearchResult: true
                });
                
                console.log(`✅ [SEARCH][${searchId}] Added backup search results message to chat`);
              }
              
              // Set current chat with filtered messages
              setCurrentChat({
                ...refreshResponse.data,
                messages: filteredMessages
              });
              
              console.log(`🔍 [SEARCH][${searchId}] Filtered ${refreshResponse.data.messages.length - filteredMessages.length} messages during final refresh`);
            } else {
              // Normal mode - don't filter messages
              setCurrentChat(refreshResponse.data);
            }
            
            console.log(`🏁 [SEARCH][${searchId}] Successfully refreshed chat ${chatIdToUse} with ${refreshResponse.data.messages?.length} messages`);
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
      console.log(`📋 [SEARCH][${searchId}] - Duration: ${Date.now() - searchStartTime}ms`);
      console.log(`📋 [SEARCH][${searchId}] - Results: ${searchResults?.length || 0}`);
      console.log(`📋 [SEARCH][${searchId}] - Final chat ID: ${chatIdToUse}`);
      console.log(`🏁 [SEARCH][${searchId}] - Status: ${searchResults?.length > 0 ? 'SUCCESS' : 'FAILED'}`);
    } 
   } catch (error) {
      // Handle parsing or fetch errors
      console.error(`❌ [SEARCH][${searchId}] Error performing search:`, error);
      setSearchResults([]);
      
      // In development mode, provide mock results on error for testing
      if (process.env.NODE_ENV === 'development') {
        try {
          console.log(`💭 [SEARCH][${searchId}] Using mock search results after error in development`);
          const mockResults: SearchResult[] = [
            {
              title: 'Error Recovery Mock Result for "' + query + '"',
              url: 'https://example.com/error',
              snippet: 'This is shown because an error occurred: ' + (error instanceof Error ? error.message : 'Unknown error')
            }
          ];
          setSearchResults(mockResults);
          searchResults = mockResults;
        } catch (devMockError) {
          console.error(`❌ [SEARCH][${searchId}] Error setting mock results:`, devMockError);
          searchResults = [];
        }
      } else {
        // For production, just set empty results
        searchResults = [];
      }
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
            setCurrentChat(refreshResponse.data);
            console.log(`🏁 [SEARCH][${searchId}] Successfully refreshed chat ${chatIdToUse} with ${refreshResponse.data.messages?.length || 0} messages`);
          }
        }
      } catch (refreshError) {
        console.error(`🛑 [SEARCH][${searchId}] Error refreshing chat after search:`, refreshError);
      }
      
      console.log(`🏁 [SEARCH][${searchId}] Loading state reset to false`);
      console.log(`🏁 [SEARCH][${searchId}] Search operation COMPLETED in ${searchDuration}ms`);
    }
    
    return searchResults;
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