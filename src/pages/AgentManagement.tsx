import React, { useState, useEffect } from 'react';
import {
    Container, Box, Typography, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, Alert, Menu, MenuItem, IconButton,
    Paper, CircularProgress, Tabs, Tab
} from '@mui/material';
import { 
    Add as AddIcon, Settings, Psychology, 
    Edit, Delete, MoreVert 
} from '@mui/icons-material';
import { AgentRole, Agent, AgentConfig, AgentMode } from '../types/agent';
import { agentService } from '../services/api/agent.service';
import AgentEditDialog from '../components/agent/AgentEditDialog';
import AgentRoleDialog from '../components/agent/AgentRoleDialog';
import AgentBehaviorDialog from '../components/agent/AgentBehaviorDialog';
import AgentCreationWizard from '../components/agent/AgentCreationWizard';
import '../styles/AgentManagement.css';

// Custom TabPanel component
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`agent-tabpanel-${index}`}
            aria-labelledby={`agent-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Update AgentWithMetrics interface to explicitly extend Agent
interface AgentWithMetrics extends Agent {
    metrics: {
        total_conversations: number;
        avg_user_satisfaction: number;
        avg_response_time: number;
        success_rate: number;
    };
    // Ensure config property is properly defined
    config?: AgentConfig;
}

// Partial agent for creation/updates
interface PartialAgent {
    name?: string;
    description?: string;
    ai_role?: AgentRole;
    model?: string;
    response_style?: number;
    response_length?: number;
}

export const AgentManagement: React.FC = () => {
    console.log('AgentManagement component rendering');
    
    // Add console logs to track the render process
    useEffect(() => {
        console.log('AgentManagement mounted');
        return () => console.log('AgentManagement unmounted');
    }, []);
    
    // State variables
    const [error, setError] = useState<string | null>(null);
    const [agents, setAgents] = useState<AgentWithMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<AgentWithMetrics | null>(null);
    
    // Menu state
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [menuAgentId, setMenuAgentId] = useState<string | null>(null);
    
    // Dialog states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [behaviorDialogOpen, setBehaviorDialogOpen] = useState(false);
    const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
    
    // Snackbar state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
    
    const [currentTab, setCurrentTab] = useState(0);
    const [showWizard, setShowWizard] = useState(false);

    useEffect(() => {
        console.log("Initial mount of AgentManagement component");
        
        // Add a try-catch block to catch render errors
        try {
            // Add a delay to ensure the UI renders even if API call fails
            const timer = setTimeout(() => {
                setLoading(false);
                console.log("Timeout complete, setting loading to false");
            }, 3000); // 3 second timeout as a fallback
            
            return () => {
                console.log("Cleaning up AgentManagement component");
                clearTimeout(timer);
            }
        } catch (err) {
            console.error("Error in AgentManagement initial mount:", err);
            setError(String(err));
            setLoading(false);
        }
    }, []);

    // Fetch agents data
    useEffect(() => {
        console.log('Agent Management component mounted, fetching agents');
        const fetchAgents = async () => {
            try {
                setLoading(true);
                const response = await agentService.getAgents();
                console.log('Agents response:', response);
                
                if (response && response.data) {
                    // Add fake metrics to each agent for demo purposes
                    const agentsWithMetrics: AgentWithMetrics[] = response.data.map((agent: Agent) => ({
                        ...agent,
                        metrics: {
                            total_conversations: Math.floor(Math.random() * 100),
                            avg_user_satisfaction: Math.random() * 5,
                            avg_response_time: Math.random() * 10,
                            success_rate: Math.random()
                        }
                    }));
                    
                    setAgents(agentsWithMetrics);
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching agents:', error);
                setError('Failed to load agents. Please try again later.');
                setLoading(false);
            }
        };
        
        fetchAgents();
    }, []);

    useEffect(() => {
        console.log('Current agents state:', agents);
        console.log('Selected agent:', selectedAgent);
        console.log('Loading state:', loading);
    }, [agents, selectedAgent, loading]);

    useEffect(() => {
        console.log("Wizard visibility state changed:", showWizard);
    }, [showWizard]);

    // Menu handlers
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, agentId: number) => {
        setMenuAnchorEl(event.currentTarget);
        setMenuAgentId(String(agentId));
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setMenuAgentId(null);
    };

    const handleOpenEditDialog = (agent: AgentWithMetrics) => {
        setSelectedAgent(agent);
        setEditDialogOpen(true);
    };

    const handleOpenRoleDialog = (agent: AgentWithMetrics) => {
        setSelectedAgent(agent);
        setRoleDialogOpen(true);
    };

    const handleOpenBehaviorDialog = (agent: AgentWithMetrics) => {
        setSelectedAgent(agent);
        setBehaviorDialogOpen(true);
    };

    const handleOpenDeleteDialog = (agent: AgentWithMetrics) => {
        setSelectedAgent(agent);
        setConfirmDeleteDialogOpen(true);
    };

    // Implement handler for menu item clicks
    const handleMenuItemClick = (action: string) => {
        setMenuAnchorEl(null);
        
        // Find the selected agent
        const agent = agents.find(a => String(a.id) === menuAgentId);
        if (!agent) return;
        
        switch (action) {
            case 'edit':
                handleOpenEditDialog(agent);
                break;
            case 'role':
                handleOpenRoleDialog(agent);
                break;
            case 'behavior':
                handleOpenBehaviorDialog(agent);
                break;
            case 'delete':
                handleOpenDeleteDialog(agent);
                break;
            default:
                break;
        }
    };

    // Handlers for each dialog's save operation
    const handleSaveAgentInfo = async (agentData: { name: string; description: string }) => {
        try {
            if (!selectedAgent) return;
            
            console.log('Saving agent info:', agentData);
            const response = await agentService.updateAgent(String(selectedAgent.id), {
                name: agentData.name,
                description: agentData.description
            });
            
            if (response && response.data) {
                // Update the agent in the list
                const updatedAgents = agents.map(agent => {
                    if (agent.id === selectedAgent.id) {
                        return {
                            ...agent,
                            name: agentData.name,
                            description: agentData.description
                        };
                    }
                    return agent;
                });
                
                setAgents(updatedAgents);
                setSelectedAgent(prev => prev ? {
                    ...prev,
                    name: agentData.name,
                    description: agentData.description
                } : null);
                
                setSnackbarMessage('Agent information updated successfully');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setEditDialogOpen(false);
            }
        } catch (err) {
            console.error('Error updating agent info:', err);
            setSnackbarMessage('Failed to update agent information');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };
    
    const handleSaveAgentRole = async (roleData: { ai_role: AgentRole, role_description?: string }) => {
        try {
            if (!selectedAgent) return;
            
            console.log('Saving agent role:', roleData);
            const response = await agentService.updateAgent(String(selectedAgent.id), {
                ai_role: roleData.ai_role,
                role_description: roleData.role_description
            });
            
            if (response && response.data) {
                // Update the agent in the list
                const updatedAgents = agents.map(agent => {
                    if (agent.id === selectedAgent.id) {
                        return {
                            ...agent,
                            ai_role: roleData.ai_role,
                            role_description: roleData.role_description
                        };
                    }
                    return agent;
                });
                
                setAgents(updatedAgents);
                setSelectedAgent(prev => prev ? {
                    ...prev,
                    ai_role: roleData.ai_role,
                    role_description: roleData.role_description
                } : null);
                
                setSnackbarMessage('Agent role updated successfully');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setRoleDialogOpen(false);
            }
        } catch (err) {
            console.error('Error updating agent role:', err);
            setSnackbarMessage('Failed to update agent role');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };
    
    const handleSaveAgentBehavior = async (behaviorData: { 
        response_style: number; 
        response_length: number; 
        language: string;
        model: string;
    }) => {
        try {
            if (!selectedAgent) return;
            
            console.log('Saving agent behavior:', behaviorData);
            const response = await agentService.updateAgent(String(selectedAgent.id), {
                // Update both the top-level language property and the config properties
                language: behaviorData.language,
                // Config will be merged on the backend
                config: {
                    model: behaviorData.model,
                    language: behaviorData.language,
                    mode: AgentMode.TEXT, // Include required mode field
                    response_style: behaviorData.response_style,
                    response_length: behaviorData.response_length
                }
            });
            
            if (response && response.data) {
                // Update the agent in the list with the new config values
                const updatedAgents = agents.map(agent => {
                    if (agent.id === selectedAgent.id) {
                        return {
                            ...agent,
                            language: behaviorData.language,
                            // Update just the specific values that changed
                            config: agent.config ? {
                                ...agent.config,
                                model: behaviorData.model,
                                language: behaviorData.language,
                                mode: AgentMode.TEXT, // Include required mode field
                                response_style: behaviorData.response_style,
                                response_length: behaviorData.response_length
                            } : {
                                // Default values if config doesn't exist
                                model: behaviorData.model,
                                language: behaviorData.language,
                                mode: AgentMode.TEXT, // Include required mode field
                                response_style: behaviorData.response_style,
                                response_length: behaviorData.response_length
                            }
                        } as AgentWithMetrics; // Force type with as to help TypeScript
                    }
                    return agent;
                });
                
                setAgents(updatedAgents as AgentWithMetrics[]); // Force type assertion
                
                if (selectedAgent) {
                    // Update selected agent with new config
                    const updatedAgent = {
                        ...selectedAgent,
                        language: behaviorData.language,
                        // Update just the specific values that changed
                        config: selectedAgent.config ? {
                            ...selectedAgent.config,
                            model: behaviorData.model,
                            language: behaviorData.language,
                            mode: AgentMode.TEXT, // Include required mode field
                            response_style: behaviorData.response_style,
                            response_length: behaviorData.response_length
                        } : {
                            // Default values if config doesn't exist
                            model: behaviorData.model,
                            language: behaviorData.language,
                            mode: AgentMode.TEXT, // Include required mode field
                            response_style: behaviorData.response_style,
                            response_length: behaviorData.response_length
                        }
                    } as AgentWithMetrics; // Force type assertion
                    
                    setSelectedAgent(updatedAgent);
                }
                
                setSnackbarMessage('Agent behavior updated successfully');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setBehaviorDialogOpen(false);
            }
        } catch (err) {
            console.error('Error updating agent behavior:', err);
            setSnackbarMessage('Failed to update agent behavior');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleDeleteAgent = async () => {
        if (!selectedAgent) return;
        
        try {
            console.log('Deleting agent:', selectedAgent.id);
            const response = await agentService.deleteAgent(String(selectedAgent.id));
            
            if (response) {
                // Remove the agent from the list
                const updatedAgents = agents.filter(agent => agent.id !== selectedAgent.id);
                setAgents(updatedAgents);
                
                // Clear the selected agent if it was deleted
                setSelectedAgent(null);
                
                setSnackbarMessage('Agent deleted successfully');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setConfirmDeleteDialogOpen(false);
            }
        } catch (err) {
            console.error('Error deleting agent:', err);
            setSnackbarMessage('Failed to delete agent');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    // Simplified CreateAgent function that properly types the agent data
    const handleCreateAgent = async (newAgentData: PartialAgent) => {
        try {
            console.log('Creating agent with data:', newAgentData);
            
            // Validate required fields
            if (!newAgentData.name) {
                setSnackbarMessage('Agent name is required');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                return;
            }
            
            const response = await agentService.createAgent({ 
                name: newAgentData.name, 
                ai_role: newAgentData.ai_role || AgentRole.CUSTOMER_SUPPORT,
                response_style: typeof newAgentData.response_style === 'number' ? 
                    Math.max(0, Math.min(1, newAgentData.response_style)) : 0.5,
                response_length: typeof newAgentData.response_length === 'number' ? 
                    Math.max(50, Math.min(500, newAgentData.response_length)) : 150
            });
            
            if (response && response.data) {
                // Add the new agent to the list with fake metrics
                const newAgentWithMetrics: AgentWithMetrics = {
                    ...response.data,
                    metrics: {
                        total_conversations: 0,
                        avg_user_satisfaction: 0,
                        avg_response_time: 0,
                        success_rate: 0
                    }
                };
                
                setAgents(prevAgents => [...prevAgents, newAgentWithMetrics]);
                setSnackbarMessage('Agent created successfully');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setShowWizard(false);
            }
        } catch (err) {
            console.error('Error creating agent:', err);
            setSnackbarMessage('Failed to create agent');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    // Helper functions for displaying model and role information
    const getModelDisplayName = (model: string) => {
        const models: Record<string, string> = {
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'gpt-4': 'GPT-4',
            'claude-instant-1': 'Claude Instant',
            'claude-2': 'Claude 2'
        };
        return models[model] || model;
    };
    
    const getModelDescription = (model: string) => {
        const descriptions: Record<string, string> = {
            'gpt-3.5-turbo': 'Fast and efficient, good for most tasks',
            'gpt-4': 'Most capable model, best for complex tasks',
            'claude-instant-1': 'Quick and responsive assistant',
            'claude-2': 'Balanced performance and capabilities'
        };
        return descriptions[model] || 'Custom model';
    };
    
    const getRoleDescription = (role: AgentRole) => {
        const descriptions: Record<string, string> = {
            [AgentRole.CUSTOMER_SUPPORT]: 'Assists customers with questions and issues',
            [AgentRole.TECHNICAL_SUPPORT]: 'Provides technical guidance and troubleshooting',
            [AgentRole.SALES_SERVICES]: 'Helps customers with purchasing decisions',
            [AgentRole.CONSULTING]: 'Offers expert advice and solutions tailored to specific customer needs'
        };
        return descriptions[role] || 'Custom role';
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Typography variant="h6" color="textSecondary">
                        Loading agent data...
                    </Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        {error}
                    </Typography>
                    <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#121212', color: 'white' }}>
            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                    <CircularProgress color="primary" />
                </Box>
            )}
            
            <Typography variant="h4" component="h1" gutterBottom align="left">
                Agent Management
            </Typography>
            
            {/* Emergency Create Button - Always visible */}
            <Box sx={{ 
                position: 'fixed', 
                bottom: 30, 
                right: 30, 
                zIndex: 9999 
            }}>
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        console.log('Emergency Create button clicked, opening wizard');
                        setShowWizard(true);
                    }}
                    sx={{
                        backgroundColor: '#00b0ff',
                        '&:hover': {
                            backgroundColor: '#0091ea',
                        },
                        borderRadius: '28px',
                        boxShadow: '0 4px 20px rgba(0, 176, 255, 0.5)',
                        padding: '12px 24px',
                    }}
                >
                    Create Agent
                </Button>
            </Box>
            
            {/* Display error message if exists */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            
            {/* Agent Creation Wizard Modal */}
            <AgentCreationWizard
                open={showWizard}
                onClose={() => {
                    console.log('Closing wizard');
                    setShowWizard(false);
                }}
                onSubmit={handleCreateAgent}
                onDataChange={(data) => console.log('Agent data updated:', data)}
                onKnowledgeSelect={(ids) => console.log('Knowledge selected:', ids)}
                initialData={{
                    name: '',
                    description: '',
                    ai_role: AgentRole.CUSTOMER_SUPPORT,
                    mode: AgentMode.TEXT,
                    language: 'en',
                    response_style: 0.5,
                    response_length: 150,
                    actions: []
                }}
            />
            
            {/* Tabs for different agent views */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                    value={currentTab} 
                    onChange={(_, newValue) => setCurrentTab(newValue)}
                    aria-label="agent management tabs"
                >
                    <Tab label="Agents" />
                    <Tab label="Configuration" />
                    <Tab label="Performance" />
                </Tabs>
            </Box>
            
            {/* Agent List */}
            {!loading && !error && agents.length > 0 && (
                <Paper sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <Box sx={{ display: 'flex' }}>
                        {/* Agent List */}
                        <Box sx={{ width: '30%', borderRight: '1px solid rgba(255, 255, 255, 0.1)', pr: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                                Your Agents
                            </Typography>
                            <Box sx={{ mt: 4 }}>
                                {agents.map((agent) => (
                                    <Paper 
                                        key={agent.id} 
                                        className={selectedAgent?.id === agent.id ? 'selected-agent' : ''}
                                        onClick={() => {
                                            const agentWithMetrics = {
                                                ...agent,
                                                metrics: {
                                                    total_conversations: 0,
                                                    avg_user_satisfaction: 0,
                                                    avg_response_time: 0,
                                                    success_rate: 0
                                                }
                                            };
                                            setSelectedAgent(agentWithMetrics);
                                        }}
                                        sx={{ 
                                            p: 2, 
                                            mb: 2, 
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                boxShadow: 3,
                                                transform: 'translateY(-2px)'
                                            }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="h6">{agent.name}</Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {getRoleDescription(agent.ai_role)}
                                                </Typography>
                                                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                                    Using {getModelDisplayName(agent.config?.model || 'gpt-4')} - {getModelDescription(agent.config?.model || 'gpt-4')}
                                                </Typography>
                                            </Box>
                                            <IconButton onClick={(e) => {
                                                e.stopPropagation();
                                                handleMenuOpen(e, agent.id);
                                            }}>
                                                <MoreVert />
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        </Box>

                        {/* Agent Details */}
                        {selectedAgent ? (
                            <Box sx={{ flexGrow: 1, pl: 3 }}>
                                <Typography variant="h5" gutterBottom sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                                    {selectedAgent.name}
                                </Typography>
                                
                                <Tabs 
                                    value={currentTab} 
                                    onChange={(_, newValue) => setCurrentTab(newValue)}
                                    sx={{ 
                                        mb: 3,
                                        '& .MuiTabs-indicator': {
                                            backgroundColor: '#00F3FF'
                                        },
                                        '& .MuiTab-root': {
                                            color: '#AAAAAA',
                                            '&.Mui-selected': {
                                                color: '#00F3FF'
                                            }
                                        }
                                    }}
                                >
                                    <Tab label="Details" />
                                    <Tab label="Performance" />
                                    <Tab label="Knowledge" />
                                </Tabs>

                                {/* Details Tab */}
                                <TabPanel value={currentTab} index={0}>
                                    <Typography variant="body1" paragraph sx={{ color: '#FFFFFF' }}>
                                        {selectedAgent.description || 'No description provided.'}
                                    </Typography>
                                    
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="subtitle1" sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                                            Configuration
                                        </Typography>
                                        <Box sx={{ 
                                            mt: 1, 
                                            p: 2, 
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                                            borderRadius: 1,
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}>
                                            <Typography variant="body2" sx={{ color: '#FFFFFF', mb: 1 }}>
                                                <strong>Role:</strong> {selectedAgent.ai_role || 'Standard'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#FFFFFF', mb: 1 }}>
                                                <strong>Mode:</strong> {selectedAgent.mode || 'Text'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#FFFFFF', mb: 1 }}>
                                                <strong>Language:</strong> {selectedAgent.language || 'English'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#FFFFFF', mb: 1 }}>
                                                <strong>Response Style:</strong> {selectedAgent.response_style || '0.5'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                                                <strong>Response Length:</strong> {selectedAgent.response_length || '150 words'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TabPanel>

                                {/* Performance Tab */}
                                <TabPanel value={currentTab} index={1}>
                                    <Box sx={{ 
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: 3
                                    }}>
                                        <Paper sx={{ 
                                            p: 3, 
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                                            borderRadius: 2,
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center'
                                        }}>
                                            <Typography variant="h4" sx={{ color: '#00F3FF', fontWeight: 'bold' }}>
                                                {selectedAgent.metrics?.total_conversations || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#AAAAAA' }}>
                                                Total Conversations
                                            </Typography>
                                        </Paper>
                                        
                                        <Paper sx={{ 
                                            p: 3, 
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                                            borderRadius: 2,
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center'
                                        }}>
                                            <Typography variant="h4" sx={{ color: '#00F3FF', fontWeight: 'bold' }}>
                                                {selectedAgent.metrics?.avg_user_satisfaction || 0}%
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#AAAAAA' }}>
                                                Avg. User Satisfaction
                                            </Typography>
                                        </Paper>
                                        
                                        <Paper sx={{ 
                                            p: 3, 
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                                            borderRadius: 2,
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center'
                                        }}>
                                            <Typography variant="h4" sx={{ color: '#00F3FF', fontWeight: 'bold' }}>
                                                {selectedAgent.metrics?.avg_response_time || 0}s
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#AAAAAA' }}>
                                                Avg. Response Time
                                            </Typography>
                                        </Paper>
                                        
                                        <Paper sx={{ 
                                            p: 3, 
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                                            borderRadius: 2,
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center'
                                        }}>
                                            <Typography variant="h4" sx={{ color: '#00F3FF', fontWeight: 'bold' }}>
                                                {selectedAgent.metrics?.success_rate || 0}%
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#AAAAAA' }}>
                                                Success Rate
                                            </Typography>
                                        </Paper>
                                    </Box>
                                </TabPanel>

                                {/* Knowledge Tab */}
                                <TabPanel value={currentTab} index={2}>
                                    {/* Removed the incorrect KnowledgeSelector import */}
                                </TabPanel>
                            </Box>
                        ) : (
                            <Box sx={{ 
                                flexGrow: 1, 
                                pl: 3, 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '300px'
                            }}>
                                <Typography variant="body1" sx={{ color: '#AAAAAA' }}>
                                    Select an agent to view details
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Paper>
            )}
            
            {/* Empty State - Show this even if there's an error to ensure something is visible */}
            {(!loading || error) && agents.length === 0 && (
                <Paper sx={{ 
                    p: 4, 
                    my: 2, 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 10
                }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                        {error ? 'Error Loading Agents' : 'No Agents Found'}
                    </Typography>
                    <Typography paragraph sx={{ color: '#AAAAAA', textAlign: 'center', mb: 3 }}>
                        {error 
                            ? error 
                            : "You haven't created any agents yet. Create your first agent to get started."}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            console.log("Create agent button clicked - EMPTY STATE");
                            setShowWizard(true);
                        }}
                        sx={{ 
                            backgroundColor: '#00F3FF', 
                            color: '#000000',
                            '&:hover': {
                                backgroundColor: '#00D1DD'
                            }
                        }}
                    >
                        Create Your First Agent
                    </Button>
                </Paper>
            )}
            
            {/* Notification */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setSnackbarOpen(false)} 
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            <Dialog
                open={confirmDeleteDialogOpen}
                onClose={() => setConfirmDeleteDialogOpen(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Delete Agent"}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: '#AAAAAA' }}>
                        Are you sure you want to delete this agent?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteDialogOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteAgent} color="primary" autoFocus>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Edit Agent Dialog */}
            <AgentEditDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                agent={selectedAgent}
                onSave={(agentData: { name: string; description: string }) => handleSaveAgentInfo(agentData)}
            />
            
            {/* Configure Role Dialog */}
            <AgentRoleDialog
                open={roleDialogOpen}
                onClose={() => setRoleDialogOpen(false)}
                agent={selectedAgent}
                onSave={(roleData: { ai_role: AgentRole, role_description?: string }) => handleSaveAgentRole(roleData)}
            />
            
            {/* Configure Behavior Dialog */}
            <AgentBehaviorDialog
                open={behaviorDialogOpen}
                onClose={() => setBehaviorDialogOpen(false)}
                agent={selectedAgent}
                onSave={(behaviorData: { 
                    response_style: number; 
                    response_length: number; 
                    language: string;
                    model: string;
                }) => handleSaveAgentBehavior(behaviorData)}
            />
            
            {/* Menu for agent actions */}
            <Menu
                id="agent-menu"
                anchorEl={menuAnchorEl}
                keepMounted
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleMenuItemClick('edit')}>
                    <Edit sx={{ mr: 1, fontSize: 20 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('role')}>
                    <Settings sx={{ mr: 1, fontSize: 20 }} />
                    Configure Role
                </MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('behavior')}>
                    <Psychology sx={{ mr: 1, fontSize: 20 }} />
                    Configure Behavior
                </MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('delete')}>
                    <Delete sx={{ mr: 1, fontSize: 20 }} color="error" />
                    Delete
                </MenuItem>
            </Menu>
        </Container>
    );
};
