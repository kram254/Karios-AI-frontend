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
    Alert
} from '@mui/material';
import { Agent, AgentRole } from '../../types/agent';

interface AgentRoleDialogProps {
    open: boolean;
    agent: Agent | null;
    onClose: () => void;
    onSave: (roleData: { ai_role: AgentRole }) => Promise<void>;
}

const roleDescriptions: Record<AgentRole, string> = {
    [AgentRole.CUSTOMER_SUPPORT]: 'Provides customer service and helps solve user issues.',
    [AgentRole.TECHNICAL_SUPPORT]: 'Assists with technical troubleshooting and guidance.',
    [AgentRole.SALES_SERVICES]: 'Assists with product recommendations and sales inquiries.',
    [AgentRole.CONSULTING]: 'Provides expert advice and consulting services.'
};

const AgentRoleDialog: React.FC<AgentRoleDialogProps> = ({ open, agent, onClose, onSave }) => {
    const [role, setRole] = useState<AgentRole>(AgentRole.CUSTOMER_SUPPORT);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (agent && agent.ai_role) {
            setRole(agent.ai_role);
        }
    }, [agent]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            await onSave({ ai_role: role });
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
                            <MenuItem value={AgentRole.CONSULTING}>Consulting</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <Box sx={{ p: 2, bgcolor: 'rgba(0, 243, 255, 0.05)', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#00F3FF' }}>
                            Role Description
                        </Typography>
                        <Typography variant="body2">
                            {roleDescriptions[role]}
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
                    disabled={loading}
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
