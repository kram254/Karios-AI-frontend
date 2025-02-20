import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleRefresh = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '400px',
                        p: 3,
                        bgcolor: '#1A1A1A',
                        color: '#FFFFFF',
                        borderRadius: 1
                    }}
                >
                    <Typography variant="h5" gutterBottom>
                        Something went wrong
                    </Typography>
                    <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        align="center" 
                        sx={{ mb: 3, maxWidth: '600px' }}
                    >
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={this.handleRefresh}
                        sx={{
                            bgcolor: '#00F3FF',
                            color: '#000000',
                            '&:hover': {
                                bgcolor: '#00D4E0'
                            }
                        }}
                    >
                        Refresh Page
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}
