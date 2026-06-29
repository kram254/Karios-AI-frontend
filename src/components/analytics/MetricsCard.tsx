import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactNode;
  color?: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary'
}) => {
  const getTrendColor = () => {
    if (trend === undefined) return 'text.secondary';
    return trend >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color: `${color}.main`, opacity: 0.7 }}>
              {icon}
            </Box>
          )}
        </Box>
        
        <Typography variant="h4" fontWeight="bold" mb={1}>
          {value}
        </Typography>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        
        {trend !== undefined && (
          <Box display="flex" alignItems="center" mt={1}>
            {trend >= 0 ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: getTrendColor() }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, color: getTrendColor() }} />
            )}
            <Typography variant="caption" sx={{ ml: 0.5, color: getTrendColor() }}>
              {Math.abs(trend)}% from last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
