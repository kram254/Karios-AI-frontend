import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, X, Minimize2, Maximize2, Loader2, Image, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { GraphicsRenderer } from './GraphicsRenderer';

const API_BASE_URL = String((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

interface GraphicData {
  type: 'chart' | 'diagram' | 'ai_image' | 'image';
  engine?: string;
  chart_type?: string;
  diagram_type?: string;
  config?: any;
  code?: string;
  url?: string;
  base64?: string;
  quickchart_url?: string;
  caption?: string;
  metadata?: {
    engine?: string;
    generation_time?: number;
    prompt_used?: string;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  graphic?: GraphicData;
  isGraphicLoading?: boolean;
}

interface AIWorkflowChatProps {
  onWorkflowGenerated: (nodes: any[], edges: any[], meta?: { prompt?: string; analysis?: string; explanation?: string; identified_nodes?: any[] }) => void;
  isOpen: boolean;
  onToggle: () => void;
  currentNodes?: any[];
  currentEdges?: any[];
}

export function AIWorkflowChat({ onWorkflowGenerated, isOpen, onToggle, currentNodes, currentEdges }: AIWorkflowChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const GRAPHICS_CHART_KW = ['chart', 'graph', 'plot', 'bar chart', 'line graph', 'pie chart', 'scatter plot', 'histogram', 'data visualization', 'show data', 'radar chart', 'doughnut', 'area chart'];
  const GRAPHICS_DIAGRAM_KW = ['flowchart', 'diagram', 'flow', 'process map', 'workflow diagram', 'sequence diagram', 'architecture diagram', 'erd', 'class diagram', 'state diagram', 'gantt', 'mind map', 'timeline', 'entity relationship', 'uml', 'org chart'];
  const GRAPHICS_AI_IMAGE_KW = ['draw', 'paint', 'create image', 'generate image', 'picture of', 'illustration of', 'concept art', 'render image', 'infographic', 'mockup', 'product visualization', 'realistic photo'];

  const detectGraphicsIntent = useCallback((prompt: string): boolean => {
    const lower = prompt.toLowerCase();
    const allKw = [...GRAPHICS_CHART_KW, ...GRAPHICS_DIAGRAM_KW, ...GRAPHICS_AI_IMAGE_KW];
    return allKw.some(kw => lower.includes(kw));
  }, []);

  const handleGraphicsGeneration = useCallback(async (prompt: string) => {
    const loadingMsg: Message = {
      role: 'assistant',
      content: 'Generating graphic...',
      timestamp: Date.now(),
      isGraphicLoading: true,
    };
    setMessages(prev => [...prev, loadingMsg]);

    try {
      const response = await axios.post(apiUrl('/api/graphics/generate'), { prompt });
      const data = response.data;

      setMessages(prev => {
        const updated = prev.slice(0, -1);
        if (data.success && data.type && data.type !== 'text') {
          const graphicMsg: Message = {
            role: 'assistant',
            content: data.caption || 'Here is your generated graphic:',
            timestamp: Date.now(),
            graphic: {
              type: data.type,
              engine: data.engine,
              chart_type: data.chart_type,
              diagram_type: data.diagram_type,
              config: data.config,
              code: data.code,
              url: data.url,
              base64: data.base64,
              quickchart_url: data.quickchart_url,
              caption: data.caption,
              metadata: data.metadata,
            },
          };
          return [...updated, graphicMsg];
        }
        const fallbackMsg: Message = {
          role: 'assistant',
          content: data.content || 'Could not determine graphic type from your request. Try being more specific (e.g., "Create a bar chart showing...").',
          timestamp: Date.now(),
        };
        return [...updated, fallbackMsg];
      });
    } catch (err: any) {
      console.error('Graphics generation error:', err);
      setMessages(prev => {
        const updated = prev.slice(0, -1);
        const errMsg: Message = {
          role: 'assistant',
          content: typeof err?.response?.data?.detail === 'string' ? err.response.data.detail : 'Failed to generate graphic. Please try again.',
          timestamp: Date.now(),
        };
        return [...updated, errMsg];
      });
    }
  }, []);

  const handleRegenerate = useCallback((prompt: string) => {
    setIsGenerating(true);
    handleGraphicsGeneration(prompt).finally(() => setIsGenerating(false));
  }, [handleGraphicsGeneration]);

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

    const isGraphic = detectGraphicsIntent(userMessage.content);

    if (isGraphic) {
      try {
        await handleGraphicsGeneration(userMessage.content);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    const thinkingMessage: Message = {
      role: 'assistant',
      content: '🔍 Analyzing request...\n📋 Breaking down into sub-tasks...\n🔧 Identifying required nodes...\n⚙️ Designing workflow...',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const history = messages.slice(-4).map(m => ({ role: m.role, content: m.content }));
      const response = await axios.post(apiUrl('/api/workflows/generate-from-prompt'), {
        prompt: userMessage.content,
        conversationHistory: history,
        existingNodes: currentNodes && currentNodes.length > 0 ? currentNodes.map(n => ({ id: n.id, data: n.data, position: n.position })) : undefined,
        existingEdges: currentEdges && currentEdges.length > 0 ? currentEdges.map(e => ({ id: e.id, source: e.source, target: e.target })) : undefined
      });

      console.log('Workflow generation response:', response.data);

      const { nodes, edges, explanation, analysis, identified_nodes } = response.data;

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
      
      let fullResponse = '';
      
      if (analysis) {
        fullResponse += `📋 Task Analysis:\n${analysis}\n\n`;
      }
      
      if (identified_nodes && Array.isArray(identified_nodes)) {
        fullResponse += `🔧 Identified Nodes:\n${identified_nodes.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n\n`;
      }
      
      if (explanation) {
        fullResponse += `✅ ${explanation}`;
      } else {
        fullResponse += `✅ Workflow generated with ${nodes.length} nodes successfully!`;
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
      onWorkflowGenerated(nodes, edges || [], {
        prompt: userMessage.content,
        analysis,
        explanation,
        identified_nodes
      });
    } catch (error: any) {
      console.error('Workflow generation error:', error);
      setMessages(prev => prev.slice(0, -1));
      const errorMessage: Message = {
        role: 'assistant',
        content: typeof error?.response?.data?.detail === 'string' ? error.response.data.detail : (error?.response?.data?.detail ? JSON.stringify(error.response.data.detail) : 'Failed to generate workflow. Please try again.'),
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
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
        width: isMinimized ? '320px' : '440px',
        height: isMinimized ? '60px' : '640px',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'rgba(10, 10, 10, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
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
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: isDragging ? 'none' : undefined,
            touchAction: 'none',
          }}
          onPointerDown={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest('button')) return;
            if (e.button !== 0) return;
            dragRef.current.pointerId = e.pointerId;
            dragRef.current.startX = e.clientX;
            dragRef.current.startY = e.clientY;
            dragRef.current.startOffsetX = dragOffset.x;
            dragRef.current.startOffsetY = dragOffset.y;
            setIsDragging(true);
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            e.preventDefault();
          }}
          onPointerMove={(e) => {
            if (!isDragging) return;
            if (dragRef.current.pointerId !== e.pointerId) return;
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            setDragOffset({ x: dragRef.current.startOffsetX + dx, y: dragRef.current.startOffsetY + dy });
            e.preventDefault();
          }}
          onPointerUp={(e) => {
            if (dragRef.current.pointerId !== e.pointerId) return;
            setIsDragging(false);
            try {
              (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {}
          }}
          onPointerCancel={(e) => {
            if (dragRef.current.pointerId !== e.pointerId) return;
            setIsDragging(false);
            try {
              (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {}
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
                  maxWidth: msg.graphic ? '95%' : '80%',
                }}
              >
                {msg.isGraphicLoading ? (
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: '200px',
                    }}
                  >
                    <Loader2 size={20} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>Generating graphic...</span>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: msg.graphic ? '10px' : '10px 14px',
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
                    {msg.graphic ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '0 4px' }}>
                          {msg.graphic.type === 'chart' ? <BarChart3 size={14} color="#8b5cf6" /> : <Image size={14} color="#8b5cf6" />}
                          <span style={{ fontSize: 12, color: '#c4b5fd' }}>{msg.content}</span>
                        </div>
                        <GraphicsRenderer
                          graphic={msg.graphic}
                          onRegenerate={msg.graphic.metadata?.prompt_used ? () => handleRegenerate(msg.graphic!.metadata!.prompt_used!) : undefined}
                        />
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                )}
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
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (inputRef.current) {
                    inputRef.current.style.height = 'auto';
                    const newHeight = Math.min(inputRef.current.scrollHeight, 120);
                    inputRef.current.style.height = `${newHeight}px`;
                  }
                }}
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
                  minHeight: '96px',
                  maxHeight: '120px',
                  resize: 'none',
                  overflowY: 'auto',
                }}
                rows={4}
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
    </div>
  );
}
