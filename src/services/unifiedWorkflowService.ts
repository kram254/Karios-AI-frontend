interface WorkflowState {
  chatId: string;
  taskId: string;
  status: 'active' | 'paused' | 'completed' | 'failed' | 'initializing';
  workflows: Record<string, any>;
  showBrowser: boolean;
  browserTask: string;
  automationActive: boolean;
  pendingTask: string | null;
  messageInput: string;
  uploadedImages: any[];
  lastUpdate: number;
}

interface TransitionState {
  fromChatId: string | null;
  toChatId: string;
  startTime: number;
  inProgress: boolean;
}

interface WorkflowEvent {
  type: 'chat:switch' | 'workflow:start' | 'workflow:complete' | 'workflow:error' | 'state:update';
  chatId: string;
  taskId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

type EventCallback = (event: WorkflowEvent) => void;

class UnifiedWorkflowService {
  private static instance: UnifiedWorkflowService;
  private states: Map<string, WorkflowState> = new Map();
  private activeChatId: string | null = null;
  private transition: TransitionState | null = null;
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  
  private readonly STORAGE_KEY = 'unified_workflow_states';
  private readonly STORAGE_VERSION = 2;
  private readonly SYNC_INTERVAL_MS = 5000;
  private readonly STATE_EXPIRY_MS = 24 * 60 * 60 * 1000;
  private readonly TRANSITION_TIMEOUT_MS = 5000;

  private constructor() {
    this.loadFromStorage();
    this.startPeriodicSync();
    this.setupWindowEvents();
  }

