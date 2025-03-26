import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useChat } from "../context/ChatContext";
import { motion } from "framer-motion";
import toast from 'react-hot-toast';
import { MessageFormatter } from "./MessageFormatter";
import AgentInfoBanner from "./agent/AgentInfoBanner";
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
  const { currentChat, addMessage, createNewChat } = useChat();
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

    setIsProcessing(true);
    try {
      await addMessage({
        role: "user",
        content: message.trim()
      });
      setMessage("");
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

  // *Modizx* Added welcome screen when no chat is selected
  if (!currentChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0A0A0A] text-white p-8">
        <MessageSquare className="w-16 h-16 mb-4 text-cyan-500" />
        <h1 className="text-2xl font-bold mb-2">Welcome to Agentando AI</h1>
        <p className="text-gray-400 text-center mb-6">Start a new conversation or select an existing chat</p>
        <button
          onClick={() => createNewChat()}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>
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
        {currentChat.messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`message-container ${msg.role === "user" ? "user" : "agent"}`}
          >
            <div
              className={`message-content ${msg.role}`}
            >
              <MessageFormatter content={msg.content} role={msg.role} />
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
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
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
