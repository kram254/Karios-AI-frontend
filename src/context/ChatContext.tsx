import React, { createContext, useContext, useState, useEffect } from 'react';
import { chatService } from '../services/api/chat.service';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: Date | string;
  created_at?: string;
  chat_id?: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  created_at?: string; // For backend compatibility
  updated_at?: string; // For backend compatibility
}

interface ChatContextType {
  currentChat: Chat | null;
  chats: Chat[];
  loading: boolean;
  error: string | null;
  createNewChat: () => Promise<Chat | null>;
  setCurrentChat: (chat: Chat) => void;
  addMessage: (message: { role: 'user' | 'assistant' | 'system'; content: string }) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatService.getChats();
      console.log('Chats loaded:', response.data);
      setChats(response.data);
      
      if (response.data.length > 0 && !currentChat) {
        setCurrentChat(response.data[0]);
      }
      
      setError(null);
    } catch (err: unknown) {
      console.error('Error loading chats:', err);
      console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
      setError('Failed to load chats');
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      setLoading(true);
      console.log('Attempting to create a new chat...');
      const response = await chatService.createChat({
        title: 'New Chat',
        chat_type: 'default'
      });
      console.log('Chat created response:', response);
      
      const newChat = response.data;
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      
      toast.success('New chat created');
      setError(null);
      return newChat;
    } catch (err: unknown) {
      console.error('Error creating chat:', err);
      console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
      setError('Failed to create chat');
      toast.error('Failed to create chat');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addMessage = async ({ role, content }: { role: 'user' | 'assistant' | 'system'; content: string }) => {
    if (!currentChat) {
      try {
        await createNewChat();
      } catch (err: unknown) {
        console.error('Error creating new chat for message:', err);
        console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
        return;
      }
    }

    // Create optimistic update
    const tempId = Date.now().toString();
    const tempMessage: Message = {
      id: tempId,
      content,
      role,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      chat_id: currentChat?.id
    };

    setCurrentChat(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, tempMessage]
      };
    });

    try {
      if (!currentChat) return;
      
      const response = await chatService.addMessage(currentChat.id, {
        role,
        content
      });
      console.log('Message sent:', response.data);
      
      // Replace optimistic message with real one from server
      const updatedChat = response.data as Chat;
      setCurrentChat(updatedChat);
      
      // Update chat in chats list
      setChats(prev => 
        prev.map(chat => chat.id === updatedChat.id ? updatedChat : chat)
      );
      
      setError(null);
    } catch (err: unknown) {
      console.error('Error sending message:', err);
      console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
      setError('Failed to send message');
      toast.error('Failed to send message');
      
      // Revert optimistic update
      setCurrentChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== tempId)
        };
      });
      
      throw err;
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);
      
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (currentChat?.id === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        setCurrentChat(remainingChats.length > 0 ? remainingChats[0] : null);
      }
      
      toast.success('Chat deleted');
    } catch (err: unknown) {
      console.error('Error deleting chat:', err);
      console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
      toast.error('Failed to delete chat');
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    try {
      const response = await chatService.updateChatTitle(chatId, title);
      const updatedChat = response.data as Chat;
      
      setChats(prev => 
        prev.map(chat => chat.id === chatId ? updatedChat : chat)
      );
      
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedChat);
      }
      
      toast.success('Chat title updated');
    } catch (err: unknown) {
      console.error('Error updating chat title:', err);
      console.error('Error details:', (err as { response?: { data: string } }).response?.data || (err as { message: string }).message);
      toast.error('Failed to update chat title');
    }
  };

  const value = {
    currentChat,
    chats,
    loading,
    error,
    createNewChat,
    setCurrentChat,
    addMessage,
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
