import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { MessageSquare, Send, Plus, X, Globe } from "lucide-react";
import { format } from "date-fns";
import { useChat } from "../context/ChatContext";
import SearchLockTooltip from "./SearchLockTooltip";
import { motion } from "framer-motion";
import toast from 'react-hot-toast';
import AgentInfoBanner from "./agent/AgentInfoBanner";
import MessageFormatter from "./MessageFormatter";
import { chatService, Attachment } from "../services/api/chat.service";
import { generateTitleFromMessage } from "../utils/titleGenerator";
import AccessedWebsitesFloater from "./AccessedWebsitesFloater";
import CollapsibleSearchResults from "./CollapsibleSearchResults";
import AnimatedAvatar from "./AnimatedAvatar";
import WebAutomationIntegration from "./WebAutomationIntegration";
import PlanContainer from "./PlanContainer";
import "../styles/chat.css";

// Use our local Message interface that extends the API ChatMessage properties
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp?: Date | string;
  created_at?: string;
  chat_id?: string;
  attachments?: Attachment[];
}

// Moved Attachment interface to chat.service.ts

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  created_at?: string;
  updated_at?: string;
  agent_id?: string;
  language?: string;
  chat_type?: string;
  type?: 'internet_search' | string;
  internet_search?: boolean;
}

