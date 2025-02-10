import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
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
  chats: Chat[];
  loading: boolean;
  setCurrentChat: (chat: Chat | null) => void;
  createNewChat: () => Promise<void>;
  addMessage: (message: Message) => void;
  loadChats: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/chat/chats');
      if (!response.ok) throw new Error('Failed to load chats');
      const data = await response.json();
      setChats(data);
      
      // If there are chats but no current chat selected, select the first one
      if (data.length > 0 && !currentChat) {
        setCurrentChat(data[0]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/chat/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' })
      });
      
      if (!response.ok) throw new Error('Failed to create chat');
      
      const newChat = await response.json();
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      toast.success('New chat created');
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat');
    }
  };

  const addMessage = async (message: Message) => {
    if (!currentChat) return;

    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, message],
      updated_at: new Date().toISOString()
    };

    setCurrentChat(updatedChat);
    setChats(prev => 
      prev.map(chat => 
        chat.id === updatedChat.id ? updatedChat : chat
      )
    );

    try {
      const response = await fetch(import.meta.env.VITE_BACKEND_URL + `/chat/chats/${currentChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) throw new Error('Failed to save message');
      const data = await response.json();
      
      // Update chat with server response
      const serverUpdatedChat = {
        ...currentChat,
        messages: data.messages,
        updated_at: data.updated_at
      };
      
      setCurrentChat(serverUpdatedChat);
      setChats(prev => 
        prev.map(chat => 
          chat.id === serverUpdatedChat.id ? serverUpdatedChat : chat
        )
      );
    } catch (error) {
      console.error('Error saving message:', error);
      toast.error('Failed to save message');
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(import.meta.env.VITE_BACKEND_URL + `/chat/chats/${chatId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete chat');
      
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
      }
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    try {
      const response = await fetch(import.meta.env.VITE_BACKEND_URL + `/chat/chats/${chatId}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      
      if (!response.ok) throw new Error('Failed to update chat title');
      
      const updatedChat = await response.json();
      setChats(prev => 
        prev.map(chat => 
          chat.id === chatId ? updatedChat : chat
        )
      );
      
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedChat);
      }
      toast.success('Chat title updated');
    } catch (error) {
      console.error('Error updating chat title:', error);
      toast.error('Failed to update chat title');
    }
  };

  return (
    <ChatContext.Provider 
      value={{
        currentChat,
        chats,
        loading,
        setCurrentChat,
        createNewChat,
        addMessage,
        loadChats,
        deleteChat,
        updateChatTitle
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
