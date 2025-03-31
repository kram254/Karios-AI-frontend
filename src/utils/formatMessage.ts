/**
 * Removes markdown formatting from a string
 * This function removes common markdown syntax like headers, lists, emphasis, etc.
 */
export const stripMarkdown = (text: string): string => {
  if (!text) return '';
  
  return text
    // Remove headers (# Header)
    .replace(/^#+\s+(.*)/gm, '$1')
    // Remove bold/italic markers
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove list markers
    .replace(/^[\s-]*[-+*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^(?:[-*_]){3,}$/gm, '')
    // Remove code blocks but keep content
    .replace(/```[\s\S]*?```/g, (match) => {
      // Extract the content between ``` markers
      const content = match.slice(3, -3).trim();
      // Remove the language identifier if present
      return content.replace(/^.*\n/, '');
    })
    // Remove inline code but keep content
    .replace(/`([^`]+)`/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove images but keep alt text
    .replace(/!\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Convert multiple newlines to maximum double newline
    .replace(/\n{3,}/g, '\n\n')
    // Remove markdown-style section dividers
    .replace(/^###\s*(.*)/gm, '$1');
}

/**
 * Converts markdown formatting to JSX elements for better presentation.
 * This preserves formatting like bold text, lists, and headings but converts
 * them to proper HTML elements rather than showing markdown syntax.
 * 
 * Also prevents double formatting issues like double bullets or double numbering.
 */
export const formatMessageContent = (content: string, role: string): string => {
  // Only process assistant messages
  if (role !== 'assistant' || !content) {
    return content;
  }

  // Fix potential double bullet points
  // Match patterns like "- •" or "* •" or "• -" or "• *"
  let fixedContent = content.replace(/^(\s*)[\-\*]\s*[•\-\*]\s+/gm, '$1• ');
  
  // Fix potential double numbered lists 
  // Match patterns like "1. 1." or "1) 1)" or "1. 1)" or "1) 1."
  fixedContent = fixedContent.replace(/^(\s*)\d+[.\)]\s*\d+[.\)]\s+/gm, (match) => {
    // Extract the first number and use only that
    const number = match.match(/(\d+)/)?.[0] || '1';
    return `${match.match(/^(\s*)/)?.[0] || ''}${number}. `;
  });
  
  // Fix potential issue with nested bullets using the same bullet character
  fixedContent = fixedContent.replace(/^(\s+)[\-\*]\s+/gm, '$1• ');
  
  // Fix potential issue with code blocks that have extra backticks
  fixedContent = fixedContent.replace(/`````+/g, '```');
  
  // Fix potential issue with inconsistent heading formatting
  fixedContent = fixedContent.replace(/^#{3,}\s+/gm, '### ');
  
  // Fix lists that might have inconsistent spacing
  fixedContent = fixedContent.replace(/^(\s*)[\-\*]\s{2,}/gm, '$1• ');
  
  return fixedContent;
}
