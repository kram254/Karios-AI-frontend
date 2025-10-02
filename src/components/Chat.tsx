import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { MessageSquare, Send, Plus, X, Globe, Zap } from "lucide-react";
import { format } from "date-fns";
import { useChat } from "../context/ChatContext";
import SearchLockTooltip from "./SearchLockTooltip";
import { motion } from "framer-motion";
import toast from 'react-hot-toast';
import AgentInfoBanner from "./agent/AgentInfoBanner";
import MessageFormatter from "./MessageFormatter";
import { chatService, Attachment } from "../services/api/chat.service";
import { generateTitleFromMessage } from "../utils/titleGenerator";
import CollapsibleSearchResults from "./CollapsibleSearchResults";
import AnimatedAvatar from "./AnimatedAvatar";
import AccessedWebsitesFloater from "./AccessedWebsitesFloater";
import WebAutomationIntegration from "./WebAutomationIntegration";
import PlanContainer from "./PlanContainer";
import TaskMessage from "./tasks/TaskMessage";
import { EnhancedMultiAgentWorkflowCard } from './EnhancedMultiAgentWorkflowCard';
import { WorkflowDebugPanel } from './WorkflowDebugPanel';
import multiAgentWebSocketService, { MultiAgentWSMessage } from "../services/multiAgentWebSocket";
import { workflowMessageQueue } from "../services/workflowMessageQueue";
import "../styles/chat.css";

// Use our local Message interface that extends the API ChatMessage properties
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp?: Date | string;
  created_at?: string;
  chat_id?: string;
  attachments?: Attachment[];
}

// Moved Attachment interface to chat.service.ts

interface ChatData {
  id: string;
  title: string;
  messages: Message[];
  created_at?: string;
  updated_at?: string;
  agent_id?: string;
  language?: string;
  chat_type?: string;
  type?: 'internet_search' | string;
  internet_search?: boolean;
}

interface ChatProps {
  chatId?: string;
  onMessage?: (message: string) => void;
  compact?: boolean;
  isTaskMode?: boolean;
}

