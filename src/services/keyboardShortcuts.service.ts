type ShortcutHandler = () => void;

interface Shortcut {
  keys: string[];
  description: string;
  handler: ShortcutHandler;
  category: 'navigation' | 'actions' | 'editing';
}

class KeyboardShortcutsService {
  private shortcuts: Map<string, Shortcut> = new Map();
  private enabled: boolean = true;
  private listeners: Set<(shortcuts: Shortcut[]) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  private normalizeKey(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.metaKey || e.ctrlKey) parts.push('Cmd');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    
    const key = e.key.toLowerCase();
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      parts.push(key === ' ' ? 'Space' : key.charAt(0).toUpperCase() + key.slice(1));
    }
    return parts.join('+');
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;
    
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      if (e.key !== 'Escape') return;
    }

    const combo = this.normalizeKey(e);
    const shortcut = this.shortcuts.get(combo);
    
    if (shortcut) {
      e.preventDefault();
      shortcut.handler();
    }
  }

  register(keys: string, description: string, handler: ShortcutHandler, category: 'navigation' | 'actions' | 'editing' = 'actions'): void {
    this.shortcuts.set(keys, { keys: [keys], description, handler, category });
    this.notifyListeners();
  }

  unregister(keys: string): void {
    this.shortcuts.delete(keys);
    this.notifyListeners();
  }

  enable(): void { this.enabled = true; }
  disable(): void { this.enabled = false; }

  getAll(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  onUpdate(callback: (shortcuts: Shortcut[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const shortcuts = this.getAll();
    this.listeners.forEach(cb => cb(shortcuts));
  }

  registerDefaults(handlers: {
    newChat?: () => void;
    globalSearch?: () => void;
    copyLastResponse?: () => void;
    stopGeneration?: () => void;
    toggleSearch?: () => void;
    showHelp?: () => void;
  }): void {
    if (handlers.globalSearch) this.register('Cmd+K', 'Open global search', handlers.globalSearch, 'navigation');
    if (handlers.newChat) this.register('Cmd+N', 'New conversation', handlers.newChat, 'actions');
    if (handlers.copyLastResponse) this.register('Cmd+Shift+C', 'Copy last response', handlers.copyLastResponse, 'actions');
    if (handlers.toggleSearch) this.register('Cmd+Enter', 'Submit with search', handlers.toggleSearch, 'actions');
    if (handlers.stopGeneration) this.register('Escape', 'Stop generation', handlers.stopGeneration, 'actions');
    if (handlers.showHelp) this.register('Cmd+/', 'Show shortcuts', handlers.showHelp, 'navigation');
  }
}

export const keyboardShortcuts = new KeyboardShortcutsService();
export default keyboardShortcuts;
