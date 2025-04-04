import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Button,
    Alert,
    Divider
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { Agent, AgentConfig, AgentMode } from '../../types/agent';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface AgentSettingsFormProps {
    agent: Agent;
    onSave: (config: AgentConfig) => Promise<void>;
}

export const AgentSettingsForm: React.FC<AgentSettingsFormProps> = ({
    agent,
    onSave
}) => {
    // Create a default config if none exists
    const defaultConfig: AgentConfig = {
        mode: AgentMode.TEXT,
        model: 'gpt-4',
        temperature: 0.7,
        response_style: 0.5,
        response_length: 150,
        language: 'en',
        actions: []
    };
    
    const [config, setConfig] = useState<AgentConfig>(agent.config || defaultConfig);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setConfig(agent.config || defaultConfig);
        setIsDirty(false);
    }, [agent]);

    const handleChange = (field: keyof AgentConfig, value: any) => {
        setConfig(prev => ({
            ...prev,
            [field]: value
        }));
        setIsDirty(true);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            await onSave(config);
            setIsDirty(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Saving settings..." />;
    }

    return (
        <Paper 
            sx={{ 
                bgcolor: '#1A1A1A',
                color: '#FFFFFF',
                border: '1px solid rgba(0, 243, 255, 0.2)',
                p: 3
            }}
        >
            <Typography variant="h6" gutterBottom>
                Agent Settings
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Model Configuration
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Model</InputLabel>
                    <Select
                        value={config.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                    >
                        <MenuItem value="gpt-4">GPT-4</MenuItem>
                    </Select>
                </FormControl>
                
                <Typography gutterBottom>
                    Temperature: {config.temperature}
                </Typography>
                <Slider
                    value={config.temperature}
                    onChange={(_, value) => handleChange('temperature', value)}
                    min={0}
                    max={1}
                    step={0.1}
                    sx={{ mb: 2 }}
                />
                
                <TextField
                    fullWidth
                    type="number"
                    label="Max Tokens"
                    value={config.max_tokens}
                    onChange={(e) => handleChange('max_tokens', parseInt(e.target.value))}
                    sx={{ mb: 2 }}
                />
            </Box>
            
            <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Response Configuration
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Language</InputLabel>
                    <Select
                        value={config.language}
                        onChange={(e) => handleChange('language', e.target.value)}
                    >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                    </Select>
                </FormControl>
                
                <FormControl fullWidth>
                    <InputLabel>Response Style</InputLabel>
                    <Select
                        value={config.response_style}
                        onChange={(e) => handleChange('response_style', e.target.value)}
                    >
                        <MenuItem value="professional">Professional</MenuItem>
                        <MenuItem value="casual">Casual</MenuItem>
                        <MenuItem value="friendly">Friendly</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={!isDirty}
                    onClick={handleSubmit}
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
                    Save Changes
                </Button>
            </Box>
        </Paper>
    );
};
