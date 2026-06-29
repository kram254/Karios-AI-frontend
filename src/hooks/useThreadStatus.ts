import { useEffect, useState } from 'react';
import { chatStatusRegistry, ChatStatusEntry, ChatStatusKind } from '../services/chatStatusRegistry.service';

export interface ThreadStatus {
  kind: ChatStatusKind;
  label?: string;
  detail?: string;
}

export const useThreadStatus = (chatId: string | undefined): ThreadStatus => {
  const [entry, setEntry] = useState<ChatStatusEntry | undefined>(
    chatId ? chatStatusRegistry.getStatus(chatId) : undefined
  );

  useEffect(() => {
    if (!chatId) {
      setEntry(undefined);
      return;
    }
    setEntry(chatStatusRegistry.getStatus(chatId));
    const unsubscribe = chatStatusRegistry.subscribe((map) => {
      setEntry(map.get(chatId));
    });
    return unsubscribe;
  }, [chatId]);

  return {
    kind: entry?.kind ?? 'idle',
    label: entry?.label,
    detail: entry?.detail,
  };
};
