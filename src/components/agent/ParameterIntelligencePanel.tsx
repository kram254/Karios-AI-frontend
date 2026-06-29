import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import SpeedIcon from '@mui/icons-material/Speed';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HighQualityIcon from '@mui/icons-material/HighQuality';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AgentConfig, AgentRole, ParameterRecommendation, AdvancedModelSettings } from '../../types/agent';

interface ParameterIntelligencePanelProps {
    config: Partial<AgentConfig>;
    agentRole?: AgentRole;
    onConfigChange: (config: Partial<AgentConfig>) => void;
    onAdvancedSettingsChange?: (settings: AdvancedModelSettings) => void;
}

const AVAILABLE_MODELS = [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', cost: 0.01, quality: 95 },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', cost: 0.005, quality: 93 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', cost: 0.0005, quality: 85 },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', cost: 0.015, quality: 96 },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic', cost: 0.003, quality: 90 },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic', cost: 0.00025, quality: 82 },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', cost: 0.00025, quality: 88 },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', cost: 0.00125, quality: 91 },
];

const ROLE_RECOMMENDATIONS: Record<string, Partial<AgentConfig>> = {
    support_faq_responder: { temperature: 0.3, max_tokens: 200, top_p: 0.8 },
    support_ticket_triage: { temperature: 0.25, max_tokens: 300, top_p: 0.75 },
    support_technical: { temperature: 0.2, max_tokens: 400, top_p: 0.7 },
    support_sentiment_monitor: { temperature: 0.4, max_tokens: 450, top_p: 0.85 },
    support_feedback_collector: { temperature: 0.45, max_tokens: 550, top_p: 0.9 },
    sales_lead_qualifier: { temperature: 0.5, max_tokens: 250, top_p: 0.85 },
    sales_outreach: { temperature: 0.65, max_tokens: 350, top_p: 0.9 },
    sales_demo_scheduler: { temperature: 0.35, max_tokens: 250, top_p: 0.8 },
    sales_proposal_generator: { temperature: 0.4, max_tokens: 900, top_p: 0.85 },
    sales_competitor_intel: { temperature: 0.35, max_tokens: 900, top_p: 0.85 },
    content_creation: { temperature: 0.8, max_tokens: 500, top_p: 0.95 },
    content_social_media: { temperature: 0.85, max_tokens: 450, top_p: 0.95 },
    content_email_marketing: { temperature: 0.75, max_tokens: 600, top_p: 0.95 },
    content_seo: { temperature: 0.55, max_tokens: 750, top_p: 0.85 },
    content_video_script: { temperature: 0.9, max_tokens: 950, top_p: 0.95 },
    deep_research: { temperature: 0.4, max_tokens: 800, top_p: 0.9 },
    research_market_intel: { temperature: 0.35, max_tokens: 950, top_p: 0.85 },
    research_academic: { temperature: 0.25, max_tokens: 1200, top_p: 0.7 },
    research_patent: { temperature: 0.2, max_tokens: 950, top_p: 0.65 },
    research_news_monitor: { temperature: 0.45, max_tokens: 800, top_p: 0.9 },
    code_generator: { temperature: 0.1, max_tokens: 600, top_p: 0.5 },
    code_debugger: { temperature: 0.1, max_tokens: 850, top_p: 0.45 },
    code_reviewer: { temperature: 0.15, max_tokens: 750, top_p: 0.5 },
    code_documentation: { temperature: 0.3, max_tokens: 850, top_p: 0.75 },
    code_test_generator: { temperature: 0.15, max_tokens: 850, top_p: 0.55 },
    testing_qa: { temperature: 0.2, max_tokens: 950, top_p: 0.7 },
    data_analysis: { temperature: 0.2, max_tokens: 400, top_p: 0.7 },
    data_etl: { temperature: 0.2, max_tokens: 750, top_p: 0.65 },
    data_quality: { temperature: 0.15, max_tokens: 650, top_p: 0.6 },
    data_visualization: { temperature: 0.35, max_tokens: 700, top_p: 0.8 },
    data_sql_assistant: { temperature: 0.15, max_tokens: 600, top_p: 0.55 },
    web_scraping: { temperature: 0.25, max_tokens: 700, top_p: 0.75 },
    web_automation: { temperature: 0.2, max_tokens: 850, top_p: 0.7 },
    web_monitor: { temperature: 0.3, max_tokens: 600, top_p: 0.8 },
    web_testing: { temperature: 0.2, max_tokens: 950, top_p: 0.7 },
    web_api_integration: { temperature: 0.15, max_tokens: 750, top_p: 0.6 },
    task_automation: { temperature: 0.25, max_tokens: 700, top_p: 0.75 },
    workflow_automation: { temperature: 0.2, max_tokens: 950, top_p: 0.7 },
    ops_scheduling: { temperature: 0.25, max_tokens: 500, top_p: 0.75 },
    email_automation: { temperature: 0.4, max_tokens: 550, top_p: 0.85 },
    meeting_assistant: { temperature: 0.35, max_tokens: 800, top_p: 0.85 },
    personal_assistant: { temperature: 0.5, max_tokens: 700, top_p: 0.9 },
    document_processing: { temperature: 0.2, max_tokens: 900, top_p: 0.65 },
    contract_review: { temperature: 0.15, max_tokens: 1200, top_p: 0.55 },
    legal_research: { temperature: 0.25, max_tokens: 1200, top_p: 0.65 },
    custom: { temperature: 0.5, max_tokens: 700, top_p: 0.9 },
};

