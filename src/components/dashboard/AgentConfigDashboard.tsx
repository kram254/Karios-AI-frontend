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
        <DashboardLayout role={user.role}>
            <div className="dashboard-scroll-container" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <div>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#00F3FF', textTransform: 'uppercase' }}>
                            Agent Config
                        </Typography>
                        <Typography variant="subtitle1" component="h2" sx={{ color: '#888' }}>
                            DASHBOARD
                        </Typography>
                    </div>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleNewChat}
                        sx={{
                            bgcolor: '#00F3FF',
                            color: '#000000',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            boxShadow: '0 4px 10px rgba(0, 243, 255, 0.3)',
                            padding: '8px 16px',
                            '&:hover': {
                                bgcolor: '#00D4E0',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 12px rgba(0, 243, 255, 0.4)'
                            },
                            transition: 'all 0.2s ease'
                        }}
                    >
                        New Chat
                    </Button>
                </Grid>
                
                <Grid item xs={12}>
                    <Paper 
                        sx={{ 
                            p: 3, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)',
                            borderRadius: '10px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                            mb: 3
                        }}
                    >
                        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 4, color: '#00F3FF', fontWeight: 'bold', borderBottom: '1px solid rgba(0, 243, 255, 0.3)', pb: 2 }}>
                            Chat AI - Configuration Dashboard
                        </Typography>

                        <Grid container spacing={4}>
                            {/* Agent Type Configuration */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{ 
                                    bgcolor: 'rgba(0, 243, 255, 0.05)', 
                                    height: '100%',
                                    borderRadius: '10px',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(0, 243, 255, 0.1)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ color: '#00F3FF', fontWeight: 'bold', borderBottom: '1px solid rgba(0, 243, 255, 0.2)', pb: 1, mb: 2 }}>
                                            0. Agent Type Configuration
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                            Select the type of agent to customize its behavior and
                                            tone for the desired purpose.
                                        </Typography>
                                        
                                        <Box sx={{ mt: 3 }}>
                                            <FormControl component="fieldset">
                                                <FormLabel component="legend" sx={{ color: '#00F3FF' }}>Agent Role</FormLabel>
                                                <RadioGroup
                                                    value={agentRole}
                                                    onChange={(e) => setAgentRole(e.target.value)}
                                                >
                                                    <FormControlLabel 
                                                        value="customer_support" 
                                                        control={<Radio sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }} />} 
                                                        label={
                                                            <Box>
                                                                <Typography variant="body2">Customer Support</Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Answers questions related to general inquiries, policies, and FAQs
                                                                </Typography>
                                                            </Box>
                                                        } 
                                                    />
                                                    <FormControlLabel 
                                                        value="technical_support" 
                                                        control={<Radio sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }} />} 
                                                        label={
                                                            <Box>
                                                                <Typography variant="body2">Technical Support</Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Specializes in resolving technical issues, troubleshooting, and providing step-by-step guides
                                                                </Typography>
                                                            </Box>
                                                        } 
                                                    />
                                                    <FormControlLabel 
                                                        value="sales_services" 
                                                        control={<Radio sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }} />} 
                                                        label={
                                                            <Box>
                                                                <Typography variant="body2">Sales Services</Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Focuses on promoting products/services, handling pricing, and upselling
                                                                </Typography>
                                                            </Box>
                                                        } 
                                                    />
                                                    <FormControlLabel 
                                                        value="consulting_services" 
                                                        control={<Radio sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }} />} 
                                                        label={
                                                            <Box>
                                                                <Typography variant="body2">Consulting Services</Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Provides expert advice and tailored recommendations based on the uploaded knowledge
                                                                </Typography>
                                                            </Box>
                                                        } 
                                                    />
                                                </RadioGroup>
                                            </FormControl>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Generation Parameters */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{ 
                                    bgcolor: 'rgba(0, 243, 255, 0.05)', 
                                    height: '100%',
                                    borderRadius: '10px',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(0, 243, 255, 0.1)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ color: '#00F3FF', fontWeight: 'bold', borderBottom: '1px solid rgba(0, 243, 255, 0.2)', pb: 1, mb: 2 }}>
                                            1. Generation Parameters
                                        </Typography>
                                        
                                        <Box sx={{ mt: 3 }}>
                                            {/* Temperature */}
                                            <Box sx={{ mb: 4 }}>
                                                <Typography variant="body2" gutterBottom>
                                                    Temperature
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                                    Defines the model's creativity level
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                    <Radio 
                                                        checked={temperature === 0.0}
                                                        onChange={() => setTemperature(0.0)}
                                                        size="small"
                                                        sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }}
                                                    />
                                                    <Typography variant="caption">0.0 (Maximum rigidity, no creativity)</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Radio 
                                                        checked={temperature === 0.3}
                                                        onChange={() => setTemperature(0.3)}
                                                        size="small"
                                                        sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }}
                                                    />
                                                    <Typography variant="caption">0.3 (Slightly variable)</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Radio 
                                                        checked={temperature === 0.7}
                                                        onChange={() => setTemperature(0.7)}
                                                        size="small"
                                                        sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }}
                                                    />
                                                    <Typography variant="caption">0.7 (Creative but controlled)</Typography>
                                                </Box>
                                            </Box>
                                            
                                            {/* Max Tokens */}
                                            <Box sx={{ mb: 4 }}>
                                                <Typography variant="body2" gutterBottom>
                                                    Max Tokens:
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                                    Maximum length of the response
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                    <Radio 
                                                        checked={maxTokens === 100}
                                                        onChange={() => setMaxTokens(100)}
                                                        size="small"
                                                        sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }}
                                                    />
                                                    <Typography variant="caption">100 tokens (short, concise responses)</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Radio 
                                                        checked={maxTokens === 200}
                                                        onChange={() => setMaxTokens(200)}
                                                        size="small"
                                                        sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }}
                                                    />
                                                    <Typography variant="caption">200 tokens (medium responses)</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Radio 
                                                        checked={maxTokens === 500}
                                                        onChange={() => setMaxTokens(500)}
                                                        size="small"
                                                        sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }}
                                                    />
                                                    <Typography variant="caption">500 tokens (detailed responses)</Typography>
                                                </Box>
                                            </Box>
                                            
                                            {/* Top-p */}
                                            <Box>
                                                <Typography variant="body2" gutterBottom>
                                                    Top-p (Nucleus Sampling):
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                                    Limits the probability pool for selected words
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                    <Radio 
                                                        checked={topP === 0.1}
                                                        onChange={() => setTopP(0.1)}
                                                        size="small"
                                                        sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }}
                                                    />
                                                    <Typography variant="caption">0.1 (Only highly probable options)</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Radio 
                                                        checked={topP === 0.3}
                                                        onChange={() => setTopP(0.3)}
                                                        size="small"
                                                        sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }}
                                                    />
                                                    <Typography variant="caption">0.3 (Balanced between accuracy and variety)</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Radio 
                                                        checked={topP === 0.7}
                                                        onChange={() => setTopP(0.7)}
                                                        size="small"
                                                        sx={{ color: '#00F3FF', '&.Mui-checked': { color: '#00F3FF' } }}
                                                    />
                                                    <Typography variant="caption">0.7 (More variety in responses)</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                        
                        {/* Config Action Buttons */}
                        <Grid item xs={12} sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button 
                                    variant="outlined"
                                    size="large"
                                    onClick={handleResetConfig}
                                    disabled={loading}
                                    sx={{ 
                                        color: '#00F3FF',
                                        borderColor: '#00F3FF',
                                        px: 3,
                                        py: 1,
                                        '&:hover': { 
                                            borderColor: '#00D4E0', 
                                            backgroundColor: 'rgba(0, 243, 255, 0.1)'
                                        },
                                        fontWeight: 'bold'
                                    }}
                                >
                                    RESET DEFAULTS
                                </Button>
                                <Button 
                                    variant="contained" 
                                    size="large"
                                    onClick={handleSaveConfig}
                                    disabled={loading}
                                    sx={{ 
                                        bgcolor: '#00F3FF', 
                                        color: '#000', 
                                        px: 4,
                                        py: 1,
                                        '&:hover': { 
                                            bgcolor: '#00D4E0',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 6px 12px rgba(0, 243, 255, 0.4)'
                                        },
                                        transition: 'all 0.2s ease',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {loading ? 'SAVING...' : 'SAVE CONFIGURATION'}
                                </Button>
                            </Box>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
            </div>
            
            {/* Success/Error Notification */}
            <Snackbar 
                open={openSnackbar} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbarSeverity} 
                    sx={{ width: '100%', bgcolor: snackbarSeverity === 'success' ? 'rgba(0, 243, 255, 0.2)' : undefined }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    ) : null;
};

export default AgentConfigDashboard;
