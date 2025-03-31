import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './messageFormatter.css';

interface MessageFormatterProps {
  content: string;
  role: string;
}

/**
 * Component to format message content with proper styling
 * Uses React Markdown to render markdown as properly formatted HTML
 */
export const MessageFormatter: React.FC<MessageFormatterProps> = ({ content, role }) => {
  // If content is empty, don't process
  if (!content) {
    return <>{content}</>;
  }

  // Preprocess content to fix markdown issues
  const processedContent = useMemo(() => {
    // Only process assistant messages
    if (role !== 'assistant') {
      return content;
    }
    
    // Fix double formatting issues
    let fixed = content;
    
    // 1. Clean up multiple bold asterisks (turn ****text**** into **text**)
    fixed = fixed.replace(/\*{4,}/g, '**');
    
    // 2. Fix headers with duplicate patterns
    fixed = fixed.replace(/#{1,6}\s+\*\*\d+\.\s+#{1,6}\s+\*\*\d+\.\s+/g, '### **');
    
    // 3. Fix bullet points with extra asterisks
    fixed = fixed.replace(/[-*]\s+\*\*[-*]\s+\*\*/g, '- **');
    
    // 4. Remove any visible markdown formatting that shouldn't be visible
    const cleanMarkdown = (text: string): string => {
      let result = text;
      
      // Remove duplicate headers
      result = result.replace(/(#{1,6})\s+\*\*(\d+)\.\s+(#{1,6})\s+\*\*(\d+)\.\s+([^*]+)\*\*\*\*/g, '$1 **$4. $5**');
      
      // Fix bullet points with extra formatting
      result = result.replace(/^(\s*)[-*]\s+\*\*[-*]\s+\*\*([^:*]+)(\*\*:\*\*|\*\*:|:)*/gm, '$1- **$2:**');
      
      // Fix any duplicate bullets
      result = result.replace(/^(\s*)[-*]\s+[-*]\s+/gm, '$1- ');
      
      // Fix broken horizontal rules
      result = result.replace(/^\s*[-*]{3,}\s*$/gm, '---');
      
      // Fix inconsistent section numbering
      result = result.replace(/^(#{1,6})\s+\*\*(\d+)\.\s+([^\n*]+)\*\*[\s\S]*?\1\s+\*\*\2\.\s+(?:#{1,6})?\s*\*\*(\d+)\.\s+/gm, 
        (match, h, n1, title, n2) => {
          const firstPart = match.substring(0, match.indexOf(title) + title.length + 2);
          return firstPart + match.substring(firstPart.length).replace(
            new RegExp(`${h}\\s+\\*\\*${n1}\\.\\s+(?:#{1,6})?\\s*\\*\\*${n2}\\.\\s+`),
            `${h} **${n2}. `
          );
        }
      );
      
      return result;
    };
    
    // Apply all markdown fixes
    return cleanMarkdown(fixed);
  }, [content, role]);

  return (
    <div className="message-content">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Style headers
          h1: ({children}) => <h1 className="message-heading-1">{children}</h1>,
          h2: ({children}) => <h2 className="message-heading-2">{children}</h2>,
          h3: ({children}) => <h3 className="message-heading-3">{children}</h3>,
          h4: ({children}) => <h4 className="message-heading-3">{children}</h4>,
          h5: ({children}) => <h5 className="message-heading-3">{children}</h5>,
          h6: ({children}) => <h6 className="message-heading-3">{children}</h6>,
          
          // Style lists
          ul: ({children}) => <ul className="message-list">{children}</ul>,
          ol: ({children}) => <ol className="message-ordered-list">{children}</ol>,
          li: ({children}) => <li className="message-list-item">{children}</li>,
          
          // Style code blocks
          code: ({children, className}) => {
            const isInline = !className || !className.includes('language-');
            return isInline 
              ? <code className="message-inline-code">{children}</code>
              : <pre className="message-code-block"><code className="message-block-code">{children}</code></pre>;
          },
          
          // Style tables
          table: ({children}) => <table className="message-table">{children}</table>,
          thead: ({children}) => <thead className="message-table-header">{children}</thead>,
          tbody: ({children}) => <tbody className="message-table-body">{children}</tbody>,
          tr: ({children}) => <tr className="message-table-row">{children}</tr>,
          td: ({children}) => <td className="message-table-cell">{children}</td>,
          th: ({children}) => <th className="message-table-header-cell">{children}</th>,
          
          // Style paragraphs and links
          p: ({children}) => <p className="message-paragraph">{children}</p>,
          a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="message-link">{children}</a>,
          
          // Style emphasis
          em: ({children}) => <em className="message-emphasis">{children}</em>,
          strong: ({children}) => <strong className="message-strong">{children}</strong>,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MessageFormatter;
