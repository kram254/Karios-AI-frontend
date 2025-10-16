import { useState, useEffect, useCallback, useRef } from 'react';
import { artifactDetectionService } from '../services/artifactDetection.service';
import { artifactManager, Artifact, ArtifactState } from '../services/artifactManager.service';
import { scrollSyncService } from '../services/scrollSync.service';

export const useArtifactSystem = (chatId: string) => {
  const [artifactState, setArtifactState] = useState<ArtifactState>(artifactManager.getState());
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const artifactScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = artifactManager.subscribe((state) => {
      setArtifactState(state);
      setActiveArtifact(artifactManager.getActiveArtifact());
    });

    return () => {
      unsubscribe();
    };
  }, []);

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
      scrollSyncService.handleChatUserScroll(chatScrollRef.current);
    }
  }, []);

  const handleArtifactScroll = useCallback(() => {
    if (artifactScrollRef.current) {
      scrollSyncService.handleArtifactUserScroll(artifactScrollRef.current);
    }
  }, []);

  const scrollChatToBottom = useCallback((smooth: boolean = true) => {
    if (chatScrollRef.current && scrollSyncService.shouldAutoScrollChat()) {
      scrollSyncService.scrollChatToBottom(chatScrollRef.current, smooth);
    }
  }, []);

  const getArtifactsForMessage = useCallback((messageId: string): Artifact[] => {
    return artifactManager.getArtifactsForMessage(messageId);
  }, []);

  const clearChatArtifacts = useCallback(() => {
    artifactManager.clearArtifactsForChat(chatId);
  }, [chatId]);

  useEffect(() => {
    artifactManager.cleanupOldArtifacts();
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
    handleChatScroll,
    handleArtifactScroll,
    chatScrollRef,
    artifactScrollRef
  };
};