const Chat: React.FC<ChatProps> = ({ chatId, onMessage, compact = false, isTaskMode = false }) => {
  const { 
    currentChat, 
    addMessage, 
    isSearchMode, 
    performSearch, 
    setCurrentChat, 
    createNewChat,
    internetSearchEnabled, // Get the internet search status from context
    toggleSearchMode, // Keep this for backward compatibility
    searchResults, // Add searchResults back for debugging
    isSearching, // Add isSearching back for debugging
    accessedWebsites, // Add accessedWebsites back
    avatarState,
    setAvatarState,
    avatarMessage,
    setAvatarMessage
  } = useChat();
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [automationActive, setAutomationActive] = useState(false);
  const [automationSessionId, setAutomationSessionId] = useState<string | null>(null);
  const [automationChatId, setAutomationChatId] = useState<string | null>(null);
  const [automationPlans, setAutomationPlans] = useState<Record<string, any>>({});
  const [pendingAutomationTask, setPendingAutomationTask] = useState<string | null>(null);
  const [multiAgentWorkflows, setMultiAgentWorkflows] = useState<Record<string, any>>({});
  const [agentUpdates, setAgentUpdates] = useState<Record<string, MultiAgentWSMessage[]>>({});
  const [clarificationRequests, setClarificationRequests] = useState<Record<string, MultiAgentWSMessage>>({});
  const [taskIdAliases, setTaskIdAliases] = useState<Record<string, string>>({});
  const [activeWorkflowTaskId, setActiveWorkflowTaskId] = useState<string | null>(null);
  const [workflowUpdateCounter, setWorkflowUpdateCounter] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTaskIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  useEffect(() => {
    if (!activeWorkflowTaskId) return;

    const reconciliationInterval = setInterval(() => {
      const stats = workflowMessageQueue.getStats(activeWorkflowTaskId);
      console.log(`🔍 RECONCILIATION CHECK - Task ${activeWorkflowTaskId.slice(0, 8)}:`, stats);

      if (stats.missing > 0) {
        console.warn(`⚠️ MISSING MESSAGES DETECTED - Count: ${stats.missing}, Sequences:`, stats.missingSequences);
      }

      if (stats.unrendered > 0) {
        console.log(`📊 UNRENDERED MESSAGES - ${stats.unrendered} messages waiting to render`);
        setWorkflowUpdateCounter(prev => prev + 1);
      }
    }, 5000);

    return () => clearInterval(reconciliationInterval);
  }, [activeWorkflowTaskId]);

  useEffect(() => {
    console.log('🔥🔥🔥 WORKFLOWS STATE CHANGED:', {
      totalWorkflows: Object.keys(multiAgentWorkflows).length,
      workflows: multiAgentWorkflows,
      activeTaskId: activeWorkflowTaskId,
      counter: workflowUpdateCounter
    });
  }, [multiAgentWorkflows]);

  useEffect(() => {
    console.log('🎯🎯🎯 ACTIVE TASK ID CHANGED:', {
      activeTaskId: activeWorkflowTaskId,
      lastTaskIdRef: lastTaskIdRef.current,
      workflowExists: activeWorkflowTaskId ? !!multiAgentWorkflows[activeWorkflowTaskId] : false
    });
  }, [activeWorkflowTaskId]);

  useEffect(() => {
    console.log('🔢🔢🔢 COUNTER CHANGED:', workflowUpdateCounter);
  }, [workflowUpdateCounter]);

  // Multi-agent WebSocket connection effect with reconnection handling
  useEffect(() => {
    if (currentChat?.id) {
      console.log('📡 CHAT - Connecting to multi-agent WebSocket for chat:', currentChat.id);
      console.log('🏥 QUEUE HEALTH AT CONNECTION:', workflowMessageQueue.getHealthCheck());
      
      multiAgentWebSocketService.disconnect();
      
      const callbacks = {
        onAgentStatus: (data: MultiAgentWSMessage) => {
          console.log('🔥🔥🔥 FRONTEND RECEIVED MESSAGE:', {
            type: data.type,
            agent: data.agent_type,
            status: data.status,
            task_id: data.task_id,
            message: data.message,
            timestamp: new Date().toISOString()
          });
          
          if (data.task_id) {
            console.log('🔥 SETTING ACTIVE TASK ID:', data.task_id);
            lastTaskIdRef.current = data.task_id;
            setActiveWorkflowTaskId(data.task_id);
            
            const sequence = workflowMessageQueue.addMessage(data.task_id, data);
            console.log(`✅ GUARANTEED RECEIPT - Message #${sequence} stored in queue`);
            console.log('📊 CURRENT QUEUE STATS:', workflowMessageQueue.getStats(data.task_id));
            
            setWorkflowUpdateCounter(prev => {
              const newCounter = prev + 1;
              console.log('🔢 COUNTER INCREMENT:', prev, '→', newCounter);
              return newCounter;
            });
            
            setMultiAgentWorkflows(prev => {
              const agentTypeMap: { [key: string]: string } = {
                'PROMPT_REFINER': 'Prompt Refiner',
                'PLANNER': 'Planner',
                'TASK_EXECUTOR': 'Task Executor', 
                'REVIEWER': 'Reviewer',
                'FORMATTER': 'Formatter'
              };
              
              const agentName = agentTypeMap[data.agent_type || ''] || data.agent_type || 'Unknown';
              const newWorkflowStage = data.status === 'completed' ? `${agentName} Completed` : `${agentName} Processing`;
              
              const backendTaskId = data.task_id!;
              const currentWorkflow = prev[backendTaskId] || {};
              const existingUpdates = currentWorkflow.agentUpdates || [];
              
              const isDuplicate = existingUpdates.some((update: any) => 
                update.agent_type === data.agent_type && 
                update.status === data.status && 
                update.timestamp === data.timestamp
              );
              
              if (isDuplicate) {
                console.log('🔥 DUPLICATE UPDATE - Still forcing re-render');
                setWorkflowUpdateCounter(prev => prev + 1);
                return prev;
              }
              
              console.log('🔥 NEW UPDATE - Agent:', data.agent_type, 'Status:', data.status, 'Total updates:', existingUpdates.length + 1);
              setWorkflowUpdateCounter(prev => prev + 1);
              
              return {
                ...prev,
                [backendTaskId]: {
                  ...currentWorkflow,
                  taskId: backendTaskId,
                  workflowStage: newWorkflowStage,
                  lastUpdate: data.timestamp || new Date().toISOString(),
                  currentStep: data.data?.step_id,
                  stepProgress: data.data?.progress,
                  agentUpdates: [
                    ...existingUpdates,
                    {
                      agent_type: data.agent_type,
                      status: data.status,
                      message: data.message,
                      timestamp: data.timestamp,
                      step_id: data.data?.step_id
                    }
                  ]
                }
              };
            });
          }
        },
        
        onClarificationRequest: (data: MultiAgentWSMessage) => {
          console.log('📡 CHAT - Clarification request received:', data);
          const taskId = data.task_id || lastTaskIdRef.current || 'default';
          
          if (data.task_id) {
            lastTaskIdRef.current = data.task_id;
            setActiveWorkflowTaskId(data.task_id);
            setWorkflowUpdateCounter(prev => prev + 1);
          }
          
          setClarificationRequests(prev => ({
            ...prev,
            [taskId]: data
          }));
          
          setMultiAgentWorkflows(prev => {
            const currentWorkflow = prev[taskId] || {};
            return {
              ...prev,
              [taskId]: {
                ...currentWorkflow,
                taskId: taskId,
                workflowStage: 'Waiting for Clarification',
                lastUpdate: data.timestamp || new Date().toISOString(),
                clarificationNeeded: true
              }
            };
          });
        },
        
        onWorkflowStarted: (data: MultiAgentWSMessage) => {
          console.log('🚀🚀🚀 WORKFLOW STARTED:', data);
          if (data.task_id) {
            console.log('🔥 WORKFLOW STARTED - SETTING ACTIVE TASK ID:', data.task_id);
            lastTaskIdRef.current = data.task_id;
            setActiveWorkflowTaskId(data.task_id);
            setWorkflowUpdateCounter(prev => prev + 1);
            
            setMultiAgentWorkflows(prev => {
              const existingWorkflow = prev[data.task_id!] || {};
              return {
                ...prev,
                [data.task_id!]: {
                  ...existingWorkflow,
                  taskId: data.task_id,
                  workflowStage: data.workflow_stage || 'Initializing',
                  lastUpdate: data.timestamp || new Date().toISOString(),
                  agentUpdates: existingWorkflow.agentUpdates || []
                }
              };
            });
            console.log('🔥 WORKFLOW STATE INITIALIZED FOR TASK:', data.task_id);
          }
        },
        
        onConnectionEstablished: (data: MultiAgentWSMessage) => {
          console.log('📡 CHAT - Multi-agent WebSocket connected for chat:', data.chatId);
        },
        
        onError: (error: Event) => {
          console.error('📡 CHAT - Multi-agent WebSocket error:', error);
        },
        
        onClose: (event: CloseEvent) => {
          console.log('📡 CHAT - Multi-agent WebSocket closed:', event.code, event.reason);
        }
      };
      
      console.log('🔥 DEBUG CHAT - Registering callbacks:', {
        onAgentStatus: typeof callbacks.onAgentStatus,
        onClarificationRequest: typeof callbacks.onClarificationRequest,
        onWorkflowStarted: typeof callbacks.onWorkflowStarted
      });
      multiAgentWebSocketService.connect(currentChat.id, callbacks);
      
      return () => {
        console.log('📡 CHAT - Disconnecting WebSocket for chat:', currentChat.id);
        multiAgentWebSocketService.disconnect();
      };
    }
  }, [currentChat?.id]);

  // Handle multi-agent task creation events from ChatContext
  useEffect(() => {
    const handleMultiAgentTaskCreated = (event: CustomEvent) => {
      const { chatId, taskId, requiresClarification, clarificationRequest, workflowStage } = event.detail;
      
      console.log('📡 CHAT - Multi-agent task created event received:', event.detail);
      if (currentChat?.id === chatId) {
        lastTaskIdRef.current = taskId;
        const latestTaskExecutionMessage = [...(currentChat?.messages || [])].reverse().find(message => message.content.startsWith('[TASK_EXECUTION]'));
        if (latestTaskExecutionMessage) {
          try {
            const parsed = JSON.parse(latestTaskExecutionMessage.content.substring('[TASK_EXECUTION]'.length + 1));
            const fallbackTaskId = parsed?.id;
            if (fallbackTaskId && fallbackTaskId !== taskId) {
              setTaskIdAliases(prev => prev[fallbackTaskId] === taskId ? prev : { ...prev, [fallbackTaskId]: taskId });
            }
          } catch {}
        }
        // Initialize workflow state
        setMultiAgentWorkflows(prev => {
          let normalized = { ...prev };
          if (prev.default) {
            const { default: defaultWorkflow, ...withoutDefault } = normalized;
            const mergedWorkflow = {
              ...(withoutDefault[taskId] || {}),
              ...(defaultWorkflow || {}),
              taskId
            };
            normalized = { ...withoutDefault, [taskId]: mergedWorkflow };
          }
          const currentWorkflow = normalized[taskId] || {};
          return {
            ...normalized,
            [taskId]: {
              ...currentWorkflow,
              taskId,
              workflowStage: workflowStage || 'Initializing',
              lastUpdate: new Date().toISOString()
            }
          };
        });
        
        if (requiresClarification && clarificationRequest) {
          setClarificationRequests(prev => {
            let normalized = { ...prev };
            if (prev.default) {
              const { default: defaultRequest, ...withoutDefault } = normalized;
              normalized = { ...withoutDefault };
              if (defaultRequest) {
                normalized[taskId] = defaultRequest;
              }
            }
            return {
              ...normalized,
              [taskId]: {
                type: 'clarification_request',
                task_id: taskId,
                clarification_request: clarificationRequest,
                message: 'Please provide additional information to continue',
                timestamp: new Date().toISOString()
              }
            };
          });
        }
      }
    };
    window.addEventListener('multi-agent-task-created', handleMultiAgentTaskCreated as EventListener);

    return () => {
      window.removeEventListener('multi-agent-task-created', handleMultiAgentTaskCreated as EventListener);
    };
  }, [currentChat?.id]);

  const isMultiAgentMessage = (msg: Message) => {
    return msg.role === 'assistant' && (
      msg.content.includes('Multi-Agent Task Created') ||
      msg.content.includes('Multi-Agent Workflow') ||
      msg.content.includes('Clarification Needed') ||
      msg.content.startsWith('[TASK_EXECUTION]')
    );
  };
  // Extract task ID from multi-agent messages
  const extractTaskId = (msg: Message) => {
    if (msg.content.startsWith('[TASK_EXECUTION]')) {
      try {
        const jsonData = JSON.parse(msg.content.substring('[TASK_EXECUTION]'.length + 1));
        const resolved = jsonData.id || msg.id;
        return taskIdAliases[resolved] || lastTaskIdRef.current || resolved;
      } catch (e) {
        return taskIdAliases[msg.id] || lastTaskIdRef.current || msg.id;
      }
    }
    const taskIdMatch = msg.content.match(/Task ID: `([^`]+)`/);
    if (taskIdMatch) {
      return taskIdMatch[1];
    }
    return lastTaskIdRef.current || msg.id;
  };

  useEffect(() => {
    Object.entries(taskIdAliases).forEach(([temporaryId, actualId]) => {
      if (temporaryId === actualId) {
        return;
      }
      setAgentUpdates(prev => {
        if (!prev[temporaryId]) {
          return prev;
        }
        const { [temporaryId]: temporaryUpdates, ...rest } = prev;
        const merged = [...(rest[actualId] || []), ...temporaryUpdates];
        return { ...rest, [actualId]: merged };
      });
      setMultiAgentWorkflows(prev => {
        if (!prev[temporaryId]) {
          return prev;
        }
        const { [temporaryId]: temporaryWorkflow, ...rest } = prev;
        const mergedWorkflow = { ...(rest[actualId] || {}), ...temporaryWorkflow, taskId: actualId };
        return { ...rest, [actualId]: mergedWorkflow };
      });
      setClarificationRequests(prev => {
        if (!prev[temporaryId]) {
          return prev;
        }
        const { [temporaryId]: temporaryClarification, ...rest } = prev;
        if (!temporaryClarification) {
          return rest;
        }
        if (rest[actualId]) {
          return { ...rest, [actualId]: rest[actualId] };
        }
        return { ...rest, [actualId]: temporaryClarification };
      });
    });
  }, [taskIdAliases]);

  const handleClarificationResponse = (taskId: string, response: string) => {
    console.log('🔥 DEBUG CLARIFICATION RESPONSE - Sending clarification response:', { 
      taskId, 
      response, 
      wsConnected: multiAgentWebSocketService.isConnected()
    });
    multiAgentWebSocketService.sendClarificationResponse(taskId, response);
    console.log('🔥 DEBUG CLARIFICATION RESPONSE - Sent via WebSocket, updating state');
    setClarificationRequests(prev => {
      const newState = { ...prev };
      delete newState[taskId];
      return newState;
    });
  };

  useEffect(() => {
    const handleAutomationEnable = () => {
      console.log('🎯 AUTOMATION_ENABLE event received');
      setAutomationActive(true);
      setAvatarState('browsing');
      setAvatarMessage('Web automation enabled');
    };

    const handleAutomationDisable = () => {
      console.log('🎯 AUTOMATION_DISABLE event received');
      setAutomationActive(false);
      setAutomationSessionId(null);
      setAutomationChatId(null);
      setAvatarState('idle');
      setAvatarMessage('');
    };

    const handleAutomationSessionStart = (event: any) => {
      console.log('🎯 AUTOMATION_SESSION_START event received:', event.detail);
      if (event.detail?.sessionId) {
        setAutomationSessionId(event.detail.sessionId);
      }
      if (event.detail?.chatId) {
        setAutomationChatId(event.detail.chatId);
      }
    };

    window.addEventListener('automation:enable', handleAutomationEnable);
    window.addEventListener('automation:disable', handleAutomationDisable);
    window.addEventListener('automation:session_start', handleAutomationSessionStart);

    return () => {
      window.removeEventListener('automation:enable', handleAutomationEnable);
      window.removeEventListener('automation:disable', handleAutomationDisable);
      window.removeEventListener('automation:session_start', handleAutomationSessionStart);
    };
  }, [setAvatarState, setAvatarMessage]);

  // Auto-trigger automation window when automation plans are detected
  useEffect(() => {
    console.log('🔍 AUTOMATION DETECTION - Checking messages for automation plans');
    console.log('🔍 Current chat messages count:', currentChat?.messages?.length || 0);
    
    const automationPlanMessages = currentChat?.messages?.filter(msg => 
      msg.role === 'assistant' && msg.content.startsWith('[AUTOMATION_PLAN]')
    ) || [];
    
    console.log('🔍 Found automation plan messages:', automationPlanMessages.length);
    
    if (automationPlanMessages.length > 0) {
      const latestPlanMessage = automationPlanMessages[automationPlanMessages.length - 1];
      const planTriggeredKey = `automation_triggered_${latestPlanMessage.id}`;
      
      console.log('🔍 Latest plan message ID:', latestPlanMessage.id);
      console.log('🔍 Checking trigger key:', planTriggeredKey);
      console.log('🔍 Already triggered?', !!sessionStorage.getItem(planTriggeredKey));
      
      if (!sessionStorage.getItem(planTriggeredKey)) {
        sessionStorage.setItem(planTriggeredKey, 'true');
        console.log('🎬 AUTOMATION PLAN DETECTED - Auto-opening automation window');
        console.log('🎬 Plan content preview:', latestPlanMessage.content.substring(0, 100));
        
        setTimeout(() => {
          try {
            console.log('🎬 DISPATCHING automation:show event');
            window.dispatchEvent(new CustomEvent('automation:show', { detail: { force: true } }));
            console.log('🎬 DISPATCHING automation:start event');
            window.dispatchEvent(new CustomEvent('automation:start', { detail: { force: true } }));
            console.log('🎬 Events dispatched successfully');
          } catch (e) {
            console.error('🎬 Failed to auto-dispatch automation events:', e);
          }
        }, 500);
      } else {
        console.log('🔍 Automation plan already triggered for this message, skipping');
      }
    } else {
      console.log('🔍 No automation plan messages found');
    }
  }, [currentChat?.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 HANDLESUBMIT STARTED - message:', message.trim());
    console.log('🚀 HANDLESUBMIT - automationActive:', automationActive);
    
    // Handle task mode creation
    if (isTaskMode && message.trim()) {
      console.log('🎯 TASK MODE - Creating task from chat input:', message);
      console.log('🎯 TASK MODE - createTaskFromChat function available:', typeof (window as any).createTaskFromChat);
      if ((window as any).createTaskFromChat) {
        (window as any).createTaskFromChat(message.trim());
        setMessage('');
        return;
      } else {
        console.error('🎯 TASK MODE - createTaskFromChat function not available');
      }
    }
    
    // Check for autonomous task creation requests
    const taskKeywords = ['create task', 'autonomous task', 'build agent', 'automate', 'execute task'];
    const isTaskRequest = taskKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (isTaskRequest && currentChat?.id) {
      console.log('🤖 AUTONOMOUS TASK REQUEST detected:', message);
      try {
        const { autonomousTasksService } = await import('../services/api/autonomous-tasks.service');
        const result = await autonomousTasksService.createTask({
          chat_id: currentChat.id,
          user_id: 1, // Default user ID
          description: message,
          agent_id: currentChat.agent_id ? parseInt(currentChat.agent_id) : undefined
        });
        
        if (result.success && result.task) {
          await addMessage({ 
            role: 'user', 
            content: message, 
            chatId: currentChat.id 
          });
          await addMessage({ 
            role: 'assistant', 
            content: `[AUTONOMOUS_TASK_CREATED]\n` +
              JSON.stringify({
                title: result.task.title,
                task_id: result.task.id,
                task_type: result.task.task_type,
                status: result.task.status,
                estimated_duration: result.task.estimated_duration,
                message: `✅ **Autonomous Task Created Successfully**\n\n**${result.task.title}**\n\nTask ID: ${result.task.id}\nType: ${result.task.task_type}\nStatus: ${result.task.status}\nEstimated Duration: ${result.task.estimated_duration}s\n\nThe task will be executed automatically. Monitor progress in the Task Builder panel.`
              }),
            chatId: currentChat.id 
          });
          setMessage('');
          return;
        } else {
          console.error('Task creation failed:', result.error);
        }
      } catch (error) {
        console.error('Autonomous task creation error:', error);
      }
    }
    console.log('🚀 HANDLESUBMIT - automationSessionId:', automationSessionId);
    console.log('🚀 HANDLESUBMIT - automationChatId:', automationChatId);
    console.log('🚀 HANDLESUBMIT - isProcessing:', isProcessing);
    
    if (!message.trim() && uploadedImages.length === 0) {
      console.log('🚀 HANDLESUBMIT - EARLY RETURN: empty message and no images');
      return;
    }

    // Don't allow sending messages while processing
    if (isProcessing) {
      console.log('🚀 HANDLESUBMIT - EARLY RETURN: already processing');
      return;
    }
    
    setIsProcessing(true);
    console.log('🔄 PROCESSING STARTED - setIsProcessing(true)');
    
    // Set avatar to thinking state when processing starts
    setAvatarState('thinking');
    setAvatarMessage('Thinking...');
    console.log('🔄 AVATAR STATE SET TO THINKING');
    
    // Get message content once for the entire function
    const messageContent = message.trim();
    console.log('🔄 MESSAGE CONTENT:', messageContent);
    
    // Clear the input field immediately for better UX
    setMessage("");
    console.log('🔄 INPUT FIELD CLEARED');
    
    console.log('🔥 MULTI-AGENT TASK DETECTION - Starting analysis...');
    const isFirstMessage = !currentChat?.messages || currentChat.messages.filter(m => m.role === 'user').length === 0;
    console.log('🔥 IS FIRST MESSAGE:', isFirstMessage);
    
    if (isFirstMessage) {
      console.log('🔥 FIRST MESSAGE DETECTED - Auto-creating multi-agent task');
      console.log('🔥 Task content:', messageContent);
      
      await addMessage({ role: 'user', content: messageContent, chatId: currentChat?.id || '' });
      console.log('🔥 User message added to chat');
      
      try {
        console.log('🔥 Creating multi-agent task via backend API');
        const response = await fetch('/api/multi-agent/create-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: currentChat?.id || '',
            original_request: messageContent,
            user_id: null
          })
        });
        
        const taskData = await response.json();
        console.log('🔥 Backend task created:', taskData);
        
        if (taskData.success && taskData.task_id) {
          const backendTaskId = taskData.task_id;
          lastTaskIdRef.current = backendTaskId;
          
          const taskMessage = `[TASK_EXECUTION]\n${JSON.stringify({
            id: backendTaskId,
            message: messageContent
          })}`;
          
          await addMessage({ role: 'assistant', content: taskMessage, chatId: currentChat?.id || '' });
          console.log('🔥 Task execution message added with backend UUID:', backendTaskId);
        } else {
          const fallbackTaskMessage = `[TASK_EXECUTION]\n${JSON.stringify({
            id: `task_${Date.now()}`,
            message: messageContent
          })}`;
          await addMessage({ role: 'assistant', content: fallbackTaskMessage, chatId: currentChat?.id || '' });
        }
      } catch (error) {
        console.error('🔥 Backend task creation error:', error);
        const fallbackTaskMessage = `[TASK_EXECUTION]\n${JSON.stringify({
          id: `task_${Date.now()}`,
          message: messageContent
        })}`;
        await addMessage({ role: 'assistant', content: fallbackTaskMessage, chatId: currentChat?.id || '' });
      }
      
      setIsProcessing(false);
      setAvatarState('idle');
      return;
    }

    const automationKeywords = /(browse|visit|navigate to|go to|open website|web automation|click on|fill form|search on|scrape|extract from|http:\/\/|https:\/\/|\.com|\.org|\.net|\.co\.)/i;
    const keywordMatch = automationKeywords.test(messageContent);
    console.log('🔄 AUTOMATION KEYWORD TEST:', keywordMatch);
    console.log('🔄 AUTOMATION ACTIVE:', automationActive);
    
    if (!automationActive && keywordMatch) {
      console.log('🎯 AUTOMATION TRIGGER DETECTED - dispatching events');
      try { 
        window.dispatchEvent(new Event('automation:show')); 
        console.log('🎯 DISPATCHED automation:show');
      } catch (e) {
        console.error('🎯 ERROR dispatching automation:show:', e);
      }
      try { 
        window.dispatchEvent(new Event('automation:start')); 
        console.log('🎯 DISPATCHED automation:start');
      } catch (e) {
        console.error('🎯 ERROR dispatching automation:start:', e);
      }
      setPendingAutomationTask(messageContent);
      console.log('🎯 SET PENDING AUTOMATION TASK:', messageContent);
      setIsProcessing(false);
      console.log('🎯 PROCESSING STOPPED - automation trigger path');
      return;
    }
    
    
    
    // Handle search or automation modes differently
    if (automationActive) {
      console.log('🤖 AUTOMATION ACTIVE PATH - Submitting message to web automation workflow');
      console.log('🤖 AUTOMATION STATE:', { automationActive, automationSessionId, automationChatId, task: messageContent });
      
      try {
        console.log('🤖 ADDING USER MESSAGE TO CHAT UI');
        await addMessage({ role: 'user', content: messageContent });
        console.log('🤖 USER MESSAGE ADDED TO CHAT UI SUCCESSFULLY');
        
        console.log('🤖 STARTING PLAN GENERATION');
        setAvatarState('thinking');
        setAvatarMessage('🤖 Crew Member 1: Analyzing prompt and generating PRP...');
        
        const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL;
        const chatId = automationChatId || currentChat?.id;
        if (!chatId) {
          console.error('🤖 ERROR: No chat ID available (automation or current)');
          console.error('🤖 DEBUG:', { automationChatId, currentChatId: currentChat?.id, automationActive });
          return;
        }
        
        console.log('🤖 USING CHAT ID:', chatId, 'for automation plan generation');
        const planResponse = await fetch(`${BACKEND_URL}/api/chat/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: messageContent, message: messageContent })
        });
        
        if (planResponse.ok) {
          const planResult = await planResponse.json();
          console.log('🤖 PLAN GENERATION RESPONSE:', planResult);
          
          let automationPlanContent: string | null = null;
          let planData: any = null;
          
          if (planResult.is_automation_plan && planResult.response) {
            automationPlanContent = planResult.response;
          } else if (planResult.messages && planResult.messages.length > 0) {
            const lastMessage = planResult.messages[planResult.messages.length - 1];
            if (lastMessage.content && lastMessage.content.includes('[AUTOMATION_PLAN]')) {
              automationPlanContent = lastMessage.content;
            }
          }
          
          if (automationPlanContent && automationPlanContent.includes('[AUTOMATION_PLAN]')) {
            console.log('🤖 PLAN GENERATED SUCCESSFULLY');
            setAvatarState('browsing');
            setAvatarMessage('🎯 Plan ready - launching automation window...');
            
            try {
              const planContent = automationPlanContent.split('[AUTOMATION_PLAN]')[1];
              planData = JSON.parse(planContent.trim());
              setAutomationPlans(prev => ({ ...prev, [planResult.id]: planData }));
              console.log('🤖 PLAN STORED:', planData);
              

              
              console.log('🤖 PLAN READY - TRIGGERING AUTOMATION WINDOW');
              setAvatarState('browsing');
              setAvatarMessage('🚀 Crew Member 2: Starting systematic execution...');
              
              setTimeout(() => {
                try { 
                  window.dispatchEvent(new CustomEvent('automation:show', { detail: { immediate: true } })); 
                  console.log('🤖 DISPATCHED automation:show');
                } catch (e) {
                  console.error('🤖 ERROR dispatching automation:show:', e);
                }
                
                try { 
                  window.dispatchEvent(new CustomEvent('automation:start', { detail: { immediate: true } })); 
                  console.log('🤖 DISPATCHED automation:start');
                } catch (e) {
                  console.error('🤖 ERROR dispatching automation:start:', e);
                }
                setPendingAutomationTask(messageContent);
                console.log('🤖 SET PENDING AUTOMATION TASK:', messageContent);
              }, 100);
              
            } catch (e) {
              console.error('🤖 ERROR PARSING PLAN:', e);
            }
          }
        }
      } catch (e) {
        console.error('🤖 ERROR IN AUTOMATION WORKFLOW:', e);
      }
      
      if (automationSessionId) {
        try {
          const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL;
          const wfUrl = `${BACKEND_URL}/api/web-automation/execute-workflow`;
          console.log('Dispatching workflow to', wfUrl);
          
          if (automationChatId) {
            await addMessage({ role: 'user', content: messageContent, chatId: automationChatId });
          }
        
        let workflowSteps = [];
        
        const currentPlanId = currentChat?.id;
        if (currentPlanId && automationPlans[currentPlanId]) {
          workflowSteps = automationPlans[currentPlanId].steps || [];
          console.log('🤖 USING STORED PLAN STEPS:', workflowSteps.length, 'steps');
        }
        
        if (workflowSteps.length === 0) {
          let latestMessages: any[] = [];
          try {
            const targetChatId = automationChatId || currentChat?.id;
            if (targetChatId) {
              const autoChat = await chatService.getChat(targetChatId);
              latestMessages = (autoChat.data?.messages || []).slice(-10);
            } else {
              latestMessages = currentChat?.messages?.slice(-10) || [];
            }
          } catch {
            latestMessages = currentChat?.messages?.slice(-10) || [];
          }
          
          for (const msg of latestMessages) {
            if (typeof msg.content === 'string' && msg.content.startsWith('[AUTOMATION_PLAN]')) {
              try {
                const planJson = msg.content.substring(msg.content.indexOf('\n') + 1);
                const plan = JSON.parse(planJson);
                if (plan.steps && Array.isArray(plan.steps)) {
                  workflowSteps = plan.steps;
                  break;
                }
              } catch {}
            }
          }
        }
        
        await fetch(wfUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: automationSessionId,
            workflow_steps: workflowSteps,
            task_description: messageContent
          })
        });
          console.log('Automation workflow request sent');
          setIsProcessing(false);
          return;
        } catch (automationErr) {
          console.error('Automation dispatch failed:', automationErr);
          setIsProcessing(false);
          return;
        }
      }
      
      setIsProcessing(false);
      return;
    } else if (isSearchMode || internetSearchEnabled) { // Check both isSearchMode and internetSearchEnabled
      console.log('🌐 INTERNET SEARCH MODE ACTIVE - Processing search');
      console.log('🌐 [Chat] Disclaimer filtering is ACTIVE - generic AI messages will be filtered out');
      
      // Set avatar to searching state for internet search
      setAvatarState('searching');
      setAvatarMessage('Browsing...');
      
      try {
        const searchId = `search-${Date.now()}`;
        
        // Show animated loading indicator
        const loadingId = 'search-loading';
        toast.loading(
          <div className="search-loading-animation">
            <div className="search-pulse-animation"></div>
            <span>Searching the web for results...</span>
          </div>, 
          { id: loadingId, duration: Infinity }
        );
        
        console.log(`🌐 [Chat][${searchId}] CALLING SEARCH API... isSearchMode=${isSearchMode}, internetSearchEnabled=${internetSearchEnabled}`);
        
        // Let performSearch handle both adding the user message and the search results
        // This ensures everything happens in a single chat conversation with suppressAiResponse=true
        await performSearch(messageContent, true);
        
        console.log(`✅ [Chat][${searchId}] SEARCH COMPLETE`);
        
        // Clear loading animation and show success
        toast.dismiss(loadingId);
        toast.success(`Search results added to chat`, { id: 'search-toast' });
      } catch (error) {
        console.error("", error);
        toast.error(`${error instanceof Error ? error.message : ''}`, { id: 'search-toast' });
        console.log('💡 TROUBLESHOOTING TIPS: Check network connection, API endpoint, and server status');
      } finally {
        setIsProcessing(false);
        console.log('🔄 INTERNET SEARCH COMPLETE - UI ready for next action');
      }
      return;
    }
    
    // Regular chat message processing (not search)
    // Check if internet search is already in progress to avoid duplicate messages
    if (internetSearchEnabled) {
      console.log('Internet search is already in progress, skipping regular message processing');
      setIsProcessing(false);
      return;
    }
    
    try {
      // Store the message content before any async operations
      const userMessage = messageContent;
      
      // Call the onMessage callback if provided
      if (onMessage) {
        onMessage(userMessage);
      }
      
      // Clear the input field and uploaded images immediately for better UX
      setMessage("");
      const imagesToSend = [...uploadedImages];
      setUploadedImages([]);
      if (!currentChat) {
        console.log('Creating new chat before sending message');
        
        try {
          // Generate a descriptive title from the user's message
          const chatTitle = generateTitleFromMessage(userMessage);
          console.log('Generated chat title:', chatTitle);
          
          // Create a new chat with the generated title
          const newChat = await createNewChat(chatTitle);
          console.log('New chat created with ID:', newChat?.id);
          
          // Wait for the chat to be fully created and registered
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Now send the message to the newly created chat
          if (newChat && newChat.id) {
            console.log('Sending initial message to chat ID:', newChat.id);
            // Send message with any attachments
            if (imagesToSend.length > 0) {
              await chatService.addMessageWithAttachments(newChat.id, userMessage, imagesToSend);
            } else {
              await chatService.addMessage(newChat.id, userMessage);
            }
            
            console.log('Message sent successfully to new chat');
            
            // Refresh the chat to get the AI response
            const updatedChatResponse = await chatService.getChat(newChat.id);
            if (updatedChatResponse && updatedChatResponse.data) {
              console.log('Updated chat with messages:', updatedChatResponse.data);
              setCurrentChat(updatedChatResponse.data);
            }
          } else {
            throw new Error('New chat creation failed or returned invalid data');
          }
        } catch (chatError) {
          console.error('Error in chat creation flow:', chatError);
          throw chatError;
        }
      } else {
        // Normal flow when chat already exists
        console.log('Sending message to existing chat:', currentChat.id);
        
        if (imagesToSend.length > 0) {
          // If we have images, use the special method to send them with the message
          try {
            console.log(`Attempting to send message with attachments to chat: ${currentChat.id}`);
            // Send the message with attachments
            const addMsgWithAttachmentsResponse = await chatService.addMessageWithAttachments(
              currentChat.id, 
              userMessage, 
              imagesToSend
            );
            console.log('Message with attachments sent, API response:', addMsgWithAttachmentsResponse.data);

            // IMPORTANT: Refetch the entire chat to get the updated state
            console.log(`Refetching chat ${currentChat.id} after adding message with attachments.`);
            const fullChatResponse = await chatService.getChat(currentChat.id);
            if (fullChatResponse && fullChatResponse.data) {
              console.log('Successfully refetched chat, new data:', fullChatResponse.data);
              setCurrentChat(fullChatResponse.data); // This is now a full Chat object
            } else {
              console.error('Failed to refetch chat after sending message with attachments. UI might be stale.');
              // Optionally, you could try to manually merge addMsgWithAttachmentsResponse.data if it's just a message,
              // but refetching is safer for consistency.
            }
          } catch (err) {
            console.error("Error sending message with attachments:", err);
            toast.error("Failed to send message with images");
            throw err;
          }
        } else {
          // Normal message without attachments
          await addMessage({
            role: "user",
            content: userMessage
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsProcessing(false);
      // Reset avatar to idle state when processing is complete
      setAvatarState('idle');
      setAvatarMessage('');
    }
  };

  // Handle file upload when the Plus button is clicked
  const handlePlusButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Filter for image files only
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (imageFiles.length === 0) {
      toast.error("Please select image files only");
      return;
    }
    
    // Upload each image
    imageFiles.forEach(file => uploadImage(file));
    
    // Reset the file input
    e.target.value = '';
  };

  // Upload image to server
  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // Create an image URL for preview
      const previewUrl = URL.createObjectURL(file);
      
      // Create a temporary attachment for preview
      const tempAttachment: Attachment = {
        type: 'image',
        url: previewUrl,
        name: file.name,
        content_type: file.type,
        preview_url: previewUrl
      };
      
      // Add to displayed images
      setUploadedImages(prev => [...prev, tempAttachment]);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 200);
      
      // TODO: Replace with actual API upload once backend is ready
      // For now, we'll just simulate the upload process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // In a real implementation, update the attachment with the server response
      // const response = await api.post('/api/upload', formData);
      // const uploadedAttachment = response.data;
      
      toast.success(`Image ${file.name} uploaded successfully`);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(`Failed to upload ${file.name}`);
      
      // Remove the failed upload from preview
      setUploadedImages(prev => 
        prev.filter(img => img.name !== file.name)
      );
      
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Remove an uploaded image
  const removeUploadedImage = (imageName: string) => {
    setUploadedImages(prev => 
      prev.filter(img => img.name !== imageName)
    );
  };

  // Handle key press in the textarea (Ctrl+Enter or Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On Enter key (but not with Shift key) send the message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid new line
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Modern welcome screen inspired by DeepSeek
  if (!currentChat) {
    return (
      <div className={`flex flex-col ${compact ? 'h-full' : 'h-screen'} bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] text-white relative overflow-hidden`}>
        {/* Center content area with improved responsiveness */}
        <div className="flex flex-col items-center justify-center w-full mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 relative z-10">
          {/* AI Avatar with enhanced glow */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#00F3FF] to-[#0077B6] flex items-center justify-center mb-6 sm:mb-8 shadow-lg shadow-[#00F3FF]/30 pulse-glow">
            <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
          </div>
          {/* Welcome Message with enhanced typography */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-[#00F3FF] to-[#00D4E0] bg-clip-text text-transparent neon-text">
            Hi, I'm Karios AI.
          </h1>
          <p className="text-gray-400 text-center text-sm sm:text-base mb-8 sm:mb-10 max-w-md">How can I help you today?</p>
          
          {/* Message Input Area with glowing border - updated to match image 2 */}
          <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl bg-[#222] rounded-3xl shadow-lg overflow-hidden border border-[#00F3FF]/20 glow-border transition-all duration-300 hover:border-[#00F3FF]/40 hover:shadow-[#00F3FF]/20 hover:shadow-xl">
            <form onSubmit={handleSubmit} className="relative">
              {/* Top input row with plus icon, text area, and send button */}
              <div className="flex items-center w-full px-0.5 py-1">
                <button
                  type="button"
                  className="text-gray-400 hover:text-[#00F3FF] p-2 ml-2 transition-all duration-300"
                  onClick={() => {
                    // Just visual feedback
                    toast.success("New chat started");
                  }}
                >
                  <Plus className="w-5 h-5" />
                </button>
                
                <div className="relative flex-1 mx-2">
                  <textarea
                    ref={(textAreaRef) => {
                      // Auto-resize logic - same as main chat
                      if (textAreaRef) {
                        // Reset height to auto to get the correct scrollHeight
                        textAreaRef.style.height = 'auto';
                        // Set the height to the scrollHeight to match content
                        const newHeight = Math.min(textAreaRef.scrollHeight, 400);
                        textAreaRef.style.height = `${newHeight}px`;
                      }
                    }}
                    placeholder="Ask Karios AI"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      // Adjust height on change - matching main chat functionality
                      e.target.style.height = 'auto';
                      const newHeight = Math.min(e.target.scrollHeight, 400);
                      e.target.style.height = `${newHeight}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-[#222] text-white outline-none border-none py-3 px-2 resize-none min-h-[45px] placeholder-gray-400 focus:placeholder-[#00F3FF]/50 transition-all overflow-y-auto welcome-input"
                    disabled={isProcessing}
                  />
                </div>
                
                {/* Send button with glowing effect when active */}
                <button 
                  type="submit" 
                  disabled={!message.trim() || isProcessing}
                  className={`p-2 mr-2 rounded-full transition-all duration-300 ${!message.trim() || isProcessing ? 'text-gray-500' : 'text-[#00F3FF] hover:bg-[#00F3FF]/10 hover:shadow-sm hover:shadow-[#00F3FF]/20 active:bg-[#00F3FF]/20'}`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              {/* Bottom section with the search button on the left side */}
              <div className="flex items-center px-4 py-2 mt-0.5">
                {/* Pill-shaped search button matching image 2 design */}
                <div className="flex-1">
                  <button
                    type="button"
                    className={`flex items-center gap-2 ${isSearchMode 
                      ? 'bg-[#2A2A2A] text-[#00F3FF] border border-[#00F3FF]/40 shadow-inner shadow-[#00F3FF]/10' 
                      : 'bg-[#2A2A2A] text-gray-300 hover:text-[#00F3FF]'} 
                      py-1.5 px-4 rounded-full transition-all duration-300 hover:bg-[#2A2A2A]/90 hover:shadow-inner`}
                    onClick={() => {
                      // Log the current state before toggling
                      console.log(`🌐 SEARCH BUTTON CLICKED - Current search mode: ${isSearchMode ? 'ENABLED' : 'DISABLED'}`);
                      
                      // Only use toggleSearchMode - it now handles internetSearchEnabled synchronization
                      toggleSearchMode();
                      console.log('🌐 INTERNET SEARCH READY - Type a search query and press Send to search the web');
                    }}
                    aria-pressed={isSearchMode}
                  >
                    <span className="text-lg leading-none">🌐</span>
                    <span className="text-sm font-medium">{isSearchMode ? "Searching" : "Search"}</span>
                  </button>
                </div>
                
                {/* AI reference notice on the right side */}
                <div className="text-xs text-gray-500">Karios AI | Verify important Info.</div>
              </div>
            </form>
          </div>
          
          {/* Small caption */}
          <p className="text-gray-600 text-xs mt-4 text-center animate-pulse">Type your message and press Enter</p>
        </div>
        
        {/* Enhanced background effects */}
        <div 
          className="absolute inset-0 bg-gradient-radial from-[#00F3FF]/10 to-transparent opacity-20 pointer-events-none animate-pulse-slow" 
          style={{ width: '100%', height: '100%' }}
        ></div>
        <div className="absolute inset-0 starry-background pointer-events-none"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#0A0A0A]">
      {/* Main chat area */}
      <div className="flex flex-col flex-1">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="text-xl font-semibold text-white">{currentChat.title || "New Chat"}</h2>
        </div>

      {/* Agent Info Banner - Show only if chat has an agent_id */}
      {currentChat.agent_id && (
        <AgentInfoBanner agentId={currentChat.agent_id} />
      )}


      {/* Messages Display Area */}
      <div className={`flex-1 overflow-y-auto ${compact ? 'px-2 py-2' : 'px-4 py-4'} space-y-4`}>
        {/* Search results are now presented as part of the AI's response in chat bubbles */}
        
        {/* Always render chat messages - search results will appear as agent responses */}
        {currentChat && (
          <>
            {currentChat.messages
            // Filter out duplicate messages (messages with the same content sent within 1 second)
            .filter((msg, index, array) => {
              // Always keep the first message
              if (index === 0) return true;
              
              // Check if this message has the same content as the previous one
              const prevMsg = array[index - 1];
              if (prevMsg.content !== msg.content || prevMsg.role !== msg.role) return true;
              
              // If content is the same, check if the timestamps are within 1 second
              const currentTime = new Date(msg.timestamp || msg.created_at || Date.now()).getTime();
              const prevTime = new Date(prevMsg.timestamp || prevMsg.created_at || Date.now()).getTime();
              
              // If timestamps are more than 1 second apart, keep both messages
              return Math.abs(currentTime - prevTime) > 1000;
            })
            // Filter out generic "I'm sorry, but as an AI..." messages when internet search is enabled
            .filter((msg) => {
              // If internet search is NOT enabled, show all messages
              if (!internetSearchEnabled) return true;
              
              // If this is a user message, always show it
              if (msg.role === 'user') return true;
              
              // SPECIAL CASE: Always keep search result messages in search mode
              if (msg.content.startsWith('[SEARCH_RESULTS]')) {
                console.log('🌐 Keeping search results message');
                return true;
              }
              
              // When in internet search mode, filter out all generic AI fallback messages and disclaimers
              if (msg.role === 'assistant') {
                // Get message content in lowercase for case-insensitive matching
                const content = msg.content.toLowerCase();
                
                // METHOD 1: Detect generic AI disclaimer patterns using structure-based regular expressions
                // These patterns target the structure of disclaimer messages, not specific topics
                const commonDisclaimerPatterns = [
                  // General apology patterns
                  /^i['']m sorry.{0,30}(as|being).{0,10}(an|a).{0,10}(ai|assistant|model)/i,
                  /^(i apologize|sorry).{0,30}(as|being).{0,10}(an|a).{0,10}(ai|assistant|model)/i,
                  
                  // Knowledge/training cutoff patterns (generalized)
                  /(my|the).{0,10}(training|knowledge|data).{0,20}(only|limited|up to|as of|until|cutoff)/i,
                  
                  // General capability limitation patterns
                  /(cannot|can't|don't|do not|unable to).{0,15}(access|provide|browse|search|know|get|have)/i,
                  
                  // Real-time/current information patterns
                  /(no|without|lack of).{0,15}(access|ability).{0,15}(real-time|current|latest|up-to-date)/i,
                  
                  // AI identity combined with limitation statements
                  /as (an|a).{0,10}(ai|model|assistant|llm).{0,40}(cannot|can't|don't|do not|unable|limited)/i,
                  
                  // Year mention with limitations
                  /(20\d{2}).{0,30}(only|until|up to|not beyond|after this|cutoff)/i,
                  
                  // General prediction inability patterns
                  /(cannot|can't|unable to|don't have).{0,20}(predict|provide|tell you|know).{0,20}(future|upcoming|will)/i,
                  
                  // Training data reference patterns
                  /(training|knowledge).{0,15}(cut-?off|only includes|ends at|limited to)/i,
                  
                  // Mixed identity and limitation patterns
                  /^(as|being).{0,10}(an|a).{0,10}(ai|language model|assistant).{0,40}(cannot|don't|limited to)/i
                ];
                
                // METHOD 2: Keyword density approach using general disclaimer indicators
                const disclaimerKeywords = [
                  // General AI identity and limitation terms
                  'sorry', 'training', 'data', 'knowledge', 'cutoff', 'updated', 
                  'ai', 'model', 'assistant', 'access', 'cannot', "can't", 'unable', 
                  'don\'t', 'not able', 'limited', 'latest', 'current', 'up-to-date',
                  
                  // General capability limitations
                  "don't have the ability", "unable to", "not capable", "not possible",
                  "not able", "limited to", "cannot access", "cannot browse",
                  "don't have access", "search engine", "unable to search",
                  
                  // Knowledge and time-related terms
                  "training data", "knowledge cutoff", "as of", "until",
                  "after my", "beyond my", "trained up to", "up until", "up to",
                  
                  // General limitation phrases
                  "i don't know", "i cannot predict", "i don't have information",
                  "i'm not able to", "i can't access", "not designed to",
                  "i apologize", "i'm sorry", "doesn't include", "lacks ability"
                ];
                
                // Check if content matches any disclaimer pattern
                const matchesPattern = commonDisclaimerPatterns.some(pattern => pattern.test(content));
                
                // Count keyword matches
                let keywordCount = 0;
                for (const keyword of disclaimerKeywords) {
                  if (content.includes(keyword)) {
                    keywordCount++;
                  }
                }
                
                // Check for phrases indicating search results
                const containsSearchTerms = content.includes('search results') || 
                                             content.includes('found information') || 
                                             content.includes('according to') || 
                                             content.includes('based on my search');
                
                // Find the original user query that might be in the current chat's title
                const chatTitle = currentChat?.title?.toLowerCase() || '';
                // Extract search query from the chat title if available (common format: "Search: query...")
                let searchQueryFromTitle = '';
                if (chatTitle.startsWith('search:')) {
                  searchQueryFromTitle = chatTitle.substring(7).trim();
                }
                
                // METHOD 3: Context-aware filtering - check if the message sounds like a disclaimer
                // specifically for the current search topic
                let contextualMatch = false;
                if (searchQueryFromTitle) {
                  // Clean up query for comparison (remove common words, get main topics)
                  const queryTerms = searchQueryFromTitle
                    .split(/\s+/)
                    .filter(term => term.length > 3) // Only keep meaningful terms
                    .map(term => term.replace(/[^a-z0-9]/gi, '')); // Remove punctuation
                  
                  // Check if the message references inability to provide info about the search topic
                  const limitationPhrases = ["cannot", "can't", "don't have", "not able", "unable", "impossible"];
                  const hasLimitationIndicator = limitationPhrases.some(phrase => content.includes(phrase));
                    
                  if (hasLimitationIndicator) {
                    // Check if any of the search terms appear near limitation words
                    contextualMatch = queryTerms.some(term => {
                      // Create a regex to find the term near limitation words
                      const nearLimitationRegex = new RegExp(
                        `(cannot|can't|don't|not able|unable).{0,50}${term}|${term}.{0,50}(cannot|can't|don't|not able|unable)`, 'i'
                      );
                      return nearLimitationRegex.test(content);
                    });
                  }
                }
                
                // METHOD 4: Detect potential search response messages (we should keep these)
                const likelySearchResponse = containsSearchTerms || 
                  (content.includes('http') && content.includes('://')) || // Contains links
                  (content.match(/\d{4}/) && !content.match(/20(21|22|23)/) && content.includes('published')) || // Mentions recent years
                  content.includes('website') || 
                  content.includes('article');
                
                // First try to detect if this is actually a genuine search response
                // If it looks like a search response, we should keep it regardless of other factors
                if (likelySearchResponse) {
                  console.log('🌐 Keeping likely search response message');
                  return true;
                }
                
                // Otherwise use our disclaimer patterns to decide whether to filter
                // Three ways to filter out a message:
                // 1. It matches one of our generic disclaimer regex patterns
                // 2. It contains a high density of disclaimer keywords (threshold lowered to 3 for more aggressive filtering)
                // 3. It contextually references inability to provide info about the search query
                if (matchesPattern || keywordCount >= 3 || contextualMatch) {
                  console.log(`🌐 FILTERED OUT AI disclaimer in search mode:`);
                  console.log(`   - Pattern match: ${matchesPattern}`);
                  console.log(`   - Keyword count: ${keywordCount}`);
                  console.log(`   - Contextual match: ${contextualMatch}`);
                  console.log(`   - Message preview: ${msg.content.substring(0, 50)}...`);
                  return false;
                }
              }
              
              // Keep all other messages
              return true;
            })
            .map((msg) => {
              const extractedTaskId = msg.content.includes('task_id') ? extractTaskId(msg) : msg.id;
              const backendTaskId = lastTaskIdRef.current;
              const possibleTaskIds = [backendTaskId, extractedTaskId, taskIdAliases[extractedTaskId]].filter(Boolean);
              const matchingTaskId = possibleTaskIds.find(id => multiAgentWorkflows[id]);
              const actualTaskId = matchingTaskId || backendTaskId || extractedTaskId;
              const workflowUpdateCount = multiAgentWorkflows[actualTaskId]?.agentUpdates?.length || 0;
              const lastUpdateTime = multiAgentWorkflows[actualTaskId]?.lastUpdate || Date.now();
              return (
              <motion.div
                key={`${msg.id}-${workflowUpdateCount}-${lastUpdateTime}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`message-container ${msg.role === "user" ? "user" : "agent"}`}
              >
                <div
                  className={`message-content ${msg.role}`}
                >
                  <div className="message-text">
                    <>
                       {/* Enhanced rendering for multi-agent workflow messages */}
                        {isMultiAgentMessage(msg) ? (
                          (() => {
                            const extractedTaskId = extractTaskId(msg);
                            const backendTaskId = lastTaskIdRef.current;
                            const aliasedTaskId = taskIdAliases[extractedTaskId];
                            
                            const possibleTaskIds = [backendTaskId, extractedTaskId, aliasedTaskId].filter(Boolean);
                            const matchingTaskId = possibleTaskIds.find(id => multiAgentWorkflows[id]);
                            const taskId = matchingTaskId || backendTaskId || extractedTaskId;
                            
                            console.log('🔍 TASK ID RESOLUTION:', {
                              extractedTaskId,
                              backendTaskId,
                              aliasedTaskId,
                              matchingTaskId,
                              finalTaskId: taskId,
                              availableWorkflows: Object.keys(multiAgentWorkflows),
                              hasWorkflowData: !!multiAgentWorkflows[taskId]
                            });
                            
                            const workflowData = multiAgentWorkflows[taskId] || {
                              taskId,
                              workflowStage: msg.content.includes('Multi-Agent Task Created') ? 'Processing' : 'Initializing',
                              lastUpdate: new Date().toISOString(),
                              agentUpdates: []
                            };
                            const taskAgentUpdates = workflowData?.agentUpdates || [];
                            const clarificationRequest = clarificationRequests[taskId];
                            const normalizedAgentUpdates = taskAgentUpdates.map((update: any) => {
                              const allowedStatuses: Array<'started' | 'completed' | 'failed' | 'processing'> = ['started', 'completed', 'failed', 'processing'];
                              const status = allowedStatuses.includes((update.status || '').toLowerCase() as any)
                                ? (update.status as 'started' | 'completed' | 'failed' | 'processing')
                                : 'processing';
                              return {
                                type: update.type || 'agent_status',
                                agent_type: update.agent_type || 'UNKNOWN',
                                status,
                                message: update.message || '',
                                data: update.data,
                                timestamp: update.timestamp
                              };
                            });
                            const normalizedClarificationRequest = clarificationRequest
                              ? {
                                  type: clarificationRequest.type || 'clarification_request',
                                  task_id: clarificationRequest.task_id || taskId,
                                  clarification_request: clarificationRequest.clarification_request || '',
                                  message: clarificationRequest.message || '',
                                  timestamp: clarificationRequest.timestamp
                                }
                              : undefined;
                            
                            return (
                              <div className="multi-agent-workflow-message">
                                <EnhancedMultiAgentWorkflowCard
                                  taskId={taskId}
                                  workflowStage={workflowData?.workflowStage || 'Initializing'}
                                  agentUpdates={normalizedAgentUpdates}
                                  planSteps={workflowData?.planSteps || []}
                                  executionItems={workflowData?.executionItems || []}
                                  reviewData={workflowData?.reviewData}
                                  clarificationRequest={normalizedClarificationRequest}
                                  onClarificationResponse={handleClarificationResponse}
                                />
                              </div>
                            );
                          })()
                        ) : msg.role === 'assistant' && msg.content.startsWith('[AUTOMATION_PLAN]') ? (
                          <div className="automation-plan-message">
                            {(() => { 
                              let plan = automationPlans[msg.id]; 
                              try { 
                                const i = msg.content.indexOf('\n'); 
                                if (i >= 0) { 
                                  const j = msg.content.slice(i + 1); 
                                  if (j) plan = JSON.parse(j); 
                                } 
                              } catch {} 
                              
                              return <PlanContainer plan={plan} isVisible={true} />; 
                            })()}
                          </div>
                        ) : msg.role === 'assistant' && msg.content.startsWith('[AUTONOMOUS_TASK_CREATED]') ? (
                          <div className="autonomous-task-message">
                            {(() => { 
                              let taskData: any = {}; 
                              try { 
                                const j = msg.content.split('\n').slice(1).join('\n'); 
                                if (j) taskData = JSON.parse(j); 
                              } catch {} 
                              
                              return (
                                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-4 mb-4">
                                  <div className="flex items-center mb-3">
                                    <Zap className="w-5 h-5 text-green-400 mr-2" />
                                    <span className="text-green-400 font-semibold">Autonomous Task Created</span>
                                  </div>
                                  <div className="text-white">
                                    <div className="mb-2"><strong>{taskData.title}</strong></div>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-3">
                                      <div>Task ID: <span className="text-cyan-400">{taskData.task_id}</span></div>
                                      <div>Type: <span className="text-purple-400">{taskData.task_type}</span></div>
                                      <div>Status: <span className="text-yellow-400">{taskData.status}</span></div>
                                      <div>Duration: <span className="text-blue-400">{taskData.estimated_duration}s</span></div>
                                    </div>
                                    <div className="text-sm text-gray-400 bg-black/20 rounded p-2">
                                      {taskData.message}
                                    </div>
                                  </div>
                                </div>
                              ); 
                            })()}
                          </div>
                        ) : msg.role === 'system' && msg.content.startsWith('[AUTOMATION_CONTROL]') ? (
                          <div className="automation-control-message">
                            <button
                              type="button"
                              className="search-text-button"
                              onClick={() => { 
                                try { 
                                  console.log('Automation control button clicked - dispatching events');
                                  window.dispatchEvent(new Event('automation:show')); 
                                  window.dispatchEvent(new Event('automation:start')); 
                                } catch (e) { 
                                  console.error('Failed to dispatch automation events:', e); 
                                } 
                              }}
                            >
                              Open Web Automation Window
                            </button>
                          </div>
                        ) : msg.role === 'system' && msg.content.startsWith('[AUTOMATION_STOPPED]') ? (
                          <div className="automation-stopped-container">
                            {(() => { 
                              let stoppedData: any = {}; 
                              try { 
                                const i = msg.content.indexOf('\n'); 
                                if (i >= 0) { 
                                  const j = msg.content.slice(i + 1); 
                                  if (j) stoppedData = JSON.parse(j); 
                                } 
                              } catch {} 
                              return (
                                <div className="automation-stopped-info">
                                  <div className="stopped-header">⚠️ Web Automation Stopped</div>
                                  <div className="stopped-reason">Reason: {stoppedData.reason || 'Unknown'}</div>
                                  <div className="stopped-context">Context: {stoppedData.context || 'No context available'}</div>
                                  <div className="stopped-progress">Progress: {stoppedData.completed_steps || 0} of {stoppedData.total_steps || 0} steps completed</div>
                                  <div className="stopped-last-action">Last Action: {stoppedData.last_action || 'Unknown'}</div>
                                </div>
                              );
                            })()} 
                          </div>
                        ) : msg.role === 'assistant' && msg.content.startsWith('[AUTOMATION_RESULTS]') ? (
                          <div className="automation-results-message">
                            {(() => { 
                              let resultsData: any = {}; 
                              try { 
                                const i = msg.content.indexOf('\n'); 
                                if (i >= 0) { 
                                  const j = msg.content.slice(i + 1); 
                                  if (j) resultsData = JSON.parse(j); 
                                } 
                              } catch {} 
                              return (
                                <div className="automation-results-info">
                                  <div className="results-header">🎉 Web Automation Results</div>
                                  <div className="results-score">Score: {resultsData.score || 0}% {(resultsData.score || 0) >= 95 ? '✅' : '⚠️'}</div>
                                  <div className="results-success">Status: {resultsData.success ? 'Success' : 'Partial'}</div>
                                  <div className="results-explanation">{resultsData.explanation || 'No explanation available'}</div>
                                  {resultsData.task_completion && (
                                    <div className="results-task-completion">
                                      <div className="task-completion-header">Task Completion</div>
                                      <div className="task-completion-score">Final Review Score: {resultsData.task_completion.review_score ?? 'N/A'}</div>
                                    </div>
                                  )}
                                  {resultsData.extracted_data && resultsData.extracted_data.length > 0 && (
                                    <div className="results-data">
                                      <div className="data-header">Extracted Data:</div>
                                      <div className="data-items">
                                        {resultsData.extracted_data.slice(0, 5).map((item: any, idx: number) => (
                                          <div key={idx} className="data-item">{JSON.stringify(item).substring(0, 100)}...</div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()} 
                          </div>
                        ) : msg.role === 'assistant' && (msg.content.startsWith('[SEARCH_RESULTS]') || msg.content.match(/https?:\/\//)) ? (
                          <div className="search-result-message">
                            <span className="search-result-badge">🌐 Search Result</span>
                           {/* Attempt to parse [SEARCH_RESULTS] format: [SEARCH_RESULTS]\nTitle: ...\nURL: ...\nSnippet: ... */}
                           {(() => {
                             const lines = msg.content.split('\n');
                             let title = '', url = '', snippet = '';
                             lines.forEach(line => {
                               if (line.startsWith('Title:')) title = line.replace('Title:', '').trim();
                               else if (line.startsWith('URL:')) url = line.replace('URL:', '').trim();
                               else if (line.startsWith('Snippet:')) snippet = line.replace('Snippet:', '').trim();
                             });
                             // Fallback: if content contains a URL but not in [SEARCH_RESULTS] format
                             if (!title && !snippet && msg.content.match(/https?:\/\//)) {
                               url = msg.content.match(/https?:\/\/[\w\-\.\/?#=&%]+/g)?.[0] || '';
                               snippet = msg.content;
                             }
                             return (
                               <>
                                 {title && <div className="search-result-title">{title}</div>}
                                 {snippet && <div className="search-result-snippet">{snippet}</div>}
                                 {url && <div className="search-result-url"><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></div>}
                               </>
                             );
                           })()}
                         </div>
                       ) : msg.content.startsWith('[TASK_EXECUTION]') ? (
                         (() => {
                           try {
                             const taskData = JSON.parse(msg.content.substring('[TASK_EXECUTION]'.length + 1));
                             return (
                               <TaskMessage 
                                 taskId={taskData.id}
                                 initialMessage={taskData.message}
                                 onComplete={(result) => {
                                   console.log('🔥 Task completed with result:', result);
                                 }}
                               />
                             );
                           } catch (e) {
                             return <MessageFormatter content={msg.content} role={msg.role} />;
                           }
                         })()
                       ) : (
                         <MessageFormatter content={msg.content} role={msg.role} />
                       )}
                       
                       {/* Display message attachments if any */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="message-attachments">
                          {msg.attachments.map((attachment: Attachment, index: number) => (
                            <div key={index} className="message-attachment">
                              {attachment.type === 'image' && (
                                <div className="text-xs text-gray-400 mt-2">
                                  {msg.created_at ? format(new Date(msg.created_at), "h:mm a") : ""}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Show collapsible search results after assistant messages when internet search is enabled */}
                      {msg.role === 'assistant' && 
                       !msg.content.startsWith('[SEARCH_RESULTS]') && 
                       (internetSearchEnabled || currentChat?.chat_type === 'internet_search') && (
                        <div className="mt-2">
                          <CollapsibleSearchResults 
                            results={accessedWebsites && accessedWebsites.length > 0 
                              ? accessedWebsites.map(site => ({
                                  title: site.title,
                                  url: site.url,
                                  snippet: `Visit ${site.title}`,
                                  source: (() => {
                                    try {
                                      return new URL(site.url).hostname;
                                    } catch {
                                      return site.url;
                                    }
                                  })()
                                }))
                              : searchResults && searchResults.length > 0
                                ? searchResults.map(result => ({
                                    title: result.title,
                                    url: result.url,
                                    snippet: result.snippet || `Visit ${result.title}`,
                                    source: (() => {
                                      try {
                                        return new URL(result.url).hostname;
                                      } catch {
                                        return result.url;
                                      }
                                    })()
                                  }))
                                : []}
                            isSearching={isSearching || false}
                            onResultClick={(result) => {
                              window.open(result.url, '_blank', 'noopener,noreferrer');
                            }}
                          />
                        </div>
                      )}
                    </>
                  </div>
                  <div className="message-timestamp">
                    {(() => {
                      try {
                        // Check if timestamp is a string (from API) or a Date object
                        const date = msg.timestamp instanceof Date 
                          ? msg.timestamp 
                          : new Date(msg.timestamp || msg.created_at || Date.now());
                        
                        // Verify if the date is valid before formatting
                        if (isNaN(date.getTime())) {
                          return 'Invalid date';
                        }
                        
                        return format(date, "MMM d, yyyy HH:mm");
                      } catch (error) {
                        console.error('Error formatting date:', error);
                        return 'Unknown time';
                      }
                    })()}
                  </div>
                </div>
              </motion.div>
            );
            })}
            <div ref={messagesEndRef} />
            
            {activeWorkflowTaskId && (() => {
              console.log('🎬🎬🎬 RENDER BLOCK EXECUTING:', {
                activeWorkflowTaskId,
                workflowUpdateCounter,
                timestamp: new Date().toISOString()
              });
              
              const workflow = multiAgentWorkflows[activeWorkflowTaskId] || { agentUpdates: [] };
              const taskAgentUpdates = workflow?.agentUpdates || [];
              const clarificationRequest = clarificationRequests[activeWorkflowTaskId];
              
              console.log('📦 WORKFLOW DATA:', {
                workflow,
                taskAgentUpdates: taskAgentUpdates.length,
                clarificationRequest: !!clarificationRequest
              });
              
              const queuedMessages = workflowMessageQueue.getAllMessages(activeWorkflowTaskId);
              const stats = workflowMessageQueue.getStats(activeWorkflowTaskId);
              
              console.log('🔥🔥🔥 RENDER CHECK - Task:', activeWorkflowTaskId.slice(0, 8), 'React Updates:', taskAgentUpdates.length, 'Queue:', queuedMessages.length, 'Counter:', workflowUpdateCounter, 'Stats:', stats);
              
              const updatesToRender = queuedMessages.length > 0 ? queuedMessages : taskAgentUpdates;
              
              console.log('🎨 RENDER DECISION - Using:', queuedMessages.length > 0 ? 'QUEUE' : 'REACT STATE', 
                'Queue:', queuedMessages.length, 'React:', taskAgentUpdates.length);
              
              if (queuedMessages.length > taskAgentUpdates.length) {
                console.warn('⚠️ QUEUE HAS MORE MESSAGES THAN REACT STATE - Using queue as source of truth');
              }
              
              queuedMessages.forEach(msg => {
                if (!msg.rendered) {
                  workflowMessageQueue.markAsRendered(activeWorkflowTaskId, msg.sequence);
                  console.log(`✅ MARKED AS RENDERED - Message #${msg.sequence}:`, msg.agentType, msg.status);
                }
              });
              
              const normalizedAgentUpdates = updatesToRender.map((update: any) => {
                const allowedStatuses: Array<'started' | 'completed' | 'failed' | 'processing'> = ['started', 'completed', 'failed', 'processing'];
                const status = allowedStatuses.includes((update.status || '').toLowerCase() as any)
                  ? (update.status as 'started' | 'completed' | 'failed' | 'processing')
                  : 'processing';
                return {
                  type: update.type || 'agent_status',
                  agent_type: update.agent_type || update.agentType || update.agent || 'UNKNOWN',
                  status,
                  message: update.message || '',
                  data: update.data,
                  timestamp: update.timestamp
                };
              });
              const normalizedClarificationRequest = clarificationRequest
                ? {
                    type: clarificationRequest.type || 'clarification_request',
                    task_id: clarificationRequest.task_id || activeWorkflowTaskId,
                    clarification_request: clarificationRequest.clarification_request || '',
                    message: clarificationRequest.message || '',
                    timestamp: clarificationRequest.timestamp
                  }
                : undefined;
              
              console.log('🎨🎨🎨 ABOUT TO RENDER CARD:', {
                normalizedAgentUpdates: normalizedAgentUpdates.length,
                workflowStage: workflow?.workflowStage || 'Initializing',
                taskId: activeWorkflowTaskId.slice(0, 8),
                counter: workflowUpdateCounter
              });
              
              return (
                <div key={`workflow-${activeWorkflowTaskId}-${workflowUpdateCounter}`} className="realtime-workflow-display mb-6" style={{ position: 'sticky', bottom: '100px', zIndex: 10, border: '2px solid lime' }}>
                  <div style={{ padding: '8px', background: 'rgba(0, 255, 0, 0.1)', marginBottom: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
                    DEBUG: Task {activeWorkflowTaskId.slice(0, 8)} | Updates: {normalizedAgentUpdates.length} | Counter: {workflowUpdateCounter}
                  </div>
                  <EnhancedMultiAgentWorkflowCard
                    key={`card-${workflowUpdateCounter}`}
                    taskId={activeWorkflowTaskId}
                    workflowStage={workflow?.workflowStage || 'Initializing'}
                    agentUpdates={normalizedAgentUpdates}
                    planSteps={workflow?.planSteps || []}
                    executionItems={workflow?.executionItems || []}
                    reviewData={workflow?.reviewData}
                    clarificationRequest={normalizedClarificationRequest}
                    onClarificationResponse={handleClarificationResponse}
                  />
                </div>
              );
            })()}
            
            {/* Animated Avatar - Show during processing states */}
            {(isProcessing || avatarState !== 'idle') && (
              <div className="flex justify-start mb-4">
                <div className="flex items-center" style={{paddingLeft: 20}}>
                  <div className="flex items-center justify-center" style={{width: 20, height: 20, minWidth: 20, minHeight: 20}}>
                    <div style={{transform: 'scale(0.8)', width: '100%', height: '100%'}}>
                      <AnimatedAvatar 
                        state={avatarState} 
                        message="" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center" style={{marginLeft: 32}}>
                    <div className="bg-[#111111] rounded px-3 py-1 flex items-center" style={{minHeight: '28px'}}>
                      <span className="text-sm text-white font-medium" style={{lineHeight: '1.2'}}>
                        {avatarMessage || 'Processing...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Form - Using updated chat.css classes */}
      <div className="chat-input-wrapper">
        <form onSubmit={handleSubmit} className="w-full max-w-4xl">
          <div className={uploadedImages.length > 0 ? "chat-input-container-expanded neon-input" : "chat-input-container neon-input"}>
            <button 
              type="button" 
              className="chat-action-button neon-btn-secondary" 
              onClick={handlePlusButtonClick}
              disabled={isProcessing}
            >
              <Plus className="w-4 h-4 neon-icon" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={handleFileChange} 
            />
            
            <div className="relative flex-1">
              <textarea
                ref={(textAreaRef) => {
                  // Auto-resize logic
                  if (textAreaRef) {
                    // Reset height to auto to get the correct scrollHeight
                    textAreaRef.style.height = 'auto';
                    // Set the height to the scrollHeight to match content
                    const newHeight = Math.min(textAreaRef.scrollHeight, 400);
                    textAreaRef.style.height = `${newHeight}px`;
                  }
                }}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  // Adjust height on change
                  e.target.style.height = 'auto';
                  const newHeight = Math.min(e.target.scrollHeight, 400);
                  e.target.style.height = `${newHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (isSearchMode && e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim()) {
                      performSearch(message);
                    }
                  } else {
                    handleKeyDown(e);
                  }
                }}
                placeholder={isSearchMode ? "Ask Karios AI..." : "Ask Karios AI"}
                className="chat-textarea"
                rows={1}
                disabled={isProcessing}
              />
              {automationActive && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-teal-500">Web Automation Active</span>
                  </div>
                </div>
              )}
              {isProcessing && !automationActive && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-sm font-medium text-cyan-500">Thinking...</span>
                </div>
              )}
            </div>
            
            <div className="chat-input-actions">
              {/* Send button */}
              <button 
                type="submit" 
                className="chat-send-button neon-btn-primary"
                disabled={isProcessing || (!message.trim() && uploadedImages.length === 0)}
              >
                <Send className="w-4 h-4 neon-icon" />
              </button>
            </div>
          </div>
          
          <div className="chat-input-bottom-section">
            <SearchLockTooltip show={currentChat?.chat_type === 'internet_search'}>
               <button 
                 type="button" 
                 className={`search-text-button neon-btn-secondary ${isSearchMode ? 'search-active' : ''}`}
                 onClick={() => {
                   if (currentChat?.chat_type === 'internet_search') return;
                   // Only use toggleSearchMode - it now handles internetSearchEnabled synchronization
                   toggleSearchMode();
                 }}
                 disabled={currentChat?.chat_type === 'internet_search'}
                 style={currentChat?.chat_type === 'internet_search' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
               >
                 <Globe className="w-4 h-4 neon-icon" />
                 Search
               </button>
             </SearchLockTooltip>
                          <WebAutomationIntegration
                onAutomationResult={async (result) => {
                  console.log('🎯 Chat.tsx - Web automation result received:', result);
                  console.log('🎯 Current automation state:', { automationActive, automationSessionId, automationChatId });
                  
                  if (result.type === 'session_started') {
                    console.log('🎯 Processing session_started result');
                    setAutomationActive(true);
                    setAutomationSessionId(result.sessionId);
                    if (result.chatId) {
                      setAutomationChatId(result.chatId);
                      console.log('🎯 Set automationChatId to:', result.chatId);
                    }
                    console.log('🎯 Automation session started (Chat)', { sessionId: result.sessionId, chatId: result.chatId });
                    
                    try {
                      await addMessage({
                        content: `Web automation session started: ${result.sessionId}`,
                        role: 'system',
                        chatId: result.chatId || automationChatId || undefined
                      });
                      console.log('🎯 Session started message added to chat');
                    } catch (e) {
                      console.error('🎯 Error adding session started message:', e);
                    }
                    if (pendingAutomationTask) {
                      console.log('🎯 Processing pending automation task:', pendingAutomationTask);
                      try {
                        const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL;
                        const wfUrl = `${BACKEND_URL}/api/web-automation/execute-workflow`;
                        console.log('🎯 Will execute workflow at:', wfUrl);

                        // Log the pending user task into the automation chat
                        try {
                          const targetChatId = result.chatId || automationChatId;
                          console.log('🎯 Adding pending task to chat with ID:', targetChatId);
                          if (targetChatId) {
                            await addMessage({ role: 'user', content: pendingAutomationTask, chatId: targetChatId });
                            console.log('🎯 Pending task added to automation chat');
                          } else {
                            console.log('🎯 No target chat ID available for pending task');
                          }
                        } catch (e) {
                          console.error('🎯 Error adding pending task to chat:', e);
                        }

                        let workflowSteps = [];
                        let latestMessages: any[] = [];
                        try {
                          const targetChatId = result.chatId || automationChatId;
                          if (targetChatId) {
                            const autoChat = await chatService.getChat(targetChatId);
                            latestMessages = (autoChat.data?.messages || []).slice(-10);
                          } else {
                            latestMessages = currentChat?.messages?.slice(-10) || [];
                          }
                        } catch {
                          latestMessages = currentChat?.messages?.slice(-10) || [];
                        }
                        for (const msg of latestMessages) {
                          if (msg.content.startsWith('[AUTOMATION_PLAN]')) {
                            try {
                              const planJson = msg.content.substring(msg.content.indexOf('\n') + 1);
                              const plan = JSON.parse(planJson);
                              if (plan.steps && Array.isArray(plan.steps)) {
                                workflowSteps = plan.steps;
                                break;
                              }
                            } catch {}
                          }
                        }
                        if (workflowSteps.length === 0) {
                          const latestAutomationMessages = currentChat?.messages?.filter(msg => msg.role === 'assistant' && msg.content.startsWith('[AUTOMATION_STEP]')) || [];
                          workflowSteps = latestAutomationMessages.map(msg => {
                            try {
                              const stepJson = msg.content.substring(msg.content.indexOf('\n') + 1);
                              return JSON.parse(stepJson);
                            } catch {
                              return null;
                            }
                          }).filter(Boolean);
                        }
                        console.log('🎯 Executing workflow with steps:', workflowSteps.length, 'steps');
                        const workflowPayload = {
                          sessionId: result.sessionId,
                          workflow_steps: workflowSteps,
                          task_description: pendingAutomationTask
                        };
                        console.log('🎯 Workflow payload:', workflowPayload);
                        
                        const workflowResponse = await fetch(wfUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(workflowPayload)
                        });
                        
                        console.log('🎯 Workflow execution response status:', workflowResponse.status);
                        if (!workflowResponse.ok) {
                          const errorText = await workflowResponse.text().catch(() => 'Unknown error');
                          console.error('🎯 Workflow execution failed:', errorText);
                        } else {
                          console.log('🎯 Workflow execution started successfully');
                        }
                      } catch (e) {
                        console.error('🎯 Error executing workflow:', e);
                      }
                      setPendingAutomationTask(null);
                      console.log('🎯 Cleared pending automation task');
                    } else {
                      console.log('🎯 No pending automation task to process');
                    }
                  } else if (result.type === 'plan_created') {
                    console.log('🎯 Processing plan_created result:', result.plan);
                    const id = `plan-${Date.now()}`;
                    setAutomationPlans((prev) => ({ ...prev, [id]: result.plan }));
                    console.log('🎯 Added plan to automationPlans with ID:', id);
                    
                    try {
                      await addMessage({
                        content: `[AUTOMATION_PLAN]\n${JSON.stringify(result.plan)}`,
                        role: 'assistant',
                        chatId: automationChatId || undefined
                      });
                      console.log('🎯 Plan message added to chat UI');
                    } catch (e) {
                      console.error('🎯 Error adding plan message to chat:', e);
                    }
                  } else if (result.type === 'execution_started') {
                    console.log('🎯 Processing execution_started result');
                    try {
                      await addMessage({
                        content: `[AUTOMATION_CONTROL]`,
                        role: 'system',
                        chatId: automationChatId || undefined
                      });
                      console.log('🎯 Execution started message added to chat');
                    } catch (e) {
                      console.error('🎯 Error adding execution started message:', e);
                    }
                  } else if (result.type === 'display_limitation') {
                    console.log('🎯 Processing display_limitation result:', result.message);
                    try {
                      await addMessage({
                        content: `⚠️ ${result.message}`,
                        role: 'system',
                        chatId: automationChatId || undefined
                      });
                      toast(result.message, { 
                        icon: '⚠️',
                        duration: 5000,
                        style: {
                          background: '#FFA500',
                          color: '#fff',
                        }
                      });
                      console.log('🎯 Display limitation message added to chat');
                    } catch (e) {
                      console.error('🎯 Error adding display limitation message:', e);
                    }
                  } else if (result.type === 'action_executed') {
                    console.log('🎯 Processing action_executed result:', result.action);
                    try {
                      await addMessage({
                        content: `Web automation action: ${result.action.type} executed`,
                        role: 'system',
                        chatId: automationChatId || undefined
                      });
                      console.log('🎯 Action executed message added to chat');
                    } catch (e) {
                      console.error('🎯 Error adding action executed message:', e);
                    }
                  } else if (result.type === 'workflow_completed') {
                    console.log('🎯 Processing workflow_completed result:', { result: result.result, score: result.score });
                    try {
                      const completionMessage = {
                        score: result.score,
                        success: result.result?.success || false,
                        explanation: result.result?.explanation || 'Automation completed',
                        extracted_data: result.result?.extracted_data || [],
                        task_completion: result.result?.task_completion || {}
                      };
                      
                      await addMessage({
                        content: `[AUTOMATION_RESULTS]\n${JSON.stringify(completionMessage)}`,
                        role: 'assistant',
                        chatId: automationChatId || undefined
                      });
                      console.log('🎯 Workflow completed message added to chat');
                      
                      setAvatarState('idle');
                      setAvatarMessage('🎉 Automation completed successfully!');
                    } catch (e) {
                      console.error('🎯 Error adding workflow completed message:', e);
                    }
                  } else if (result.type === 'session_stopped') {
                    console.log('🎯 Processing session_stopped result');
                    setAutomationActive(false);
                    setAutomationSessionId(null);
                    console.log('🎯 Automation session stopped (Chat)');
                    
                    try {
                      await addMessage({
                        content: `[AUTOMATION_STOPPED]\n${JSON.stringify({
                          reason: result.reason || 'User stopped',
                          context: result.context || 'Web automation session ended',
                          completed_steps: result.completed_steps || 0,
                          total_steps: result.total_steps || 0,
                          last_action: result.last_action || 'Unknown'
                        })}`,
                        role: 'system',
                        chatId: automationChatId || undefined
                      });
                      console.log('🎯 Session stopped message added to chat');
                    } catch (e) {
                      console.error('🎯 Error adding session stopped message:', e);
                    }
                  } else {
                    console.log('🎯 Unknown automation result type:', result.type);
                  }
                }}
              />
           </div>
        </form>
        
        {/* Image upload progress indicator */}
        {isUploading && (
          <div className="upload-progress-container">
            <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
            <div className="upload-progress-text">
              Uploading... {Math.round(uploadProgress)}%
            </div>
          </div>
        )}
        
        {/* Uploaded images preview */}
        {uploadedImages.length > 0 && (
          <div className="uploaded-images-container">
            {uploadedImages.map((img, index) => (
              <div key={index} className="uploaded-image-preview">
                <img 
                  src={img.preview_url || img.url} 
                  alt={img.name} 
                  className="uploaded-image"
                />
                <button 
                  className="remove-image-button" 
                  onClick={() => removeUploadedImage(img.name)}
                  type="button"
                >
                  <X className="w-4 h-4 neon-icon" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="chat-ai-notice neon-text">Karios AI | Verify important Info.</div>
        
        
        {/* Floating search results button that appears after searching is complete */}
        <AccessedWebsitesFloater
          isVisible={true}
        />
        
        {activeWorkflowTaskId && (
          <WorkflowDebugPanel taskId={activeWorkflowTaskId} />
        )}
      </div>
      </div>
    </div>
  );
};

export default Chat;
