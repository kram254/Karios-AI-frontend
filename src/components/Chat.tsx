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
    if ((!message.trim() && uploadedImages.length === 0) || isProcessing) return;

    // If we're in search mode, perform a search instead of sending a chat message
    if (isSearchMode && message.trim()) {
      performSearch(message);
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
          
          {/* Message Input Area with glowing border */}
          <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl bg-[#1A1A1A] rounded-xl shadow-lg overflow-hidden border border-[#00F3FF]/20 glow-border transition-all duration-300 hover:border-[#00F3FF]/40 hover:shadow-[#00F3FF]/20 hover:shadow-xl">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                placeholder="Message Agentando AI..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-[#1A1A1A] text-white outline-none border-none py-3 px-4 resize-none h-[56px] sm:h-[64px] placeholder-gray-500 focus:placeholder-[#00F3FF]/50 transition-all"
                disabled={isProcessing}
              />
              <div className="absolute bottom-0 right-0 flex items-center p-2">
                {/* New chat button with enhanced hover effect - just creates a new chat without sending a message */}
                <button 
                  type="button" 
                  className="text-gray-400 hover:text-[#00F3FF] p-2 rounded-full transition-all duration-300 hover:bg-[#00F3FF]/10 hover:shadow-inner"
                  onClick={async () => {
                    setIsProcessing(true);
                    try {
                      await createNewChat();
                      // Clear any message in the input field after creating a new chat
                      setMessage("");
                    } catch (error) {
                      console.error("Error creating new chat:", error);
                      toast.error("Failed to create new chat");
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                >
                  {/* <Plus className="w-5 h-5" /> */}
                </button>
                {/* Send button with glowing effect when active */}
                <button 
                  type="submit" 
                  disabled={!message.trim() || isProcessing}
                  className={`p-2 rounded-full transition-all duration-300 ${!message.trim() || isProcessing ? 'text-gray-500' : 'text-[#00F3FF] hover:bg-[#00F3FF]/10 hover:shadow-sm hover:shadow-[#00F3FF]/20 active:bg-[#00F3FF]/20'}`}
                >
                  <Send className="w-5 h-5" />
                </button>
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
                value={message}
                onChange={(e) => setMessage(e.target.value)}
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
        <div className="chat-ai-notice">Agentando AI | For reference only.</div>
      </div>
    </div>
  );
};

export default Chat;
