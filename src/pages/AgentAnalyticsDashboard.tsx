import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
  AttachMoney as MoneyIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { MetricsCard } from '../components/analytics/MetricsCard';
import { ExecutionTimelineChart } from '../components/analytics/ExecutionTimelineChart';
import { CostBreakdownChart } from '../components/analytics/CostBreakdownChart';
import { AgentComparisonTable } from '../components/analytics/AgentComparisonTable';
import { analyticsService, MetricsSummary, ExecutionTimeline, CostBreakdown, AgentPerformance } from '../services/api/analytics.service';

export const AgentAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [timeline, setTimeline] = useState<ExecutionTimeline[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, timelineData, costData, performanceData] = await Promise.all([
        analyticsService.getMetricsSummary().catch(() => ({
          totalExecutions: 0,
          successRate: 0,
          avgDuration: 0,
          totalCost: 0
        })),
        analyticsService.getExecutionTimeline().catch(() => []),
        analyticsService.getCostBreakdown().catch(() => []),
        analyticsService.getAgentPerformance().catch(() => [])
      ]);

      setSummary(summaryData);
      setTimeline(timelineData);
      setCostBreakdown(costData);
      setAgentPerformance(performanceData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const blob = await analyticsService.exportReport(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-analytics-report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      setError(`Failed to export: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Agent Analytics Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('pdf')}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricsCard
            title="Total Executions"
            value={summary?.totalExecutions || 0}
            icon={<AssessmentIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricsCard
            title="Success Rate"
            value={`${(summary?.successRate || 0).toFixed(1)}%`}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricsCard
            title="Avg Duration"
            value={`${(summary?.avgDuration || 0).toFixed(2)}s`}
            icon={<TimerIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricsCard
            title="Total Cost"
            value={`$${(summary?.totalCost || 0).toFixed(2)}`}
            icon={<MoneyIcon />}
            color="warning"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <ExecutionTimelineChart data={timeline} />
        </Grid>

        <Grid item xs={12} md={4}>
          <CostBreakdownChart data={costBreakdown} />
        </Grid>

        <Grid item xs={12}>
          <AgentComparisonTable data={agentPerformance} />
        </Grid>
      </Grid>
    </Container>
  );
};
