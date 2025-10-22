interface ChatState {
  chatId: string;
  workflows: Record<string, any>;
  activeTaskId: string | null;
  showBrowser: boolean;
  browserTask: string;
  automationActive: boolean;
  pendingTask: string | null;
  messageInput: string;
  uploadedImages: any[];
  lastActivity: number;
}

class ChatIsolationService {
  private static instance: ChatIsolationService;
  private activeChatId: string | null = null;
  private transitionInProgress: boolean = false;
  private stateSnapshot: Map<string, ChatState> = new Map();

  private constructor() {}

  static getInstance(): ChatIsolationService {
    if (!ChatIsolationService.instance) {
      ChatIsolationService.instance = new ChatIsolationService();
    }
    return ChatIsolationService.instance;
  }

  startTransition(fromChatId: string | null, toChatId: string): boolean {
    if (this.transitionInProgress) {
      console.warn('[ChatIsolation] Transition already in progress, blocking concurrent transition');
      return false;
    }

    console.log('[ChatIsolation] Starting transition:', fromChatId?.slice(0, 8) || 'none', '->', toChatId.slice(0, 8));
    this.transitionInProgress = true;
    this.activeChatId = toChatId;
    return true;
  }

  endTransition(): void {
    this.transitionInProgress = false;
    console.log('[ChatIsolation] Transition complete for chat:', this.activeChatId?.slice(0, 8));
  }

  isTransitioning(): boolean {
    return this.transitionInProgress;
  }

  getActiveChatId(): string | null {
    return this.activeChatId;
  }

  snapshotState(chatId: string, state: Partial<ChatState>): void {
    const existingState = this.stateSnapshot.get(chatId);
    const mergedState: ChatState = {
      chatId,
      workflows: state.workflows || {},
      activeTaskId: state.activeTaskId || null,
      showBrowser: state.showBrowser || false,
      browserTask: state.browserTask || '',
      automationActive: state.automationActive || false,
      pendingTask: state.pendingTask || null,
      messageInput: state.messageInput || '',
      uploadedImages: state.uploadedImages || [],
      lastActivity: Date.now(),
      ...existingState
    };

    this.stateSnapshot.set(chatId, mergedState);
    console.log('[ChatIsolation] State snapshot saved for chat:', chatId.slice(0, 8));
  }

  getSnapshot(chatId: string): ChatState | null {
    return this.stateSnapshot.get(chatId) || null;
  }

  clearSnapshot(chatId: string): void {
    this.stateSnapshot.delete(chatId);
    console.log('[ChatIsolation] State snapshot cleared for chat:', chatId.slice(0, 8));
  }

  hasActiveWorkflow(chatId: string): boolean {
    const snapshot = this.stateSnapshot.get(chatId);
    return !!(snapshot?.activeTaskId && Object.keys(snapshot.workflows).length > 0);
  }

  validateStateIntegrity(chatId: string, state: any): boolean {
    if (!chatId) {
      console.error('[ChatIsolation] Invalid chatId provided');
      return false;
    }

    if (state.activeTaskId && !state.workflows) {
      console.error('[ChatIsolation] Inconsistent state: activeTaskId without workflows');
      return false;
    }

    if (Object.keys(state.workflows || {}).length > 0 && !state.activeTaskId) {
      console.warn('[ChatIsolation] Workflows exist but no activeTaskId');
    }

    return true;
  }

  cleanupInactiveChats(maxAge: number = 30 * 60 * 1000): void {
    const now = Date.now();
    const toRemove: string[] = [];

    this.stateSnapshot.forEach((state, chatId) => {
      if (chatId !== this.activeChatId && (now - state.lastActivity) > maxAge) {
        toRemove.push(chatId);
      }
    });

    toRemove.forEach(chatId => {
      this.stateSnapshot.delete(chatId);
      console.log('[ChatIsolation] Cleaned up inactive chat:', chatId.slice(0, 8));
    });

    if (toRemove.length > 0) {
      console.log('[ChatIsolation] Cleanup complete:', toRemove.length, 'inactive chats removed');
    }
  }

  getStats(): {
    activeChatId: string | null;
    snapshotCount: number;
    transitioning: boolean;
    chatsWithWorkflows: number;
  } {
    let chatsWithWorkflows = 0;
    this.stateSnapshot.forEach(state => {
      if (this.hasActiveWorkflow(state.chatId)) {
        chatsWithWorkflows++;
      }
    });

    return {
      activeChatId: this.activeChatId,
      snapshotCount: this.stateSnapshot.size,
      transitioning: this.transitionInProgress,
      chatsWithWorkflows
    };
  }
}

export const chatIsolationService = ChatIsolationService.getInstance();

setInterval(() => {
  chatIsolationService.cleanupInactiveChats();
}, 5 * 60 * 1000);
