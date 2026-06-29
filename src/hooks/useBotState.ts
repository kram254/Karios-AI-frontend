import { useMemo } from 'react';

export type BotState = 
  | 'thinking' 
  | 'searching' 
  | 'browsing' 
  | 'scraping' 
  | 'processing' 
  | 'idle' 
  | 'greeting' 
  | 'success' 
  | 'listening' 
  | 'explaining';

interface UseBotStateParams {
  isGenerating?: boolean;
  isSearching?: boolean;
  isSearchMode?: boolean;
  avatarState?: string;
  workflowStage?: string;
  isWorkflowActive?: boolean;
  workflowCompleted?: boolean;
  isProcessing?: boolean;
  automationActive?: boolean;
  agentUpdates?: any[];
}

export const useBotState = (params: UseBotStateParams) => {
  const {
    isGenerating = false,
    isSearching = false,
    isSearchMode = false,
    avatarState = 'idle',
    workflowStage = '',
    isWorkflowActive = false,
    workflowCompleted = false,
    isProcessing = false,
    automationActive = false,
    agentUpdates = [],
  } = params;

  const botState: BotState = useMemo(() => {
    if (workflowCompleted) return 'success';
    
    if (automationActive || avatarState === 'browsing') return 'browsing';
    
    if (isSearching || isSearchMode) return 'searching';
    
    if (avatarState === 'scraping') return 'scraping';
    
    if (workflowStage) {
      const stage = workflowStage.toLowerCase();
      
      if (stage.includes('planner') || stage.includes('planning')) {
        return 'thinking';
      }
      
      if (stage.includes('task executor') || stage.includes('executing')) {
        return 'processing';
      }
      
      if (stage.includes('formatter') || stage.includes('formatting')) {
        return 'explaining';
      }
      
      if (stage.includes('reviewer') || stage.includes('reviewing')) {
        return 'thinking';
      }
      
      if (stage.includes('completed')) {
        return 'success';
      }
    }
    
    if (agentUpdates && agentUpdates.length > 0) {
      const lastUpdate = agentUpdates[agentUpdates.length - 1];
      if (lastUpdate?.agent_type === 'TASK_EXECUTOR') return 'processing';
      if (lastUpdate?.agent_type === 'PLANNER') return 'thinking';
      if (lastUpdate?.agent_type === 'FORMATTER') return 'explaining';
    }
    
    if (isGenerating) return 'explaining';
    
    if (isProcessing) return 'processing';
    
    if (avatarState === 'thinking') return 'thinking';
    if (avatarState === 'processing') return 'processing';
    if (avatarState === 'idle') return 'idle';
    
    return 'idle';
  }, [
    isGenerating,
    isSearching,
    isSearchMode,
    avatarState,
    workflowStage,
    isWorkflowActive,
    workflowCompleted,
    isProcessing,
    automationActive,
    agentUpdates,
  ]);

  const botMessage = useMemo(() => {
    switch (botState) {
      case 'thinking':
        return 'Working on it...';
      case 'searching':
        return 'Searching the web...';
      case 'browsing':
        return 'Browsing pages...';
      case 'scraping':
        return 'Gathering information...';
      case 'processing':
        return 'Working on your request...';
      case 'explaining':
        return 'Preparing to handle your task...';
      case 'success':
        return 'Done!';
      default:
        return 'Ready';
    }
  }, [botState]);

  return { botState, botMessage };
};
