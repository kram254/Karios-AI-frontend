interface StateConfig {
  key: string;
  version: number;
  expiryMs?: number;
}

interface StoredState<T> {
  data: T;
  timestamp: number;
  version: number;
}

class StateManager {
  private static instance: StateManager;
  private storagePrefix = 'karios_';

  private constructor() {}

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  save<T>(config: StateConfig, data: T): void {
    try {
      const stored: StoredState<T> = {
        data,
        timestamp: Date.now(),
        version: config.version
      };
      localStorage.setItem(
        this.storagePrefix + config.key,
        JSON.stringify(stored)
      );
    } catch (error) {
      console.error(`[StateManager] Failed to save state for ${config.key}:`, error);
    }
  }

  load<T>(config: StateConfig): T | null {
    try {
      const item = localStorage.getItem(this.storagePrefix + config.key);
      if (!item) return null;

      const stored: StoredState<T> = JSON.parse(item);

      if (stored.version !== config.version) {
        console.log(`[StateManager] Version mismatch for ${config.key}, clearing old state`);
        this.clear(config.key);
        return null;
      }

      if (config.expiryMs) {
        const age = Date.now() - stored.timestamp;
        if (age > config.expiryMs) {
          console.log(`[StateManager] State expired for ${config.key}`);
          this.clear(config.key);
          return null;
        }
      }

      return stored.data;
    } catch (error) {
      console.error(`[StateManager] Failed to load state for ${config.key}:`, error);
      return null;
    }
  }

  clear(key: string): void {
    try {
      localStorage.removeItem(this.storagePrefix + key);
    } catch (error) {
      console.error(`[StateManager] Failed to clear state for ${key}:`, error);
    }
  }

  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('[StateManager] Failed to clear all state:', error);
    }
  }

  getStorageStats(): { used: number; available: number; percentage: number } {
    let used = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith(this.storagePrefix)) {
          used += localStorage[key].length + key.length;
        }
      }
    } catch (error) {
      console.error('[StateManager] Failed to calculate storage stats:', error);
    }

    const available = 5 * 1024 * 1024;
    return {
      used,
      available,
      percentage: (used / available) * 100
    };
  }
}

export const stateManager = StateManager.getInstance();
