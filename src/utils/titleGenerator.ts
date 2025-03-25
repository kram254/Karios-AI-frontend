/**
 * Generate a descriptive title from the first message in a chat
 * @param message The first user message content
 * @returns A generated title based on the message content
 */
export const generateTitleFromMessage = (message: string): string => {
  // If message is too short, return default
  if (!message || message.length < 3) {
    return 'New Conversation';
  }

  // Truncate and clean up the message if it's too long
  let title = message.trim();
  
  // Extract first sentence or phrase
  const firstSentence = title.split(/[.!?]|\n/)[0].trim();
  
  if (firstSentence.length > 0) {
    title = firstSentence;
  }
  
  // Limit length to be a reasonable title
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  } else if (title.length < 10 && message.length > 10) {
    // If first sentence is too short but message is longer
    title = message.substring(0, Math.min(47, message.length)) + (message.length > 47 ? '...' : '');
  }

  // Ensure it starts with a capital letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return title;
};
