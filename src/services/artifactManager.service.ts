import { ArtifactCandidate } from './artifactDetection.service';

export interface Artifact extends ArtifactCandidate {
  id: string;
  messageId: string;
  chatId: string;
  isExpanded: boolean;
  isExecuting: boolean;
  createdAt: number;
  lastAccessedAt: number;
}

export interface ArtifactState {
  artifacts: Map<string, Artifact>;
  activeArtifactId: string | null;
  activeChatId: string | null;
  layoutMode: 'chat' | 'split' | 'artifact-focused';
  splitRatio: { chat: number; artifact: number };
  preferences: {
    autoExpand: boolean;
    defaultSplitRatio: { chat: number; artifact: number };
    rememberLastArtifact: boolean;
  };
}

class ArtifactManagerService {
  private state: ArtifactState = {
    artifacts: new Map(),
    activeArtifactId: null,
    activeChatId: null,
    layoutMode: 'chat',
    splitRatio: { chat: 100, artifact: 0 },
    preferences: {
      autoExpand: true,
      defaultSplitRatio: { chat: 42, artifact: 58 },
      rememberLastArtifact: true
    }
  };
  private chatArtifactHistory: Map<string, string | null> = new Map();

  private listeners: Set<(state: ArtifactState) => void> = new Set();
  private sessionStorageKey = 'artifact_manager_state';

  constructor() {
    this.loadStateFromStorage();
  }

  createArtifact(
    candidate: ArtifactCandidate,
    messageId: string,
    chatId: string,
    autoExpand: boolean = false
  ): Artifact {
    const artifact: Artifact = {
      ...candidate,
      id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId,
      chatId,
      isExpanded: autoExpand,
      isExecuting: false,
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };

    this.state.artifacts.set(artifact.id, artifact);

    if (autoExpand) {
      this.expandArtifact(artifact.id);
    }

    this.notifyListeners();
    this.saveStateToStorage();

    return artifact;
  }

  expandArtifact(artifactId: string): void {
    const artifact = this.state.artifacts.get(artifactId);
    if (!artifact) return;

    try {
      this.state.artifacts.forEach((a) => {
        if (a.chatId === artifact.chatId && a.id !== artifactId) {
          a.isExpanded = false;
        }
      });
    } catch {}

    artifact.isExpanded = true;
    artifact.lastAccessedAt = Date.now();
    this.state.activeArtifactId = artifactId;
    this.state.activeChatId = artifact.chatId;
    this.state.layoutMode = 'split';
    const hasActiveSplitRatio =
      this.state.splitRatio.chat > 0 &&
      this.state.splitRatio.chat < 100 &&
      this.state.splitRatio.artifact > 0 &&
      this.state.splitRatio.artifact < 100;
    this.state.splitRatio = hasActiveSplitRatio
      ? this.state.splitRatio
      : this.state.preferences.defaultSplitRatio;
    this.chatArtifactHistory.set(artifact.chatId, artifactId);

    try {
      window.dispatchEvent(new CustomEvent('canvas:sidebar-collapse', { detail: { collapse: true } }));
    } catch {}

    this.notifyListeners();
    this.saveStateToStorage();
  }

  collapseArtifact(artifactId?: string): void {
    const targetId = artifactId || this.state.activeArtifactId;
    if (!targetId) return;

    const artifact = this.state.artifacts.get(targetId);
    if (artifact) {
      artifact.isExpanded = false;
    }

    this.state.activeArtifactId = null;
    this.state.layoutMode = 'chat';
    this.state.splitRatio = { chat: 100, artifact: 0 };

    this.notifyListeners();
    this.saveStateToStorage();
  }

  toggleArtifact(artifactId: string): void {
    const artifact = this.state.artifacts.get(artifactId);
    if (!artifact) return;

    if (artifact.isExpanded) {
      this.collapseArtifact(artifactId);
    } else {
      this.expandArtifact(artifactId);
    }
  }

  setExecutionState(artifactId: string, isExecuting: boolean): void {
    const artifact = this.state.artifacts.get(artifactId);
    if (!artifact) return;

    artifact.isExecuting = isExecuting;
    this.notifyListeners();
  }

  updateSplitRatio(chatPercent: number, artifactPercent: number): void {
    this.state.splitRatio = { chat: chatPercent, artifact: artifactPercent };
    this.notifyListeners();
    this.saveStateToStorage();
  }

  setLayoutMode(mode: 'chat' | 'split' | 'artifact-focused'): void {
    this.state.layoutMode = mode;
    
    switch (mode) {
      case 'chat':
        this.state.splitRatio = { chat: 100, artifact: 0 };
        break;
      case 'split':
        {
          const hasActiveSplitRatio =
            this.state.splitRatio.chat > 0 &&
            this.state.splitRatio.chat < 100 &&
            this.state.splitRatio.artifact > 0 &&
            this.state.splitRatio.artifact < 100;
          this.state.splitRatio = hasActiveSplitRatio
            ? this.state.splitRatio
            : this.state.preferences.defaultSplitRatio;
        }
        break;
      case 'artifact-focused':
        this.state.splitRatio = { chat: 20, artifact: 80 };
        break;
    }

    this.notifyListeners();
    this.saveStateToStorage();
  }

