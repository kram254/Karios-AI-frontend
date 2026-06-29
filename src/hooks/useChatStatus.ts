import { useEffect, useState } from 'react';
import { chatStatusRegistry, ChatStatusEntry } from '../services/chatStatusRegistry.service';

export const useChatStatus = (chatId: string | undefined): ChatStatusEntry | undefined => {
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

  return entry;
};

export const useAllChatStatuses = (): Map<string, ChatStatusEntry> => {
  const [entries, setEntries] = useState<Map<string, ChatStatusEntry>>(() => chatStatusRegistry.getAll());

  useEffect(() => {
    setEntries(chatStatusRegistry.getAll());
    const unsubscribe = chatStatusRegistry.subscribe((map) => {
      setEntries(new Map(map));
    });
    return unsubscribe;
  }, []);

  return entries;
};
