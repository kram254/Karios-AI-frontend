import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SpeedIcon from '@mui/icons-material/Speed';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import { AgentConfig, AgentRole } from '../../types/agent';

interface AgentPerformanceAnalyticsProps {
    agentId?: number;
    config: Partial<AgentConfig>;
    agentRole?: AgentRole;
}

interface PerformanceMetrics {
    quality_score: number;
    quality_trend: number;
    avg_response_time: number;
    response_time_trend: number;
    cost_per_request: number;
    cost_trend: number;
    success_rate: number;
    error_rate: number;
    total_requests: number;
    total_cost: number;
    satisfaction_score: number;
    satisfaction_trend: number;
}

interface OptimizationInsight {
    id: string;
    type: 'cost' | 'quality' | 'speed' | 'error';
    title: string;
    description: string;
    impact: string;
    action?: string;
    priority: 'high' | 'medium' | 'low';
}

const generateMockMetrics = (config: Partial<AgentConfig>): PerformanceMetrics => {
    const temp = config.temperature || 0.7;
    const tokens = config.max_tokens || 150;
    const model = config.model || 'gpt-4-turbo';
    
    const baseQuality = model.includes('gpt-4') || model.includes('claude-3-opus') ? 92 : 85;
    const baseCost = model.includes('gpt-4') ? 0.025 : model.includes('claude') ? 0.018 : 0.003;
    
    return {
        quality_score: baseQuality - (temp * 5) + (Math.random() * 5),
        quality_trend: (Math.random() - 0.5) * 10,
        avg_response_time: 0.8 + (tokens / 200) + (Math.random() * 0.5),
        response_time_trend: (Math.random() - 0.5) * 20,
        cost_per_request: baseCost * (tokens / 150) + (Math.random() * 0.005),
        cost_trend: (Math.random() - 0.5) * 15,
        success_rate: 95 + (Math.random() * 4),
        error_rate: 1 + (Math.random() * 2),
        total_requests: Math.floor(Math.random() * 10000) + 500,
        total_cost: Math.random() * 500 + 50,
        satisfaction_score: 4.2 + (Math.random() * 0.7),
        satisfaction_trend: (Math.random() - 0.5) * 10
    };
};

const generateInsights = (metrics: PerformanceMetrics, config: Partial<AgentConfig>): OptimizationInsight[] => {
    const insights: OptimizationInsight[] = [];
    
    if (metrics.cost_per_request > 0.03) {
        insights.push({
            id: 'cost-1',
            type: 'cost',
            title: 'High Cost Per Request',
            description: 'Your cost per request is above average. Consider reducing max tokens or using a more cost-effective model.',
            impact: `Potential savings: $${((metrics.cost_per_request - 0.02) * metrics.total_requests).toFixed(2)}/month`,
            action: 'Reduce max tokens to 150',
            priority: 'high'
        });
    }
    
    if (metrics.avg_response_time > 2.0) {
        insights.push({
            id: 'speed-1',
            type: 'speed',
            title: 'Slow Response Time',
            description: 'Average response time exceeds 2 seconds. Consider reducing token count or using a faster model.',
            impact: 'Improve user experience by up to 40%',
            action: 'Switch to GPT-4o for faster responses',
            priority: 'medium'
        });
    }
    
    if (metrics.error_rate > 2) {
        insights.push({
            id: 'error-1',
            type: 'error',
            title: 'Elevated Error Rate',
            description: 'Your error rate is higher than normal. Check prompt configuration and model compatibility.',
            impact: `${metrics.error_rate.toFixed(1)}% of requests failing`,
            priority: 'high'
        });
    }
    
    if (metrics.quality_score < 90 && (config.temperature || 0.7) > 0.7) {
        insights.push({
            id: 'quality-1',
            type: 'quality',
            title: 'Quality Could Be Improved',
            description: 'High temperature setting may be causing inconsistent responses. Consider lowering for better accuracy.',
            impact: 'Potential +8% quality improvement',
            action: 'Lower temperature to 0.5',
            priority: 'medium'
        });
    }
    
    if (insights.length === 0) {
        insights.push({
            id: 'success-1',
            type: 'quality',
            title: 'Configuration Optimized',
            description: 'Your current settings are performing well across all metrics.',
            impact: 'No immediate optimizations needed',
            priority: 'low'
        });
    }
    
    return insights;
};

