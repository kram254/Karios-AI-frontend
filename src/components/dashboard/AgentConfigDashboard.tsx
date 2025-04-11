import React, { useState } from 'react';
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

const AgentConfigDashboard: React.FC = () => {
    // Get user role from auth context
    const { user } = useAuth();
    const navigate = useNavigate();
    
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
    const handleSaveConfig = () => {
        // Here you would typically save the configuration to your backend
        // For demonstration purposes, we're just showing a success message
        
        const agentConfig = {
            agentRole,
            temperature,
            maxTokens,
            topP,
            respondOnlyIfFound,
            toneOfVoice,
            contextWindow,
            sessionPersistence,
            moderationActive,
            maxInputLength,
            responseStyle,
            loggingActive
        };
        
        console.log('Saving agent configuration:', agentConfig);
        
        // Show success notification
        setSnackbarMessage('Agent configuration saved successfully!');
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
            <Grid container spacing={3}>
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
                        
                        {/* Save Button */}
                        <Grid item xs={12} sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                            <Button 
                                variant="contained" 
                                size="large"
                                onClick={handleSaveConfig}
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
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                SAVE CONFIGURATION
                            </Button>
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
