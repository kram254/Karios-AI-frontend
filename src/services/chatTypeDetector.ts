import { ChatType, ChatTypeDetector, ChatUIFeatures } from '../types/chatTypes';

const WEB_AUTOMATION_KEYWORDS = [
  'go to', 'navigate to', 'click on', 'fill in', 'fill out', 'submit',
  'book', 'purchase', 'buy', 'order', 'download from', 'upload to',
  'sign in to', 'login to', 'browse', 'scrape', 'extract from'
];

const WEBSITE_PATTERNS = [
  /https?:\/\/[^\s]+/,
  /www\.[^\s]+/,
  /\.com\b/i,
  /\.org\b/i,
  /\.net\b/i,
  /\.io\b/i
];

const RESEARCH_KEYWORDS = [
  'research', 'analyze', 'compare', 'investigate', 'study',
  'find information about', 'what are the latest', 'tell me everything about',
  'comprehensive analysis', 'deep dive into', 'academic'
];

const TASK_KEYWORDS = [
  'automate', 'workflow', 'multi-step', 'orchestrate',
  'coordinate', 'manage task', 'execute plan', 'perform the following steps'
];

class ChatTypeDetectorService implements ChatTypeDetector {
  detectFromPrompt(prompt: string): ChatType {
    const lowerPrompt = prompt.toLowerCase();
    
    const hasWebsites = WEBSITE_PATTERNS.some(pattern => pattern.test(prompt));
    const hasAutomationKeywords = WEB_AUTOMATION_KEYWORDS.some(keyword => 
      lowerPrompt.includes(keyword)
    );
    
    if (hasWebsites && hasAutomationKeywords) {
      return ChatType.WEB_AUTOMATION;
    }
    
    if (TASK_KEYWORDS.some(keyword => lowerPrompt.includes(keyword))) {
      return ChatType.TASK_AUTOMATION;
    }
    
    if (RESEARCH_KEYWORDS.some(keyword => lowerPrompt.includes(keyword))) {
      return ChatType.DEEP_RESEARCH;
    }
    
    if (lowerPrompt.includes('search') || lowerPrompt.includes('find on the web')) {
      return ChatType.INTERNET_SEARCH;
    }
    
    return ChatType.DEFAULT;
  }

  shouldUseMultiAgent(chatType: ChatType, complexity: number = 0): boolean {
    switch (chatType) {
      case ChatType.WEB_AUTOMATION:
      case ChatType.TASK_AUTOMATION:
      case ChatType.DEEP_RESEARCH:
      case ChatType.MULTI_AGENT:
        return true;
      case ChatType.AGENT_CHAT:
        return complexity > 3;
      default:
        return false;
    }
  }

  getRequiredFeatures(chatType: ChatType, agentActions: string[] = []): ChatUIFeatures {
    const baseFeatures: ChatUIFeatures = {
      showWebAutomationButton: false,
      showSearchButton: false,
      showEmailButton: false,
      showMultiAgentCards: false,
      showTaskOrchestration: false,
      showKnowledgePanel: false,
      showStopButton: true
    };

    switch (chatType) {
      case ChatType.DEFAULT:
        return baseFeatures;

      case ChatType.AGENT_CHAT:
        return {
          ...baseFeatures,
          showWebAutomationButton: agentActions.includes('WEB_AUTOMATION'),
          showSearchButton: agentActions.includes('SEARCH_INTERNET'),
          showEmailButton: agentActions.includes('SEND_MAIL'),
          showKnowledgePanel: agentActions.includes('USE_KNOWLEDGE')
        };

      case ChatType.WEB_AUTOMATION:
        return {
          ...baseFeatures,
          showWebAutomationButton: true,
          showMultiAgentCards: true,
          showTaskOrchestration: true
        };

      case ChatType.TASK_AUTOMATION:
        return {
          ...baseFeatures,
          showMultiAgentCards: true,
          showTaskOrchestration: true
        };

      case ChatType.INTERNET_SEARCH:
        return {
          ...baseFeatures,
          showSearchButton: true
        };

      case ChatType.DEEP_RESEARCH:
        return {
          ...baseFeatures,
          showSearchButton: true,
          showMultiAgentCards: true,
          showTaskOrchestration: true
        };

      case ChatType.KNOWLEDGE_BASED:
        return {
          ...baseFeatures,
          showKnowledgePanel: true
        };

      case ChatType.MULTI_AGENT:
        return {
          ...baseFeatures,
          showWebAutomationButton: agentActions.includes('WEB_AUTOMATION'),
          showSearchButton: true,
          showEmailButton: agentActions.includes('SEND_MAIL'),
          showMultiAgentCards: true,
          showTaskOrchestration: true,
          showKnowledgePanel: true
        };

      default:
        return baseFeatures;
    }
  }
}

export const chatTypeDetector = new ChatTypeDetectorService();
