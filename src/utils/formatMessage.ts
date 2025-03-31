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

  // Clean up duplicate header patterns like "### **1. ### 1. **Title****"
  let fixedContent = content.replace(/(#{1,6})\s+\*\*\d+\.\s+(#{1,6})\s+\d+\.\s+\*\*([^*]+)\*\*\*\*/gm, 
    (_, h1, _h2, title) => `${h1} **${title}**`);
  
  // Fix double headers without numbers
  fixedContent = fixedContent.replace(/(#{1,6})\s+\*\*([^*]+)\s+(#{1,6})\s+([^*]+)\*\*/gm,
    (_, h1, title1, _h2, title2) => `${h1} **${title1 || title2}**`);
  
  // Fix double bullets with asterisks "- **- **Text**"
  fixedContent = fixedContent.replace(/^(\s*)[-*]\s+\*\*[-*]\s+\*\*([^*]+)\*\*/gm, 
    (_, space, text) => `${space}- **${text}**`);
    
  // Fix any remaining double bullets
  fixedContent = fixedContent.replace(/^(\s*)[-*]\s+[-*]\s+/gm, 
    (_, space) => `${space}- `);
  
  // Fix potential double numbered lists 
  fixedContent = fixedContent.replace(/^(\s*)\d+[.)]\s*\d+[.)]\s+/gm, (match) => {
    const number = match.match(/(\d+)/)?.[0] || '1';
    return `${match.match(/^(\s*)/)?.[0] || ''}${number}. `;
  });
  
  // Fix inconsistent nested bullets
  fixedContent = fixedContent.replace(/^(\s{2,})[-*]\s+/gm, '$1- ');
  
  // Fix extra asterisks (more than 2 on each side)
  fixedContent = fixedContent.replace(/\*{3,}([^*]+)\*{3,}/g, '**$1**');
  
  // Fix potential "***" that should be standard horizontal rules
  fixedContent = fixedContent.replace(/^\s*[*-]{3,}\s*$/gm, '---');
  
  // Clean up any double bolding patterns "****text****"
  fixedContent = fixedContent.replace(/\*{4,}([^*]+)\*{4,}/g, '**$1**');
  
  // Clean up headings with too many #s
  fixedContent = fixedContent.replace(/^#{7,}\s+/gm, '###### ');
  
  // Fix broken code blocks
  fixedContent = fixedContent.replace(/`{3,}/g, '```');
  
  return fixedContent;
}