  getArtifact(artifactId: string): Artifact | undefined {
    return this.state.artifacts.get(artifactId);
  }

  getActiveArtifact(): Artifact | null {
    if (!this.state.activeArtifactId) return null;
    return this.state.artifacts.get(this.state.activeArtifactId) || null;
  }

  getArtifactsForMessage(messageId: string): Artifact[] {
    return Array.from(this.state.artifacts.values())
      .filter(artifact => artifact.messageId === messageId);
  }

  getArtifactsForChat(chatId: string): Artifact[] {
    return Array.from(this.state.artifacts.values())
      .filter(artifact => artifact.chatId === chatId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  deleteArtifact(artifactId: string): void {
    this.state.artifacts.delete(artifactId);
    
    if (this.state.activeArtifactId === artifactId) {
      this.state.activeArtifactId = null;
      this.state.layoutMode = 'chat';
      this.state.splitRatio = { chat: 100, artifact: 0 };
    }

    this.notifyListeners();
    this.saveStateToStorage();
  }

  clearArtifactsForChat(chatId: string): void {
    const artifactsToDelete = this.getArtifactsForChat(chatId);
    artifactsToDelete.forEach(artifact => this.deleteArtifact(artifact.id));
  }

  getState(): ArtifactState {
    return { ...this.state };
  }

  updatePreferences(preferences: Partial<ArtifactState['preferences']>): void {
    this.state.preferences = {
      ...this.state.preferences,
      ...preferences
    };
    this.notifyListeners();
    this.saveStateToStorage();
  }

  subscribe(listener: (state: ArtifactState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private saveStateToStorage(): void {
    try {
      const serializable = {
        activeArtifactId: this.state.activeArtifactId,
        layoutMode: this.state.layoutMode,
        splitRatio: this.state.splitRatio,
        preferences: this.state.preferences,
        artifacts: Array.from(this.state.artifacts.entries()).map(([id, artifact]) => ({
          id,
          chatId: artifact.chatId,
          messageId: artifact.messageId,
          isExpanded: artifact.isExpanded,
          lastAccessedAt: artifact.lastAccessedAt
        }))
      };

      sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(serializable));
    } catch (error) {
      console.warn('Failed to save artifact state to storage:', error);
    }
  }

  private loadStateFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(this.sessionStorageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      this.state.activeArtifactId = data.activeArtifactId || null;
      this.state.layoutMode = data.layoutMode || 'chat';
      this.state.splitRatio = data.splitRatio || { chat: 100, artifact: 0 };
      this.state.preferences = {
        ...this.state.preferences,
        ...(data.preferences || {})
      };
    } catch (error) {
      console.warn('Failed to load artifact state from storage:', error);
    }
  }

  calculateOptimalSplitRatio(viewportWidth: number, artifactExpanded: boolean): { chat: number; artifact: number } {
    if (!artifactExpanded) {
      return { chat: 100, artifact: 0 };
    }

    if (viewportWidth > 1400) {
      return { chat: 35, artifact: 65 };
    } else if (viewportWidth > 1200) {
      return { chat: 30, artifact: 70 };
    } else if (viewportWidth > 768) {
      return { chat: 25, artifact: 75 };
    } else {
      return { chat: 0, artifact: 100 };
    }
  }

  cleanupOldArtifacts(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.state.artifacts.forEach((artifact, id) => {
      if (now - artifact.lastAccessedAt > maxAge) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => this.deleteArtifact(id));
  }

  handleChatSwitch(fromChatId: string | null, toChatId: string): void {
    if (fromChatId && this.state.activeArtifactId) {
      this.chatArtifactHistory.set(fromChatId, this.state.activeArtifactId);
    }

    const activeArtifact = this.getActiveArtifact();
    if (activeArtifact && activeArtifact.chatId !== toChatId) {
      this.collapseArtifact();
    }

    this.state.activeChatId = toChatId;

    if (this.state.preferences.rememberLastArtifact) {
      const lastArtifactId = this.chatArtifactHistory.get(toChatId);
      if (lastArtifactId) {
        const artifact = this.state.artifacts.get(lastArtifactId);
        if (artifact && artifact.chatId === toChatId) {
          return;
        }
      }
    }

    this.notifyListeners();
  }

  getActiveChatId(): string | null {
    return this.state.activeChatId;
  }

  isArtifactForCurrentChat(artifactId: string): boolean {
    const artifact = this.state.artifacts.get(artifactId);
    if (!artifact) return false;
    return artifact.chatId === this.state.activeChatId;
  }

  getLastArtifactForChat(chatId: string): Artifact | null {
    const lastId = this.chatArtifactHistory.get(chatId);
    if (!lastId) return null;
    const artifact = this.state.artifacts.get(lastId);
    return artifact && artifact.chatId === chatId ? artifact : null;
  }

  resetForNewChat(): void {
    this.state.activeArtifactId = null;
    this.state.layoutMode = 'chat';
    this.state.splitRatio = { chat: 100, artifact: 0 };
    this.notifyListeners();
  }
}

export const artifactManager = new ArtifactManagerService();
