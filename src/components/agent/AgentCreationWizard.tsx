import React, { useState } from 'react';
import {
    Stepper,
    Step,
    StepLabel,
    Button,
    Paper,
    Typography,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
} from '@mui/material';
import { AgentConfig } from '../../types/agent';
import { KnowledgeSelector } from '../knowledge/KnowledgeSelector';

const steps = ['Basic Information', 'Configuration', 'Knowledge Base', 'Review'];

interface AgentCreationWizardProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
}

export const AgentCreationWizard: React.FC<AgentCreationWizardProps> = ({
    onSubmit,
    onCancel
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        config: {
            model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 2000,
            language: 'en',
            response_style: 'professional',
            knowledge_base_ids: [] as number[]
        }
    });

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleSubmit = async () => {
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Error creating agent:', error);
        }
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ p: 3 }}>
                        <TextField
                            fullWidth
                            label="Agent Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ p: 3 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Model</InputLabel>
                            <Select
                                value={formData.config.model}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    config: { ...formData.config, model: e.target.value }
                                })}
                            >
                                <MenuItem value="gpt-4">GPT-4</MenuItem>
                                <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <Typography gutterBottom>Temperature: {formData.config.temperature}</Typography>
                        <Slider
                            value={formData.config.temperature}
                            onChange={(_, value) => setFormData({
                                ...formData,
                                config: { ...formData.config, temperature: value as number }
                            })}
                            min={0}
                            max={1}
                            step={0.1}
                            sx={{ mb: 2 }}
                        />
                        
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Language</InputLabel>
                            <Select
                                value={formData.config.language}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    config: { ...formData.config, language: e.target.value }
                                })}
                            >
                                <MenuItem value="en">English</MenuItem>
                                <MenuItem value="es">Spanish</MenuItem>
                                <MenuItem value="fr">French</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <FormControl fullWidth>
                            <InputLabel>Response Style</InputLabel>
                            <Select
                                value={formData.config.response_style}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    config: { ...formData.config, response_style: e.target.value }
                                })}
                            >
                                <MenuItem value="professional">Professional</MenuItem>
                                <MenuItem value="casual">Casual</MenuItem>
                                <MenuItem value="friendly">Friendly</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ p: 3 }}>
                        <KnowledgeSelector
                            selectedIds={formData.config.knowledge_base_ids}
                            onSelectionChange={(ids) => setFormData({
                                ...formData,
                                config: { ...formData.config, knowledge_base_ids: ids }
                            })}
                        />
                    </Box>
                );
            case 3:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Review Configuration</Typography>
                        <pre style={{ 
                            backgroundColor: '#2A2A2A',
                            padding: '1rem',
                            borderRadius: '4px',
                            overflow: 'auto'
                        }}>
                            {JSON.stringify(formData, null, 2)}
                        </pre>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Paper 
            sx={{ 
                bgcolor: '#1A1A1A',
                color: '#FFFFFF',
                border: '1px solid rgba(0, 243, 255, 0.2)'
            }}
        >
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Create New Agent</Typography>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                
                {renderStepContent(activeStep)}
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button onClick={onCancel} sx={{ mr: 1 }}>
                        Cancel
                    </Button>
                    {activeStep > 0 && (
                        <Button onClick={handleBack} sx={{ mr: 1 }}>
                            Back
                        </Button>
                    )}
                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            sx={{
                                bgcolor: '#00F3FF',
                                color: '#000000',
                                '&:hover': {
                                    bgcolor: '#00D4E0'
                                }
                            }}
                        >
                            Create Agent
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            sx={{
                                bgcolor: '#00F3FF',
                                color: '#000000',
                                '&:hover': {
                                    bgcolor: '#00D4E0'
                                }
                            }}
                        >
                            Next
                        </Button>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};
