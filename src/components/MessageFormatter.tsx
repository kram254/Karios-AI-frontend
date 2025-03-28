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

  // Check for patterns that indicate AI has already formatted the content
  const hasAIFormatting = (
    // Checking for AI-specific formatting patterns
    /\d+\. #{1,3} \d+\./.test(content) || // Matches "1. ### 1. Porsche"
    /\d+\. #{1,3}/.test(content) ||       // Matches numbered headings like "1. ### Heading"
    /\n- Key Features:/.test(content) ||   // Common AI response pattern with key features
    /^(\d+\. ).*\n.*- /.test(content)     // Numbered list followed by bullet points
  );

  // For AI-formatted content, pre-process it to fix common markdown issues
  if (hasAIFormatting) {
    // Clean up the content to ensure proper markdown rendering
    let processedContent = content
      // Fix numbered headings to proper markdown format
      .replace(/(\d+)\. #{1,3} (\d+)\./g, '$1. **$2.**')
      
      // Convert "X. ### Title" to "**X. Title**" bold format
      .replace(/(\d+)\. #{1,3} ([^\n]+)/g, '**$1. $2**')
      
      // Ensure proper spacing around bullet points
      .replace(/\n- /g, '\n\n- ')
      
      // Preserve Key Features bullet points
      .replace(/- Key Features:/g, '**Key Features:**')
      
      // Ensure proper spacing between list items for improved readability
      .replace(/(\d+\. .+)\n(?=\d+\.)/g, '$1\n\n');

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
            h5: ({children}) => <h5 className="message-heading-3">{children}</h5>,
            h6: ({children}) => <h6 className="message-heading-3">{children}</h6>,
            
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
          {processedContent}
        </ReactMarkdown>
      </div>
    );
  }

  // For content without AI formatting, apply our custom formatting
  let plainTextContent = content;

  // Remove all hash marks from headings and make the text bold
  plainTextContent = plainTextContent
    // Handle numbered section with hash marks - replace with bold
    .replace(/^(\d+)\.\s+#{1,3}\s+(.+)$/gm, '**$1. $2**')
    
    // Handle hash marks at the beginning of lines - replace with bold
    .replace(/^(\s*)#{1,3}\s+(.+)$/gm, '$1**$2**')
    
    // Remove any remaining ### that weren't caught by the above patterns
    .replace(/#{1,3}/g, '')
    
    // Preserve bullet points rather than removing them
    .replace(/^\s*[-*]\s+/gm, '- ')
    .replace(/^\s*o\s+/gm, '- ')
    
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
          h5: ({children}) => <h5 className="message-heading-3">{children}</h5>,
          h6: ({children}) => <h6 className="message-heading-3">{children}</h6>,
          
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
