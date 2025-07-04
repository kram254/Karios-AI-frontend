import React from 'react';
import { Box, Tooltip, Badge } from '@mui/material';
import { CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';

interface MessageContextIndicatorProps {
  quality: number;
  state?: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const MessageContextIndicator: React.FC<MessageContextIndicatorProps> = ({
  quality,
  state,
  size = 'small',
  onClick
}) => {
  // Get icon and color based on quality score
  const getIcon = () => {
    if (quality >= 80) {
      return <CheckCircle fontSize={iconSize as any} />;
    } else if (quality >= 60) {
      return <Warning fontSize={iconSize as any} />;
    } else {
      return <ErrorIcon fontSize={iconSize as any} />;
    }
  };

  const getColor = () => {
    if (quality >= 80) return '#4caf50'; // Good
    if (quality >= 60) return '#ff9800'; // Fair
    return '#f44336'; // Poor
  };

  // Size adjustments
  const iconSize = size === 'small' ? 'small' : size === 'large' ? 'medium' : 'small';
  const badgeSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  const tooltipContent = `Context Quality: ${quality}%${state ? ` • State: ${state}` : ''}`;

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <Box
        onClick={onClick}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: getColor(),
          backgroundColor: `${getColor()}22`,
          borderRadius: '50%',
          width: badgeSize,
          height: badgeSize,
          cursor: onClick ? 'pointer' : 'default',
          ml: 1,
          '&:hover': onClick ? {
            backgroundColor: `${getColor()}44`,
          } : {},
        }}
      >
        {getIcon()}
      </Box>
    </Tooltip>
  );
};

export default MessageContextIndicator;
