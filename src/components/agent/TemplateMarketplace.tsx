import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import Tooltip from '@mui/material/Tooltip';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { AgentTemplate, AgentConfig, AgentRole, AgentMode } from '../../types/agent';

interface TemplateMarketplaceProps {
    onTemplateSelect: (template: AgentTemplate) => void;
    selectedTemplateId?: string;
    agentRole?: AgentRole;
}

const AGENT_TEMPLATES: AgentTemplate[] = [
    {
        id: 'enterprise-support',
        name: 'Enterprise Customer Support',
        category: 'Support',
        description: 'Optimized for consistency, professionalism, and cost control in customer service scenarios',
        icon: '🏢',
        config: {
            temperature: 0.3,
            max_tokens: 200,
            top_p: 0.8,
            response_style: 0.3,
            model: 'gpt-4-turbo'
        },
        performance_metrics: {
            avg_satisfaction: 4.7,
            avg_cost_per_request: 0.018,
            avg_response_time: 1.2
        },
        use_cases: ['Customer inquiries', 'FAQ handling', 'Account support'],
        popularity: 94
    },
    {
        id: 'technical-support-tier1',
        name: 'Technical Support Tier-1',
        category: 'Support',
        description: 'Designed for accurate, step-by-step technical guidance with clear troubleshooting flows',
        icon: '🔧',
        config: {
            temperature: 0.2,
            max_tokens: 350,
            top_p: 0.7,
            response_style: 0.2,
            model: 'gpt-4-turbo'
        },
        performance_metrics: {
            avg_satisfaction: 4.5,
            avg_cost_per_request: 0.025,
            avg_response_time: 1.8
        },
        use_cases: ['Troubleshooting', 'Product setup', 'Technical documentation'],
        popularity: 87
    },
    {
        id: 'sales-lead-qualifier',
        name: 'Sales Lead Qualifier',
        category: 'Sales',
        description: 'Engaging conversational agent for qualifying leads and scheduling demos',
        icon: '💼',
        config: {
            temperature: 0.6,
            max_tokens: 250,
            top_p: 0.85,
            response_style: 0.6,
            model: 'gpt-4o'
        },
        performance_metrics: {
            avg_satisfaction: 4.4,
            avg_cost_per_request: 0.015,
            avg_response_time: 1.0
        },
        use_cases: ['Lead qualification', 'Demo scheduling', 'Product inquiries'],
        popularity: 91
    },
    {
        id: 'content-creator',
        name: 'Creative Content Generator',
        category: 'Content',
        description: 'High creativity settings for generating engaging marketing and social content',
        icon: '✨',
        config: {
            temperature: 0.85,
            max_tokens: 500,
            top_p: 0.95,
            response_style: 0.7,
            model: 'gpt-4-turbo'
        },
        performance_metrics: {
            avg_satisfaction: 4.6,
            avg_cost_per_request: 0.035,
            avg_response_time: 2.5
        },
        use_cases: ['Blog posts', 'Social media', 'Ad copy', 'Email campaigns'],
        popularity: 88
    },
    {
        id: 'deep-researcher',
        name: 'Deep Research Assistant',
        category: 'Research',
        description: 'Comprehensive research capabilities with fact-checking and source citation',
        icon: '🔬',
        config: {
            temperature: 0.4,
            max_tokens: 800,
            top_p: 0.9,
            response_style: 0.3,
            model: 'claude-3-opus'
        },
        performance_metrics: {
            avg_satisfaction: 4.8,
            avg_cost_per_request: 0.055,
            avg_response_time: 4.2
        },
        use_cases: ['Market research', 'Competitive analysis', 'Academic research'],
        popularity: 82
    },
    {
        id: 'code-assistant',
        name: 'Code Generation Expert',
        category: 'Development',
        description: 'Precise code generation with low temperature for consistent, reliable output',
        icon: '💻',
        config: {
            temperature: 0.15,
            max_tokens: 600,
            top_p: 0.5,
            response_style: 0.2,
            model: 'gpt-4-turbo'
        },
        performance_metrics: {
            avg_satisfaction: 4.6,
            avg_cost_per_request: 0.042,
            avg_response_time: 2.8
        },
        use_cases: ['Code generation', 'Debugging', 'Code review', 'Documentation'],
        popularity: 85
    },
    {
        id: 'data-analyst',
        name: 'Data Analysis Expert',
        category: 'Data',
        description: 'Analytical agent for interpreting data, generating insights, and SQL assistance',
        icon: '📊',
        config: {
            temperature: 0.25,
            max_tokens: 400,
            top_p: 0.7,
            response_style: 0.3,
            model: 'gpt-4-turbo'
        },
        performance_metrics: {
            avg_satisfaction: 4.5,
            avg_cost_per_request: 0.028,
            avg_response_time: 2.0
        },
        use_cases: ['Data interpretation', 'SQL queries', 'Report generation'],
        popularity: 79
    },
    {
        id: 'cost-optimized',
        name: 'Cost-Optimized Assistant',
        category: 'Utility',
        description: 'Budget-friendly configuration using efficient models with minimal tokens',
        icon: '💰',
        config: {
            temperature: 0.5,
            max_tokens: 150,
            top_p: 0.8,
            response_style: 0.5,
            model: 'gpt-3.5-turbo'
        },
        performance_metrics: {
            avg_satisfaction: 4.1,
            avg_cost_per_request: 0.003,
            avg_response_time: 0.6
        },
        use_cases: ['High-volume queries', 'Simple tasks', 'FAQ responses'],
        popularity: 76
    },
    {
        id: 'premium-quality',
        name: 'Premium Quality Agent',
        category: 'Premium',
        description: 'Maximum quality configuration using the best models for critical interactions',
        icon: '👑',
        config: {
            temperature: 0.5,
            max_tokens: 500,
            top_p: 0.9,
            response_style: 0.5,
            model: 'claude-3-opus'
        },
        performance_metrics: {
            avg_satisfaction: 4.9,
            avg_cost_per_request: 0.065,
            avg_response_time: 3.5
        },
        use_cases: ['Executive communication', 'Complex analysis', 'VIP support'],
        popularity: 73
    }
];

