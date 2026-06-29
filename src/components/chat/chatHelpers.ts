import type { Message } from "../../types/chatMessages";

export const isSimpleTask = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  const simplePatterns = [
    /^(what|who|when|where|how much|how many)\s+(is|are|was|were|did|does)\b/i,
    /^(give me|tell me|show me|find|get|search for)\s+(the|a|an)?\s*(current|latest|recent)?\s*(price|weather|time|date|score|result|winner|loser|news)/i,
    /\b(current|latest|today'?s?|recent)\s+(price|weather|time|score|result|news)\b/i,
    /\b(stock|bitcoin|crypto|btc|eth)\s*(price|value)?\b/i,
    /\b(weather|temperature|forecast)\s*(in|for|at)?\b/i,
    /\b(winner|loser|score|result)\s*(of|from|in)?\s*(the)?\s*\w+\s*(game|match|race|grand prix|tournament|championship)?\b/i,
    /\b(grand prix|formula 1|f1|nba|nfl|world cup)\s*(winner|loser|result|score)\b/i,
    /^(who won|who lost|what happened)\b/i
  ];
  const complexIndicators = [
    'comprehensive', 'detailed', 'in-depth', 'analyze', 'compare',
    'research', 'create a report', 'step by step', 'multiple sources',
    'automate', 'web automation', 'fill form', 'scrape', 'extract data',
    'build', 'develop', 'implement', 'design', 'plan', 'strategy',
    'complex task', 'multi-step', 'workflow'
  ];
  const hasComplexIndicator = complexIndicators.some(indicator => lowerMessage.includes(indicator));
  if (hasComplexIndicator) return false;
  const isSimple = simplePatterns.some(pattern => pattern.test(lowerMessage));
  const wordCount = message.split(/\s+/).length;
  if (isSimple || wordCount <= 15) return true;
  return false;
};

export const isMultiAgentMessage = (msg: Message) => {
  return msg.role === 'assistant' && (
    msg.content.includes('Multi-Agent Task Created') ||
    msg.content.includes('Multi-Agent Workflow') ||
    msg.content.includes('Clarification Needed') ||
    msg.content.startsWith('[TASK_EXECUTION]')
  );
};

export const analyzeTaskComplexity = (message: string): { complexity: string; estimated_time: number; tools_required: number; actions: string[] } => {
  const lowerMsg = message.toLowerCase();

  const hasMultipleSites = (lowerMsg.match(/\b(websites?|sites?|pages?)\b/gi) || []).length > 0 ||
                          lowerMsg.includes('compare') || lowerMsg.includes('multiple');
  const hasDataExtraction = /extract|scrape|get data|pull data|collect/i.test(message);
  const hasFormFill = /fill|submit|login|sign|form/i.test(message);
  const hasBrowsing = /browse|visit|navigate|go to|open/i.test(message);
  const hasComparison = /compare|versus|vs|difference|which is better/i.test(message);

  let complexity = 'LOW';
  let estimated_time = 30;
  let tools_required = 1;
  const actions: string[] = [];

  if (hasDataExtraction || hasFormFill) {
    complexity = 'MEDIUM';
    estimated_time = 45;
    tools_required = 2;
  }

  if (hasMultipleSites || hasComparison) {
    complexity = 'MEDIUM';
    estimated_time = 60;
    tools_required = 3;
  }

  if ((hasMultipleSites || hasComparison) && hasDataExtraction) {
    complexity = 'HIGH';
    estimated_time = 90;
    tools_required = 4;
  }

  actions.push('Analyze and refine your request');
  actions.push('Create execution plan with optimal tools');
  if (hasBrowsing || hasDataExtraction) {
    actions.push('Execute browser automation steps');
  }
  if (hasComparison) {
    actions.push('Compile and compare results');
  }
  actions.push('Review quality and format results');

  return { complexity, estimated_time, tools_required, actions };
};

export const formatElapsed = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

const GOOGLE_SEARCH_DOMAIN = /\bgoogle\.[a-z.]+\b/i;
const GOOGLE_SEARCH_ACTION = /\b(search|search for|look up|find)\b/i;
const AUTOMATION_ACTION_KEYWORDS = /(web automation|click on|click|fill form|fill in|login|log in|sign in|sign-in|checkout|add to cart|cart|payment|billing|shipping|register|sign up|signup|scrape|extract from|upload|download|automation)/i;
const NAVIGATION_KEYWORDS = /(browse|visit|navigate to|go to|open website|open the website)/i;
const URL_OR_DOMAIN = /(http:\/\/|https:\/\/|www\.|\b[a-z0-9-]+\.[a-z]{2,}(?:\/[\w\-\.~%!$&'()*+,;=:@\/?#\[\]]*)?\b)/i;

export interface AutomationIntent {
  isGoogleSearchPrompt: boolean;
  keywordMatch: boolean;
}

export const classifyAutomationIntent = (messageContent: string): AutomationIntent => {
  const isGoogleSearchPrompt = GOOGLE_SEARCH_DOMAIN.test(messageContent) && GOOGLE_SEARCH_ACTION.test(messageContent);
  const keywordMatch = !isGoogleSearchPrompt && (AUTOMATION_ACTION_KEYWORDS.test(messageContent) && (URL_OR_DOMAIN.test(messageContent) || NAVIGATION_KEYWORDS.test(messageContent)));
  return { isGoogleSearchPrompt, keywordMatch };
};

export interface TaskPreflight {
  intent: AutomationIntent;
  isSimple: boolean;
  complexity: ReturnType<typeof analyzeTaskComplexity>;
}

export const runTaskPreflight = (messageContent: string): TaskPreflight => {
  const intent = classifyAutomationIntent(messageContent);
  const isSimple = isSimpleTask(messageContent);
  const complexity = analyzeTaskComplexity(messageContent);
  return { intent, isSimple, complexity };
};
