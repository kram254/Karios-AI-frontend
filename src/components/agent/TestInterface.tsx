import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    CircularProgress,
    Divider,
    Alert,
    IconButton,
    Tooltip,
    Grid
} from '@mui/material';
import {
    Send as SendIcon,
    ContentCopy as CopyIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { Agent, AgentTestResult } from '../../types/agent';

interface TestInterfaceProps {
    agent: Agent;
    onTest: (input: string) => Promise<AgentTestResult>;
}

export const TestInterface: React.FC<TestInterfaceProps> = ({
    agent,
    onTest
}) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AgentTestResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleTest = async () => {
        if (!input.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const testResult = await onTest(input);
            setResult(testResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Test failed');
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast notification here
    };

    const handleReset = () => {
        setInput('');
        setResult(null);
        setError(null);
    };

    return (
        <Paper 
            sx={{ 
                bgcolor: '#1A1A1A',
                color: '#FFFFFF',
                border: '1px solid rgba(0, 243, 255, 0.2)',
                p: 3
            }}
        >
            <Typography variant="h6" gutterBottom>
                Test Agent
            </Typography>

            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Enter your test input here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            color: '#FFFFFF',
                            '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.2)'
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgba(0, 243, 255, 0.5)'
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#00F3FF'
                            }
                        }
                    }}
                />
                
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                        onClick={handleTest}
                        disabled={loading || !input.trim()}
                        sx={{
                            bgcolor: '#00F3FF',
                            color: '#000000',
                            '&:hover': {
                                bgcolor: '#00D4E0'
                            }
                        }}
                    >
                        {loading ? 'Testing...' : 'Test'}
                    </Button>
                    
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleReset}
                        disabled={loading}
                        sx={{
                            borderColor: 'rgba(0, 243, 255, 0.5)',
                            color: '#00F3FF',
                            '&:hover': {
                                borderColor: '#00F3FF',
                                bgcolor: 'rgba(0, 243, 255, 0.1)'
                            }
                        }}
                    >
                        Reset
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert 
                    severity="error" 
                    sx={{ 
                        mb: 3,
                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                        color: '#F44336'
                    }}
                >
                    {error}
                </Alert>
            )}

            {result && (
                <>
                    <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                    
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1">
                                Test Results
                            </Typography>
                            <Tooltip title="Copy Response">
                                <IconButton
                                    onClick={() => handleCopy(result.response)}
                                    size="small"
                                    sx={{ color: '#00F3FF' }}
                                >
                                    <CopyIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <Paper 
                            sx={{ 
                                p: 2, 
                                mb: 2,
                                bgcolor: '#2A2A2A',
                                border: '1px solid rgba(0, 243, 255, 0.2)'
                            }}
                        >
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {result.response}
                            </Typography>
                        </Paper>

                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                    Tokens Used
                                </Typography>
                                <Typography variant="body1">
                                    {result.tokens_used}
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                    Response Time
                                </Typography>
                                <Typography variant="body1">
                                    {result.response_time}ms
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                    Status
                                </Typography>
                                <Typography 
                                    variant="body1" 
                                    sx={{ color: result.success ? '#4CAF50' : '#F44336' }}
                                >
                                    {result.success ? 'Success' : 'Failed'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </>
            )}
        </Paper>
    );
};
