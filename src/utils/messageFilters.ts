/**
 * messageFilters.ts
 * Enhanced filtering logic for AI responses during internet searches
 */

export interface FilterableMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  isSearchResult?: boolean;
  metadata?: string | Record<string, any>;
  [key: string]: any; // Allow additional properties
}

/**
 * Process incoming messages and filter out AI knowledge cutoff disclaimers
 * specifically targeting responses that mention knowledge cutoff or inability to access recent information
 */
/**
 * This function is the primary filter for AI disclaimer messages.
 * When internet search is enabled, it aggressively filters out any message
 * that resembles a knowledge cutoff disclaimer.
 */
export const filterDisclaimerMessages = (
  msg: FilterableMessage | null,
  internetSearchEnabled: boolean
): FilterableMessage | null => {
  // HIGHEST PRIORITY FILTER: When internet search is enabled, ONLY allow messages explicitly marked as search results
  // This is the most aggressive approach and will ensure ONLY search results are displayed
  if (internetSearchEnabled && msg && msg.role === 'assistant') {
    // If the message is not explicitly marked as a search result, filter it out completely
    if (!msg.isSearchResult) {
      console.debug(`🚫 [DEBUG][MessageFilter] SUPPRESSING non-search result assistant message during internet search`);  
      console.debug(`💥 [DEBUG][MessageFilter] CRITICAL: Blocked non-search result message with ID: ${msg.id}`);  
      return null;
    }
    
    // Even for search result messages, check for disclaimer content and filter if found
    if (msg.content.includes("Sorry, as an AI") || 
        msg.content.includes("I don't have real-time data") ||
        msg.content.includes("As of my last update")) {
      console.debug(`🚫 [DEBUG][MessageFilter] SUPPRESSING search result with disclaimer content`);  
      return null;
    }
  }
  // Debug log: Track when filter is called
  console.debug(`🔍 [DEBUG][MessageFilter] Processing message: ${msg?.id || 'null'}, internetSearchEnabled=${internetSearchEnabled}`);
  
  // Skip processing for null messages or non-assistant messages
  if (!msg || msg.role !== 'assistant') {
    console.debug(`⏩ [DEBUG][MessageFilter] Skipping non-assistant message or null: ${msg?.role || 'null'}`);
    return msg;
  }
  
  // ULTRA-AGGRESSIVE FILTERING: When internet search is enabled, block ALL disclaimer messages
  if (internetSearchEnabled) {
    // EXACT MATCH for the specific disclaimer seen in the screenshots
    // This is the highest priority filter that will catch the exact message shown in the screenshots
    if (msg.content.includes("Sorry, as an AI developed by OpenAI") ||
        msg.content.includes("I don't have real-time data") ||
        msg.content.includes("As of my last update") ||
        msg.content.includes("Please check the latest and most accurate information") ||
        (msg.content.includes("Sorry") && msg.content.includes("OpenAI") && msg.content.includes("real-time data"))) {
      console.debug(`🚫 [DEBUG][MessageFilter] BLOCKING EXACT MATCH disclaimer message: "${msg.content.substring(0, 100)}..."`);
      console.debug(`💥 [DEBUG][MessageFilter] CRITICAL: Blocked exact match disclaimer`);
      return null;
    }
    
    // Filter out common knowledge cutoff disclaimers - expanded patterns
    const knowledgeCutoffPatterns = [
      // Exact patterns from the screenshot
      /Sorry, as an AI developed by OpenAI/i,
      /I don't have real-time data or future predictions abilities/i,
      /As of my last update in .* I can't provide/i,
      /Please check the latest and most accurate information from a reliable source/i,
      
      // General patterns
      /my (knowledge|information|training)( data| corpus)? (is limited to|only goes up to|cuts off|has a cutoff|only includes information up to)/i,
      /my (knowledge|training|data) (cutoff|cut-off|cut off)/i,
      /I don't have (access to|information about) (events|information|data|knowledge) (after|beyond|later than)/i,
      /I (cannot|can't) (browse|search|access) the (internet|web)/i,
      /I (don't|do not) have the ability to (search|browse|access) the (internet|web)/i,
      /I'm (not able to|unable to) (search|browse|access) the (internet|web)/i,
      /I (don't|do not) have (real-time|current|up-to-date|the latest) information/i,
      /As an (AI|artificial intelligence)( model| assistant)?, I (don't|do not|cannot|can't) (access|browse|search)/i,
      /I (don't|do not) have access to real-time information/i,
      /My (knowledge|information|training) (is limited to|only includes|has a cutoff|cuts off at)/i
    ];
    
    // Check if the message matches any knowledge cutoff pattern
    if (knowledgeCutoffPatterns.some(pattern => pattern.test(msg.content))) {
      console.debug(`🛑 [DEBUG][MessageFilter] BLOCKING knowledge cutoff disclaimer: "${msg.content.substring(0, 100)}..."`);
      return null;
    }
    
    // Block any message that starts with an apology and mentions knowledge/data limitations
    if (/^(Sorry|I apologize|I'm sorry)/i.test(msg.content.trim()) && 
        (/knowledge|information|data|update|access|real-time|current/i.test(msg.content))) {
      console.debug(`🛑 [DEBUG][MessageFilter] BLOCKING apology + knowledge limitation message`);
      return null;
    }
  }
  
  // Debug log: Show message content preview
  console.debug(`📝 [DEBUG][MessageFilter] Message content preview: "${msg.content.substring(0, 50)}..."`);
  
  // CRITICAL: Always keep search result messages for UI display
  // Enhanced detection of search result messages with more patterns
  if (
    msg.content.startsWith('[SEARCH_RESULTS]') || 
    msg.content.startsWith('🔍') || 
    msg.content.includes('Search results for') ||
    msg.content.includes('Here are the search results') ||
    msg.content.includes('Based on my search') ||
    msg.content.includes('According to the search results') ||
    msg.isSearchResult === true ||
    (msg.metadata && typeof msg.metadata === 'string' && msg.metadata.includes('isSearchResult'))
  ) {
    console.debug(`✅ [DEBUG][MessageFilter] PRESERVING search results message: ${msg.id}`);
    // Force this message to always display by adding isSearchResult flag
    return { ...msg, isSearchResult: true };
  }
  
  // Only apply filtering when internet search is enabled
  if (!internetSearchEnabled) {
    console.debug(`⏩ [DEBUG][MessageFilter] Internet search not enabled, skipping filtering`);
    return msg;
  }

  console.debug(`🔎 [DEBUG][MessageFilter] Internet search is ACTIVE - applying strict filtering`);
  
  const content = msg.content.toLowerCase();
  
  // ULTRA-CRITICAL: Pre-check for exact matches of the problematic patterns seen in screenshots
  // These are the highest priority patterns that MUST be blocked when they appear
  const criticalDisclaimerPatterns = [
    /I['']?m sorry, but as an AI(?: assistant| language model)?(?: developed by OpenAI)?,? (?:I don't have|I cannot|I'm unable)/i,
    /(?:As of|My knowledge only goes up to) (?:September|October) 2021/i,
    /my (?:knowledge|training data) (?:is limited to|only includes information up to|cuts off at) (?:September|October) 2021/i,
    /I don't have (?:access to|the ability to browse|real-time data|current information)/i,
    /I cannot browse the internet/i
  ];
  
  // Check critical patterns first
  for (const pattern of criticalDisclaimerPatterns) {
    if (pattern.test(msg.content)) {
      console.debug(`🚫 [DEBUG][MessageFilter] BLOCKED critical pattern - EXACT MATCH of known disclaimer: ${pattern}`);
      console.debug(`   - Full message: "${msg.content}"`);
      return null; // Block this message immediately
    }
  }
  
  // EXACT PATTERNS - Add direct matches for the examples provided
  // These are highest priority patterns that will immediately filter the message
  const exactDisclaimerPatterns = [
    // Example 1: Exact match for the pattern in the screenshot
    /I['']?m sorry, but as an AI developed by OpenAI, I['']?m currently unable to provide real-time or future information/i,
    
    // Example 2: Match for the September 2021 cutoff mention
    /As of the last update in (?:September|October) 2021/i,
    
    // Example 3: Match for the specific pattern about Monaco Grand Prix
    /I['']?m sorry, but as of now, I['']?m unable to provide information about the Monaco Grand Prix 2025/i,
    
    // Example 4: Match for training data limitation
    /my training data only includes information up until September 2021/i,
    
    // Example 5: Match for future predictions
    /I cannot predict future events/i,
    
    // General OpenAI disclaimer pattern
    /I['']?m sorry, but as an AI (model )?(trained|developed) by OpenAI/i,
    
    // Knowledge cutoff specific patterns
    /knowledge (cutoff|cut[- ]off) (date|point) (is|was) (?:September|October) 2021/i,
    
    // "Developed by OpenAI" combined with limitations
    /developed by OpenAI.*(?:cannot|can't|unable|don't have|do not have) (?:access|provide|predict|browse|search|see)/i,
    
    // Direct references to knowledge limitations
    /my training( data)? (only includes|is limited to|cuts off at)/i,
    
    // Specific disclaimers about internet ability
    /I don't have the ability to (browse|search|access) the (internet|web|current information)/i,
    
    // Common phrasing in knowledge cutoff messages
    /as an AI (assistant|model)?, I (don't have|cannot|am unable to) (access|provide|browse)/i
  ];
  
  // Check for exact matches with our targeted patterns
  for (const pattern of exactDisclaimerPatterns) {
    if (pattern.test(msg.content)) {
      console.debug(`🚫 [DEBUG][MessageFilter] BLOCKED specific AI disclaimer pattern: ${pattern}`);
      console.debug(`   - Preview: ${msg.content.substring(0, 100)}...`);
      return null; // Block this message
    }
  }
  
  // STRUCTURAL PATTERNS - These identify disclaimers based on structure
  // Pattern 1: Starts with apology or limitations
  const startsWithApology = /^(i['']?m sorry|i apologize|sorry|unfortunately)/i.test(content);
  const startsWithLimitation = /^(as|being)\s+(an|a)\s+(ai|assistant|language model)/i.test(content);
  
  console.debug(`📊 [DEBUG][MessageFilter] Structure analysis - StartsWithApology: ${startsWithApology}, StartsWithLimitation: ${startsWithLimitation}`);
  
  // Pattern 2: Contains limitation statements (enhanced patterns)
  const limitationPatterns = [
    // AI identity patterns
    /(as|being)\s+(an|a)\s+(ai|assistant|language\s+model|artificial\s+intelligence)/i,
    
    // Knowledge limitation patterns
    /(cannot|can't|unable\s+to|don't\s+have|do\s+not\s+have|lacks?|without)\s+(access|provide|predict|browse|search|see|know|tell|determine|check|verify)/i,
    /(my|the)\s+(knowledge|data|training|information|database)\s+(is|was|has\s+been|are|were)\s+(limited|outdated|restricted|updated|only|up\s+to|as\s+of|current|cut\s+off|not\s+current)/i,
    /(no|without|lack\s+of)\s+(access|ability|capability|way)\s+to\s+(current|real-time|latest|future|upcoming|live|internet|web)/i,
    /I\s+(don't|do\s+not|cannot|can't)\s+(access|browse|search|retrieve|get)\s+(the\s+internet|current|future|real-time|live\s+data)/i,
    
    // Temporal limitation patterns
    /(information|data|knowledge|training|awareness)\s+(only|just)\s+(goes|extends|up)\s+(to|through|until)/i,
    /(trained|last\s+updated|knowledge\s+cutoff|data\s+cutoff)\s+(is|was|in|on|as\s+of|date|point)/i,
    /(cutoff|cut-off|cut\s+off)\s+date\s+of\s+(?:September|October)\s+2021/i,
    /(?:September|October)\s+2021/i,  // Direct match for these dates
    
    // Request for external verification patterns
    /(please|would\s+need\s+to|you('d|\s+would)\s+(need|have)\s+to)\s+(check|verify|consult|refer\s+to|look\s+at)\s+(official|current|latest|up-to-date|recent)/i,
    /(recommend|suggest|advise)\s+(checking|visiting|consulting|referring\s+to)\s+(official|recent|current|latest)/i,
    
    // Future event patterns
    /(hasn't|has\s+not|have\s+not|haven't)\s+(happened|occurred|taken\s+place|been|started)/i,
    /(future|upcoming|scheduled|not\s+yet|after\s+my|beyond\s+my)\s+(event|information|data|release|update|knowledge)/i
  ];
  
  // Count how many limitation patterns are in the message
  const patternMatches = limitationPatterns.filter(pattern => pattern.test(content)).length;
  console.debug(`📊 [DEBUG][MessageFilter] Limitation patterns matched: ${patternMatches}`);
  
  // Check for specific temporal indicators
  const temporalIndicators = [
    /20\d\d|knowledge cutoff|training|data cutoff|last updated|information up to/i.test(content),
    /as of|until|up to|through/i.test(content) && /20\d\d|january|february|march|april|may|june|july|august|september|october|november|december/i.test(content),
    /my\s+(knowledge|training|data)\s+(is|was)\s+(limited|cut off|only up to|current as of)/i.test(content),
    content.includes("October 2021"),
    content.includes("September 2021")
  ].filter(Boolean);
  
  const hasTemporalIndicators = temporalIndicators.length > 0;
  console.debug(`📊 [DEBUG][MessageFilter] Has temporal indicators: ${hasTemporalIndicators}, Count: ${temporalIndicators.length}`);
  
  // Check for phrases suggesting checking external sources
  const externalSourceIndicators = [
    /check\s+(with|the|official|latest|current|recent)\s+(sources|website|information|data)/i.test(content),
    /visit\s+(the|official|their)\s+website/i.test(content),
    /refer\s+to\s+(the|official|authoritative|up-to-date)/i.test(content)
  ].filter(Boolean);
  
  const hasExternalSourceReferences = externalSourceIndicators.length > 0;
  console.debug(`📊 [DEBUG][MessageFilter] Has external source references: ${hasExternalSourceReferences}, Count: ${externalSourceIndicators.length}`);
  
  // CRITICAL: When internetSearchEnabled is true, we want to be VERY aggressive with filtering
  // Block messages that combine key patterns characteristic of AI disclaimers
  if (
    // Case 1: Starts with an apology AND has temporal indicators
    (startsWithApology && hasTemporalIndicators) ||
    
    // Case 2: Starts with a limitation statement AND has limitation patterns
    (startsWithLimitation && patternMatches > 0) ||
    
    // Case 3: Has multiple limitation patterns AND temporal indicators
    (patternMatches >= 1 && hasTemporalIndicators) || // Reduced threshold from 2 to 1 for more aggressive filtering
    
    // Case 4: Classic "I'm sorry" combined with external references
    (startsWithApology && hasExternalSourceReferences) ||
    
    // Case 5: Direct OpenAI reference (extremely specific to your examples)
    (/developed by OpenAI/i.test(content) && patternMatches > 0) ||
    
    // Case 6: Very aggressive - Any apology that mentions knowledge or limitations
    (startsWithApology && (content.includes("knowledge") || content.includes("training") || content.includes("unable")))
  ) {
    console.debug(`🚫 [DEBUG][MessageFilter] BLOCKED AI disclaimer message - Multiple indicators detected`);
    console.debug(`   - Apology: ${startsWithApology}, Limitation: ${startsWithLimitation}`);
    console.debug(`   - Patterns matched: ${patternMatches}`);
    console.debug(`   - Temporal indicators: ${temporalIndicators.length > 0}`);
    console.debug(`   - External references: ${hasExternalSourceReferences}`);
    console.debug(`   - Full message: "${msg.content}"`);
    return null;
  }
  
  console.debug(`✅ [DEBUG][MessageFilter] Message PASSED filtering checks: ${msg.id}`);
  return msg;
};
