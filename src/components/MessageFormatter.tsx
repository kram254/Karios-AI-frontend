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

  // Detect if the content already has numbering patterns (to avoid double numbering)
  const hasDoubleNumbering = /\d+\. \d+\./.test(content);
  const hasKeyFeatures = /Key Features:/.test(content);
  const hasNumberedListWithBullets = /\d+\. [^\n]+\n[^\n]*(?:-|•)/.test(content);
  
  // Determine if this is AI-formatted content
  const isAIFormattedContent = hasDoubleNumbering || hasKeyFeatures || hasNumberedListWithBullets;

  // Process the content to fix formatting issues
  let processedContent = content;
  
  if (isAIFormattedContent) {
    // For content with double numbering like "1. 1. Porsche 911", remove first number
    if (hasDoubleNumbering) {
      processedContent = processedContent.replace(/(\d+)\. (\d+)\. /g, '**$2.** ');
    } 
    // For content with single numbering pattern like "1. Porsche 911"
    else {
      processedContent = processedContent.replace(/^(\d+)\. /gm, '**$1.** ');
    }
    
    // Format Key Features as bold
    processedContent = processedContent.replace(/Key Features:/g, '**Key Features:**');
    
    // Ensure proper spacing around bullet points
    processedContent = processedContent.replace(/\n- /g, '\n\n- ');
    
    // Ensure proper spacing between entries in a list
    processedContent = processedContent.replace(/(\d+\. .+)\n(?=\d+\.)/g, '$1\n\n');
  } 
  // For non-AI formatted content, apply our standard formatting
  else {
    // Handle numbered section with hash marks - replace with bold
    processedContent = processedContent.replace(/^(\d+)\.\s+#{1,3}\s+(.+)$/gm, '**$1. $2**');
    
    // Handle hash marks at the beginning of lines - replace with bold
    processedContent = processedContent.replace(/^(\s*)#{1,3}\s+(.+)$/gm, '$1**$2**');
    
    // Remove any remaining hash marks that weren't caught by the above patterns
    processedContent = processedContent.replace(/#{1,3}/g, '');
    
    // Preserve bullet points rather than removing them
    processedContent = processedContent.replace(/^\s*[-*]\s+/gm, '- ');
    processedContent = processedContent.replace(/^\s*o\s+/gm, '- ');
  }
  
  // Normalize multiple consecutive line breaks
  processedContent = processedContent.replace(/\n{3,}/g, '\n\n');

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
};

export default MessageFormatter;
