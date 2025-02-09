import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';

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
  setCurrentChat: (chat: Chat | null) => void;
  createNewChat: () => void;
  addMessage: (message: Message) => void;
  loadChats: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);

  const loadChats = async () => {
    try {
      const response = await fetch('/api/chat/chats');
      if (!response.ok) throw new Error('Failed to load chats');
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetch('/api/chat/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' })
      });
      if (!response.ok) throw new Error('Failed to create chat');
      const newChat = await response.json();
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
    } catch (error) {
      console.error('Error creating chat:', error);
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

    // Persist message to backend
    try {
      await fetch(`/api/chat/chats/${currentChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await fetch(`/api/chat/chats/${chatId}`, { method: 'DELETE' });
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    try {
      await fetch(`/api/chat/chats/${chatId}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      
      setChats(prev => 
        prev.map(chat => 
          chat.id === chatId ? { ...chat, title } : chat
        )
      );
      
      if (currentChat?.id === chatId) {
        setCurrentChat(prev => prev ? { ...prev, title } : null);
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const value = {
    currentChat,
    chats,
    setCurrentChat,
    createNewChat,
    addMessage,
    loadChats,
    deleteChat,
    updateChatTitle
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
