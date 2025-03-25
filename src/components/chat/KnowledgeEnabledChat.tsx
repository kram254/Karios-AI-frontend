import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Topic as TopicIcon
} from '@mui/icons-material';
import { chatService, ChatMessage } from '../../services/api/chat.service';
import { categoryService } from '../../services/api/category.service';
import { Category } from '../../types/knowledge';
import { format } from 'date-fns';
import { api } from '../../services/api/index'; // Import the api instance
import { formatMessageContent } from '../../utils/formatMessage';

interface KnowledgeEnabledChatProps {
  chatId?: string;
  agentId?: number;
}

export const KnowledgeEnabledChat: React.FC<KnowledgeEnabledChatProps> = ({ chatId, agentId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
    
    // If chatId is provided, load chat history
    if (chatId) {
      fetchChatHistory(chatId);
    }
    // No initial system message as requested
  }, [chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load knowledge categories.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchChatHistory = async (id: string) => {
    setLoading(true);
    try {
      const response = await chatService.getChat(id);
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError('Failed to load chat history.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value as unknown as number[];
    setSelectedCategories(value);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      created_at: new Date().toISOString()
    };
    
    // Update UI immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      // If agent ID is provided, use agent-specific endpoint
      if (agentId) {
        response = await chatService.chatWithAgent(agentId, input);
      } 
      // Otherwise use knowledge-based query
      else if (chatId) {
        // If we have a chat ID, query with knowledge
        response = await chatService.queryWithKnowledge(
          chatId,
          input, 
          selectedCategories.length > 0 ? selectedCategories : undefined
        );
      } else {
        // Handle the case where we don't have a chatId yet
        // We'll create a chat after getting the response
        // For now, let's just use a direct API call since the interface doesn't match our need
        response = await api.post('/api/chat/query', {
          query: input,
          category_ids: selectedCategories.length > 0 ? selectedCategories : undefined
        });
      }
      
      // Extract the response content safely
      let responseContent = '';
      if (response.data) {
        if (typeof response.data === 'string') {
          responseContent = response.data;
        } else if (typeof response.data === 'object') {
          if ('content' in response.data && typeof response.data.content === 'string') {
            responseContent = response.data.content;
          } else if ('response' in response.data && typeof response.data.response === 'string') {
            responseContent = response.data.response;
          } else {
            responseContent = JSON.stringify(response.data);
          }
        }
      }
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        created_at: new Date().toISOString()
      };
      
      // Add assistant message to chat
      setMessages(prev => [...prev, assistantMessage]);
      
      // If this is a new chat, we should create it in the backend
      if (!chatId) {
        try {
          const newChat = await chatService.createChat({
            title: input.substring(0, 30) + (input.length > 30 ? '...' : '')
          });
          
          // Add both messages to the new chat
          await chatService.addMessage(newChat.data.id, userMessage);
          await chatService.addMessage(newChat.data.id, assistantMessage);
        } catch (err) {
          console.error('Error creating new chat:', err);
        }
      } else {
        // Add messages to existing chat
        await chatService.addMessage(chatId, userMessage);
        await chatService.addMessage(chatId, assistantMessage);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
  };

  return (
    <div
      style={{
        backgroundColor: '#2c2c2c',
        color: '#FFFFFF',
        minHeight: '100vh',
        padding: '20px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Typography variant="h5" sx={{ color: '#FFFFFF', mb: 2 }}>
        Agents
      </Typography>
      {loading ? (
        <Typography variant="body1" sx={{ color: '#FFFFFF', textAlign: 'center' }}>
          Loading agents...
        </Typography>
      ) : (
        <Paper 
          elevation={0} 
          sx={{ 
            backgroundColor: '#424242', 
            color: '#FFFFFF', 
            padding: '20px', 
            borderRadius: '8px' 
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <FormControl fullWidth sx={{ m: 1 }}>
                <InputLabel 
                  id="category-select-label"
                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  Knowledge Categories
                </InputLabel>
                <Select
                  labelId="category-select-label"
                  multiple
                  value={selectedCategories}
                  onChange={handleCategoryChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const category = categories.find(cat => cat.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={category?.name || 'Unknown'} 
                            sx={{ 
                              bgcolor: 'rgba(0, 243, 255, 0.1)',
                              color: '#00F3FF',
                              borderRadius: '4px'
                            }} 
                          />
                        );
                      })}
                    </Box>
                  )}
                  sx={{
                    color: '#FFFFFF',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 243, 255, 0.5)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00F3FF'
                    }
                  }}
                >
                  {loadingCategories ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading...
                    </MenuItem>
                  ) : categories.length === 0 ? (
                    <MenuItem disabled>No categories available</MenuItem>
                  ) : (
                    categories.map((category) => (
                      <MenuItem 
                        key={category.id} 
                        value={category.id}
                        sx={{
                          color: '#FFFFFF',
                          '&.Mui-selected': {
                            bgcolor: 'rgba(0, 243, 255, 0.1)',
                            color: '#00F3FF'
                          },
                          '&.Mui-selected:hover': {
                            bgcolor: 'rgba(0, 243, 255, 0.2)'
                          }
                        }}
                      >
                        <TopicIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.5)' }} />
                        {category.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Select categories to enhance AI responses with your knowledge base.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Chat Messages */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 2,
          bgcolor: '#121212',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {messages.filter(msg => msg.role !== 'system').length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              opacity: 0.7
            }}
          >
            <BotIcon sx={{ fontSize: 64, color: '#00F3FF', mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
              AI Assistant
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', maxWidth: '600px' }}>
              Ask me anything about your uploaded documents. I'll use my AI capabilities combined with your knowledge base to provide accurate responses.
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => (
            message.role !== 'system' && (
              <Box 
                key={index}
                sx={{ 
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                <Paper 
                  elevation={1}
                  sx={{ 
                    maxWidth: '70%',
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: message.role === 'user' ? 'rgba(0, 243, 255, 0.1)' : '#1A1A1A',
                    color: '#FFFFFF',
                    ...(message.role === 'user' 
                      ? { borderTopRightRadius: '4px' } 
                      : { borderTopLeftRadius: '4px' })
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar 
                      sx={{ 
                        width: 28, 
                        height: 28, 
                        mr: 1,
                        bgcolor: message.role === 'user' ? '#00F3FF' : '#9c27b0'
                      }}
                    >
                      {message.role === 'user' ? <PersonIcon /> : <BotIcon />}
                    </Avatar>
                    <Typography 
                      variant="subtitle2"
                      sx={{ 
                        color: message.role === 'user' ? '#00F3FF' : '#9c27b0',
                        fontWeight: 'bold'
                      }}
                    >
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </Typography>
                    
                    {message.created_at && (
                      <Typography 
                        variant="caption" 
                        sx={{ ml: 1, color: 'rgba(255, 255, 255, 0.5)' }}
                      >
                        {formatTimestamp(message.created_at)}
                      </Typography>
                    )}
                  </Box>
                  
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {formatMessageContent(message.content, message.role)}
                  </Typography>
                </Paper>
              </Box>
            )
          ))
        )}
        <div ref={messagesEndRef} />
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={40} sx={{ color: '#00F3FF' }} />
          </Box>
        )}
        
        {error && (
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: 'rgba(244, 67, 54, 0.1)', 
              color: '#f44336',
              borderRadius: '8px',
              mt: 2
            }}
          >
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
      </Box>
      
      {/* Message Input */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2,
          bgcolor: '#1A1A1A',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              sx={{
                '.MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '24px',
                  padding: '8px 16px',
                  '& fieldset': { border: 'none' }
                },
                '.MuiOutlinedInput-input': {
                  padding: '10px 0'
                }
              }}
            />
          </Grid>
          <Grid item>
            <IconButton 
              color="primary" 
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              sx={{
                bgcolor: '#00F3FF',
                color: '#000000',
                width: 48,
                height: 48,
                '&:hover': {
                  bgcolor: '#00D4E0'
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(0, 243, 255, 0.2)',
                  color: 'rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default KnowledgeEnabledChat;