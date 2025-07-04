import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import { 
  ExpandMore, 
  Memory, 
  Psychology, 
  Lightbulb, 
  School, 
  BusinessCenter,
  Description,
  Info,
  Close
} from '@mui/icons-material';
import { ContextQuality } from './ContextIndicator';

interface ContextLayer {
  id: string;
  type: 'domain' | 'industry' | 'knowledge' | 'memory' | 'session' | 'template';
  name: string;
  content: string;
  tokenCount?: number;
  score?: number;
}

interface ContextViewerProps {
  quality: ContextQuality;
  layers: ContextLayer[];
  onClose?: () => void;
}

const ContextViewer: React.FC<ContextViewerProps> = ({ quality, layers, onClose }) => {
  const [expandedLayer, setExpandedLayer] = useState<string | false>(false);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedLayer(isExpanded ? panel : false);
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'domain':
        return <School color="primary" />;
      case 'industry':
        return <BusinessCenter color="primary" />;
      case 'knowledge':
        return <Description color="secondary" />;
      case 'memory':
        return <Memory color="warning" />;
      case 'session':
        return <Psychology color="info" />;
      case 'template':
        return <Lightbulb color="success" />;
      default:
        return <Info />;
    }
  };

  const getStateColor = () => {
    switch (quality.state) {
      case 'information_gathering':
        return 'info.main';
      case 'clarification':
        return 'warning.main';
      case 'solution_providing':
        return 'success.main';
      case 'follow_up':
        return 'secondary.main';
      default:
        return 'text.secondary';
    }
  };

  const getQualityColor = () => {
    if (quality.score >= 80) return 'success.main';
    if (quality.score >= 60) return 'warning.main';
    return 'error.main';
  };

  return (
    <Card sx={{ 
      maxWidth: '100%', 
      bgcolor: '#1e1e2f',
      color: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Context Engineering Insights
          </Typography>
          {onClose && (
            <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
              <Close />
            </IconButton>
          )}
        </Box>

        <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
          <Box flexGrow={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Conversation State
            </Typography>
            <Chip 
              icon={
                quality.state === 'information_gathering' ? <Memory /> :
                quality.state === 'clarification' ? <Psychology /> :
                quality.state === 'solution_providing' ? <Lightbulb /> :
                <Info />
              }
              label={
                quality.state === 'initial' ? 'Initial' :
                quality.state === 'information_gathering' ? 'Information Gathering' :
                quality.state === 'clarification' ? 'Clarification' :
                quality.state === 'solution_providing' ? 'Solution Providing' :
                quality.state === 'follow_up' ? 'Follow-up' :
                'Unknown'
              }
              sx={{ 
                bgcolor: 'rgba(0,0,0,0.2)',
                color: getStateColor(),
                '& .MuiChip-icon': {
                  color: getStateColor()
                }
              }}
            />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Context Quality
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Box width={100}>
                <LinearProgress
                  variant="determinate"
                  value={quality.score}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getQualityColor(),
                    }
                  }}
                />
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  color: getQualityColor() 
                }}
              >
                {quality.score}%
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tokens Used
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {quality.tokenCount || 0}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
          Active Context Layers ({layers.length})
        </Typography>

        <Box sx={{ mt: 1 }}>
          {layers.map((layer) => (
            <Accordion 
              key={layer.id}
              expanded={expandedLayer === layer.id}
              onChange={handleAccordionChange(layer.id)}
              sx={{ 
                mb: 1,
                bgcolor: 'rgba(255,255,255,0.05)',
                color: '#ffffff',
                '&:before': {
                  display: 'none',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: 'rgba(255,255,255,0.7)' }} />}
                sx={{ 
                  '&.Mui-expanded': {
                    minHeight: 'unset',
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  {getLayerIcon(layer.type)}
                  <Typography sx={{ fontWeight: 500 }}>
                    {layer.name}
                  </Typography>
                  <Chip 
                    label={layer.type.charAt(0).toUpperCase() + layer.type.slice(1)} 
                    size="small"
                    sx={{ 
                      height: 20,
                      fontSize: '0.7rem',
                      bgcolor: 'rgba(0,0,0,0.2)',
                    }}
                  />
                  {layer.tokenCount && (
                    <Typography variant="caption" color="text.secondary">
                      {layer.tokenCount} tokens
                    </Typography>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ bgcolor: 'rgba(0,0,0,0.2)', pt: 1 }}>
                <Typography 
                  variant="body2" 
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    p: 1,
                    borderRadius: '4px',
                    overflowX: 'auto',
                  }}
                >
                  {layer.content}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
        
        <Button 
          variant="text" 
          size="small"
          onClick={onClose}
          sx={{ mt: 2, color: 'primary.main' }}
        >
          Close
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContextViewer;