const Chat: React.FC = () => {
  const { 
    currentChat, 
    addMessage, 
    isSearchMode, 
    performSearch, 
    setCurrentChat, 
    createNewChat,
    internetSearchEnabled, // Get the internet search status from context
    toggleSearchMode, // Keep this for backward compatibility
    searchResults, // Add searchResults back for debugging
    isSearching, // Add isSearching back for debugging
    accessedWebsites, // Add accessedWebsites back
    avatarState,
    setAvatarState,
    avatarMessage,
    setAvatarMessage
  } = useChat();
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [automationActive, setAutomationActive] = useState(false);
  const [automationSessionId, setAutomationSessionId] = useState<string | null>(null);
  const [automationPlans, setAutomationPlans] = useState<Record<string, any>>({});
  const [pendingAutomationTask, setPendingAutomationTask] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && uploadedImages.length === 0) return;

    // Don't allow sending messages while processing
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log('🔄 PROCESSING STARTED');
    
    // Set avatar to thinking state when processing starts
    setAvatarState('thinking');
    setAvatarMessage('Thinking...');
    
    // Get message content once for the entire function
    const messageContent = message.trim();
    
    // Clear the input field immediately for better UX
    setMessage("");
    
    // Handle search or automation modes differently
    if (automationActive) {
      console.log('Submitting message to web automation workflow', { automationActive, automationSessionId, task: messageContent });
      try {
        setAvatarState('browsing');
        setAvatarMessage('Web automation enabled');
        try { window.dispatchEvent(new Event('automation:show')); } catch {}
        if (!automationSessionId) {
          try { window.dispatchEvent(new Event('automation:start')); } catch {}
          setPendingAutomationTask(messageContent);
          setIsProcessing(false);
          return;
        }
        const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL;
        const wfUrl = `${BACKEND_URL}/api/web-automation/execute-workflow`;
        console.log('Dispatching workflow to', wfUrl);
        await fetch(wfUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: automationSessionId,
            workflow_steps: [],
            task_description: messageContent
          })
        });
        console.log('Automation workflow request sent');
      } catch (automationErr) {
        console.error('Automation dispatch failed:', automationErr);
        
      }
    } else if (isSearchMode || internetSearchEnabled) { // Check both isSearchMode and internetSearchEnabled
      console.log('🌐 INTERNET SEARCH MODE ACTIVE - Processing search');
      console.log('🌐 [Chat] Disclaimer filtering is ACTIVE - generic AI messages will be filtered out');
      
      // Set avatar to searching state for internet search
      setAvatarState('searching');
      setAvatarMessage('Browsing...');
      
      try {
        const searchId = `search-${Date.now()}`;
        
        // Show animated loading indicator
        const loadingId = 'search-loading';
        toast.loading(
          <div className="search-loading-animation">
            <div className="search-pulse-animation"></div>
            <span>Searching the web for results...</span>
          </div>, 
          { id: loadingId, duration: Infinity }
        );
        
        console.log(`🌐 [Chat][${searchId}] CALLING SEARCH API... isSearchMode=${isSearchMode}, internetSearchEnabled=${internetSearchEnabled}`);
        
        // Let performSearch handle both adding the user message and the search results
        // This ensures everything happens in a single chat conversation with suppressAiResponse=true
        await performSearch(messageContent, true);
        
        console.log(`✅ [Chat][${searchId}] SEARCH COMPLETE`);
        
        // Clear loading animation and show success
        toast.dismiss(loadingId);
        toast.success(`Search results added to chat`, { id: 'search-toast' });
      } catch (error) {
        console.error("", error);
        toast.error(`${error instanceof Error ? error.message : ''}`, { id: 'search-toast' });
        console.log('💡 TROUBLESHOOTING TIPS: Check network connection, API endpoint, and server status');
      } finally {
        setIsProcessing(false);
        console.log('🔄 INTERNET SEARCH COMPLETE - UI ready for next action');
      }
      return;
    }
    
    // Regular chat message processing (not search)
    // Check if internet search is already in progress to avoid duplicate messages
    if (internetSearchEnabled) {
      console.log('Internet search is already in progress, skipping regular message processing');
      setIsProcessing(false);
      return;
    }
    
    try {
      // Store the message content before any async operations
      const userMessage = messageContent;
      
      // Clear the input field and uploaded images immediately for better UX
      setMessage("");
      const imagesToSend = [...uploadedImages];
      setUploadedImages([]);
      if (!currentChat) {
        console.log('Creating new chat before sending message');
        
        try {
          // Generate a descriptive title from the user's message
          const chatTitle = generateTitleFromMessage(userMessage);
          console.log('Generated chat title:', chatTitle);
          
          // Create a new chat with the generated title
          const newChat = await createNewChat(chatTitle);
          console.log('New chat created with ID:', newChat?.id);
          
          // Wait for the chat to be fully created and registered
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Now send the message to the newly created chat
          if (newChat && newChat.id) {
            console.log('Sending initial message to chat ID:', newChat.id);
            // Send message with any attachments
            if (imagesToSend.length > 0) {
              await chatService.addMessageWithAttachments(newChat.id, userMessage, imagesToSend);
            } else {
              await chatService.addMessage(newChat.id, userMessage);
            }
            
            console.log('Message sent successfully to new chat');
            
            // Refresh the chat to get the AI response
            const updatedChatResponse = await chatService.getChat(newChat.id);
            if (updatedChatResponse && updatedChatResponse.data) {
              console.log('Updated chat with messages:', updatedChatResponse.data);
              setCurrentChat(updatedChatResponse.data);
            }
          } else {
            throw new Error('New chat creation failed or returned invalid data');
          }
        } catch (chatError) {
          console.error('Error in chat creation flow:', chatError);
          throw chatError;
        }
      } else {
        // Normal flow when chat already exists
        console.log('Sending message to existing chat:', currentChat.id);
        
        if (imagesToSend.length > 0) {
          // If we have images, use the special method to send them with the message
          try {
            console.log(`Attempting to send message with attachments to chat: ${currentChat.id}`);
            // Send the message with attachments
            const addMsgWithAttachmentsResponse = await chatService.addMessageWithAttachments(
              currentChat.id, 
              userMessage, 
              imagesToSend
            );
            console.log('Message with attachments sent, API response:', addMsgWithAttachmentsResponse.data);

            // IMPORTANT: Refetch the entire chat to get the updated state
            console.log(`Refetching chat ${currentChat.id} after adding message with attachments.`);
            const fullChatResponse = await chatService.getChat(currentChat.id);
            if (fullChatResponse && fullChatResponse.data) {
              console.log('Successfully refetched chat, new data:', fullChatResponse.data);
              setCurrentChat(fullChatResponse.data); // This is now a full Chat object
            } else {
              console.error('Failed to refetch chat after sending message with attachments. UI might be stale.');
              // Optionally, you could try to manually merge addMsgWithAttachmentsResponse.data if it's just a message,
              // but refetching is safer for consistency.
            }
          } catch (err) {
            console.error("Error sending message with attachments:", err);
            toast.error("Failed to send message with images");
            throw err;
          }
        } else {
          // Normal message without attachments
          await addMessage({
            role: "user",
            content: userMessage
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsProcessing(false);
      // Reset avatar to idle state when processing is complete
      setAvatarState('idle');
      setAvatarMessage('');
    }
  };

  // Handle file upload when the Plus button is clicked
  const handlePlusButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Filter for image files only
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (imageFiles.length === 0) {
      toast.error("Please select image files only");
      return;
    }
    
    // Upload each image
    imageFiles.forEach(file => uploadImage(file));
    
    // Reset the file input
    e.target.value = '';
  };

  // Upload image to server
  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // Create an image URL for preview
      const previewUrl = URL.createObjectURL(file);
      
      // Create a temporary attachment for preview
      const tempAttachment: Attachment = {
        type: 'image',
        url: previewUrl,
        name: file.name,
        content_type: file.type,
        preview_url: previewUrl
      };
      
      // Add to displayed images
      setUploadedImages(prev => [...prev, tempAttachment]);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 200);
      
      // TODO: Replace with actual API upload once backend is ready
      // For now, we'll just simulate the upload process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // In a real implementation, update the attachment with the server response
      // const response = await api.post('/api/upload', formData);
      // const uploadedAttachment = response.data;
      
      toast.success(`Image ${file.name} uploaded successfully`);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(`Failed to upload ${file.name}`);
      
      // Remove the failed upload from preview
      setUploadedImages(prev => 
        prev.filter(img => img.name !== file.name)
      );
      
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Remove an uploaded image
  const removeUploadedImage = (imageName: string) => {
    setUploadedImages(prev => 
      prev.filter(img => img.name !== imageName)
    );
  };

  // Handle key press in the textarea (Ctrl+Enter or Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On Enter key (but not with Shift key) send the message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid new line
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Modern welcome screen inspired by DeepSeek
  if (!currentChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0A0A0A] text-white relative overflow-hidden">
        {/* Center content area with improved responsiveness */}
        <div className="flex flex-col items-center justify-center w-full mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 relative z-10">
          {/* AI Avatar with enhanced glow */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#00F3FF] to-[#0077B6] flex items-center justify-center mb-6 sm:mb-8 shadow-lg shadow-[#00F3FF]/30 pulse-glow">
            <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
          </div>
          
          {/* Welcome Message with enhanced typography */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-[#00F3FF] to-[#00D4E0] bg-clip-text text-transparent neon-text">
            Hi, I'm Karios AI.
          </h1>
          <p className="text-gray-400 text-center text-sm sm:text-base mb-8 sm:mb-10 max-w-md">How can I help you today?</p>
          
          {/* Message Input Area with glowing border - updated to match image 2 */}
          <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl bg-[#222] rounded-3xl shadow-lg overflow-hidden border border-[#00F3FF]/20 glow-border transition-all duration-300 hover:border-[#00F3FF]/40 hover:shadow-[#00F3FF]/20 hover:shadow-xl">
            <form onSubmit={handleSubmit} className="relative">
              {/* Top input row with plus icon, text area, and send button */}
              <div className="flex items-center w-full px-0.5 py-1">
                <button
                  type="button"
                  className="text-gray-400 hover:text-[#00F3FF] p-2 ml-2 transition-all duration-300"
                  onClick={() => {
                    // Just visual feedback
                    toast.success("New chat started");
                  }}
                >
                  <Plus className="w-5 h-5" />
                </button>
                
                <div className="relative flex-1 mx-2">
                  <textarea
                    ref={(textAreaRef) => {
                      // Auto-resize logic - same as main chat
                      if (textAreaRef) {
                        // Reset height to auto to get the correct scrollHeight
                        textAreaRef.style.height = 'auto';
                        // Set the height to the scrollHeight to match content
                        const newHeight = Math.min(textAreaRef.scrollHeight, 400);
                        textAreaRef.style.height = `${newHeight}px`;
                      }
                    }}
                    placeholder="Ask Karios AI"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      // Adjust height on change - matching main chat functionality
                      e.target.style.height = 'auto';
                      const newHeight = Math.min(e.target.scrollHeight, 400);
                      e.target.style.height = `${newHeight}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-[#222] text-white outline-none border-none py-3 px-2 resize-none min-h-[45px] placeholder-gray-400 focus:placeholder-[#00F3FF]/50 transition-all overflow-y-auto welcome-input"
                    disabled={isProcessing}
                  />
                </div>
                
                {/* Send button with glowing effect when active */}
                <button 
                  type="submit" 
                  disabled={!message.trim() || isProcessing}
                  className={`p-2 mr-2 rounded-full transition-all duration-300 ${!message.trim() || isProcessing ? 'text-gray-500' : 'text-[#00F3FF] hover:bg-[#00F3FF]/10 hover:shadow-sm hover:shadow-[#00F3FF]/20 active:bg-[#00F3FF]/20'}`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              {/* Bottom section with the search button on the left side */}
              <div className="flex items-center px-4 py-2 mt-0.5">
                {/* Pill-shaped search button matching image 2 design */}
                <div className="flex-1">
                  <button
                    type="button"
                    className={`flex items-center gap-2 ${isSearchMode 
                      ? 'bg-[#2A2A2A] text-[#00F3FF] border border-[#00F3FF]/40 shadow-inner shadow-[#00F3FF]/10' 
                      : 'bg-[#2A2A2A] text-gray-300 hover:text-[#00F3FF]'} 
                      py-1.5 px-4 rounded-full transition-all duration-300 hover:bg-[#2A2A2A]/90 hover:shadow-inner`}
                    onClick={() => {
                      // Log the current state before toggling
                      console.log(`🌐 SEARCH BUTTON CLICKED - Current search mode: ${isSearchMode ? 'ENABLED' : 'DISABLED'}`);
                      
                      // Only use toggleSearchMode - it now handles internetSearchEnabled synchronization
                      toggleSearchMode();
                      console.log('🌐 INTERNET SEARCH READY - Type a search query and press Send to search the web');
                    }}
                    aria-pressed={isSearchMode}
                  >
                    <span className="text-lg leading-none">🌐</span>
                    <span className="text-sm font-medium">{isSearchMode ? "Searching" : "Search"}</span>
                  </button>
                </div>
                
                {/* AI reference notice on the right side */}
                <div className="text-xs text-gray-500">Karios AI | Verify important Info.</div>
              </div>
            </form>
          </div>
          
          {/* Small caption */}
          <p className="text-gray-600 text-xs mt-4 text-center animate-pulse">Type your message and press Enter</p>
        </div>
        
        {/* Enhanced background effects */}
        <div 
          className="absolute inset-0 bg-gradient-radial from-[#00F3FF]/10 to-transparent opacity-20 pointer-events-none animate-pulse-slow" 
          style={{ width: '100%', height: '100%' }}
        ></div>
        <div className="absolute inset-0 starry-background pointer-events-none"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
        <h2 className="text-xl font-semibold text-white">{currentChat.title || "New Chat"}</h2>
      </div>

      {/* Agent Info Banner - Show only if chat has an agent_id */}
      {currentChat.agent_id && (
        <AgentInfoBanner agentId={currentChat.agent_id} />
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Search results are now presented as part of the AI's response in chat bubbles */}
        
        {/* Always render chat messages - search results will appear as agent responses */}
        {currentChat && (
          <>
            {currentChat.messages
            // Filter out duplicate messages (messages with the same content sent within 1 second)
            .filter((msg, index, array) => {
              // Always keep the first message
              if (index === 0) return true;
              
              // Check if this message has the same content as the previous one
              const prevMsg = array[index - 1];
              if (prevMsg.content !== msg.content || prevMsg.role !== msg.role) return true;
              
              // If content is the same, check if the timestamps are within 1 second
              const currentTime = new Date(msg.timestamp || msg.created_at || Date.now()).getTime();
              const prevTime = new Date(prevMsg.timestamp || prevMsg.created_at || Date.now()).getTime();
              
              // If timestamps are more than 1 second apart, keep both messages
              return Math.abs(currentTime - prevTime) > 1000;
            })
            // Filter out generic "I'm sorry, but as an AI..." messages when internet search is enabled
            .filter((msg) => {
              // If internet search is NOT enabled, show all messages
              if (!internetSearchEnabled) return true;
              
              // If this is a user message, always show it
              if (msg.role === 'user') return true;
              
              // SPECIAL CASE: Always keep search result messages in search mode
              if (msg.content.startsWith('[SEARCH_RESULTS]')) {
                console.log('🌐 Keeping search results message');
                return true;
              }
              
              // When in internet search mode, filter out all generic AI fallback messages and disclaimers
              if (msg.role === 'assistant') {
                // Get message content in lowercase for case-insensitive matching
                const content = msg.content.toLowerCase();
                
                // METHOD 1: Detect generic AI disclaimer patterns using structure-based regular expressions
                // These patterns target the structure of disclaimer messages, not specific topics
                const commonDisclaimerPatterns = [
                  // General apology patterns
                  /^i['']m sorry.{0,30}(as|being).{0,10}(an|a).{0,10}(ai|assistant|model)/i,
                  /^(i apologize|sorry).{0,30}(as|being).{0,10}(an|a).{0,10}(ai|assistant|model)/i,
                  
                  // Knowledge/training cutoff patterns (generalized)
                  /(my|the).{0,10}(training|knowledge|data).{0,20}(only|limited|up to|as of|until|cutoff)/i,
                  
                  // General capability limitation patterns
                  /(cannot|can't|don't|do not|unable to).{0,15}(access|provide|browse|search|know|get|have)/i,
                  
                  // Real-time/current information patterns
                  /(no|without|lack of).{0,15}(access|ability).{0,15}(real-time|current|latest|up-to-date)/i,
                  
                  // AI identity combined with limitation statements
                  /as (an|a).{0,10}(ai|model|assistant|llm).{0,40}(cannot|can't|don't|do not|unable|limited)/i,
                  
                  // Year mention with limitations
                  /(20\d{2}).{0,30}(only|until|up to|not beyond|after this|cutoff)/i,
                  
                  // General prediction inability patterns
                  /(cannot|can't|unable to|don't have).{0,20}(predict|provide|tell you|know).{0,20}(future|upcoming|will)/i,
                  
                  // Training data reference patterns
                  /(training|knowledge).{0,15}(cut-?off|only includes|ends at|limited to)/i,
                  
                  // Mixed identity and limitation patterns
                  /^(as|being).{0,10}(an|a).{0,10}(ai|language model|assistant).{0,40}(cannot|don't|limited to)/i
                ];
                
                // METHOD 2: Keyword density approach using general disclaimer indicators
                const disclaimerKeywords = [
                  // General AI identity and limitation terms
                  'sorry', 'training', 'data', 'knowledge', 'cutoff', 'updated', 
                  'ai', 'model', 'assistant', 'access', 'cannot', "can't", 'unable', 
                  'don\'t', 'not able', 'limited', 'latest', 'current', 'up-to-date',
                  
                  // General capability limitations
                  "don't have the ability", "unable to", "not capable", "not possible",
                  "not able", "limited to", "cannot access", "cannot browse",
                  "don't have access", "search engine", "unable to search",
                  
                  // Knowledge and time-related terms
                  "training data", "knowledge cutoff", "as of", "until",
                  "after my", "beyond my", "trained up to", "up until", "up to",
                  
                  // General limitation phrases
                  "i don't know", "i cannot predict", "i don't have information",
                  "i'm not able to", "i can't access", "not designed to",
                  "i apologize", "i'm sorry", "doesn't include", "lacks ability"
                ];
                
                // Check if content matches any disclaimer pattern
                const matchesPattern = commonDisclaimerPatterns.some(pattern => pattern.test(content));
                
                // Count keyword matches
                let keywordCount = 0;
                for (const keyword of disclaimerKeywords) {
                  if (content.includes(keyword)) {
                    keywordCount++;
                  }
                }
                
                // Check for phrases indicating search results
                const containsSearchTerms = content.includes('search results') || 
                                             content.includes('found information') || 
                                             content.includes('according to') || 
                                             content.includes('based on my search');
                
                // Find the original user query that might be in the current chat's title
                const chatTitle = currentChat?.title?.toLowerCase() || '';
                // Extract search query from the chat title if available (common format: "Search: query...")
                let searchQueryFromTitle = '';
                if (chatTitle.startsWith('search:')) {
                  searchQueryFromTitle = chatTitle.substring(7).trim();
                }
                
                // METHOD 3: Context-aware filtering - check if the message sounds like a disclaimer
                // specifically for the current search topic
                let contextualMatch = false;
                if (searchQueryFromTitle) {
                  // Clean up query for comparison (remove common words, get main topics)
                  const queryTerms = searchQueryFromTitle
                    .split(/\s+/)
                    .filter(term => term.length > 3) // Only keep meaningful terms
                    .map(term => term.replace(/[^a-z0-9]/gi, '')); // Remove punctuation
                  
                  // Check if the message references inability to provide info about the search topic
                  const limitationPhrases = ["cannot", "can't", "don't have", "not able", "unable", "impossible"];
                  const hasLimitationIndicator = limitationPhrases.some(phrase => content.includes(phrase));
                    
                  if (hasLimitationIndicator) {
                    // Check if any of the search terms appear near limitation words
                    contextualMatch = queryTerms.some(term => {
                      // Create a regex to find the term near limitation words
                      const nearLimitationRegex = new RegExp(
                        `(cannot|can't|don't|not able|unable).{0,50}${term}|${term}.{0,50}(cannot|can't|don't|not able|unable)`, 'i'
                      );
                      return nearLimitationRegex.test(content);
                    });
                  }
                }
                
                // METHOD 4: Detect potential search response messages (we should keep these)
                const likelySearchResponse = containsSearchTerms || 
                  (content.includes('http') && content.includes('://')) || // Contains links
                  (content.match(/\d{4}/) && !content.match(/20(21|22|23)/) && content.includes('published')) || // Mentions recent years
                  content.includes('website') || 
                  content.includes('article');
                
                // First try to detect if this is actually a genuine search response
                // If it looks like a search response, we should keep it regardless of other factors
                if (likelySearchResponse) {
                  console.log('🌐 Keeping likely search response message');
                  return true;
                }
                
                // Otherwise use our disclaimer patterns to decide whether to filter
                // Three ways to filter out a message:
                // 1. It matches one of our generic disclaimer regex patterns
                // 2. It contains a high density of disclaimer keywords (threshold lowered to 3 for more aggressive filtering)
                // 3. It contextually references inability to provide info about the search query
                if (matchesPattern || keywordCount >= 3 || contextualMatch) {
                  console.log(`🌐 FILTERED OUT AI disclaimer in search mode:`);
                  console.log(`   - Pattern match: ${matchesPattern}`);
                  console.log(`   - Keyword count: ${keywordCount}`);
                  console.log(`   - Contextual match: ${contextualMatch}`);
                  console.log(`   - Message preview: ${msg.content.substring(0, 50)}...`);
                  return false;
                }
              }
              
              // Keep all other messages
              return true;
            })
            .map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`message-container ${msg.role === "user" ? "user" : "agent"}`}
              >
                <div
                  className={`message-content ${msg.role}`}
                >
                  <div className="message-text">
                    <>
                       {/* Enhanced rendering for search result messages */}
                        {msg.role === 'assistant' && msg.content.startsWith('[AUTOMATION_PLAN]') ? (
                          <div className="automation-plan-message">
                            {(() => { let plan = automationPlans[msg.id]; try { const i = msg.content.indexOf('\n'); if (i >= 0) { const j = msg.content.slice(i + 1); if (j) plan = JSON.parse(j); } } catch {} return <PlanContainer plan={plan} isVisible={true} />; })()}
                            <div style={{ marginTop: 12 }}>
                              <button
                                type="button"
                                className="search-text-button"
                                onClick={() => { try { window.dispatchEvent(new Event('automation:show')); } catch {} }}
                              >
                                Open Web Automation Window
                              </button>
                            </div>
                          </div>
                        ) : msg.role === 'system' && msg.content.startsWith('[AUTOMATION_CONTROL]') ? (
                          <div className="automation-control-message">
                            <button
                              type="button"
                              className="search-text-button"
                              onClick={() => { try { window.dispatchEvent(new Event('automation:show')); } catch {} }}
                            >
                              Open Web Automation Window
                            </button>
                          </div>
                        ) : msg.role === 'assistant' && (msg.content.startsWith('[SEARCH_RESULTS]') || msg.content.match(/https?:\/\//)) ? (
                          <div className="search-result-message">
                            <span className="search-result-badge">🌐 Search Result</span>
                           {/* Attempt to parse [SEARCH_RESULTS] format: [SEARCH_RESULTS]\nTitle: ...\nURL: ...\nSnippet: ... */}
                           {(() => {
                             const lines = msg.content.split('\n');
                             let title = '', url = '', snippet = '';
                             lines.forEach(line => {
                               if (line.startsWith('Title:')) title = line.replace('Title:', '').trim();
                               else if (line.startsWith('URL:')) url = line.replace('URL:', '').trim();
                               else if (line.startsWith('Snippet:')) snippet = line.replace('Snippet:', '').trim();
                             });
                             // Fallback: if content contains a URL but not in [SEARCH_RESULTS] format
                             if (!title && !snippet && msg.content.match(/https?:\/\//)) {
                               url = msg.content.match(/https?:\/\/[\w\-\.\/?#=&%]+/g)?.[0] || '';
                               snippet = msg.content;
                             }
                             return (
                               <>
                                 {title && <div className="search-result-title">{title}</div>}
                                 {snippet && <div className="search-result-snippet">{snippet}</div>}
                                 {url && <div className="search-result-url"><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></div>}
                               </>
                             );
                           })()}
                         </div>
                       ) : (
                         <MessageFormatter content={msg.content} role={msg.role} />
                       )}
                       
                       {/* Display message attachments if any */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="message-attachments">
                          {msg.attachments.map((attachment: Attachment, index: number) => (
                            <div key={index} className="message-attachment">
                              {attachment.type === 'image' && (
                                <div className="text-xs text-gray-400 mt-2">
                                  {msg.created_at ? format(new Date(msg.created_at), "h:mm a") : ""}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Show collapsible search results after assistant messages when internet search is enabled */}
                      {msg.role === 'assistant' && 
                       !msg.content.startsWith('[SEARCH_RESULTS]') && 
                       (internetSearchEnabled || currentChat?.chat_type === 'internet_search') && (
                        <div className="mt-2">
                          <CollapsibleSearchResults 
                            results={accessedWebsites && accessedWebsites.length > 0 
                              ? accessedWebsites.map(site => ({
                                  title: site.title,
                                  url: site.url,
                                  snippet: `Visit ${site.title}`,
                                  source: (() => {
                                    try {
                                      return new URL(site.url).hostname;
                                    } catch {
                                      return site.url;
                                    }
                                  })()
                                }))
                              : searchResults && searchResults.length > 0
                                ? searchResults.map(result => ({
                                    title: result.title,
                                    url: result.url,
                                    snippet: result.snippet || `Visit ${result.title}`,
                                    source: (() => {
                                      try {
                                        return new URL(result.url).hostname;
                                      } catch {
                                        return result.url;
                                      }
                                    })()
                                  }))
                                : []}
                            isSearching={isSearching || false}
                            onResultClick={(result) => {
                              window.open(result.url, '_blank', 'noopener,noreferrer');
                            }}
                          />
                        </div>
                      )}
                    </>
                  </div>
                  <div className="message-timestamp">
                    {(() => {
                      try {
                        // Check if timestamp is a string (from API) or a Date object
                        const date = msg.timestamp instanceof Date 
                          ? msg.timestamp 
                          : new Date(msg.timestamp || msg.created_at || Date.now());
                        
                        // Verify if the date is valid before formatting
                        if (isNaN(date.getTime())) {
                          return 'Invalid date';
                        }
                        
                        return format(date, "MMM d, yyyy HH:mm");
                      } catch (error) {
                        console.error('Error formatting date:', error);
                        return 'Unknown time';
                      }
                    })()}
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
            
            {/* Animated Avatar - Show during processing states */}
            {(isProcessing || avatarState !== 'idle') && (
              <div className="flex justify-start mb-4">
                <div className="flex items-center" style={{paddingLeft: 20}}>
                  <div className="flex items-center justify-center" style={{width: 20, height: 20, minWidth: 20, minHeight: 20}}>
                    <div style={{transform: 'scale(0.8)', width: '100%', height: '100%'}}>
                      <AnimatedAvatar 
                        state={avatarState} 
                        message="" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center" style={{marginLeft: 32}}>
                    <div className="bg-[#111111] rounded px-3 py-1 flex items-center" style={{minHeight: '28px'}}>
                      <span className="text-sm text-white font-medium" style={{lineHeight: '1.2'}}>
                        {avatarMessage || 'Processing...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Form - Using updated chat.css classes */}
      <div className="chat-input-wrapper">
        <form onSubmit={handleSubmit} className="chat-input-container-expanded">
          <div className="chat-input-top-section">
            <button 
              type="button" 
              className="chat-action-button" 
              onClick={handlePlusButtonClick}
              disabled={isProcessing}
            >
              <Plus className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={handleFileChange} 
            />
            
            <div className="relative flex-1">
              <textarea
                ref={(textAreaRef) => {
                  // Auto-resize logic
                  if (textAreaRef) {
                    // Reset height to auto to get the correct scrollHeight
                    textAreaRef.style.height = 'auto';
                    // Set the height to the scrollHeight to match content
                    const newHeight = Math.min(textAreaRef.scrollHeight, 400);
                    textAreaRef.style.height = `${newHeight}px`;
                  }
                }}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  // Adjust height on change
                  e.target.style.height = 'auto';
                  const newHeight = Math.min(e.target.scrollHeight, 400);
                  e.target.style.height = `${newHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (isSearchMode && e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim()) {
                      performSearch(message);
                    }
                  } else {
                    handleKeyDown(e);
                  }
                }}
                placeholder={isSearchMode ? "Ask Karios AI..." : "Ask Karios AI"}
                className="chat-textarea"
                rows={1}
                disabled={isProcessing}
              />
              {isProcessing && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-sm font-medium text-cyan-500">Thinking...</span>
                </div>
              )}
            </div>
            
            <div className="chat-input-actions">
              {/* Send button */}
              <button 
                type="submit"
                disabled={(!message.trim() && uploadedImages.length === 0) || isProcessing}
                className="chat-send-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="chat-input-bottom-section">
            <SearchLockTooltip show={currentChat?.chat_type === 'internet_search'}>
               <button 
                 type="button" 
                 className={`search-text-button ${isSearchMode ? 'search-active' : ''}`}
                 onClick={() => {
                   if (currentChat?.chat_type === 'internet_search') return;
                   // Only use toggleSearchMode - it now handles internetSearchEnabled synchronization
                   toggleSearchMode();
                 }}
                 disabled={currentChat?.chat_type === 'internet_search'}
                 style={currentChat?.chat_type === 'internet_search' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
               >
                 <Globe className="w-4 h-4 mr-2" />
                 Search
               </button>
             </SearchLockTooltip>
                          <WebAutomationIntegration
                onAutomationResult={async (result) => {
                  console.log('Web automation result:', result);
                  // Add automation result as a system message to the chat
                  if (result.type === 'session_started') {
                    setAutomationActive(true);
                    setAutomationSessionId(result.sessionId);
                    console.log('Automation session started (Chat)', { sessionId: result.sessionId });
                    addMessage({
                      content: `Web automation session started: ${result.sessionId}`,
                      role: 'system'
                    });
                    if (pendingAutomationTask) {
                      try {
                        const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL;
                        const wfUrl = `${BACKEND_URL}/api/web-automation/execute-workflow`;
                        await fetch(wfUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId: result.sessionId,
                            workflow_steps: [],
                            task_description: pendingAutomationTask
                          })
                        });
                      } catch {}
                      setPendingAutomationTask(null);
                    }
                  } else if (result.type === 'plan_created') {
                    const id = `plan-${Date.now()}`;
                    setAutomationPlans((prev) => ({ ...prev, [id]: result.plan }));
                    addMessage({
                      content: `[AUTOMATION_PLAN]\n${JSON.stringify(result.plan)}`,
                      role: 'assistant'
                    });
                  } else if (result.type === 'execution_started') {
                    addMessage({
                      content: `[AUTOMATION_CONTROL]`,
                      role: 'system'
                    });
                  } else if (result.type === 'action_executed') {
                    addMessage({
                      content: `Web automation action: ${result.action.type} executed`,
                      role: 'system'
                    });
                  } else if (result.type === 'session_stopped') {
                    setAutomationActive(false);
                    setAutomationSessionId(null);
                    console.log('Automation session stopped (Chat)');
                  }
                }}
              />
           </div>
        </form>
        
        {/* Image upload progress indicator */}
        {isUploading && (
          <div className="upload-progress-container">
            <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
            <div className="upload-progress-text">
              Uploading... {Math.round(uploadProgress)}%
            </div>
          </div>
        )}
        
        {/* Uploaded images preview */}
        {uploadedImages.length > 0 && (
          <div className="uploaded-images-container">
            {uploadedImages.map((img, index) => (
              <div key={index} className="uploaded-image-preview">
                <img 
                  src={img.preview_url || img.url} 
                  alt={img.name} 
                  className="uploaded-image"
                />
                <button 
                  className="remove-image-button" 
                  onClick={() => removeUploadedImage(img.name)}
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="chat-ai-notice">Karios AI | Verify important Info.</div>
        
        {/* Floating search results button that appears after searching is complete */}
        <AccessedWebsitesFloater
          isVisible={true} /* Always pass true and let the component handle visibility logic */
        />
      </div>
    </div>
  );
};

export default Chat;
