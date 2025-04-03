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

// Flags for languages
const languageFlags: Record<string, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇵🇹',
    ru: '🇷🇺',
};

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
            setResponseStyle(typeof agent.config?.response_style === 'number' ? agent.config.response_style : 0.5);
            setResponseLength(typeof agent.config?.response_length === 'number' ? agent.config.response_length : 150);
            setLanguage(agent.config?.language || 'en');
            setModel(agent.config?.model || 'gpt-4');
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

    // Render language with flag
    const renderLanguageWithFlag = (lang: string, name: string) => {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1, fontSize: '1.2rem' }}>{languageFlags[lang]}</Typography>
                <span>{name}</span>
            </Box>
        );
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
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography sx={{ mr: 1, fontSize: '1.2rem' }}>{languageFlags[selected as string]}</Typography>
                                    <span>{selected === 'en' ? 'English' :
                                           selected === 'es' ? 'Spanish (Español)' :
                                           selected === 'fr' ? 'French (Français)' :
                                           selected === 'de' ? 'German (Deutsch)' :
                                           selected === 'it' ? 'Italian (Italiano)' :
                                           selected === 'pt' ? 'Portuguese (Português)' :
                                           selected === 'ru' ? 'Russian (Русский)' : selected}</span>
                                </Box>
                            )}
                        >
                            <MenuItem value="en">{renderLanguageWithFlag('en', 'English')}</MenuItem>
                            <MenuItem value="es">{renderLanguageWithFlag('es', 'Spanish (Español)')}</MenuItem>
                            <MenuItem value="fr">{renderLanguageWithFlag('fr', 'French (Français)')}</MenuItem>
                            <MenuItem value="de">{renderLanguageWithFlag('de', 'German (Deutsch)')}</MenuItem>
                            <MenuItem value="it">{renderLanguageWithFlag('it', 'Italian (Italiano)')}</MenuItem>
                            <MenuItem value="pt">{renderLanguageWithFlag('pt', 'Portuguese (Português)')}</MenuItem>
                            <MenuItem value="ru">{renderLanguageWithFlag('ru', 'Russian (Русский)')}</MenuItem>
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
                        fullWidth
                        type="number"
                        value={responseLength}
                        onChange={(e) => setResponseLength(parseInt(e.target.value))}
                        InputProps={{
                            inputProps: { min: 50, max: 500 }
                        }}
                        sx={{
                            mb: 2,
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
                            }
                        }}
                    />
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
