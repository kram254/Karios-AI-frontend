const ACTION_PATTERNS: Array<{ regex: RegExp; extract: (m: RegExpMatchArray) => string }> = [
  { regex: /(?:research|analyze|compare|review)\s+(?:the\s+)?(?:top\s+\d+\s+)?(.+?)(?:\s+and\s+(?:create|build|make|generate|write)\s+(?:a\s+)?(.+?))?$/i, extract: (m) => m[2] ? `${m[1].trim()} ${m[2].trim()}` : m[1].trim() },
  { regex: /(?:create|build|make|generate|write|draft)\s+(?:a|an|the)?\s*(.+?)(?:\s+(?:for|about|on|regarding)\s+(.+?))?$/i, extract: (m) => m[2] ? `${m[1].trim()} - ${m[2].trim()}` : m[1].trim() },
  { regex: /(?:go\s+to|visit|navigate\s+to|open|scrape|extract\s+(?:information|data|info)\s+(?:from|about))\s+(\S+\.(?:com|org|net|io|ai|dev)\S*)\b.*?(?:(?:extract|get|find|scrape|gather)\s+(?:information\s+about\s+)?(.+?))?$/i, extract: (m) => { try { const host = new URL(m[1].startsWith('http') ? m[1] : `https://${m[1]}`).hostname.replace('www.', '').split('.')[0]; const cap = host.charAt(0).toUpperCase() + host.slice(1); return m[2] ? `${cap} ${m[2].trim()}` : `${cap} Research`; } catch { return m[2] ? m[2].trim() : m[1].trim(); } } },
  { regex: /(?:find|search\s+for|look\s+up|lookup)\s+(.+?)$/i, extract: (m) => `${m[1].trim()} Search` },
  { regex: /(?:summarize|summary\s+of)\s+(.+?)$/i, extract: (m) => `${m[1].trim()} Summary` },
  { regex: /(?:explain|what\s+is|what\s+are|how\s+(?:does|do|to|can))\s+(.+?)$/i, extract: (m) => m[1].trim() },
];

const FILLER_WORDS = /^(i\s+need\s+(?:you\s+to|us\s+to)?|please|can\s+you|could\s+you|i\s+want\s+(?:you\s+to)?|i'd\s+like\s+(?:you\s+to)?|help\s+me|let's)\s+/i;

export const generateTitleFromMessage = (message: string): string => {
  if (!message || message.length < 3) {
    return 'New Conversation';
  }

  let cleaned = message.trim().split(/\n/)[0].trim();
  cleaned = cleaned.replace(FILLER_WORDS, '').trim();

  for (const pattern of ACTION_PATTERNS) {
    const match = cleaned.match(pattern.regex);
    if (match) {
      let title = pattern.extract(match);
      title = title.replace(/[.,;:!?]+$/, '').trim();
      const words = title.split(/\s+/).slice(0, 7);
      title = words.join(' ');
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
      if (title.length > 2) {
        return title.charAt(0).toUpperCase() + title.slice(1);
      }
    }
  }

  let title = cleaned.split(/[.!?]/)[0].trim();
  const titleWords = title.split(/\s+/).slice(0, 7);
  title = titleWords.join(' ');
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  } else if (title.length < 10 && cleaned.length > 10) {
    title = cleaned.substring(0, Math.min(47, cleaned.length)) + (cleaned.length > 47 ? '...' : '');
  }

  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return title || 'New Conversation';
};
