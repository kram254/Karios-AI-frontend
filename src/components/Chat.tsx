import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Plus, Loader2 } from "lucide-react"; // Added Loader2 import
import { format } from "date-fns";
import { FileUpload } from "./FileUpload";
import { useChat } from "../context/ChatContext";
import { motion } from "framer-motion";
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
}

// Added missing interfaces
interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

interface ChatContextType {
  currentChat: Chat | null;
  addMessage: (message: Message) => void;
  loading: boolean;
  createNewChat: () => void;
}

const Chat: React.FC = () => {
  const { currentChat, addMessage, loading, createNewChat } = useChat() as ChatContextType; // Added type assertion
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

  const handleSystemMessage = (message: string) => {
    addMessage({
      id: Date.now().toString(),
      content: message,
      role: "system",
      timestamp: new Date(),
    });
  };

  const handleFileUploadComplete = (documentId: string) => {
    setCurrentDocumentId(documentId);
    setShowFileUpload(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !currentChat || sendingMessage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date()
    };

    try {
      setSendingMessage(true);
      addMessage(userMessage);
      setInput("");

      const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/chat/message', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          chat_id: currentChat.id,
          document_id: currentDocumentId
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      
      addMessage({
        id: Date.now().toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Agentando AI</h2>
          <p className="text-gray-400 mb-6">Start a new conversation or select a chat from the sidebar</p>
          <button
            onClick={() => createNewChat()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Start New Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Chat Header */}
      <div className="border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold text-white">{currentChat.title}</h2>
        </div>
        <button
          onClick={() => setShowFileUpload(true)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 text-blue-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "assistant"
                  ? "bg-gray-800 text-white"
                  : "bg-blue-500 text-white"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-50 mt-1 block">
                {format(new Date(message.timestamp), "HH:mm")}
              </span>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sendingMessage}
          />
          <button
            onClick={handleSendMessage}
            disabled={sendingMessage || !input.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Upload Document</h3>
              <button
                onClick={() => setShowFileUpload(false)}
                className="text-gray-400 hover:text-white"
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






















// import React, { useState, useEffect, useRef } from "react";
// import { MessageSquare, Send, X, Plus } from "lucide-react";
// import { format } from "date-fns";
// import { FileUpload } from "./FileUpload";
// import { useChat } from "../context/ChatContext";
// import { motion } from "framer-motion";
// import toast from 'react-hot-toast';

// interface Message {
//   id: string;
//   content: string;
//   role: "user" | "assistant" | "system";
//   timestamp: Date;
// }

// const Chat: React.FC = () => {
//   const { currentChat, addMessage, loading, createNewChat } = useChat();
//   const [input, setInput] = useState("");
//   const [sendingMessage, setSendingMessage] = useState(false);
//   const [showFileUpload, setShowFileUpload] = useState(false);
//   const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
//   const messagesEndRef = useRef<null | HTMLDivElement>(null);

//   useEffect(() => {
//     scrollToBottom();
//   }, [currentChat?.messages]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const handleSystemMessage = (message: string) => {
//     addMessage({
//       id: Date.now().toString(),
//       content: message,
//       role: "system",
//       timestamp: new Date(),
//     });
//   };

//   const handleFileUploadComplete = (documentId: string) => {
//     setCurrentDocumentId(documentId);
//     setShowFileUpload(false);
//   };

//   const handleSendMessage = async () => {
//     if (!input.trim() || !currentChat || sendingMessage) return;

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       content: input,
//       role: "user",
//       timestamp: new Date()
//     };

//     try {
//       setSendingMessage(true);
//       addMessage(userMessage);
//       setInput("");

//       const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/chat/message', {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           message: input,
//           chat_id: currentChat.id,
//           document_id: currentDocumentId
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to send message");
//       }

//       const data = await response.json();
      
//       addMessage({
//         id: Date.now().toString(),
//         content: data.response,
//         role: "assistant",
//         timestamp: new Date()
//       });
//     } catch (error) {
//       console.error("Error sending message:", error);
//       toast.error("Failed to send message");
//     } finally {
//       setSendingMessage(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex-1 flex items-center justify-center bg-gray-900">
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
//           <p className="text-gray-400">Loading chats...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!currentChat) {
//     return (
//       <div className="flex-1 flex items-center justify-center bg-gray-900">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold text-white mb-2">Welcome to Agentando AI</h2>
//           <p className="text-gray-400 mb-6">Start a new conversation or select a chat from the sidebar</p>
//           <button
//             onClick={() => createNewChat()}
//             className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
//           >
//             Start New Chat
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 flex flex-col bg-gray-900">
//       {/* Chat Header */}
//       <div className="border-b border-gray-700 p-4 flex items-center justify-between">
//         <div className="flex items-center space-x-3">
//           <MessageSquare className="w-6 h-6 text-blue-500" />
//           <h2 className="text-lg font-semibold text-white">{currentChat.title}</h2>
//         </div>
//         <button
//           onClick={() => setShowFileUpload(true)}
//           className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
//         >
//           <Plus className="w-5 h-5 text-blue-500" />
//         </button>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {currentChat.messages.map((message) => (
//           <motion.div
//             key={message.id}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className={`flex ${
//               message.role === "assistant" ? "justify-start" : "justify-end"
//             }`}
//           >
//             <div
//               className={`max-w-[80%] p-3 rounded-lg ${
//                 message.role === "assistant"
//                   ? "bg-gray-800 text-white"
//                   : "bg-blue-500 text-white"
//               }`}
//             >
//               <p className="whitespace-pre-wrap">{message.content}</p>
//               <span className="text-xs opacity-50 mt-1 block">
//                 {format(new Date(message.timestamp), "HH:mm")}
//               </span>
//             </div>
//           </motion.div>
//         ))}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <div className="border-t border-gray-700 p-4">
//         <div className="flex space-x-4">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
//             placeholder="Type your message..."
//             className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             disabled={sendingMessage}
//           />
//           <button
//             onClick={handleSendMessage}
//             disabled={sendingMessage || !input.trim()}
//             className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
//           >
//             <Send className="w-5 h-5" />
//           </button>
//         </div>
//       </div>

//       {/* File Upload Modal */}
//       {showFileUpload && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
//           <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold text-white">Upload Document</h3>
//               <button
//                 onClick={() => setShowFileUpload(false)}
//                 className="text-gray-400 hover:text-white"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//             <FileUpload 
//               onUploadComplete={handleFileUploadComplete} 
//               onSystemMessage={handleSystemMessage}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Chat;
