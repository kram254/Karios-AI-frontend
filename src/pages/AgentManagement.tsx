import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    Tabs,
    Tab,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Agent, AgentRole, AgentMode } from '../types/agent';
import { agentService } from '../services/api/agent.service';
import { AgentCreationWizard } from '../components/agent/AgentCreationWizard';
import { KnowledgeSelector } from '../components/knowledge/KnowledgeSelector';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface ExtendedAgent extends Agent {
    metrics: {
        total_conversations: number;
        avg_user_satisfaction: number;
        avg_response_time: number;
        success_rate: number;
    };
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ padding: '24px 0' }}>
        {value === index && children}
    </div>
);

export const AgentManagement: React.FC = () => {
    console.log('AgentManagement component rendering');
    
    // Add console logs to track the render process
    useEffect(() => {
        console.log('AgentManagement mounted');
        return () => console.log('AgentManagement unmounted');
    }, []);
    
    const [currentTab, setCurrentTab] = useState(0);
    const [showWizard, setShowWizard] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<ExtendedAgent | null>(null);
    const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{
        message: string;
        type: 'success' | 'error';
        open: boolean;
    }>({
        message: '',
        type: 'success',
        open: false
    });
    const [error, setError] = useState<string | null>(null);
    const [renderError, setRenderError] = useState<string | null>(null);
    const [agentData, setAgentData] = useState<Partial<Agent>>({
        name: '',
        description: '',
        ai_role: AgentRole.CUSTOMER_SUPPORT,
        language: 'en',
        mode: AgentMode.TEXT,
        response_style: 0.5,
        response_length: 150
    });

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
            setRenderError(String(err));
            setLoading(false);
        }
    }, []);

    const fetchAgents = async () => {
        console.log('Fetching agents...');
        setLoading(true);
        setError(null);
        
        try {
            const response = await agentService.getAgents();
            console.log('Agent data received:', response.data);
            
            if (response && response.data) {
                // Create ExtendedAgent objects with metrics
                const agentsWithMetrics = response.data.map(agent => ({
                    ...agent,
                    metrics: {
                        total_conversations: 0,
                        avg_user_satisfaction: 0,
                        avg_response_time: 0,
                        success_rate: 0
                    }
                }));
                
                setAgents(agentsWithMetrics);
                console.log('Agents set in state:', agentsWithMetrics);
                
                // If there are agents and no agent is selected, select the first one
                if (agentsWithMetrics.length > 0 && !selectedAgent) {
                    setSelectedAgent(agentsWithMetrics[0]);
                    console.log('Selected first agent:', agentsWithMetrics[0]);
                }
            } else {
                console.warn('No agents data in response');
                setAgents([]);
            }
        } catch (err) {
            console.error('Error fetching agents:', err);
            setError('Failed to load agents. Please try again later.');
            // Don't set agents to empty array here, keep existing agents if any
        } finally {
            // Always set loading to false, even if there's an error
            setLoading(false);
        }
    };

    const resetWizard = () => {
        setSelectedKnowledgeIds([]);
    };

    const handleKnowledgeSelect = (ids: number[]) => {
        setSelectedKnowledgeIds(ids);
    };

    const handleAgentDataChange = (data: Partial<Agent>) => {
        console.log("Agent data changed:", data);
    };

    const handleCreateAgent = async (agentData: Partial<Agent>) => {
        try {
            console.log('Creating agent with data:', agentData);
            console.log('Selected knowledge IDs:', selectedKnowledgeIds);
            
            const response = await agentService.createAgent({ 
                name: agentData.name || '', 
                ai_role: agentData.ai_role || AgentRole.CUSTOMER_SUPPORT, 
                language: agentData.language || 'en', 
                mode: agentData.mode || AgentMode.TEXT, 
                response_style: agentData.response_style || 0.5, 
                response_length: agentData.response_length || 150, 
                knowledge_item_ids: selectedKnowledgeIds,
                config: {
                    tools_enabled: agentData.actions || []
                }
            });
            
            if (response && response.data) {
                console.log('Agent created successfully:', response.data);
                await fetchAgents();
                setShowWizard(false);
                resetWizard();
                showNotification('Agent created successfully', 'success');
            }
        } catch (err: any) {
            console.error('Error creating agent:', err);
            showNotification(err.message || 'Failed to create agent', 'error');
        }
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({
            message,
            type,
            open: true
        });
    };

    useEffect(() => {
        console.log('Agent Management component mounted, fetching agents');
        const fetchAgents = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log('Before API call to get agents');
                const response = await agentService.getAgents();
                console.log('API response:', response);
                
                if (response && response.data) {
                    console.log('Setting agents:', response.data);
                    setAgents(response.data);
                    
                    // Set the first agent as selected if available
                    if (response.data.length > 0 && !selectedAgent) {
                        console.log('Setting selected agent:', response.data[0]);
                        const selectedAgentWithMetrics = {
                            ...response.data[0],
                            metrics: {
                                total_conversations: 0,
                                avg_user_satisfaction: 0,
                                avg_response_time: 0,
                                success_rate: 0
                            }
                        };
                        setSelectedAgent(selectedAgentWithMetrics);
                    }
                } else {
                    console.log('No agents found or invalid response format');
                    setAgents([]);
                }
            } catch (err) {
                console.error('Error fetching agents:', err);
                setError('Failed to fetch agents. Please try again later.');
                setAgents([]); // Set empty array on error to prevent undefined issues
            } finally {
                setLoading(false);
            }
        };

        fetchAgents();
    }, [selectedAgent]);

    useEffect(() => {
        console.log('Current agents state:', agents);
        console.log('Selected agent:', selectedAgent);
        console.log('Loading state:', loading);
    }, [agents, selectedAgent, loading]);

    useEffect(() => {
        console.log("Wizard visibility state changed:", showWizard);
    }, [showWizard]);

    return (
        <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#121212', color: 'white' }}>
            {/* Error Alert */}
            {renderError && (
                <Alert severity="error" sx={{ mb: 2, backgroundColor: '#ff5252', color: 'white' }}>
                    Render Error: {renderError}
                </Alert>
            )}
            
            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                    <CircularProgress color="secondary" />
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
                    resetWizard();
                }}
                onDataChange={handleAgentDataChange}
                onKnowledgeSelect={handleKnowledgeSelect}
                onSubmit={handleCreateAgent}
                initialData={agentData}
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
                            {agents.map(agent => (
                                <Box 
                                    key={agent.id}
                                    onClick={() => {
                                        // Create an ExtendedAgent with metrics when selecting from the list
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
                                        mb: 1,
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        backgroundColor: selectedAgent?.id === agent.id ? 'rgba(0, 243, 255, 0.1)' : 'transparent',
                                        border: selectedAgent?.id === agent.id ? '1px solid rgba(0, 243, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 243, 255, 0.05)',
                                            border: '1px solid rgba(0, 243, 255, 0.3)'
                                        }
                                    }}
                                >
                                    <Typography variant="subtitle1" sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                                        {agent.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#AAAAAA' }}>
                                        {agent.description || 'No description'}
                                    </Typography>
                                </Box>
                            ))}
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
                                    <KnowledgeSelector
                                        selectedIds={selectedAgent.knowledge_items?.map(k => k.id) || []}
                                        onSelectionChange={handleKnowledgeSelect}
                                        agentId={selectedAgent.id}
                                    />
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
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
                    severity={notification.type}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};
