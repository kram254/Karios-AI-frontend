import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ANONYMOUS_MESSAGE_LIMIT = parseInt(import.meta.env.VITE_ANONYMOUS_MESSAGE_LIMIT || '10', 10);
const ANONYMOUS_SESSION_KEY = 'karios_anonymous_session';
const ANONYMOUS_MESSAGE_COUNT_KEY = 'karios_anonymous_message_count';

interface AnonymousSession {
  id: string;
  createdAt: string;
  lastActiveAt: string;
}

interface AnonymousAuthContextType {
  isAnonymous: boolean;
  anonymousSession: AnonymousSession | null;
  messageCount: number;
  messageLimit: number;
  remainingMessages: number;
  requiresAuthentication: boolean;
  incrementMessageCount: () => void;
  resetAnonymousSession: () => void;
  getAnonymousHeaders: () => Record<string, string> | {};
}

const AnonymousAuthContext = createContext<AnonymousAuthContextType>({
  isAnonymous: false,
  anonymousSession: null,
  messageCount: 0,
  messageLimit: ANONYMOUS_MESSAGE_LIMIT,
  remainingMessages: ANONYMOUS_MESSAGE_LIMIT,
  requiresAuthentication: false,
  incrementMessageCount: () => {},
  resetAnonymousSession: () => {},
  getAnonymousHeaders: () => ({}),
});

export const useAnonymousAuth = () => useContext(AnonymousAuthContext);

export const AnonymousAuthProvider: React.FC<{ children: React.ReactNode; isAuthenticated: boolean }> = ({ 
  children, 
  isAuthenticated 
}) => {
  const [anonymousSession, setAnonymousSession] = useState<AnonymousSession | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.removeItem(ANONYMOUS_SESSION_KEY);
      localStorage.removeItem(ANONYMOUS_MESSAGE_COUNT_KEY);
      setAnonymousSession(null);
      setMessageCount(0);
      return;
    }

    const storedSession = localStorage.getItem(ANONYMOUS_SESSION_KEY);
    const storedCount = localStorage.getItem(ANONYMOUS_MESSAGE_COUNT_KEY);

    if (storedSession) {
      try {
        const session = JSON.parse(storedSession) as AnonymousSession;
        setAnonymousSession(session);
      } catch {
        createNewSession();
      }
    } else {
      createNewSession();
    }

    if (storedCount) {
      setMessageCount(parseInt(storedCount, 10));
    }
  }, [isAuthenticated]);

  const createNewSession = () => {
    const newSession: AnonymousSession = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
    localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(newSession));
    localStorage.setItem(ANONYMOUS_MESSAGE_COUNT_KEY, '0');
    setAnonymousSession(newSession);
    setMessageCount(0);
  };

  const incrementMessageCount = useCallback(() => {
    if (isAuthenticated) return;
    
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    localStorage.setItem(ANONYMOUS_MESSAGE_COUNT_KEY, newCount.toString());
    
    if (anonymousSession) {
      const updatedSession = {
        ...anonymousSession,
        lastActiveAt: new Date().toISOString(),
      };
      localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(updatedSession));
    }
  }, [messageCount, anonymousSession, isAuthenticated]);

  const resetAnonymousSession = useCallback(() => {
    localStorage.removeItem(ANONYMOUS_SESSION_KEY);
    localStorage.removeItem(ANONYMOUS_MESSAGE_COUNT_KEY);
    setAnonymousSession(null);
    setMessageCount(0);
  }, []);

  const getAnonymousHeaders = useCallback(() => {
    if (!anonymousSession || isAuthenticated) return {};
    
    return {
      'X-Anonymous-Session': anonymousSession.id,
      'X-Anonymous-Count': messageCount.toString(),
    };
  }, [anonymousSession, messageCount, isAuthenticated]);

  const isAnonymous = !isAuthenticated && !!anonymousSession;
  const remainingMessages = Math.max(0, ANONYMOUS_MESSAGE_LIMIT - messageCount);
  const requiresAuthentication = isAnonymous && messageCount >= ANONYMOUS_MESSAGE_LIMIT;

  return (
    <AnonymousAuthContext.Provider
      value={{
        isAnonymous,
        anonymousSession,
        messageCount,
        messageLimit: ANONYMOUS_MESSAGE_LIMIT,
        remainingMessages,
        requiresAuthentication,
        incrementMessageCount,
        resetAnonymousSession,
        getAnonymousHeaders,
      }}
    >
      {children}
    </AnonymousAuthContext.Provider>
  );
};
