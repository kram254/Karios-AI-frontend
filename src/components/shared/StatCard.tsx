import React from 'react';
import { Paper, Typography, Box, SxProps, Theme } from '@mui/material';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    sx?: SxProps<Theme>;
}

export const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    icon, 
    trend,
    sx = {} 
}) => {
    return (
        <Paper 
            sx={{ 
                p: 2, 
                bgcolor: '#1A1A1A',
                color: '#FFFFFF',
                border: '1px solid rgba(0, 243, 255, 0.2)',
                ...sx
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4">
                        {value}
                    </Typography>
                    {trend && (
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: trend.isPositive ? '#4CAF50' : '#f44336',
                                display: 'flex',
                                alignItems: 'center',
                                mt: 1
                            }}
                        >
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                        </Typography>
                    )}
                </Box>
                {icon && (
                    <Box sx={{ color: 'primary.main' }}>
                        {icon}
                    </Box>
                )}
            </Box>
        </Paper>
    );
};
