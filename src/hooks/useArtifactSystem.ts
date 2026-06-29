import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { artifactDetectionService } from '../services/artifactDetection.service';
import { artifactManager, Artifact, ArtifactState } from '../services/artifactManager.service';
import { scrollSyncService } from '../services/scrollSync.service';

export const useArtifactSystem = (chatId: string) => {
  const [artifactState, setArtifactState] = useState<ArtifactState>(artifactManager.getState());
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [isChatFullscreen, setIsChatFullscreen] = useState<boolean>(false);
  const [fullscreenArtifact, setFullscreenArtifact] = useState<Artifact | null>(null);
  /** True when the message list scroll position is within 120px of the bottom. */
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const artifactScrollRef = useRef<HTMLDivElement>(null);
  const previousChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = artifactManager.subscribe((state) => {
      setArtifactState(state);
      const active = artifactManager.getActiveArtifact();
      if (active && active.chatId === chatId) {
        setActiveArtifact(active);
      } else if (active && active.chatId !== chatId) {
        setActiveArtifact(null);
      } else {
        setActiveArtifact(active);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [chatId]);

  useEffect(() => {
    if (previousChatIdRef.current && previousChatIdRef.current !== chatId) {
      artifactManager.handleChatSwitch(previousChatIdRef.current, chatId);
    }
    previousChatIdRef.current = chatId;
  }, [chatId]);

  useEffect(() => {
    if (chatScrollRef.current) {
      scrollSyncService.restoreChatScrollPosition(chatScrollRef.current);
    }
    if (artifactScrollRef.current) {
      scrollSyncService.restoreArtifactScrollPosition(artifactScrollRef.current);
    }
  }, [artifactState.layoutMode]);

  const detectAndCreateArtifact = useCallback((
    messageContent: string,
    messageRole: string,
    messageId: string
  ): Artifact | null => {
    const candidate = artifactDetectionService.detectArtifact(messageContent, messageRole);
    
    if (!candidate || !candidate.shouldCreateArtifact) {
      return null;
    }

    const autoExpand = artifactDetectionService.shouldAutoExpand(candidate);
    const artifact = artifactManager.createArtifact(candidate, messageId, chatId, autoExpand);
    
    return artifact;
  }, [chatId]);

  const expandArtifact = useCallback((artifactId: string) => {
    if (chatScrollRef.current) {
      scrollSyncService.preserveScrollDuringLayoutShift(
        chatScrollRef.current,
        () => artifactManager.expandArtifact(artifactId)
      );
    } else {
      artifactManager.expandArtifact(artifactId);
    }
  }, []);

  const collapseArtifact = useCallback((artifactId?: string) => {
    if (chatScrollRef.current) {
      scrollSyncService.preserveScrollDuringLayoutShift(
        chatScrollRef.current,
        () => artifactManager.collapseArtifact(artifactId)
      );
    } else {
      artifactManager.collapseArtifact(artifactId);
    }
  }, []);

  const toggleArtifact = useCallback((artifactId: string) => {
    if (chatScrollRef.current) {
      scrollSyncService.preserveScrollDuringLayoutShift(
        chatScrollRef.current,
        () => artifactManager.toggleArtifact(artifactId)
      );
    } else {
      artifactManager.toggleArtifact(artifactId);
    }
  }, []);

  const handleChatScroll = useCallback(() => {
    if (chatScrollRef.current) {
      const el = chatScrollRef.current;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      setIsAtBottom(nearBottom);
      scrollSyncService.handleChatUserScroll(el);
    }
  }, []);

  const handleArtifactScroll = useCallback(() => {
    if (artifactScrollRef.current) {
      scrollSyncService.handleArtifactUserScroll(artifactScrollRef.current);
    }
  }, []);

  const scrollChatToBottom = useCallback((smooth: boolean = true, force: boolean = false) => {
    if (chatScrollRef.current && (force || scrollSyncService.shouldAutoScrollChat())) {
      scrollSyncService.scrollChatToBottom(chatScrollRef.current, smooth);
      setIsAtBottom(true);
    }
  }, []);

  /** Always scrolls to bottom regardless of user-scroll state (e.g. "Jump to latest" button). */
  const forceScrollToBottom = useCallback((smooth: boolean = true) => {
    scrollChatToBottom(smooth, true);
  }, [scrollChatToBottom]);

  const getArtifactsForMessage = useCallback((messageId: string): Artifact[] => {
    return artifactManager.getArtifactsForMessage(messageId);
  }, []);

  const clearChatArtifacts = useCallback(() => {
    artifactManager.clearArtifactsForChat(chatId);
  }, [chatId]);

  useEffect(() => {
    artifactManager.cleanupOldArtifacts();
  }, []);

  const floatingArtifacts = useMemo<Artifact[]>(() => {
    return artifactManager.getArtifactsForChat(chatId);
  }, [chatId, artifactState.artifacts]);

  const openFullscreenArtifact = useCallback((artifact: Artifact) => {
    setFullscreenArtifact(artifact);
  }, []);

  const closeFullscreenArtifact = useCallback(() => {
    setFullscreenArtifact(null);
  }, []);

  const toggleChatFullscreen = useCallback(() => {
    setIsChatFullscreen(prev => !prev);
  }, []);

  return {
    artifactState,
    activeArtifact,
    layoutMode: artifactState.layoutMode,
    splitRatio: artifactState.splitRatio,
    detectAndCreateArtifact,
    expandArtifact,
    collapseArtifact,
    toggleArtifact,
    getArtifactsForMessage,
    clearChatArtifacts,
    scrollChatToBottom,
    forceScrollToBottom,
    isAtBottom,
    handleChatScroll,
    handleArtifactScroll,
    chatScrollRef,
    artifactScrollRef,
    isChatFullscreen,
    setIsChatFullscreen,
    toggleChatFullscreen,
    fullscreenArtifact,
    openFullscreenArtifact,
    closeFullscreenArtifact,
    floatingArtifacts
  };
};
