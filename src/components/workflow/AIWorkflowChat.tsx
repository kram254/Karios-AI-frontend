import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIWorkflowChatProps {
  onWorkflowGenerated: (nodes: any[], edges: any[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function AIWorkflowChat({ onWorkflowGenerated, isOpen, onToggle }: AIWorkflowChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    const thinkingMessage: Message = {
      role: 'assistant',
      content: 'Analyzing your request and breaking down tasks...',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const response = await axios.post('/api/workflows/generate-from-prompt', {
        prompt: userMessage.content,
        conversationHistory: messages.slice(-4)
      });

      console.log('Workflow generation response:', response.data);

      const { nodes, edges, explanation } = response.data;

      setMessages(prev => prev.slice(0, -1));

      if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
        console.warn('No valid nodes in response:', { nodes, edges });
        const errorMsg: Message = {
          role: 'assistant',
          content: 'No workflow nodes were generated. Please try again with a different prompt.',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }

      console.log(`Generating workflow with ${nodes.length} nodes and ${edges?.length || 0} edges`);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: explanation || `Workflow generated with ${nodes.length} nodes!`,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
      onWorkflowGenerated(nodes, edges || []);
    } catch (error: any) {
      console.error('Workflow generation error:', error);
      setMessages(prev => prev.slice(0, -1));
      const errorMessage: Message = {
        role: 'assistant',
        content: error?.response?.data?.detail || 'Failed to generate workflow. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMinimized ? '20px' : '80px',
        left: '20px',
        width: isMinimized ? '320px' : '440px',
        height: isMinimized ? '60px' : '500px',
        background: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>

      <div
        style={{
          padding: '16px',
          borderBottom: isMinimized ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#8b5cf6" />
          <h3 style={{ margin: 0, color: 'white', fontSize: 14, fontWeight: 600 }}>
            AI Workflow Builder
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            {isMinimized ? <Maximize2 size={14} color="white" /> : <Minimize2 size={14} color="white" />}
          </button>
          <button
            onClick={onToggle}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            <X size={14} color="white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                <Sparkles size={32} color="#8b5cf6" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 13, margin: 0 }}>Describe the workflow you want to build</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontSize: 13,
                    lineHeight: '1.5',
                    boxShadow: msg.role === 'user'
                      ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                      : 'none',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isGenerating && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#888',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Generating workflow...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              padding: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '8px 12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What can I help you build?"
                disabled={isGenerating}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: 13,
                  padding: '4px 0',
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                style={{
                  background: input.trim() && !isGenerating
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: input.trim() && !isGenerating ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: input.trim() && !isGenerating
                    ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                    : 'none',
                }}
              >
                {isGenerating ? (
                  <Loader2 size={16} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Send size={16} color="white" />
                )}
              </button>
            </div>
          </form>
        </>
      )}

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}
