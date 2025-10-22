import { useState, useCallback, useRef, useEffect } from 'react';

interface TransitionState {
  isTransitioning: boolean;
  fromChatId: string | null;
  toChatId: string | null;
  startTime: number | null;
}

export const useStateTransition = () => {
  const [transitionState, setTransitionState] = useState<TransitionState>({
    isTransitioning: false,
    fromChatId: null,
    toChatId: null,
    startTime: null
  });

  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingTransitionRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const startTransition = useCallback((fromChatId: string | null, toChatId: string): boolean => {
    if (transitionState.isTransitioning) {
      console.warn('[StateTransition] Transition in progress, queuing:', toChatId.slice(0, 8));
      pendingTransitionRef.current = toChatId;
      return false;
    }

    console.log('[StateTransition] Starting:', fromChatId?.slice(0, 8) || 'none', '->', toChatId.slice(0, 8));
    
    setTransitionState({
      isTransitioning: true,
      fromChatId,
      toChatId,
      startTime: Date.now()
    });

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = setTimeout(() => {
      console.error('[StateTransition] Transition timeout, forcing end');
      endTransition();
    }, 5000);

    return true;
  }, [transitionState.isTransitioning]);

  const endTransition = useCallback(() => {
    const duration = transitionState.startTime 
      ? Date.now() - transitionState.startTime 
      : 0;

    console.log('[StateTransition] Complete:', transitionState.toChatId?.slice(0, 8), `(${duration}ms)`);

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    setTransitionState({
      isTransitioning: false,
      fromChatId: null,
      toChatId: null,
      startTime: null
    });

    if (pendingTransitionRef.current) {
      const pendingChatId = pendingTransitionRef.current;
      pendingTransitionRef.current = null;
      console.log('[StateTransition] Processing queued transition:', pendingChatId.slice(0, 8));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('chat:transition-queued', { 
          detail: { chatId: pendingChatId } 
        }));
      }, 100);
    }
  }, [transitionState]);

  const cancelTransition = useCallback(() => {
    console.warn('[StateTransition] Cancelled');
    
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    setTransitionState({
      isTransitioning: false,
      fromChatId: null,
      toChatId: null,
      startTime: null
    });

    pendingTransitionRef.current = null;
  }, []);

  const isTransitioning = useCallback(() => {
    return transitionState.isTransitioning;
  }, [transitionState.isTransitioning]);

  const hasPendingTransition = useCallback(() => {
    return pendingTransitionRef.current !== null;
  }, []);

  return {
    startTransition,
    endTransition,
    cancelTransition,
    isTransitioning,
    hasPendingTransition,
    transitionState
  };
};