export const AgentPerformanceAnalytics: React.FC<AgentPerformanceAnalyticsProps> = ({
    agentId,
    config,
    agentRole
}) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            setMetrics(generateMockMetrics(config));
            setIsLoading(false);
        }, 800);
    }, [config, timeRange]);

    const insights = useMemo(() => {
        if (!metrics) return [];
        return generateInsights(metrics, config);
    }, [metrics, config]);

    const refreshMetrics = () => {
        setIsLoading(true);
        setTimeout(() => {
            setMetrics(generateMockMetrics(config));
            setIsLoading(false);
        }, 500);
    };

    if (isLoading || !metrics) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <LinearProgress sx={{ mb: 2, bgcolor: 'rgba(0, 243, 255, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#00F3FF' } }} />
                <Typography sx={{ color: '#888' }}>Loading performance data...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 3,
                pb: 2,
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon sx={{ color: '#00F3FF' }} />
                    <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        Performance Analytics
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {['24h', '7d', '30d'].map((range) => (
                        <Chip
                            key={range}
                            label={range}
                            size="small"
                            onClick={() => setTimeRange(range as any)}
                            sx={{
                                bgcolor: timeRange === range ? 'rgba(0, 243, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: timeRange === range ? '#00F3FF' : '#888',
                                border: timeRange === range ? '1px solid rgba(0, 243, 255, 0.3)' : 'none',
                                fontSize: '0.7rem'
                            }}
                        />
                    ))}
                    <IconButton size="small" onClick={refreshMetrics} sx={{ color: '#666' }}>
                        <RefreshIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: 2,
                mb: 3
            }}>
                <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(26, 35, 50, 0.6)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <StarIcon sx={{ color: '#FFD700', fontSize: 18 }} />
                        <Typography sx={{ color: '#888', fontSize: '0.8rem' }}>Quality Score</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.5rem' }}>
                            {metrics.quality_score.toFixed(1)}%
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {metrics.quality_trend >= 0 ? (
                                <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
                            ) : (
                                <TrendingDownIcon sx={{ color: '#f44336', fontSize: 16 }} />
                            )}
                            <Typography sx={{ 
                                color: metrics.quality_trend >= 0 ? '#4CAF50' : '#f44336', 
                                fontSize: '0.75rem' 
                            }}>
                                {metrics.quality_trend >= 0 ? '+' : ''}{metrics.quality_trend.toFixed(1)}%
                            </Typography>
                        </Box>
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={metrics.quality_score} 
                        sx={{ 
                            mt: 1, 
                            height: 4, 
                            borderRadius: 2,
                            bgcolor: 'rgba(255, 215, 0, 0.1)',
                            '& .MuiLinearProgress-bar': { bgcolor: '#FFD700' }
                        }} 
                    />
                </Box>

                <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(26, 35, 50, 0.6)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SpeedIcon sx={{ color: '#2196F3', fontSize: 18 }} />
                        <Typography sx={{ color: '#888', fontSize: '0.8rem' }}>Avg Response Time</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.5rem' }}>
                            {metrics.avg_response_time.toFixed(1)}s
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {metrics.response_time_trend <= 0 ? (
                                <TrendingDownIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
                            ) : (
                                <TrendingUpIcon sx={{ color: '#f44336', fontSize: 16 }} />
                            )}
                            <Typography sx={{ 
                                color: metrics.response_time_trend <= 0 ? '#4CAF50' : '#f44336', 
                                fontSize: '0.75rem' 
                            }}>
                                {metrics.response_time_trend <= 0 ? '' : '+'}{metrics.response_time_trend.toFixed(1)}%
                            </Typography>
                        </Box>
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={Math.min(100, (3 - metrics.avg_response_time) * 50)} 
                        sx={{ 
                            mt: 1, 
                            height: 4, 
                            borderRadius: 2,
                            bgcolor: 'rgba(33, 150, 243, 0.1)',
                            '& .MuiLinearProgress-bar': { bgcolor: '#2196F3' }
                        }} 
                    />
                </Box>

                <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(26, 35, 50, 0.6)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AttachMoneyIcon sx={{ color: '#4CAF50', fontSize: 18 }} />
                        <Typography sx={{ color: '#888', fontSize: '0.8rem' }}>Cost per Request</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.5rem' }}>
                            ${metrics.cost_per_request.toFixed(3)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {metrics.cost_trend <= 0 ? (
                                <TrendingDownIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
                            ) : (
                                <TrendingUpIcon sx={{ color: '#f44336', fontSize: 16 }} />
                            )}
                            <Typography sx={{ 
                                color: metrics.cost_trend <= 0 ? '#4CAF50' : '#f44336', 
                                fontSize: '0.75rem' 
                            }}>
                                {metrics.cost_trend <= 0 ? '' : '+'}{metrics.cost_trend.toFixed(1)}%
                            </Typography>
                        </Box>
                    </Box>
                    <Typography sx={{ color: '#666', fontSize: '0.7rem', mt: 1 }}>
                        Total: ${metrics.total_cost.toFixed(2)} ({metrics.total_requests.toLocaleString()} requests)
                    </Typography>
                </Box>

                <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(26, 35, 50, 0.6)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 18 }} />
                        <Typography sx={{ color: '#888', fontSize: '0.8rem' }}>Success Rate</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.5rem' }}>
                            {metrics.success_rate.toFixed(1)}%
                        </Typography>
                        <Chip
                            size="small"
                            icon={<ErrorIcon sx={{ fontSize: 12 }} />}
                            label={`${metrics.error_rate.toFixed(1)}% errors`}
                            sx={{ 
                                height: 18, 
                                fontSize: '0.6rem', 
                                bgcolor: 'rgba(244, 67, 54, 0.1)', 
                                color: '#f44336',
                                '& .MuiChip-icon': { color: '#f44336' }
                            }}
                        />
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={metrics.success_rate} 
                        sx={{ 
                            mt: 1, 
                            height: 4, 
                            borderRadius: 2,
                            bgcolor: 'rgba(76, 175, 80, 0.1)',
                            '& .MuiLinearProgress-bar': { bgcolor: '#4CAF50' }
                        }} 
                    />
                </Box>
            </Box>

            <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(0, 243, 255, 0.03)', 
                borderRadius: '12px',
                border: '1px solid rgba(0, 243, 255, 0.1)',
                mb: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <InfoOutlinedIcon sx={{ color: '#00F3FF', fontSize: 18 }} />
                    <Typography sx={{ color: '#00F3FF', fontWeight: 600, fontSize: '0.9rem' }}>
                        Optimization Insights
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {insights.map((insight) => (
                        <Box 
                            key={insight.id}
                            sx={{ 
                                p: 1.5, 
                                bgcolor: 'rgba(0,0,0,0.2)', 
                                borderRadius: '8px',
                                borderLeft: `3px solid ${
                                    insight.type === 'cost' ? '#4CAF50' :
                                    insight.type === 'quality' ? '#FFD700' :
                                    insight.type === 'speed' ? '#2196F3' : '#f44336'
                                }`
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.85rem' }}>
                                    {insight.title}
                                </Typography>
                                <Chip
                                    label={insight.priority}
                                    size="small"
                                    sx={{
                                        height: 18,
                                        fontSize: '0.6rem',
                                        bgcolor: insight.priority === 'high' ? 'rgba(244, 67, 54, 0.2)' :
                                                insight.priority === 'medium' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                                        color: insight.priority === 'high' ? '#f44336' :
                                               insight.priority === 'medium' ? '#FF9800' : '#4CAF50'
                                    }}
                                />
                            </Box>
                            <Typography sx={{ color: '#888', fontSize: '0.8rem', mb: 0.5 }}>
                                {insight.description}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography sx={{ color: '#666', fontSize: '0.75rem' }}>
                                    {insight.impact}
                                </Typography>
                                {insight.action && (
                                    <Chip
                                        label={insight.action}
                                        size="small"
                                        clickable
                                        sx={{
                                            height: 22,
                                            fontSize: '0.7rem',
                                            bgcolor: 'rgba(0, 243, 255, 0.1)',
                                            color: '#00F3FF',
                                            border: '1px solid rgba(0, 243, 255, 0.2)',
                                            '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.2)' }
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 2 
            }}>
                <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(26, 35, 50, 0.6)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <Typography sx={{ color: '#888', fontSize: '0.8rem', mb: 1.5 }}>
                        User Satisfaction
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ color: '#FFD700', fontWeight: 700, fontSize: '2rem' }}>
                            {metrics.satisfaction_score.toFixed(1)}
                        </Typography>
                        <Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <StarIcon 
                                        key={star}
                                        sx={{ 
                                            fontSize: 20,
                                            color: star <= Math.round(metrics.satisfaction_score) ? '#FFD700' : 'rgba(255,255,255,0.1)'
                                        }} 
                                    />
                                ))}
                            </Box>
                            <Typography sx={{ color: '#666', fontSize: '0.7rem', mt: 0.5 }}>
                                Based on {Math.floor(metrics.total_requests * 0.15)} reviews
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(26, 35, 50, 0.6)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <Typography sx={{ color: '#888', fontSize: '0.8rem', mb: 1.5 }}>
                        Current Configuration
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            label={`Model: ${config.model || 'gpt-4-turbo'}`}
                            size="small"
                            sx={{ 
                                bgcolor: 'rgba(0, 243, 255, 0.1)', 
                                color: '#00F3FF',
                                fontSize: '0.7rem'
                            }}
                        />
                        <Chip
                            label={`Temp: ${config.temperature || 0.7}`}
                            size="small"
                            sx={{ 
                                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                                color: '#FF9800',
                                fontSize: '0.7rem'
                            }}
                        />
                        <Chip
                            label={`Tokens: ${config.max_tokens || 150}`}
                            size="small"
                            sx={{ 
                                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                                color: '#4CAF50',
                                fontSize: '0.7rem'
                            }}
                        />
                        <Chip
                            label={`Top-P: ${config.top_p || 0.9}`}
                            size="small"
                            sx={{ 
                                bgcolor: 'rgba(33, 150, 243, 0.1)', 
                                color: '#2196F3',
                                fontSize: '0.7rem'
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default AgentPerformanceAnalytics;
