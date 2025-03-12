import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography,
  Grid, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Link as LinkIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { KnowledgeItemManager } from '../components/knowledge/KnowledgeItemManager';
import { categoryService } from '../services/api/category.service';
import { agentService } from '../services/api/agent.service';
import { Agent, AgentStatus } from '../types/agent';
import { Category } from '../types/knowledge';
import { KnowledgeItem } from '../types/knowledge';

export const AgentKnowledgeManager: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Fetch agent and categories on component mount
  useEffect(() => {
    if (!agentId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch agent details
        const agentResponse = await agentService.getAgents();
        const foundAgent = agentResponse.data.find(a => a.id === parseInt(agentId));
        
        if (!foundAgent) {
          setError('Agent not found');
          setIsLoading(false);
          return;
        }
        
        setAgent(foundAgent);
        
        // Fetch categories
        const categoriesResponse = await categoryService.getCategories();
        setCategories(categoriesResponse.data);
        
        // Set first category as selected by default if any exist
        if (categoriesResponse.data.length > 0) {
          setSelectedCategory(categoriesResponse.data[0]);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load agent knowledge data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [agentId]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };
  
  const handleAssignKnowledge = async (knowledgeIds: number[]) => {
    if (!agent || !agentId) return;
    
    try {
      await agentService.assignKnowledge(agentId, knowledgeIds);
      setSuccessMessage('Knowledge items successfully assigned to agent');
      
      // Refresh agent data to show updated knowledge items
      const agentResponse = await agentService.getAgents();
      const updatedAgent = agentResponse.data.find(a => a.id === Number(agentId));
      if (updatedAgent) {
        setAgent(updatedAgent);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error assigning knowledge:', err);
      setError('Failed to assign knowledge items to agent');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };
  
  const handleRemoveKnowledge = async (knowledgeId: number) => {
    if (!agent || !agentId) return;
    
    try {
      await agentService.removeKnowledge(agentId, [knowledgeId]);
      setSuccessMessage('Knowledge item successfully removed from agent');
      
      // Refresh agent data to show updated knowledge items
      const agentResponse = await agentService.getAgents();
      const updatedAgent = agentResponse.data.find(a => a.id === Number(agentId));
      if (updatedAgent) {
        setAgent(updatedAgent);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error removing knowledge:', err);
      setError('Failed to remove knowledge item from agent');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#00F3FF' }} />
      </Box>
    );
  }
  
  if (error && !agent) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2, bgcolor: '#00F3FF', '&:hover': { bgcolor: '#00D4E0' } }}
          onClick={() => navigate('/agents')}
        >
          Return to Agents
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#1A1A1A', color: '#FFFFFF' }}>
        <Typography variant="h5" gutterBottom>
          Agent Knowledge Manager
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#00F3FF' }}>
          {agent?.name || 'Unknown Agent'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Manage knowledge items for this agent to enhance its responses with domain-specific information
        </Typography>
      </Paper>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Left Side - Categories and Knowledge Addition */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ bgcolor: '#1A1A1A', color: '#FFFFFF', height: '100%' }}>
            {/* Tabs */}
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTabs-indicator': { backgroundColor: '#00F3FF' },
                '& .Mui-selected': { color: '#00F3FF' }
              }}
            >
              <Tab label="Add Knowledge" />
              <Tab label="Assigned Knowledge" />
            </Tabs>
            
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            {/* Tab Content */}
            <Box sx={{ p: 2 }}>
              {tabValue === 0 && (
                <>
                  {/* Categories List */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: '#00F3FF' }}>
                      Select Category
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <Chip
                            key={category.id}
                            label={category.name}
                            onClick={() => handleCategorySelect(category)}
                            sx={{
                              bgcolor: selectedCategory?.id === category.id 
                                ? 'rgba(0, 243, 255, 0.2)' 
                                : 'rgba(255, 255, 255, 0.05)',
                              color: selectedCategory?.id === category.id ? '#00F3FF' : '#FFFFFF',
                              '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.1)' },
                              cursor: 'pointer'
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          No categories found. Please create a category first.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  {/* Knowledge Item Manager */}
                  {selectedCategory && (
                    <KnowledgeItemManager 
                      categoryId={selectedCategory.id.toString()}
                      onKnowledgeAdded={(knowledgeItem: KnowledgeItem) => {
                        if (knowledgeItem && knowledgeItem.id) {
                          handleAssignKnowledge([knowledgeItem.id]);
                        }
                      }}
                    />
                  )}
                </>
              )}
              
              {tabValue === 1 && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: '#00F3FF' }}>
                    Knowledge Items Assigned to Agent
                  </Typography>
                  
                  {agent?.knowledge_items && agent.knowledge_items.length > 0 ? (
                    <List>
                      {agent.knowledge_items.map((item: KnowledgeItem) => (
                        <ListItem 
                          key={item.id}
                          sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.05)', 
                            mb: 1, 
                            borderRadius: 1 
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ color: '#FFFFFF' }}>
                                {item.title || (item.file_name || 'Untitled')}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Chip 
                                  size="small" 
                                  label={item.content_type} 
                                  sx={{ 
                                    mr: 1, 
                                    bgcolor: 'rgba(0, 243, 255, 0.1)',
                                    color: '#00F3FF' 
                                  }} 
                                />
                                {item.url && (
                                  <Tooltip title={item.url}>
                                    <LinkIcon 
                                      fontSize="small"
                                      sx={{ color: 'rgba(255, 255, 255, 0.5)', verticalAlign: 'middle' }}
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="Remove from Agent">
                              <IconButton 
                                edge="end" 
                                onClick={() => handleRemoveKnowledge(item.id)}
                                sx={{ color: '#f44336' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                      <Typography variant="body2" gutterBottom>
                        No knowledge items assigned to this agent yet.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<AddIcon />}
                        onClick={() => setTabValue(0)}
                        sx={{
                          mt: 2,
                          borderColor: '#00F3FF',
                          color: '#00F3FF',
                          '&:hover': { borderColor: '#00D4E0', bgcolor: 'rgba(0, 243, 255, 0.1)' }
                        }}
                      >
                        Add Knowledge
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Right Side - Agent Info */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, bgcolor: '#1A1A1A', color: '#FFFFFF', height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Agent Information
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Name
              </Typography>
              <Typography variant="body1">
                {agent?.name || 'Unknown'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Role
              </Typography>
              <Typography variant="body1">
                {agent?.ai_role || 'Not specified'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Status
              </Typography>
              <Chip 
                label={agent?.status || 'Unknown'} 
                sx={{
                  bgcolor: agent?.status === AgentStatus.ACTIVE 
                    ? 'rgba(76, 175, 80, 0.1)' 
                    : 'rgba(244, 67, 54, 0.1)',
                  color: agent?.status === AgentStatus.ACTIVE ? '#4caf50' : '#f44336'
                }}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Description
              </Typography>
              <Typography variant="body2">
                {agent?.description || 'No description provided'}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate(`/agents`)}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: '#FFFFFF',
                  '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255, 255, 255, 0.05)' }
                }}
              >
                Back to Agents
              </Button>
              
              <Button 
                variant="contained"
                onClick={() => navigate(`/agent-chat/${agentId}`)}
                sx={{
                  bgcolor: '#00F3FF',
                  color: '#000000',
                  '&:hover': { bgcolor: '#00D4E0' }
                }}
              >
                Chat with Agent
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AgentKnowledgeManager;
