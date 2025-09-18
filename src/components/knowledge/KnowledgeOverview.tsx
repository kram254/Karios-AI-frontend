import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    TextField,
    InputAdornment,
    CircularProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    Storage as StorageIcon,
    Language as LanguageIcon
} from '@mui/icons-material';
import { progressService } from '../../services/api/progress.service';

export const KnowledgeOverview: React.FC = () => {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            const response = await progressService.getKnowledgeMetrics();
            setMetrics(response.data);
        } catch (error) {
            console.error('Failed to load metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#00F3FF' }} />
        </Box>;
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'rgba(15, 23, 42, 0.9)' }}>
            <Typography variant="h4" sx={{ color: '#00F3FF', mb: 3 }}>
                Knowledge Base Overview
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.8)' }}>
                        <CardContent>
                            <Typography variant="h4" sx={{ color: '#00F3FF' }}>
                                {metrics?.total_sources || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Total Sources
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.8)' }}>
                        <CardContent>
                            <Typography variant="h4" sx={{ color: '#00F3FF' }}>
                                {metrics?.url_sources || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                URL Sources
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.8)' }}>
                        <CardContent>
                            <Typography variant="h4" sx={{ color: '#00F3FF' }}>
                                {metrics?.active_crawls || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Active Crawls
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};
