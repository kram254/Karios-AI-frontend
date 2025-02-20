import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Chip,
    Grid,
    LinearProgress,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    PauseCircle as PauseCircleIcon
} from '@mui/icons-material';
import { Agent, AgentStatus, AgentMetrics } from '../../types/agent';
import { StatCard } from '../shared/StatCard';

interface AgentStatusMonitorProps {
    agent: Agent;
    onRefresh: () => Promise<void>;
}

export const AgentStatusMonitor: React.FC<AgentStatusMonitorProps> = ({
    agent,
    onRefresh
}) => {
    const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
    const [loading, setLoading] = useState(false);

    const getStatusColor = (status: AgentStatus) => {
        switch (status) {
            case AgentStatus.ACTIVE:
                return '#4CAF50';
            case AgentStatus.INACTIVE:
                return '#9E9E9E';
            case AgentStatus.MAINTENANCE:
                return '#FFC107';
            case AgentStatus.ERROR:
                return '#F44336';
            default:
                return '#9E9E9E';
        }
    };

    const getStatusIcon = (status: AgentStatus) => {
        switch (status) {
            case AgentStatus.ACTIVE:
                return <CheckCircleIcon />;
            case AgentStatus.INACTIVE:
                return <PauseCircleIcon />;
            case AgentStatus.MAINTENANCE:
                return <WarningIcon />;
            case AgentStatus.ERROR:
                return <ErrorIcon />;
            default:
                return <PauseCircleIcon />;
        }
    };

    const handleRefresh = async () => {
        setLoading(true);
        try {
            await onRefresh();
            // Assuming metrics are updated through props or context
        } catch (error) {
            console.error('Error refreshing agent status:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper 
            sx={{ 
                bgcolor: '#1A1A1A',
                color: '#FFFFFF',
                border: '1px solid rgba(0, 243, 255, 0.2)',
                p: 3
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    Agent Status Monitor
                </Typography>
                <Tooltip title="Refresh Status">
                    <IconButton 
                        onClick={handleRefresh}
                        disabled={loading}
                        sx={{ color: '#00F3FF' }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {loading && (
                <LinearProgress 
                    sx={{ 
                        mb: 2,
                        bgcolor: 'rgba(0, 243, 255, 0.2)',
                        '& .MuiLinearProgress-bar': {
                            bgcolor: '#00F3FF'
                        }
                    }} 
                />
            )}

            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="subtitle1">Current Status:</Typography>
                    <Chip
                        icon={getStatusIcon(agent.status)}
                        label={agent.status}
                        sx={{
                            bgcolor: `${getStatusColor(agent.status)}20`,
                            color: getStatusColor(agent.status),
                            '& .MuiChip-icon': {
                                color: getStatusColor(agent.status)
                            }
                        }}
                    />
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Last Active: {new Date(agent.last_active).toLocaleString()}
                </Typography>
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Success Rate"
                        value={`${metrics?.success_rate.toFixed(1)}%`}
                        icon={<CheckCircleIcon />}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Requests"
                        value={metrics?.total_requests || 0}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Avg Response Time"
                        value={`${metrics?.avg_response_time.toFixed(2)}ms`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Tokens"
                        value={metrics?.total_tokens || 0}
                    />
                </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Configuration Summary
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                            Model
                        </Typography>
                        <Typography variant="body1">
                            {agent.config.model}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                            Temperature
                        </Typography>
                        <Typography variant="body1">
                            {agent.config.temperature}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                            Language
                        </Typography>
                        <Typography variant="body1">
                            {agent.config.language.toUpperCase()}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                            Style
                        </Typography>
                        <Typography variant="body1">
                            {agent.config.response_style}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
};
