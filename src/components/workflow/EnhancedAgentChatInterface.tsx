import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, MessageSquare, Loader2, Sparkles, Download, RotateCcw, Eye, Clock, Zap, Code, FileText, Play, Activity } from 'lucide-react';

interface AgentChatInterfaceProps {
  workflowId: string;
  workflowName: string;
  executionId: string;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    executionTime?: number;
    tokensUsed?: number;
    nodesPassed?: string[];
    variables?: Record<string, any>;
  };
}

interface TestScenario {
  name: string;
  messages: string[];
  description: string;
}

export function EnhancedAgentChatInterface({ 
  workflowId, 
  workflowName, 
  executionId,
  onClose 
}: AgentChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your **${workflowName}** agent. I'm ready to help you. What would you like to do?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showExecutionTrace, setShowExecutionTrace] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [conversationVariables, setConversationVariables] = useState<Record<string, any>>({});
  const [executionTrace, setExecutionTrace] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({ avgLatency: 0, totalTokens: 0, messageCount: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Predefined test scenarios
  const testScenarios: TestScenario[] = [
    {
      name: 'Basic Greeting',
      messages: ['Hello!', 'How are you?', 'What can you help me with?'],
      description: 'Test basic conversation flow'
    },
    {
      name: 'Complex Query',
      messages: ['Can you analyze this data?', 'What are the key findings?'],
      description: 'Test reasoning capabilities'
    },
    {
      name: 'Multi-turn Dialog',
      messages: ['I need help', 'It\'s about automation', 'Guide me through the steps'],
      description: 'Test conversation memory'
    }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isMinimized) inputRef.current?.focus();
  }, [isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    const startTime = performance.now();

    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          nodes: [],
          edges: [],
          variables: {
            userInput: currentInput,
            conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
            ...conversationVariables
          }
        })
      });

      if (!response.ok) throw new Error('Failed to execute workflow');

      const data = await response.json();
      const executionTime = performance.now() - startTime;
      
      let agentResponse = 'I processed your request successfully.';
      let tokensUsed = 0;
      let nodesPassed: string[] = [];
      let extractedVariables: Record<string, any> = {};
      
      if (data.execution?.nodeResults) {
        const results = Object.entries(data.execution.nodeResults);
        nodesPassed = results.map(([nodeId]) => nodeId);
        
        for (const [_, result] of results) {
          const nodeResult = result as any;
          if (nodeResult.response) agentResponse = nodeResult.response;
          if (nodeResult.tokens_used) tokensUsed += nodeResult.tokens_used;
          if (nodeResult.output) extractedVariables = { ...extractedVariables, ...nodeResult.output };
        }
      }

      setConversationVariables(prev => ({ ...prev, ...extractedVariables }));
      setPerformanceMetrics(prev => ({
        avgLatency: (prev.avgLatency * prev.messageCount + executionTime) / (prev.messageCount + 1),
        totalTokens: prev.totalTokens + tokensUsed,
        messageCount: prev.messageCount + 1
      }));

      setExecutionTrace(prev => [...prev, {
        timestamp: new Date(),
        input: currentInput,
        output: agentResponse,
        executionTime,
        tokensUsed,
        nodesPassed
      }]);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: agentResponse,
        timestamp: new Date(),
        metadata: { executionTime, tokensUsed, nodesPassed, variables: extractedVariables }
      }]);
    } catch (error) {
      console.error('Chat execution error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset conversation? All messages will be cleared.')) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hi! I'm your **${workflowName}** agent. I'm ready to help you. What would you like to do?`,
        timestamp: new Date()
      }]);
      setConversationVariables({});
      setExecutionTrace([]);
      setPerformanceMetrics({ avgLatency: 0, totalTokens: 0, messageCount: 0 });
    }
  };

  const handleExportTranscript = () => {
    const transcript = {
      workflowName,
      exportDate: new Date().toISOString(),
      messages,
      performanceMetrics,
      variables: conversationVariables,
      executionTrace
    };

    const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunScenario = async (scenario: TestScenario) => {
    setShowScenarios(false);
    for (const msg of scenario.messages) {
      setInput(msg);
      await new Promise(r => setTimeout(r, 500));
      await handleSend();
      await new Promise(r => setTimeout(r, 1500));
    }
  };

  const renderMarkdown = (content: string) => {
    const html = content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 3px; font-family: monospace;">$1</code>')
      .replace(/\n/g, '<br />');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          width: '64px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)',
        }}
        onClick={() => setIsMinimized(false)}
      >
        <MessageSquare className="w-8 h-8 text-white" />
        {messages.length > 1 && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {messages.length - 1}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed right-4 bottom-4 z-50"
      style={{
        width: '420px',
        height: '600px',
        maxHeight: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
      }}
    >
      {/* Enhanced Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: '600' }}>
                {workflowName}
              </h3>
              <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
                {messages.length - 1} messages • {performanceMetrics.totalTokens} tokens
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setIsMinimized(true)}
              title="Minimize"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer',
              }}
            >
              <Minimize2 className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={onClose}
              title="Close"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer',
              }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={handleReset} title="Reset" style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'white',
            fontSize: '12px',
          }}>
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button onClick={handleExportTranscript} title="Export" style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'white',
            fontSize: '12px',
          }}>
            <Download className="w-3 h-3" />
            Export
          </button>
          <button onClick={() => setShowVariables(!showVariables)} title="Variables" style={{
            background: showVariables ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'white',
            fontSize: '12px',
          }}>
            <Eye className="w-3 h-3" />
            Variables
          </button>
          <button onClick={() => setShowExecutionTrace(!showExecutionTrace)} title="Trace" style={{
            background: showExecutionTrace ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'white',
            fontSize: '12px',
          }}>
            <Code className="w-3 h-3" />
            Trace
          </button>
          <button onClick={() => setShowScenarios(!showScenarios)} title="Test Scenarios" style={{
            background: showScenarios ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'white',
            fontSize: '12px',
          }}>
            <Play className="w-3 h-3" />
            Test
          </button>
        </div>

        {/* Performance Stats */}
        {performanceMetrics.messageCount > 0 && (
          <div style={{
            display: 'flex',
            gap: '12px',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.9)',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
          }}>
            <span>⚡ Avg: {performanceMetrics.avgLatency.toFixed(0)}ms</span>
            <span>📊 Total: {performanceMetrics.totalTokens} tokens</span>
            <span>💬 {performanceMetrics.messageCount} responses</span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        background: '#f9fafb',
        position: 'relative',
      }}>
        {/* Test Scenarios Panel */}
        {showScenarios && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            padding: '16px',
            zIndex: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Test Scenarios</h4>
              <button onClick={() => setShowScenarios(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
            {testScenarios.map((scenario, idx) => (
              <div
                key={idx}
                onClick={() => handleRunScenario(scenario)}
                style={{
                  padding: '12px',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
              >
                <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>{scenario.name}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{scenario.description}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>
                  {scenario.messages.length} messages
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Variables Inspector */}
        {showVariables && Object.keys(conversationVariables).length > 0 && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '200px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            padding: '12px',
            fontSize: '11px',
            zIndex: 10,
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600' }}>Variables</h4>
            {Object.entries(conversationVariables).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '6px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                <div style={{ fontWeight: '600', color: '#667eea' }}>{key}</div>
                <div style={{ color: '#6b7280', wordBreak: 'break-word' }}>
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Execution Trace */}
        {showExecutionTrace && executionTrace.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '250px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            padding: '12px',
            fontSize: '11px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 10,
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600' }}>Execution Trace</h4>
            {executionTrace.slice(-5).reverse().map((trace, idx) => (
              <div key={idx} style={{
                marginBottom: '8px',
                padding: '8px',
                background: '#f3f4f6',
                borderRadius: '6px',
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                  <span>⚡ {trace.executionTime.toFixed(0)}ms</span>
                  <span>📊 {trace.tokensUsed || 0} tokens</span>
                </div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>
                  {trace.nodesPassed?.length || 0} nodes executed
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '75%',
              padding: '12px 16px',
              borderRadius: '12px',
              background: message.role === 'user'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'white',
              color: message.role === 'user' ? 'white' : '#1f2937',
              boxShadow: message.role === 'user'
                ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                : '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                {renderMarkdown(message.content)}
              </div>
              
              <div style={{ 
                fontSize: '11px', 
                opacity: 0.7, 
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock className="w-3 h-3" />
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {message.metadata?.executionTime && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap className="w-3 h-3" />
                    {message.metadata.executionTime.toFixed(0)}ms
                  </span>
                )}
                
                {message.metadata?.tokensUsed && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText className="w-3 h-3" />
                    {message.metadata.tokensUsed} tokens
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '16px',
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Agent is thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        background: 'white',
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#e5e7eb',
              color: 'white',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
