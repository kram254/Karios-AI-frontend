import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface MetricsSummary {
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
}

export interface ExecutionTimeline {
  date: string;
  executions: number;
  successes: number;
  failures: number;
}

export interface CostBreakdown {
  agentName: string;
  cost: number;
  executions: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  executions: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
}

export interface ErrorAnalysis {
  errorType: string;
  count: number;
  percentage: number;
}

export const analyticsService = {
  async getMetricsSummary(startDate?: string, endDate?: string): Promise<MetricsSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await axios.get(`${API_BASE_URL}/api/metrics/summary?${params}`);
    return response.data;
  },

  async getExecutionTimeline(startDate?: string, endDate?: string): Promise<ExecutionTimeline[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await axios.get(`${API_BASE_URL}/api/metrics/timeline?${params}`);
    return response.data;
  },

  async getCostBreakdown(): Promise<CostBreakdown[]> {
    const response = await axios.get(`${API_BASE_URL}/api/metrics/cost-breakdown`);
    return response.data;
  },

  async getAgentPerformance(): Promise<AgentPerformance[]> {
    const response = await axios.get(`${API_BASE_URL}/api/metrics/agent-performance`);
    return response.data;
  },

  async getErrorAnalysis(): Promise<ErrorAnalysis[]> {
    const response = await axios.get(`${API_BASE_URL}/api/metrics/error-analysis`);
    return response.data;
  },

  async exportReport(format: 'csv' | 'pdf'): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/api/metrics/export/${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
