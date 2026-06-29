import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import HistoryIcon from '@mui/icons-material/History';
import StarIcon from '@mui/icons-material/Star';
import SpeedIcon from '@mui/icons-material/Speed';
import { AgentConfig, AgentRole } from '../../types/agent';

interface ParameterSandboxProps {
    config: Partial<AgentConfig>;
    agentRole?: AgentRole;
    onConfigChange: (config: Partial<AgentConfig>) => void;
    onSaveConfig?: (config: Partial<AgentConfig>) => void;
}

interface TestResult {
    id: string;
    prompt: string;
    response: string;
    config: Partial<AgentConfig>;
    metrics: {
        quality_score: number;
        tokens_used: number;
        response_time: number;
        estimated_cost: number;
    };
    timestamp: Date;
}

const SAMPLE_PROMPTS = [
    "How do I reset my password?",
    "What are the pricing options for your enterprise plan?",
    "Can you help me troubleshoot a login issue?",
    "Tell me about the main features of your product",
    "I need help with integrating your API"
];

const generateMockResponse = (prompt: string, config: Partial<AgentConfig>): string => {
    const temp = config.temperature || 0.7;
    const maxTokens = config.max_tokens || 150;
    
    let response = '';
    
    if (prompt.toLowerCase().includes('password')) {
        if (temp < 0.3) {
            response = "To reset your password: 1. Navigate to the login page. 2. Click 'Forgot Password'. 3. Enter your registered email. 4. Check your inbox for the reset link. 5. Create a new secure password.";
        } else if (temp < 0.6) {
            response = "I can help you reset your password! Simply go to our login page and click on 'Forgot Password'. Enter your email, and we'll send you a secure reset link within minutes.";
        } else {
            response = "No worries, resetting your password is super easy! Just head over to the login page, hit that 'Forgot Password' button, pop in your email, and boom - you'll get a reset link in no time! 🔐";
        }
    } else if (prompt.toLowerCase().includes('pricing')) {
        if (temp < 0.3) {
            response = "Our Enterprise plan includes: unlimited users, dedicated support, custom integrations, SLA guarantees, and advanced security features. Please contact our sales team for detailed pricing.";
        } else if (temp < 0.6) {
            response = "Great question! Our Enterprise plan is designed for scaling businesses and includes unlimited users, priority support, and custom features. I'd recommend scheduling a demo with our team for personalized pricing.";
        } else {
            response = "You're going to love our Enterprise plan! 🚀 It's packed with everything you need - unlimited users, VIP support, custom integrations, you name it! Let's get you connected with our awesome sales team for the best deal!";
        }
    } else {
        if (temp < 0.3) {
            response = "Thank you for your inquiry. I would be happy to assist you with your request. Please provide any additional details that may help me better address your needs.";
        } else if (temp < 0.6) {
            response = "Thanks for reaching out! I'm here to help with whatever you need. Feel free to share more details about what you're looking for, and I'll do my best to assist.";
        } else {
            response = "Hey there! 👋 Thanks for getting in touch! I'm totally here to help you out. What else can you tell me about what you need? Let's figure this out together!";
        }
    }
    
    if (maxTokens < 100) {
        response = response.split('.')[0] + '.';
    } else if (maxTokens > 300) {
        response += " Is there anything specific you'd like me to elaborate on? I'm happy to provide more detailed information or walk you through any steps that might help.";
    }
    
    return response;
};

