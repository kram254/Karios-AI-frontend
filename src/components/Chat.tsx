import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Plus } from "lucide-react";
import { format } from "date-fns";
import { useChat } from "../context/ChatContext";
import { motion } from "framer-motion";
import toast from 'react-hot-toast';
import AgentInfoBanner from "./agent/AgentInfoBanner";
import MessageFormatter from "./MessageFormatter";
import { chatService } from "../services/api/chat.service";
import "../styles/chat.css";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp?: Date | string;
  created_at?: string;
  chat_id?: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  created_at?: string;
  updated_at?: string;
  agent_id?: string;
}

const Chat: React.FC = () => {
  const { currentChat, setCurrentChat, addMessage, createNewChat } = useChat();
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isProcessing) return;

    const messageContent = message.trim();
    setIsProcessing(true);
    
    try {
      // Store the message content before any async operations
      const userMessage = messageContent;
      
      // Clear the input field immediately for better UX
      setMessage("");
      
      // If no current chat, create a new one first
      if (!currentChat) {
        console.log('Creating new chat before sending message');
        
        try {
          // Create a new chat and wait for it to complete
          const newChat = await createNewChat();
          console.log('New chat created with ID:', newChat?.id);
          
          // Wait for the chat to be fully created and registered
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Now send the message to the newly created chat
          if (newChat && newChat.id) {
            console.log('Sending initial message to chat ID:', newChat.id);
            // Fix: Pass only the content string instead of an object with role
            await chatService.addMessage(newChat.id, userMessage);
            
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
        await addMessage({
          role: "user",
          content: userMessage
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsProcessing(false);
    }
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
                  <Plus className="w-5 h-5" />
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
                <MessageFormatter content={msg.content} role={msg.role} />
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

      {/* Input Form - Using new chat.css classes */}
      <form onSubmit={handleSubmit} className="chat-input-container">
        <div className="relative flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="chat-textarea w-full"
            rows={1}
            disabled={isProcessing}
          />
          {isProcessing && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <span className="text-sm font-medium text-cyan-500">Thinking...</span>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isProcessing}
          className="chat-send-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default Chat;
