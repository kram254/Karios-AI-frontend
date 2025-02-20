import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
    message = 'Loading...' 
}) => {
    return (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                p: 3
            }}
        >
            <CircularProgress 
                sx={{ 
                    color: '#00F3FF',
                    mb: 2
                }} 
            />
            <Typography 
                variant="body2" 
                color="text.secondary"
            >
                {message}
            </Typography>
        </Box>
    );
};
