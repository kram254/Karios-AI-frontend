export enum ChatType {
  DEFAULT = 'default',
  AGENT_CHAT = 'agent_chat',
  WEB_AUTOMATION = 'web_automation',
  TASK_AUTOMATION = 'task_automation',
  INTERNET_SEARCH = 'internet_search',
  DEEP_RESEARCH = 'deep_research',
  MULTI_AGENT = 'multi_agent',
  KNOWLEDGE_BASED = 'knowledge_based'
}

export interface ChatState {
  chatType: ChatType;
  isMultiAgent: boolean;
  isGenerating: boolean;
  agentId?: string;
  taskId?: string;
  automationActive?: boolean;
  searchActive?: boolean;
  knowledgeItemIds?: string[];
}

export interface ChatUIFeatures {
  showWebAutomationButton: boolean;
  showSearchButton: boolean;
  showEmailButton: boolean;
  showMultiAgentCards: boolean;
  showTaskOrchestration: boolean;
  showKnowledgePanel: boolean;
  showStopButton: boolean;
}

export interface ChatTypeDetector {
  detectFromPrompt(prompt: string): ChatType;
  shouldUseMultiAgent(chatType: ChatType, complexity?: number): boolean;
  getRequiredFeatures(chatType: ChatType, agentActions?: string[]): ChatUIFeatures;
}
