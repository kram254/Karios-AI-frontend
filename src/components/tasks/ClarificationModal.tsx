import React, { useState } from 'react';
import { 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Typography, 
  LinearProgress,
  Alert
} from '@mui/material';
import { HelpOutline, Send } from '@mui/icons-material';

interface ClarificationModalProps {
  open: boolean;
  taskId: string;
  clarificationRequest: string;
  onSubmit: (taskId: string, response: string) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const ClarificationModal: React.FC<ClarificationModalProps> = ({
  open,
  taskId,
  clarificationRequest,
  onSubmit,
  onClose,
  loading = false
}) => {
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) return;
    
    setSubmitting(true);
    try {
      await onSubmit(taskId, response);
      setResponse('');
      onClose();
    } catch (error) {
      console.error('Failed to submit clarification:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setResponse('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#1a1a1a',
          color: '#fff',
          border: '1px solid #333'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: '1px solid #333',
        pb: 2
      }}>
        <HelpOutline sx={{ color: '#00F3FF' }} />
        <Typography variant="h6" sx={{ color: '#00F3FF' }}>
          Task Clarification Required
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        {loading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress sx={{ 
              backgroundColor: 'rgba(0, 243, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#00F3FF'
              }
            }} />
          </Box>
        )}
        
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            backgroundColor: 'rgba(0, 243, 255, 0.1)',
            border: '1px solid rgba(0, 243, 255, 0.3)',
            '& .MuiAlert-icon': { color: '#00F3FF' },
            color: '#fff'
          }}
        >
          The multi-agent system needs additional information to complete your task effectively.
        </Alert>

        <Typography variant="body1" sx={{ 
          mb: 3, 
          color: 'rgba(255,255,255,0.9)',
          lineHeight: 1.6,
          fontSize: '1rem'
        }}>
          {clarificationRequest}
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Please provide the requested clarification..."
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          disabled={submitting}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: '#fff',
              '& fieldset': {
                borderColor: 'rgba(0, 243, 255, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 243, 255, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00F3FF',
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'rgba(255,255,255,0.5)',
            },
          }}
        />
        
        {response.trim() && (
          <Typography 
            variant="caption" 
            sx={{ 
              mt: 1, 
              display: 'block',
              color: 'rgba(255,255,255,0.6)' 
            }}
          >
            {response.length} characters
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        borderTop: '1px solid #333',
        pt: 2,
        gap: 1
      }}>
        <Button 
          onClick={handleClose} 
          disabled={submitting}
          sx={{ 
            color: 'rgba(255,255,255,0.7)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!response.trim() || submitting}
          variant="contained"
          startIcon={submitting ? null : <Send />}
          sx={{
            backgroundColor: '#00F3FF',
            color: '#000',
            '&:hover': {
              backgroundColor: 'rgba(0, 243, 255, 0.8)',
            },
            '&:disabled': {
              backgroundColor: 'rgba(0, 243, 255, 0.3)',
              color: 'rgba(0,0,0,0.5)'
            }
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Clarification'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClarificationModal;
