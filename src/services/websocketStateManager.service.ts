import { stateManager } from './stateManager.service';

interface WebSocketConnectionState {
  chatId: string;
  connected: boolean;
  lastHeartbeat: number;
  reconnectCount: number;
  lastDisconnect: number | null;
}

class WebSocketStateManager {
  private static instance: WebSocketStateManager;
  private connectionStates: Map<string, WebSocketConnectionState> = new Map();
  private readonly STATE_KEY = 'websocket_states';
  private readonly STATE_VERSION = 1;

  private constructor() {
    this.loadStates();
  }

  static getInstance(): WebSocketStateManager {
    if (!WebSocketStateManager.instance) {
      WebSocketStateManager.instance = new WebSocketStateManager();
    }
    return WebSocketStateManager.instance;
  }

  private loadStates(): void {
    const stored = stateManager.load<Record<string, WebSocketConnectionState>>({
      key: this.STATE_KEY,
      version: this.STATE_VERSION,
      expiryMs: 60 * 60 * 1000
    });

    if (stored) {
      this.connectionStates = new Map(Object.entries(stored));
      console.log('[WebSocketStateManager] Loaded', this.connectionStates.size, 'connection states');
    }
  }

  private saveStates(): void {
    const statesObj = Object.fromEntries(this.connectionStates);
    stateManager.save(
      {
        key: this.STATE_KEY,
        version: this.STATE_VERSION
      },
      statesObj
    );
  }

  markConnected(chatId: string): void {
    const state = this.connectionStates.get(chatId) || {
      chatId,
      connected: false,
      lastHeartbeat: 0,
      reconnectCount: 0,
      lastDisconnect: null
    };

    state.connected = true;
    state.lastHeartbeat = Date.now();
    state.reconnectCount = 0;
    
    this.connectionStates.set(chatId, state);
    this.saveStates();
    
    console.log('[WebSocketStateManager] Marked connected:', chatId);
  }

  markDisconnected(chatId: string): void {
    const state = this.connectionStates.get(chatId);
    if (state) {
      state.connected = false;
      state.lastDisconnect = Date.now();
      this.connectionStates.set(chatId, state);
      this.saveStates();
      
      console.log('[WebSocketStateManager] Marked disconnected:', chatId);
    }
  }

  incrementReconnectCount(chatId: string): void {
    const state = this.connectionStates.get(chatId);
    if (state) {
      state.reconnectCount++;
      this.connectionStates.set(chatId, state);
      this.saveStates();
    }
  }

  updateHeartbeat(chatId: string): void {
    const state = this.connectionStates.get(chatId);
    if (state) {
      state.lastHeartbeat = Date.now();
      this.connectionStates.set(chatId, state);
    }
  }

  getConnectionState(chatId: string): WebSocketConnectionState | null {
    return this.connectionStates.get(chatId) || null;
  }

  isHealthy(chatId: string): boolean {
    const state = this.connectionStates.get(chatId);
    if (!state || !state.connected) return false;

    const heartbeatAge = Date.now() - state.lastHeartbeat;
    return heartbeatAge < 60000;
  }

  needsReconnect(chatId: string): boolean {
    const state = this.connectionStates.get(chatId);
    if (!state) return false;

    if (!state.connected && state.lastDisconnect) {
      const disconnectAge = Date.now() - state.lastDisconnect;
      return disconnectAge < 5 * 60 * 1000 && state.reconnectCount < 3;
    }

    return false;
  }

  clearState(chatId: string): void {
    this.connectionStates.delete(chatId);
    this.saveStates();
    console.log('[WebSocketStateManager] Cleared state for:', chatId);
  }

  getAllConnectedChats(): string[] {
    return Array.from(this.connectionStates.entries())
      .filter(([, state]) => state.connected)
      .map(([chatId]) => chatId);
  }

  getStats(): {
    total: number;
    connected: number;
    disconnected: number;
    needsReconnect: number;
  } {
    const stats = {
      total: this.connectionStates.size,
      connected: 0,
      disconnected: 0,
      needsReconnect: 0
    };

    this.connectionStates.forEach((state, chatId) => {
      if (state.connected) {
        stats.connected++;
      } else {
        stats.disconnected++;
        if (this.needsReconnect(chatId)) {
          stats.needsReconnect++;
        }
      }
    });

    return stats;
  }

  clearAll(): void {
    this.connectionStates.clear();
    this.saveStates();
    console.log('[WebSocketStateManager] Cleared all states');
  }
}

export const websocketStateManager = WebSocketStateManager.getInstance();
