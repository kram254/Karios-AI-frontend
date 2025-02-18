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
  created_at: string;
  chat_id?: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface ChatContextType {
  currentChat: Chat | null;
  addMessage: (message: { role: "user" | "assistant" | "system"; content: string }) => Promise<void>;
  loading: boolean;
  createNewChat: () => Promise<Chat>;
}

const Chat: React.FC = () => {
  const { currentChat, addMessage, loading, createNewChat } = useChat();
  const [input, setInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSystemMessage = async (message: string) => {
    await addMessage({
      content: message,
      role: "system"
    });
  };

  const handleFileUploadComplete = (documentId: string) => {
    setCurrentDocumentId(documentId);
    setShowFileUpload(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !currentChat || sendingMessage) return;

    try {
      setSendingMessage(true);
      await addMessage({
        content: input.trim(),
        role: "user"
      });
      setInput("");

      // The assistant's response will be handled by the ChatContext
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A] relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-[#00F3FF] to-transparent opacity-50" />
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent opacity-50" />
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent opacity-50" />
        </div>
        <div className="text-center z-10">
          <Loader2 className="w-12 h-12 text-[#00F3FF] mx-auto mb-4 animate-spin" />
          <p className="text-[#00F3FF]/70">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A] relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-[#00F3FF] to-transparent opacity-50" />
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent opacity-50" />
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent opacity-50" />
        </div>
        <div className="text-center z-10">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Agentando AI</h2>
          <p className="text-[#00F3FF]/70 mb-6">Start a new conversation or select a chat from the sidebar</p>
          <button
            onClick={async () => {
              try {
                await createNewChat();
              } catch (error) {
                console.error("Error creating new chat:", error);
                toast.error("Failed to create new chat");
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-[#00F3FF] to-[#00D4FF] text-black rounded-lg hover:from-[#00D4FF] hover:to-[#00F3FF] transition-all duration-300 transform hover:scale-[1.02] font-medium shadow-[0_0_15px_-3px_rgba(0,243,255,0.4)]"
          >
            Start New Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0A] relative">
      {/* Neon border effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-[#00F3FF] to-transparent opacity-50" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent opacity-50" />
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent opacity-50" />
      </div>

      {/* Chat Header */}
      <div className="border-b border-[#00F3FF]/20 p-4 flex items-center justify-between bg-gradient-to-r from-[#0A0A0A] to-[#0A0A0A] relative z-10">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-[#00F3FF] animate-pulse" />
          <h2 className="text-lg font-semibold text-white">{currentChat.title}</h2>
        </div>
        <button
          onClick={() => setShowFileUpload(true)}
          className="p-2 hover:bg-[#00F3FF]/10 rounded-lg transition-all duration-300 group"
        >
          <Plus className="w-5 h-5 text-[#00F3FF] group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#00F3FF]/40 scrollbar-track-gray-800/40 relative z-10">
        {currentChat.messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              message.role === "assistant" ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg shadow-lg ${
                message.role === "assistant"
                  ? "bg-gradient-to-r from-gray-800/80 to-gray-800/60 text-white border border-[#00F3FF]/20"
                  : "bg-gradient-to-r from-[#00F3FF] to-[#00D4FF] text-black"
              } backdrop-blur-sm`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-70 mt-2 block">
                {format(new Date(message.created_at), "HH:mm")}
              </span>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#00F3FF]/20 p-4 bg-gradient-to-t from-[#0A0A0A] to-transparent relative z-10">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00F3FF]/50 border border-[#00F3FF]/20 placeholder-gray-400 transition-all duration-300"
            disabled={sendingMessage}
          />
          <button
            onClick={handleSendMessage}
            disabled={sendingMessage || !input.trim()}
            className="p-3 bg-gradient-to-r from-[#00F3FF] to-[#00D4FF] text-black rounded-lg hover:from-[#00D4FF] hover:to-[#00F3FF] transition-all duration-300 disabled:opacity-50 disabled:hover:from-[#00F3FF] disabled:hover:to-[#00D4FF] shadow-[0_0_15px_-3px_rgba(0,243,255,0.4)] hover:shadow-[0_0_20px_-3px_rgba(0,243,255,0.6)]"
          >
            <Send className="w-5 h-5 transform rotate-0 hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0A0A0A] p-6 rounded-lg w-full max-w-md border border-[#00F3FF]/20 shadow-[0_0_30px_-5px_rgba(0,243,255,0.3)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Upload Document</h3>
              <button
                onClick={() => setShowFileUpload(false)}
                className="text-gray-400 hover:text-[#00F3FF] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FileUpload 
              onUploadComplete={handleFileUploadComplete} 
              onSystemMessage={handleSystemMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