  static getInstance(): UnifiedWorkflowService {
    if (!UnifiedWorkflowService.instance) {
      UnifiedWorkflowService.instance = new UnifiedWorkflowService();
    }
    return UnifiedWorkflowService.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === this.STORAGE_VERSION) {
          Object.entries(parsed.states || {}).forEach(([chatId, state]) => {
            this.states.set(chatId, state as WorkflowState);
          });
          this.activeChatId = parsed.activeChatId || null;
          this.cleanupExpiredStates();
        }
      }
    } catch (error) {
      console.error('[UnifiedWorkflow] Failed to load from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        version: this.STORAGE_VERSION,
        activeChatId: this.activeChatId,
        states: Object.fromEntries(this.states),
        savedAt: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[UnifiedWorkflow] Failed to save to storage:', error);
    }
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.syncInterval = setInterval(() => {
      this.saveToStorage();
      this.cleanupExpiredStates();
      this.checkTransitionTimeout();
    }, this.SYNC_INTERVAL_MS);
  }

  private setupWindowEvents(): void {
    window.addEventListener('beforeunload', () => {
      this.saveToStorage();
    });
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    const expired: string[] = [];
    
    this.states.forEach((state, chatId) => {
      if (chatId !== this.activeChatId && (now - state.lastUpdate) > this.STATE_EXPIRY_MS) {
        expired.push(chatId);
      }
    });
    
    expired.forEach(chatId => {
      this.states.delete(chatId);
    });
  }

  private checkTransitionTimeout(): void {
    if (this.transition?.inProgress) {
      const elapsed = Date.now() - this.transition.startTime;
      if (elapsed > this.TRANSITION_TIMEOUT_MS) {
        console.warn('[UnifiedWorkflow] Transition timeout, forcing completion');
        this.endTransition();
      }
    }
  }

  startTransition(fromChatId: string | null, toChatId: string): boolean {
    if (this.transition?.inProgress) {
      console.warn('[UnifiedWorkflow] Transition already in progress');
      return false;
    }

    this.transition = {
      fromChatId,
      toChatId,
      startTime: Date.now(),
      inProgress: true
    };

    this.activeChatId = toChatId;
    return true;
  }

  endTransition(): void {
    if (this.transition) {
      this.emitEvent({
        type: 'chat:switch',
        chatId: this.transition.toChatId,
        timestamp: Date.now(),
        metadata: {
          fromChatId: this.transition.fromChatId,
          duration: Date.now() - this.transition.startTime
        }
      });
    }
    this.transition = null;
  }

  isTransitioning(): boolean {
    return this.transition?.inProgress || false;
  }

  getActiveChatId(): string | null {
    return this.activeChatId;
  }

  saveState(chatId: string, state: Partial<WorkflowState>): void {
    const existing = this.states.get(chatId) || {
      chatId,
      taskId: '',
      status: 'initializing' as const,
      workflows: {},
      showBrowser: false,
      browserTask: '',
      automationActive: false,
      pendingTask: null,
      messageInput: '',
      uploadedImages: [],
      lastUpdate: Date.now()
    };

    const merged: WorkflowState = {
      ...existing,
      ...state,
      chatId,
      lastUpdate: Date.now()
    };

    this.states.set(chatId, merged);
    this.saveToStorage();

    this.emitEvent({
      type: 'state:update',
      chatId,
      taskId: merged.taskId,
      timestamp: Date.now()
    });
  }

  getState(chatId: string): WorkflowState | null {
    return this.states.get(chatId) || null;
  }

  clearState(chatId: string): void {
    this.states.delete(chatId);
    this.saveToStorage();
  }

  hasActiveWorkflow(chatId: string): boolean {
    const state = this.states.get(chatId);
    return !!(state?.taskId && state.status === 'active' && Object.keys(state.workflows).length > 0);
  }

  getAllActiveWorkflows(): WorkflowState[] {
    return Array.from(this.states.values()).filter(
      state => state.status === 'active'
    );
  }

  updateWorkflowStatus(chatId: string, status: WorkflowState['status']): void {
    const state = this.states.get(chatId);
    if (state) {
      state.status = status;
      state.lastUpdate = Date.now();
      this.states.set(chatId, state);
      this.saveToStorage();
    }
  }

  validateStateIntegrity(chatId: string, state: Partial<WorkflowState>): boolean {
    if (!chatId) {
      return false;
    }

    if (state.taskId && !state.workflows) {
      return false;
    }

    return true;
  }

  on(eventType: WorkflowEvent['type'], callback: EventCallback): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);

    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  emitEvent(event: WorkflowEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('[UnifiedWorkflow] Event listener error:', error);
        }
      });
    }

    window.dispatchEvent(new CustomEvent('workflow:event', { detail: event }));
  }

  getStats(): {
    activeChatId: string | null;
    totalStates: number;
    activeWorkflows: number;
    isTransitioning: boolean;
  } {
    return {
      activeChatId: this.activeChatId,
      totalStates: this.states.size,
      activeWorkflows: this.getAllActiveWorkflows().length,
      isTransitioning: this.isTransitioning()
    };
  }

  runIntegrityCheck(): {
    health: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let healthScore = 100;

    this.states.forEach((state, chatId) => {
      if (state.taskId && Object.keys(state.workflows).length === 0) {
        issues.push(`Chat ${chatId.slice(0, 8)}: taskId without workflows`);
        healthScore -= 10;
      }

      if (state.automationActive && !state.showBrowser && !state.browserTask) {
        issues.push(`Chat ${chatId.slice(0, 8)}: automation active without browser state`);
        healthScore -= 5;
      }

      const age = Date.now() - state.lastUpdate;
      if (age > 60 * 60 * 1000) {
        issues.push(`Chat ${chatId.slice(0, 8)}: stale state (${Math.round(age / 60000)}min old)`);
        healthScore -= 2;
      }
    });

    if (this.transition?.inProgress) {
      const elapsed = Date.now() - this.transition.startTime;
      if (elapsed > 2000) {
        issues.push(`Long running transition: ${elapsed}ms`);
        healthScore -= 5;
      }
    }

    return {
      health: Math.max(0, healthScore),
      issues
    };
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.saveToStorage();
    this.eventListeners.clear();
  }
}

export const unifiedWorkflowService = UnifiedWorkflowService.getInstance();

if (typeof window !== 'undefined') {
  (window as any).unifiedWorkflowService = unifiedWorkflowService;
  (window as any).checkWorkflowHealth = () => unifiedWorkflowService.runIntegrityCheck();
}
