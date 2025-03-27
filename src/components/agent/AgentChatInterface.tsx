import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  Divider,
  Button
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Language as LanguageIcon,
  Settings as SettingsIcon,
  FormatQuote as QuoteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { agentService } from '../../services/api/agent.service';
import { KnowledgeEnabledChat } from '../chat/KnowledgeEnabledChat';
import { Agent, AgentRole, AgentStatus } from '../../types/agent';

interface AgentChatInterfaceProps {
  agentId: number;
}

export const AgentChatInterface: React.FC<AgentChatInterfaceProps> = ({ agentId }) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showKnowledgeInfo, setShowKnowledgeInfo] = useState(false);

  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  const fetchAgent = async () => {
    setLoading(true);
    try {
      // Using the list endpoint and finding the agent by ID
      // since there's no specific getAgent endpoint in our service
      const response = await agentService.getAgents();
      const foundAgent = response.data.find(a => a.id === agentId);
      
      if (foundAgent) {
        setAgent(foundAgent);
      } else {
        setError('Agent not found');
      }
    } catch (err) {
      console.error('Error fetching agent:', err);
      setError('Failed to load agent information');
    } finally {
      setLoading(false);
    }
  };

  const getAgentRoleLabel = (role: AgentRole) => {
    switch (role) {
      case AgentRole.CUSTOMER_SUPPORT:
        return 'Customer Support';
      case AgentRole.TECHNICAL_SUPPORT:
        return 'Technical Support';
      case AgentRole.SALES_SERVICES:
        return 'Sales Services';
      case AgentRole.CONSULTING:
        return 'Consulting';
      default:
        return role;
    }
  };

  const getLanguageDisplay = (language: string) => {
    switch (language) {
      case 'en':
        return 'English';
      case 'es':
        return 'Spanish';
      case 'fr':
        return 'French';
      case 'de':
        return 'German';
      case 'it':
        return 'Italian';
      case 'pt':
        return 'Portuguese';
      case 'zh':
        return 'Chinese';
      case 'ja':
        return 'Japanese';
      case 'ko':
        return 'Korean';
      default:
        return language;
    }
  };

  const getAgentStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.ONLINE:
        return '#4caf50'; // Green
      case AgentStatus.OFFLINE:
        return '#f44336'; // Red
      case AgentStatus.TEST:
        return '#ff9800'; // Orange
      default:
        return '#9e9e9e';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress sx={{ color: '#00F3FF' }} />
      </Box>
    );
  }

  if (error || !agent) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error || 'Failed to load agent'}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={fetchAgent}
          sx={{
            borderColor: '#00F3FF',
            color: '#00F3FF',
            '&:hover': {
              borderColor: '#00D4E0',
              bgcolor: 'rgba(0, 243, 255, 0.1)'
            }
          }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Agent Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2,
          bgcolor: '#1A1A1A',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(0, 243, 255, 0.2)',
                color: '#00F3FF',
                width: 48,
                height: 48
              }}
            >
              <BotIcon />
            </Avatar>
          </Grid>
          
          <Grid item xs>
            <Typography variant="h6" sx={{ color: '#FFFFFF' }}>
              {agent.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                size="small"
                label={getAgentRoleLabel(agent.ai_role)} 
                sx={{ 
                  bgcolor: 'rgba(0, 243, 255, 0.1)',
                  color: '#00F3FF',
                  borderRadius: '4px'
                }}
              />
              
              <Chip 
                size="small"
                label={getLanguageDisplay(agent.language)}
                icon={<LanguageIcon sx={{ fontSize: '0.8rem' }} />}
                sx={{ 
                  bgcolor: 'rgba(156, 39, 176, 0.1)', 
                  color: '#9c27b0',
                  borderRadius: '4px'
                }}
              />
              
              <Chip 
                size="small"
                label={agent.status}
                sx={{ 
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  color: getAgentStatusColor(agent.status as AgentStatus),
                  borderRadius: '4px',
                  '& .MuiChip-label': {
                    position: 'relative',
                    paddingLeft: '16px'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getAgentStatusColor(agent.status as AgentStatus)
                  }
                }}
              />
            </Box>
          </Grid>
          
          <Grid item>
            <Tooltip title="View Agent Knowledge">
              <IconButton 
                onClick={() => setShowKnowledgeInfo(!showKnowledgeInfo)}
                sx={{ color: '#00F3FF' }}
              >
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
        
        {/* Knowledge Base Info */}
        {showKnowledgeInfo && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#00F3FF' }}>
              Agent Knowledge Base
            </Typography>
            
            {agent.knowledge_items && agent.knowledge_items.length > 0 ? (
              <Box sx={{ mt: 1 }}>
                {agent.knowledge_items.map((item, index) => (
                  <Chip
                    key={index}
                    icon={<QuoteIcon />}
                    label={item.content_type === 'file' 
                      ? (item.file_path?.split('/').pop() || 'File')
                      : (item.content_type === 'url' 
                        ? (item.url || 'URL') 
                        : (item.metadata?.title || 'Text Content'))}
                    sx={{ 
                      m: 0.5, 
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'rgba(255, 255, 255, 0.8)'
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                This agent doesn't have any knowledge items assigned yet.
              </Typography>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Chat Interface */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <KnowledgeEnabledChat agentId={agent.id} />
      </Box>
    </Box>
  );
};

export default AgentChatInterface;
