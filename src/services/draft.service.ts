const DRAFT_PREFIX = 'chat_draft_';
const AUTO_SAVE_INTERVAL = 5000;

interface Draft {
  content: string;
  chatId: string;
  savedAt: number;
}

class DraftService {
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();

  saveDraft(chatId: string, content: string): void {
    if (!content.trim()) {
      this.clearDraft(chatId);
      return;
    }

    const draft: Draft = {
      content,
      chatId,
      savedAt: Date.now()
    };

    try {
      localStorage.setItem(`${DRAFT_PREFIX}${chatId}`, JSON.stringify(draft));
    } catch (e) {
      console.warn('Failed to save draft:', e);
    }
  }

  getDraft(chatId: string): string | null {
    try {
      const data = localStorage.getItem(`${DRAFT_PREFIX}${chatId}`);
      if (!data) return null;
      
      const draft: Draft = JSON.parse(data);
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - draft.savedAt > oneDay) {
        this.clearDraft(chatId);
        return null;
      }
      
      return draft.content;
    } catch {
      return null;
    }
  }

  clearDraft(chatId: string): void {
    try {
      localStorage.removeItem(`${DRAFT_PREFIX}${chatId}`);
    } catch (e) {
      console.warn('Failed to clear draft:', e);
    }
    
    const timer = this.autoSaveTimers.get(chatId);
    if (timer) {
      clearTimeout(timer);
      this.autoSaveTimers.delete(chatId);
    }
  }

  startAutoSave(chatId: string, getContent: () => string): void {
    this.stopAutoSave(chatId);
    
    const timer = setInterval(() => {
      const content = getContent();
      if (content.trim()) {
        this.saveDraft(chatId, content);
      }
    }, AUTO_SAVE_INTERVAL);
    
    this.autoSaveTimers.set(chatId, timer);
  }

  stopAutoSave(chatId: string): void {
    const timer = this.autoSaveTimers.get(chatId);
    if (timer) {
      clearInterval(timer);
      this.autoSaveTimers.delete(chatId);
    }
  }

  getAllDrafts(): Draft[] {
    const drafts: Draft[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(DRAFT_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            drafts.push(JSON.parse(data));
          }
        }
      }
    } catch {
      return [];
    }
    return drafts.sort((a, b) => b.savedAt - a.savedAt);
  }

  clearAllDrafts(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const draftService = new DraftService();
export default draftService;
