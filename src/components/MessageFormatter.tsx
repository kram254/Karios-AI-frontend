import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Modal } from '@mui/material';
import MessageContextIndicator from './context/MessageContextIndicator';
import ContextViewer from './context/ContextViewer';
import { chatService } from '../services/api/chat.service';
import './messageFormatter.css';

interface MessageFormatterProps {
  content: string;
  role: string;
  messageId?: string;
  chatId?: string;
  contextQuality?: number;
  contextState?: string;
}

/**
 * Component to format message content with proper styling
 * Uses React Markdown to render markdown as properly formatted HTML
 */
export const MessageFormatter: React.FC<MessageFormatterProps> = ({ 
  content, 
  role, 
  messageId, 
  chatId, 
  contextQuality, 
  contextState 
}) => {
  const [contextOpen, setContextOpen] = useState(false);
  const [contextData, setContextData] = useState<any>(null);
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
    
    // Check if this is a search result message
    const isSearchResult = content.startsWith('[SEARCH_RESULTS]');
    
    // Remove the [SEARCH_RESULTS] prefix if present
    let fixed = isSearchResult ? content.replace('[SEARCH_RESULTS] ', '') : content;
    
    // Convert HTML tags to markdown for search results
    if (isSearchResult) {
      // Replace common HTML tags with markdown equivalents
      fixed = fixed
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**') // Convert <strong> to **bold**
        .replace(/<b>(.*?)<\/b>/g, '**$1**') // Convert <b> to **bold**
        .replace(/<em>(.*?)<\/em>/g, '*$1*') // Convert <em> to *italic*
        .replace(/<i>(.*?)<\/i>/g, '*$1*') // Convert <i> to *italic*
        .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)') // Convert <a> to [text](url)
        .replace(/<br\s*\/?>/g, '\n') // Convert <br> to newline
        .replace(/<\/?p>/g, '\n\n') // Convert <p> to double newline
        .replace(/<\/?[^>]+(>|$)/g, ''); // Remove any other HTML tags
    }
    
    // 1. Clean up multiple bold asterisks (turn ****text**** into **text**)
    fixed = fixed.replace(/\*{4,}/g, '**');
    
    // 2. Fix headers with duplicate patterns
    fixed = fixed.replace(/#{1,6}\s+\*\*\d+\.\s+#{1,6}\s+\*\*\d+\.\s+/g, '### **');
    
    // 3. Fix bullet points with extra asterisks
    fixed = fixed.replace(/[-*]\s+\*\*[-*]\s+\*\*/g, '- **');
    
    // 4. Remove visible markdown formatting tags (like **N. ### Title:**)
    fixed = fixed.replace(/\*\*(\d+)\. ###\s+([^:]+):\*\*/g, '$1. $2:');
    fixed = fixed.replace(/\*\*(\d+)\. ###\s+([^*]+)\*\*/g, '$1. $2');
    fixed = fixed.replace(/\*\*(\d+)\.\s+([^\n*:]+):\*\*/g, '$1. $2:');

    // 5. Remove extra asterisks around section numbers
    fixed = fixed.replace(/^\*\*(\d+)\. ([^*]+)\*\*/gm, '$1. $2');
    
    // 6. Remove any visible markdown formatting that shouldn't be visible
    const cleanMarkdown = (text: string): string => {
      let result = text;
      
      // Remove duplicate headers
      result = result.replace(/(#{1,6})\s+\*\*(\d+)\.\s+(#{1,6})\s+\*\*(\d+)\.\s+([^*]+)\*\*\*\*/g, '$1 $4. $5');
      
      // Fix bullet points with extra formatting
      result = result.replace(/^(\s*)[-*]\s+\*\*[-*]\s+\*\*([^:*]+)(\*\*:\*\*|\*\*:|:)*/gm, '$1- $2:');
      
      // Fix any duplicate bullets
      result = result.replace(/^(\s*)[-*]\s+[-*]\s+/gm, '$1- ');
      
      // Fix broken horizontal rules
      result = result.replace(/^\s*[-*]{3,}\s*$/gm, '---');
      
      // Remove visible heading markdown like **N. ### Title:**
      result = result.replace(/^(#{1,6})\s+\*\*(\d+)\. ([^\n*]+)\*\*/gm, '$1 $2. $3');
      
      // Remove visible header markdown
      result = result.replace(/^\*\*(\d+)\. ###\s+([^:]+):\*\*/gm, '### $1. $2:');
      result = result.replace(/^\*\*(\d+)\. ###\s+([^*]+)\*\*/gm, '### $1. $2');
      
      // Fix inconsistent section numbering
      result = result.replace(/^(#{1,6})\s+\*\*(\d+)\.\s+([^\n*]+)\*\*[\s\S]*?\1\s+\*\*(\d+)\.\s+(?:#{1,6})?\s*\*\*(\d+)\.\s+/gm, 
        (match, h, _, title, n2, n3) => {
          const firstPart = match.substring(0, match.indexOf(title) + title.length);
          return firstPart + match.substring(firstPart.length).replace(
            new RegExp(`${h}\\s+\\*\\*${n2}\\.\\s+(?:#{1,6})?\\s*\\*\\*${n3}\\.\\s+`),
            `${h} ${n3}. `
          );
        }
      );
      
      return result;
    };
    
    // Apply all markdown fixes
    return cleanMarkdown(fixed);
  }, [content, role]);

  const handleContextView = async () => {
    if (!messageId || !chatId) return;
    
    try {
      const response = await chatService.getMessageContext(chatId, messageId);
      setContextData(response.data);
      setContextOpen(true);
    } catch (err) {
      console.error('Error fetching message context:', err);
    }
  };

  const handleCloseContext = () => {
    setContextOpen(false);
  };

  const isAutomationPlan = content.startsWith('[AUTOMATION_PLAN]');
  
  if (isAutomationPlan) {
    try {
      const planData = JSON.parse(content.replace('[AUTOMATION_PLAN]\n', ''));
      return (
        <>
          <div className="automation-plan-container">
            <div className="plan-header">
              <div className="plan-title">🤖 Web Automation Plan</div>
              <div className="plan-description">{planData.task_description}</div>
            </div>
            
            {planData.steps && planData.steps.length > 0 && (
              <div className="plan-steps">
                <div className="steps-title">Execution Steps:</div>
                {planData.steps.map((step: any, index: number) => (
                  <div key={step.id || index} className="plan-step">
                    <div className="step-number">{step.id || index + 1}</div>
                    <div className="step-content">
                      <div className="step-description">{step.description}</div>
                      <div className="step-action">Action: {step.action}</div>
                      {step.details && (
                        <div className="step-details">
                          {Object.entries(step.details).map(([key, value]) => (
                            <span key={key} className="step-detail">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`step-status ${step.status}`}>{step.status}</div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="plan-actions">
              <button 
                className="automation-launch-btn"
                onClick={() => {
                  window.dispatchEvent(new Event('automation:show'));
                  window.dispatchEvent(new Event('automation:start'));
                }}
              >
                🚀 Launch Web Automation Window
              </button>
            </div>
          </div>
          
          <style>{`
            .automation-plan-container {
              background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
              border-radius: 12px;
              padding: 20px;
              margin: 10px 0;
              border: 1px solid #3b82f6;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
            }
            
            .plan-header {
              margin-bottom: 16px;
            }
            
            .plan-title {
              font-size: 18px;
              font-weight: 600;
              color: white;
              margin-bottom: 8px;
            }
            
            .plan-description {
              color: #e2e8f0;
              font-size: 14px;
              line-height: 1.5;
            }
            
            .plan-steps {
              margin: 16px 0;
            }
            
            .steps-title {
              font-weight: 600;
              color: white;
              margin-bottom: 12px;
              font-size: 16px;
            }
            
            .plan-step {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              margin-bottom: 12px;
              padding: 12px;
              background: rgba(255, 255, 255, 0.08);
              border-radius: 8px;
              border-left: 3px solid #3b82f6;
            }
            
            .step-number {
              background: #3b82f6;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 600;
              flex-shrink: 0;
            }
            
            .step-content {
              flex: 1;
            }
            
            .step-description {
              color: white;
              font-weight: 500;
              margin-bottom: 4px;
            }
            
            .step-action {
              color: #cbd5e1;
              font-size: 12px;
              margin-bottom: 4px;
            }
            
            .step-details {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
            }
            
            .step-detail {
              background: rgba(255, 255, 255, 0.1);
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
              color: #e2e8f0;
            }
            
            .step-status {
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
              text-transform: uppercase;
            }
            
            .step-status.pending {
              background: rgba(251, 191, 36, 0.2);
              color: #fbbf24;
              border: 1px solid #fbbf24;
            }
            
            .step-status.running {
              background: rgba(59, 130, 246, 0.2);
              color: #3b82f6;
              border: 1px solid #3b82f6;
            }
            
            .step-status.completed {
              background: rgba(34, 197, 94, 0.2);
              color: #22c55e;
              border: 1px solid #22c55e;
            }
            
            .plan-actions {
              margin-top: 16px;
              display: flex;
              justify-content: center;
            }
            
            .automation-launch-btn {
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              font-size: 14px;
            }
            
            .automation-launch-btn:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
            }
          `}</style>
        </>
      );
    } catch (error) {
      console.error('Failed to parse automation plan:', error);
    }
  }

  return (
    <>
      <div className="markdown-content">
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {role === 'assistant' ? (
            <p className="assistant-prose-paragraph">{processedContent}</p>
          ) : (
            // For user messages, continue using markdown rendering
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
          )}
          {role === 'assistant' && contextQuality !== undefined && (
            <MessageContextIndicator 
              quality={contextQuality} 
              state={contextState}
              onClick={messageId && chatId ? handleContextView : undefined} 
            />
          )}
        </Box>
      </div>

      {/* Context Viewer Modal */}
      <Modal
        open={contextOpen}
        onClose={handleCloseContext}
        aria-labelledby="message-context-modal"
      >
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '80%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 2,
          boxShadow: 24,
          p: 0,
          outline: 'none'
        }}>
          {contextData ? (
            <ContextViewer 
              quality={contextData.quality} 
              layers={contextData.layers}
              onClose={handleCloseContext} 
            />
          ) : (
            <Box sx={{ bgcolor: '#1e1e2f', color: '#fff', p: 4, borderRadius: 2 }}>
              Loading context information...
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default MessageFormatter;
