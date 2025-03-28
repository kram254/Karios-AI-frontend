import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    CircularProgress,
    Alert,
} from '@mui/material';
import { Agent } from '../../types/agent';

interface AgentBehaviorDialogProps {
    open: boolean;
    agent: Agent | null;
    onClose: () => void;
    onSave: (behaviorData: { 
        response_style: number; 
        response_length: number; 
        language: string;
        model: string;
    }) => Promise<void>;
}

const AgentBehaviorDialog: React.FC<AgentBehaviorDialogProps> = ({ open, agent, onClose, onSave }) => {
    const [responseStyle, setResponseStyle] = useState(0.5);
    const [responseLength, setResponseLength] = useState(150);
    const [language, setLanguage] = useState('en');
    const [model, setModel] = useState('gpt-4');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (agent) {
            setResponseStyle(typeof agent.response_style === 'number' ? agent.response_style : 0.5);
            setResponseLength(typeof agent.response_length === 'number' ? agent.response_length : 150);
            setLanguage(agent.language || 'en');
            setModel(agent.model || 'gpt-4');
        }
    }, [agent]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            await onSave({
                response_style: responseStyle,
                response_length: responseLength,
                language,
                model
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update agent behavior');
        } finally {
            setLoading(false);
        }
    };

    const getResponseStyleLabel = (value: number) => {
        if (value < 0.33) return 'Formal';
        if (value < 0.66) return 'Balanced';
        return 'Casual';
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
            <DialogTitle>Agent Behavior Settings</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        AI Model
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Model</InputLabel>
                        <Select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
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
                            <MenuItem value="gpt-4">GPT-4</MenuItem>
                            <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                        </Select>
                    </FormControl>

                    <Typography variant="subtitle2" gutterBottom>
                        Language
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Language</InputLabel>
                        <Select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
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
                            <MenuItem value="en">English</MenuItem>
                            <MenuItem value="es">Spanish (Español)</MenuItem>
                            <MenuItem value="fr">French (Français)</MenuItem>
                            <MenuItem value="de">German (Deutsch)</MenuItem>
                            <MenuItem value="it">Italian (Italiano)</MenuItem>
                            <MenuItem value="pt">Portuguese (Português)</MenuItem>
                            <MenuItem value="ru">Russian (Русский)</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <Typography variant="subtitle2" gutterBottom>
                        Response Style: {getResponseStyleLabel(responseStyle)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>Formal</Typography>
                        <Slider
                            value={responseStyle}
                            onChange={(_, value) => setResponseStyle(value as number)}
                            step={0.01}
                            min={0}
                            max={1}
                            sx={{
                                color: '#00F3FF',
                                '& .MuiSlider-thumb': {
                                    backgroundColor: '#FFFFFF',
                                },
                                '& .MuiSlider-track': {
                                    backgroundColor: '#00F3FF',
                                },
                                '& .MuiSlider-rail': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                }
                            }}
                        />
                        <Typography variant="body2" sx={{ ml: 1 }}>Casual</Typography>
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom>
                        Response Length: {responseLength} words
                    </Typography>
                    <TextField
                        type="number"
                        fullWidth
                        value={responseLength}
                        onChange={(e) => {
                            const value = Number(e.target.value);
                            setResponseLength(Math.max(50, Math.min(500, value)));
                        }}
                        inputProps={{ min: 50, max: 500 }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(0, 243, 255, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#00F3FF',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.7)',
                            },
                            '& .MuiInputBase-input': {
                                color: '#FFFFFF',
                            },
                        }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        Range: 50-500 words
                    </Typography>
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

export default AgentBehaviorDialog;
