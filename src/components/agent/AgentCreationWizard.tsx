import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Button, 
    TextField, 
    Typography, 
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Checkbox,
    Modal,
    Paper,
    InputAdornment,
    IconButton,
    Tooltip,
    FormHelperText
} from '@mui/material';
import Language from '@mui/icons-material/Language';
import { Agent, AgentRole, AgentMode } from '../../types/agent';
import { KnowledgeSelector } from '../knowledge/KnowledgeSelector';
import './AgentCreationWizard.css';
import './dropdownFix.css';

// Define the props interface
interface AgentCreationWizardProps {
    open: boolean;
    onClose: () => void;
    onDataChange: (data: Partial<Agent>) => void;
    onKnowledgeSelect: (ids: number[]) => void;
    onSubmit: (agentData: Partial<Agent>) => void;
    initialData?: Partial<Agent>;
}

// Define the steps in the wizard
const STEPS = [
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Role & Behavior' },
    { id: 3, label: 'Knowledge Base' },
    { id: 4, label: 'Actions' },
    { id: 5, label: 'Review' }
];

export const AgentCreationWizard: React.FC<AgentCreationWizardProps> = ({ 
    open, 
    onClose, 
    onDataChange, 
    onKnowledgeSelect,
    onSubmit,
    initialData
}) => {
    console.log("AgentCreationWizard rendered with open:", open);
    
    // State for the current step
    const [currentStep, setCurrentStep] = useState<number>(1);
    
    // State for form data
    const [formData, setFormData] = useState<Partial<Agent>>(initialData || {
        name: '',
        description: '',
        ai_role: AgentRole.CUSTOMER_SUPPORT,
        language: 'en',
        mode: AgentMode.TEXT,
        response_style: 0.5,
        response_length: 150,
        actions: []
    });
    
    // State for selected knowledge IDs
    const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<number[]>([]);
    
    // State for select dropdowns
    const [roleSelectOpen, setRoleSelectOpen] = useState(false);
    const [modeSelectOpen, setModeSelectOpen] = useState(false);
    const [languageSelectOpen, setLanguageSelectOpen] = useState(false);
    
    // Function to handle input changes
    const handleInputChange = (field: keyof Agent, value: any) => {
        const updatedData = { ...formData, [field]: value };
        setFormData(updatedData);
        onDataChange(updatedData);
    };
    
    // Function to handle submit
    const handleSubmit = () => {
        onSubmit(formData);
    };
    
    // Function to go to the next step
    const nextStep = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        }
    };
    
    // Function to go to the previous step
    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    // Add console logs for debugging
    useEffect(() => {
        console.log("AgentCreationWizard - currentStep:", currentStep);
        console.log("AgentCreationWizard - formData:", formData);
        console.log("AgentCreationWizard - selectedKnowledgeIds:", selectedKnowledgeIds);
    }, [currentStep, formData, selectedKnowledgeIds]);

    // Monitor component lifecycle
    useEffect(() => {
        console.log('AgentCreationWizard mounted');
        console.log('AgentCreationWizard open state:', open);
        console.log('Current step:', currentStep);
        console.log('Current form data:', formData);
        
        const handleBeforeUnload = () => {
            console.log('Page is being unloaded');
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            console.log('AgentCreationWizard unmounted');
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [open, currentStep, formData]);
    
    // Function to validate the current step
    const validateStep = (): boolean => {
        switch (currentStep) {
            case 1:
                return !!formData.name && formData.name.length > 0;
            case 2:
                return !!formData.ai_role && !!formData.mode;
            case 3:
                return true; // Knowledge selection is optional
            case 4:
                return true; // Actions step is always valid
            case 5:
                return true; // Review step is always valid
            default:
                return false;
        }
    };
    
    // Render using Material-UI Modal
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="agent-creation-wizard"
            aria-describedby="create-a-new-agent"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                '& .MuiBackdrop-root': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)'
                }
            }}
            disableAutoFocus
            disableEnforceFocus
            disableEscapeKeyDown={false}
            disablePortal={false}
            keepMounted
        >
            <Paper 
                sx={{
                    width: '90%',
                    maxWidth: 800,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    p: 0,
                    backgroundColor: '#1A1A1A',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    zIndex: 10001
                }}
            >
                {/* Header */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 3,
                    pb: 2,
                    borderBottom: '1px solid #333'
                }}>
                    <Typography variant="h5" component="h2" sx={{ color: '#fff' }}>
                        Create New Agent
                    </Typography>
                    <Button 
                        onClick={onClose}
                        sx={{ color: '#fff' }}
                    >
                        ×
                    </Button>
                </Box>

                {/* Steps */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    mb: 3,
                    mt: 1
                }}>
                    {STEPS.map((step) => (
                        <Box
                            key={step.id}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                flexGrow: 1,
                                maxWidth: 160,
                                position: 'relative'
                            }}
                        >
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: currentStep === step.id ? '#00F3FF' : '#333',
                                    color: currentStep === step.id ? '#000' : '#fff',
                                    mb: 1,
                                    zIndex: 1
                                }}
                            >
                                {step.id}
                            </Box>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: currentStep === step.id ? '#FFFFFF' : '#AAAAAA',
                                    textAlign: 'center'
                                }}
                            >
                                {step.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Content */}
                <Box sx={{ 
                    bgcolor: '#1a1a1a',
                    p: 2,
                    borderRadius: 1,
                    mb: 3
                }}>
                    {currentStep === 1 && (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                                Basic Information
                            </Typography>
                            
                            <TextField
                                label="Agent Name"
                                value={formData.name || ''}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                fullWidth
                                margin="normal"
                                required
                                variant="outlined"
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#333',
                                        color: '#FFFFFF',
                                        '& fieldset': {
                                            borderColor: '#555',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#00F3FF',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#00F3FF',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#AAAAAA',
                                    },
                                }}
                            />
                            
                            <TextField
                                label="Description"
                                value={formData.description || ''}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                multiline
                                rows={4}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#FFFFFF',
                                        bgcolor: '#333',
                                        '& fieldset': {
                                            borderColor: '#555',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#00F3FF',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#00F3FF',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#AAAAAA',
                                    },
                                }}
                            />
                        </Box>
                    )}
                    
                    {currentStep === 2 && (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                                Role & Behavior
                            </Typography>
                            
                            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                                <InputLabel id="agent-role-label" sx={{ 
                                    color: '#AAAAAA', 
                                    bgcolor: '#1a1a1a', 
                                    px: 1, 
                                    ml: -0.5,
                                    zIndex: 1 
                                }}>Agent Role</InputLabel>
                                <Select
                                    labelId="agent-role-label"
                                    value={formData.ai_role || ''}
                                    onChange={(e) => handleInputChange('ai_role', e.target.value)}
                                    open={roleSelectOpen}
                                    onOpen={() => setRoleSelectOpen(true)}
                                    onClose={() => setRoleSelectOpen(false)}
                                    MenuProps={{
                                        disablePortal: false,
                                        container: document.body,
                                        PaperProps: {
                                            sx: {
                                                bgcolor: '#333',
                                                color: '#FFFFFF',
                                                '& .MuiMenuItem-root:hover': {
                                                    bgcolor: 'rgba(0, 243, 255, 0.08)',
                                                },
                                                '& .MuiMenuItem-root.Mui-selected': {
                                                    bgcolor: 'rgba(0, 243, 255, 0.15)',
                                                },
                                                maxHeight: 300,
                                                overflow: 'auto',
                                                mt: 1
                                            }
                                        },
                                        slotProps: {
                                            paper: {
                                                elevation: 8,
                                                sx: { zIndex: 9999 }
                                            }
                                        },
                                        anchorOrigin: {
                                            vertical: 'bottom',
                                            horizontal: 'left',
                                        },
                                        transformOrigin: {
                                            vertical: 'top',
                                            horizontal: 'left',
                                        }
                                    }}
                                    sx={{
                                        bgcolor: '#333',
                                        color: '#FFFFFF',
                                        '.MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#555',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#00F3FF',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#00F3FF',
                                        },
                                        '.MuiSvgIcon-root': {
                                            color: '#FFFFFF',
                                        },
                                    }}
                                >
                                    <MenuItem value={AgentRole.CUSTOMER_SUPPORT}>Customer Support</MenuItem>
                                    <MenuItem value={AgentRole.SALES_ASSISTANT}>Sales Assistant</MenuItem>
                                    <MenuItem value={AgentRole.TECHNICAL_SUPPORT}>Technical Support</MenuItem>
                                    <MenuItem value={AgentRole.CONSULTING}>Consulting Services</MenuItem>
                                    <MenuItem value={AgentRole.SALES_SERVICES}>Sales Services</MenuItem>
                                    <MenuItem value={AgentRole.CUSTOM}>Custom...</MenuItem>
                                </Select>
                                {formData.ai_role === AgentRole.CUSTOM && (
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Custom Role"
                                        placeholder="Enter custom role..."
                                        value={formData.custom_role || ''}
                                        onChange={(e) => handleInputChange('custom_role', e.target.value)}
                                        sx={{
                                            mt: 1,
                                            '.MuiOutlinedInput-root': {
                                                color: '#FFFFFF',
                                                bgcolor: '#333',
                                                '.MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#555',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#00F3FF',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#00F3FF',
                                                },
                                            },
                                            '.MuiInputLabel-root': {
                                                color: '#AAAAAA',
                                            },
                                        }}
                                    />
                                )}
                            </FormControl>
                            
                            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                                <InputLabel id="agent-mode-label" sx={{ 
                                    color: '#AAAAAA', 
                                    bgcolor: '#1a1a1a', 
                                    px: 1, 
                                    ml: -0.5,
                                    zIndex: 1 
                                }}>Interaction Mode</InputLabel>
                                <Select
                                    labelId="agent-mode-label"
                                    value={formData.mode || ''}
                                    onChange={(e) => handleInputChange('mode', e.target.value)}
                                    open={modeSelectOpen}
                                    onOpen={() => setModeSelectOpen(true)}
                                    onClose={() => setModeSelectOpen(false)}
                                    MenuProps={{
                                        disablePortal: false,
                                        container: document.body,
                                        PaperProps: {
                                            sx: {
                                                bgcolor: '#333',
                                                color: '#FFFFFF',
                                                '& .MuiMenuItem-root:hover': {
                                                    bgcolor: 'rgba(0, 243, 255, 0.08)',
                                                },
                                                '& .MuiMenuItem-root.Mui-selected': {
                                                    bgcolor: 'rgba(0, 243, 255, 0.15)',
                                                },
                                                maxHeight: 300,
                                                overflow: 'auto',
                                                mt: 1
                                            }
                                        },
                                        slotProps: {
                                            paper: {
                                                elevation: 8,
                                                sx: { zIndex: 9999 }
                                            }
                                        },
                                        anchorOrigin: {
                                            vertical: 'bottom',
                                            horizontal: 'left',
                                        },
                                        transformOrigin: {
                                            vertical: 'top',
                                            horizontal: 'left',
                                        }
                                    }}
                                    sx={{
                                        bgcolor: '#333',
                                        color: '#FFFFFF',
                                        '.MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#555',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#00F3FF',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#00F3FF',
                                        },
                                        '.MuiSvgIcon-root': {
                                            color: '#FFFFFF',
                                        },
                                    }}
                                >
                                    <MenuItem value={AgentMode.TEXT}>Text Only</MenuItem>
                                    <MenuItem value={AgentMode.AUDIO}>Audio Enabled</MenuItem>
                                    <MenuItem value={AgentMode.VIDEO}>Video Enabled</MenuItem>
                                </Select>
                            </FormControl>
                            
                            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                                <InputLabel id="agent-language-label" sx={{ 
                                    color: '#AAAAAA', 
                                    bgcolor: '#1a1a1a', 
                                    px: 1, 
                                    ml: -0.5,
                                    zIndex: 1 
                                }}>Language</InputLabel>
                                <Select
                                    labelId="agent-language-label"
                                    value={formData.language || 'en'}
                                    onChange={(e) => handleInputChange('language', e.target.value)}
                                    open={languageSelectOpen}
                                    onOpen={() => setLanguageSelectOpen(true)}
                                    onClose={() => setLanguageSelectOpen(false)}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <Tooltip title="Select the language the agent will use to interact with users">
                                                <IconButton edge="start" size="small">
                                                    <Language sx={{ color: '#00F3FF', fontSize: '1.2rem' }} />
                                                </IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                    }
                                    MenuProps={{
                                        disablePortal: false,
                                        container: document.body,
                                        PaperProps: {
                                            sx: {
                                                bgcolor: '#333',
                                                color: '#FFFFFF',
                                                '& .MuiMenuItem-root:hover': {
                                                    bgcolor: 'rgba(0, 243, 255, 0.08)',
                                                },
                                                '& .MuiMenuItem-root.Mui-selected': {
                                                    bgcolor: 'rgba(0, 243, 255, 0.15)',
                                                },
                                                maxHeight: 300,
                                                overflow: 'auto',
                                                mt: 1
                                            }
                                        },
                                        slotProps: {
                                            paper: {
                                                elevation: 8,
                                                sx: { zIndex: 9999 }
                                            }
                                        },
                                        anchorOrigin: {
                                            vertical: 'bottom',
                                            horizontal: 'left',
                                        },
                                        transformOrigin: {
                                            vertical: 'top',
                                            horizontal: 'left',
                                        }
                                    }}
                                    sx={{
                                        bgcolor: '#333',
                                        color: '#FFFFFF',
                                        '.MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#555',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#00F3FF',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#00F3FF',
                                        },
                                        '.MuiSvgIcon-root': {
                                            color: '#FFFFFF',
                                        },
                                    }}
                                >
                                    <MenuItem value="en">
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <img src="/flags/en.png" alt="English" width={20} height={15} style={{ marginRight: 8 }} />
                                            English
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="es">
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <img src="/flags/es.png" alt="Spanish" width={20} height={15} style={{ marginRight: 8 }} />
                                            Spanish (Español)
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="fr">
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <img src="/flags/fr.png" alt="French" width={20} height={15} style={{ marginRight: 8 }} />
                                            French (Français)
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="de">
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <img src="/flags/de.png" alt="German" width={20} height={15} style={{ marginRight: 8 }} />
                                            German (Deutsch)
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="it">
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <img src="/flags/it.png" alt="Italian" width={20} height={15} style={{ marginRight: 8 }} />
                                            Italian (Italiano)
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="pt">
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <img src="/flags/pt.png" alt="Portuguese" width={20} height={15} style={{ marginRight: 8 }} />
                                            Portuguese (Português)
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="ru">
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <img src="/flags/ru.png" alt="Russian" width={20} height={15} style={{ marginRight: 8 }} />
                                            Russian (Русский)
                                        </Box>
                                    </MenuItem>
                                </Select>
                                <FormHelperText sx={{ color: '#AAAAAA' }}>
                                    The agent will respond in this language
                                </FormHelperText>
                            </FormControl>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography id="response-style-label" gutterBottom sx={{ color: '#CCCCCC' }}>
                                    Response Style: {formData.response_style === undefined ? '50% Casual' : 
                                                    formData.response_style === 0 ? 'Formal' : 
                                                    formData.response_style === 1 ? 'Casual' : 
                                                    `${formData.response_style * 100}% Casual`}
                                </Typography>
                                <Slider
                                    aria-labelledby="response-style-label"
                                    value={formData.response_style !== undefined ? formData.response_style : 0.5}
                                    onChange={(_, value) => handleInputChange('response_style', value as number)}
                                    step={0.1}
                                    marks
                                    min={0}
                                    max={1}
                                    sx={{
                                        color: '#00F3FF',
                                        '& .MuiSlider-thumb': {
                                            bgcolor: '#00F3FF',
                                        },
                                        '& .MuiSlider-rail': {
                                            bgcolor: '#555',
                                        },
                                    }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" sx={{ color: '#AAAAAA' }}>Formal</Typography>
                                    <Typography variant="caption" sx={{ color: '#AAAAAA' }}>Casual</Typography>
                                </Box>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography id="response-length-label" gutterBottom sx={{ color: '#CCCCCC' }}>
                                    Response Length: {formData.response_length !== undefined ? formData.response_length : 150} words
                                </Typography>
                                <Slider
                                    aria-labelledby="response-length-label"
                                    value={formData.response_length !== undefined ? formData.response_length : 150}
                                    onChange={(_, value) => handleInputChange('response_length', value as number)}
                                    step={50}
                                    marks
                                    min={50}
                                    max={500}
                                    valueLabelDisplay="auto"
                                    sx={{
                                        color: '#00F3FF',
                                        '& .MuiSlider-thumb': {
                                            backgroundColor: '#FFFFFF',
                                        },
                                        '& .MuiSlider-rail': {
                                            backgroundColor: '#555555',
                                        },
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                    
                    {currentStep === 3 && (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                                Knowledge Base
                            </Typography>
                            
                            <Typography variant="body2" paragraph sx={{ color: '#AAAAAA' }}>
                                Select the knowledge categories that this agent should have access to when responding to customers.
                            </Typography>
                            
                            <Box sx={{ mt: 2 }}>
                                <KnowledgeSelector
                                    selectedIds={selectedKnowledgeIds}
                                    onSelectionChange={(ids: number[]) => {
                                        setSelectedKnowledgeIds(ids);
                                        onKnowledgeSelect(ids);
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                    
                    {currentStep === 4 && (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                                Agent Actions
                            </Typography>
                            
                            <Typography variant="body2" paragraph sx={{ color: '#AAAAAA' }}>
                                Select what actions this agent can perform:
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box 
                                    sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        p: 1.25,
                                        bgcolor: '#333',
                                        borderRadius: 1
                                    }}
                                >
                                    <Checkbox
                                        checked={formData.actions?.includes('email') || false}
                                        onChange={(e) => {
                                            const currentActions = formData.actions || [];
                                            let newActions;
                                            if (e.target.checked) {
                                                newActions = [...currentActions, 'email'];
                                            } else {
                                                newActions = currentActions.filter(a => a !== 'email');
                                            }
                                            handleInputChange('actions', newActions);
                                        }}
                                        sx={{
                                            color: '#AAAAAA',
                                            '&.Mui-checked': {
                                                color: '#00F3FF',
                                            },
                                        }}
                                    />
                                    <Box sx={{ ml: 1 }}>
                                        <Typography sx={{ fontWeight: 'bold', color: '#fff' }}>
                                            Send Email
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box 
                                    sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        p: 1.25,
                                        bgcolor: '#333',
                                        borderRadius: 1
                                    }}
                                >
                                    <Checkbox
                                        checked={formData.actions?.includes('send_file') || false}
                                        onChange={(e) => {
                                            const currentActions = formData.actions || [];
                                            let newActions;
                                            if (e.target.checked) {
                                                newActions = [...currentActions, 'send_file'];
                                            } else {
                                                newActions = currentActions.filter(a => a !== 'send_file');
                                            }
                                            handleInputChange('actions', newActions);
                                        }}
                                        sx={{
                                            color: '#AAAAAA',
                                            '&.Mui-checked': {
                                                color: '#00F3FF',
                                            },
                                        }}
                                    />
                                    <Box sx={{ ml: 1 }}>
                                        <Typography sx={{ fontWeight: 'bold', color: '#fff' }}>
                                            Send File
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box 
                                    sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        p: 1.25,
                                        bgcolor: '#333',
                                        borderRadius: 1
                                    }}
                                >
                                    <Checkbox
                                        checked={formData.actions?.includes('send_link') || false}
                                        onChange={(e) => {
                                            const currentActions = formData.actions || [];
                                            let newActions;
                                            if (e.target.checked) {
                                                newActions = [...currentActions, 'send_link'];
                                            } else {
                                                newActions = currentActions.filter(a => a !== 'send_link');
                                            }
                                            handleInputChange('actions', newActions);
                                        }}
                                        sx={{
                                            color: '#AAAAAA',
                                            '&.Mui-checked': {
                                                color: '#00F3FF',
                                            },
                                        }}
                                    />
                                    <Box sx={{ ml: 1 }}>
                                        <Typography sx={{ fontWeight: 'bold', color: '#fff' }}>
                                            Send Link
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box 
                                    sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        p: 1.25,
                                        bgcolor: '#333',
                                        borderRadius: 1
                                    }}
                                >
                                    <Checkbox
                                        checked={formData.actions?.includes('custom_action') || false}
                                        onChange={(e) => {
                                            const currentActions = formData.actions || [];
                                            let newActions;
                                            if (e.target.checked) {
                                                newActions = [...currentActions, 'custom_action'];
                                            } else {
                                                newActions = currentActions.filter(a => a !== 'custom_action');
                                            }
                                            handleInputChange('actions', newActions);
                                        }}
                                        sx={{
                                            color: '#AAAAAA',
                                            '&.Mui-checked': {
                                                color: '#00F3FF',
                                            },
                                        }}
                                    />
                                    <Box sx={{ ml: 1 }}>
                                        <Typography sx={{ fontWeight: 'bold', color: '#fff' }}>
                                            Custom Action
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                    
                    {currentStep === 5 && (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                                Review Agent Configuration
                            </Typography>
                            
                            <Box sx={{ 
                                bgcolor: '#1a1a1a', 
                                p: 2, 
                                borderRadius: 1, 
                                mb: 2
                            }}>
                                <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                        color: '#00F3FF', 
                                        pb: 1, 
                                        borderBottom: '1px solid #333', 
                                        mb: 1.5 
                                    }}
                                >
                                    Basic Information
                                </Typography>
                                <Box sx={{ mb: 1, color: '#fff' }}>
                                    <Typography component="span" sx={{ color: '#AAAAAA', mr: 1 }}>
                                        Name:
                                    </Typography>
                                    {formData.name}
                                </Box>
                                <Box sx={{ mb: 1, color: '#fff' }}>
                                    <Typography component="span" sx={{ color: '#AAAAAA', mr: 1 }}>
                                        Description:
                                    </Typography>
                                    {formData.description || 'N/A'}
                                </Box>
                            </Box>
                            
                            <Box sx={{ 
                                bgcolor: '#1a1a1a', 
                                p: 2, 
                                borderRadius: 1, 
                                mb: 2
                            }}>
                                <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                        color: '#00F3FF', 
                                        pb: 1, 
                                        borderBottom: '1px solid #333', 
                                        mb: 1.5 
                                    }}
                                >
                                    Role & Behavior
                                </Typography>
                                <Box sx={{ mb: 1, color: '#fff' }}>
                                    <Typography component="span" sx={{ color: '#AAAAAA', mr: 1 }}>
                                        Role:
                                    </Typography>
                                    {formData.ai_role}
                                </Box>
                                <Box sx={{ mb: 1, color: '#fff' }}>
                                    <Typography component="span" sx={{ color: '#AAAAAA', mr: 1 }}>
                                        Mode:
                                    </Typography>
                                    {formData.mode}
                                </Box>
                                <Box sx={{ mb: 1, color: '#fff' }}>
                                    <Typography component="span" sx={{ color: '#AAAAAA', mr: 1 }}>
                                        Language:
                                    </Typography>
                                    {formData.language}
                                </Box>
                                <Box sx={{ mb: 1, color: '#fff' }}>
                                    <Typography component="span" sx={{ color: '#AAAAAA', mr: 1 }}>
                                        Response Style:
                                    </Typography>
                                    {formData.response_style === undefined ? '50% Casual' : 
                                    formData.response_style === 0 ? 'Formal' : 
                                    formData.response_style === 1 ? 'Casual' : 
                                    `${formData.response_style * 100}% Casual`}
                                </Box>
                                <Box sx={{ mb: 1, color: '#fff' }}>
                                    <Typography component="span" sx={{ color: '#AAAAAA', mr: 1 }}>
                                        Response Length:
                                    </Typography>
                                    {formData.response_length !== undefined ? formData.response_length : 150} words
                                </Box>
                            </Box>
                            
                            <Box sx={{ 
                                bgcolor: '#1a1a1a', 
                                p: 2, 
                                borderRadius: 1, 
                                mb: 2
                            }}>
                                <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                        color: '#00F3FF', 
                                        pb: 1, 
                                        borderBottom: '1px solid #333', 
                                        mb: 1.5 
                                    }}
                                >
                                    Knowledge Base
                                </Typography>
                                {selectedKnowledgeIds.length === 0 ? (
                                    <Box sx={{ color: '#fff' }}>
                                        No knowledge items selected. Agent will use only its general knowledge.
                                    </Box>
                                ) : (
                                    <Box sx={{ color: '#fff' }}>
                                        <Typography component="span" sx={{ color: '#AAAAAA', mr: 1 }}>
                                            Selected Knowledge Items:
                                        </Typography>
                                        {selectedKnowledgeIds.length}
                                    </Box>
                                )}
                            </Box>
                            
                            <Box sx={{ 
                                bgcolor: '#1a1a1a', 
                                p: 2, 
                                borderRadius: 1, 
                                mb: 2
                            }}>
                                <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                        color: '#00F3FF', 
                                        pb: 1, 
                                        borderBottom: '1px solid #333', 
                                        mb: 1.5 
                                    }}
                                >
                                    Actions
                                </Typography>
                                <Box sx={{ mb: 1, color: '#fff' }}>
                                    <Typography component="span" sx={{ color: '#AAAAAA', mr: 1 }}>
                                        Enabled Actions:
                                    </Typography>
                                    {!formData.actions || formData.actions.length === 0 
                                        ? 'Text Output' 
                                        : ['Text Output'].concat(formData.actions || []).join(', ')}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Actions */}
                <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <Button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        variant="text"
                        sx={{
                            color: '#FFFFFF',
                            textTransform: 'uppercase',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&.Mui-disabled': {
                                color: 'rgba(255, 255, 255, 0.3)',
                            },
                        }}
                    >
                        BACK
                    </Button>
                    
                    {currentStep < STEPS.length ? (
                        <Button
                            onClick={nextStep}
                            disabled={!validateStep()}
                            variant="contained"
                            sx={{
                                bgcolor: '#00F3FF',
                                color: '#000000',
                                textTransform: 'uppercase',
                                '&:hover': {
                                    bgcolor: '#00D1DD',
                                },
                                '&.Mui-disabled': {
                                    bgcolor: 'rgba(0, 243, 255, 0.3)',
                                    color: 'rgba(0, 0, 0, 0.5)',
                                },
                            }}
                        >
                            NEXT
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            sx={{
                                bgcolor: '#00F3FF',
                                color: '#000000',
                                textTransform: 'uppercase',
                                '&:hover': {
                                    bgcolor: '#00D1DD',
                                },
                            }}
                        >
                            CREATE AGENT
                        </Button>
                    )}
                </Box>
            </Paper>
        </Modal>
    );
};
