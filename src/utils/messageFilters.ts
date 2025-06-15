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
export const filterDisclaimerMessages = (
  msg: FilterableMessage | null,
  internetSearchEnabled: boolean
): FilterableMessage | null => {
  // Skip processing for null messages
  if (!msg) {
    return null;
  }
  
  // Skip processing for non-assistant messages
  if (msg.role !== 'assistant') {
    return msg;
  }
  
  // Debug log: Track when filter is called
  console.debug(`🔍 [DEBUG][MessageFilter] Processing message: ${msg.id || 'null'}, internetSearchEnabled=${internetSearchEnabled}`);
  
  // Check if this message was received during internet search mode
  // This ensures messages are consistently filtered even if internet search is later disabled
  const wasReceivedDuringSearch = 
    (msg.metadata && typeof msg.metadata === 'object' && 'wasReceivedDuringSearch' in msg.metadata) ? 
    !!msg.metadata.wasReceivedDuringSearch : false;
    
  // If internet search is not currently enabled AND this message wasn't received during search,
  // then don't filter anything
  if (!internetSearchEnabled && !wasReceivedDuringSearch) {
    console.debug(`⏩ [DEBUG][MessageFilter] Internet search not enabled and message not from search mode, skipping filtering`);
    return msg;
  }
  
  // Log when we're filtering a message that was received during search even though search is now disabled
  if (!internetSearchEnabled && wasReceivedDuringSearch) {
    console.debug(`🔄 [DEBUG][MessageFilter] Internet search is disabled but filtering message from search mode`);
  }
  
  // PRESERVE SEARCH RESULTS: Always keep messages with [SEARCH_RESULTS] tag or isSearchResult flag
  if (msg.isSearchResult === true || 
      (msg.content && msg.content.includes('[SEARCH_RESULTS]'))) {
    console.debug(`🟢 [DEBUG][MessageFilter] PRESERVING explicitly marked search result message: ${msg.id}`);
    return msg; // Always preserve explicitly marked search results
  }
  
  // Enhanced search result detection - check for additional indicators
  if (
    msg.content.startsWith('🔍') || 
    msg.content.includes('Search results for') ||
    msg.content.includes('Here are the search results') ||
    msg.content.includes('Based on my search') ||
    msg.content.includes('According to the search results') ||
    (msg.metadata && typeof msg.metadata === 'string' && msg.metadata.includes('isSearchResult')) ||
    (msg.metadata && typeof msg.metadata === 'object' && msg.metadata.isSearchResult === true)
  ) {
    console.debug(`✅ [DEBUG][MessageFilter] PRESERVING detected search results message: ${msg.id}`);
    // Force this message to always display by adding isSearchResult flag
    return { ...msg, isSearchResult: true };
  }
  
  // AGGRESSIVE FILTERING: For all other assistant messages during internet search mode
  // Filter out any message that might be a knowledge cutoff disclaimer
  
  // Check for common disclaimer phrases
  const containsDisclaimerPhrase = (
    msg.content.includes("Sorry, as an AI") || 
    msg.content.includes("I don't have real-time data") ||
    msg.content.includes("As of my last update") ||
    msg.content.includes("I'm sorry, but as an AI") ||
    msg.content.includes("I can't predict future events") ||
    msg.content.includes("I don't have access to") ||
    msg.content.includes("I cannot browse") ||
    msg.content.includes("I cannot access") ||
    msg.content.includes("knowledge cutoff") ||
    msg.content.includes("training data") ||
    msg.content.includes("training cutoff") ||
    msg.content.includes("I'm not able to") ||
    msg.content.includes("I am not able to") ||
    msg.content.includes("I do not have the ability") ||
    msg.content.includes("I don't have the ability")
  );
  
  if (containsDisclaimerPhrase) {
    console.debug(`🚫 [DEBUG][MessageFilter] SUPPRESSING message with disclaimer content`);
    console.debug(`💥 [DEBUG][MessageFilter] CRITICAL: Blocked disclaimer: "${msg.content.substring(0, 100)}..."`);
    return null;
  }
  
  // Check for apology patterns at the beginning of messages
  const startsWithApology = (
    msg.content.trim().startsWith("I'm sorry") ||
    msg.content.trim().startsWith("I am sorry") ||
    msg.content.trim().startsWith("Sorry")
  );
  
  // Check for limitation statements
  const containsLimitationStatement = (
    msg.content.toLowerCase().includes("as an ai") ||
    msg.content.toLowerCase().includes("as a language model") ||
    msg.content.toLowerCase().includes("as an assistant") ||
    msg.content.toLowerCase().includes("i cannot provide") ||
    msg.content.toLowerCase().includes("i can't provide")
  );
  
  // If message starts with an apology AND contains limitation statement, it's likely a disclaimer
  if (startsWithApology && containsLimitationStatement) {
    console.debug(`🚫 [DEBUG][MessageFilter] SUPPRESSING message with apology + limitation pattern`);
    console.debug(`💥 [DEBUG][MessageFilter] CRITICAL: Blocked apology disclaimer: "${msg.content.substring(0, 100)}..."`);
    return null;
  }
  
  // Check for temporal indicators that suggest knowledge cutoff
  const temporalPatterns = [
    /as of (?:my|the) (?:last|latest|most recent) (?:update|training|knowledge)/i,
    /my (?:knowledge|information|training|data) (?:is limited to|only goes up to|cuts off|ends)/i,
    /(?:don't|do not|cannot|can't) (?:access|retrieve|obtain|get|have) (?:real-time|current|live|up-to-date)/i,
    /(?:won't|will not|cannot|can't) (?:have|contain|include) (?:information|data|events|developments) (?:from|after|beyond|past)/i
  ];
  
  const containsTemporalPattern = temporalPatterns.some(pattern => pattern.test(msg.content));
  
  if (containsTemporalPattern) {
    console.debug(`🚫 [DEBUG][MessageFilter] SUPPRESSING message with temporal limitation pattern`);
    console.debug(`💥 [DEBUG][MessageFilter] CRITICAL: Blocked temporal disclaimer: "${msg.content.substring(0, 100)}..."`);
    return null;
  }
  
  // Additional check for year mentions that might indicate knowledge cutoff
  if (/20(19|20|21|22|23|24)/i.test(msg.content) && 
      /(?:knowledge|training|data|information) (?:from|until|up to|as of)/i.test(msg.content)) {
    console.debug(`🚫 [DEBUG][MessageFilter] SUPPRESSING message with year-based knowledge cutoff`);
    return null;
  }
  
  // ULTRA-AGGRESSIVE: Block any message that has multiple indicators of being a disclaimer
  // This helps catch variations we haven't explicitly coded for
  let disclaimerScore = 0;
  
  // Count disclaimer indicators
  if (startsWithApology) disclaimerScore += 2;
  if (containsLimitationStatement) disclaimerScore += 2;
  if (containsTemporalPattern) disclaimerScore += 2;
  if (msg.content.toLowerCase().includes("openai")) disclaimerScore += 1;
  if (msg.content.toLowerCase().includes("cannot")) disclaimerScore += 1;
  if (msg.content.toLowerCase().includes("unable")) disclaimerScore += 1;
  if (msg.content.toLowerCase().includes("don't have")) disclaimerScore += 1;
  if (msg.content.toLowerCase().includes("do not have")) disclaimerScore += 1;
  if (msg.content.toLowerCase().includes("real-time")) disclaimerScore += 1;
  if (msg.content.toLowerCase().includes("current information")) disclaimerScore += 1;
  if (msg.content.toLowerCase().includes("browse")) disclaimerScore += 1;
  if (msg.content.toLowerCase().includes("internet")) disclaimerScore += 1;
  
  // If the message scores high enough on disclaimer indicators, filter it
  if (disclaimerScore >= 3) {
    console.debug(`🚫 [DEBUG][MessageFilter] SUPPRESSING message with high disclaimer score: ${disclaimerScore}`);
    return null;
  }
  
  // If we've made it this far, keep the message
  console.debug(`✅ [DEBUG][MessageFilter] Message PASSED all filters: ${msg.id}`);
  return msg;
};
