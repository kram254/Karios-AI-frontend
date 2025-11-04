import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { TrendingUp, TrendingDown, Activity, Clock, CheckCircle, XCircle, Zap, DollarSign } from 'lucide-react';
import axios from 'axios';

interface MetricsData {
  successRate: any;
  performance: any;
  resourceUtilization: any;
  costAnalysis: any;
  failurePrediction: any;
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const [successRate, performance, resources, cost] = await Promise.all([
        axios.get('/api/metrics/success-rate'),
        axios.get('/api/metrics/performance'),
        axios.get('/api/metrics/resource-utilization'),
        axios.get('/api/metrics/cost-analysis')
      ]);

      setMetrics({
        successRate: successRate.data,
        performance: performance.data,
        resourceUtilization: resources.data,
        costAnalysis: cost.data,
        failurePrediction: null
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#0a0a0a' }}>
        <Activity size={32} color="#8b5cf6" style={{ animation: 'pulse 2s infinite' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#0a0a0a', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
        Intelligence Metrics Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Success Rate
                </Typography>
                <CheckCircle size={20} color="#10b981" />
              </Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 600 }}>
                {metrics.successRate.success_rate?.toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {metrics.successRate.success_count} / {metrics.successRate.total_count} executions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Avg Duration
                </Typography>
                <Clock size={20} color="#3b82f6" />
              </Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 600 }}>
                {(metrics.performance.average_duration / 60).toFixed(1)}m
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Median: {(metrics.performance.median_duration / 60).toFixed(1)}m
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  CPU Usage
                </Typography>
                <Zap size={20} color="#f59e0b" />
              </Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 600 }}>
                {metrics.resourceUtilization.average_cpu_percent?.toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Peak: {metrics.resourceUtilization.peak_cpu_percent?.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Total Cost
                </Typography>
                <DollarSign size={20} color="#8b5cf6" />
              </Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 600 }}>
                ${metrics.costAnalysis.total_cost?.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                ${metrics.costAnalysis.cost_per_execution?.toFixed(3)} per run
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid rgba(139, 92, 246, 0.2)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Performance Metrics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Min Duration
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#10b981' }}>
                      {(metrics.performance.min_duration / 60).toFixed(2)}m
                    </Typography>
                  </Box>
                  <Box sx={{ height: 4, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <Box sx={{ width: '30%', height: '100%', bgcolor: '#10b981', borderRadius: 2 }} />
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Max Duration
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ef4444' }}>
                      {(metrics.performance.max_duration / 60).toFixed(2)}m
                    </Typography>
                  </Box>
                  <Box sx={{ height: 4, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <Box sx={{ width: '100%', height: '100%', bgcolor: '#ef4444', borderRadius: 2 }} />
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Std Deviation
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#f59e0b' }}>
                      {(metrics.performance.std_deviation / 60).toFixed(2)}m
                    </Typography>
                  </Box>
                  <Box sx={{ height: 4, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <Box sx={{ width: '65%', height: '100%', bgcolor: '#f59e0b', borderRadius: 2 }} />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid rgba(139, 92, 246, 0.2)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Resource Utilization
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1, display: 'block' }}>
                    Memory Usage
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1, height: 8, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
                      <Box 
                        sx={{ 
                          width: `${(metrics.resourceUtilization.average_memory_mb / metrics.resourceUtilization.peak_memory_mb * 100)}%`, 
                          height: '100%', 
                          bgcolor: 'linear-gradient(90deg, #8b5cf6, #6366f1)', 
                          borderRadius: 4,
                          background: 'linear-gradient(90deg, #8b5cf6, #6366f1)'
                        }} 
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'white', minWidth: 60 }}>
                      {metrics.resourceUtilization.average_memory_mb?.toFixed(0)} MB
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1, display: 'block' }}>
                    Active Sessions
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#8b5cf6' }}>
                    {metrics.resourceUtilization.average_active_sessions?.toFixed(0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
