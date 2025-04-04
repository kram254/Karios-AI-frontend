import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    CircularProgress,
    Tabs,
    Tab,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider
} from '@mui/material';
import { Agent, AgentRole, AgentMode } from '../../types/agent';

// Tab Panel component
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`agent-edit-tabpanel-${index}`}
            aria-labelledby={`agent-edit-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Language options with flags
const languageFlags: Record<string, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇵🇹',
    ru: '🇷🇺',
};

// Role descriptions
const roleDescriptions: Record<AgentRole, string> = {
    [AgentRole.CUSTOMER_SUPPORT]: 'Provides customer service and helps solve user issues with a focus on satisfaction and resolution.',
    [AgentRole.TECHNICAL_SUPPORT]: 'Assists with technical troubleshooting and guidance on complex technical matters.',
    [AgentRole.SALES_SERVICES]: 'Assists with product recommendations and sales inquiries, focusing on conversion and value presentation.',
    [AgentRole.CONSULTING]: 'Provides expert advice and consulting services with deep domain expertise.',
    [AgentRole.SALES_ASSISTANT]: 'Specializes in sales assistance, product demonstrations, and closing deals effectively.',
    [AgentRole.CUSTOM]: 'Custom agent role with specialized functionality based on your description.'
};

interface AgentEditDialogProps {
    open: boolean;
    agent: Agent | null;
    onClose: () => void;
    onSave: (agentData: {
        name: string;
        description: string;
        ai_role?: AgentRole;
        role_description?: string;
        language?: string;
        model?: string;
        response_style?: number;
        response_length?: number;
        mode?: AgentMode;
        actions?: string[];
    }) => Promise<void>;
}

// Available behavior actions
const availableActions = [
    { id: 'search_web', name: 'Search Web', description: 'Allow the agent to search the web for information' },
    { id: 'generate_content', name: 'Generate Content', description: 'Allow the agent to create content like blog posts or emails' },
    { id: 'answer_faq', name: 'Answer FAQs', description: 'Allow the agent to answer frequently asked questions' },
    { id: 'schedule_meeting', name: 'Schedule Meetings', description: 'Allow the agent to schedule meetings on your calendar' },
    { id: 'send_email', name: 'Send Emails', description: 'Allow the agent to draft and send emails on your behalf' },
];

const AgentEditDialog: React.FC<AgentEditDialogProps> = ({ open, agent, onClose, onSave }) => {
    // Tab state
    const [currentTab, setCurrentTab] = useState(0);
    
    // Basic info
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    
    // Role settings
    const [role, setRole] = useState<AgentRole>(AgentRole.CUSTOMER_SUPPORT);
    const [roleDescription, setRoleDescription] = useState<string>('');
    const [mode, setMode] = useState<AgentMode>(AgentMode.TEXT);
    
    // Behavior settings
    const [responseStyle, setResponseStyle] = useState(0.5);
    const [responseLength, setResponseLength] = useState(150);
    const [language, setLanguage] = useState('en');
    const [model, setModel] = useState('gpt-3.5-turbo');
    const [selectedActions, setSelectedActions] = useState<string[]>([]);
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (agent) {
            // Basic info
            setName(agent.name || '');
            setDescription(agent.description || '');
            
            // Role settings
            setRole(agent.ai_role || AgentRole.CUSTOMER_SUPPORT);
            setRoleDescription(agent.role_description || '');
            setMode(agent.mode || AgentMode.TEXT);
            
            // Behavior settings
            setResponseStyle(agent.response_style ?? 0.5);
            setResponseLength(agent.response_length ?? 150);
            setLanguage(agent.language || 'en');
            setModel(agent.config?.model || 'gpt-3.5-turbo');
            setSelectedActions(agent.actions || []);
        }
    }, [agent]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const updateData = {
                name: name,
                description: description,
                ai_role: role,
                language: language,
                model: model,
                response_style: responseStyle,
                response_length: responseLength,
                mode: mode,
                actions: selectedActions
            } as {
                name: string;
                description: string;
                ai_role: AgentRole;
                role_description?: string;
                language: string;
                model: string;
                response_style: number;
                response_length: number;
                mode: AgentMode;
                actions: string[];
            };
            
            // Add role_description only if custom role is selected
            if (role === AgentRole.CUSTOM && roleDescription) {
                updateData.role_description = roleDescription;
            }
            
            await onSave(updateData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save agent details');
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

    // Toggle action selection
    const toggleAction = (actionId: string) => {
        if (selectedActions.includes(actionId)) {
            setSelectedActions(selectedActions.filter(id => id !== actionId));
        } else {
            setSelectedActions([...selectedActions, actionId]);
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
            <DialogTitle>Edit Agent</DialogTitle>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs 
                    value={currentTab} 
                    onChange={handleTabChange} 
                    aria-label="agent edit tabs"
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#00F3FF',
                        },
                        '& .MuiTab-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-selected': {
                                color: '#00F3FF',
                            },
                        },
                    }}
                >
                    <Tab label="BASIC INFO" />
                    <Tab label="ROLE" />
                    <Tab label="BEHAVIOR" />
                </Tabs>
            </Box>
            
            <DialogContent>
                {error && (
                    <Box sx={{ mb: 2 }}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                )}
                
                <TabPanel value={currentTab} index={0}>
                    <TextField
                        fullWidth
                        label="Agent Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        margin="normal"
                        required
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
                            '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        }}
                    />
                    
                    <TextField
                        fullWidth
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        margin="normal"
                        multiline
                        rows={3}
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
                            '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        }}
                    />
                </TabPanel>
                
                <TabPanel value={currentTab} index={1}>
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
                    
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Interaction Mode</InputLabel>
                        <Select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as AgentMode)}
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
                            <MenuItem value={AgentMode.TEXT}>Text Only</MenuItem>
                            <MenuItem value={AgentMode.AUDIO}>Voice</MenuItem>
                            <MenuItem value={AgentMode.VIDEO}>Multimodal</MenuItem>
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
                </TabPanel>
                
                <TabPanel value={currentTab} index={2}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            AI Model
                        </Typography>
                        <FormControl fullWidth>
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
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Language
                        </Typography>
                        <FormControl fullWidth>
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
                    </Box>
                    
                    <Box sx={{ mb: 4 }}>
                        <Typography id="response-style-slider" gutterBottom>
                            Response Style: {getResponseStyleLabel(responseStyle)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ minWidth: 60 }}>Formal</Typography>
                            <Slider
                                value={responseStyle}
                                onChange={(_e, val) => setResponseStyle(val as number)}
                                aria-labelledby="response-style-slider"
                                step={0.01}
                                min={0}
                                max={1}
                                sx={{
                                    mx: 2,
                                    color: '#00F3FF',
                                    '& .MuiSlider-thumb': {
                                        width: 20,
                                        height: 20,
                                        backgroundColor: '#00F3FF',
                                    },
                                    '& .MuiSlider-rail': {
                                        opacity: 0.5,
                                        backgroundColor: '#888',
                                    },
                                }}
                            />
                            <Typography sx={{ minWidth: 60 }}>Casual</Typography>
                        </Box>
                    </Box>
                    
                    <Box sx={{ mb: 4 }}>
                        <Typography id="response-length-slider" gutterBottom>
                            Response Length: {responseLength} words
                        </Typography>
                        <Box sx={{ px: 1 }}>
                            <Slider
                                value={responseLength}
                                onChange={(_e, val) => setResponseLength(val as number)}
                                aria-labelledby="response-length-slider"
                                step={50}
                                marks={[
                                    { value: 50, label: '50' },
                                    { value: 150, label: '150' },
                                    { value: 300, label: '300' },
                                    { value: 500, label: '500' },
                                ]}
                                min={50}
                                max={500}
                                sx={{
                                    color: '#00F3FF',
                                    '& .MuiSlider-thumb': {
                                        width: 20,
                                        height: 20,
                                        backgroundColor: '#00F3FF',
                                    },
                                    '& .MuiSlider-rail': {
                                        opacity: 0.5,
                                        backgroundColor: '#888',
                                    },
                                    '& .MuiSlider-mark': {
                                        backgroundColor: '#bbb',
                                        height: 8,
                                        width: 1,
                                        marginTop: -3,
                                    },
                                    '& .MuiSlider-markLabel': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Agent Actions
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                            Select which actions this agent can perform:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {availableActions.map(action => (
                                <Box
                                    key={action.id}
                                    onClick={() => toggleAction(action.id)}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: selectedActions.includes(action.id) ? '#00F3FF' : 'rgba(255, 255, 255, 0.2)',
                                        borderRadius: 1,
                                        p: 1,
                                        cursor: 'pointer',
                                        backgroundColor: selectedActions.includes(action.id) ? 'rgba(0, 243, 255, 0.1)' : 'transparent',
                                        ':hover': {
                                            borderColor: 'rgba(0, 243, 255, 0.5)',
                                        },
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: selectedActions.includes(action.id) ? 'bold' : 'normal' }}>
                                        {action.name}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </TabPanel>
            </DialogContent>
            
            <DialogActions sx={{ p: 2 }}>
                <Button
                    onClick={onClose}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                    CANCEL
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !name}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                    sx={{
                        bgcolor: '#00F3FF',
                        color: '#000000',
                        '&:hover': {
                            bgcolor: '#00D4E0'
                        },
                        '&.Mui-disabled': {
                            bgcolor: 'rgba(0, 243, 255, 0.3)',
                            color: 'rgba(0, 0, 0, 0.5)'
                        }
                    }}
                >
                    SAVE
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AgentEditDialog;
