import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, MessageSquare, Loader2, Sparkles, Download, RotateCcw, Eye, Clock, Zap, Code, FileText, Play, Activity, Paperclip, Database, Copy, ThumbsUp, ThumbsDown, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { chatService } from '../../services/api/chat.service';
import { agentService } from '../../services/api/agent.service';
import { knowledgeService } from '../../services/api/knowledge.service';
import MessageFormatter from '../MessageFormatter';
import * as XYFlow from '@xyflow/react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Agent } from '../../types/agent';
import type { Category } from '../../types/knowledge';

 const API_BASE_URL = String((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/$/, '');
 const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

interface AgentChatInterfaceProps {
  workflowId: string;
  workflowName: string;
  executionId: string;
  workflowNodes?: any[];
  workflowEdges?: any[];
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
  workflowNodes,
  workflowEdges,
  onClose 
}: AgentChatInterfaceProps) {
  const { currentChat, setCurrentChat, createNewChat } = useChat();
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showExecutionTrace, setShowExecutionTrace] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [conversationVariables, setConversationVariables] = useState<Record<string, any>>({});
  const [executionTrace, setExecutionTrace] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({ avgLatency: 0, totalTokens: 0, messageCount: 0 });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const feedbackStorageKey = `workflow_message_feedback_${workflowId}_${executionId}`;
  const [messageFeedback, setMessageFeedback] = useState<Record<string, string>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasNodes, setCanvasNodes] = useState<Node[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<Edge[]>([]);
  const canvasSeqRef = useRef(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInitializedRef = useRef(false);
  const navigate = useNavigate();

  const messages: Message[] = currentChat?.messages?.map((msg: any) => ({
    id: msg.id || String(Date.now()),
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content || '',
    timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
    metadata: msg.metadata
  })) || [];

  const onCanvasNodesChange = (changes: any[]) => {
    setCanvasNodes((nds) => (XYFlow as any).applyNodeChanges(changes, nds));
  };

  const onCanvasEdgesChange = (changes: any[]) => {
    setCanvasEdges((eds) => (XYFlow as any).applyEdgeChanges(changes, eds));
  };

  const onCanvasConnect = (connection: any) => {
    setCanvasEdges((eds) => addEdge({ ...connection, animated: true }, eds));
  };

  const addCanvasNote = (text: string) => {
    const t = String(text || '').trim();
    if (!t) return;
    const id = `note_${canvasSeqRef.current++}`;
    const x = 80 + (canvasNodes.length % 3) * 260;
    const y = 80 + Math.floor(canvasNodes.length / 3) * 180;
    setCanvasNodes((prev) => [
      ...prev,
      {
        id,
        position: { x, y },
        data: { label: t },
        style: {
          background: 'rgba(15, 16, 21, 0.92)',
          color: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 12,
          padding: 12,
          width: 260,
          fontSize: 12,
          lineHeight: 1.35,
          boxShadow: '0 14px 40px rgba(0,0,0,0.45)'
        }
      }
    ]);
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const ta = document.createElement('textarea');
        ta.value = content;
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedMessageId(messageId);
      window.setTimeout(() => setCopiedMessageId((prev) => (prev === messageId ? null : prev)), 1200);
    } catch {
    }
  };

  const handleFeedback = (messageId: string, value: string) => {
    setMessageFeedback((prev) => {
      const current = prev[messageId] || '';
      const nextValue = current === value ? '' : value;
      return { ...prev, [messageId]: nextValue };
    });
  };
  
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
  }, [currentChat?.messages]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(feedbackStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        setMessageFeedback(parsed as Record<string, string>);
      }
    } catch {
      setMessageFeedback({});
    }
  }, [feedbackStorageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(feedbackStorageKey, JSON.stringify(messageFeedback));
    } catch {
    }
  }, [feedbackStorageKey, messageFeedback]);

  useEffect(() => {
    if (!isMinimized) inputRef.current?.focus();
  }, [isMinimized]);

  useEffect(() => {
    const loadAgentsAndCategories = async () => {
      try {
        const [agentsRes, categoriesRes] = await Promise.all([
          agentService.getAgents(),
          knowledgeService.getCategories()
        ]);
        const nextAgents = Array.isArray((agentsRes as any)?.data) ? ((agentsRes as any).data as Agent[]) : [];
        const nextCategories = Array.isArray((categoriesRes as any)?.data) ? ((categoriesRes as any).data as Category[]) : [];
        setAgents(nextAgents);
        setCategories(nextCategories);
        if (nextCategories.length > 0) {
          setSelectedCategoryId((prev) => (prev === '' ? nextCategories[0].id : prev));
        }
      } catch {
        setAgents([]);
        setCategories([]);
      }
    };
    loadAgentsAndCategories();
  }, []);

  useEffect(() => {
    const initializeChat = async () => {
      if (chatInitializedRef.current) return;

      setChatLoading(true);
      try {
        const storageKey = `workflow_chat_${workflowId}_${executionId}`;
        const storedChatId = sessionStorage.getItem(storageKey);

        if (storedChatId) {
          try {
            const chatResponse = await chatService.getChat(storedChatId);
            if (chatResponse?.data) {
              setCurrentChat(chatResponse.data);
              setChatId(storedChatId);
              chatInitializedRef.current = true;
              const storedVars = sessionStorage.getItem(`${storageKey}_variables`);
              if (storedVars) {
                try {
                  setConversationVariables(JSON.parse(storedVars));
                } catch {}
              }
              setChatLoading(false);
              return;
            }
          } catch {}
        }

        const newChat = await createNewChat(`${workflowName} - ${new Date().toLocaleString()}`);
        if (newChat) {
          setChatId(newChat.id);
          chatInitializedRef.current = true;
          sessionStorage.setItem(storageKey, newChat.id);
          await chatService.addMessage(newChat.id, {
            content: `Hi! I'm your **${workflowName}** agent. I'm ready to help you. What would you like to do?`,
            role: 'assistant',
            suppressAiResponse: true,
            searchModeActive: false
          });
          const updatedChat = await chatService.getChat(newChat.id);
          if (updatedChat?.data) {
            setCurrentChat(updatedChat.data);
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setChatLoading(false);
      }
    };

    initializeChat();
  }, [workflowId, executionId, workflowName, createNewChat, setCurrentChat]);

  const addSystemMessage = async (content: string) => {
    if (!chatId) return;
    try {
      await chatService.addMessage(chatId, {
        content,
        role: 'system',
        suppressAiResponse: true,
        searchModeActive: false
      });
      const updatedChat = await chatService.getChat(chatId);
      if (updatedChat?.data) {
        setCurrentChat(updatedChat.data);
      }
    } catch (error) {
      console.error('Failed to add system message:', error);
    }
  };

  const handleAttachClick = () => {
    if (isUploading) return;
    if (categories.length === 0) {
      addSystemMessage('No Knowledge categories yet. Click Database to create one, then upload files.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!selectedCategoryId) {
      addSystemMessage('No Knowledge category selected. Click Database to create/manage categories, then upload files.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      for (const file of files) {
        const res = await knowledgeService.uploadFile(file, Number(selectedCategoryId));
        const item = (res as any)?.data;
        const itemId = item?.id;
        addSystemMessage(`Uploaded "${file.name}" to Knowledge Base.`);
        if (typeof itemId === 'number' && Number.isFinite(itemId)) {
          setConversationVariables((prev) => {
            const existing = Array.isArray((prev as any).knowledge_item_ids) ? (prev as any).knowledge_item_ids : [];
            const next = existing.includes(itemId) ? existing : [...existing, itemId];
            return { ...prev, knowledge_item_ids: next };
          });
          if (selectedAgentId !== '') {
            try {
              await agentService.assignKnowledge(String(selectedAgentId), [itemId]);
              addSystemMessage(`Assigned "${file.name}" to selected agent.`);
            } catch {
              addSystemMessage(`Uploaded "${file.name}" but failed to assign to selected agent.`);
            }
          }
        }
      }
    } catch {
      addSystemMessage('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatId) return;

    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    const startTime = performance.now();

    try {
      await chatService.addMessage(chatId, {
        content: currentInput,
        role: 'user',
        suppressAiResponse: true,
        searchModeActive: false
      });

      const updatedChatAfterUser = await chatService.getChat(chatId);
      if (updatedChatAfterUser?.data) {
        setCurrentChat(updatedChatAfterUser.data);
      }

      const nextMessages = updatedChatAfterUser?.data?.messages || messages;
      const execNodes = Array.isArray(workflowNodes) ? workflowNodes : [];
      const execEdges = Array.isArray(workflowEdges) ? workflowEdges : [];
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      const response = await fetch(apiUrl('/api/workflows/execute'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          workflowId,
          nodes: execNodes,
          edges: execEdges,
          inputVariables: {
            user_query: currentInput,
            conversationHistory: nextMessages.map(m => ({ role: m.role, content: m.content })),
            selectedAgentId: selectedAgentId === '' ? undefined : selectedAgentId,
            ...conversationVariables
          }
        })
      });

      if (!response.ok) throw new Error('Failed to execute workflow');

      const data = await response.json();
      const execution = (data as any)?.execution || data;
      const executionTime = performance.now() - startTime;
      
      let agentResponse = 'I processed your request successfully.';
      let tokensUsed = 0;
      let nodesPassed: string[] = [];
      let extractedVariables: Record<string, any> = {};
      
      if (execution?.nodeResults) {
        const results = Object.entries(execution.nodeResults);
        nodesPassed = results.map(([nodeId]) => nodeId);
        
        let lastError = '';
        for (const [_, result] of results) {
          const nodeResult = result as any;
          const candidateResponse =
            nodeResult?.response ||
            nodeResult?.output?.response ||
            nodeResult?.output?.final_answer ||
            nodeResult?.output?.finalAnswer;
          if (typeof candidateResponse === 'string' && candidateResponse.trim()) agentResponse = candidateResponse;
          if (typeof nodeResult?.error === 'string' && nodeResult.error.trim()) lastError = nodeResult.error;
          const candidateTokens = nodeResult?.tokens_used || nodeResult?.tokensUsed || nodeResult?.output?.tokens_used || nodeResult?.output?.tokensUsed;
          if (typeof candidateTokens === 'number' && Number.isFinite(candidateTokens)) tokensUsed += candidateTokens;
          if (nodeResult?.output && typeof nodeResult.output === 'object') extractedVariables = { ...extractedVariables, ...nodeResult.output };
        }

        if (agentResponse === 'I processed your request successfully.' && lastError) {
          agentResponse = lastError;
        }
      }

      const updatedVars = { ...conversationVariables, ...extractedVariables };
      setConversationVariables(updatedVars);
      
      const storageKey = `workflow_chat_${workflowId}_${executionId}`;
      sessionStorage.setItem(`${storageKey}_variables`, JSON.stringify(updatedVars));
      
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

      await chatService.addMessage(chatId, {
        content: agentResponse,
        role: 'assistant',
        suppressAiResponse: true,
        searchModeActive: false
      });

      const finalChat = await chatService.getChat(chatId);
      if (finalChat?.data) {
        setCurrentChat(finalChat.data);
      }
    } catch (error) {
      console.error('Chat execution error:', error);
      await chatService.addMessage(chatId, {
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        suppressAiResponse: true,
        searchModeActive: false
      });
      const errorChat = await chatService.getChat(chatId);
      if (errorChat?.data) {
        setCurrentChat(errorChat.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset conversation? All messages will be cleared.')) {
      const storageKey = `workflow_chat_${workflowId}_${executionId}`;
      sessionStorage.removeItem(storageKey);
      sessionStorage.removeItem(`${storageKey}_variables`);
      
      const newChat = await createNewChat(`${workflowName} - ${new Date().toLocaleString()}`);
      if (newChat) {
        setChatId(newChat.id);
        sessionStorage.setItem(storageKey, newChat.id);
        await chatService.addMessage(newChat.id, {
          content: `Hi! I'm your **${workflowName}** agent. I'm ready to help you. What would you like to do?`,
          role: 'assistant',
          suppressAiResponse: true,
          searchModeActive: false
        });
        const updatedChat = await chatService.getChat(newChat.id);
        if (updatedChat?.data) {
          setCurrentChat(updatedChat.data);
        }
      }
      
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

  const preprocessMessageContent = (content: string, role: Message['role']) => {
    if (role !== 'assistant') return content;
    const raw = String(content || '');
    const blocks = raw.split(/\n\s*\n/g);
    const nextBlocks = blocks.map((b) => {
      const block = String(b || '');
      if (!block) return block;
      if (block.includes('```')) return block;
      const pipeCount = (block.match(/\|/g) || []).length;
      if (pipeCount < 10) return block;
      const lineCount = block.split(/\r?\n/).length;
      if (lineCount <= 1) return block;
      return block.replace(/\r?\n/g, ' ');
    });
    return nextBlocks.join('\n\n');
  };

  const renderMarkdown = (content: string, role: Message['role']) => {
    return <MessageFormatter content={preprocessMessageContent(content, role)} role={role} />;
  };

  if (chatLoading) {
    return (
      <div
        className="fixed right-4 bottom-4 z-50"
        style={{
          width: '420px',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Initializing chat...</div>
        </div>
      </div>
    );
  }

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
        {messages.length > 0 && (
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
            {messages.length}
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
        height: 'calc(100vh - 120px)',
        maxHeight: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
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
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={selectedAgentId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedAgentId(val ? Number(val) : '');
                  }}
                  style={{
                    maxWidth: '210px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    background: 'rgba(255, 255, 255, 0.12)',
                    color: 'white',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                >
                  <option value="" style={{ color: '#111827' }}>Agents</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id} style={{ color: '#111827' }}>{a.name}</option>
                  ))}
                </select>
              </div>
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
          <button onClick={() => setShowCanvas(!showCanvas)} title="Canvas" style={{
            background: showCanvas ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
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
            <Activity className="w-3 h-3" />
            Canvas
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
        minHeight: 0,
        overflowY: 'auto',
        padding: '20px',
        background: '#f9fafb',
        position: 'relative',
      }}>
        {showCanvas && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            bottom: '10px',
            background: '#0B0B10',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            zIndex: 20,
            border: '1px solid rgba(255,255,255,0.10)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.92)'
            }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>Canvas</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => {
                    const t = window.prompt('Add note');
                    if (t) addCanvasNote(t);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.92)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  Add note
                </button>
                <button
                  onClick={() => {
                    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
                    if (lastAssistant?.content) addCanvasNote(lastAssistant.content.slice(0, 1200));
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.92)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  Add last output
                </button>
                <button
                  onClick={() => setShowCanvas(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.85)',
                    cursor: 'pointer',
                    fontSize: 18,
                    lineHeight: 1,
                    padding: '2px 6px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{ width: '100%', height: '100%', flex: 1, minHeight: 0 }}>
              <ReactFlow
                nodes={canvasNodes}
                edges={canvasEdges}
                onNodesChange={onCanvasNodesChange}
                onEdgesChange={onCanvasEdgesChange}
                onConnect={onCanvasConnect}
                fitView
                style={{ background: '#0B0B10' }}
              >
                <Background color="rgba(255,255,255,0.08)" />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </div>
          </div>
        )}
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
        {showVariables && (
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
            {Object.keys(conversationVariables).length === 0 ? (
              <div style={{ color: '#6b7280' }}>No variables yet</div>
            ) : (
              Object.entries(conversationVariables).map(([key, value]) => (
                <div key={key} style={{ marginBottom: '6px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                  <div style={{ fontWeight: '600', color: '#667eea' }}>{key}</div>
                  <div style={{ color: '#6b7280', wordBreak: 'break-word' }}>
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Execution Trace */}
        {showExecutionTrace && (
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
            {executionTrace.length === 0 ? (
              <div style={{ color: '#6b7280' }}>No trace yet</div>
            ) : (
              executionTrace.slice(-5).reverse().map((trace, idx) => (
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
              ))
            )}
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
              alignItems: message.role === 'user' ? 'flex-end' : message.role === 'system' ? 'center' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: message.role === 'system' ? '100%' : '75%',
              padding: '12px 16px',
              borderRadius: '12px',
              background: message.role === 'user'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : message.role === 'system' ? '#eef2ff' : '#0F1015',
              color: message.role === 'user' ? 'white' : message.role === 'system' ? '#1f2937' : 'rgba(255,255,255,0.92)',
              boxShadow: message.role === 'user'
                ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                : '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                {renderMarkdown(message.content, message.role)}
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

                {message.role !== 'system' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    <button
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      title="Copy"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: copiedMessageId === message.id
                          ? '#22c55e'
                          : (message.role === 'assistant' ? 'rgba(255,255,255,0.75)' : 'rgba(31, 41, 55, 0.7)')
                      }}
                    >
                      {copiedMessageId === message.id ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'helpful')}
                      title="Like"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: (messageFeedback[message.id] || '') === 'helpful'
                          ? '#22c55e'
                          : (message.role === 'assistant' ? 'rgba(255,255,255,0.75)' : 'rgba(31, 41, 55, 0.7)')
                      }}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'not_helpful')}
                      title="Dislike"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: (messageFeedback[message.id] || '') === 'not_helpful'
                          ? '#ef4444'
                          : (message.role === 'assistant' ? 'rgba(255,255,255,0.75)' : 'rgba(31, 41, 55, 0.7)')
                      }}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
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
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Working on it...</span>
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
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '10px',
        }}>
          <button
            onClick={() => {
              navigate('/knowledge');
              onClose();
            }}
            title="Knowledge Database"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              color: '#111827',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            <Database className="w-4 h-4" />
            Database
          </button>
          <div style={{
            flex: 1,
            minWidth: 0,
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {categories.length === 0
              ? 'Create a Knowledge category to enable uploads'
              : `Uploads: ${categories.find((c) => c.id === selectedCategoryId)?.name || 'Knowledge'}`}
          </div>
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'nowrap',
        }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelected}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.gif"
            style={{ display: 'none' }}
          />
          <button
            onClick={handleAttachClick}
            disabled={isLoading || isUploading}
            title="Attach"
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              color: '#111827',
              cursor: isLoading || isUploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : '')}
            disabled={isLoading || isUploading || categories.length === 0}
            title="Knowledge Category"
            style={{
              display: 'none',
              maxWidth: '160px',
              padding: '12px 10px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
              outline: 'none',
              background: '#ffffff',
              color: '#111827'
            }}
          >
            {categories.length === 0 ? (
              <option value="">No categories</option>
            ) : (
              categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            )}
          </select>
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
              minWidth: 0,
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              outline: 'none',
              minHeight: '96px',
              maxHeight: '120px',
              resize: 'none',
              overflowY: 'auto',
            }}
            rows={4}
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
