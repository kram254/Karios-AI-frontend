import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { FileUpload } from "./FileUpload";
import { useChat } from "../context/ChatContext";
import { motion } from "framer-motion";
import toast from 'react-hot-toast';

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
}

const Chat: React.FC = () => {
  const { currentChat, addMessage, loading, createNewChat } = useChat();
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

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {currentChat.messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                msg.role === "user"
                  ? "bg-cyan-500 text-black"
                  : "bg-[#2A2A2A] text-white"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div className="mt-2 text-xs opacity-70">
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

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#2A2A2A]">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full p-4 pr-12 bg-[#2A2A2A] text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
            className="p-4 bg-cyan-500 text-black rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
