import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { MessageSquare, Send, Plus, Search, X } from "lucide-react";
import { format } from "date-fns";
import { useChat, SearchResult } from "../context/ChatContext";
import { motion } from "framer-motion";
import toast from 'react-hot-toast';
import AgentInfoBanner from "./agent/AgentInfoBanner";
import MessageFormatter from "./MessageFormatter";
import { chatService, Attachment } from "../services/api/chat.service";
import { generateTitleFromMessage } from "../utils/titleGenerator";
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
}

const Chat: React.FC = () => {
  const { 
    currentChat, 
    setCurrentChat, 
    addMessage, 
    createNewChat,
    isSearchMode,
    toggleSearchMode,
    searchResults,
    performSearch,
    isSearching 
  } = useChat();
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    
    // Log that the form was submitted
    console.log(`💬 FORM SUBMITTED - SearchMode: ${isSearchMode ? 'ENABLED' : 'DISABLED'}, Message length: ${message.length}`);
    
    if ((!message.trim() && uploadedImages.length === 0) || isProcessing) {
      console.log('⛔ SUBMISSION BLOCKED - Empty message or processing in progress');
      return;
    }

    // Handle search mode differently - perform a search instead of sending a chat message
    if (isSearchMode) {
      console.log(`🌐 EXECUTING INTERNET SEARCH - Query: "${message}"`);
      toast.loading(`Searching the web for: "${message}"`, { id: 'search-toast' });
      
      setIsProcessing(true);
      try {
        console.log('🔍 CALLING SEARCH API...');
        await performSearch(message);
        console.log('✅ SEARCH COMPLETE - Input cleared');
        toast.success(`Search results found for: "${message}"`, { id: 'search-toast' });
        setMessage(""); // Clear input after search
      } catch (error) {
        console.error("❌ SEARCH ERROR:", error);
        toast.error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'search-toast' });
        console.log('💡 TROUBLESHOOTING TIPS: Check network connection, API endpoint, and server status');
      } finally {
        setIsProcessing(false);
        console.log('🔄 SEARCH PROCESSING COMPLETE - UI ready for next action');
      }
      return;
    }

    const messageContent = message.trim();
    setIsProcessing(true);
    
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
            const updatedChat = await chatService.addMessageWithAttachments(
              currentChat.id, 
              userMessage, 
              imagesToSend
            );
            if (updatedChat && updatedChat.data) {
              setCurrentChat(updatedChat.data);
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
            Hi, I'm Agentando AI.
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
                    placeholder="Ask Agentando AI"
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
                      console.log(`🔍 SEARCH BUTTON CLICKED - Current search mode: ${isSearchMode ? 'ENABLED' : 'DISABLED'}`);
                      
                      // Toggle search mode using the context function
                      toggleSearchMode();
                      
                      // Log the new state after toggling
                      console.log(`🔍 SEARCH MODE TOGGLED - New search mode: ${!isSearchMode ? 'ENABLED' : 'DISABLED'}`);
                      
                      // Show toast notification
                      const newMode = !isSearchMode;
                      toast.success(newMode ? "Internet search mode enabled" : "Internet search mode disabled", { 
                        icon: "🔍",
                        duration: 2000
                      });
                      
                      // Log instructions for the user
                      if (newMode) {
                        console.log('🌐 INTERNET SEARCH READY - Type a search query and press Send to search the web');
                      }
                    }}
                    aria-pressed={isSearchMode}
                  >
                    <Search className="w-4 h-4" />
                    <span className="text-sm font-medium">{isSearchMode ? "Searching" : "Search"}</span>
                  </button>
                </div>
                
                {/* AI reference notice on the right side */}
                <div className="text-xs text-gray-500">Agentando AI | Verify important Info.</div>
              </div>
            </form>
          </div>
          
          {/* Small caption */}
          <p className="text-gray-600 text-xs mt-4 text-center animate-pulse">Type your message and press Enter</p>
        </div>
        
        {/* Enhanced background effects */}
        <div className="absolute inset-0 bg-gradient-radial from-[#00F3FF]/10 to-transparent opacity-20 pointer-events-none animate-pulse-slow" style={{ width: '100%', height: '100%' }}></div>
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
        {/* Search Results Section */}
        {isSearchMode && searchResults.length > 0 && (
          <div className="mb-8 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded-xl p-4 shadow-lg transition-all">
            <h3 className="text-[#00F3FF] text-lg mb-3 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Search Results
            </h3>
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div key={index} className="border-b border-gray-700 pb-3 last:border-b-0">
                  <a 
                    href={result.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white hover:text-[#00F3FF] font-medium transition-colors"
                  >
                    {result.title}
                  </a>
                  <div className="text-gray-400 text-sm mt-1">{result.url}</div>
                  <p className="text-gray-300 text-sm mt-2">{result.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Render search status when searching */}
        {isSearchMode && isSearching && (
          <div className="mb-8 text-center">
            <div className="inline-block bg-[#1A1A1A] rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center text-[#00F3FF]">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00F3FF] mr-2"></div>
                Searching...
              </div>
            </div>
          </div>
        )}
        
        {/* Render chat messages if not in search mode or if we have no search results yet */}
        {(!isSearchMode || (isSearchMode && searchResults.length === 0 && !isSearching)) && currentChat && (
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
                      <MessageFormatter content={msg.content} role={msg.role} />
                      
                      {/* Display message attachments if any */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="message-attachments">
                          {msg.attachments.map((attachment: Attachment, index: number) => (
                            <div key={index} className="message-attachment">
                              {attachment.type === 'image' && (
                                <img 
                                  src={attachment.url || attachment.preview_url} 
                                  alt={attachment.name} 
                                  className="message-image"
                                  onClick={() => window.open(attachment.url || attachment.preview_url, '_blank')}
                                />
                              )}
                            </div>
                          ))}
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
                placeholder={isSearchMode ? "Search the web..." : "Ask Agentando AI"}
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
            <button 
              type="button" 
              className={`search-text-button ${isSearchMode ? 'search-active' : ''}`}
              onClick={toggleSearchMode}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </button>
          </div>
          
          {/* Search results display */}
          {isSearchMode && (
            <div className="search-results-container">
              {isSearching ? (
                <div className="search-loading">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="search-results-list">
                  {searchResults.map((result: SearchResult, index: number) => (
                    <div key={index} className="search-result-item">
                      <h4 className="search-result-title">{result.title}</h4>
                      <p className="search-result-snippet">{result.snippet}</p>
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="search-result-url">
                        {result.url}
                      </a>
                    </div>
                  ))}
                </div>
              ) : message.trim() ? (
                <div className="search-empty">Press Enter to search</div>
              ) : (
                <div className="search-empty">Type a search query</div>
              )}
            </div>
          )}
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
        <div className="chat-ai-notice">Agentando AI | Verify important Info.</div>
      </div>
    </div>
  );
};

export default Chat;
