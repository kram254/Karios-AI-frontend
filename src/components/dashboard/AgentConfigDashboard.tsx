import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    Grid, 
    Paper, 
    Typography, 
    Box, 
    FormControl, 
    FormLabel, 
    RadioGroup, 
    FormControlLabel, 
    Radio, 
    Slider, 
    TextField, 
    Button, 
    Card, 
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    Divider,
    Snackbar,
    Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DashboardLayout } from './DashboardLayout';
import { UserRole } from '../../types/user';
import { useNavigate } from 'react-router-dom';
import { monitoringService } from '../../services/api/monitoring.service';
import { userService } from '../../services/api/user.service';

// Using ReactElement | null return type to properly handle conditional rendering
const AgentConfigDashboard = (): React.ReactElement | null => {
    // Get user role from auth context
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Loading and metrics state
    const [loading, setLoading] = useState(true);
    const [agentMetrics, setAgentMetrics] = useState({
        activeAgents: 0,
        successRate: 0,
        averageResponseTime: 0
    });
    
    // Notification state
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    
    // Agent Type Configuration state
    const [agentRole, setAgentRole] = useState<string>('customer_support');
    
    // Generation Parameters state
    const [temperature, setTemperature] = useState<number>(0.7);
    const [maxTokens, setMaxTokens] = useState<number>(200);
    const [topP, setTopP] = useState<number>(0.3);
    
    // Knowledge Access state
    const [respondOnlyIfFound, setRespondOnlyIfFound] = useState<boolean>(true);
    
    // Fetch agent metrics when component mounts
    useEffect(() => {
        const fetchAgentMetrics = async () => {
            try {
                setLoading(true);
                
                // Get current user
                const userResponse = await userService.getCurrentUser();
                const userId = userResponse.data.id;
                
                // Fetch agent performance metrics
                const currentDate = new Date();
                const pastDate = new Date();
                pastDate.setMonth(pastDate.getMonth() - 1);
                
                const startDate = pastDate.toISOString().split('T')[0];
                const endDate = currentDate.toISOString().split('T')[0];
                
                const performanceResponse = await monitoringService.getPerformanceMetrics({
                    startDate,
                    endDate,
                    userId
                });
                
                const metrics = performanceResponse.data;
                setAgentMetrics({
                    activeAgents: metrics.active_agents || 0,
                    successRate: metrics.success_rate || 0,
                    averageResponseTime: metrics.avg_response_time || 0
                });
                
                // Fetch existing agent configuration
                try {
                    const agentConfigResponse = await fetch(`/api/v1/agents/config?userId=${userId}`);
                    const agentConfig = await agentConfigResponse.json();
                    
                    if (agentConfig) {
                        setAgentRole(agentConfig.role || 'customer_support');
                        setTemperature(agentConfig.temperature || 0.7);
                        setMaxTokens(agentConfig.max_tokens || 200);
                        setTopP(agentConfig.top_p || 0.3);
                        setRespondOnlyIfFound(agentConfig.respond_only_if_found || true);
                    }
                } catch (error) {
                    console.error('Error fetching agent configuration:', error);
                }
                
            } catch (error) {
                console.error('Error fetching agent metrics:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAgentMetrics();
    }, []);
    
    // Voice and Restrictions state
    const [toneOfVoice, setToneOfVoice] = useState<string>('professional');
    
    // Memory and Context state
    const [contextWindow, setContextWindow] = useState<string>('8k');
    const [sessionPersistence, setSessionPersistence] = useState<string>('enabled');
    
    // Security state
    const [moderationActive, setModerationActive] = useState<boolean>(true);
    const [maxInputLength, setMaxInputLength] = useState<number>(500);
    
    // Response Interface state
    const [responseStyle, setResponseStyle] = useState<string>('formatted');
    
    // Logs state
    const [loggingActive, setLoggingActive] = useState<boolean>(true);
    
    // Function to handle creating a new chat
    const handleNewChat = () => {
        navigate('/chat');
    };
    
    // Function to handle save configuration
    const handleSaveConfig = async () => {
        try {
            setLoading(true);
            
            // Get current user
            const userResponse = await userService.getCurrentUser();
            const userId = userResponse.data.id;
            
            // Create config object
            const agentConfig = {
                userId,
                role: agentRole,
                temperature,
                max_tokens: maxTokens,
                top_p: topP,
                respond_only_if_found: respondOnlyIfFound,
                tone_of_voice: toneOfVoice,
                context_window: contextWindow,
                session_persistence: sessionPersistence,
                moderation_active: moderationActive,
                max_input_length: maxInputLength,
                response_style: responseStyle,
                logging_active: loggingActive
            };
            
            console.log('Saving agent configuration:', agentConfig);
            
            // Send configuration to backend
            const response = await fetch('/api/v1/agents/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(agentConfig)
            });
            
            if (response.ok) {
                // Display success notification
                setSnackbarMessage('Agent configuration saved successfully!');
                setSnackbarSeverity('success');
            } else {
                // Display error notification
                setSnackbarMessage('Failed to save configuration. Please try again.');
                setSnackbarSeverity('error');
            }
        } catch (error) {
            console.error('Error saving agent configuration:', error);
            setSnackbarMessage('Error saving configuration. Please try again.');
            setSnackbarSeverity('error');
        } finally {
            setLoading(false);
            setOpenSnackbar(true);
        }
    };
    
    // Function to reset configuration to defaults
    const handleResetConfig = () => {
        setAgentRole('customer_support');
        setTemperature(0.7);
        setMaxTokens(200);
        setTopP(0.3);
        setRespondOnlyIfFound(true);
        setToneOfVoice('professional');
        setContextWindow('8k');
        setSessionPersistence('enabled');
        setModerationActive(true);
        setMaxInputLength(500);
        setResponseStyle('formatted');
        setLoggingActive(true);
        
        // Display success notification
        setSnackbarMessage('Configuration reset to defaults');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
    };
    
    // Function to handle closing the snackbar
    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return user ? (
        <Box sx={{
            width: '100%',
            maxWidth: '1440px',
            minHeight: '600px',
            height: { xs: 'auto', lg: 'min(900px, calc(100vh - 2rem))' },
            background: 'linear-gradient(135deg, #0d0b16 0%, #151226 100%)',
            borderRadius: '8px',
            overflow: 'hidden',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            mx: 'auto',
            my: 2
        }}>
            <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { sm: 'center' },
                    justifyContent: 'space-between',
                    px: { xs: 2, sm: 4 },
                    py: { xs: 2, lg: 3 },
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    gap: 2
                }}>
                    <Box>
                        <Typography sx={{ 
                            fontSize: '2rem', 
                            fontWeight: 500,
                            fontFamily: 'Inter, sans-serif',
                            mb: 0.5,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Agent Config
                        </Typography>
                        <Typography sx={{ 
                            fontSize: '0.875rem', 
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            Dashboard
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Button 
                            onClick={handleNewChat}
                            startIcon={<AddIcon />}
                            sx={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                color: 'white',
                                px: 3,
                                py: 1,
                                borderRadius: '8px',
                                fontWeight: 500,
                                fontFamily: 'Inter, sans-serif',
                                textTransform: 'none',
                                fontSize: '0.875rem',
                                '&:hover': { 
                                    background: 'linear-gradient(135deg, #5856eb 0%, #7c3aed 100%)',
                                    transform: 'translateY(-1px)'
                                },
                                transition: 'all 0.2s ease'
                            }}
                        >
                            New Chat
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 4 }, py: { xs: 2, lg: 3 } }}>
                    <Box sx={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        p: 3,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        mb: 3
                    }}>
                        <Typography sx={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            fontFamily: 'Inter, sans-serif',
                            mb: 3,
                            textAlign: 'center',
                            pb: 2,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            Chat AI - Configuration Dashboard
                        </Typography>

                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
                            gap: 3 
                        }}>
                            <Box sx={{ 
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                p: 2.5,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
                                }
                            }}>
                                <Typography sx={{
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    fontFamily: 'Inter, sans-serif',
                                    mb: 2,
                                    pb: 1,
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    0. Agent Type Configuration
                                </Typography>
                                <Typography sx={{ 
                                    fontSize: '0.75rem', 
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontFamily: 'Inter, sans-serif',
                                    mb: 3
                                }}>
                                    Select the type of agent to customize its behavior and tone for the desired purpose.
                                </Typography>
                                
                                <Box sx={{ mt: 3 }}>
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend" sx={{ 
                                            color: 'white',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            fontFamily: 'Inter, sans-serif',
                                            mb: 2
                                        }}>
                                            Agent Role
                                        </FormLabel>
                                        <RadioGroup
                                            value={agentRole}
                                            onChange={(e) => setAgentRole(e.target.value)}
                                        >
                                            <FormControlLabel 
                                                value="customer_support" 
                                                control={<Radio sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }} />} 
                                                label={
                                                    <Box>
                                                        <Typography sx={{ 
                                                            fontSize: '0.875rem',
                                                            fontFamily: 'Inter, sans-serif',
                                                            fontWeight: 500
                                                        }}>
                                                            Customer Support
                                                        </Typography>
                                                        <Typography sx={{ 
                                                            fontSize: '0.75rem',
                                                            color: 'rgba(255, 255, 255, 0.6)',
                                                            fontFamily: 'Inter, sans-serif'
                                                        }}>
                                                            Answers questions related to general inquiries, policies, and FAQs
                                                        </Typography>
                                                    </Box>
                                                } 
                                            />
                                            <FormControlLabel 
                                                value="technical_support" 
                                                control={<Radio sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }} />} 
                                                label={
                                                    <Box>
                                                        <Typography sx={{ 
                                                            fontSize: '0.875rem',
                                                            fontFamily: 'Inter, sans-serif',
                                                            fontWeight: 500
                                                        }}>
                                                            Technical Support
                                                        </Typography>
                                                        <Typography sx={{ 
                                                            fontSize: '0.75rem',
                                                            color: 'rgba(255, 255, 255, 0.6)',
                                                            fontFamily: 'Inter, sans-serif'
                                                        }}>
                                                            Specializes in resolving technical issues, troubleshooting, and providing step-by-step guides
                                                        </Typography>
                                                    </Box>
                                                } 
                                            />
                                            <FormControlLabel 
                                                value="sales_services" 
                                                control={<Radio sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }} />} 
                                                label={
                                                    <Box>
                                                        <Typography sx={{ 
                                                            fontSize: '0.875rem',
                                                            fontFamily: 'Inter, sans-serif',
                                                            fontWeight: 500
                                                        }}>
                                                            Sales Services
                                                        </Typography>
                                                        <Typography sx={{ 
                                                            fontSize: '0.75rem',
                                                            color: 'rgba(255, 255, 255, 0.6)',
                                                            fontFamily: 'Inter, sans-serif'
                                                        }}>
                                                            Focuses on promoting products/services, handling pricing, and upselling
                                                        </Typography>
                                                    </Box>
                                                } 
                                            />
                                            <FormControlLabel 
                                                value="consulting_services" 
                                                control={<Radio sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }} />} 
                                                label={
                                                    <Box>
                                                        <Typography sx={{ 
                                                            fontSize: '0.875rem',
                                                            fontFamily: 'Inter, sans-serif',
                                                            fontWeight: 500
                                                        }}>
                                                            Consulting Services
                                                        </Typography>
                                                        <Typography sx={{ 
                                                            fontSize: '0.75rem',
                                                            color: 'rgba(255, 255, 255, 0.6)',
                                                            fontFamily: 'Inter, sans-serif'
                                                        }}>
                                                            Provides expert advice and tailored recommendations based on the uploaded knowledge
                                                        </Typography>
                                                    </Box>
                                                } 
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                </Box>
                            </Box>

                            <Box sx={{ 
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                p: 2.5,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
                                }
                            }}>
                                <Typography sx={{
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    fontFamily: 'Inter, sans-serif',
                                    mb: 2,
                                    pb: 1,
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    1. Generation Parameters
                                </Typography>
                                
                                <Box sx={{ mt: 3 }}>
                                    <Box sx={{ mb: 4 }}>
                                        <Typography sx={{ 
                                            fontSize: '0.875rem',
                                            fontFamily: 'Inter, sans-serif',
                                            fontWeight: 500,
                                            mb: 1
                                        }}>
                                            Temperature
                                        </Typography>
                                        <Typography sx={{ 
                                            fontSize: '0.75rem',
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            fontFamily: 'Inter, sans-serif',
                                            mb: 2
                                        }}>
                                            Defines the model's creativity level
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            <Radio 
                                                checked={temperature === 0.0}
                                                onChange={() => setTemperature(0.0)}
                                                size="small"
                                                sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }}
                                            />
                                            <Typography sx={{ 
                                                fontSize: '0.75rem',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                0.0 (Maximum rigidity, no creativity)
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Radio 
                                                checked={temperature === 0.3}
                                                onChange={() => setTemperature(0.3)}
                                                size="small"
                                                sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }}
                                            />
                                            <Typography sx={{ 
                                                fontSize: '0.75rem',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                0.3 (Slightly variable)
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Radio 
                                                checked={temperature === 0.7}
                                                onChange={() => setTemperature(0.7)}
                                                size="small"
                                                sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }}
                                            />
                                            <Typography sx={{ 
                                                fontSize: '0.75rem',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                0.7 (Creative but controlled)
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ mb: 4 }}>
                                        <Typography sx={{ 
                                            fontSize: '0.875rem',
                                            fontFamily: 'Inter, sans-serif',
                                            fontWeight: 500,
                                            mb: 1
                                        }}>
                                            Max Tokens:
                                        </Typography>
                                        <Typography sx={{ 
                                            fontSize: '0.75rem',
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            fontFamily: 'Inter, sans-serif',
                                            mb: 2
                                        }}>
                                            Maximum length of the response
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            <Radio 
                                                checked={maxTokens === 100}
                                                onChange={() => setMaxTokens(100)}
                                                size="small"
                                                sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }}
                                            />
                                            <Typography sx={{ 
                                                fontSize: '0.75rem',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                100 tokens (short, concise responses)
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Radio 
                                                checked={maxTokens === 200}
                                                onChange={() => setMaxTokens(200)}
                                                size="small"
                                                sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }}
                                            />
                                            <Typography sx={{ 
                                                fontSize: '0.75rem',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                200 tokens (medium responses)
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Radio 
                                                checked={maxTokens === 500}
                                                onChange={() => setMaxTokens(500)}
                                                size="small"
                                                sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }}
                                            />
                                            <Typography sx={{ 
                                                fontSize: '0.75rem',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                500 tokens (detailed responses)
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box>
                                        <Typography sx={{ 
                                            fontSize: '0.875rem',
                                            fontFamily: 'Inter, sans-serif',
                                            fontWeight: 500,
                                            mb: 1
                                        }}>
                                            Top-p (Nucleus Sampling):
                                        </Typography>
                                        <Typography sx={{ 
                                            fontSize: '0.75rem',
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            fontFamily: 'Inter, sans-serif',
                                            mb: 2
                                        }}>
                                            Limits the probability pool for selected words
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            <Radio 
                                                checked={topP === 0.1}
                                                onChange={() => setTopP(0.1)}
                                                size="small"
                                                sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }}
                                            />
                                            <Typography sx={{ 
                                                fontSize: '0.75rem',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                0.1 (Only highly probable options)
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Radio 
                                                checked={topP === 0.3}
                                                onChange={() => setTopP(0.3)}
                                                size="small"
                                                sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }}
                                            />
                                            <Typography sx={{ 
                                                fontSize: '0.75rem',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                0.3 (Balanced between accuracy and variety)
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Radio 
                                                checked={topP === 0.7}
                                                onChange={() => setTopP(0.7)}
                                                size="small"
                                                sx={{ color: 'white', '&.Mui-checked': { color: '#6366f1' } }}
                                            />
                                            <Typography sx={{ 
                                                fontSize: '0.75rem',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                0.7 (More variety in responses)
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                        
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button 
                                variant="outlined"
                                onClick={handleResetConfig}
                                disabled={loading}
                                sx={{ 
                                    color: 'white',
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                    px: 3,
                                    py: 1,
                                    fontSize: '0.875rem',
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: 500,
                                    '&:hover': { 
                                        borderColor: 'rgba(255, 255, 255, 0.5)', 
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                    }
                                }}
                            >
                                RESET DEFAULTS
                            </Button>
                            <Button 
                                variant="contained"
                                onClick={handleSaveConfig}
                                disabled={loading}
                                sx={{ 
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    color: 'white',
                                    px: 4,
                                    py: 1,
                                    fontSize: '0.875rem',
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: 500,
                                    '&:hover': { 
                                        background: 'linear-gradient(135deg, #5856eb 0%, #7c3aed 100%)',
                                        transform: 'translateY(-1px)'
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {loading ? 'SAVING...' : 'SAVE CONFIGURATION'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
            
            <Snackbar 
                open={openSnackbar} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbarSeverity} 
                    sx={{ width: '100%', bgcolor: snackbarSeverity === 'success' ? 'rgba(99, 102, 241, 0.2)' : undefined }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    ) : null;
};

export default AgentConfigDashboard;
