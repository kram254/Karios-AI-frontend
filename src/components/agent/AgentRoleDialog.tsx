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
    [AgentRole.CUSTOMER_SUPPORT]: 'Provides customer service and helps solve user issues with a focus on satisfaction and resolution.',
    [AgentRole.TECHNICAL_SUPPORT]: 'Assists with technical troubleshooting and guidance on complex technical matters.',
    [AgentRole.SALES_SERVICES]: 'Assists with product recommendations and sales inquiries, focusing on conversion and value presentation.',
    [AgentRole.CONSULTING]: 'Provides expert advice and consulting services with deep domain expertise.',
    [AgentRole.SALES_ASSISTANT]: 'Specializes in sales assistance, product demonstrations, and closing deals effectively.',
    [AgentRole.CUSTOM]: 'Custom agent role with specialized functionality based on your description.'
};

const roleOptimizations: Record<AgentRole, string> = {
    [AgentRole.CUSTOMER_SUPPORT]: 'Optimized for high empathy, quick problem resolution, and customer satisfaction. Uses knowledge base to provide accurate support information.',
    [AgentRole.TECHNICAL_SUPPORT]: 'Optimized for technical accuracy, structured troubleshooting, and clear explanations of complex topics.',
    [AgentRole.SALES_SERVICES]: 'Optimized for identifying customer needs, demonstrating product value, and gentle persuasion techniques.',
    [AgentRole.CONSULTING]: 'Optimized for strategic thinking, in-depth analysis, and providing expert recommendations.',
    [AgentRole.SALES_ASSISTANT]: 'Optimized for product knowledge, objection handling, and closing techniques with a focus on driving conversions.',
    [AgentRole.CUSTOM]: 'Will be optimized based on your custom role description.'
};

const AgentRoleDialog: React.FC<AgentRoleDialogProps> = ({ open, agent, onClose, onSave }) => {
    const [role, setRole] = useState<AgentRole>(AgentRole.CUSTOMER_SUPPORT);
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
                            <MenuItem value={AgentRole.CUSTOMER_SUPPORT}>Customer Support</MenuItem>
                            <MenuItem value={AgentRole.TECHNICAL_SUPPORT}>Technical Support</MenuItem>
                            <MenuItem value={AgentRole.SALES_SERVICES}>Sales Services</MenuItem>
                            <MenuItem value={AgentRole.SALES_ASSISTANT}>Sales Assistant</MenuItem>
                            <MenuItem value={AgentRole.CONSULTING}>Consulting</MenuItem>
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