export const ParameterSandbox: React.FC<ParameterSandboxProps> = ({
    config,
    agentRole,
    onConfigChange,
    onSaveConfig
}) => {
    const [testPrompt, setTestPrompt] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
    const [comparisonResult, setComparisonResult] = useState<TestResult | null>(null);
    const [testHistory, setTestHistory] = useState<TestResult[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [compareMode, setCompareMode] = useState(false);
    const [comparisonConfig, setComparisonConfig] = useState<Partial<AgentConfig>>({
        temperature: 0.3,
        max_tokens: 150,
        top_p: 0.8
    });

    const runTest = useCallback(async () => {
        if (!testPrompt.trim()) return;
        
        setIsRunning(true);
        
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
        
        const response = generateMockResponse(testPrompt, config);
        const responseTime = 0.8 + Math.random() * 1.5;
        const tokensUsed = Math.floor(response.length / 4);
        const model = config.model || 'gpt-4-turbo';
        const costPerToken = model.includes('gpt-4') ? 0.00003 : 0.000001;
        
        const result: TestResult = {
            id: Date.now().toString(),
            prompt: testPrompt,
            response,
            config: { ...config },
            metrics: {
                quality_score: 7 + Math.random() * 3,
                tokens_used: tokensUsed,
                response_time: responseTime,
                estimated_cost: tokensUsed * costPerToken
            },
            timestamp: new Date()
        };
        
        setCurrentResult(result);
        setTestHistory(prev => [result, ...prev].slice(0, 10));
        
        if (compareMode) {
            const compResponse = generateMockResponse(testPrompt, comparisonConfig);
            const compResponseTime = 0.8 + Math.random() * 1.5;
            const compTokensUsed = Math.floor(compResponse.length / 4);
            
            const compResult: TestResult = {
                id: Date.now().toString() + '-comp',
                prompt: testPrompt,
                response: compResponse,
                config: { ...comparisonConfig },
                metrics: {
                    quality_score: 7 + Math.random() * 3,
                    tokens_used: compTokensUsed,
                    response_time: compResponseTime,
                    estimated_cost: compTokensUsed * costPerToken
                },
                timestamp: new Date()
            };
            
            setComparisonResult(compResult);
        }
        
        setIsRunning(false);
    }, [testPrompt, config, compareMode, comparisonConfig]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 3,
                pb: 2,
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <PlayArrowIcon sx={{ color: '#00F3FF' }} />
                <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                    Parameter Sandbox
                </Typography>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    <Tooltip title="Compare Mode">
                        <IconButton 
                            size="small" 
                            onClick={() => setCompareMode(!compareMode)}
                            sx={{ 
                                color: compareMode ? '#00F3FF' : '#666',
                                bgcolor: compareMode ? 'rgba(0, 243, 255, 0.1)' : 'transparent'
                            }}
                        >
                            <CompareArrowsIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Test History">
                        <IconButton 
                            size="small" 
                            onClick={() => setShowHistory(!showHistory)}
                            sx={{ color: showHistory ? '#00F3FF' : '#666' }}
                        >
                            <HistoryIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography sx={{ color: '#AAAAAA', fontSize: '0.85rem', mb: 1 }}>
                    Test Prompt
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Enter a test prompt to see how your agent responds..."
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: '#111827',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            '& fieldset': { borderColor: 'rgba(75, 85, 99, 0.3)' },
                            '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.5)' }
                        }
                    }}
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    {SAMPLE_PROMPTS.map((prompt, idx) => (
                        <Chip
                            key={idx}
                            label={prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}
                            size="small"
                            onClick={() => setTestPrompt(prompt)}
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.05)',
                                color: '#888',
                                fontSize: '0.7rem',
                                '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.1)', color: '#00F3FF' }
                            }}
                        />
                    ))}
                </Box>
            </Box>

            {compareMode && (
                <Box sx={{ 
                    mb: 3, 
                    p: 2, 
                    bgcolor: 'rgba(255, 152, 0, 0.05)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 152, 0, 0.2)'
                }}>
                    <Typography sx={{ color: '#FF9800', fontWeight: 600, fontSize: '0.9rem', mb: 2 }}>
                        Comparison Settings
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                        <Box>
                            <Typography sx={{ color: '#888', fontSize: '0.75rem', mb: 0.5 }}>Temperature</Typography>
                            <Slider
                                value={comparisonConfig.temperature || 0.7}
                                onChange={(_, value) => setComparisonConfig({ ...comparisonConfig, temperature: value as number })}
                                min={0}
                                max={1}
                                step={0.1}
                                size="small"
                                sx={{ color: '#FF9800' }}
                            />
                        </Box>
                        <Box>
                            <Typography sx={{ color: '#888', fontSize: '0.75rem', mb: 0.5 }}>Max Tokens</Typography>
                            <Slider
                                value={comparisonConfig.max_tokens || 150}
                                onChange={(_, value) => setComparisonConfig({ ...comparisonConfig, max_tokens: value as number })}
                                min={50}
                                max={500}
                                step={50}
                                size="small"
                                sx={{ color: '#FF9800' }}
                            />
                        </Box>
                        <Box>
                            <Typography sx={{ color: '#888', fontSize: '0.75rem', mb: 0.5 }}>Top-P</Typography>
                            <Slider
                                value={comparisonConfig.top_p || 0.9}
                                onChange={(_, value) => setComparisonConfig({ ...comparisonConfig, top_p: value as number })}
                                min={0.1}
                                max={1}
                                step={0.1}
                                size="small"
                                sx={{ color: '#FF9800' }}
                            />
                        </Box>
                    </Box>
                </Box>
            )}

            <Button
                fullWidth
                variant="contained"
                startIcon={isRunning ? <CircularProgress size={18} sx={{ color: '#000' }} /> : <PlayArrowIcon />}
                onClick={runTest}
                disabled={isRunning || !testPrompt.trim()}
                sx={{
                    mb: 3,
                    bgcolor: '#00F3FF',
                    color: '#000',
                    fontWeight: 600,
                    py: 1.2,
                    '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.8)' },
                    '&:disabled': { bgcolor: 'rgba(0, 243, 255, 0.3)', color: '#666' }
                }}
            >
                {isRunning ? 'Running Test...' : 'Run Test'}
            </Button>

            {(currentResult || comparisonResult) && (
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: compareMode ? '1fr 1fr' : '1fr', 
                    gap: 2,
                    mb: 3
                }}>
                    {currentResult && (
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: 'rgba(0, 243, 255, 0.05)', 
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 243, 255, 0.2)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography sx={{ color: '#00F3FF', fontWeight: 600, fontSize: '0.9rem' }}>
                                    Current Settings
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Chip 
                                        label={`T: ${currentResult.config.temperature}`} 
                                        size="small" 
                                        sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(0,0,0,0.3)', color: '#888' }} 
                                    />
                                    <Chip 
                                        label={`${currentResult.config.max_tokens} tokens`} 
                                        size="small" 
                                        sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(0,0,0,0.3)', color: '#888' }} 
                                    />
                                </Box>
                            </Box>
                            
                            <Box sx={{ 
                                p: 2, 
                                bgcolor: 'rgba(0,0,0,0.2)', 
                                borderRadius: '8px', 
                                mb: 2,
                                position: 'relative'
                            }}>
                                <Typography sx={{ color: '#FFFFFF', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                    {currentResult.response}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => copyToClipboard(currentResult.response)}
                                    sx={{ position: 'absolute', top: 8, right: 8, color: '#666' }}
                                >
                                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                            
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        <StarIcon sx={{ color: '#FFD700', fontSize: 14 }} />
                                        <Typography sx={{ color: '#FFD700', fontWeight: 600, fontSize: '0.85rem' }}>
                                            {currentResult.metrics.quality_score.toFixed(1)}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: '#666', fontSize: '0.6rem' }}>Quality</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                                    <Typography sx={{ color: '#2196F3', fontWeight: 600, fontSize: '0.85rem' }}>
                                        {currentResult.metrics.tokens_used}
                                    </Typography>
                                    <Typography sx={{ color: '#666', fontSize: '0.6rem' }}>Tokens</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        <SpeedIcon sx={{ color: '#4CAF50', fontSize: 14 }} />
                                        <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: '0.85rem' }}>
                                            {currentResult.metrics.response_time.toFixed(1)}s
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: '#666', fontSize: '0.6rem' }}>Time</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                                    <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: '0.85rem' }}>
                                        ${currentResult.metrics.estimated_cost.toFixed(4)}
                                    </Typography>
                                    <Typography sx={{ color: '#666', fontSize: '0.6rem' }}>Cost</Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {compareMode && comparisonResult && (
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: 'rgba(255, 152, 0, 0.05)', 
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 152, 0, 0.2)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography sx={{ color: '#FF9800', fontWeight: 600, fontSize: '0.9rem' }}>
                                    Comparison Settings
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Chip 
                                        label={`T: ${comparisonResult.config.temperature}`} 
                                        size="small" 
                                        sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(0,0,0,0.3)', color: '#888' }} 
                                    />
                                    <Chip 
                                        label={`${comparisonResult.config.max_tokens} tokens`} 
                                        size="small" 
                                        sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(0,0,0,0.3)', color: '#888' }} 
                                    />
                                </Box>
                            </Box>
                            
                            <Box sx={{ 
                                p: 2, 
                                bgcolor: 'rgba(0,0,0,0.2)', 
                                borderRadius: '8px', 
                                mb: 2,
                                position: 'relative'
                            }}>
                                <Typography sx={{ color: '#FFFFFF', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                    {comparisonResult.response}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => copyToClipboard(comparisonResult.response)}
                                    sx={{ position: 'absolute', top: 8, right: 8, color: '#666' }}
                                >
                                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                            
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        <StarIcon sx={{ color: '#FFD700', fontSize: 14 }} />
                                        <Typography sx={{ color: '#FFD700', fontWeight: 600, fontSize: '0.85rem' }}>
                                            {comparisonResult.metrics.quality_score.toFixed(1)}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: '#666', fontSize: '0.6rem' }}>Quality</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                                    <Typography sx={{ color: '#2196F3', fontWeight: 600, fontSize: '0.85rem' }}>
                                        {comparisonResult.metrics.tokens_used}
                                    </Typography>
                                    <Typography sx={{ color: '#666', fontSize: '0.6rem' }}>Tokens</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        <SpeedIcon sx={{ color: '#4CAF50', fontSize: 14 }} />
                                        <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: '0.85rem' }}>
                                            {comparisonResult.metrics.response_time.toFixed(1)}s
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: '#666', fontSize: '0.6rem' }}>Time</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                                    <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: '0.85rem' }}>
                                        ${comparisonResult.metrics.estimated_cost.toFixed(4)}
                                    </Typography>
                                    <Typography sx={{ color: '#666', fontSize: '0.6rem' }}>Cost</Typography>
                                </Box>
                            </Box>

                            <Button
                                fullWidth
                                size="small"
                                onClick={() => onConfigChange(comparisonConfig)}
                                sx={{ 
                                    mt: 2,
                                    color: '#FF9800',
                                    border: '1px solid rgba(255, 152, 0, 0.3)',
                                    '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' }
                                }}
                            >
                                Apply These Settings
                            </Button>
                        </Box>
                    )}
                </Box>
            )}

            {showHistory && testHistory.length > 0 && (
                <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255,255,255,0.02)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <Typography sx={{ color: '#AAAAAA', fontWeight: 600, fontSize: '0.9rem', mb: 2 }}>
                        Test History ({testHistory.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {testHistory.map((result, idx) => (
                            <Box 
                                key={result.id}
                                sx={{ 
                                    p: 1.5, 
                                    bgcolor: 'rgba(0,0,0,0.2)', 
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.05)' }
                                }}
                                onClick={() => {
                                    setTestPrompt(result.prompt);
                                    setCurrentResult(result);
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem' }} noWrap>
                                        {result.prompt.substring(0, 50)}...
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Chip 
                                            label={`${result.metrics.quality_score.toFixed(1)} ⭐`} 
                                            size="small" 
                                            sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(255, 215, 0, 0.1)', color: '#FFD700' }} 
                                        />
                                        <Typography sx={{ color: '#666', fontSize: '0.7rem' }}>
                                            {result.timestamp.toLocaleTimeString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default ParameterSandbox;
