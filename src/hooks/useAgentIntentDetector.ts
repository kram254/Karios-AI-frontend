/**
 * useAgentIntentDetector — Detects "build me an agent" intent from a chat message.
 *
 * Returns a parsed AgentDraft when the message matches, null otherwise.
 * Used by Chat.tsx to surface the InlineAgentCard after a matching user send.
 */

export interface AgentDraft {
  /** Suggested agent name (kebab-cased + title-cased) */
  name: string;
  /** One-line description of what the agent does */
  description: string;
  /** Pre-selected tool tags */
  tools: AgentTool[];
  /** Delivery channel suggestion */
  delivery: AgentDelivery;
  /** Schedule suggestion (cron-like or human-readable) */
  schedule: AgentSchedule | null;
  /** Original user intent text */
  intentText: string;
}

export type AgentTool =
  | 'web_search'
  | 'web_scrape'
  | 'browser'
  | 'email'
  | 'slack'
  | 'telegram'
  | 'github'
  | 'google_sheets'
  | 'code_execution'
  | 'file_read'
  | 'api_call';

export type AgentDelivery = 'slack_dm' | 'email' | 'telegram' | 'thread' | 'webhook';

export interface AgentSchedule {
  label: string;      // Human-readable: "Every Monday at 9am"
  cron: string;       // Cron expression
}

// ---------------------------------------------------------------------------
// Trigger patterns — any of these phrases kick off the card
// ---------------------------------------------------------------------------
const TRIGGERS = [
  /\b(build|create|make|set up|spin up|deploy|launch|start)\s+(me\s+)?an?\s+agent\s+(that|to|which|for|who)/i,
  /\b(i\s+(need|want))\s+an?\s+agent\s+(that|to|which|for)/i,
  /\bagent\s+that\s+(can|will|should|monitors|tracks|sends|checks|watches|builds|creates|generates|writes)/i,
  /\bcreate\s+(a\s+)?(recurring|scheduled|daily|weekly|hourly)\s+agent/i,
];

// ---------------------------------------------------------------------------
// Tool keyword rules
// ---------------------------------------------------------------------------
const TOOL_RULES: { pattern: RegExp; tool: AgentTool }[] = [
  { pattern: /\b(search|research|google|look up|find info|crawl|scrape)\b/i, tool: 'web_search' },
  { pattern: /\b(scrape|extract|parse)\s+(web|page|site|url|link)/i, tool: 'web_scrape' },
  { pattern: /\b(browse|navigate|click|visit|open)\s+(a\s+)?(website|page|url|link)/i, tool: 'browser' },
  { pattern: /\bemail(s|ing)?\b/i, tool: 'email' },
  { pattern: /\bslack\b/i, tool: 'slack' },
  { pattern: /\btelegram\b/i, tool: 'telegram' },
  { pattern: /\bgithub\b/i, tool: 'github' },
  { pattern: /\b(google\s+sheet|spreadsheet|csv|excel)\b/i, tool: 'google_sheets' },
  { pattern: /\b(run|execute|code|script|python|node)\b/i, tool: 'code_execution' },
  { pattern: /\b(api|endpoint|webhook|rest|fetch)\b/i, tool: 'api_call' },
];

// ---------------------------------------------------------------------------
// Delivery rules
// ---------------------------------------------------------------------------
const DELIVERY_RULES: { pattern: RegExp; delivery: AgentDelivery }[] = [
  { pattern: /\bslack\b/i, delivery: 'slack_dm' },
  { pattern: /\btelegram\b/i, delivery: 'telegram' },
  { pattern: /\bemail(s|ing)?\b/i, delivery: 'email' },
  { pattern: /\bwebhook\b/i, delivery: 'webhook' },
];

// ---------------------------------------------------------------------------
// Schedule rules
// ---------------------------------------------------------------------------
const SCHEDULE_RULES: { pattern: RegExp; label: string; cron: string }[] = [
  { pattern: /\bevery\s+hour(ly)?\b/i, label: 'Every hour', cron: '0 * * * *' },
  { pattern: /\b(every\s+)?(morn|9\s*am|morning)\b/i, label: 'Every morning at 9am', cron: '0 9 * * *' },
  { pattern: /\b(every\s+)?(evening|8\s*pm|end\s+of\s+day)\b/i, label: 'Every evening at 8pm', cron: '0 20 * * *' },
  { pattern: /\b(every\s+)?day(ly)?\b/i, label: 'Daily at 9am', cron: '0 9 * * *' },
  { pattern: /\b(every\s+)?(monday|mon\b|week(ly)?)\b/i, label: 'Every Monday at 9am', cron: '0 9 * * 1' },
  { pattern: /\b(every\s+)?tuesday\b/i, label: 'Every Tuesday at 9am', cron: '0 9 * * 2' },
  { pattern: /\b(every\s+)?wednesday\b/i, label: 'Every Wednesday at 9am', cron: '0 9 * * 3' },
  { pattern: /\b(every\s+)?thursday\b/i, label: 'Every Thursday at 9am', cron: '0 9 * * 4' },
  { pattern: /\b(every\s+)?friday\b/i, label: 'Every Friday at 9am', cron: '0 9 * * 5' },
  { pattern: /\b(every\s+)?(month|monthly)\b/i, label: 'Every month on the 1st', cron: '0 9 1 * *' },
];

