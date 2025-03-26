import { ApiService } from './index';
import { SystemHealth, UsageMetrics, Alert, Report } from '../../types/monitoring';

const api = ApiService.getInstance().getApi();

export const monitoringService = {
    // System Health
    getSystemHealth: () =>
        api.get<SystemHealth>('/api/v1/system/health'),

    // Usage Metrics
    getUserUsage: (userId: number) =>
        api.get<UsageMetrics>(`/api/v1/system/usage/${userId}`),

    // Credit System
    getCreditsInfo: (userId: number) =>
        api.get<{
            balance: number;
            usage_history: Array<{
                amount: number;
                timestamp: string;
                type: 'debit' | 'credit';
            }>;
        }>(`/api/v1/system/credits/${userId}`),

    // Performance Metrics
    getPerformanceMetrics: (params: {
        startDate: string;
        endDate: string;
        agentId?: number;
        userId?: number;
    }) =>
        api.get('/api/v1/system/performance', { params }),

    // Alerts
    getAlerts: (userId: number) =>
        api.get<Alert[]>(`/api/v1/system/alerts/${userId}`),

    updateAlertStatus: (alertId: number, status: 'read' | 'unread' | 'archived') =>
        api.put(`/api/v1/system/alerts/${alertId}`, { status }),

    // Reports
    generateReport: (params: {
        type: 'usage' | 'performance' | 'cost';
        startDate: string;
        endDate: string;
        format: 'pdf' | 'csv';
    }) =>
        api.post<Report>('/api/v1/system/reports/generate', params),

    // Cost Analysis
    getCostAnalysis: (params: {
        startDate: string;
        endDate: string;
        groupBy: 'day' | 'week' | 'month';
    }) =>
        api.get('/api/v1/system/cost-analysis', { params }),
};
