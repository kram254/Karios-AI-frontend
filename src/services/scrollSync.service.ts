interface ScrollState {
  position: number;
  autoScroll: boolean;
  lastUserScroll: number;
}

class ScrollSynchronizationService {
  private chatScroll: ScrollState = {
    position: 0,
    autoScroll: true,
    lastUserScroll: 0
  };

  private artifactScroll: ScrollState = {
    position: 0,
    autoScroll: false,
    lastUserScroll: 0
  };

  private readonly AUTO_SCROLL_THRESHOLD = 100;
  private readonly USER_SCROLL_TIMEOUT = 1000;

  saveChatScrollPosition(element: HTMLElement): void {
    if (!element) return;
    
    this.chatScroll.position = element.scrollTop;
    this.chatScroll.lastUserScroll = Date.now();

    const isNearBottom = 
      element.scrollHeight - element.scrollTop - element.clientHeight < this.AUTO_SCROLL_THRESHOLD;
    
    this.chatScroll.autoScroll = isNearBottom;
  }

  restoreChatScrollPosition(element: HTMLElement): void {
    if (!element) return;
    
    const timeSinceUserScroll = Date.now() - this.chatScroll.lastUserScroll;
    
    if (this.chatScroll.autoScroll || timeSinceUserScroll > this.USER_SCROLL_TIMEOUT) {
      element.scrollTop = element.scrollHeight;
    } else {
      element.scrollTop = this.chatScroll.position;
    }
  }

  scrollChatToBottom(element: HTMLElement, smooth: boolean = true): void {
    if (!element) return;
    
    element.scrollTo({
      top: element.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    
    this.chatScroll.position = element.scrollHeight;
    this.chatScroll.autoScroll = true;
  }

  shouldAutoScrollChat(): boolean {
    return this.chatScroll.autoScroll;
  }

  saveArtifactScrollPosition(element: HTMLElement): void {
    if (!element) return;
    this.artifactScroll.position = element.scrollTop;
  }

  restoreArtifactScrollPosition(element: HTMLElement): void {
    if (!element) return;
    element.scrollTop = this.artifactScroll.position;
  }

  preserveScrollDuringLayoutShift(
    chatElement: HTMLElement,
    callback: () => void
  ): void {
    if (!chatElement) {
      callback();
      return;
    }

    const scrollHeight = chatElement.scrollHeight;
    const scrollTop = chatElement.scrollTop;
    const scrollDiff = scrollHeight - scrollTop;

    callback();

    requestAnimationFrame(() => {
      const newScrollHeight = chatElement.scrollHeight;
      const targetScrollTop = newScrollHeight - scrollDiff;
      chatElement.scrollTop = targetScrollTop;
    });
  }

  handleChatUserScroll(element: HTMLElement): void {
    this.saveChatScrollPosition(element);
  }

  handleArtifactUserScroll(element: HTMLElement): void {
    this.saveArtifactScrollPosition(element);
  }

  reset(): void {
    this.chatScroll = {
      position: 0,
      autoScroll: true,
      lastUserScroll: 0
    };
    this.artifactScroll = {
      position: 0,
      autoScroll: false,
      lastUserScroll: 0
    };
  }
}

export const scrollSyncService = new ScrollSynchronizationService();
