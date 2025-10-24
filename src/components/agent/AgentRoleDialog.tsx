import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    CircularProgress,
    Alert,
    TextField
} from '@mui/material';
import { Agent, AgentRole } from '../../types/agent';

interface AgentRoleDialogProps {
    open: boolean;
    agent: Agent | null;
    onClose: () => void;
    onSave: (roleData: { ai_role: AgentRole, role_description?: string }) => Promise<void>;
}

const roleDescriptions: Record<AgentRole, string> = {
    [AgentRole.WEB_SCRAPING]: 'Extract and structure data from websites with intelligent parsing and multi-page navigation.',
    [AgentRole.WEB_AUTOMATION]: 'Automate browser interactions and workflows with precision using Selenium and Playwright.',
    [AgentRole.TASK_AUTOMATION]: 'Orchestrate complex multi-step tasks and processes with scheduling and monitoring.',
    [AgentRole.DEEP_RESEARCH]: 'Comprehensive information gathering and analysis across multiple sources with verification.',
    [AgentRole.CONTENT_CREATION]: 'Generate high-quality content including articles, documentation, and marketing copy.',
    [AgentRole.DATA_ANALYSIS]: 'Process and analyze data to extract actionable insights with visualization support.',
    [AgentRole.EMAIL_AUTOMATION]: 'Manage and automate email communications with SMTP integration and campaign tracking.',
    [AgentRole.DOCUMENT_PROCESSING]: 'Analyze, extract, and transform document content with OCR and format conversion.',
    [AgentRole.TESTING_QA]: 'Automated testing and quality assurance for web applications with comprehensive coverage.',
    [AgentRole.CUSTOM]: 'Custom agent role with specialized functionality based on your description.'
};

const roleOptimizations: Record<AgentRole, string> = {
    [AgentRole.WEB_SCRAPING]: 'Optimized for efficient data extraction, handling dynamic content, pagination, and rate limiting with clean structured output.',
    [AgentRole.WEB_AUTOMATION]: 'Optimized for reliable browser control, element interaction, error handling, and workflow execution in headed or headless modes.',
    [AgentRole.TASK_AUTOMATION]: 'Optimized for workflow orchestration, parallel execution, state management, and comprehensive monitoring with real-time updates.',
    [AgentRole.DEEP_RESEARCH]: 'Optimized for multi-source research, fact-checking, source verification, and synthesizing complex information into actionable insights.',
    [AgentRole.CONTENT_CREATION]: 'Optimized for engaging writing, tone adaptation, SEO optimization, and producing publication-ready content across formats.',
    [AgentRole.DATA_ANALYSIS]: 'Optimized for data validation, statistical analysis, pattern recognition, and presenting findings with clear visualizations.',
    [AgentRole.EMAIL_AUTOMATION]: 'Optimized for template management, delivery monitoring, automation triggers, and campaign performance tracking.',
    [AgentRole.DOCUMENT_PROCESSING]: 'Optimized for text extraction, OCR accuracy, document classification, and efficient batch processing across formats.',
    [AgentRole.TESTING_QA]: 'Optimized for comprehensive test coverage, automated UI testing, bug detection, and performance monitoring with detailed reports.',
    [AgentRole.CUSTOM]: 'Will be optimized based on your custom role description.'
};

const AgentRoleDialog: React.FC<AgentRoleDialogProps> = ({ open, agent, onClose, onSave }) => {
    const [role, setRole] = useState<AgentRole>(AgentRole.WEB_SCRAPING);
    const [roleDescription, setRoleDescription] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (agent && agent.ai_role) {
            setRole(agent.ai_role);
            if (agent.role_description) {
                setRoleDescription(agent.role_description);
            }
        }
    }, [agent]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const saveData: { ai_role: AgentRole, role_description?: string } = { ai_role: role };
            
            // Only include role_description if it's a custom role and description is provided
            if (role === AgentRole.CUSTOM && roleDescription) {
                saveData.role_description = roleDescription;
            }
            
            await onSave(saveData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update agent role');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            sx={{
                '& .MuiDialog-paper': {
                    backgroundColor: '#1A1A1A',
                    color: '#FFFFFF',
                    border: '1px solid rgba(0, 243, 255, 0.2)',
                }
            }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Configure Agent Role</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Agent Role</InputLabel>
                        <Select
                            value={role}
                            onChange={(e) => setRole(e.target.value as AgentRole)}
                            sx={{
                                color: '#FFFFFF',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(0, 243, 255, 0.5)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#00F3FF'
                                },
                                '& .MuiSvgIcon-root': {
                                    color: 'rgba(255, 255, 255, 0.7)'
                                }
                            }}
                        >
                            <MenuItem value={AgentRole.WEB_SCRAPING}>Web Scraping</MenuItem>
                            <MenuItem value={AgentRole.WEB_AUTOMATION}>Web Automation</MenuItem>
                            <MenuItem value={AgentRole.TASK_AUTOMATION}>Task Automation</MenuItem>
                            <MenuItem value={AgentRole.DEEP_RESEARCH}>Deep Research</MenuItem>
                            <MenuItem value={AgentRole.CONTENT_CREATION}>Content Creation</MenuItem>
                            <MenuItem value={AgentRole.DATA_ANALYSIS}>Data Analysis</MenuItem>
                            <MenuItem value={AgentRole.EMAIL_AUTOMATION}>Email Automation</MenuItem>
                            <MenuItem value={AgentRole.DOCUMENT_PROCESSING}>Document Processing</MenuItem>
                            <MenuItem value={AgentRole.TESTING_QA}>Testing & QA</MenuItem>
                            <MenuItem value={AgentRole.CUSTOM}>Custom...</MenuItem>
                        </Select>
                    </FormControl>
                    
                    {role === AgentRole.CUSTOM && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#00F3FF' }}>
                                Custom Role Description
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={roleDescription}
                                onChange={(e) => setRoleDescription(e.target.value)}
                                placeholder="Describe the custom role in 50 words or less"
                                inputProps={{ maxLength: 250 }}
                                helperText={`${roleDescription.length}/250 characters (approximately ${Math.ceil(roleDescription.split(/\s+/).length)} words)`}
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
                                    },
                                    '& .MuiFormHelperText-root': {
                                        color: 'rgba(255, 255, 255, 0.7)'
                                    }
                                }}
                            />
                        </Box>
                    )}
                    
                    <Box sx={{ p: 2, bgcolor: 'rgba(0, 243, 255, 0.05)', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#00F3FF' }}>
                            Role Description
                        </Typography>
                        <Typography variant="body2">
                            {roleDescriptions[role]}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ p: 2, mt: 2, bgcolor: 'rgba(0, 243, 255, 0.05)', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#00F3FF' }}>
                            Optimization Details
                        </Typography>
                        <Typography variant="body2">
                            {roleOptimizations[role]}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || (role === AgentRole.CUSTOM && !roleDescription)}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                    sx={{
                        bgcolor: '#00F3FF',
                        color: '#000000',
                        '&:hover': {
                            bgcolor: '#00D4E0'
                        },
                        '&:disabled': {
                            bgcolor: 'rgba(0, 243, 255, 0.3)',
                            color: 'rgba(0, 0, 0, 0.3)'
                        }
                    }}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AgentRoleDialog;