// ---------------------------------------------------------------------------
// Name generator
// ---------------------------------------------------------------------------
function generateName(intentText: string): string {
  // Strip trigger words, stop words, and convert to title case
  const stop = new Set([
    'a','an','the','that','to','which','for','who','can','will','should',
    'me','my','our','and','or','of','in','on','at','from','with','is','are',
    'i','it','this','that','build','create','make','set','up','spin','deploy',
    'launch','start','need','want','agent','an','every','weekly','daily',
  ]);

  const words = intentText
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stop.has(w.toLowerCase()))
    .slice(0, 4);

  if (words.length === 0) return 'My Agent';
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') + ' Agent';
}

// ---------------------------------------------------------------------------
// Main detector function
// ---------------------------------------------------------------------------
export function detectAgentIntent(message: string): AgentDraft | null {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length < 10) return null;

  const isMatch = TRIGGERS.some(t => t.test(trimmed));
  if (!isMatch) return null;

  // Extract the "that/to/for/which [...]" intent text
  const intentMatch = trimmed.match(
    /(?:that|to|which|for|who)\s+(.+)$/i
  );
  const intentText = intentMatch ? intentMatch[1].trim() : trimmed;

  // Extract tools
  const tools: AgentTool[] = [];
  for (const { pattern, tool } of TOOL_RULES) {
    if (pattern.test(trimmed) && !tools.includes(tool)) {
      tools.push(tool);
    }
  }
  // Always add web_search as a sensible default if nothing detected
  if (tools.length === 0) tools.push('web_search');

  // Extract delivery
  let delivery: AgentDelivery = 'thread'; // default
  for (const { pattern, delivery: d } of DELIVERY_RULES) {
    if (pattern.test(trimmed)) { delivery = d; break; }
  }

  // Extract schedule
  let schedule: AgentSchedule | null = null;
  for (const { pattern, label, cron } of SCHEDULE_RULES) {
    if (pattern.test(trimmed)) { schedule = { label, cron }; break; }
  }

  return {
    name: generateName(intentText),
    description: intentText.charAt(0).toUpperCase() + intentText.slice(1),
    tools,
    delivery,
    schedule,
    intentText,
  };
}

// ---------------------------------------------------------------------------
// Hook wrapper (React-friendly memoised version)
// ---------------------------------------------------------------------------
export function useAgentIntentDetector(message: string): AgentDraft | null {
  // Pure function — no state needed, detection is synchronous
  return detectAgentIntent(message);
}

// ---------------------------------------------------------------------------
// Tool metadata for display
// ---------------------------------------------------------------------------
export const TOOL_META: Record<AgentTool, { label: string; icon: string }> = {
  web_search:     { label: 'Web Search',    icon: '🔍' },
  web_scrape:     { label: 'Web Scrape',    icon: '🕸' },
  browser:        { label: 'Browser',       icon: '🌐' },
  email:          { label: 'Email',         icon: '📧' },
  slack:          { label: 'Slack',         icon: '💬' },
  telegram:       { label: 'Telegram',      icon: '✈️' },
  github:         { label: 'GitHub',        icon: '🐙' },
  google_sheets:  { label: 'Sheets',        icon: '📊' },
  code_execution: { label: 'Code',          icon: '⚡' },
  file_read:      { label: 'Files',         icon: '📁' },
  api_call:       { label: 'API',           icon: '🔌' },
};

export const DELIVERY_META: Record<AgentDelivery, { label: string; icon: string }> = {
  slack_dm:  { label: 'Slack DM',    icon: '💬' },
  email:     { label: 'Email',       icon: '📧' },
  telegram:  { label: 'Telegram',    icon: '✈️' },
  thread:    { label: 'This thread', icon: '💭' },
  webhook:   { label: 'Webhook',     icon: '🔌' },
};
