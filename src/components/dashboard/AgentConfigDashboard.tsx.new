import React, { useState } from 'react';
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
    Divider
} from '@mui/material';
import { DashboardLayout } from './DashboardLayout';
import { UserRole } from '../../types/user';

export const AgentConfigDashboard: React.FC = () => {
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

    return (
        <DashboardLayout role={UserRole.SUPER_ADMIN}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        module: agentando chat
                    </Typography>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#888' }}>
                        DASHBOARD
                    </Typography>
                </Grid>
                
                <Grid item xs={12}>
                    <Paper 
                        sx={{ 
                            p: 3, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)'
                        }}
                    >
                        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
                            Chat AI - Configuration Dashboard
                        </Typography>

                        <Grid container spacing={4}>
                            {/* Agent Type Configuration */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{ bgcolor: 'rgba(0, 243, 255, 0.05)', height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
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
                                <Card sx={{ bgcolor: 'rgba(0, 243, 255, 0.05)', height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
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
                                sx={{ 
                                    bgcolor: '#00F3FF', 
                                    color: '#000', 
                                    px: 4,
                                    py: 1,
                                    '&:hover': { bgcolor: '#00D4E0' } 
                                }}
                            >
                                SAVE CONFIGURATION
                            </Button>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </DashboardLayout>
    );
};

export default AgentConfigDashboard;
