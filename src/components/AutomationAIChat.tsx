import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AutomationAIChatProps {
  onAutomationGenerated: (steps: any[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  sessionId: string;
}

export function AutomationAIChat({ onAutomationGenerated, isOpen, onToggle, sessionId }: AutomationAIChatProps) {
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

    try {
      const response = await axios.post('/api/automation-planner/generate', {
        prompt: userMessage.content,
        sessionId,
        conversationHistory: messages.slice(-4)
      });

      const { steps, explanation, url } = response.data;

      const assistantMessage: Message = {
        role: 'assistant',
        content: explanation || 'Automation plan generated successfully!',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
      onAutomationGenerated(steps);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Failed to generate automation plan. Please try again.',
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
        right: '20px',
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
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: isMinimized ? 'none' : '1px solid rgba(139, 92, 246, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} style={{ color: '#8b5cf6' }} />
          <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
            AI Automation Assistant
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
          >
            {isMinimized ? <Maximize2 size={16} color="#8b5cf6" /> : <Minimize2 size={16} color="#8b5cf6" />}
          </button>
          <button
            onClick={onToggle}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
          >
            <X size={16} color="#ef4444" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', padding: '32px 16px' }}>
                <Sparkles size={32} style={{ margin: '0 auto 12px', color: '#8b5cf6' }} />
                <p style={{ fontSize: '14px', margin: 0 }}>Describe your automation task</p>
                <p style={{ fontSize: '12px', margin: '8px 0 0', opacity: 0.7 }}>
                  e.g., "Fill out a contact form on example.com"
                </p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))'
                    : 'rgba(255, 255, 255, 0.05)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  maxWidth: '85%',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div style={{ color: 'white', fontSize: '13px', lineHeight: '1.5' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Loader2 size={16} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
                  Generating automation plan...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '16px', borderTop: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe automation task..."
                disabled={isGenerating}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                style={{
                  background: input.trim() ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(139, 92, 246, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Send size={16} color="white" />
              </button>
            </div>
          </form>
        </>
      )}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
