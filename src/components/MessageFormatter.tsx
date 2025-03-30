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
 * Simplified to avoid over-formatting content that already has structure
 */
export const MessageFormatter: React.FC<MessageFormatterProps> = ({ content, role }) => {
  // If content is empty or not from assistant, don't process
  if (!content) {
    return <>{content}</>;
  }

  // Simply pass the content to ReactMarkdown without additional preprocessing
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
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageFormatter;
