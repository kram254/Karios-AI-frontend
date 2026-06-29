import { api } from '../api';

export interface HITLLock {
  lock_id: string;
  execution_id: string;
  node_id: string;
  prompt: string;
  context?: Record<string, any>;
  status: 'pending' | 'locked' | 'approved' | 'rejected' | 'expired' | 'released';
  created_at: string;
  expires_at?: string;
  resolved_at?: string;
  resolution_data?: Record<string, any>;
}

export interface HITLCreateRequest {
  execution_id: string;
  node_id: string;
  prompt: string;
  context?: Record<string, any>;
  timeout_seconds?: number;
}

export interface HITLResolveRequest {
  lock_id: string;
  approved: boolean;
  data?: Record<string, any>;
  reason?: string;
}

export interface HITLGateConfig {
  enabled: boolean;
  timeout_seconds?: number;
  auto_approve?: boolean;
  require_reason_on_reject?: boolean;
}

class HITLService {
  async createLock(request: HITLCreateRequest): Promise<HITLLock> {
    const response = await api.post('/api/v1/sumi/hitl/create', {
      timeout_seconds: 300,
      ...request
    });
    return response.data;
  }

  async resolve(request: HITLResolveRequest): Promise<HITLLock> {
    const response = await api.post('/api/v1/sumi/hitl/resolve', request);
    return response.data;
  }

  async approve(lockId: string, data?: Record<string, any>): Promise<HITLLock> {
    return this.resolve({ lock_id: lockId, approved: true, data });
  }

  async reject(lockId: string, reason?: string): Promise<HITLLock> {
    return this.resolve({ lock_id: lockId, approved: false, reason });
  }

  async getLock(lockId: string): Promise<HITLLock> {
    const response = await api.get(`/api/v1/sumi/hitl/${lockId}`);
    return response.data;
  }

  async getExecutionLocks(executionId: string): Promise<{ execution_id: string; locks: HITLLock[] }> {
    const response = await api.get(`/api/v1/sumi/hitl/execution/${executionId}`);
    return response.data;
  }

  async pollForPendingLocks(
    executionId: string,
    onLockFound: (locks: HITLLock[]) => void,
    interval: number = 1000,
    timeout: number = 300000
  ): Promise<HITLLock[]> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const result = await this.getExecutionLocks(executionId);
          const pendingLocks = result.locks.filter(
            l => l.status === 'locked'
          );

          if (pendingLocks.length > 0) {
            onLockFound(pendingLocks);
            resolve(pendingLocks);
            return;
          }

          if (Date.now() - startTime > timeout) {
            resolve([]);
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

  async waitForResolution(
    lockId: string,
    interval: number = 500,
    timeout: number = 300000
  ): Promise<HITLLock | null> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const lock = await this.getLock(lockId);

          if (['approved', 'rejected', 'expired'].includes(lock.status)) {
            resolve(lock);
            return;
          }

          if (Date.now() - startTime > timeout) {
            resolve(null);
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

export const hitlService = new HITLService();
