import { api } from '../api';

export interface FlowNode {
  id: string;
  type?: string;
  data: {
    nodeType: string;
    config: Record<string, any>;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface FlowExecutionRequest {
  workflow_id: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  input_data?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface FlowExecutionResponse {
  execution_id: string;
  status: string;
  created_at: string;
}

export interface NodeResult {
  status: string;
  output?: any;
  error?: string;
}

export interface FlowExecutionStatus {
  execution_id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  results: Record<string, NodeResult>;
  current_node_id?: string;
  error_message?: string;
}

export interface FlowEvent {
  id: string;
  type: string;
  node_id?: string;
  data: any;
  timestamp: string;
}

class FlowEngineService {
  async executeFlow(request: FlowExecutionRequest): Promise<FlowExecutionResponse> {
    const response = await api.post('/api/v1/sumi/flow/execute', request);
    return response.data;
  }

  async getExecution(executionId: string): Promise<FlowExecutionStatus> {
    const response = await api.get(`/api/v1/sumi/flow/${executionId}`);
    return response.data;
  }

  async pauseExecution(executionId: string): Promise<{ status: string }> {
    const response = await api.post(`/api/v1/sumi/flow/${executionId}/pause`);
    return response.data;
  }

  async resumeExecution(executionId: string): Promise<FlowExecutionStatus> {
    const response = await api.post(`/api/v1/sumi/flow/${executionId}/resume`);
    return response.data;
  }

  async cancelExecution(executionId: string): Promise<{ status: string }> {
    const response = await api.post(`/api/v1/sumi/flow/${executionId}/cancel`);
    return response.data;
  }

  async getEvents(executionId: string, eventType?: string): Promise<{ execution_id: string; events: FlowEvent[] }> {
    const params = eventType ? { event_type: eventType } : {};
    const response = await api.get(`/api/v1/sumi/flow/${executionId}/events`, { params });
    return response.data;
  }

  connectWebSocket(executionId: string): WebSocket {
    const wsUrl = api.defaults.baseURL?.replace('http', 'ws') || '';
    return new WebSocket(`${wsUrl}/api/v1/sumi/flow/${executionId}/stream`);
  }

  async pollExecution(
    executionId: string,
    onUpdate: (status: FlowExecutionStatus) => void,
    interval: number = 1000,
    timeout: number = 300000
  ): Promise<FlowExecutionStatus> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getExecution(executionId);
          onUpdate(status);

          if (['completed', 'failed', 'cancelled'].includes(status.status)) {
            resolve(status);
            return;
          }

          if (Date.now() - startTime > timeout) {
            reject(new Error('Polling timeout'));
            return;
          }

          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

export const flowEngineService = new FlowEngineService();
