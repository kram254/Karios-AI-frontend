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

  // First pass: Fix section headers with duplicate numbers and headers
  // Pattern like: "### **1. ### **1. Title****"
  let fixedContent = content.replace(
    /(#{1,6})\s+\*\*\d+\.\s+(?:#{1,6})\s+\*\*\d+\.\s+([^*]+)\*\*(?:\*\*)?/gm,
    (_, headerLevel, title) => `${headerLevel} **${title.trim()}**`
  );

  // Fix any remaining double headers with inconsistent patterns
  fixedContent = fixedContent.replace(
    /(#{1,6})\s+(?:\*\*)?(?:\d+\.)?\s*(?:#{1,6})\s+(?:\*\*)?(?:\d+\.)?\s*([^*]+)(?:\*\*)?(?:\*\*)?/gm,
    (_, headerLevel, title) => `${headerLevel} **${title.trim()}**`
  );

  // Second pass: Fix bullet points with double marks and bolding
  // Pattern like: "- **- **Text**:**"
  fixedContent = fixedContent.replace(
    /^(\s*)[-*]\s+\*\*[-*]\s+\*\*([^:*]+)(?:\*\*:\*\*|\*\*:|\*)*/gm,
    (_, indent, text) => `${indent}- **${text.trim()}:**`
  );

  // Fix any remaining double bullets
  fixedContent = fixedContent.replace(
    /^(\s*)[-*]\s+[-*]\s+/gm,
    (_, indent) => `${indent}- `
  );

  // Third pass: Fix numbered sections that have inconsistent numbering
  fixedContent = fixedContent.replace(
    /^(#{1,6})\s+\*\*(\d+)\.\s+([^*]+)\*\*/gm,
    (_, headerLevel, num, title) => `${headerLevel} **${num}. ${title.trim()}**`
  );

  // Fourth pass: Clean up special markup and ensure consistent formatting
  
  // Fix triple or more asterisks around text
  fixedContent = fixedContent.replace(/\*{3,}([^*]*)\*{3,}/g, '**$1**');
  
  // Normalize horizontal rules
  fixedContent = fixedContent.replace(/^\s*[-*]{3,}\s*$/gm, '---');
  
  // Fix code blocks with too many backticks
  fixedContent = fixedContent.replace(/`{3,}/g, '```');
  
  // Fix inconsistent spacing in bullet lists
  fixedContent = fixedContent.replace(/^(\s*)[-*]\s{2,}/gm, '$1- ');
  
  // Fix inconsistent bullet point styles in nested lists
  fixedContent = fixedContent.replace(/^(\s{2,})[-*]\s+/gm, '$1- ');

  // Fifth pass: Fix inconsistent section numbering
  // Replace "### **3. Market Position" followed by "### **3. ### **4. Competitive Edge****"
  fixedContent = fixedContent.replace(
    /(#{1,6})\s+\*\*(\d+)\.\s+([^*\n]+)\*\*[\s\S]*?\1\s+\*\*\2\.\s+(?:#{1,6})?\s*\*\*(\d+)\.\s+([^*\n]+)\*\*/gm,
    (match, h1, n1, title1, n2, _title2) => {
      // Keep the first occurrence intact, fix the second one to have the correct number
      const firstPart = match.substring(0, match.indexOf(title1) + title1.length + 2); // +2 for the '**' at the end
      return firstPart + match.substring(firstPart.length).replace(
        new RegExp(`${h1}\\s+\\*\\*${n1}\\.\\s+(?:#{1,6})?\\s*\\*\\*${n2}\\.\\s+`),
        `${h1} **${n2}. `
      );
    }
  );
  
  return fixedContent;
}