export const ParameterIntelligencePanel: React.FC<ParameterIntelligencePanelProps> = ({
    config,
    agentRole,
    onConfigChange,
    onAdvancedSettingsChange
}) => {
    const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
    const [recommendations, setRecommendations] = useState<ParameterRecommendation[]>([]);
    const [previewResponse, setPreviewResponse] = useState<string>('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [advancedSettings, setAdvancedSettings] = useState<AdvancedModelSettings>({
        frequency_penalty: 0,
        presence_penalty: 0,
        top_k: 40,
        stop_sequences: [],
        response_format: 'text'
    });

    const generateRecommendations = () => {
        setIsGeneratingRecommendations(true);
        
        setTimeout(() => {
            const roleConfig = agentRole ? ROLE_RECOMMENDATIONS[agentRole] : {};
            const newRecommendations: ParameterRecommendation[] = [];

            if (roleConfig.temperature !== undefined && config.temperature !== roleConfig.temperature) {
                newRecommendations.push({
                    parameter: 'temperature',
                    current_value: config.temperature || 0.7,
                    recommended_value: roleConfig.temperature,
                    reason: `For ${agentRole?.replace(/_/g, ' ')}, a temperature of ${roleConfig.temperature} provides optimal ${roleConfig.temperature < 0.5 ? 'consistency' : 'creativity'}`,
                    impact: roleConfig.temperature < 0.5 ? 'accuracy' : 'quality',
                    confidence: 0.92
                });
            }

            if (roleConfig.max_tokens !== undefined && config.max_tokens !== roleConfig.max_tokens) {
                newRecommendations.push({
                    parameter: 'max_tokens',
                    current_value: config.max_tokens || 150,
                    recommended_value: roleConfig.max_tokens,
                    reason: `Optimal response length for this role type based on performance data`,
                    impact: 'cost',
                    confidence: 0.88
                });
            }

            if (roleConfig.top_p !== undefined && config.top_p !== roleConfig.top_p) {
                newRecommendations.push({
                    parameter: 'top_p',
                    current_value: config.top_p || 0.9,
                    recommended_value: roleConfig.top_p,
                    reason: `Adjust nucleus sampling for better ${roleConfig.top_p < 0.8 ? 'precision' : 'variety'}`,
                    impact: 'quality',
                    confidence: 0.85
                });
            }

            setRecommendations(newRecommendations);
            setIsGeneratingRecommendations(false);
        }, 1000);
    };

    const applyRecommendation = (rec: ParameterRecommendation) => {
        onConfigChange({
            ...config,
            [rec.parameter]: rec.recommended_value
        });
        setRecommendations(prev => prev.filter(r => r.parameter !== rec.parameter));
    };

    const applyAllRecommendations = () => {
        const updatedConfig = { ...config };
        recommendations.forEach(rec => {
            (updatedConfig as any)[rec.parameter] = rec.recommended_value;
        });
        onConfigChange(updatedConfig);
        setRecommendations([]);
    };

    useEffect(() => {
        const roleConfig = agentRole ? ROLE_RECOMMENDATIONS[agentRole] : {};
        const temp = config.temperature ?? 0.7;
        const tokens = config.max_tokens ?? 150;
        
        let preview = '';
        if (temp < 0.3) {
            preview = "I'll provide precise, consistent responses focused on accuracy and reliability. Each answer follows established patterns.";
        } else if (temp < 0.6) {
            preview = "I'll balance consistency with helpful variation, adapting my responses while maintaining professional accuracy.";
        } else {
            preview = "I'll provide creative, dynamic responses with natural variation and engaging language tailored to each interaction.";
        }
        
        if (tokens < 150) {
            preview = preview.split('.')[0] + '.';
        } else if (tokens > 300) {
            preview += " I'm ready to provide comprehensive, detailed assistance covering all aspects of your questions thoroughly.";
        }
        
        setPreviewResponse(preview);
    }, [config.temperature, config.max_tokens, agentRole]);

    useEffect(() => {
        if (agentRole) {
            generateRecommendations();
        }
    }, [agentRole]);

    const handleAdvancedSettingChange = (key: keyof AdvancedModelSettings, value: any) => {
        const newSettings = { ...advancedSettings, [key]: value };
        setAdvancedSettings(newSettings);
        if (onAdvancedSettingsChange) {
            onAdvancedSettingsChange(newSettings);
        }
    };

    const estimatedCost = useMemo(() => {
        const model = AVAILABLE_MODELS.find(m => m.id === config.model) || AVAILABLE_MODELS[0];
        const tokens = config.max_tokens || 150;
        return (model.cost * tokens / 1000).toFixed(4);
    }, [config.model, config.max_tokens]);

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
                <TipsAndUpdatesIcon sx={{ color: '#FFD700' }} />
                <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                    AI Parameter Intelligence
                </Typography>
                <Tooltip title="Get AI-powered recommendations">
                    <IconButton 
                        size="small" 
                        onClick={generateRecommendations}
                        sx={{ ml: 'auto', color: '#00F3FF' }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {recommendations.length > 0 && (
                <Box sx={{ 
                    mb: 3, 
                    p: 2, 
                    bgcolor: 'rgba(0, 243, 255, 0.05)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 243, 255, 0.2)'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography sx={{ color: '#00F3FF', fontWeight: 600, fontSize: '0.9rem' }}>
                            💡 {recommendations.length} Optimization{recommendations.length > 1 ? 's' : ''} Available
                        </Typography>
                        <Chip
                            label="Apply All"
                            size="small"
                            onClick={applyAllRecommendations}
                            sx={{ 
                                bgcolor: '#00F3FF', 
                                color: '#000',
                                fontWeight: 600,
                                '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.8)' }
                            }}
                        />
                    </Box>
                    
                    {isGeneratingRecommendations ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                            <CircularProgress size={20} sx={{ color: '#00F3FF' }} />
                            <Typography sx={{ color: '#AAAAAA' }}>Analyzing optimal parameters...</Typography>
                        </Box>
                    ) : (
                        recommendations.map((rec, idx) => (
                            <Box 
                                key={idx}
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 2, 
                                    p: 1.5,
                                    mb: 1,
                                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                                    borderRadius: '8px',
                                    '&:last-child': { mb: 0 }
                                }}
                            >
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Typography sx={{ color: '#FFFFFF', fontWeight: 500, textTransform: 'capitalize' }}>
                                            {rec.parameter.replace(/_/g, ' ')}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            icon={rec.impact === 'cost' ? <AttachMoneyIcon sx={{ fontSize: 14 }} /> : 
                                                  rec.impact === 'speed' ? <SpeedIcon sx={{ fontSize: 14 }} /> :
                                                  <HighQualityIcon sx={{ fontSize: 14 }} />}
                                            label={rec.impact}
                                            sx={{ 
                                                height: 20, 
                                                fontSize: '0.7rem',
                                                bgcolor: rec.impact === 'cost' ? 'rgba(76, 175, 80, 0.2)' :
                                                        rec.impact === 'quality' ? 'rgba(33, 150, 243, 0.2)' :
                                                        'rgba(255, 152, 0, 0.2)',
                                                color: rec.impact === 'cost' ? '#4CAF50' :
                                                       rec.impact === 'quality' ? '#2196F3' : '#FF9800'
                                            }}
                                        />
                                    </Box>
                                    <Typography sx={{ color: '#888', fontSize: '0.8rem' }}>
                                        {rec.current_value} → <span style={{ color: '#00F3FF' }}>{rec.recommended_value}</span>
                                    </Typography>
                                    <Typography sx={{ color: '#666', fontSize: '0.75rem', mt: 0.5 }}>
                                        {rec.reason}
                                    </Typography>
                                </Box>
                                <Chip
                                    label="Apply"
                                    size="small"
                                    onClick={() => applyRecommendation(rec)}
                                    sx={{ 
                                        bgcolor: 'rgba(0, 243, 255, 0.1)', 
                                        color: '#00F3FF',
                                        border: '1px solid rgba(0, 243, 255, 0.3)',
                                        '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.2)' }
                                    }}
                                />
                            </Box>
                        ))
                    )}
                </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                <Box>
                    <Typography sx={{ color: '#AAAAAA', fontSize: '0.85rem', mb: 1 }}>
                        AI Model
                    </Typography>
                    <FormControl fullWidth size="small">
                        <Select
                            value={config.model || 'gpt-4-turbo'}
                            onChange={(e) => onConfigChange({ ...config, model: e.target.value })}
                            sx={{
                                bgcolor: '#1a2332',
                                color: '#FFFFFF',
                                borderRadius: '8px',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(75, 85, 99, 0.3)' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 243, 255, 0.5)' },
                                '& .MuiSvgIcon-root': { color: '#FFFFFF' }
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        bgcolor: '#1a2332',
                                        color: '#FFFFFF',
                                        '& .MuiMenuItem-root:hover': { bgcolor: 'rgba(0, 243, 255, 0.1)' }
                                    }
                                }
                            }}
                        >
                            {AVAILABLE_MODELS.map(model => (
                                <MenuItem key={model.id} value={model.id}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <span>{model.name}</span>
                                        <Chip 
                                            size="small" 
                                            label={`$${model.cost}/1K`}
                                            sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50' }}
                                        />
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box>
                    <Typography sx={{ color: '#AAAAAA', fontSize: '0.85rem', mb: 1 }}>
                        Est. Cost per Request
                    </Typography>
                    <Box sx={{ 
                        bgcolor: '#1a2332', 
                        p: 1.5, 
                        borderRadius: '8px',
                        border: '1px solid rgba(75, 85, 99, 0.3)'
                    }}>
                        <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: '1.1rem' }}>
                            ${estimatedCost}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: '#AAAAAA', fontSize: '0.85rem' }}>
                        Temperature (Creativity)
                    </Typography>
                    <Typography sx={{ color: '#00F3FF', fontSize: '0.85rem', fontWeight: 600 }}>
                        {config.temperature?.toFixed(1) || '0.7'}
                    </Typography>
                </Box>
                <Slider
                    value={config.temperature || 0.7}
                    onChange={(_, value) => onConfigChange({ ...config, temperature: value as number })}
                    min={0}
                    max={1}
                    step={0.1}
                    marks={[
                        { value: 0, label: 'Precise' },
                        { value: 0.5, label: 'Balanced' },
                        { value: 1, label: 'Creative' }
                    ]}
                    sx={{
                        color: '#00F3FF',
                        '& .MuiSlider-markLabel': { color: '#666', fontSize: '0.7rem' },
                        '& .MuiSlider-thumb': { bgcolor: '#00F3FF' },
                        '& .MuiSlider-track': { bgcolor: '#00F3FF' },
                        '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                />
            </Box>

            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: '#AAAAAA', fontSize: '0.85rem' }}>
                        Max Tokens (Response Length)
                    </Typography>
                    <Typography sx={{ color: '#00F3FF', fontSize: '0.85rem', fontWeight: 600 }}>
                        {config.max_tokens || 150}
                    </Typography>
                </Box>
                <Slider
                    value={config.max_tokens || 150}
                    onChange={(_, value) => onConfigChange({ ...config, max_tokens: value as number })}
                    min={50}
                    max={1000}
                    step={50}
                    marks={[
                        { value: 50, label: 'Short' },
                        { value: 500, label: 'Medium' },
                        { value: 1000, label: 'Long' }
                    ]}
                    sx={{
                        color: '#00F3FF',
                        '& .MuiSlider-markLabel': { color: '#666', fontSize: '0.7rem' },
                        '& .MuiSlider-thumb': { bgcolor: '#00F3FF' },
                        '& .MuiSlider-track': { bgcolor: '#00F3FF' },
                        '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                />
            </Box>

            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: '#AAAAAA', fontSize: '0.85rem' }}>
                        Top-P (Nucleus Sampling)
                    </Typography>
                    <Typography sx={{ color: '#00F3FF', fontSize: '0.85rem', fontWeight: 600 }}>
                        {config.top_p?.toFixed(1) || '0.9'}
                    </Typography>
                </Box>
                <Slider
                    value={config.top_p || 0.9}
                    onChange={(_, value) => onConfigChange({ ...config, top_p: value as number })}
                    min={0.1}
                    max={1}
                    step={0.1}
                    marks={[
                        { value: 0.1, label: 'Focused' },
                        { value: 0.5, label: 'Balanced' },
                        { value: 1, label: 'Diverse' }
                    ]}
                    sx={{
                        color: '#00F3FF',
                        '& .MuiSlider-markLabel': { color: '#666', fontSize: '0.7rem' },
                        '& .MuiSlider-thumb': { bgcolor: '#00F3FF' },
                        '& .MuiSlider-track': { bgcolor: '#00F3FF' },
                        '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                />
            </Box>

            <Box 
                onClick={() => setShowAdvanced(!showAdvanced)}
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    cursor: 'pointer',
                    p: 1.5,
                    bgcolor: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    mb: showAdvanced ? 2 : 0,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                }}
            >
                <AutoFixHighIcon sx={{ color: '#888', fontSize: 18 }} />
                <Typography sx={{ color: '#AAAAAA', fontSize: '0.85rem' }}>
                    Advanced Model Controls
                </Typography>
                <Typography sx={{ color: '#666', ml: 'auto' }}>
                    {showAdvanced ? '▲' : '▼'}
                </Typography>
            </Box>

            {showAdvanced && (
                <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(0, 0, 0, 0.2)', 
                    borderRadius: '8px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2
                }}>
                    <Box>
                        <Typography sx={{ color: '#888', fontSize: '0.8rem', mb: 1 }}>
                            Frequency Penalty
                        </Typography>
                        <Slider
                            value={advancedSettings.frequency_penalty || 0}
                            onChange={(_, value) => handleAdvancedSettingChange('frequency_penalty', value)}
                            min={-2}
                            max={2}
                            step={0.1}
                            size="small"
                            sx={{
                                color: '#00F3FF',
                                '& .MuiSlider-thumb': { width: 14, height: 14 }
                            }}
                        />
                    </Box>

                    <Box>
                        <Typography sx={{ color: '#888', fontSize: '0.8rem', mb: 1 }}>
                            Presence Penalty
                        </Typography>
                        <Slider
                            value={advancedSettings.presence_penalty || 0}
                            onChange={(_, value) => handleAdvancedSettingChange('presence_penalty', value)}
                            min={-2}
                            max={2}
                            step={0.1}
                            size="small"
                            sx={{
                                color: '#00F3FF',
                                '& .MuiSlider-thumb': { width: 14, height: 14 }
                            }}
                        />
                    </Box>

                    <Box>
                        <Typography sx={{ color: '#888', fontSize: '0.8rem', mb: 1 }}>
                            Response Format
                        </Typography>
                        <Select
                            value={advancedSettings.response_format || 'text'}
                            onChange={(e) => handleAdvancedSettingChange('response_format', e.target.value)}
                            size="small"
                            fullWidth
                            sx={{
                                bgcolor: '#111827',
                                color: '#FFFFFF',
                                fontSize: '0.85rem',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(75, 85, 99, 0.3)' }
                            }}
                        >
                            <MenuItem value="text">Plain Text</MenuItem>
                            <MenuItem value="json">JSON</MenuItem>
                            <MenuItem value="markdown">Markdown</MenuItem>
                        </Select>
                    </Box>

                    <Box>
                        <Typography sx={{ color: '#888', fontSize: '0.8rem', mb: 1 }}>
                            Stop Sequences
                        </Typography>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="[END], [STOP]"
                            value={advancedSettings.stop_sequences?.join(', ') || ''}
                            onChange={(e) => handleAdvancedSettingChange('stop_sequences', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: '#111827',
                                    color: '#FFFFFF',
                                    fontSize: '0.85rem',
                                    '& fieldset': { borderColor: 'rgba(75, 85, 99, 0.3)' }
                                }
                            }}
                        />
                    </Box>
                </Box>
            )}

            <Box sx={{ 
                mt: 3, 
                p: 2, 
                bgcolor: 'rgba(0, 243, 255, 0.03)', 
                borderRadius: '12px',
                border: '1px solid rgba(0, 243, 255, 0.1)'
            }}>
                <Typography sx={{ color: '#888', fontSize: '0.8rem', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SpeedIcon sx={{ fontSize: 16 }} />
                    Response Preview
                </Typography>
                <Typography sx={{ 
                    color: '#FFFFFF', 
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    lineHeight: 1.6
                }}>
                    "{previewResponse}"
                </Typography>
            </Box>
        </Box>
    );
};

export default ParameterIntelligencePanel;
