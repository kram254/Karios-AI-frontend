import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Tab,
    Tabs,
    Paper,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AgentCreationWizard } from '../components/agent/AgentCreationWizard';
import { AgentStatusMonitor } from '../components/agent/AgentStatusMonitor';
import { TestInterface } from '../components/agent/TestInterface';
import { KnowledgeSelector } from '../components/knowledge/KnowledgeSelector';
import { Agent, AgentStatus, AgentTestResult, AgentMetrics } from '../types/agent';
import { agentService } from '../services/api/agent.service';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface ExtendedAgent extends Agent {
    metrics?: AgentMetrics;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ padding: '24px 0' }}>
        {value === index && children}
    </div>
);

export const AgentManagement: React.FC = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [showWizard, setShowWizard] = useState(false);
    const [agents, setAgents] = useState<ExtendedAgent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<ExtendedAgent | null>(null);
    const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{
        message: string;
        type: 'success' | 'error';
        open: boolean;
    }>({ message: '', type: 'success', open: false });

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const response = await agentService.getAgents();
            setAgents(response.data);
            if (!selectedAgent && response.data.length > 0) {
                setSelectedAgent(response.data[0]);
            }
        } catch (error) {
            showNotification('Failed to fetch agents', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAgent = async (agentData: Partial<Agent>) => {
        try {
            const response = await agentService.createAgent(agentData.config!);
            setAgents([...agents, response.data]);
            setSelectedAgent(response.data);
            setShowWizard(false);
            showNotification('Agent created successfully!', 'success');

            if (selectedKnowledgeIds.length > 0) {
                await agentService.assignKnowledge(response.data.id, selectedKnowledgeIds);
            }
        } catch (error) {
            showNotification('Failed to create agent', 'error');
        }
    };

    const handleTest = async (input: string): Promise<AgentTestResult> => {
        if (!selectedAgent) {
            throw new Error('No agent selected');
        }
        
        try {
            const response = await agentService.testAgent(selectedAgent.id, input);
            return response.data;
        } catch (error) {
            throw new Error('Failed to test agent');
        }
    };

    const handleRefresh = async () => {
        if (selectedAgent) {
            try {
                const [agentResponse, statsResponse] = await Promise.all([
                    agentService.getAgents(),
                    agentService.getAgentStats(selectedAgent.id)
                ]);
                
                setAgents(agentResponse.data);
                const updatedAgent = agentResponse.data.find(a => a.id === selectedAgent.id);
                if (updatedAgent) {
                    setSelectedAgent({
                        ...updatedAgent,
                        metrics: statsResponse.data
                    });
                }
            } catch (error) {
                showNotification('Failed to refresh agent data', 'error');
            }
        }
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type, open: true });
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    if (loading && agents.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: '#00F3FF' }} />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4" component="h1">
                        AI Sales Agents
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowWizard(true)}
                        sx={{
                            bgcolor: '#00F3FF',
                            color: '#000000',
                            '&:hover': {
                                bgcolor: '#00D4E0'
                            }
                        }}
                    >
                        Create New Agent
                    </Button>
                </Box>

                {selectedAgent ? (
                    <>
                        <Paper 
                            sx={{ 
                                bgcolor: '#1A1A1A',
                                color: '#FFFFFF',
                                mb: 3
                            }}
                        >
                            <Tabs
                                value={currentTab}
                                onChange={(_, newValue) => setCurrentTab(newValue)}
                                sx={{
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    '& .MuiTab-root': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        '&.Mui-selected': {
                                            color: '#00F3FF'
                                        }
                                    },
                                    '& .MuiTabs-indicator': {
                                        bgcolor: '#00F3FF'
                                    }
                                }}
                            >
                                <Tab label="Overview" />
                                <Tab label="Test" />
                                <Tab label="Knowledge Base" />
                            </Tabs>
                        </Paper>

                        <TabPanel value={currentTab} index={0}>
                            <AgentStatusMonitor
                                agent={selectedAgent}
                                onRefresh={handleRefresh}
                            />
                        </TabPanel>

                        <TabPanel value={currentTab} index={1}>
                            <TestInterface
                                agent={selectedAgent}
                                onTest={handleTest}
                            />
                        </TabPanel>

                        <TabPanel value={currentTab} index={2}>
                            <KnowledgeSelector
                                selectedIds={selectedKnowledgeIds}
                                onSelectionChange={setSelectedKnowledgeIds}
                            />
                        </TabPanel>
                    </>
                ) : (
                    <Alert 
                        severity="info"
                        sx={{ 
                            bgcolor: 'rgba(33, 150, 243, 0.1)',
                            color: '#2196F3'
                        }}
                    >
                        No agents available. Create your first agent to get started!
                    </Alert>
                )}
            </Box>

            <AgentCreationWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                onCreate={handleCreateAgent}
            />

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
            >
                <Alert 
                    severity={notification.type}
                    sx={{ 
                        bgcolor: notification.type === 'success' 
                            ? 'rgba(76, 175, 80, 0.1)' 
                            : 'rgba(244, 67, 54, 0.1)',
                        color: notification.type === 'success' ? '#4CAF50' : '#F44336'
                    }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};
