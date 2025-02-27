import { ApiService } from './index';
import { SystemHealth, UsageMetrics, Alert, Report } from '../../types/monitoring';

const api = ApiService.getInstance().getApi();

export const monitoringService = {
    // System Health
    getSystemHealth: () =>
        api.get<SystemHealth>('/system/health'),

    // Usage Metrics
    getUserUsage: (userId: number) =>
        api.get<UsageMetrics>(`/system/usage/${userId}`),

    // Credit System
    getCreditsInfo: (userId: number) =>
        api.get<{
            balance: number;
            usage_history: Array<{
                amount: number;
                timestamp: string;
                type: 'debit' | 'credit';
            }>;
        }>(`/system/credits/${userId}`),

    // Performance Metrics
    getPerformanceMetrics: (params: {
        startDate: string;
        endDate: string;
        agentId?: number;
        userId?: number;
    }) =>
        api.get('/system/performance', { params }),

    // Alerts
    getAlerts: (userId: number) =>
        api.get<Alert[]>(`/system/alerts/${userId}`),

    updateAlertStatus: (alertId: number, status: 'read' | 'unread' | 'archived') =>
        api.put(`/system/alerts/${alertId}`, { status }),

    // Reports
    generateReport: (params: {
        type: 'usage' | 'performance' | 'cost';
        startDate: string;
        endDate: string;
        format: 'pdf' | 'csv';
    }) =>
        api.post<Report>('/system/reports/generate', params),

    // Cost Analysis
    getCostAnalysis: (params: {
        startDate: string;
        endDate: string;
        groupBy: 'day' | 'week' | 'month';
    }) =>
        api.get('/system/cost-analysis', { params }),
};
