import { useMemo } from 'react';
import { chatTypeDetector } from '../services/chatTypeDetector';
import { ChatType, ChatUIFeatures } from '../types/chatTypes';

interface Chat {
  chat_type?: string;
  agent_actions?: string[];
  is_multi_agent_task?: boolean;
  automation_active?: boolean;
}

export const useChatFeatures = (chat: Chat | null): ChatUIFeatures => {
  return useMemo(() => {
    if (!chat) {
      return {
        showWebAutomationButton: false,
        showSearchButton: false,
        showEmailButton: false,
        showMultiAgentCards: false,
        showTaskOrchestration: false,
        showKnowledgePanel: false,
        showStopButton: true
      };
    }

    const chatType = (chat.chat_type || 'default') as ChatType;
    const agentActions = chat.agent_actions || [];
    
    return chatTypeDetector.getRequiredFeatures(chatType, agentActions);
  }, [chat?.chat_type, chat?.agent_actions]);
};

export const useShouldShowMultiAgent = (chat: Chat | null): boolean => {
  return useMemo(() => {
    if (!chat) return false;
    
    if (chat.is_multi_agent_task) return true;
    
    const chatType = (chat.chat_type || 'default') as ChatType;
    return chatTypeDetector.shouldUseMultiAgent(chatType);
  }, [chat?.chat_type, chat?.is_multi_agent_task]);
};

export const useDetectChatType = (prompt: string): ChatType => {
  return useMemo(() => {
    if (!prompt.trim()) return ChatType.DEFAULT;
    return chatTypeDetector.detectFromPrompt(prompt);
  }, [prompt]);
};
