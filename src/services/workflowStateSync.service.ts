import { stateManager } from './stateManager.service';

interface WorkflowState {
  chatId: string;
  taskId: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  workflows: Record<string, any>;
  showBrowser: boolean;
  browserTask: string;
  automationActive: boolean;
  pendingTask: string | null;
  lastUpdate: number;
}

interface SyncedWorkflowStates {
  [chatId: string]: WorkflowState;
}

class WorkflowStateSyncService {
  private static instance: WorkflowStateSyncService;
  private states: SyncedWorkflowStates = {};
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_KEY = 'workflow_states';
  private readonly SYNC_VERSION = 1;
  private readonly SYNC_INTERVAL_MS = 5000;
  private readonly STATE_EXPIRY_MS = 24 * 60 * 60 * 1000;

  private constructor() {
    this.loadFromStorage();
    this.startPeriodicSync();
  }

  static getInstance(): WorkflowStateSyncService {
    if (!WorkflowStateSyncService.instance) {
      WorkflowStateSyncService.instance = new WorkflowStateSyncService();
    }
    return WorkflowStateSyncService.instance;
  }

  private loadFromStorage(): void {
    const stored = stateManager.load<SyncedWorkflowStates>({
      key: this.SYNC_KEY,
      version: this.SYNC_VERSION,
      expiryMs: this.STATE_EXPIRY_MS
    });
    
    if (stored) {
      this.states = stored;
      this.cleanupExpiredStates();
      console.log('[WorkflowStateSync] Loaded states for', Object.keys(this.states).length, 'chats');
    }
  }

  private saveToStorage(): void {
    stateManager.save(
      {
        key: this.SYNC_KEY,
        version: this.SYNC_VERSION
      },
      this.states
    );
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      this.saveToStorage();
      this.cleanupExpiredStates();
    }, this.SYNC_INTERVAL_MS);
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    const expired: string[] = [];
    
    Object.entries(this.states).forEach(([chatId, state]) => {
      const age = now - state.lastUpdate;
      if (age > this.STATE_EXPIRY_MS) {
        expired.push(chatId);
      }
    });
    
    if (expired.length > 0) {
      expired.forEach(chatId => delete this.states[chatId]);
      console.log('[WorkflowStateSync] Cleaned up', expired.length, 'expired states');
    }
  }

  saveWorkflowState(chatId: string, state: Partial<WorkflowState>): void {
    this.states[chatId] = {
      ...this.states[chatId],
      chatId,
      ...state,
      lastUpdate: Date.now()
    } as WorkflowState;
    
    this.saveToStorage();
    console.log('[WorkflowStateSync] Saved state for chat:', chatId);
  }

  getWorkflowState(chatId: string): WorkflowState | null {
    return this.states[chatId] || null;
  }

  hasActiveWorkflow(chatId: string): boolean {
    const state = this.states[chatId];
    return state ? state.status === 'active' && !!state.taskId : false;
  }

  getAllActiveWorkflows(): WorkflowState[] {
    return Object.values(this.states).filter(
      state => state.status === 'active'
    );
  }

  updateWorkflowStatus(chatId: string, status: WorkflowState['status']): void {
    if (this.states[chatId]) {
      this.states[chatId].status = status;
      this.states[chatId].lastUpdate = Date.now();
      this.saveToStorage();
      console.log(`[WorkflowStateSync] Updated status for chat ${chatId} to ${status}`);
    }
  }

  clearWorkflowState(chatId: string): void {
    delete this.states[chatId];
    this.saveToStorage();
    console.log('[WorkflowStateSync] Cleared state for chat:', chatId);
  }

  clearAllStates(): void {
    this.states = {};
    this.saveToStorage();
    console.log('[WorkflowStateSync] Cleared all workflow states');
  }

  getStatsSummary(): {
    total: number;
    active: number;
    paused: number;
    completed: number;
    failed: number;
  } {
    const stats = {
      total: 0,
      active: 0,
      paused: 0,
      completed: 0,
      failed: 0
    };

    Object.values(this.states).forEach(state => {
      stats.total++;
      stats[state.status]++;
    });

    return stats;
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.saveToStorage();
  }
}

export const workflowStateSyncService = WorkflowStateSyncService.getInstance();
