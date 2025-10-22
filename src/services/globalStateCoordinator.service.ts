import { stateManager } from './stateManager.service';
import { workflowStateSyncService } from './workflowStateSync.service';
import { chatIsolationService } from './chatIsolation.service';
import { websocketStateManager } from './websocketStateManager.service';
import { stateRecoveryService } from './stateRecovery.service';

type StateEventType = 
  | 'chat:switch'
  | 'chat:create'
  | 'chat:delete'
  | 'workflow:start'
  | 'workflow:complete'
  | 'workflow:error'
  | 'state:corrupted'
  | 'state:recovered';

interface StateEvent {
  type: StateEventType;
  chatId: string;
  timestamp: number;
  metadata?: any;
}

class GlobalStateCoordinator {
  private static instance: GlobalStateCoordinator;
  private eventHistory: StateEvent[] = [];
  private maxHistorySize = 100;
  private listeners: Map<StateEventType, Set<(event: StateEvent) => void>> = new Map();

  private constructor() {
    this.initializeRecovery();
    this.setupGlobalHandlers();
  }

  static getInstance(): GlobalStateCoordinator {
    if (!GlobalStateCoordinator.instance) {
      GlobalStateCoordinator.instance = new GlobalStateCoordinator();
    }
    return GlobalStateCoordinator.instance;
  }

  private initializeRecovery(): void {
    if (stateRecoveryService.canRecover()) {
      console.log('[GlobalCoordinator] Recovery available, checking...');
      
      const checkpoint = stateRecoveryService.getLastCheckpoint();
      if (checkpoint) {
        const age = Date.now() - checkpoint.timestamp;
        const ageMinutes = Math.floor(age / 60000);
        
        console.log(`[GlobalCoordinator] Last session: ${ageMinutes} minutes ago`);
        
        if (age < 10 * 60 * 1000) {
          console.log('[GlobalCoordinator] Recent session detected, auto-recovering...');
          this.performAutoRecovery();
        }
      }
    }
  }

  private async performAutoRecovery(): Promise<void> {
    try {
      const result = await stateRecoveryService.attemptRecovery();
      
      if (result.success) {
        console.log('[GlobalCoordinator] ✅ Auto-recovery successful');
        this.emitEvent({
          type: 'state:recovered',
          chatId: result.recoveredChatId || 'unknown',
          timestamp: Date.now(),
          metadata: {
            workflows: result.recoveredWorkflows.length
          }
        });
      }
    } catch (error) {
      console.error('[GlobalCoordinator] Auto-recovery failed:', error);
    }
  }

  private setupGlobalHandlers(): void {
    window.addEventListener('beforeunload', () => {
      stateRecoveryService.createCheckpoint();
      this.persistAllState();
    });

    window.addEventListener('online', () => {
      console.log('[GlobalCoordinator] Network restored, syncing state...');
      this.syncAfterReconnect();
    });

    window.addEventListener('offline', () => {
      console.warn('[GlobalCoordinator] Network lost, state will persist locally');
    });
  }

  private persistAllState(): void {
    const activeChatId = chatIsolationService.getActiveChatId();
    
    if (activeChatId) {
      stateManager.save(
        { key: 'last_active_chat', version: 1 },
        activeChatId
      );
    }

    console.log('[GlobalCoordinator] All state persisted');
  }

  private syncAfterReconnect(): void {
    const activeWorkflows = workflowStateSyncService.getAllActiveWorkflows();
    
    activeWorkflows.forEach(workflow => {
      if (workflow.status === 'active') {
        console.log('[GlobalCoordinator] Re-syncing active workflow:', workflow.taskId.slice(0, 8));
      }
    });
  }

  emitEvent(event: StateEvent): void {
    this.eventHistory.push(event);
    
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('[GlobalCoordinator] Listener error:', error);
        }
      });
    }

    console.log(`[GlobalCoordinator] Event: ${event.type} for chat ${event.chatId.slice(0, 8)}`);
  }

  on(eventType: StateEventType, listener: (event: StateEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    return () => {
      const typeListeners = this.listeners.get(eventType);
      if (typeListeners) {
        typeListeners.delete(listener);
      }
    };
  }

  getChatTransitionHistory(chatId: string): StateEvent[] {
    return this.eventHistory.filter(
      event => event.chatId === chatId && event.type === 'chat:switch'
    );
  }

  getWorkflowEvents(chatId: string): StateEvent[] {
    return this.eventHistory.filter(
      event => event.chatId === chatId && event.type.startsWith('workflow:')
    );
  }

  async synchronizeState(chatId: string): Promise<void> {
    console.log('[GlobalCoordinator] Synchronizing state for chat:', chatId.slice(0, 8));

    const memoryState = chatIsolationService.getSnapshot(chatId);
    const persistedState = workflowStateSyncService.getWorkflowState(chatId);

    if (memoryState && persistedState) {
      const memoryNewer = memoryState.lastActivity > persistedState.lastUpdate;
      
      if (memoryNewer) {
        workflowStateSyncService.saveWorkflowState(chatId, {
          chatId,
          taskId: memoryState.activeTaskId!,
          status: memoryState.automationActive ? 'active' : 'paused',
          workflows: memoryState.workflows,
          showBrowser: memoryState.showBrowser,
          browserTask: memoryState.browserTask,
          automationActive: memoryState.automationActive,
          pendingTask: memoryState.pendingTask,
          lastUpdate: memoryState.lastActivity
        });
        
        console.log('[GlobalCoordinator] Synced memory -> localStorage for chat:', chatId.slice(0, 8));
      }
    }
  }

  getSystemHealthSnapshot(): {
    coordinator: string;
    isolation: any;
    workflows: any;
    websockets: any;
    storage: any;
  } {
    return {
      coordinator: 'operational',
      isolation: chatIsolationService.getStats(),
      workflows: workflowStateSyncService.getStatsSummary(),
      websockets: websocketStateManager.getStats(),
      storage: stateManager.getStorageStats()
    };
  }

  async performFullStateAudit(): Promise<void> {
    console.log('[GlobalCoordinator] 🔍 Performing full state audit...');

    const snapshot = this.getSystemHealthSnapshot();
    console.log('[GlobalCoordinator] System snapshot:', snapshot);

    const activeChatId = chatIsolationService.getActiveChatId();
    if (activeChatId) {
      await this.synchronizeState(activeChatId);
    }

    chatIsolationService.cleanupInactiveChats();

    console.log('[GlobalCoordinator] ✅ Audit complete');
  }
}

export const globalStateCoordinator = GlobalStateCoordinator.getInstance();

if (typeof window !== 'undefined') {
  (window as any).__globalStateCoordinator = globalStateCoordinator;
  (window as any).getSystemHealth = () => globalStateCoordinator.getSystemHealthSnapshot();
  (window as any).auditState = () => globalStateCoordinator.performFullStateAudit();
}
