import React from 'react';
import { Box, Tooltip, Chip, Typography, CircularProgress } from '@mui/material';
import { CheckCircle, Warning, Error as ErrorIcon, Memory, Psychology, Lightbulb } from '@mui/icons-material';

export interface ContextQuality {
  score: number;
  state: 'initial' | 'information_gathering' | 'clarification' | 'solution_providing' | 'follow_up';
  hasMemory: boolean;
  tokenCount?: number;
  layers?: string[];
}

interface ContextIndicatorProps {
  quality: ContextQuality;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ContextIndicator: React.FC<ContextIndicatorProps> = ({ 
  quality, 
  loading = false,
  size = 'medium' 
}) => {
  // Calculate visual properties based on quality score
  const getColor = () => {
    if (quality.score >= 80) return '#4caf50'; // Good
    if (quality.score >= 60) return '#ff9800'; // Fair
    return '#f44336'; // Poor
  };

  const getIcon = () => {
    if (loading) return <CircularProgress size={iconSize} color="inherit" />;
    if (quality.score >= 80) return <CheckCircle fontSize={iconSize as any} />;
    if (quality.score >= 60) return <Warning fontSize={iconSize as any} />;
    return <ErrorIcon fontSize={iconSize as any} />;
  };

  const getStateIcon = () => {
    switch (quality.state) {
      case 'information_gathering':
        return <Memory fontSize={iconSize as any} />;
      case 'clarification':
        return <Psychology fontSize={iconSize as any} />;
      case 'solution_providing':
        return <Lightbulb fontSize={iconSize as any} />;
      default:
        return null;
    }
  };

  const getStateLabel = () => {
    switch (quality.state) {
      case 'initial':
        return 'Initial';
      case 'information_gathering':
        return 'Gathering Info';
      case 'clarification':
        return 'Clarifying';
      case 'solution_providing':
        return 'Providing Solution';
      case 'follow_up':
        return 'Following Up';
      default:
        return 'Unknown';
    }
  };

  // Size adjustments
  const iconSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium';
  const chipHeight = size === 'small' ? 24 : size === 'large' ? 36 : 32;

  // Content for tooltip
  const tooltipContent = (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle2">Context Quality: {quality.score}%</Typography>
      <Typography variant="body2">State: {getStateLabel()}</Typography>
      {quality.hasMemory && <Typography variant="body2">Using conversation memory</Typography>}
      {quality.tokenCount && <Typography variant="body2">Using {quality.tokenCount} tokens</Typography>}
      {quality.layers && quality.layers.length > 0 && (
        <>
          <Typography variant="body2" sx={{ mt: 1, mb: 0.5 }}>Active layers:</Typography>
          {quality.layers.map((layer, index) => (
            <Typography key={index} variant="caption" display="block" sx={{ ml: 1 }}>
              • {layer}
            </Typography>
          ))}
        </>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {quality.state !== 'initial' && (
          <Chip
            icon={getStateIcon()}
            label={getStateLabel()}
            size={size === 'large' ? 'medium' : 'small'}
            sx={{ 
              height: chipHeight,
              backgroundColor: 'rgba(25, 118, 210, 0.12)',
              color: 'primary.main',
              '& .MuiChip-icon': {
                color: 'primary.main'
              }
            }}
          />
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: getColor(),
            backgroundColor: `${getColor()}22`,
            borderRadius: '50%',
            width: chipHeight,
            height: chipHeight,
          }}
        >
          {getIcon()}
        </Box>
      </Box>
    </Tooltip>
  );
};

export default ContextIndicator;
