import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Modal, Tooltip, Button } from '@mui/material';
import { Analytics as AnalyticsIcon } from '@mui/icons-material';
import KnowledgeEnabledChat from './KnowledgeEnabledChat';
import ContextIndicator, { ContextQuality } from '../context/ContextIndicator';
import ContextViewer from '../context/ContextViewer';
import { contextService, ContextState, ContextLayer } from '../../services/api/context.service';
import { chatService } from '../../services/api/chat.service';

interface ContextEnabledChatProps {
  chatId?: string;
  agentId?: number;
}

const ContextEnabledChat: React.FC<ContextEnabledChatProps> = ({ chatId, agentId }) => {
  const [contextState, setContextState] = useState<ContextState | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch context state whenever chat ID changes
  useEffect(() => {
    if (chatId) {
      fetchContextState(chatId);
    }
  }, [chatId]);

  const fetchContextState = async (id: string) => {
    setLoading(true);
    try {
      const response = await chatService.getChatContextState(id);
      setContextState(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching context state:', err);
      setError('Unable to load context information');
    } finally {
      setLoading(false);
    }
  };

  const handleContextOpen = () => {
    setContextOpen(true);
  };

  const handleContextClose = () => {
    setContextOpen(false);
  };

  const refreshContextState = () => {
    if (chatId) {
      fetchContextState(chatId);
    }
  };

  // Prepare fake default context data if none exists (only for initial render)
  const defaultContextQuality: ContextQuality = {
    score: 0,
    state: 'initial',
    hasMemory: false,
    tokenCount: 0
  };

  return (
    <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Context Controls */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          zIndex: 10,
          display: 'flex',
          gap: 1,
          alignItems: 'center'
        }}
      >
        {contextState && (
          <Tooltip title="View detailed context information">
            <Button
              variant="outlined"
              size="small"
              onClick={handleContextOpen}
              startIcon={<AnalyticsIcon />}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#00F3FF',
                borderColor: 'rgba(0, 243, 255, 0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  borderColor: '#00F3FF'
                }
              }}
            >
              Context Quality: {contextState.quality.score}%
            </Button>
          </Tooltip>
        )}
        <ContextIndicator 
          quality={contextState?.quality || defaultContextQuality} 
          loading={loading}
        />
      </Box>

      {/* Main Chat Component */}
      <KnowledgeEnabledChat 
        chatId={chatId} 
        agentId={agentId} 
      />

      {/* Context Viewer Modal */}
      <Modal
        open={contextOpen}
        onClose={handleContextClose}
        aria-labelledby="context-modal-title"
        aria-describedby="context-modal-description"
      >
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '80%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 2,
          boxShadow: 24,
          p: 0,
          outline: 'none'
        }}>
          {contextState ? (
            <ContextViewer 
              quality={contextState.quality} 
              layers={contextState.layers}
              onClose={handleContextClose} 
            />
          ) : (
            <Box sx={{ 
              bgcolor: '#1e1e2f', 
              color: '#fff', 
              p: 4, 
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2
            }}>
              <Typography variant="h6">
                {loading ? 'Loading context information...' : 'No context information available'}
              </Typography>
              {error && (
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              )}
              <Button variant="contained" onClick={handleContextClose}>
                Close
              </Button>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default ContextEnabledChat;
