// messageFilter.ts - Enhanced message filtering for AI disclaimers
// This utility helps detect and filter out AI knowledge cutoff disclaimer messages

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  isSearchResult?: boolean;
  metadata?: string | Record<string, any>;
  [key: string]: any; // Allow additional properties
}

/**
 * Processes incoming AI messages and filters out knowledge cutoff disclaimers
 * when internet search is enabled
 */
export const filterAIDisclaimerMessages = (message: Message | null, internetSearchEnabled: boolean): Message | null => {
  // Skip processing for null messages or non-assistant messages
  if (!message || message.role !== 'assistant') return message;
  
  // Always keep search result messages (CRITICAL for UI display)
  if (message.content.startsWith('[SEARCH_RESULTS]') || 
      message.content.startsWith('🔍') || 
      message.isSearchResult === true ||
      (message.metadata && typeof message.metadata === 'string' && message.metadata.includes('isSearchResult'))) {
    console.log("✅ [MessageFilter] Preserving search results message: ", message.id);
    return { ...message, isSearchResult: true }; // Force flag the message
  }
  
  // Only apply filtering when internet search is enabled
  if (!internetSearchEnabled) return message;
  
  const content = message.content.toLowerCase();
  
  // EXACT PATTERNS - Direct matches to examples provided
  // These are highest priority and will immediately filter the message
  const exactDisclaimerPatterns = [
    /I['']m sorry, but as an AI developed by OpenAI, I['']m currently unable to provide real-time or future information/i,
    /As of the last update in (?:September|October) 2021, I suggest checking the most recent resources/i,
    /I['']m sorry, but as of now, I['']m unable to provide information about .* 2025/i,
    /my training data only includes information up until September 2021/i,
    /I cannot predict future events/i,
    /I['']m sorry, but as an AI model (trained|developed) by OpenAI/i,
    /I don't have access to real-time or future information/i,
    /my knowledge cutoff date is/i
  ];
  
  // Check for exact pattern matches
  for (const pattern of exactDisclaimerPatterns) {
    if (pattern.test(message.content)) {
      console.log("🚫 [MessageFilter] BLOCKED message matching exact pattern:", pattern);
      console.log(`   - Preview: ${message.content.substring(0, 50)}...`);
      return null; // Block this message immediately
    }
  }
  
  // STRUCTURAL PATTERNS - These identify disclaimers based on structure
  const startsWithApology = /^(i['']m sorry|i apologize|sorry|unfortunately)/i.test(content);
  const startsWithLimitation = /^(as|being)\s+(an|a)\s+(ai|assistant|language\s+model)/i.test(content);
  
  // Enhanced limitation patterns
  const limitationPatterns = [
    // AI identity patterns
    /(as|being)\s+(an|a)\s+(ai|assistant|language\s+model|artificial\s+intelligence)/i,
    
    // Knowledge limitation patterns
    /(cannot|can't|unable\s+to|don't\s+have|do\s+not\s+have|lacks?|without)\s+(access|provide|predict|browse|search|see|know|tell|determine|check|verify)/i,
    /(my|the)\s+(knowledge|data|training|information|database)\s+(is|was|has\s+been|are|were)\s+(limited|outdated|restricted|updated|only|up\s+to|as\s+of|current|cut\s+off|not\s+current)/i,
    /(no|without|lack\s+of)\s+(access|ability|capability|way)\s+to\s+(current|real-time|latest|future|upcoming|live|internet|web)/i,
    /I\s+(don't|do\s+not|cannot|can't)\s+(access|browse|search|retrieve|get)\s+(the\s+internet|current|future|real-time|live\s+data|post-\w+|after\s+\w+)/i,
    
    // Temporal limitation patterns (enhanced with more date formats)
    /(information|data|knowledge|training|awareness)\s+(only|just)\s+(goes|extends|up)\s+(to|through|until)/i,
    /(trained|last\s+updated|knowledge\s+cutoff|data\s+cutoff)\s+(is|was|in|on|as\s+of|date|point)/i,
    /(cutoff|cut-off|cut\s+off)\s+date\s+of\s+September\s+2021/i,  // Specific to your case
    /(September\s+2021|October\s+2021)/i,  // Direct match for these dates
    
    // Request for external verification patterns
    /(please|would\s+need\s+to|you('d|\s+would)\s+(need|have)\s+to)\s+(check|verify|consult|refer\s+to|look\s+at)\s+(official|current|latest|up-to-date|recent)/i,
    /(recommend|suggest|advise)\s+(checking|visiting|consulting|referring\s+to)\s+(official|recent|current|latest)/i,
    
    // Future event patterns
    /(hasn't|has\s+not|have\s+not|haven't)\s+(happened|occurred|taken\s+place|been|started)/i,
    /(future|upcoming|scheduled|not\s+yet|after\s+my|beyond\s+my)\s+(event|information|data|release|update|knowledge)/i,
    /(would\s+need|need)\s+(real-time|current|more\s+recent|up-to-date)\s+(information|data|sources)/i,
    
    // Specific phrases from examples
    /unable\s+to\s+provide\s+information/i,
    /training\s+data\s+only\s+includes/i,
    /cannot\s+predict\s+future\s+events/i,
    /developed\s+by\s+OpenAI/i
  ];
  
  // Count how many limitation patterns are in the message
  const patternMatches = limitationPatterns.filter(pattern => pattern.test(content)).length;
  
  // Check for specific temporal indicators
  const temporalIndicators = [
    /(20\d\d|knowledge cutoff|training|data cutoff|last updated|information up to|not include|after|post-|only have information up to)/i.test(content),
    /(as of|until|up to|through)\s+(20\d\d|january|february|march|april|may|june|july|august|september|october|november|december)/i.test(content),
    /my\s+(knowledge|training|data)\s+(is|was)\s+(limited|cut off|only up to|current as of)/i.test(content),
    /training data only includes information up to/i.test(content),
    /information up to (?:September|October) 2021/i.test(content),
    // OpenAI specific cutoff language
    /developed by openai/i.test(content),
    content.includes("October 2021") ? 3 : 0,
    content.includes("September 2021") ? 3 : 0
  ].filter(Boolean).length;
  
  // Calculate pattern strength score based on combined factors
  let disclaimerScore = 0;
  if (startsWithApology) disclaimerScore += 2;
  if (startsWithLimitation) disclaimerScore += 2;
  disclaimerScore += patternMatches * 1.5;
  disclaimerScore += temporalIndicators * 2;
  
  // If message contains phrases about checking external sources
  const externalSourceReferences = [
    /check\s+(with|the|official|latest|current|recent)\s+(sources|website|information|data)/i.test(content),
    /visit\s+(the|official|their)\s+website/i.test(content),
    /refer\s+to\s+(the|official|authoritative|up-to-date)/i.test(content)
  ].filter(Boolean).length;
  disclaimerScore += externalSourceReferences * 1.5;
  
  // Use a lower threshold (1.0) to be more aggressive with filtering during internet search
  if (disclaimerScore >= 1.0) {
    console.log(`🚫 [MessageFilter] BLOCKED AI disclaimer message (score: ${disclaimerScore})`);
    console.log(`   - Starts with apology/limitation: ${startsWithApology || startsWithLimitation}`);
    console.log(`   - Limitation patterns: ${patternMatches}`);
    console.log(`   - Temporal indicators: ${temporalIndicators}`);
    console.log(`   - Preview: ${message.content.substring(0, 50)}...`);
    return null; // Filter out this message
  }
  
  // Double-check for classic disclaimer opening followed by any limitation pattern
  // This catches subtler cases that might slip through scoring
  if ((content.startsWith("i'm sorry") || content.startsWith("i apologize") || content.startsWith("sorry")) && 
      patternMatches > 0) {
    console.log(`🚫 [MessageFilter] BLOCKED AI disclaimer message (direct pattern match)`);
    console.log(`   - Preview: ${message.content.substring(0, 50)}...`);
    return null;
  }
  
  return message;
};
