import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
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
  chats: Chat[];
  loading: boolean;
  setCurrentChat: (chat: Chat | null) => void;
  createNewChat: () => Promise<Chat>;
  addMessage: (message: { role: "user" | "assistant" | "system"; content: string }) => Promise<void>;
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
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat/chats`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to load chats');
      }
      const data = await response.json();
      
      // Sort chats by updated_at in descending order
      const sortedChats = data.sort((a: Chat, b: Chat) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      
      setChats(sortedChats);
      
      if (sortedChats.length > 0 && !currentChat) {
        setCurrentChat(sortedChats[0]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to create chat');
      }
      
      const newChat: Chat = await response.json();
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      toast.success('New chat created');
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create chat. Please try again.');
      throw error;
    }
  };

  const addMessage = async (message: { role: "user" | "assistant" | "system"; content: string }) => {
    if (!currentChat) {
      try {
        const newChat = await createNewChat();
        setCurrentChat(newChat);
      } catch (error) {
        console.error('Error creating new chat for message:', error);
        return;
      }
    }

    const chatToUpdate = currentChat!;
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      content: message.content,
      role: message.role,
      created_at: new Date().toISOString(),
      chat_id: chatToUpdate.id
    };

    const updatedChat: Chat = {
      ...chatToUpdate,
      messages: [...chatToUpdate.messages, optimisticMessage],
      updated_at: new Date().toISOString()
    };

    // Optimistic update
    setCurrentChat(updatedChat);
    setChats(prev => prev.map(chat => 
      chat.id === updatedChat.id ? updatedChat : chat
    ));

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat/chats/${chatToUpdate.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to save message');
      }
      
      const data: Chat = await response.json();
      setCurrentChat(data);
      setChats(prev => prev.map(chat => 
        chat.id === data.id ? data : chat
      ));
    } catch (error) {
      console.error('Error saving message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save message. Please try again.');
      
      // Revert optimistic update on error
      setCurrentChat(chatToUpdate);
      setChats(prev => prev.map(chat => 
        chat.id === chatToUpdate.id ? chatToUpdate : chat
      ));
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat/chats/${chatId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to delete chat');
      }
      
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        setCurrentChat(remainingChats.length > 0 ? remainingChats[0] : null);
      }
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete chat. Please try again.');
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    if (!title.trim()) {
      toast.error('Chat title cannot be empty');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat/chats/${chatId}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to update chat title');
      }
      
      const updatedChat: Chat = await response.json();
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedChat);
      }
      toast.success('Chat title updated');
    } catch (error) {
      console.error('Error updating chat title:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update chat title. Please try again.');
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
