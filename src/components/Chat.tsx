import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Plus, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { FileUpload } from "./FileUpload";
import { notify } from "../services/notifications";

interface Message {
  id: string;
  content: string;
  type: "user" | "assistant" | "system";
  timestamp: Date;
}

const Chat: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSystemMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: message,
        type: "system",
        timestamp: new Date(),
      },
    ]);
  };

  const handleFileUploadComplete = (documentId: string) => {
    setCurrentDocumentId(documentId);
    setShowFileUpload(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      type: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://agentando-ai-backend.onrender.com/api/retrieve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: input,
          document_id: currentDocumentId
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: Date.now().toString() + "-ai",
        content: data.response || "I apologize, but I couldn't process that request.",
        type: "assistant",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error in chat:", error);
      notify.error("Failed to get response from AI");
      
      const errorMessage: Message = {
        id: Date.now().toString() + "-error",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        type: "system",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full">
        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === "user"
                    ? "bg-[#00F3FF]/10 text-white"
                    : message.type === "system"
                    ? "bg-[#2A2A2A] text-[#00F3FF]"
                    : "bg-[#1A1A1A] text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div className="text-xs mt-1 text-gray-500">
                  {format(message.timestamp, "HH:mm")}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-lg bg-[#1A1A1A] text-white">
                <div className="typing-indicator">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* File Upload Modal */}
        {showFileUpload && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6">
            <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Upload Files</h2>
                <button
                  onClick={() => setShowFileUpload(false)}
                  className="p-1 hover:bg-[#2A2A2A] rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-[#00F3FF]" />
                </button>
              </div>
              <FileUpload
                onUploadComplete={handleFileUploadComplete}
                onSystemMessage={handleSystemMessage}
              />
            </div>
          </div>
        )}

        {/* Input Area */}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              handleSendMessage();
            }
          }}
          className="p-4 border-t border-[#00F3FF]/20"
        >
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setShowFileUpload(true)}
              className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#2A2A2A] transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-[#1A1A1A] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00F3FF]/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-6 py-2 bg-[#00F3FF] text-black rounded-lg hover:bg-[#00F3FF]/90 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
