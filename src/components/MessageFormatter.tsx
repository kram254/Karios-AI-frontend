import React from 'react';
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
  // Only format assistant messages
  if (role !== 'assistant' || !content) {
    return <>{content}</>;
  }

  // Process the content as plain text first to remove all markdown symbols
  let plainTextContent = content;

  // Remove all hash marks from headings and make the text bold
  plainTextContent = plainTextContent
    // Handle numbered section with hash marks - replace with bold
    .replace(/^(\d+)\.\s+#{1,3}\s+(.+)$/gm, '$1. **$2**')
    
    // Handle hash marks at the beginning of lines - replace with bold
    .replace(/^(\s*)#{1,3}\s+(.+)$/gm, '$1**$2**')
    
    // Remove any remaining ### that weren't caught by the above patterns
    .replace(/#{1,3}/g, '')
    
    // Remove bullet markers but preserve the text
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*o\s+/gm, '')
    
    // Normalize multiple consecutive line breaks
    .replace(/\n{3,}/g, '\n\n');

  return (
    <div className="message-content">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Style headers
          h1: ({children}) => <h1 className="message-heading-1">{children}</h1>,
          h2: ({children}) => <h2 className="message-heading-2">{children}</h2>,
          h3: ({children}) => <h3 className="message-heading-3">{children}</h3>,
          h4: ({children}) => <h3 className="message-heading-3">{children}</h3>,
          h5: ({children}) => <h3 className="message-heading-3">{children}</h3>,
          h6: ({children}) => <h3 className="message-heading-3">{children}</h3>,
          
          // Style lists
          ul: ({children}) => <ul className="message-list">{children}</ul>,
          ol: ({children}) => <ol className="message-ordered-list">{children}</ol>,
          li: ({children}) => <li className="message-list-item">{children}</li>,
          
          // Style code blocks with a simpler approach to avoid TypeScript errors
          code: ({children, ...props}: any) => {
            const isInline = !(props.className && /language-/.test(props.className));
            return isInline 
              ? <code className="message-inline-code" {...props}>{children}</code>
              : <code className="message-block-code" {...props}>{children}</code>;
          },
          
          // Add proper spacing for paragraphs
          p: ({children}) => <p className="message-paragraph">{children}</p>,
          
          // Style blockquotes
          blockquote: ({children}) => <blockquote className="message-blockquote">{children}</blockquote>,
          
          // Style tables
          table: ({children}) => <table className="message-table">{children}</table>,
          th: ({children}) => <th>{children}</th>,
          td: ({children}) => <td>{children}</td>,
          
          // Style emphasis and strong
          em: ({children}) => <em className="message-emphasis">{children}</em>,
          strong: ({children}) => <strong className="message-strong">{children}</strong>,
          
          // Style horizontal rules
          hr: () => <hr className="message-hr" />,
        }}
      >
        {plainTextContent}
      </ReactMarkdown>
    </div>
  );
};

export default MessageFormatter;
