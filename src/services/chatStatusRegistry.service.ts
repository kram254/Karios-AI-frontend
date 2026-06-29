export type ChatStatusKind =
  | 'idle'
  | 'thinking'
  | 'running'
  | 'streaming'
  | 'paused'
  | 'completed'
  | 'failed';

export interface ChatStatusEntry {
  chatId: string;
  kind: ChatStatusKind;
  label?: string;
  detail?: string;
  updatedAt: number;
}

type Listener = (entries: Map<string, ChatStatusEntry>) => void;

class ChatStatusRegistryService {
  private entries: Map<string, ChatStatusEntry> = new Map();
  private listeners: Set<Listener> = new Set();

  setStatus(chatId: string, kind: ChatStatusKind, label?: string, detail?: string): void {
    if (!chatId) return;
    const entry: ChatStatusEntry = {
      chatId,
      kind,
      label,
      detail,
      updatedAt: Date.now()
    };
    this.entries.set(chatId, entry);
    this.notify();
  }

  clearStatus(chatId: string): void {
    if (!chatId) return;
    if (this.entries.delete(chatId)) {
      this.notify();
    }
  }

  getStatus(chatId: string): ChatStatusEntry | undefined {
    return this.entries.get(chatId);
  }

  getAll(): Map<string, ChatStatusEntry> {
    return new Map(this.entries);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = new Map(this.entries);
    this.listeners.forEach((l) => {
      try {
        l(snapshot);
      } catch (err) {
        console.warn('chatStatusRegistry listener failed:', err);
      }
    });
  }
}

export const chatStatusRegistry = new ChatStatusRegistryService();