const CATEGORIES = ['All', 'Support', 'Sales', 'Content', 'Research', 'Development', 'Data', 'Utility', 'Premium'];

export const TemplateMarketplace: React.FC<TemplateMarketplaceProps> = ({
    onTemplateSelect,
    selectedTemplateId,
    agentRole
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState<'popularity' | 'satisfaction' | 'cost'>('popularity');

    const filteredTemplates = useMemo(() => {
        let templates = [...AGENT_TEMPLATES];

        if (selectedCategory !== 'All') {
            templates = templates.filter(t => t.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            templates = templates.filter(t => 
                t.name.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query) ||
                t.use_cases.some(u => u.toLowerCase().includes(query))
            );
        }

        templates.sort((a, b) => {
            if (sortBy === 'popularity') return b.popularity - a.popularity;
            if (sortBy === 'satisfaction') return (b.performance_metrics?.avg_satisfaction || 0) - (a.performance_metrics?.avg_satisfaction || 0);
            if (sortBy === 'cost') return (a.performance_metrics?.avg_cost_per_request || 0) - (b.performance_metrics?.avg_cost_per_request || 0);
            return 0;
        });

        return templates;
    }, [searchQuery, selectedCategory, sortBy]);

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ position: 'relative', flex: 1 }}>
                    <SearchIcon sx={{ 
                        position: 'absolute', 
                        left: 12, 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: '#666'
                    }} />
                    <TextField
                        fullWidth
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: '#111827',
                                color: '#FFFFFF',
                                borderRadius: '8px',
                                pl: 4,
                                '& fieldset': { borderColor: 'rgba(75, 85, 99, 0.3)' },
                                '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.5)' }
                            }
                        }}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Sort by Popularity">
                        <Chip
                            icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
                            label="Popular"
                            size="small"
                            onClick={() => setSortBy('popularity')}
                            sx={{
                                bgcolor: sortBy === 'popularity' ? 'rgba(0, 243, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: sortBy === 'popularity' ? '#00F3FF' : '#888',
                                border: sortBy === 'popularity' ? '1px solid rgba(0, 243, 255, 0.3)' : 'none'
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Sort by Satisfaction">
                        <Chip
                            icon={<StarIcon sx={{ fontSize: 16 }} />}
                            label="Rating"
                            size="small"
                            onClick={() => setSortBy('satisfaction')}
                            sx={{
                                bgcolor: sortBy === 'satisfaction' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: sortBy === 'satisfaction' ? '#FFD700' : '#888',
                                border: sortBy === 'satisfaction' ? '1px solid rgba(255, 215, 0, 0.3)' : 'none'
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Sort by Cost (Low to High)">
                        <Chip
                            icon={<AttachMoneyIcon sx={{ fontSize: 16 }} />}
                            label="Cost"
                            size="small"
                            onClick={() => setSortBy('cost')}
                            sx={{
                                bgcolor: sortBy === 'cost' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: sortBy === 'cost' ? '#4CAF50' : '#888',
                                border: sortBy === 'cost' ? '1px solid rgba(76, 175, 80, 0.3)' : 'none'
                            }}
                        />
                    </Tooltip>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                {CATEGORIES.map(category => (
                    <Chip
                        key={category}
                        label={category}
                        size="small"
                        onClick={() => setSelectedCategory(category)}
                        sx={{
                            bgcolor: selectedCategory === category ? 'rgba(0, 243, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                            color: selectedCategory === category ? '#00F3FF' : '#AAAAAA',
                            border: selectedCategory === category ? '1px solid rgba(0, 243, 255, 0.3)' : '1px solid transparent',
                            '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.1)' }
                        }}
                    />
                ))}
            </Box>

            <Typography sx={{ color: '#666', fontSize: '0.8rem', mb: 2 }}>
                Showing {filteredTemplates.length} templates
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                {filteredTemplates.map(template => (
                    <Box
                        key={template.id}
                        onClick={() => onTemplateSelect(template)}
                        sx={{
                            p: 2,
                            bgcolor: selectedTemplateId === template.id ? 'rgba(0, 243, 255, 0.08)' : 'rgba(26, 35, 50, 0.6)',
                            borderRadius: '12px',
                            border: selectedTemplateId === template.id 
                                ? '2px solid rgba(0, 243, 255, 0.5)' 
                                : '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            '&:hover': {
                                bgcolor: 'rgba(0, 243, 255, 0.05)',
                                border: '1px solid rgba(0, 243, 255, 0.3)',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        {selectedTemplateId === template.id && (
                            <CheckCircleIcon sx={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                color: '#00F3FF',
                                fontSize: 22
                            }} />
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Box sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                bgcolor: 'rgba(0, 243, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.3rem'
                            }}>
                                {template.icon}
                            </Box>
                            <Box>
                                <Typography sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.95rem' }}>
                                    {template.name}
                                </Typography>
                                <Chip
                                    label={template.category}
                                    size="small"
                                    sx={{
                                        height: 18,
                                        fontSize: '0.65rem',
                                        bgcolor: 'rgba(255,255,255,0.08)',
                                        color: '#888'
                                    }}
                                />
                            </Box>
                        </Box>

                        <Typography sx={{ 
                            color: '#AAAAAA', 
                            fontSize: '0.8rem', 
                            mb: 2,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {template.description}
                        </Typography>

                        {template.performance_metrics && (
                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                gap: 1, 
                                mb: 2,
                                p: 1.5,
                                bgcolor: 'rgba(0,0,0,0.2)',
                                borderRadius: '8px'
                            }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        <StarIcon sx={{ color: '#FFD700', fontSize: 14 }} />
                                        <Typography sx={{ color: '#FFD700', fontWeight: 600, fontSize: '0.85rem' }}>
                                            {template.performance_metrics.avg_satisfaction}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: '#666', fontSize: '0.65rem' }}>Rating</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: '0.85rem' }}>
                                        ${template.performance_metrics.avg_cost_per_request}
                                    </Typography>
                                    <Typography sx={{ color: '#666', fontSize: '0.65rem' }}>Per Request</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        <SpeedIcon sx={{ color: '#2196F3', fontSize: 14 }} />
                                        <Typography sx={{ color: '#2196F3', fontWeight: 600, fontSize: '0.85rem' }}>
                                            {template.performance_metrics.avg_response_time}s
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: '#666', fontSize: '0.65rem' }}>Speed</Typography>
                                </Box>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {template.use_cases.slice(0, 3).map((useCase, idx) => (
                                <Chip
                                    key={idx}
                                    label={useCase}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        bgcolor: 'rgba(0, 243, 255, 0.08)',
                                        color: '#00F3FF',
                                        border: '1px solid rgba(0, 243, 255, 0.15)'
                                    }}
                                />
                            ))}
                            {template.use_cases.length > 3 && (
                                <Chip
                                    label={`+${template.use_cases.length - 3}`}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        bgcolor: 'rgba(255,255,255,0.05)',
                                        color: '#666'
                                    }}
                                />
                            )}
                        </Box>

                        <Box sx={{ 
                            mt: 2, 
                            pt: 1.5, 
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TrendingUpIcon sx={{ color: '#888', fontSize: 14 }} />
                                <Typography sx={{ color: '#888', fontSize: '0.7rem' }}>
                                    {template.popularity}% adoption
                                </Typography>
                            </Box>
                            <Typography sx={{ 
                                color: '#00F3FF', 
                                fontSize: '0.75rem',
                                fontWeight: 500
                            }}>
                                {selectedTemplateId === template.id ? 'Selected ✓' : 'Click to Apply'}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>

            {filteredTemplates.length === 0 && (
                <Box sx={{ 
                    textAlign: 'center', 
                    py: 6,
                    color: '#666'
                }}>
                    <Typography sx={{ fontSize: '1.2rem', mb: 1 }}>🔍</Typography>
                    <Typography>No templates found matching your criteria</Typography>
                </Box>
            )}
        </Box>
    );
};

export default TemplateMarketplace;
