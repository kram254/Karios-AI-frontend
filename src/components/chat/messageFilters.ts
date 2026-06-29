import type { Message } from "../../types/chatMessages";

export function shouldFilterSearchDisclaimerMessage(
  msg: Message,
  internetSearchEnabled: boolean,
  chatTitle?: string
): boolean {
  if (!internetSearchEnabled) return false;
  if (msg.role === 'user') return false;
  if (msg.content.startsWith('[SEARCH_RESULTS]')) return false;

  if (msg.role !== 'assistant') return false;

  const content = msg.content.toLowerCase();

  const commonDisclaimerPatterns = [
    /^i['']m sorry.{0,30}(as|being).{0,10}(an|a).{0,10}(ai|assistant|model)/i,
    /^(i apologize|sorry).{0,30}(as|being).{0,10}(an|a).{0,10}(ai|assistant|model)/i,
    /(my|the).{0,10}(training|knowledge|data).{0,20}(only|limited|up to|as of|until|cutoff)/i,
    /(cannot|can't|don't|do not|unable to).{0,15}(access|provide|browse|search|know|get|have)/i,
    /(no|without|lack of).{0,15}(access|ability).{0,15}(real-time|current|latest|up-to-date)/i,
    /as (an|a).{0,10}(ai|model|assistant|llm).{0,40}(cannot|can't|don't|do not|unable|limited)/i,
    /(20\d{2}).{0,30}(only|until|up to|not beyond|after this|cutoff)/i,
    /(cannot|can't|unable to|don't have).{0,20}(predict|provide|tell you|know).{0,20}(future|upcoming|will)/i,
    /(training|knowledge).{0,15}(cut-?off|only includes|ends at|limited to)/i,
    /^(as|being).{0,10}(an|a).{0,10}(ai|language model|assistant).{0,40}(cannot|don't|limited to)/i
  ];

  const disclaimerKeywords = [
    'sorry', 'training', 'data', 'knowledge', 'cutoff', 'updated',
    'ai', 'model', 'assistant', 'access', 'cannot', "can't", 'unable',
    'don\'t', 'not able', 'limited', 'latest', 'current', 'up-to-date',
    "don't have the ability", "unable to", "not capable", "not possible",
    "not able", "limited to", "cannot access", "cannot browse",
    "don't have access", "search engine", "unable to search",
    "training data", "knowledge cutoff", "as of", "until",
    "after my", "beyond my", "trained up to", "up until", "up to",
    "i don't know", "i cannot predict", "i don't have information",
    "i'm not able to", "i can't access", "not designed to",
    "i apologize", "i'm sorry", "doesn't include", "lacks ability"
  ];

  const matchesPattern = commonDisclaimerPatterns.some(pattern => pattern.test(content));

  let keywordCount = 0;
  for (const keyword of disclaimerKeywords) {
    if (content.includes(keyword)) {
      keywordCount++;
    }
  }

  const containsSearchTerms = content.includes('search results') ||
    content.includes('found information') ||
    content.includes('according to') ||
    content.includes('based on my search');

  const chatTitleLower = (chatTitle || '').toLowerCase();
  let searchQueryFromTitle = '';
  if (chatTitleLower.startsWith('search:')) {
    searchQueryFromTitle = chatTitleLower.substring(7).trim();
  }

  let contextualMatch = false;
  if (searchQueryFromTitle) {
    const queryTerms = searchQueryFromTitle
      .split(/\s+/)
      .filter(term => term.length > 3)
      .map(term => term.replace(/[^a-z0-9]/gi, ''));

    const limitationPhrases = ["cannot", "can't", "don't have", "not able", "unable", "impossible"];
    const hasLimitationIndicator = limitationPhrases.some(phrase => content.includes(phrase));

    if (hasLimitationIndicator) {
      contextualMatch = queryTerms.some(term => {
        const nearLimitationRegex = new RegExp(
          `(cannot|can't|don't|not able|unable).{0,50}${term}|${term}.{0,50}(cannot|can't|don't|not able|unable)`, 'i'
        );
        return nearLimitationRegex.test(content);
      });
    }
  }

  const likelySearchResponse = containsSearchTerms ||
    (content.includes('http') && content.includes('://')) ||
    (content.match(/\d{4}/) && !content.match(/20(21|22|23)/) && content.includes('published')) ||
    content.includes('website') ||
    content.includes('article');

  if (likelySearchResponse) {
    return false;
  }

  if (matchesPattern || keywordCount >= 3 || contextualMatch) {
    return true;
  }

  return false;
}
