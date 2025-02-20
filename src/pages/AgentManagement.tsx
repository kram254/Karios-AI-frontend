import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Typography,
    Button,
    Tab,
    Tabs,
    Paper,
    Alert,
    Snackbar
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AgentCreationWizard } from '../components/agent/AgentCreationWizard';
import { AgentStatusMonitor } from '../components/agent/AgentStatusMonitor';
import { TestInterface } from '../components/agent/TestInterface';
import { KnowledgeSelector } from '../components/knowledge/KnowledgeSelector';
import { Agent, AgentStatus, AgentTestResult } from '../types/agent';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ padding: '24px 0' }}>
        {value === index && children}
    </div>
);

export const AgentManagement: React.FC = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [showWizard, setShowWizard] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<number[]>([]);
    const [notification, setNotification] = useState<{
        message: string;
        type: 'success' | 'error';
        open: boolean;
    }>({ message: '', type: 'success', open: false });

    // Mock functions - replace with actual API calls
    const fetchAgents = async () => {
        // Simulated API response
        const mockAgents: Agent[] = [
            {
                id: 1,
                name: "Sales Assistant",
                status: AgentStatus.ACTIVE,
                config: {
                    model: "gpt-4",
                    temperature: 0.7,
                    language: "en",
                    response_style: "professional"
                },
                created_at: new Date().toISOString(),
                last_active: new Date().toISOString(),
                metrics: {
                    success_rate: 95.5,
                    total_requests: 1000,
                    avg_response_time: 1.2,
                    total_tokens: 50000
                }
            }
        ];
        setAgents(mockAgents);
        if (!selectedAgent && mockAgents.length > 0) {
            setSelectedAgent(mockAgents[0]);
        }
    };

    const handleCreateAgent = async (agentData: Partial<Agent>) => {
        try {
            // Simulate API call
            const newAgent: Agent = {
                id: agents.length + 1,
                name: agentData.name || "New Agent",
                status: AgentStatus.ACTIVE,
                config: agentData.config || {
                    model: "gpt-4",
                    temperature: 0.7,
                    language: "en",
                    response_style: "professional"
                },
                created_at: new Date().toISOString(),
                last_active: new Date().toISOString(),
                metrics: {
                    success_rate: 0,
                    total_requests: 0,
                    avg_response_time: 0,
                    total_tokens: 0
                }
            };
            
            setAgents([...agents, newAgent]);
            setSelectedAgent(newAgent);
            setShowWizard(false);
            showNotification('Agent created successfully!', 'success');
        } catch (error) {
            showNotification('Failed to create agent', 'error');
        }
    };

    const handleTest = async (input: string): Promise<AgentTestResult> => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            success: true,
            response: "This is a simulated response from the AI agent. I understand you're interested in our products. How can I help you today?",
            tokens_used: 150,
            response_time: 1200
        };
    };

    const handleRefresh = async () => {
        await fetchAgents();
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type, open: true });
    };

    useEffect(() => {
        fetchAgents();
    }, []);

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

            {showWizard && (
                <AgentCreationWizard
                    open={showWizard}
                    onClose={() => setShowWizard(false)}
                    onCreate={handleCreateAgent}
                />
            )}

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
