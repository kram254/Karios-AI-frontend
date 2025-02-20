export interface SystemHealth {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    timestamp: string;
    metadata: {
        memory: {
            total: number;
            available: number;
            used: number;
        };
        disk: {
            total: number;
            used: number;
            free: number;
        };
    };
}

export interface UsageMetrics {
    total_requests: number;
    total_tokens: number;
    total_cost: number;
    avg_response_time: number;
    success_rate: number;
    distribution: {
        success: number;
        error: number;
        hourly: Record<number, number>;
    };
}

export interface Alert {
    id: number;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
    metadata: Record<string, any>;
}

export interface Report {
    type: 'usage' | 'performance' | 'cost';
    period: {
        start: string;
        end: string;
    };
    data: Record<string, any>;
}

export interface CostAnalysis {
    total_cost: number;
    breakdown: {
        api_calls: number;
        storage: number;
        processing: number;
    };
    trends: {
        daily: Record<string, number>;
        monthly: Record<string, number>;
    };
}
