import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = (): void => {
    window.location.reload();
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            padding: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#121212',
            color: '#FFFFFF',
          }}
        >
          <Paper 
            sx={{ 
              padding: 4, 
              maxWidth: 800, 
              margin: 'auto',
              backgroundColor: '#1A1A1A',
              color: '#FFFFFF',
              border: '1px solid #FF0000'
            }}
          >
            <Typography variant="h4" gutterBottom color="error">
              Something went wrong
            </Typography>
            
            <Typography variant="body1" paragraph>
              The application encountered an error and could not continue.
            </Typography>
            
            <Paper 
              sx={{ 
                padding: 2, 
                backgroundColor: '#000000', 
                overflowX: 'auto',
                marginBottom: 2 
              }}
            >
              <Typography variant="body2" component="pre" sx={{ color: '#FF6B6B' }}>
                {this.state.error?.toString()}
              </Typography>
              
              {this.state.errorInfo && (
                <Typography variant="body2" component="pre" sx={{ color: '#AAAAAA', fontSize: '0.8rem' }}>
                  {this.state.errorInfo.componentStack}
                </Typography>
              )}
            </Paper>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={this.handleReset}
              sx={{ 
                marginTop: 2,
                backgroundColor: '#00F3FF',
                color: '#000000'
              }}
            >
              Reload Application
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
