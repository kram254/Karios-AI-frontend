import { stateManager } from './stateManager.service';
import { workflowStateSyncService } from './workflowStateSync.service';

interface RecoveryCheckpoint {
  timestamp: number;
  currentChatId: string | null;
  activeWorkflows: string[];
  pendingMessages: Array<{
    chatId: string;
    content: string;
    role: 'user' | 'assistant';
  }>;
}

class StateRecoveryService {
  private static instance: StateRecoveryService;
  private readonly CHECKPOINT_KEY = 'recovery_checkpoint';
  private readonly CHECKPOINT_VERSION = 1;
  private readonly CHECKPOINT_INTERVAL = 30000;
  private checkpointTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startAutoCheckpoint();
    window.addEventListener('beforeunload', () => this.createCheckpoint());
  }

  static getInstance(): StateRecoveryService {
    if (!StateRecoveryService.instance) {
      StateRecoveryService.instance = new StateRecoveryService();
    }
    return StateRecoveryService.instance;
  }

  private startAutoCheckpoint(): void {
    if (this.checkpointTimer) {
      clearInterval(this.checkpointTimer);
    }

    this.checkpointTimer = setInterval(() => {
      this.createCheckpoint();
    }, this.CHECKPOINT_INTERVAL);
  }

  createCheckpoint(): void {
    try {
      const currentChatId = stateManager.load<string>({
        key: 'current_chat_id',
        version: 1
      });

      const activeWorkflows = workflowStateSyncService
        .getAllActiveWorkflows()
        .map(w => w.chatId);

      const checkpoint: RecoveryCheckpoint = {
        timestamp: Date.now(),
        currentChatId,
        activeWorkflows,
        pendingMessages: []
      };

      stateManager.save(
        {
          key: this.CHECKPOINT_KEY,
          version: this.CHECKPOINT_VERSION
        },
        checkpoint
      );

      console.log('[StateRecovery] Checkpoint created:', {
        currentChat: currentChatId,
        activeWorkflows: activeWorkflows.length
      });
    } catch (error) {
      console.error('[StateRecovery] Failed to create checkpoint:', error);
    }
  }

  getLastCheckpoint(): RecoveryCheckpoint | null {
    return stateManager.load<RecoveryCheckpoint>({
      key: this.CHECKPOINT_KEY,
      version: this.CHECKPOINT_VERSION,
      expiryMs: 24 * 60 * 60 * 1000
    });
  }

  canRecover(): boolean {
    const checkpoint = this.getLastCheckpoint();
    if (!checkpoint) return false;

    const age = Date.now() - checkpoint.timestamp;
    return age < 60 * 60 * 1000;
  }

  async attemptRecovery(): Promise<{
    success: boolean;
    recoveredChatId: string | null;
    recoveredWorkflows: string[];
  }> {
    try {
      const checkpoint = this.getLastCheckpoint();
      if (!checkpoint) {
        return {
          success: false,
          recoveredChatId: null,
          recoveredWorkflows: []
        };
      }

      console.log('[StateRecovery] Attempting recovery from checkpoint:', checkpoint);

      return {
        success: true,
        recoveredChatId: checkpoint.currentChatId,
        recoveredWorkflows: checkpoint.activeWorkflows
      };
    } catch (error) {
      console.error('[StateRecovery] Recovery failed:', error);
      return {
        success: false,
        recoveredChatId: null,
        recoveredWorkflows: []
      };
    }
  }

  clearCheckpoint(): void {
    stateManager.clear(this.CHECKPOINT_KEY);
    console.log('[StateRecovery] Checkpoint cleared');
  }

  destroy(): void {
    if (this.checkpointTimer) {
      clearInterval(this.checkpointTimer);
      this.checkpointTimer = null;
    }
    this.createCheckpoint();
  }
}

export const stateRecoveryService = StateRecoveryService.getInstance();
