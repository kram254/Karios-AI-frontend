import React, { useState, useEffect, useRef, ChangeEvent, useCallback, useMemo } from "react";
import { MessageSquare, Send, Plus, X, Globe, Zap, Pencil, Check, Copy, Loader, ChevronDown, ChevronUp, Terminal, Maximize2, Minimize2 } from "lucide-react";
import { format } from "date-fns";
import { useChat } from "../context/ChatContext";
import SearchLockTooltip from "./SearchLockTooltip";
import { motion, AnimatePresence } from "framer-motion";
import toast from 'react-hot-toast';
import AgentInfoBanner from "./agent/AgentInfoBanner";
import MessageFormatter from "./MessageFormatter";
import { chatService, Attachment } from "../services/api/chat.service";
import { generateTitleFromMessage } from "../utils/titleGenerator";
import CollapsibleSearchResults from "./CollapsibleSearchResults";
import AnimatedBotAvatar from "./AnimatedBotAvatar";
import { useBotState } from "../hooks/useBotState";
import AccessedWebsitesFloater from "./AccessedWebsitesFloater";
import WebAutomationIntegration from "./WebAutomationIntegration";
import PlanContainer from "./PlanContainer";
import TaskMessage from "./tasks/TaskMessage";
import { EnhancedMultiAgentWorkflowCard } from './EnhancedMultiAgentWorkflowCard';
import KariosBrowser from './GeminiBrowser';
import { WorkflowPanel } from './WorkflowPanel';
import { ChatInput } from './ChatInput';
import multiAgentWebSocketService, { MultiAgentWSMessage } from "../services/multiAgentWebSocket.multi";
import { websocketStateManager } from "../services/websocketStateManager.service";
import { workflowMessageQueue } from "../services/workflowMessageQueue";
import { useThrottle } from "../hooks/useThrottle";
import { nextLevelAutomationService } from "../services/nextLevelAutomation";
import { workflowStateSyncService } from "../services/workflowStateSync.service";
import { chatIsolationService } from "../services/chatIsolation.service";
import { stateIntegrityMonitor } from "../services/stateIntegrityMonitor.service";
import { globalStateCoordinator } from "../services/globalStateCoordinator.service";
import { unifiedWorkflowService } from "../services/unifiedWorkflowService";
import "../styles/chat.css";
import "../styles/artifact.css";
import { useArtifactSystem } from "../hooks/useArtifactSystem";
import { artifactManager } from "../services/artifactManager.service";
import { CanvasLayout } from "./artifacts/CanvasLayout";
import { ArtifactRenderer } from "./artifacts/ArtifactRenderer";
import { MessageWithArtifact } from "./artifacts/MessageWithArtifact";
import { CanvasTopBar, EndlessCanvas, AssetsThumbnailStrip, ArtifactFullscreenModal, AssetEntry, BrowserSessionCard, CanvasProjectBadge, CanvasBottomDock } from "./canvas";
import type { CanvasConfig, UsageDataRow } from "./canvas/CanvasTopBar";
import { chatStatusRegistry } from "../services/chatStatusRegistry.service";
import { SuggestionChips } from "./SuggestionChips";
import { MessageReactions } from "./MessageReactions";
import { PersonalizationIndicator } from "./PersonalizationIndicator";
import { RegenerateOptions } from "./RegenerateOptions";
import { ThinkingBlock } from "./ThinkingBlock";
import AgentSelectionModal, { AgentSelectionResult } from "./agent/AgentSelectionModal";
import { AgentThinkingStream, StepProgressTracker } from "./AgentThinkingStream";
import { ReActLoopIndicator } from "./ReActLoopIndicator";
import { PlanPreviewModal } from "./PlanPreviewModal";
import { IntentConfirmationModal } from "./IntentConfirmationModal";
import { LiveExecutionCard } from "./LiveExecutionCard";
import { ToolActionCard } from "./ToolActionCard";
import { WorkflowCheckpoints } from "./WorkflowCheckpoints";
import { ApprovalGate } from "./ApprovalGate";
import { ChallengeGate } from "./ChallengeGate";
import { HitlPauseGate } from "./HitlPauseGate";
import StreamingText from './StreamingText';
import { ContextWindowDisplay } from "./ContextWindowDisplay";
import { QualityIndicator } from "./QualityIndicator";
import { WorkflowControls } from "./WorkflowControls";
import { ParallelStepVisualization } from "./ParallelStepVisualization";
import { StructuredResultsTable } from "./StructuredResultsTable";
import { ArtifactSidePanel } from "./artifacts/ArtifactSidePanel";
import { OkComputerPanel } from "./artifacts/OkComputerPanel";
import { GraphicsRenderer } from "./workflow/GraphicsRenderer";
import { Table, Layout, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GradientBackground } from "./ui/GradientBackground";
import { BGPattern } from "./ui/bg-pattern";
import type { Message, ChatData } from "../types/chatMessages";
import { isSimpleTask, isMultiAgentMessage, analyzeTaskComplexity, formatElapsed, classifyAutomationIntent } from "./chat/chatHelpers";
import { resolveWorkflowTaskId, resolveWorkflowEventId, resolveWorkflowEventSeq, parseWorkflowTimestampMs, compareWorkflowEventOrder } from "./chat/workflowEventHelpers";
import { shouldFilterSearchDisclaimerMessage } from "./chat/messageFilters";
import { useWorkflowEventDedup } from "../hooks/useWorkflowEventDedup";
import { useHttpFallbackPolling } from "../hooks/useHttpFallbackPolling";
import { useProgressiveToolCards } from "../hooks/useProgressiveToolCards";
import { useUnifiedVisitedUrls } from "../hooks/useUnifiedVisitedUrls";
import ChatFirstRun from './chat/ChatFirstRun';
import ChatStreamingSurface from './chat/ChatStreamingSurface';
import InlineAgentCard from './agent/InlineAgentCard';
import { detectAgentIntent } from '../hooks/useAgentIntentDetector';
import type { AgentDraft } from '../hooks/useAgentIntentDetector';

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
    createAgentChat,
    updateChatTitle,
    internetSearchEnabled,
    toggleSearchMode,
    searchResults,
    isSearching,
    accessedWebsites,
    avatarState,
    setAvatarState,
    avatarMessage,
    setAvatarMessage,
    isGenerating,
    stopGeneration,
    getChatFeatures
  } = useChat();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [automationActive, setAutomationActive] = useState(false);
  const [automationSessionId, setAutomationSessionId] = useState<string | null>(null);
  const [automationChatId, setAutomationChatId] = useState<string | null>(null);
  const [automationPlans, setAutomationPlans] = useState<Record<string, any>>({});
  const [automationStreamScreenshot, setAutomationStreamScreenshot] = useState<string>('');
  const [automationStreamScreenshotMime, setAutomationStreamScreenshotMime] = useState<string>('image/png');
  const [automationStreamUrl, setAutomationStreamUrl] = useState<string>('');
  const [automationWsLogs, setAutomationWsLogs] = useState<Array<{ timestamp: string; type: 'info' | 'success' | 'warning' | 'error' | 'task'; message: string }>>([]);
  const wsLogsUpdateTimerRef = useRef<number | null>(null);
  const [automationStructuredData, setAutomationStructuredData] = useState<any>(null);
  const [automationWsReconnectTick, setAutomationWsReconnectTick] = useState(0);
  const webAutomationWsRef = useRef<WebSocket | null>(null);
  const lastAutomationFrameAtRef = useRef<number>(0);
  const lastAutomationRecoveryAtRef = useRef<number>(0);
  const automationWsReconnectTimerRef = useRef<number | null>(null);
  const lastAutomationResolvedSessionIdRef = useRef<string | null>(null);

  const chatFeatures = useMemo(() => getChatFeatures(), [currentChat?.chat_type, currentChat?.agent_actions]);
  const devUiToggles = useMemo(() => {
    const getFlag = (key: string) => {
      try {
        return window.localStorage.getItem(key) === '1';
      } catch {
        return false;
      }
    };

    return {
      enableLegacyTitleUpdate: getFlag('chat_enable_legacy_title_update'),
      enableLegacySearchToast: getFlag('chat_enable_legacy_search_toast'),
      enableLegacyPanels: getFlag('chat_enable_legacy_panels'),
      enableLegacyStatusBlock: getFlag('chat_enable_legacy_status_block'),
      enableLegacyInputIndicators: getFlag('chat_enable_legacy_input_indicators'),
      enableLegacyModals: getFlag('chat_enable_legacy_modals')
    };
  }, []);
  const [pendingAutomationTask, setPendingAutomationTask] = useState<string | null>(null);
  const [multiAgentWorkflows, setMultiAgentWorkflows] = useState<Record<string, any>>({});
  const [workflowCompleted, setWorkflowCompleted] = useState<Record<string, boolean>>({});
  const [agentUpdates, setAgentUpdates] = useState<Record<string, MultiAgentWSMessage[]>>({});
  const [clarificationRequests, setClarificationRequests] = useState<Record<string, MultiAgentWSMessage>>({});
  const [clarificationDraft, setClarificationDraft] = useState('');
  const [taskIdAliases, setTaskIdAliases] = useState<Record<string, string>>({});
  const [activeWorkflowTaskId, setActiveWorkflowTaskId] = useState<string | null>(null);
  const [workflowUpdateCounter, setWorkflowUpdateCounter] = useState<number>(0);
  const [wsConnectionState, setWsConnectionState] = useState<{ status: 'connected' | 'disconnected' | 'reconnecting'; attempt?: number; maxAttempts?: number; nextRetryMs?: number; timestamp: number }>({ status: 'disconnected', timestamp: Date.now() });
  const [stalledExecution, setStalledExecution] = useState<{ isStalled: boolean; message: string; since: number | null }>({ isStalled: false, message: '', since: null });
  const [executionHistoryByChat, setExecutionHistoryByChat] = useState<Record<string, any[]>>({});
  const [showKariosBrowser, setShowKariosBrowser] = useState(false);
  const [kariosBrowserTask, setKariosBrowserTask] = useState<string>('');
  const [browserHeadlessMode, setBrowserHeadlessMode] = useState(false);
  const [browserCurrentAction, setBrowserCurrentAction] = useState<string>('');
  const [headlessWorkflowActive, setHeadlessWorkflowActive] = useState(false);
  const [headlessPanelOpen, setHeadlessPanelOpen] = useState(false);
  const [headlessSwitchMessage, setHeadlessSwitchMessage] = useState('');
  const [canvasUsageRows, setCanvasUsageRows] = useState<UsageDataRow[]>([]);
  const [canvasToolsRows, setCanvasToolsRows] = useState<UsageDataRow[]>([]);
  const [nextLevelCapabilities, setNextLevelCapabilities] = useState<any>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [suggestions, setSuggestions] = useState<{type: 'action' | 'clarification' | 'related' | 'expansion'; text: string; action: string}[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [agentThoughts, setAgentThoughts] = useState<Array<{id: string; agent: string; thought: string; timestamp: string; metadata?: any; task_id?: string; event_id?: string; event_seq?: number}>>([]);
  const [stepProgress, setStepProgress] = useState<Array<{id: string; step_number: number; total_steps: number; description: string; tool_name: string; status: 'starting' | 'running' | 'completed' | 'failed'; timestamp: string; metadata?: any; task_id?: string; event_id?: string; event_seq?: number}>>([]);
  const [activeLoopPhase, setActiveLoopPhase] = useState<{ phase: string; step: number; totalSteps: number; tool: string; description: string } | null>(null);
  const [showThinkingStream, setShowThinkingStream] = useState(true);
  const [planPreview, setPlanPreview] = useState<{isOpen: boolean; plan: any[]; taskObjective: string; taskId?: string} | null>(null);
  const [intentConfirmation, setIntentConfirmation] = useState<{
    isOpen: boolean;
    pendingMessage: string;
    intentData: {
      objective: string;
      complexity: string;
      workflow_type: string;
      estimated_time: number;
      tools_required: number;
      actions: string[];
    };
    taskId: string;
  } | null>(null);
  const [checkpoints, setCheckpoints] = useState<Record<string, Array<{id: string; name: string; stepNumber: number; timestamp: string; state: any}>>>({});
  const [pendingApprovals, setPendingApprovals] = useState<Array<{
  const [pendingAgentDraft, setPendingAgentDraft] = useState<AgentDraft | null>(null);
    id: string;
    action: string;
    tool: string;
    parameters: any;
    riskLevel: 'low' | 'medium' | 'high';
    policy?: { policy_id: string; reason?: string };
    reason?: string;
    url?: string;
    taskId?: string;
  }>>([]);
  const [contextWindow, setContextWindow] = useState<{items: any[]; totalTokens: number; maxTokens: number}>({items: [], totalTokens: 0, maxTokens: 100000});
  const [qualityMetrics, setQualityMetrics] = useState<Record<string, any>>({});
  const [workflowState, setWorkflowState] = useState<{isRunning: boolean; isPaused: boolean; canResume: boolean}>({isRunning: false, isPaused: false, canResume: false});
  const [parallelSteps, setParallelSteps] = useState<Array<Array<any>>>([]);
  
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [taskExecutionError, setTaskExecutionError] = useState<{ taskId: string; message: string } | null>(null);
  const [executionSummaryByTask, setExecutionSummaryByTask] = useState<Record<string, { durationMs: number; stepsCompleted: number; urlsVisited: number }>>({});
  const [clarificationDrafts, setClarificationDrafts] = useState<Record<string, string>>({});
  const [streamingFormatterOutput, setStreamingFormatterOutput] = useState<{ taskId: string; text: string } | null>(null);
  const [visibleMessageCount, setVisibleMessageCount] = useState(50);
  const [liveExecution, setLiveExecution] = useState<{
    isActive: boolean;
    taskObjective: string;
    thinkingStartTime: number | null;
    tasks: Array<{id: string; description: string; status: 'pending' | 'running' | 'completed' | 'failed'}>;
    agentActions: Array<{id: string; type: 'search' | 'outline' | 'analyze' | 'extract' | 'navigate' | 'other'; description: string; timestamp: number; duration?: number}>;
    currentThought: string;
    confidenceLevel: 'high' | 'medium' | 'low';
    executionStartTime: number | null;
  }>({
    isActive: false,
    taskObjective: '',
    thinkingStartTime: null,
    tasks: [],
    agentActions: [],
    currentThought: '',
    confidenceLevel: 'high',
    executionStartTime: null
  });
  
  const [activeSidePanelArtifact, setActiveSidePanelArtifact] = useState<{
    title: string;
    type: 'code' | 'document' | 'react' | 'html' | 'svg' | 'mermaid' | 'data';
    content: React.ReactNode;
  } | null>(null);
  
  // REMOVED: Legacy effect that auto-closed browser in headless mode. 
  // We now want to keep the OkComputer panel open even in headless mode.
  
  const [chatWorkflowStates, setChatWorkflowStates] = useState<Record<string, {
    workflows: Record<string, any>;
    activeTaskId: string | null;
    showBrowser: boolean;
    browserTask: string;
    automationActive: boolean;
    pendingTask: string | null;
    messageInput?: string;
    uploadedImages?: Attachment[];
    stepProgress?: any[];
    agentThoughts?: any[];
    liveExecution?: any;
    workflowCompleted?: Record<string, boolean>;
    executionSnapshotsByTask?: Record<string, Record<string, any>>;
    latestExecutionSnapshot?: Record<string, any> | null;
    lastWorkflowEventSeqByTask?: Record<string, number>;
  }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTaskIdRef = useRef<string | null>(null);
  const pendingAgentStatusRef = useRef<MultiAgentWSMessage[]>([]);
  const agentStatusImmediateModeRef = useRef(false);
  const currentChatRef = useRef(currentChat);
  const workflowStateRef = useRef({
    showKariosBrowser,
    activeWorkflowTaskId,
    automationActive,
    multiAgentWorkflows,
    kariosBrowserTask,
    pendingAutomationTask,
    stepProgress,
    agentThoughts,
    liveExecution,
    workflowCompleted,
    messageInput: message,
    uploadedImages
  });
  const progressiveToolCardsRef = useRef<any[]>([]);
  const combinedStepsListRef = useRef<any[]>([]);
  const unifiedVisitedUrlsRef = useRef<any[]>([]);
  const liveExecutionRef = useRef(liveExecution);
  const activeWorkflowTaskIdRef = useRef<string | null>(activeWorkflowTaskId);
  const workflowCompletedRef = useRef<Record<string, boolean>>(workflowCompleted);
  const latestExecutionSnapshotRef = useRef<Record<string, any> | null>(null);
  const executionSnapshotsByTaskRef = useRef<Record<string, Record<string, any>>>({});
  const { seenWorkflowEventsRef, lastWorkflowEventSeqByTaskRef, shouldSkipWorkflowEvent } = useWorkflowEventDedup();
  const formatterTokenCounterRef = useRef<number>(0);
  const lastWorkflowActivityAtRef = useRef<number>(Date.now());
  const {
    httpFallbackPollingRef,
    httpFallbackInFlightRef,
    stopHttpFallbackPolling,
    withAuthHeaders,
    appendExecutionHistoryEvent,
    markWorkflowActivity,
    reconcileChatFromApi,
    pollTaskStatusFromApi,
    startHttpFallbackPolling,
  } = useHttpFallbackPolling({
    currentChatRef,
    activeWorkflowTaskIdRef,
    lastTaskIdRef,
    workflowStateRef,
    workflowCompletedRef,
    lastWorkflowActivityAtRef,
    lastWorkflowEventSeqByTaskRef,
    wsConnectionState,
    setCurrentChat,
    setExecutionHistoryByChat,
    setStalledExecution,
    setWorkflowCompleted,
    setWorkflowState,
    setLiveExecution,
    setBrowserCurrentAction,
    setMultiAgentWorkflows,
    setClarificationRequests,
  });

  const createMultiAgentTaskViaHttp = useCallback(async (chatId: string, originalRequest: string) => {
    const trimmedRequest = String(originalRequest || '').trim();
    if (!chatId || trimmedRequest.length === 0) return null;
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/multi-agent/create-task`, {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }),
        body: JSON.stringify({
          chat_id: chatId,
          user_id: 1,
          original_request: trimmedRequest
        })
      });
      if (!response.ok) return null;
      const result = await response.json();
      if (!result || !result.success || !result.task_id) return null;
      const taskId = String(result.task_id);
      lastTaskIdRef.current = taskId;
      setActiveWorkflowTaskId(prev => prev === taskId ? prev : taskId);
      setWorkflowUpdateCounter(prev => prev + 1);
      setMultiAgentWorkflows(prev => {
        const existing = prev[taskId] || {};
        return {
          ...prev,
          [taskId]: {
            ...existing,
            taskId: existing.taskId || taskId,
            workflowStage: existing.workflowStage || 'created',
            lastUpdate: new Date().toISOString(),
            agentUpdates: existing.agentUpdates || [],
            planSteps: existing.planSteps || [],
            executionItems: existing.executionItems || []
          }
        };
      });
      startHttpFallbackPolling(chatId);
      return taskId;
    } catch (e) {
      return null;
    }
  }, [startHttpFallbackPolling, withAuthHeaders]);

  const triggerHeadlessFallback = useCallback((message?: string) => {
    if (headlessWorkflowActive) return;
    const msg = message || 'Live browser streaming not available, switching to headless browser mode';
    setHeadlessSwitchMessage(msg);
    setHeadlessWorkflowActive(true);
    setHeadlessPanelOpen(true);
    setBrowserHeadlessMode(true);
    setShowKariosBrowser(false);
    try { window.dispatchEvent(new CustomEvent('browser-automation:sidebar-collapse', { detail: { collapse: false } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('canvas:sidebar-collapse', { detail: { collapse: false } })); } catch {}
    setAutomationWsLogs(prev => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'warning', message: msg }]);
  }, [headlessWorkflowActive]);

  const flushAgentStatusUpdates = useCallback(() => {
    const batch = pendingAgentStatusRef.current;
    if (!batch || batch.length === 0) {
      return;
    }

    pendingAgentStatusRef.current = [];

    const agentTypeMap: { [key: string]: string } = {
      'PROMPT_REFINER': 'Prompt Refiner',
      'PLANNER': 'Planner',
      'TASK_EXECUTOR': 'Task Executor',
      'REVIEWER': 'Reviewer',
      'FORMATTER': 'Formatter'
    };

    const stageEvents: Array<{ taskId: string; stage: string; agent_type?: string; status?: string; message?: string }> = [];
    const completedTaskIds: string[] = [];
    let headlessCandidate: any = undefined;
    let actionCandidate: string | undefined = undefined;

    setMultiAgentWorkflows(prev => {
      let next: Record<string, any> = prev;
      let changed = false;

      const orderedBatch = [...batch].sort(compareWorkflowEventOrder);

      for (const data of orderedBatch) {
        if (!data.task_id) {
          continue;
        }

        const backendTaskId = data.task_id;
        const currentWorkflow = next[backendTaskId] || {};
        const existingUpdates = currentWorkflow.agentUpdates || [];

        const incomingEventId = resolveWorkflowEventId(data);
        const incomingEventSeq = resolveWorkflowEventSeq(data);
        const isDuplicate = existingUpdates.some((update: any) => {
          const existingEventId = resolveWorkflowEventId(update);
          if (incomingEventId && existingEventId) {
            return existingEventId === incomingEventId;
          }
          const existingEventSeq = resolveWorkflowEventSeq(update);
          if (incomingEventSeq !== undefined && existingEventSeq !== undefined) {
            return existingEventSeq === incomingEventSeq;
          }
          return (
            update.agent_type === data.agent_type &&
            update.status === data.status &&
            update.timestamp === data.timestamp
          );
        });

        if (isDuplicate) {
          continue;
        }

        if (!changed) {
          next = { ...prev };
          changed = true;
        }

        const agentName = agentTypeMap[data.agent_type || ''] || data.agent_type || 'Unknown';
        const newWorkflowStage = data.status === 'completed' ? `${agentName} Completed` : `${agentName} Processing`;

        const newUpdate = {
          type: data.type || 'agent_status',
          agent_type: data.agent_type,
          status: data.status,
          message: data.message,
          timestamp: data.timestamp,
          event_id: incomingEventId || undefined,
          event_seq: incomingEventSeq,
          data: data.data
        };

        next[backendTaskId] = {
          ...currentWorkflow,
          taskId: backendTaskId,
          workflowStage: newWorkflowStage,
          lastUpdate: data.timestamp || new Date().toISOString(),
          currentStep: data.data?.step_id,
          stepProgress: data.data?.progress,
          agentUpdates: [...existingUpdates, newUpdate].sort(compareWorkflowEventOrder)
        };

        stageEvents.push({
          taskId: backendTaskId,
          stage: newWorkflowStage,
          agent_type: data.agent_type,
          status: data.status,
          message: data.message
        });

        if (data.agent_type === 'FORMATTER' && data.status === 'completed') {
          completedTaskIds.push(backendTaskId);
        }

        if (data.agent_type === 'TASK_EXECUTOR' && data.data) {
          if (data.data.headless !== undefined) {
            headlessCandidate = data.data.headless;
          }
          if (data.data.current_action || data.message) {
            actionCandidate = data.data.current_action || data.message || '';
          }
        }
      }

      return changed ? next : prev;
    });

    if (headlessCandidate !== undefined) {
      setBrowserHeadlessMode((prev: any) => prev === headlessCandidate ? prev : headlessCandidate);
    }

    if (actionCandidate !== undefined) {
      const nextAction = actionCandidate;
      setBrowserCurrentAction(prev => prev === nextAction ? prev : nextAction);
    }

    if (completedTaskIds.length > 0) {
      setWorkflowCompleted(prev => {
        let next = prev;
        let changed = false;
        for (const taskId of completedTaskIds) {
          if (!next[taskId]) {
            if (!changed) {
              next = { ...prev };
              changed = true;
            }
            next[taskId] = true;
          }
        }
        return changed ? next : prev;
      });
    }

    if (stageEvents.length > 0) {
      const lastByTask: Record<string, any> = {};
      for (const evt of stageEvents) {
        lastByTask[evt.taskId] = evt;
      }
      Object.values(lastByTask).forEach((evt: any) => {
        window.dispatchEvent(new CustomEvent('workflow:update', {
          detail: {
            stage: evt.stage,
            agent_type: evt.agent_type,
            status: evt.status,
            message: evt.message,
            task_id: evt.taskId
          }
        }));
      });

      setWorkflowUpdateCounter(prev => prev + 1);
    }
  }, [compareWorkflowEventOrder, resolveWorkflowEventId, resolveWorkflowEventSeq, setBrowserCurrentAction, setBrowserHeadlessMode, setMultiAgentWorkflows, setWorkflowCompleted, setWorkflowUpdateCounter]);

  const throttledFlushAgentStatusUpdates = useThrottle(flushAgentStatusUpdates, 200);

  const {
    activeArtifact,
    layoutMode,
    detectAndCreateArtifact,
    expandArtifact,
    collapseArtifact,
    getArtifactsForMessage,
    scrollChatToBottom,
    forceScrollToBottom,
    isAtBottom,
    handleChatScroll,
    handleArtifactScroll,
    chatScrollRef,
    artifactScrollRef,
    isChatFullscreen,
    toggleChatFullscreen,
    fullscreenArtifact,
    openFullscreenArtifact,
    closeFullscreenArtifact,
    floatingArtifacts
  } = useArtifactSystem(currentChat?.id || '');

  const handleCanvasConfigChange = useCallback((config: CanvasConfig) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-canvas-theme', config.theme);
      document.documentElement.setAttribute('data-canvas-density', config.density);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    fetch(`${backendUrl}/api/metrics/cost-breakdown`, { signal: controller.signal })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && Array.isArray(data.models)) {
          setCanvasUsageRows(
            data.models.map((m: Record<string, unknown>) => ({
              model: (m.model || m.name || 'Unknown') as string,
              inputTokens: (m.input_tokens || m.inputTokens || 0) as number,
              outputTokens: (m.output_tokens || m.outputTokens || 0) as number,
              cost: (m.cost || m.total_cost || 0) as number
            }))
          );
        }
        if (data && Array.isArray(data.tools)) {
          setCanvasToolsRows(
            data.tools.map((t: Record<string, unknown>) => ({
              model: (t.tool || t.name || 'Unknown') as string,
              inputTokens: (t.input_tokens || t.inputTokens || 0) as number,
              outputTokens: (t.output_tokens || t.outputTokens || 0) as number,
              cost: (t.cost || t.total_cost || 0) as number
            }))
          );
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [currentChat?.id]);

  const messagesToShow = useMemo(
    () => {
      const all = currentChat?.messages ?? [];
      return all.length > visibleMessageCount
        ? all.slice(all.length - visibleMessageCount)
        : all;
    },
    [currentChat?.messages, visibleMessageCount]
  );

  const isWorkflowActive = useMemo(() => {
    if (!activeWorkflowTaskId) return false;
    if (workflowCompleted[activeWorkflowTaskId]) return false;
    const workflow = multiAgentWorkflows[activeWorkflowTaskId];
    if (!workflow) return false;
    const updates = workflow.agentUpdates || [];
    if (updates.length === 0) return true;
    const lastUpdate = updates[updates.length - 1];
    if (lastUpdate?.agent_type === 'FORMATTER' && lastUpdate?.status === 'completed') return false;
    return true;
  }, [activeWorkflowTaskId, multiAgentWorkflows, workflowCompleted]);

  const currentWorkflowMessage = useMemo(() => {
    if (!activeWorkflowTaskId || !isWorkflowActive) return '';
    if (agentThoughts.length > 0) {
      const latestThought = agentThoughts[agentThoughts.length - 1];
      if (latestThought?.thought) {
        return latestThought.thought;
      }
    }
    const workflow = multiAgentWorkflows[activeWorkflowTaskId];
    if (!workflow) return 'Processing...';
    const updates = workflow.agentUpdates || [];
    if (updates.length === 0) return 'Initializing workflow...';
    const lastUpdate = updates[updates.length - 1];
    return lastUpdate?.message || workflow.workflowStage || 'Processing...';
  }, [activeWorkflowTaskId, multiAgentWorkflows, isWorkflowActive, agentThoughts]);

  const currentWorkflow = useMemo(() => {
    if (!activeWorkflowTaskId) return null;
    return multiAgentWorkflows[activeWorkflowTaskId] || null;
  }, [activeWorkflowTaskId, multiAgentWorkflows]);

  const { botState, botMessage } = useBotState({
    isGenerating,
    isSearching,
    isSearchMode,
    avatarState,
    workflowStage: currentWorkflow?.workflowStage,
    isWorkflowActive,
    workflowCompleted: activeWorkflowTaskId ? workflowCompleted[activeWorkflowTaskId] : false,
    isProcessing,
    automationActive,
    agentUpdates: currentWorkflow?.agentUpdates || [],
  });

  const liveExecutionRunning = liveExecution.isActive && !(activeWorkflowTaskId && workflowCompleted[activeWorkflowTaskId]);

  const showUnifiedStatus = isGenerating || isProcessing || isSearching || isWorkflowActive || liveExecutionRunning;

  const activeExecutionHistory = useMemo(() => {
    const chatId = currentChat?.id;
    if (!chatId) return [];
    const history = executionHistoryByChat[chatId];
    return Array.isArray(history) ? history : [];
  }, [currentChat?.id, executionHistoryByChat]);

  const latestExecutionHistoryEvent = useMemo(() => {
    if (activeExecutionHistory.length === 0) return null;
    return activeExecutionHistory[activeExecutionHistory.length - 1] || null;
  }, [activeExecutionHistory]);

  const unifiedStatusText = useMemo(() => {
    if (stalledExecution.isStalled) {
      return stalledExecution.message || 'Waiting for workflow updates...';
    }
    if (wsConnectionState.status === 'reconnecting') {
      return 'Reconnecting to workflow updates...';
    }
    if (wsConnectionState.status === 'disconnected' && isWorkflowActive) {
      return 'Connection interrupted, syncing updates...';
    }
    const latestType = String((latestExecutionHistoryEvent as any)?.type || '').trim();
    const latestStage = String((latestExecutionHistoryEvent as any)?.workflow_stage || '').trim();
    if (latestType === 'workflow_stage_change' && latestStage) {
      return latestStage;
    }
    const workflowText = (isWorkflowActive ? currentWorkflowMessage : '').trim();
    if (workflowText) return workflowText;
    if (isProcessing && !isGenerating && !isSearching) return 'Analyzing request...';
    if (liveExecutionRunning) return 'Analyzing request...';
    const botText = String(botMessage || '').trim();
    if (botText && (isGenerating || isProcessing || isSearching)) return botText;
    if (avatarState === 'searching') return 'Searching the web...';
    if (avatarState === 'browsing') return 'Browsing pages...';
    if (avatarState === 'scraping') return 'Extracting data...';
    if (avatarState === 'processing') return 'Processing results...';
    return 'Working on it...';
  }, [avatarState, botMessage, currentWorkflowMessage, isGenerating, isProcessing, isSearching, isWorkflowActive, latestExecutionHistoryEvent, liveExecutionRunning, stalledExecution, wsConnectionState.status]);

  const unifiedExecutionSteps = useMemo(() => {
    const items: Array<{ id: string; status: 'loading' | 'complete' | 'error'; title: string; details?: string; timestamp?: string }> = [];

    if (Array.isArray(stepProgress) && stepProgress.length > 0) {
      for (const s of stepProgress.slice(-12)) {
        const rawStatus = String((s as any)?.status || '').toLowerCase();
        const status = rawStatus === 'failed' ? 'error' : (rawStatus === 'completed' ? 'complete' : 'loading');
        const title = String((s as any)?.description || '').trim() || `Step ${(s as any)?.step_number || ''}`;
        const tool = String((s as any)?.tool_name || '').trim();
        items.push({
          id: String((s as any)?.id || `step-${(s as any)?.step_number || items.length}`),
          status,
          title,
          details: tool ? tool : undefined,
          timestamp: String((s as any)?.timestamp || '')
        });
      }
    } else if (Array.isArray(automationWsLogs) && automationWsLogs.length > 0) {
      const seenTitles = new Set<string>();
      for (const l of automationWsLogs.slice(-50)) {
        const title = String(l.message || '').trim();
        if (!title || seenTitles.has(title)) continue;
        seenTitles.add(title);
        const t = l.type === 'error' ? 'error' : (l.type === 'success' ? 'complete' : 'loading');
        items.push({
          id: `auto-${l.timestamp}-${items.length}`,
          status: t,
          title,
          timestamp: l.timestamp
        });
      }
    }

    return items.slice(-8);
  }, [automationWsLogs, stepProgress]);

  const progressiveToolCards = useProgressiveToolCards(agentThoughts, stepProgress);

  const unifiedVisitedUrls = useUnifiedVisitedUrls(accessedWebsites, stepProgress, progressiveToolCards, agentThoughts, automationWsLogs, automationStreamUrl);

  const combinedStepsList = useMemo(() => {
    if (unifiedExecutionSteps.length > 0) return unifiedExecutionSteps;
    if (liveExecution.tasks.length > 0) {
      return liveExecution.tasks.map((t, i) => ({
        id: t.id || `le-${i}`,
        status: (t.status === 'completed' ? 'complete' : t.status === 'failed' ? 'error' : 'loading') as 'loading' | 'complete' | 'error',
        title: t.description || `Step ${i + 1}`,
        details: undefined as string | undefined,
        timestamp: undefined as string | undefined
      }));
    }
    return [];
  }, [unifiedExecutionSteps, liveExecution.tasks]);

  useEffect(() => {
    progressiveToolCardsRef.current = progressiveToolCards;
  }, [progressiveToolCards]);

  useEffect(() => {
    const id = currentChat?.id;
    if (!id) return;
    if (isGenerating) {
      chatStatusRegistry.setStatus(id, 'streaming', 'Streaming');
    } else if (isProcessing) {
      chatStatusRegistry.setStatus(id, 'thinking', 'Thinking');
    } else {
      chatStatusRegistry.clearStatus(id);
    }
    return () => {
      chatStatusRegistry.clearStatus(id);
    };
  }, [currentChat?.id, isProcessing, isGenerating]);

  useEffect(() => {
    combinedStepsListRef.current = combinedStepsList;
  }, [combinedStepsList]);

  useEffect(() => {
    unifiedVisitedUrlsRef.current = unifiedVisitedUrls;
  }, [unifiedVisitedUrls]);

  useEffect(() => {
    liveExecutionRef.current = liveExecution;
  }, [liveExecution]);

  useEffect(() => {
    activeWorkflowTaskIdRef.current = activeWorkflowTaskId;
  }, [activeWorkflowTaskId]);

  useEffect(() => {
    workflowCompletedRef.current = workflowCompleted;
  }, [workflowCompleted]);

  useEffect(() => {
    seenWorkflowEventsRef.current.clear();
    lastWorkflowEventSeqByTaskRef.current.clear();
    setVisibleMessageCount(50);
  }, [currentChat?.id]);

  useEffect(() => {
    const chatId = currentChat?.id;
    if (!chatId) {
      setStalledExecution(prev => prev.isStalled ? { isStalled: false, message: '', since: null } : prev);
      return;
    }

    const workflowDone = !!(activeWorkflowTaskId && workflowCompleted[activeWorkflowTaskId]);
    if (!isWorkflowActive || workflowDone) {
      setStalledExecution(prev => prev.isStalled ? { isStalled: false, message: '', since: null } : prev);
      return;
    }

    const timer = window.setInterval(() => {
      if (currentChatRef.current?.id !== chatId) {
        return;
      }
      const now = Date.now();
      const lastActivity = lastWorkflowActivityAtRef.current || now;
      const idleMs = now - lastActivity;
      const wsHealthy = websocketStateManager.isHealthy(chatId);
      const thresholdMs = wsConnectionState.status === 'connected' ? 30000 : 45000;

      if (idleMs >= thresholdMs) {
        const message = wsHealthy
          ? 'Still processing your workflow...'
          : 'Connection unstable, syncing workflow state...';
        setStalledExecution(prev => {
          if (prev.isStalled && prev.message === message) {
            return prev;
          }
          return {
            isStalled: true,
            message,
            since: prev.since ?? lastActivity
          };
        });
        if (!wsHealthy) {
          startHttpFallbackPolling(chatId);
        }
      } else {
        setStalledExecution(prev => prev.isStalled ? { isStalled: false, message: '', since: null } : prev);
      }
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeWorkflowTaskId, currentChat?.id, isWorkflowActive, startHttpFallbackPolling, workflowCompleted, wsConnectionState.status]);

  useEffect(() => {
    const snapshotTaskId = activeWorkflowTaskIdRef.current || lastTaskIdRef.current;
    const isCompleted = !!(snapshotTaskId && workflowCompletedRef.current[String(snapshotTaskId)]);
    const snapshot = resolveExecutionSnapshot(snapshotTaskId, isCompleted);
    rememberExecutionSnapshot(snapshotTaskId, snapshot);
  }, [progressiveToolCards, combinedStepsList, unifiedVisitedUrls, liveExecution.currentThought, activeWorkflowTaskId, workflowCompleted]);

  const [elapsedTimeTick, setElapsedTimeTick] = useState(0);
  useEffect(() => {
    if (!liveExecution.executionStartTime) return;
    const interval = setInterval(() => {
      setElapsedTimeTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [liveExecution.executionStartTime]);

  useEffect(() => {
    if (!liveExecution.executionStartTime) {
      setElapsedSeconds(0);
      return;
    }
    setElapsedSeconds(Math.floor((Date.now() - liveExecution.executionStartTime) / 1000));
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - liveExecution.executionStartTime!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [liveExecution.executionStartTime]);

  useEffect(() => {
    if (activeWorkflowTaskId && workflowCompleted[activeWorkflowTaskId] && liveExecution.isActive) {
      setLiveExecution(prev => ({
        ...prev,
        isActive: false
      }));
    }
  }, [activeWorkflowTaskId, liveExecution.isActive, workflowCompleted]);

  useEffect(() => {
    const handleOpenAgentModal = () => setShowAgentModal(true);
    window.addEventListener('open-agent-selection-modal', handleOpenAgentModal);
    try {
      if (sessionStorage.getItem('open_agent_modal') === '1') {
        sessionStorage.removeItem('open_agent_modal');
        setShowAgentModal(true);
      }
    } catch {}
    return () => window.removeEventListener('open-agent-selection-modal', handleOpenAgentModal);
  }, []);

  useEffect(() => {
    const resolvedSessionId = (typeof automationSessionId === 'string' && automationSessionId)
      ? automationSessionId
      : (activeWorkflowTaskId ? `session_${activeWorkflowTaskId}` : null);

    if (!resolvedSessionId) {
      setAutomationStreamScreenshot('');
      setAutomationStreamScreenshotMime('image/png');
      setAutomationStreamUrl('');
      setAutomationWsLogs([]);
      setAutomationStructuredData(null);
      lastAutomationResolvedSessionIdRef.current = null;
      if (automationWsReconnectTimerRef.current) {
        try { window.clearTimeout(automationWsReconnectTimerRef.current); } catch {}
        automationWsReconnectTimerRef.current = null;
      }
      if (webAutomationWsRef.current) {
        try { webAutomationWsRef.current.close(); } catch {}
        webAutomationWsRef.current = null;
      }
      return;
    }

    setAutomationSessionId((prev) => (prev === resolvedSessionId ? prev : resolvedSessionId));
    const shouldReset = lastAutomationResolvedSessionIdRef.current !== resolvedSessionId;
    lastAutomationResolvedSessionIdRef.current = resolvedSessionId;
    if (shouldReset) {
      setAutomationStreamScreenshot('');
      setAutomationStreamScreenshotMime('image/png');
      setAutomationStreamUrl('');
      setAutomationWsLogs([]);
      setAutomationStructuredData(null);
    }
    if (automationWsReconnectTimerRef.current) {
      try { window.clearTimeout(automationWsReconnectTimerRef.current); } catch {}
      automationWsReconnectTimerRef.current = null;
    }
    
    if (webAutomationWsRef.current) {
      try { webAutomationWsRef.current.close(); } catch {}
      webAutomationWsRef.current = null;
    }

    let wsUrl = '';
    try {
      const base = new URL((import.meta as any).env?.VITE_BACKEND_URL || window.location.origin);
      const wsProto = base.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProto}//${base.host}/api/web-automation/ws/automation/${resolvedSessionId}`;
    } catch {
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProto}//${window.location.host}/api/web-automation/ws/automation/${resolvedSessionId}`;
    }

    const ws = new WebSocket(wsUrl);
    webAutomationWsRef.current = ws;
    lastAutomationFrameAtRef.current = Date.now();
    lastAutomationRecoveryAtRef.current = 0;

    const heartbeat = window.setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ type: 'ping' })); } catch {}
      }
    }, 15000);

    ws.onopen = () => {
      try { ws.send(JSON.stringify({ type: 'get_status' })); } catch {}
      window.setTimeout(() => {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            lastAutomationFrameAtRef.current = Date.now();
            ws.send(JSON.stringify({ type: 'start_stream', intervalMs: 2000 }));
          }
        } catch {}
      }, 250);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong' || data.type === 'ping') {
          return;
        }
        if (data.type === 'screenshot_update' && data.screenshot) {
          lastAutomationFrameAtRef.current = Date.now();
          setAutomationStreamScreenshot(data.screenshot);
          if (typeof data.mime === 'string' && data.mime) {
            setAutomationStreamScreenshotMime(data.mime);
          }
          if (data.url) {
            setAutomationStreamUrl(data.url);
          }
        } else if (data.type === 'automation_session_selected') {
          const sid = typeof data.sessionId === 'string' ? data.sessionId : '';
          if (sid) {
            setAutomationSessionId((prev) => (prev === sid ? prev : sid));
            setAutomationActive(true);
            setAutomationWsLogs((prev) => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'info', message: `Switched to automation session: ${sid}` }]);
          }
        } else if (data.type === 'browser_initialized') {
          if (typeof data.message === 'string' && data.message) {
            setAutomationWsLogs((prev) => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: data.success ? 'success' : 'warning', message: data.message }]);
          }
        } else if (data.type === 'connection_established') {
          setAutomationWsLogs((prev) => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Web automation stream connected' }]);
        } else if (data.type === 'automation_session_started') {
          if (typeof data.headless === 'boolean') {
            setBrowserHeadlessMode(data.headless);
          }
          if (typeof data.visible === 'boolean') {
            setBrowserHeadlessMode(!data.visible);
          }
          const shouldFallback = (typeof data.headless === 'boolean' && data.headless) || (typeof data.visible === 'boolean' && !data.visible);
          if (shouldFallback) {
            triggerHeadlessFallback(typeof data.message === 'string' && data.message ? data.message : undefined);
          }
          if (typeof data.message === 'string' && data.message) {
            setAutomationWsLogs((prev) => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'info', message: data.message }]);
          }
        } else if (data.type === 'display_limitation') {
          if (typeof data.visible === 'boolean') {
            setBrowserHeadlessMode(!data.visible);
          }
          if (typeof data.headless === 'boolean') {
            setBrowserHeadlessMode(data.headless);
          }
          const shouldFallback = (typeof data.headless === 'boolean' && data.headless) || (typeof data.visible === 'boolean' && !data.visible);
          if (shouldFallback) {
            triggerHeadlessFallback(typeof data.message === 'string' && data.message ? data.message : undefined);
          }
          if (typeof data.message === 'string' && data.message) {
            setAutomationWsLogs((prev) => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'warning', message: data.message }]);
          }
        } else if (data.type === 'status_update') {
          if (typeof data.url === 'string' && data.url) {
            setAutomationStreamUrl(data.url);
          }
          if (typeof data.visible === 'boolean') {
            setBrowserHeadlessMode(!data.visible);
          } else if (typeof data.headless === 'boolean') {
            setBrowserHeadlessMode(data.headless);
          }
          const statusMsg = data.message || (typeof data.url === 'string' && data.url ? `Navigated: ${data.url}` : null);
          if (typeof statusMsg === 'string' && statusMsg) {
            setAutomationWsLogs((prev) => {
              const isStreamMsg = statusMsg.startsWith('Stream active:');
              const isSessionMsg = statusMsg.startsWith('Session status:');
              if (isStreamMsg || isSessionMsg) {
                const existingIdx = prev.findIndex(e => isStreamMsg ? e.message.startsWith('Stream active:') : e.message.startsWith('Session status:'));
                if (existingIdx >= 0) {
                  const updated = [...prev];
                  updated[existingIdx] = { ...updated[existingIdx], timestamp: new Date().toLocaleTimeString(), message: statusMsg };
                  return updated;
                }
              }
              return [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'info' as const, message: statusMsg }];
            });
          }
        } else if (data.type === 'stream_status') {
          const msg = typeof data.streaming === 'boolean' ? (data.streaming ? 'Browser stream started' : 'Browser stream stopped') : 'Browser stream status updated';
          setAutomationWsLogs((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.message === msg) return prev;
            return [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'info' as const, message: msg }];
          });
          if (data.streaming === false && automationActive) {
            triggerHeadlessFallback();
          }
        } else if (data.type === 'session_update') {
          const session = data.session;
          if (session && typeof session.url === 'string' && session.url) {
            setAutomationStreamUrl(session.url);
          }
          if (session && typeof session.status === 'string') {
            const msg = `Session status: ${session.status}`;
            setAutomationWsLogs((prev) => {
              const existingIdx = prev.findIndex(e => e.message.startsWith('Session status:'));
              if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = { ...updated[existingIdx], timestamp: new Date().toLocaleTimeString(), message: msg };
                return updated;
              }
              return [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'info' as const, message: msg }];
            });
          }
        } else if (data.type === 'action_started' || data.type === 'action_completed') {
          const msg = data.message || data.actionType || data.action || data.type;
          if (msg) {
            setBrowserCurrentAction((prev) => (typeof msg === 'string' ? msg : prev));
          }
          if (typeof msg === 'string' && msg) {
            setAutomationWsLogs((prev) => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: data.type === 'action_completed' ? 'success' : 'info', message: msg }]);
          }
          if (data.screenshot) {
            lastAutomationFrameAtRef.current = Date.now();
            setAutomationStreamScreenshot(data.screenshot);
            if (typeof data.mime === 'string' && data.mime) {
              setAutomationStreamScreenshotMime(data.mime);
            }
          }
          if (data.url) {
            setAutomationStreamUrl(data.url);
          }
        }
      } catch {}
    };

    ws.onclose = () => {
      try { window.clearInterval(heartbeat); } catch {}
      if (webAutomationWsRef.current === ws) {
        webAutomationWsRef.current = null;
      }
      if (automationActive && resolvedSessionId) {
        if (!automationWsReconnectTimerRef.current) {
          automationWsReconnectTimerRef.current = window.setTimeout(() => {
            automationWsReconnectTimerRef.current = null;
            setAutomationWsReconnectTick((t) => t + 1);
          }, 5000);
        }
      }
    };

    return () => {
      try { window.clearInterval(heartbeat); } catch {}
      if (automationWsReconnectTimerRef.current) {
        try { window.clearTimeout(automationWsReconnectTimerRef.current); } catch {}
        automationWsReconnectTimerRef.current = null;
      }
      if (webAutomationWsRef.current === ws) {
        try { ws.close(); } catch {}
        webAutomationWsRef.current = null;
      }
    };
  }, [activeWorkflowTaskId, automationSessionId, automationActive, automationWsReconnectTick, triggerHeadlessFallback]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const ws = webAutomationWsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      if (!automationActive) return;
      const lastFrameAt = lastAutomationFrameAtRef.current;
      if (!lastFrameAt) return;
      if (headlessWorkflowActive || browserHeadlessMode) return;
      const now = Date.now();
      if (now - lastFrameAt >= 20000) {
        triggerHeadlessFallback();
        return;
      }
      if (now - lastFrameAt < 10000) return;
      if (now - lastAutomationRecoveryAtRef.current < 5000) return;
      lastAutomationRecoveryAtRef.current = now;
      try { ws.send(JSON.stringify({ type: 'start_stream', intervalMs: 1000 })); } catch {}
      try { ws.send(JSON.stringify({ type: 'request_screenshot' })); } catch {}
    }, 2000);
    return () => {
      try { window.clearInterval(interval); } catch {}
    };
  }, [automationActive, automationSessionId, activeWorkflowTaskId, headlessWorkflowActive, browserHeadlessMode, triggerHeadlessFallback]);

  useEffect(() => {
    currentChatRef.current = currentChat;
    workflowStateRef.current = {
      showKariosBrowser,
      activeWorkflowTaskId,
      automationActive,
      multiAgentWorkflows,
      kariosBrowserTask,
      pendingAutomationTask,
      stepProgress,
      agentThoughts,
      liveExecution,
      workflowCompleted,
      messageInput: message,
      uploadedImages
    };
    
    if (currentChat?.id && activeWorkflowTaskId && Object.keys(multiAgentWorkflows).length > 0) {
      workflowStateSyncService.saveWorkflowState(currentChat.id, {
        chatId: currentChat.id,
        taskId: activeWorkflowTaskId,
        status: automationActive ? 'active' : 'paused',
        workflows: multiAgentWorkflows,
        showBrowser: showKariosBrowser,
        browserTask: kariosBrowserTask,
        automationActive,
        pendingTask: pendingAutomationTask,
        stepProgress,
        agentThoughts,
        liveExecution,
        workflowCompleted,
        executionSnapshotsByTask: executionSnapshotsByTaskRef.current,
        latestExecutionSnapshot: latestExecutionSnapshotRef.current,
        lastWorkflowEventSeqByTask: Object.fromEntries(lastWorkflowEventSeqByTaskRef.current),
        lastUpdate: Date.now()
      });
      
      unifiedWorkflowService.saveState(currentChat.id, {
        chatId: currentChat.id,
        taskId: activeWorkflowTaskId,
        status: automationActive ? 'active' : 'paused',
        workflows: multiAgentWorkflows,
        showBrowser: showKariosBrowser,
        browserTask: kariosBrowserTask,
        automationActive,
        pendingTask: pendingAutomationTask,
        messageInput: message,
        uploadedImages
      });
    }
  }, [currentChat, showKariosBrowser, activeWorkflowTaskId, automationActive, multiAgentWorkflows, kariosBrowserTask, pendingAutomationTask, stepProgress, agentThoughts, liveExecution, workflowCompleted, message, uploadedImages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
      scrollChatToBottom(false);
    }, 50);
    
    if (currentChat?.messages) {
      const lastMessageId = currentChat.messages[currentChat.messages.length - 1]?.id;
      currentChat.messages.forEach((msg: Message) => {
        if (msg.role === 'assistant' && msg.content) {
          const artifacts = getArtifactsForMessage(msg.id);
          if (artifacts.length === 0) {
            const created = detectAndCreateArtifact(msg.content, msg.role, msg.id);
            if (created && msg.id === lastMessageId) {
              setActiveSidePanelArtifact(null);
              expandArtifact(created.id);
            }
          }
        }
      });
    }
    
    return () => clearTimeout(timer);
  }, [currentChat?.messages, scrollChatToBottom, detectAndCreateArtifact, getArtifactsForMessage, expandArtifact]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentChat?.id || !currentChat?.messages?.length) return;
      const lastMsg = currentChat.messages[currentChat.messages.length - 1];
      if (lastMsg.role !== 'assistant' || lastMsg.content.startsWith('[')) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat/${currentChat.id}/suggestions`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.debug('Failed to fetch suggestions:', err);
      }
    };
    fetchSuggestions();
  }, [currentChat?.messages?.length, currentChat?.id]);

  useEffect(() => {
    if (!activeWorkflowTaskId) return;

    const reconciliationInterval = setInterval(() => {
      const stats = workflowMessageQueue.getStats(activeWorkflowTaskId);

      if (stats.unrendered > 0) {
        setWorkflowUpdateCounter(prev => prev + 1);
      }
    }, 10000);

    return () => clearInterval(reconciliationInterval);
  }, [activeWorkflowTaskId]);

  useEffect(() => {
  }, [multiAgentWorkflows]);



  // Multi-agent WebSocket connection effect with reconnection handling
  useEffect(() => {
    if (currentChat?.id) {
      const previousChatId = currentChatRef.current?.id;
      const canTransition = chatIsolationService.startTransition(previousChatId || null, currentChat.id);
      
      if (!canTransition) {
        return;
      }
      
      unifiedWorkflowService.startTransition(previousChatId || null, currentChat.id);

      let transitionReleased = false;
      const releaseTransitions = () => {
        if (transitionReleased) {
          return;
        }
        transitionReleased = true;
        chatIsolationService.endTransition();
        unifiedWorkflowService.endTransition();
      };
      
      artifactManager.handleChatSwitch(previousChatId || null, currentChat.id);
      
      const hasActiveWorkflow = activeWorkflowTaskId && Object.keys(multiAgentWorkflows).length > 0;
      
      if (previousChatId && previousChatId !== currentChat.id && hasActiveWorkflow) {
        const frozenState = {
          workflows: { ...multiAgentWorkflows },
          activeTaskId: activeWorkflowTaskId,
          showBrowser: showKariosBrowser,
          browserTask: kariosBrowserTask,
          automationActive: automationActive,
          pendingTask: pendingAutomationTask,
          messageInput: message,
          uploadedImages: [...uploadedImages],
          stepProgress: [...stepProgress],
          agentThoughts: [...agentThoughts],
          liveExecution: { ...liveExecution },
          workflowCompleted: { ...workflowCompleted },
          executionSnapshotsByTask: { ...executionSnapshotsByTaskRef.current },
          latestExecutionSnapshot: latestExecutionSnapshotRef.current,
          lastWorkflowEventSeqByTask: Object.fromEntries(lastWorkflowEventSeqByTaskRef.current)
        };
        
        setChatWorkflowStates(prev => ({
          ...prev,
          [previousChatId]: frozenState
        }));
        
        if (activeWorkflowTaskId) {
          workflowStateSyncService.saveWorkflowState(previousChatId, {
            chatId: previousChatId,
            taskId: activeWorkflowTaskId,
            status: automationActive ? 'active' : 'paused',
            workflows: multiAgentWorkflows,
            showBrowser: showKariosBrowser,
            browserTask: kariosBrowserTask,
            automationActive,
            pendingTask: pendingAutomationTask,
            stepProgress,
            agentThoughts,
            liveExecution,
            workflowCompleted,
            executionSnapshotsByTask: executionSnapshotsByTaskRef.current,
            latestExecutionSnapshot: latestExecutionSnapshotRef.current,
            lastWorkflowEventSeqByTask: Object.fromEntries(lastWorkflowEventSeqByTaskRef.current),
            lastUpdate: Date.now()
          });
        }
        
        chatIsolationService.snapshotState(previousChatId, frozenState);
      }
      
      const memoryState = chatWorkflowStates[currentChat.id];
      const persistedState = workflowStateSyncService.getWorkflowState(currentChat.id);
      const isolationSnapshot = chatIsolationService.getSnapshot(currentChat.id);
      const savedState = memoryState || isolationSnapshot || persistedState;
      const savedStateTaskId = (savedState as any)?.activeTaskId || (savedState as any)?.taskId;
      
      if (savedState && savedStateTaskId && Object.keys(savedState.workflows || {}).length > 0) {
        const isValidState = chatIsolationService.validateStateIntegrity(currentChat.id, savedState);
        
        if (!isValidState) {
          console.error('Γ¥î CHAT TRANSITION - Invalid state detected, clearing');
          workflowStateSyncService.clearWorkflowState(currentChat.id);
          chatIsolationService.clearSnapshot(currentChat.id);
        } else {
          
          setMultiAgentWorkflows(savedState.workflows || {});
          setActiveWorkflowTaskId(savedStateTaskId || null);
          setShowKariosBrowser(savedState.showBrowser || false);
          setKariosBrowserTask(savedState.browserTask || '');
          setAutomationActive(savedState.automationActive || false);
          setPendingAutomationTask(savedState.pendingTask || null);
          setMessage(savedState.messageInput || '');
          setUploadedImages(savedState.uploadedImages || []);
          setStepProgress(savedState.stepProgress || []);
          setAgentThoughts(savedState.agentThoughts || []);
          setLiveExecution(savedState.liveExecution || {
            isActive: false,
            taskObjective: '',
            thinkingStartTime: null,
            tasks: [],
            agentActions: [],
            currentThought: '',
            confidenceLevel: 'high'
          });
          setWorkflowCompleted(savedState.workflowCompleted || {});
          executionSnapshotsByTaskRef.current = savedState.executionSnapshotsByTask || {};
          latestExecutionSnapshotRef.current = savedState.latestExecutionSnapshot || null;
          lastWorkflowEventSeqByTaskRef.current = new Map(
            Object.entries(savedState.lastWorkflowEventSeqByTask || {})
              .map(([taskId, seq]): [string, number] => [taskId, Number(seq)])
              .filter((entry): entry is [string, number] => Number.isFinite(entry[1]) && entry[1] > 0)
          );
        }
      } else {
        
        setMultiAgentWorkflows({});
        setWorkflowCompleted({});
        executionSnapshotsByTaskRef.current = {};
        latestExecutionSnapshotRef.current = null;
        lastWorkflowEventSeqByTaskRef.current = new Map();
        setActiveWorkflowTaskId(null);
        setShowKariosBrowser(false);
        setKariosBrowserTask('');
        setPendingAutomationTask(null);
        setAutomationActive(false);
        setMessage('');
        setUploadedImages([]);
        setLiveExecution({
          isActive: false,
          taskObjective: '',
          thinkingStartTime: null,
          tasks: [],
          agentActions: [],
          currentThought: '',
          confidenceLevel: 'high',
          executionStartTime: null
        });
        setAgentThoughts([]);
        setStepProgress([]);
        
        workflowStateSyncService.clearWorkflowState(currentChat.id);
        setChatWorkflowStates(prev => {
          const updated = { ...prev };
          delete updated[currentChat.id];
          return updated;
        });
        
        }
      
      setIsProcessing(false);
      setAvatarState('idle');
      setAvatarMessage('');
      setIntentConfirmation(null);
      setSuggestions([]);
      
      const currentWsChat = multiAgentWebSocketService['chatId'];
      if (currentWsChat !== currentChat.id) {
        multiAgentWebSocketService.disconnect();
      }
      
      const isDev = import.meta.env.DEV;
      const recordWorkflowEvent = (data: any, fallbackType: string) => {
        const eventChatId = (data as any)?.chatId || currentChat.id;
        markWorkflowActivity(eventChatId);
        appendExecutionHistoryEvent(eventChatId, {
          ...(data || {}),
          type: (data as any)?.type || fallbackType,
          timestamp: (data as any)?.timestamp || new Date().toISOString(),
        });
      };
      const callbacks = {
        onAgentThinking: (data: any) => {
          recordWorkflowEvent(data, 'agent_thinking');
          const dedupTaskId = resolveWorkflowTaskId(data) || activeWorkflowTaskIdRef.current || lastTaskIdRef.current || undefined;
          if (shouldSkipWorkflowEvent(data, dedupTaskId)) {
            return;
          }
          const eventId = resolveWorkflowEventId(data);
          const eventSeq = resolveWorkflowEventSeq(data);
          setAgentThoughts(prev => {
            const next = [
              ...prev,
              {
                id: eventId || (eventSeq !== undefined ? `${data.timestamp}-${eventSeq}` : `${data.timestamp}-${Math.random()}`),
                agent: data.agent || 'Unknown',
                thought: (data.thought && data.thought !== 'undefined') ? data.thought : '',
                timestamp: data.timestamp,
                metadata: data.metadata,
                task_id: dedupTaskId,
                event_id: eventId || undefined,
                event_seq: eventSeq
              }
            ];
            return next.sort(compareWorkflowEventOrder);
          });
          
          setLiveExecution(prev => ({
            ...prev,
            currentThought: (data.thought && data.thought !== 'undefined') ? data.thought : '',
            agentActions: [
              ...prev.agentActions,
              {
                id: `action-${Date.now()}-${Math.random()}`,
                type: (data.agent?.toLowerCase().includes('search') ? 'search' : 
                      data.agent?.toLowerCase().includes('outline') ? 'outline' :
                      data.agent?.toLowerCase().includes('analyze') ? 'analyze' : 'other') as 'search' | 'outline' | 'analyze' | 'extract' | 'navigate' | 'other',
                description: data.thought || '' as string,
                timestamp: Date.now()
              }
            ].slice(-50)
          }));
        },
        onStepProgress: (data: any) => {
          recordWorkflowEvent(data, 'step_progress');
          const dedupTaskId = resolveWorkflowTaskId(data) || activeWorkflowTaskIdRef.current || lastTaskIdRef.current || undefined;
          if (shouldSkipWorkflowEvent(data, dedupTaskId)) {
            return;
          }
          const eventId = resolveWorkflowEventId(data);
          const eventSeq = resolveWorkflowEventSeq(data);
          setStepProgress(prev => {
            const existing = prev.find(s => s.step_number === data.step_number);
            if (existing) {
              const next = prev.map(s => 
                s.step_number === data.step_number 
                  ? { ...s, status: (data.status as 'starting' | 'running' | 'completed' | 'failed'), timestamp: data.timestamp, metadata: data.metadata, task_id: dedupTaskId, event_id: eventId || undefined, event_seq: eventSeq }
                  : s
              );
              return next.sort(compareWorkflowEventOrder);
            }
            const next = [
              ...prev,
              {
                id: eventId || (eventSeq !== undefined ? `${data.timestamp}-${eventSeq}` : `${data.timestamp}-${data.step_number}`),
                step_number: data.step_number || 0,
                total_steps: data.total_steps || 0,
                description: data.description || '',
                tool_name: data.tool_name || '',
                status: (data.status as 'starting' | 'running' | 'completed' | 'failed') || 'running',
                timestamp: data.timestamp,
                metadata: data.metadata,
                task_id: dedupTaskId,
                event_id: eventId || undefined,
                event_seq: eventSeq
              }
            ];
            return next.sort(compareWorkflowEventOrder);
          });
          
          if (data.status === 'running') {
            setWorkflowState(prev => ({ ...prev, isRunning: true, isPaused: false }));
          }
          
          setLiveExecution(prev => {
            const taskId = `task-${data.step_number}`;
            const existingTask = prev.tasks.find(t => t.id === taskId);
            const newStatus = data.status === 'completed' ? 'completed' : 
                              data.status === 'failed' ? 'failed' : 
                              data.status === 'running' ? 'running' : 'pending';
            
            if (existingTask) {
              return {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
              };
            }
            
            const newTasks = [...prev.tasks];
            for (let i = newTasks.length; i < (data.total_steps || 0); i++) {
              newTasks.push({
                id: `task-${i + 1}`,
                description: i + 1 === data.step_number ? (data.description || `Step ${i + 1}`) : `Step ${i + 1}`,
                status: 'pending'
              });
            }
            
            if (data.step_number && newTasks[data.step_number - 1]) {
              newTasks[data.step_number - 1] = {
                ...newTasks[data.step_number - 1],
                description: data.description || newTasks[data.step_number - 1].description,
                status: newStatus
              };
            }
            
            return { ...prev, tasks: newTasks };
          });
        },
        onAgentLoopState: (data: any) => {
          const phase = data.loop_phase || '';
          if (phase === 'complete') {
            setActiveLoopPhase(null);
          } else {
            setActiveLoopPhase({
              phase,
              step: data.step_number || 0,
              totalSteps: data.total_steps || 0,
              tool: data.tool_name || '',
              description: data.description || ''
            });
          }
        },
        onAgentStatus: (data: MultiAgentWSMessage) => {
          recordWorkflowEvent(data, 'agent_status');
          const dedupTaskId = resolveWorkflowTaskId(data) || lastTaskIdRef.current || activeWorkflowTaskIdRef.current || undefined;
          if (shouldSkipWorkflowEvent(data, dedupTaskId)) {
            return;
          }
          if (import.meta.env.DEV) {
            console.log('≡ƒöÑ RECEIVED:', data.agent_type, data.status, data.task_id?.slice(0, 8));
          }
          
          if (data.type === 'workflow_started') {
            setLiveExecution(prev => ({
              ...prev,
              isActive: true,
              thinkingStartTime: prev.thinkingStartTime || Date.now(),
              executionStartTime: prev.executionStartTime || Date.now(),
              currentThought: data.message || 'Workflow started...',
              confidenceLevel: (data as any).confidence_level || prev.confidenceLevel
            }));
          }
          
          if (data.type === 'workflow_completed') {
            setLiveExecution(prev => {
              if (data.task_id && prev.executionStartTime) {
                setExecutionSummaryByTask(s => ({
                  ...s,
                  [data.task_id!]: {
                    durationMs: Date.now() - prev.executionStartTime!,
                    stepsCompleted: prev.tasks.filter(t => t.status === 'completed').length,
                    urlsVisited: unifiedVisitedUrlsRef.current?.length || 0,
                  }
                }));
              }
              return {
                ...prev,
                isActive: false,
                executionStartTime: null,
                tasks: prev.tasks.map(t => ({ ...t, status: 'completed' as const })),
                currentThought: 'Workflow completed successfully'
              };
            });
            if (data.task_id) {
              setWorkflowCompleted(prev => ({ ...prev, [data.task_id!]: true }));
            }
            setActiveLoopPhase(null);
            setStreamingFormatterOutput(null);
          }

          if (data.type === 'workflow_failed') {
            const rawError = (data as any).error || '';
            const friendlyError = rawError.toLowerCase().includes('attributeerror')
              ? 'The agent encountered an unexpected issue.'
              : rawError.toLowerCase().includes('timeout')
              ? 'The task timed out. Please try again.'
              : rawError.toLowerCase().includes('rate')
              ? 'Rate limit reached. Please retry in a moment.'
              : rawError || 'The task could not be completed. Please try again.';
            setLiveExecution(prev => ({
              ...prev,
              isActive: false,
              tasks: prev.tasks.map(t => t.status === 'running' ? { ...t, status: 'failed' as const } : t),
              currentThought: friendlyError
            }));
            if (data.task_id) {
              setWorkflowCompleted(prev => ({ ...prev, [data.task_id!]: true }));
              setTaskExecutionError({ taskId: data.task_id!, message: friendlyError });
            }
            setActiveLoopPhase(null);
          }
          
          if (data.type === 'plan_ready' && data.data?.plan) {
            const incomingTaskId = data.task_id;
            if (incomingTaskId) {
              setMultiAgentWorkflows(prev => {
                const existing = prev[incomingTaskId] || {};
                return {
                  ...prev,
                  [incomingTaskId]: {
                    ...existing,
                    planSteps: Array.isArray(data.data.plan) ? data.data.plan : (existing as any).planSteps || [],
                    taskObjective: data.data.objective || (existing as any).taskObjective || 'Task execution'
                  }
                };
              });
              
              const planSteps = Array.isArray(data.data.plan) ? data.data.plan : [];
              if (planSteps.length > 0) {
                setLiveExecution(prev => ({
                  ...prev,
                  isActive: true,
                  taskObjective: data.data.objective || prev.taskObjective,
                  thinkingStartTime: prev.thinkingStartTime || Date.now(),
                  tasks: planSteps.map((step: any, index: number) => ({
                    id: `task-${index + 1}`,
                    description: step.description || step.action || `Step ${index + 1}`,
                    status: index === 0 ? 'running' as const : 'pending' as const
                  }))
                }));
              }
            } else {
              if (data.task_id && Array.isArray(data.data.plan)) {
                handlePlanApprove(data.data.plan);
              }
            }
          }
          
          if (data.type === 'approval_required' && data.data) {
            const approvalId = data.data.approval_id;
            const approvalTool = data.data.tool || data.data.tool_name || '';
            const approvalAction = data.data.action || '';
            const approvalRisk: 'low' | 'medium' | 'high' = data.data.risk_level || 'medium';
            const approvalPolicy = data.data.policy || undefined;
            const approvalReason: string = data.data.reason || '';
            const approvalUrl: string | undefined = data.data.url || data.data.parameters?.url || data.data.parameters?.original_url || undefined;
            setPendingApprovals(prev => {
              if (prev.some(a => a.id === approvalId)) return prev;
              return [...prev, {
                id: approvalId,
                action: approvalAction,
                tool: approvalTool,
                parameters: data.data.parameters,
                riskLevel: approvalRisk,
                policy: approvalPolicy,
                reason: approvalReason,
                url: approvalUrl,
                taskId: data.task_id || data.data.task_id,
              }];
            });
          }

          if (data.type === 'approval_received') {
            const resolvedId = (data as any).approval_id || (data.data && data.data.approval_id);
            if (resolvedId) {
              setPendingApprovals(prev => prev.filter(a => a.id !== resolvedId));
            }
          }
          
          if (data.type === 'quality_metrics' && data.data && data.task_id) {
            setQualityMetrics(prev => ({
              ...prev,
              [data.task_id!]: data.data
            }));
          }
          
          if (data.type === 'context_update' && data.data) {
            setContextWindow({
              items: data.data.items || [],
              totalTokens: data.data.total_tokens || 0,
              maxTokens: data.data.max_tokens || 100000
            });
          }
          
          if (data.type === 'parallel_steps' && data.data) {
            setParallelSteps(data.data.groups || []);
          }
          
          if (data.task_id) {
            const taskId = data.task_id;
            lastTaskIdRef.current = taskId;
            setActiveWorkflowTaskId(prev => prev === taskId ? prev : taskId);
            
            workflowMessageQueue.addMessage(taskId, data);

            if (data.agent_type === 'PLANNER' && data.status === 'completed') {
              console.log('≡ƒÄ» PLANNER COMPLETED - Full data:', JSON.stringify(data.data, null, 2));
              console.log('≡ƒÄ» Execution plan path check:', {
                hasData: !!data.data,
                hasExecutionPlan: !!data.data?.execution_plan,
                hasExecutionSteps: !!data.data?.execution_plan?.execution_steps,
                executionSteps: data.data?.execution_plan?.execution_steps
              });
              
              const steps = data.data?.execution_plan?.execution_steps;
              if (steps && Array.isArray(steps)) {
                console.log('Γ£à PLANNER - Setting planSteps:', steps);
                setMultiAgentWorkflows(prev => {
                  const existing = prev[taskId] || {};
                  console.log('≡ƒöì Previous workflow state:', existing);
                  const updated = {
                    ...prev,
                    [taskId]: {
                      ...existing,
                      planSteps: steps
                    }
                  };
                  console.log('≡ƒöì Updated workflow state:', updated[taskId]);
                  return updated;
                });
              } else {
                console.warn('ΓÜá∩╕Å PLANNER completed but no valid execution_steps found');
              }
            }

            if (agentStatusImmediateModeRef.current) {
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
                const incomingEventId = resolveWorkflowEventId(data);
                const incomingEventSeq = resolveWorkflowEventSeq(data);
                
                const isDuplicate = existingUpdates.some((update: any) => {
                  const existingEventId = resolveWorkflowEventId(update);
                  if (incomingEventId && existingEventId) {
                    return existingEventId === incomingEventId;
                  }
                  const existingEventSeq = resolveWorkflowEventSeq(update);
                  if (incomingEventSeq !== undefined && existingEventSeq !== undefined) {
                    return existingEventSeq === incomingEventSeq;
                  }
                  return (
                    update.agent_type === data.agent_type && 
                    update.status === data.status && 
                    update.timestamp === data.timestamp
                  );
                });
                
                if (isDuplicate) {
                  return prev;
                }
                
                const newUpdate = {
                  type: data.type || 'agent_status',
                  agent_type: data.agent_type,
                  status: data.status,
                  message: data.message,
                  timestamp: data.timestamp,
                  event_id: incomingEventId || undefined,
                  event_seq: incomingEventSeq,
                  data: data.data
                };
                
                if (data.agent_type === 'TASK_EXECUTOR' && data.data) {
                  if (data.data.headless !== undefined) {
                    setBrowserHeadlessMode(prev => prev === data.data.headless ? prev : data.data.headless);
                  }
                  if (data.data.current_action || data.message) {
                    const action = data.data.current_action || data.message || '';
                    setBrowserCurrentAction(prev => prev === action ? prev : action);
                  }
                }
                
                window.dispatchEvent(new CustomEvent('workflow:update', {
                  detail: {
                    stage: newWorkflowStage,
                    agent_type: data.agent_type,
                    status: data.status,
                    message: data.message,
                    task_id: backendTaskId
                  }
                }));
                
                setWorkflowUpdateCounter(prev => prev + 1);
                
                let planSteps = currentWorkflow.planSteps || [];
                let executionItems = currentWorkflow.executionItems || [];
                
                if (data.agent_type === 'PLANNER' && data.status === 'completed' && data.data?.execution_plan?.execution_steps) {
                  planSteps = data.data.execution_plan.execution_steps;
                }
                
                if (data.agent_type === 'TASK_EXECUTOR' && (data.status === 'started' || data.status === 'processing' || data.status === 'completed')) {
                  executionItems = [...executionItems, newUpdate].sort(compareWorkflowEventOrder);
                }
                
                return {
                  ...prev,
                  [backendTaskId]: {
                    ...currentWorkflow,
                    taskId: backendTaskId,
                    workflowStage: newWorkflowStage,
                    lastUpdate: data.timestamp || new Date().toISOString(),
                    currentStep: data.data?.step_id,
                    stepProgress: data.data?.progress,
                    planSteps,
                    executionItems,
                    agentUpdates: [...existingUpdates, newUpdate].sort(compareWorkflowEventOrder)
                  }
                };
              });
              
              if (data.agent_type === 'FORMATTER' && data.status === 'completed') {
                setWorkflowCompleted(prev => ({ ...prev, [data.task_id!]: true }));
                setStreamingFormatterOutput(null);
              }

              return;
            }

            pendingAgentStatusRef.current.push(data);

            if (data.status === 'completed' || data.status === 'failed') {
              flushAgentStatusUpdates();
            } else {
              throttledFlushAgentStatusUpdates();
            }
          }
        },

        onFormatterTokenStream: (data: any) => {
          const token = data?.data?.token || '';
          const tokenTaskId = data?.data?.task_id || '';
          if (token) {
            formatterTokenCounterRef.current += 1;
            setStreamingFormatterOutput(prev => {
              if (!prev || prev.taskId !== tokenTaskId) {
                return { taskId: tokenTaskId, text: token };
              }
              return { ...prev, text: prev.text + token };
            });
          }
        },

        onClarificationRequest: (data: MultiAgentWSMessage) => {
          recordWorkflowEvent(data, 'clarification_request');
          const dedupTaskId = resolveWorkflowTaskId(data) || data.task_id || lastTaskIdRef.current || 'default';
          if (shouldSkipWorkflowEvent(data, dedupTaskId)) {
            return;
          }
          const taskId = dedupTaskId;
          
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
          recordWorkflowEvent(data, 'workflow_started');
          const dedupTaskId = resolveWorkflowTaskId(data) || data.task_id;
          const workflowStartedDedupTaskId = dedupTaskId ? `${dedupTaskId}::workflow_started` : 'global::workflow_started';
          if (shouldSkipWorkflowEvent(data, workflowStartedDedupTaskId)) {
            return;
          }
          if (dedupTaskId) {
            lastTaskIdRef.current = dedupTaskId;
            setActiveWorkflowTaskId(dedupTaskId);
            setWorkflowUpdateCounter(prev => prev + 1);
            
            setMultiAgentWorkflows(prev => {
              const existingWorkflow = prev[dedupTaskId] || {};
              return {
                ...prev,
                [dedupTaskId]: {
                  ...existingWorkflow,
                  taskId: dedupTaskId,
                  workflowStage: data.workflow_stage || 'Initializing',
                  lastUpdate: data.timestamp || new Date().toISOString(),
                  agentUpdates: existingWorkflow.agentUpdates || []
                }
              };
            });
          }
        },
        
        onConnectionEstablished: (data: MultiAgentWSMessage) => {
          recordWorkflowEvent(data, 'connection_established');
          const wasPolling = httpFallbackPollingRef.current.enabled;
          stopHttpFallbackPolling();
          if (wasPolling) {
            void reconcileChatFromApi(data.chatId);
          }
        },
        
        onNewMessage: async (data: MultiAgentWSMessage) => {
          recordWorkflowEvent(data, 'new_message');
          if (data.type === 'gemini_browser_start') {
            const instruction = (data as any).instruction || data.data?.instruction || '';
            if (instruction) {
              setKariosBrowserTask(instruction);
              setShowKariosBrowser(true);
            }
            return;
          }
          
          if (data.type === 'autonomous_task_progress') {
            return;
          }
          
          if (data.type === 'new_message') {
            const msg = (data as any).message || data.data?.message;
            
            if (msg && msg.content) {
              const contentStr = String(msg.content || '').trim();
              const resolvedTaskId = data.task_id || activeWorkflowTaskIdRef.current || lastTaskIdRef.current;
              const resolvedTaskIdStr = resolvedTaskId ? String(resolvedTaskId) : '';
              const hasLiveExecutionContext =
                liveExecutionRef.current?.isActive ||
                progressiveToolCardsRef.current.length > 0 ||
                combinedStepsListRef.current.length > 0;
              const hasCachedExecutionContext =
                !!(resolvedTaskIdStr && executionSnapshotsByTaskRef.current[resolvedTaskIdStr]) ||
                !!latestExecutionSnapshotRef.current;
              const shouldAttachExecutionSnapshot = msg.role === 'assistant' &&
                contentStr.length > 0 &&
                (hasLiveExecutionContext || hasCachedExecutionContext);
              const shouldFinalizeFromAssistantMessage = shouldAttachExecutionSnapshot &&
                !contentStr.startsWith('[') &&
                !!resolvedTaskIdStr &&
                !workflowCompletedRef.current[resolvedTaskIdStr] &&
                hasLiveExecutionContext;
              const existingExecutionSnapshot = extractExecutionSnapshotFromMetadata((msg as any).metadata);
              const executionSnapshot = shouldAttachExecutionSnapshot
                ? (existingExecutionSnapshot || resolveExecutionSnapshot(resolvedTaskIdStr, shouldFinalizeFromAssistantMessage))
                : null;
              const incomingMetadata = shouldAttachExecutionSnapshot
                ? mergeExecutionSnapshotIntoMetadata((msg as any).metadata, executionSnapshot)
                : (msg as any).metadata;

              if (shouldFinalizeFromAssistantMessage && resolvedTaskIdStr && !workflowCompletedRef.current[resolvedTaskIdStr]) {
                setWorkflowCompleted(prev => ({ ...prev, [resolvedTaskIdStr]: true }));
                setLiveExecution(prev => ({
                  ...prev,
                  isActive: false,
                  tasks: prev.tasks.map(t => t.status === 'running' ? { ...t, status: 'completed' as const } : t)
                }));
                setWorkflowState(prev => ({ ...prev, isRunning: false, isPaused: false, canResume: false }));
                setBrowserCurrentAction('');
              }

              if (currentChat?.id === data.chatId) {
                setCurrentChat(prev => {
                  if (!prev) return prev;
                  const incomingId = String(msg.id || '');
                  if (incomingId && prev.messages.some(m => String(m.id) === incomingId)) {
                    return prev;
                  }
                  if (contentStr && prev.messages.some(m => String(m.id).startsWith('task-complete-') && String(m.content || '').trim() === contentStr)) {
                    const existing = prev.messages.find(m => String(m.id).startsWith('task-complete-') && String(m.content || '').trim() === contentStr);
                    if (existing && (incomingId || incomingMetadata !== undefined)) {
                      return {
                        ...prev,
                        messages: prev.messages.map(m => {
                          if (m !== existing) return m;
                          const updated = { ...m } as any;
                          if (incomingId) {
                            updated.id = incomingId;
                          }
                          if (incomingMetadata !== undefined) {
                            updated.metadata = incomingMetadata;
                          }
                          return updated;
                        })
                      };
                    }
                    return prev;
                  }
                  const ts = String(msg.timestamp || new Date().toISOString());
                  const nextMessage = {
                    id: incomingId || `${Date.now()}`,
                    role: msg.role,
                    content: msg.content,
                    timestamp: ts,
                    created_at: ts,
                    chat_id: data.chatId,
                    metadata: incomingMetadata
                  } as any;
                  return {
                    ...prev,
                    messages: [...(prev.messages || []), nextMessage]
                  };
                });
              }
              }
          } else {
            const msg = (data as any).message || data.data?.message;
            if (msg) {
              const contentStr = String(msg.content || '').trim();
              const resolvedTaskId = data.task_id || activeWorkflowTaskIdRef.current || lastTaskIdRef.current;
              const resolvedTaskIdStr = resolvedTaskId ? String(resolvedTaskId) : '';
              const hasLiveExecutionContext =
                liveExecutionRef.current?.isActive ||
                progressiveToolCardsRef.current.length > 0 ||
                combinedStepsListRef.current.length > 0;
              const hasCachedExecutionContext =
                !!(resolvedTaskIdStr && executionSnapshotsByTaskRef.current[resolvedTaskIdStr]) ||
                !!latestExecutionSnapshotRef.current;
              const shouldAttachExecutionSnapshot = msg.role === 'assistant' &&
                contentStr.length > 0 &&
                (hasLiveExecutionContext || hasCachedExecutionContext);
              const shouldFinalizeFromAssistantMessage = shouldAttachExecutionSnapshot &&
                !contentStr.startsWith('[') &&
                !!resolvedTaskIdStr &&
                !workflowCompletedRef.current[resolvedTaskIdStr] &&
                hasLiveExecutionContext;
              const existingExecutionSnapshot = extractExecutionSnapshotFromMetadata((msg as any).metadata);
              const executionSnapshot = shouldAttachExecutionSnapshot
                ? (existingExecutionSnapshot || resolveExecutionSnapshot(resolvedTaskIdStr, shouldFinalizeFromAssistantMessage))
                : null;
              const incomingMetadata = shouldAttachExecutionSnapshot
                ? mergeExecutionSnapshotIntoMetadata((msg as any).metadata, executionSnapshot)
                : (msg as any).metadata;

              if (shouldFinalizeFromAssistantMessage && resolvedTaskIdStr && !workflowCompletedRef.current[resolvedTaskIdStr]) {
                setWorkflowCompleted(prev => ({ ...prev, [resolvedTaskIdStr]: true }));
                setLiveExecution(prev => ({
                  ...prev,
                  isActive: false,
                  tasks: prev.tasks.map(t => t.status === 'running' ? { ...t, status: 'completed' as const } : t)
                }));
                setWorkflowState(prev => ({ ...prev, isRunning: false, isPaused: false, canResume: false }));
                setBrowserCurrentAction('');
              }

              if (currentChat?.id === data.chatId) {
                setCurrentChat(prev => {
                  if (!prev) return prev;
                  const incomingId = String(msg.id || '');
                  if (incomingId && prev.messages.some(m => String(m.id) === incomingId)) {
                    return prev;
                  }
                  const ts = String(msg.timestamp || new Date().toISOString());
                  const nextMessage = {
                    id: incomingId || `${Date.now()}`,
                    role: msg.role,
                    content: msg.content,
                    timestamp: ts,
                    created_at: ts,
                    chat_id: data.chatId,
                    metadata: incomingMetadata
                  } as any;
                  return {
                    ...prev,
                    messages: [...(prev.messages || []), nextMessage]
                  };
                });
              }
            }
          }
        },
        
        onTaskCompleted: async (data: MultiAgentWSMessage) => {
          recordWorkflowEvent(data, 'task_completed');
          const dedupTaskId = resolveWorkflowTaskId(data) || data.task_id || lastTaskIdRef.current || undefined;
          const taskCompletedDedupTaskId = dedupTaskId ? `${dedupTaskId}::task_completed` : 'global::task_completed';
          if (shouldSkipWorkflowEvent(data, taskCompletedDedupTaskId)) {
            return;
          }
          setBrowserCurrentAction('');
          setStreamingFormatterOutput(null);
          
          const taskId = dedupTaskId || lastTaskIdRef.current;
          if (taskId) {
            setWorkflowCompleted(prev => ({ ...prev, [taskId]: true }));
          }
          setWorkflowState(prev => ({ ...prev, isRunning: false, isPaused: false, canResume: false }));
          
          setLiveExecution(prev => ({
            ...prev,
            isActive: false,
            tasks: prev.tasks.map(t => ({ ...t, status: 'completed' as const }))
          }));
          
          window.dispatchEvent(new CustomEvent('workflow:completed', {
            detail: {
              task_id: data.task_id,
              message: 'Task execution completed successfully'
            }
          }));
          const formattedOutput = (data as any).formatted_output;
          const completionGraphics = (data as any).graphics || (data as any).metadata?.graphics;
          const completionSnapshot = resolveExecutionSnapshot(taskId, true);
          const completionMetadataBase = completionGraphics ? { graphics: completionGraphics } : undefined;
          const completionMetadata = mergeExecutionSnapshotIntoMetadata(completionMetadataBase, completionSnapshot);
          if (formattedOutput && typeof formattedOutput === 'string' && formattedOutput.trim().length > 0 && currentChat?.id === data.chatId) {
            const msgId = `task-complete-${taskId || Date.now()}`;
            setCurrentChat(prev => {
              if (!prev) return prev;
              if (prev.messages.some(m => String(m.id) === msgId)) return prev;
              const ts = new Date().toISOString();
              return {
                ...prev,
                messages: [...(prev.messages || []), {
                  id: msgId,
                  role: 'assistant',
                  content: formattedOutput,
                  timestamp: ts,
                  created_at: ts,
                  chat_id: prev.id,
                  metadata: completionMetadata
                } as any]
              };
            });
          } else if (taskId && currentChat?.id) {
            const userMessage = currentChat.messages.find(m => m.role === 'user');
            if (userMessage) {
              const taskMessage = `[TASK_EXECUTION]\n${JSON.stringify({
                id: taskId,
                message: userMessage.content
              })}`;
              await addMessage({ role: 'assistant', content: taskMessage, chatId: currentChat.id });
            }
          }

          if (currentChat?.id === data.chatId) {
            await new Promise(r => setTimeout(r, 2000));
            try {
              const updatedChatResponse = await chatService.getChat(currentChat.id);
              if (updatedChatResponse?.data) {
                const existingIds = new Set<string>();
                setCurrentChat(prev => {
                  if (!prev) return updatedChatResponse.data;
                  const apiMessages = (updatedChatResponse.data.messages || []);
                  const apiById = new Map<string, any>();
                  apiMessages.forEach((m: any) => {
                    apiById.set(String(m.id), m);
                  });
                  let metadataUpdated = false;
                  const mergedExisting = prev.messages.map((m: any) => {
                    const apiMatch = apiById.get(String(m.id));
                    if (!apiMatch) return m;
                    if (m.metadata === undefined && apiMatch.metadata !== undefined) {
                      metadataUpdated = true;
                      return { ...m, metadata: apiMatch.metadata };
                    }
                    return m;
                  });
                  mergedExisting.forEach(m => existingIds.add(String(m.id)));
                  const newFromApi = apiMessages.filter((m: any) => !existingIds.has(String(m.id)));
                  if (!metadataUpdated && newFromApi.length === 0 && prev.messages.length >= apiMessages.length) {
                    return prev;
                  }
                  const merged = [...mergedExisting];
                  newFromApi.forEach((m: any) => merged.push(m));
                  return { ...updatedChatResponse.data, messages: merged };
                });
              }
            } catch (e) {
            }
          }
        },
        
        onApprovalRequired: (data: MultiAgentWSMessage) => {
          if (!data.data) return;
          const approvalId = data.data.approval_id;
          if (!approvalId) return;
          const approvalTool = data.data.tool || data.data.tool_name || '';
          const approvalAction = data.data.action || '';
          const approvalRisk: 'low' | 'medium' | 'high' = data.data.risk_level || 'high';
          const approvalPolicy = data.data.policy || undefined;
          const approvalReason: string = data.data.reason || '';
          const approvalUrl: string | undefined = data.data.url || data.data.parameters?.url || data.data.parameters?.original_url || undefined;
          setPendingApprovals(prev => {
            if (prev.some((a: any) => a.id === approvalId)) return prev;
            return [...prev, {
              id: approvalId,
              action: approvalAction,
              tool: approvalTool,
              parameters: data.data.parameters,
              riskLevel: approvalRisk,
              policy: approvalPolicy,
              reason: approvalReason,
              url: approvalUrl,
              taskId: data.task_id || data.data.task_id,
            }];
          });
        },

        onApprovalReceived: (data: MultiAgentWSMessage) => {
          const resolvedId = (data as any).approval_id || (data.data && data.data.approval_id);
          if (resolvedId) {
            setPendingApprovals(prev => prev.filter((a: any) => a.id !== resolvedId));
          }
        },

        onError: (error: Event) => {
          console.error('WebSocket error:', error);
        },
        
        onClose: (event: CloseEvent) => {
          startHttpFallbackPolling(currentChat.id);
        }
      };
      
      multiAgentWebSocketService.connect(currentChat.id, callbacks);
      
      releaseTransitions();
      globalStateCoordinator.emitEvent({
        type: 'chat:switch',
        chatId: currentChat.id,
        timestamp: Date.now(),
        metadata: {
          previousChatId,
          hadWorkflow: hasActiveWorkflow
        }
      });
      
      return () => {
        stopHttpFallbackPolling();
        releaseTransitions();
        const hasWorkflow = activeWorkflowTaskId && Object.keys(multiAgentWorkflows).length > 0;
        if (!hasWorkflow) {
          multiAgentWebSocketService.disconnectChat(currentChat.id);
        }
      };
    }
  }, [currentChat?.id]);

  // Handle multi-agent task creation events from ChatContext
  useEffect(() => {
    const handleMultiAgentTaskCreated = (event: CustomEvent) => {
      const { chatId, taskId, requiresClarification, clarificationRequest, workflowStage } = event.detail;
      if (currentChat?.id === chatId) {
        lastTaskIdRef.current = taskId;
        setActiveWorkflowTaskId(taskId);
        setAutomationActive(true);
        
        const userMessage = currentChat?.messages?.filter(m => m.role === 'user').pop();
        const taskObjective = userMessage?.content || 'Processing task...';
        
        if (!liveExecution.isActive) {
          setLiveExecution({
            isActive: true,
            taskObjective: taskObjective,
            thinkingStartTime: Date.now(),
            tasks: [
              { id: 'task-1', description: 'Analyzing request...', status: 'running' },
              { id: 'task-2', description: 'Planning execution steps...', status: 'pending' },
              { id: 'task-3', description: 'Executing workflow...', status: 'pending' }
            ],
            agentActions: [],
            currentThought: 'Initializing task execution...',
            confidenceLevel: 'high',
            executionStartTime: Date.now()
          });
        }
        
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

  useEffect(() => {
    const checkCapabilities = async () => {
      const capabilities = await nextLevelAutomationService.getCapabilities();
      setNextLevelCapabilities(capabilities);
    };
    checkCapabilities();
    
    stateIntegrityMonitor.runIntegrityCheck();
    
    const healthInterval = setInterval(() => {
      stateIntegrityMonitor.getReport();
    }, 5 * 60 * 1000);

    if (currentChat?.id) {
      const snapshot = websocketStateManager.getConnectionState(currentChat.id);
      if (snapshot) {
        setWsConnectionState({
          status: snapshot.connected ? 'connected' : 'disconnected',
          timestamp: snapshot.lastHeartbeat || Date.now(),
          attempt: snapshot.reconnectCount,
          maxAttempts: 20
        });
      }
    }

    const handleConnectionStatus = (event: CustomEvent<{ chatId: string; status: 'connected' | 'disconnected' | 'reconnecting'; timestamp: number; attempt?: number; maxAttempts?: number; nextRetryMs?: number }>) => {
      const detail = event.detail || ({} as any);
      const { chatId, status, attempt, maxAttempts, nextRetryMs } = detail;
      if (chatId !== currentChatRef.current?.id) {
        return;
      }

      const ts = Number(detail.timestamp) || Date.now();
      setWsConnectionState({
        status,
        timestamp: ts,
        attempt,
        maxAttempts,
        nextRetryMs
      });

      appendExecutionHistoryEvent(chatId, {
        type: 'ws_connection_status',
        status,
        attempt,
        maxAttempts,
        nextRetryMs,
        timestamp: new Date(ts).toISOString()
      });

      if (status === 'connected') {
        markWorkflowActivity(chatId);
        toast.success('Connection restored', { id: 'ws-status', duration: 2000 });
      } else if (status === 'reconnecting') {
        const activeTaskId = activeWorkflowTaskIdRef.current;
        const hasRunningWorkflow = !!(activeTaskId && !workflowCompletedRef.current[activeTaskId]);
        if (hasRunningWorkflow) {
          toast.error('Connection lost. Reconnecting...', { id: 'ws-status', duration: 3000 });
        }
      } else if (status === 'disconnected') {
        const activeTaskId = activeWorkflowTaskIdRef.current;
        const hasRunningWorkflow = !!(activeTaskId && !workflowCompletedRef.current[activeTaskId]);
        if (hasRunningWorkflow) {
          toast.error('Connection disconnected. Falling back to sync...', { id: 'ws-status', duration: 3000 });
        }
        if (hasRunningWorkflow) {
          startHttpFallbackPolling(chatId);
        }
      }
    };

    window.addEventListener('ws:connection-status', handleConnectionStatus as EventListener);
    
    return () => {
      clearInterval(healthInterval);
      window.removeEventListener('ws:connection-status', handleConnectionStatus as EventListener);
    };
  }, [appendExecutionHistoryEvent, currentChat?.id, markWorkflowActivity, startHttpFallbackPolling]);

  useEffect(() => {
    const handleResetBrowserState = () => {
      const currentState = workflowStateRef.current;
      const chat = currentChatRef.current;
      
      const hasWorkflowData = currentState.activeWorkflowTaskId && 
                              Object.keys(currentState.multiAgentWorkflows).length > 0;
      
      if (chat?.id && hasWorkflowData && (currentState.showKariosBrowser || currentState.automationActive)) {
        
        const frozenState = {
          workflows: { ...currentState.multiAgentWorkflows },
          activeTaskId: currentState.activeWorkflowTaskId,
          showBrowser: currentState.showKariosBrowser,
          browserTask: currentState.kariosBrowserTask,
          automationActive: currentState.automationActive,
          pendingTask: currentState.pendingAutomationTask,
          messageInput: currentState.messageInput,
          uploadedImages: currentState.uploadedImages,
          stepProgress: currentState.stepProgress,
          agentThoughts: currentState.agentThoughts,
          liveExecution: currentState.liveExecution,
          workflowCompleted: currentState.workflowCompleted,
          executionSnapshotsByTask: executionSnapshotsByTaskRef.current,
          latestExecutionSnapshot: latestExecutionSnapshotRef.current,
          lastWorkflowEventSeqByTask: Object.fromEntries(lastWorkflowEventSeqByTaskRef.current)
        };
        
        setChatWorkflowStates(prev => ({
          ...prev,
          [chat.id]: frozenState
        }));
        
        workflowStateSyncService.saveWorkflowState(chat.id, {
          chatId: chat.id,
          taskId: currentState.activeWorkflowTaskId || '',
          status: currentState.automationActive ? 'active' : 'paused',
          workflows: currentState.multiAgentWorkflows,
          showBrowser: currentState.showKariosBrowser,
          browserTask: currentState.kariosBrowserTask,
          automationActive: currentState.automationActive,
          pendingTask: currentState.pendingAutomationTask,
          stepProgress: currentState.stepProgress,
          agentThoughts: currentState.agentThoughts,
          liveExecution: currentState.liveExecution,
          workflowCompleted: currentState.workflowCompleted,
          executionSnapshotsByTask: executionSnapshotsByTaskRef.current,
          latestExecutionSnapshot: latestExecutionSnapshotRef.current,
          lastWorkflowEventSeqByTask: Object.fromEntries(lastWorkflowEventSeqByTaskRef.current),
          lastUpdate: Date.now()
        });
      }
      
      setShowKariosBrowser(false);
      setKariosBrowserTask('');
      setPendingAutomationTask(null);
      setAutomationActive(false);
      setActiveWorkflowTaskId(null);
      setIsProcessing(false);
      setAvatarState('idle');
      setAvatarMessage('');
      setHeadlessWorkflowActive(false);
      setHeadlessPanelOpen(false);
      setHeadlessSwitchMessage('');
      setBrowserHeadlessMode(false);
      setBrowserCurrentAction('');
    };

    const handleKariosBrowserTrigger = (event: CustomEvent) => {
      const { instruction, strategy } = event.detail;
      if (strategy === 'gemini_computer_use' || strategy === 'gemini') {
        setKariosBrowserTask(instruction);
        setShowKariosBrowser(true);
      }
    };

    const handleAutomationShow = (event: CustomEvent) => {
      const detail = event.detail;
      if (detail?.strategy === 'gemini_computer_use' || detail?.use_gemini) {
        setKariosBrowserTask(detail.instruction || detail.task || '');
        setShowKariosBrowser(true);
      }
    };

    window.addEventListener('chat:reset-browser-state', handleResetBrowserState);

    window.addEventListener('gemini:browser:open', handleKariosBrowserTrigger as EventListener);
    window.addEventListener('automation:gemini:start', handleAutomationShow as EventListener);

    return () => {
      window.removeEventListener('chat:reset-browser-state', handleResetBrowserState);
      window.removeEventListener('gemini:browser:open', handleKariosBrowserTrigger as EventListener);
      window.removeEventListener('automation:gemini:start', handleAutomationShow as EventListener);
    };
  }, []);

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

  const buildArtifactMessageSummary = (content: string, artifacts: any[]) => {
    const raw = typeof content === 'string' ? content : '';
    let cleaned = raw;
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/<!DOCTYPE html>[\s\S]*?<\/html>/gi, '');
    cleaned = cleaned.replace(/<html[\s\S]*?<\/html>/gi, '');
    cleaned = cleaned.replace(/<svg[\s\S]*?<\/svg>/gi, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    const maxChars = 600;
    let excerpt = cleaned.length > maxChars ? cleaned.slice(0, maxChars).trimEnd() + '...' : cleaned;
    if (!excerpt) {
      const a = Array.isArray(artifacts) ? artifacts[0] : null;
      const title = a?.metadata?.title ? String(a.metadata.title) : '';
      const desc = a?.metadata?.description ? String(a.metadata.description) : '';
      excerpt = [title, desc].filter(Boolean).join('\n\n');
    }
    return excerpt ? `${excerpt}\n\nOpen the artifact above to view the full output.` : 'Open the artifact above to view the full output.';
  };

  const parseMessageMetadata = (metadata: Message['metadata']): Record<string, any> | null => {
    if (!metadata) return null;
    if (typeof metadata === 'string') {
      try {
        const parsed = JSON.parse(metadata);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, any>;
        }
      } catch {}
      return null;
    }
    if (typeof metadata === 'object' && !Array.isArray(metadata)) {
      return metadata as Record<string, any>;
    }
    return null;
  };

  const normalizeRenderableGraphicPayload = (value: Record<string, any>): Record<string, any> | null => {
    const rawType = String(value?.type || '').toLowerCase();
    const hasChartShape = Boolean(value.config || value.quickchart_url);
    const hasDiagramShape = Boolean(value.code);
    const hasImageShape = Boolean(value.url || value.base64);

    if (rawType === 'chart') {
      if (hasChartShape) {
        return { ...value, type: 'chart' };
      }
      if (hasImageShape) {
        return { ...value, type: 'image' };
      }
      return null;
    }

    if (rawType === 'diagram') {
      if (hasDiagramShape) {
        return { ...value, type: 'diagram' };
      }
      if (hasImageShape) {
        return { ...value, type: 'image' };
      }
      return null;
    }

    if (rawType === 'ai_image' || rawType === 'image') {
      if (hasImageShape) {
        return { ...value, type: rawType };
      }
      return null;
    }

    if (rawType === 'svg' && hasImageShape) {
      return { ...value, type: 'image' };
    }

    if (hasChartShape) {
      return { ...value, type: 'chart' };
    }
    if (hasDiagramShape) {
      return { ...value, type: 'diagram' };
    }
    if (hasImageShape) {
      return { ...value, type: 'image' };
    }
    return null;
  };

  const resolveGraphicPayload = (value: any): Record<string, any> | null => {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return resolveGraphicPayload(parsed);
      } catch {
        return null;
      }
    }

    if (Array.isArray(value)) {
      for (const candidate of value) {
        const resolved = resolveGraphicPayload(candidate);
        if (resolved) {
          return resolved;
        }
      }
      return null;
    }

    if (typeof value === 'object') {
      const payload = value as Record<string, any>;
      const normalizedPayload = normalizeRenderableGraphicPayload(payload);
      if (normalizedPayload) {
        return normalizedPayload;
      }
      const nestedCandidates = [payload.graphic, payload.graphics, payload.data, payload.payload, payload.result];
      for (const candidate of nestedCandidates) {
        const resolved = resolveGraphicPayload(candidate);
        if (resolved) {
          return resolved;
        }
      }
    }

    return null;
  };

  const extractGraphicFromMetadata = (metadata: Message['metadata']) => {
    const parsed = parseMessageMetadata(metadata);
    if (!parsed) return null;

    const hasDirectGraphicShape = Boolean(
      parsed.type || parsed.config || parsed.quickchart_url || parsed.code || parsed.base64
    );
    if (hasDirectGraphicShape) {
      const directGraphic = normalizeRenderableGraphicPayload(parsed);
      if (directGraphic) {
        return directGraphic;
      }
    }

    const primaryGraphic = resolveGraphicPayload(parsed.graphics ?? parsed.graphic);
    if (primaryGraphic) {
      return primaryGraphic;
    }

    if (parsed.metadata && typeof parsed.metadata === 'object' && !Array.isArray(parsed.metadata)) {
      const nestedGraphic = resolveGraphicPayload((parsed.metadata as Record<string, any>).graphics ?? (parsed.metadata as Record<string, any>).graphic);
      if (nestedGraphic) {
        return nestedGraphic;
      }
    }

    return null;
  };

  const extractExecutionSnapshotFromMetadata = (metadata: Message['metadata']) => {
    const parsed = parseMessageMetadata(metadata);
    if (!parsed) return null;
    const snapshot = parsed.execution_snapshot ?? parsed.executionSnapshot;
    if (snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)) {
      return snapshot as Record<string, any>;
    }
    return null;
  };

  const buildExecutionSnapshot = (taskId?: string | null, forceComplete = false) => {
    const cards = (progressiveToolCardsRef.current || []).map((card: any, index: number) => ({
      id: String(card.id || `tool-step-${index + 1}`),
      stepNum: Number(card.stepNum || index + 1),
      toolName: String(card.toolName || 'tool'),
      status: forceComplete && card.status === 'running' ? 'completed' : card.status,
      description: String(card.description || ''),
      resultContent: String(card.resultContent || ''),
      details: card.details && typeof card.details === 'object' && !Array.isArray(card.details) ? card.details : undefined,
      timestamp: String(card.timestamp || '')
    }));
    const steps = (combinedStepsListRef.current || []).map((step: any, index: number) => ({
      id: String(step.id || `step-${index + 1}`),
      status: forceComplete && step.status === 'loading' ? 'complete' : step.status,
      title: String(step.title || `Step ${index + 1}`),
      details: typeof step.details === 'string' ? step.details : undefined,
      timestamp: typeof step.timestamp === 'string' ? step.timestamp : undefined
    }));
    const visitedUrls = (unifiedVisitedUrlsRef.current || []).map((item: any) => ({
      url: String(item.url || ''),
      title: String(item.title || ''),
      status: String(item.status || 'complete'),
      timestamp: typeof item.timestamp === 'string' ? item.timestamp : undefined
    })).filter((item: any) => item.url);
    const thought = String(liveExecutionRef.current?.currentThought || '').trim();

    if (!thought && cards.length === 0 && steps.length === 0 && visitedUrls.length === 0) {
      return null;
    }

    return {
      taskId: taskId || activeWorkflowTaskIdRef.current || undefined,
      thought,
      cards,
      steps,
      visitedUrls,
      completedAt: new Date().toISOString()
    };
  };

  const mergeExecutionSnapshotIntoMetadata = (
    metadata: Message['metadata'],
    executionSnapshot: Record<string, any> | null
  ): Message['metadata'] => {
    if (!executionSnapshot) {
      return metadata;
    }

    const parsed = parseMessageMetadata(metadata) || {};
    if (parsed.execution_snapshot) {
      return parsed;
    }

    return {
      ...parsed,
      execution_snapshot: executionSnapshot
    };
  };

  const rememberExecutionSnapshot = (taskId: string | null | undefined, snapshot: Record<string, any> | null) => {
    if (!snapshot) {
      return;
    }

    latestExecutionSnapshotRef.current = snapshot;

    if (taskId) {
      executionSnapshotsByTaskRef.current[String(taskId)] = snapshot;
    }
  };

  const resolveExecutionSnapshot = (taskId?: string | null, forceComplete = false) => {
    const normalizedTaskId = taskId ? String(taskId) : (activeWorkflowTaskIdRef.current ? String(activeWorkflowTaskIdRef.current) : null);
    const liveSnapshot = buildExecutionSnapshot(normalizedTaskId, forceComplete);

    if (liveSnapshot) {
      rememberExecutionSnapshot(normalizedTaskId, liveSnapshot);
      return liveSnapshot;
    }

    if (normalizedTaskId && executionSnapshotsByTaskRef.current[normalizedTaskId]) {
      return executionSnapshotsByTaskRef.current[normalizedTaskId];
    }

    return latestExecutionSnapshotRef.current;
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

  const handlePlanApprove = async (modifiedPlan: any[]) => {
    if (!planPreview?.taskId) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/multi-agent/task/approve-plan`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          task_id: planPreview.taskId,
          edited_plan: {
            execution_steps: modifiedPlan
          }
        })
      });
      
      if (response.ok) {
        setPlanPreview(null);
        toast.success('Plan approved - execution starting');
      }
    } catch (error) {
      toast.error('Failed to approve plan');
    }
  };

  const handlePlanReject = async () => {
    if (!planPreview?.taskId) return;
    
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/multi-agent/tasks/${planPreview.taskId}/reject-plan`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Accept': 'application/json' })
      });
      
      setPlanPreview(null);
      toast.success('Plan rejected');
    } catch (error) {
      console.error('Failed to reject plan:', error);
      toast.error('Failed to reject plan');
    }
  };

  const handleSaveCheckpoint = async (name: string) => {
    if (!activeWorkflowTaskId) return;
    
    const checkpoint = {
      id: `cp_${Date.now()}`,
      name,
      stepNumber: stepProgress[stepProgress.length - 1]?.step_number || 0,
      timestamp: new Date().toISOString(),
      state: {
        stepProgress: [...stepProgress],
        thoughts: [...agentThoughts],
        workflows: {...multiAgentWorkflows}
      }
    };
    
    setCheckpoints(prev => ({
      ...prev,
      [activeWorkflowTaskId]: [...(prev[activeWorkflowTaskId] || []), checkpoint]
    }));
    
    toast.success(`Checkpoint "${name}" saved`);
  };

  const handleRestoreCheckpoint = async (checkpointId: string) => {
    if (!activeWorkflowTaskId) return;
    
    const checkpoint = checkpoints[activeWorkflowTaskId]?.find(cp => cp.id === checkpointId);
    if (!checkpoint) return;
    
    setStepProgress(checkpoint.state.stepProgress || []);
    setAgentThoughts(checkpoint.state.thoughts || []);
    setMultiAgentWorkflows(checkpoint.state.workflows || {});
    
    toast.success(`Restored to "${checkpoint.name}"`);
  };

  const handleDeleteCheckpoint = (checkpointId: string) => {
    if (!activeWorkflowTaskId) return;
    
    setCheckpoints(prev => ({
      ...prev,
      [activeWorkflowTaskId]: prev[activeWorkflowTaskId]?.filter(cp => cp.id !== checkpointId) || []
    }));
  };

  const handleApprovalResponse = async (approvalId: string, approved: boolean, reason?: string) => {
    try {
      const chatId = currentChatRef.current?.id || currentChat?.id;
      if (chatId) {
        multiAgentWebSocketService.sendRawMessage(chatId, {
          type: 'approval_response',
          approval_id: approvalId,
          approved,
          resolution: reason ? { reason } : {},
          timestamp: new Date().toISOString(),
        });
      }

      await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/multi-agent/approvals/${approvalId}`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ approved, reason })
      });

      const approval = pendingApprovals.find(a => a.id === approvalId);
      const isChallenge = approval?.policy?.policy_id === 'challenge_takeover';
      setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));

      if (isChallenge) {
        toast.success(approved ? 'Challenge resolved — agent will retry' : 'Step skipped — agent will continue');
      } else {
        toast.success(approved ? 'Action approved' : 'Action rejected');
      }
    } catch (error) {
      toast.error('Failed to process approval');
    }
  };

  const handleWorkflowPause = async () => {
    if (!activeWorkflowTaskId) return;
    const chatId = currentChatRef.current?.id || currentChat?.id;
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/multi-agent/task/${activeWorkflowTaskId}/pause`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Accept': 'application/json' })
      });
      if (!response.ok) {
        throw new Error('pause_failed');
      }
      setWorkflowState(prev => ({ ...prev, isPaused: true, isRunning: false, canResume: true }));
      if (chatId) {
        appendExecutionHistoryEvent(chatId, {
          type: 'workflow_pause_requested',
          task_id: activeWorkflowTaskId,
          timestamp: new Date().toISOString()
        });
        markWorkflowActivity(chatId);
        startHttpFallbackPolling(chatId);
      }
      toast.success('Workflow paused');
    } catch (error) {
      toast.error('Failed to pause workflow');
    }
  };

  const handleWorkflowResume = async () => {
    if (!activeWorkflowTaskId) return;
    const chatId = currentChatRef.current?.id || currentChat?.id;
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/multi-agent/task/${activeWorkflowTaskId}/resume`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Accept': 'application/json' })
      });
      if (!response.ok) {
        throw new Error('resume_failed');
      }
      setWorkflowState(prev => ({ ...prev, isPaused: false, isRunning: true, canResume: false }));
      if (chatId) {
        appendExecutionHistoryEvent(chatId, {
          type: 'workflow_resume_requested',
          task_id: activeWorkflowTaskId,
          timestamp: new Date().toISOString()
        });
        markWorkflowActivity(chatId);
        startHttpFallbackPolling(chatId);
      }
      toast.success('Workflow resumed');
    } catch (error) {
      toast.error('Failed to resume workflow');
    }
  };

  const handleWorkflowStop = async () => {
    if (!activeWorkflowTaskId) return;
    const chatId = currentChatRef.current?.id || currentChat?.id;
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/api/multi-agent/task/${activeWorkflowTaskId}`, {
        method: 'DELETE',
        headers: withAuthHeaders({ 'Accept': 'application/json' })
      });
      if (!response.ok) {
        throw new Error('stop_failed');
      }
      setWorkflowState({ isRunning: false, isPaused: false, canResume: false });
      setLiveExecution(prev => ({ ...prev, isActive: false }));
      setBrowserCurrentAction('');
      setStalledExecution({ isStalled: false, message: '', since: null });
      if (chatId) {
        appendExecutionHistoryEvent(chatId, {
          type: 'workflow_stop_requested',
          task_id: activeWorkflowTaskId,
          timestamp: new Date().toISOString()
        });
        markWorkflowActivity(chatId);
        startHttpFallbackPolling(chatId);
      }
      toast.success('Workflow stopped');
    } catch (error) {
      toast.error('Failed to stop workflow');
    }
  };

  const handleWorkflowRestart = async () => {
    if (!activeWorkflowTaskId) return;
    const previousTaskId = activeWorkflowTaskId;
    const chatId = currentChatRef.current?.id || currentChat?.id;
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      let restartedTaskId: string | null = null;

      const replayResponse = await fetch(`${BACKEND_URL}/api/multi-agent/task/${activeWorkflowTaskId}/replay`, {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }),
        body: JSON.stringify({ mode: 'continue' })
      });

      if (replayResponse.ok) {
        const replayResult = await replayResponse.json();
        if (replayResult?.success && replayResult?.task_id) {
          restartedTaskId = String(replayResult.task_id);
        }
      }

      if (!restartedTaskId) {
        const retryResponse = await fetch(`${BACKEND_URL}/api/multi-agent/task/${activeWorkflowTaskId}/retry`, {
          method: 'POST',
          headers: withAuthHeaders({ 'Accept': 'application/json' })
        });
        if (!retryResponse.ok) {
          throw new Error('restart_failed');
        }
        restartedTaskId = activeWorkflowTaskId;
      }

      setWorkflowState({ isRunning: true, isPaused: false, canResume: false });
      setStepProgress([]);
      setAgentThoughts([]);
      setStalledExecution({ isStalled: false, message: '', since: null });
      setLiveExecution(prev => ({
        ...prev,
        isActive: true,
        thinkingStartTime: Date.now()
      }));

      if (restartedTaskId) {
        lastTaskIdRef.current = restartedTaskId;
        setActiveWorkflowTaskId(restartedTaskId);
        setTaskIdAliases(prev => prev[previousTaskId] === restartedTaskId ? prev : { ...prev, [previousTaskId]: restartedTaskId });
        setMultiAgentWorkflows(prev => {
          const existing = prev[restartedTaskId!] || {};
          return {
            ...prev,
            [restartedTaskId!]: {
              ...existing,
              taskId: restartedTaskId,
              workflowStage: existing.workflowStage || 'replaying',
              lastUpdate: new Date().toISOString(),
              agentUpdates: existing.agentUpdates || [],
              planSteps: existing.planSteps || [],
              executionItems: existing.executionItems || []
            }
          };
        });
      }

      if (chatId) {
        appendExecutionHistoryEvent(chatId, {
          type: 'workflow_restart_requested',
          task_id: restartedTaskId || activeWorkflowTaskId,
          timestamp: new Date().toISOString()
        });
        markWorkflowActivity(chatId);
        startHttpFallbackPolling(chatId);
      }

      toast.success('Workflow restarted');
    } catch (error) {
      toast.error('Failed to restart workflow');
    }
  };

  const handleSkipStep = async () => {
    if (!activeWorkflowTaskId) return;

    const chatId = currentChatRef.current?.id || currentChat?.id;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/multi-agent/task/${activeWorkflowTaskId}/skip-step`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Accept': 'application/json' })
      });
      if (!response.ok) {
        throw new Error('skip_failed');
      }
      if (chatId) {
        appendExecutionHistoryEvent(chatId, {
          type: 'workflow_skip_step_requested',
          task_id: activeWorkflowTaskId,
          timestamp: new Date().toISOString()
        });
        markWorkflowActivity(chatId);
        startHttpFallbackPolling(chatId);
      }
      toast.success('Requested to skip current step');
    } catch (error) {
      toast.error('Failed to skip step');
    }
  };

  const handleClarificationResponse = async (taskId: string, response: string) => {
    const chatId = currentChatRef.current?.id || currentChat?.id;
    const canSendWs = !!(chatId && multiAgentWebSocketService.isConnected(chatId));
    if (canSendWs) {
      multiAgentWebSocketService.sendClarificationResponse(taskId, response);
    } else {
      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        await fetch(`${BACKEND_URL}/api/multi-agent/task/clarification`, {
          method: 'POST',
          headers: withAuthHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }),
          body: JSON.stringify({
            task_id: taskId,
            clarification_response: response
          })
        });
      } catch (e) {
      }
      if (chatId) {
        startHttpFallbackPolling(chatId);
      }
    }
    setClarificationRequests(prev => {
      const newState = { ...prev };
      delete newState[taskId];
      return newState;
    });
  };

  const handleIntentApprove = async () => {
    if (!intentConfirmation) return;
    
    const { pendingMessage, intentData } = intentConfirmation;
    setIntentConfirmation(null);
    
    const initialTasks = intentData.actions.map((action, index) => ({
      id: `task-${index + 1}`,
      description: action,
      status: index === 0 ? 'running' as const : 'pending' as const
    }));
    
    setLiveExecution({
      isActive: true,
      taskObjective: pendingMessage,
      thinkingStartTime: Date.now(),
      tasks: initialTasks,
      agentActions: [],
      currentThought: 'Initializing task execution...',
      confidenceLevel: 'high',
      executionStartTime: Date.now()
    });
    
    await addMessage({ role: 'user', content: pendingMessage, chatId: currentChat?.id });
    
    setKariosBrowserTask(pendingMessage);
    setShowKariosBrowser(true);
    setAutomationActive(true);
    setPendingAutomationTask(pendingMessage);
    
    window.dispatchEvent(new CustomEvent('browser-automation:sidebar-collapse', { detail: { collapse: true } }));
    
    const chatId = currentChat?.id;
    if (chatId) {
      const started = multiAgentWebSocketService.startWorkflowExecution(
        pendingMessage,
        intentData.actions,
        chatId
      );
      if (!started) {
        void createMultiAgentTaskViaHttp(chatId, pendingMessage);
      }
    }
  };

  const handleIntentReject = () => {
    setIntentConfirmation(null);
    setIsProcessing(false);
    setAvatarState('idle');
    setAvatarMessage('');
    toast.success('Task cancelled');
  };


  useEffect(() => {
    const handleAutomationEnable = () => {
      setAutomationActive(true);
      setAvatarState('browsing');
      setAvatarMessage('');
    };

    const handleAutomationDisable = () => {
      setAutomationActive(false);
      setAutomationSessionId(null);
      setAutomationChatId(null);
      setAvatarState('idle');
      setAvatarMessage('');
    };

    const handleAutomationSessionStart = (event: any) => {
      if (event.detail?.sessionId) {
        setAutomationSessionId(event.detail.sessionId);
      }
      if (event.detail?.chatId) {
        setAutomationChatId(event.detail.chatId);
      }
      setAutomationActive(true);
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

  useEffect(() => {
    const automationPlanMessages = currentChat?.messages?.filter(msg => 
      msg.role === 'assistant' && msg.content.startsWith('[AUTOMATION_PLAN]')
    ) || [];
    
    if (automationPlanMessages.length > 0) {
      const latestPlanMessage = automationPlanMessages[automationPlanMessages.length - 1];
      const planTriggeredKey = `automation_triggered_${latestPlanMessage.id}`;
      
      if (!sessionStorage.getItem(planTriggeredKey)) {
        sessionStorage.setItem(planTriggeredKey, 'true');
        
        setTimeout(() => {
          try {
            let planSessionId: string | null = null;
            let planUrl: string | null = null;
            let planTaskDescription: string | null = null;
            try {
              const newLineIdx = latestPlanMessage.content.indexOf('\n');
              const planJson = newLineIdx >= 0
                ? latestPlanMessage.content.substring(newLineIdx + 1)
                : (latestPlanMessage.content.split('[AUTOMATION_PLAN]')[1] || '');
              const parsed = JSON.parse(planJson);
              if (parsed && typeof parsed.session_id === 'string' && parsed.session_id) {
                planSessionId = parsed.session_id;
              }
              if (parsed && typeof parsed.url === 'string' && parsed.url) {
                planUrl = parsed.url;
              }
              if (parsed && typeof parsed.task_description === 'string' && parsed.task_description) {
                planTaskDescription = parsed.task_description;
              }
              if (!planUrl && parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
                const first = parsed.steps[0];
                if (first && typeof first.url === 'string' && first.url) {
                  planUrl = first.url;
                } else if (first && first.details && typeof first.details.url === 'string' && first.details.url) {
                  planUrl = first.details.url;
                }
              }
            } catch {}
            if (planSessionId) {
              setAutomationSessionId(planSessionId);
            }
            if (planSessionId) {
              setPendingAutomationTask((prev) => {
                if (prev) return prev;
                if (planTaskDescription) return planTaskDescription;
                return 'Execute automation plan';
              });
            }
            if (planSessionId) {
              setAutomationActive(true);
            }
            window.dispatchEvent(new CustomEvent('automation:show', { detail: { force: true } }));
            window.dispatchEvent(new CustomEvent('automation:start', { detail: { force: true, url: planUrl, sessionId: planSessionId } }));
          } catch (e) {
            console.error('Failed to auto-dispatch automation events:', e);
          }
        }, 500);
      }
    }
  }, [currentChat?.messages]);

  useEffect(() => {
    if (!isGenerating && !isProcessing) return;
    
    const processingMessages = [
      '',
      '',
      '',
    ];
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % processingMessages.length;
      setAvatarMessage(processingMessages[currentIndex]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isGenerating, isProcessing, setAvatarMessage]);

  const handleSubmit = async (e: React.FormEvent, overrideMessage?: string) => {
    e.preventDefault();

    const resolvedMessage = (typeof overrideMessage === 'string' ? overrideMessage : message).trim();
    const messageDraft = typeof overrideMessage === 'string' ? null : message;

    // Agent intent detection — surfaces InlineAgentCard in chat
    const agentDraft = detectAgentIntent(resolvedMessage);
    if (agentDraft) {
      setPendingAgentDraft(agentDraft);
    }
    
    if (isTaskMode && resolvedMessage) {
      if ((window as any).createTaskFromChat) {
        (window as any).createTaskFromChat(resolvedMessage);
        if (typeof overrideMessage !== 'string') {
          setMessage('');
        }
        return;
      }
    }
    
    const taskKeywords = ['create task', 'autonomous task', 'build agent', 'automate', 'execute task'];
    const isTaskRequest = taskKeywords.some(keyword => resolvedMessage.toLowerCase().includes(keyword));
    
    if (isTaskRequest && currentChat?.id) {
      try {
        const { autonomousTasksService } = await import('../services/api/autonomous-tasks.service');
        const result = await autonomousTasksService.createTask({
          chat_id: currentChat.id,
          user_id: 1, // Default user ID
          description: resolvedMessage,
          agent_id: currentChat.agent_id ? parseInt(currentChat.agent_id) : undefined
        });
        
        if (result.success && result.task) {
          await addMessage({ 
            role: 'user', 
            content: resolvedMessage, 
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
                message: `Γ£à **Autonomous Task Created Successfully**\n\n**${result.task.title}**\n\nTask ID: ${result.task.id}\nType: ${result.task.task_type}\nStatus: ${result.task.status}\nEstimated Duration: ${result.task.estimated_duration}s\n\nThe task will be executed automatically. Monitor progress in the Task Builder panel.`
              }),
            chatId: currentChat.id 
          });
          if (typeof overrideMessage !== 'string') {
            setMessage('');
          }
          return;
        } else {
          console.error('Task creation failed:', result.error);
        }
      } catch (error) {
        console.error('Autonomous task creation error:', error);
      }
    }
    
    if (!resolvedMessage && uploadedImages.length === 0) {
      return;
    }

    if (isProcessing) {
      return;
    }

    if (currentChat?.id && (currentChat.title === 'New Conversation' || currentChat.title === 'New Chat' || !currentChat.title)) {
      const generatedTitle = generateTitleFromMessage(resolvedMessage);
      if (generatedTitle && generatedTitle !== 'New Conversation') {
        updateChatTitle(currentChat.id, generatedTitle).catch(() => {});
      }
    }
    
    setIsProcessing(true);
    
    // Set avatar to thinking state when processing starts
    setAvatarState('thinking');
    setAvatarMessage('');
    
    const messageContent = resolvedMessage;

    if (devUiToggles.enableLegacyTitleUpdate && currentChat?.id && (currentChat.title === 'New Conversation' || currentChat.title === 'New Chat' || !currentChat.title)) {
      const generatedTitle = generateTitleFromMessage(messageContent);
      if (generatedTitle && generatedTitle !== 'New Conversation') {
        updateChatTitle(currentChat.id, generatedTitle).catch(() => {});
      }
    }
    
    if (typeof overrideMessage !== 'string') {
      setMessage("");
    }
    
    const isGoogleSearchPrompt = /\bgoogle\.[a-z.]+\b/i.test(messageContent) && /\b(search|search for|look up|find)\b/i.test(messageContent);
    const automationActionKeywords = /(web automation|click on|click|fill form|fill in|login|log in|sign in|sign-in|checkout|add to cart|cart|payment|billing|shipping|register|sign up|signup|scrape|extract from|upload|download|automation)/i;
    const navigationKeywords = /(browse|visit|navigate to|go to|open website|open the website)/i;
    const urlOrDomain = /(http:\/\/|https:\/\/|www\.|\b[a-z0-9-]+\.[a-z]{2,}(?:\/[\w\-\.~%!$&'()*+,;=:@\/?#\[\]]*)?\b)/i;
    const keywordMatch = !isGoogleSearchPrompt && (automationActionKeywords.test(messageContent) && (urlOrDomain.test(messageContent) || navigationKeywords.test(messageContent)));
    
    if (!automationActive && keywordMatch) {
      const taskAnalysis = analyzeTaskComplexity(messageContent);

      const initialTasks = taskAnalysis.actions.map((action: string, index: number) => ({
        id: `task-${index + 1}`,
        description: action,
        status: index === 0 ? 'running' as const : 'pending' as const
      }));

      setLiveExecution({
        isActive: true,
        taskObjective: messageContent,
        thinkingStartTime: Date.now(),
        tasks: initialTasks,
        agentActions: [],
        currentThought: '',
        confidenceLevel: 'high',
        executionStartTime: Date.now()
      });

      if (devUiToggles.enableLegacyTitleUpdate) {
        const generatedTitle = generateTitleFromMessage(messageContent);
        if (currentChat?.id && generatedTitle && generatedTitle !== 'New Conversation') {
          updateChatTitle(currentChat.id, generatedTitle).catch(() => {});
        }
      }

      await addMessage({ role: 'user', content: messageContent, chatId: currentChat?.id });

      setKariosBrowserTask(messageContent);
      setShowKariosBrowser(true);
      setAutomationActive(true);
      setPendingAutomationTask(messageContent);

      window.dispatchEvent(new CustomEvent('browser-automation:sidebar-collapse', { detail: { collapse: true } }));

      const chatId = currentChat?.id;
      if (chatId) {
        const started = multiAgentWebSocketService.startWorkflowExecution(
          messageContent,
          taskAnalysis.actions,
          chatId
        );
        if (!started) {
          void createMultiAgentTaskViaHttp(chatId, messageContent);
        }
      }

      setIsProcessing(false);
      return;
    }
    
    const isFirstMessage = !currentChat?.messages || currentChat.messages.filter(m => m.role === 'user').length === 0;
    
    const isSimple = isSimpleTask(messageContent);
    
    if (isFirstMessage) {
      const chatId = currentChat?.id || '';

      if (devUiToggles.enableLegacyTitleUpdate && chatId && (currentChat?.title === 'New Conversation' || currentChat?.title === 'New Chat' || !currentChat?.title)) {
        const generatedTitle = generateTitleFromMessage(messageContent);
        if (generatedTitle && generatedTitle !== 'New Conversation') {
          updateChatTitle(chatId, generatedTitle).catch(() => {});
        }
      }
      
      await addMessage({ role: 'user', content: messageContent, chatId: chatId });
      
      setIsProcessing(false);
      setAvatarState('idle');
      setAvatarMessage('');
      return;
    }

    if (automationActive) {
      try {
        await addMessage({ role: 'user', content: messageContent, chatId: automationChatId || currentChat?.id });
        
        setAvatarState('thinking');
        setAvatarMessage('');
        
        const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL;
        const chatId = automationChatId || currentChat?.id;
        if (!chatId) {
          console.error('No chat ID available for automation');
          return;
        }
        
        const planResponse = await fetch(`${BACKEND_URL}/api/chat/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: messageContent, message: messageContent })
        });
        
        if (planResponse.ok) {
          const planResult = await planResponse.json();
          
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
            setAvatarState('browsing');
            setAvatarMessage('');
            
            try {
              const planContent = automationPlanContent.split('[AUTOMATION_PLAN]')[1];
              planData = JSON.parse(planContent.trim());
              setAutomationPlans(prev => ({ ...prev, [planResult.id]: activeWorkflowTaskId ? { ...planData, taskId: activeWorkflowTaskId } : planData }));
              
              setAvatarState('browsing');
              setAvatarMessage('');

              setPendingAutomationTask((prev) => prev || messageContent);
              
              setTimeout(() => {
                try { 
                  window.dispatchEvent(new CustomEvent('automation:show', { detail: { immediate: true } })); 
                } catch (e) {
                  console.error('Error dispatching automation:show:', e);
                }
                
                try { 
                  let planSessionId: string | null = null;
                  let planUrl: string | null = null;
                  if (planData && typeof planData.session_id === 'string' && planData.session_id) {
                    planSessionId = planData.session_id;
                  }
                  if (planData && typeof planData.url === 'string' && planData.url) {
                    planUrl = planData.url;
                  }
                  if (!planUrl && planData && Array.isArray(planData.steps) && planData.steps.length > 0) {
                    const first = planData.steps[0];
                    if (first && typeof first.url === 'string' && first.url) {
                      planUrl = first.url;
                    } else if (first && first.details && typeof first.details.url === 'string' && first.details.url) {
                      planUrl = first.details.url;
                    }
                  }
                  if (planSessionId) {
                    setAutomationSessionId(planSessionId);
                  }
                  window.dispatchEvent(new CustomEvent('automation:start', { detail: { immediate: true, url: planUrl, sessionId: planSessionId } })); 
                } catch (e) {
                  console.error('Error dispatching automation:start:', e);
                }
                setPendingAutomationTask((prev) => prev || messageContent);
              }, 100);
              
            } catch (e) {
              console.error('Error parsing plan:', e);
            }
          }
        }
      } catch (e) {
        console.error('Error in automation workflow:', e);
      }
      
      if (automationSessionId) {
        try {
          const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL;
          const wfUrl = `${BACKEND_URL}/api/web-automation/execute-workflow`;
          
          if (automationChatId) {
            await addMessage({ role: 'user', content: messageContent, chatId: automationChatId });
          }
        
        let workflowSteps = [];
        
        const currentPlanId = currentChat?.id;
        if (currentPlanId && automationPlans[currentPlanId]) {
          workflowSteps = automationPlans[currentPlanId].steps || [];
          console.log('≡ƒñû USING STORED PLAN STEPS:', workflowSteps.length, 'steps');
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
      console.log('≡ƒîÉ INTERNET SEARCH MODE ACTIVE - Processing search');
      console.log('≡ƒîÉ [Chat] Disclaimer filtering is ACTIVE - generic AI messages will be filtered out');
      
      // Set avatar to searching state for internet search
      setAvatarState('searching');
      setAvatarMessage('Browsing...');
      
      try {
        const searchId = `search-${Date.now()}`;
        
        // Show animated loading indicator
        const loadingId = 'search-loading';
        if (devUiToggles.enableLegacySearchToast) {
          toast.loading(
            <div className="search-loading-animation">
              <div className="search-pulse-animation"></div>
              <span>Searching the web for results...</span>
            </div>, 
            { id: loadingId, duration: Infinity }
          );
        }
        
        console.log(`≡ƒîÉ [Chat][${searchId}] CALLING SEARCH API... isSearchMode=${isSearchMode}, internetSearchEnabled=${internetSearchEnabled}`);
        
        await performSearch(messageContent, true);
        
        console.log(`Γ£à [Chat][${searchId}] SEARCH COMPLETE`);
        
        if (currentChat?.id) {
          const updatedChatResponse = await chatService.getChat(currentChat.id);
          if (updatedChatResponse && updatedChatResponse.data) {
            setCurrentChat(updatedChatResponse.data);
          }
        }
        
        if (devUiToggles.enableLegacySearchToast) {
          toast.dismiss(loadingId);
        }
        toast.success(`Search results added to chat`, { id: 'search-toast' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error("Search error:", error);
        toast.error(errorMessage || 'Search failed. Please check your connection and try again.', { id: 'search-toast' });
        console.log('≡ƒÆí TROUBLESHOOTING TIPS: Check network connection, API endpoint, and server status');
      } finally {
        setIsProcessing(false);
        setAvatarState('idle');
        setAvatarMessage('');
        console.log('≡ƒöä INTERNET SEARCH COMPLETE - UI ready for next action');
      }
      return;
    }
    
    if (internetSearchEnabled) {
      console.log('Internet search is already in progress, skipping regular message processing');
      setIsProcessing(false);
      setAvatarState('idle');
      setAvatarMessage('');
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
    return (
      <ChatFirstRun
        compact={compact}
        message={message}
        setMessage={setMessage}
        isProcessing={isProcessing}
        isGenerating={isGenerating}
        isSearchMode={isSearchMode}
        isChatFullscreen={isChatFullscreen}
        showAgentModal={showAgentModal}
        canvasUsageRows={canvasUsageRows}
        canvasToolsRows={canvasToolsRows}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        onStopGeneration={stopGeneration}
        onToggleSearchMode={toggleSearchMode}
        onToggleFullscreen={toggleChatFullscreen}
        onNavigate={navigate}
        onCanvasConfigChange={handleCanvasConfigChange}
        onCloseAgentModal={() => setShowAgentModal(false)}
        onSelectAgent={async (selection) => {
          if ((selection as any)?.selection_type === 'workflow') {
            try {
              sessionStorage.setItem('builder_open_workflow_id', String((selection as any).workflow_id));
              sessionStorage.setItem('builder_open_workflow_chat', '1');
            } catch {}
            setShowAgentModal(false);
            navigate('/builder');
            return;
          }
          const chat = await createAgentChat(selection as any);
          if (chat) { setCurrentChat(chat); }
          setShowAgentModal(false);
        }}
        onCreateAgent={() => { setShowAgentModal(false); navigate('/builder'); }}
      />
    );
  }

  const chatMainContent = (
    <div className="flex h-full w-full max-w-full bg-[#0A0A0A] overflow-hidden min-w-0">
      <div className={`flex flex-col transition-all duration-300 ease-out min-w-0 overflow-hidden ${showKariosBrowser && !browserHeadlessMode ? 'flex-1 border-r border-gray-800' : 'flex-1'}`}>
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="text-xl font-semibold text-white">{currentChat.title || "New Chat"}</h2>
          <button
            type="button"
            onClick={toggleChatFullscreen}
            className="text-slate-400 hover:text-white p-1.5 rounded-md transition-colors"
            aria-label={isChatFullscreen ? "Collapse chat" : "Expand chat"}
            title={isChatFullscreen ? "Collapse chat" : "Expand chat"}
          >
            {isChatFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

      {/* Agent Info Banner - Show only if chat has an agent_id */}
      {currentChat.agent_id && (
        <AgentInfoBanner agentId={currentChat.agent_id} />
      )}

      {/* Messages Display Area */}
      <div
        ref={chatScrollRef}
        onScroll={handleChatScroll}
        className={`flex-1 overflow-y-auto ${compact ? 'px-2 py-2' : 'px-4 py-4'} space-y-4`}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {/* Search results are now presented as part of the AI's response in chat bubbles */}
        
        {/* Always render chat messages - search results will appear as agent responses */}
        {devUiToggles.enableLegacyPanels && showHeadlessPanel && (
          <div className="mb-2">
            <div className="rounded-2xl border border-[#1F1F1F] bg-[#0F0F0F] overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3"
                onClick={() => setHeadlessPanelOpen(prev => !prev)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#141414] border border-[#222222] flex items-center justify-center">
                    <Terminal className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">Headless Browser Mode</div>
                    <div className="text-xs text-slate-400">{headlessSwitchMessage || 'Live browser streaming not available'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-full">Running</span>
                  {headlessPanelOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-300" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </button>
              {headlessPanelOpen && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] p-3">
                      <div className="text-xs text-slate-400">Status</div>
                      <div className="text-sm text-white mt-1">{headlessStatusText}</div>
                    </div>
                    <div className="rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] p-3">
                      <div className="text-xs text-slate-400">Current Action</div>
                      <div className="text-sm text-white mt-1">{headlessActionText}</div>
                    </div>
                  </div>
                  {headlessLogEntries.length > 0 && (
                    <div className="rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] p-3">
                      <div className="text-xs text-slate-400 mb-2">Latest Logs</div>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {headlessLogEntries.map((log, index) => (
                          <div key={`${log.timestamp}-${index}`} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                            <span className="text-slate-300">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {(currentChat?.messages?.length ?? 0) > visibleMessageCount && (
          <button
            type="button"
            onClick={() => setVisibleMessageCount(prev => prev + 50)}
            className="w-full py-2 text-xs text-white/40 hover:text-brand-cyan transition-colors text-center"
          >
            Load earlier messages
          </button>
        )}
        {currentChat && (
          <>
            {[...messagesToShow]
            .sort((a, b) => {
              const timeA = new Date(a.timestamp || a.created_at || 0).getTime();
              const timeB = new Date(b.timestamp || b.created_at || 0).getTime();
              if (timeA !== timeB) return timeA - timeB;
              if (a.role === 'user' && b.role === 'assistant') return -1;
              if (a.role === 'assistant' && b.role === 'user') return 1;
              return (a.id || '').localeCompare(b.id || '');
            })
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
            .filter((msg) => !shouldFilterSearchDisclaimerMessage(msg, internetSearchEnabled, currentChat?.title))
            .map((msg, index, array) => {
              const extractedTaskId = msg.content.includes('task_id') ? extractTaskId(msg) : msg.id;
              const backendTaskId = lastTaskIdRef.current;
              const possibleTaskIds = [backendTaskId, extractedTaskId, taskIdAliases[extractedTaskId]].filter(Boolean);
              const matchingTaskId = possibleTaskIds.find(id => multiAgentWorkflows[id]);
              const actualTaskId = matchingTaskId || backendTaskId || extractedTaskId;
              const workflowUpdateCount = multiAgentWorkflows[actualTaskId]?.agentUpdates?.length || 0;
              const lastUpdateTime = multiAgentWorkflows[actualTaskId]?.lastUpdate || Date.now();
              const messageArtifacts = msg.role === 'assistant' ? getArtifactsForMessage(msg.id) : [];
              const messageMetadata = (msg as Message).metadata;
              const messageGraphic = msg.role === 'assistant' ? extractGraphicFromMetadata(messageMetadata) : null;
              const metadataExecutionSnapshot = msg.role === 'assistant' ? extractExecutionSnapshotFromMetadata(messageMetadata) : null;
              const resolvedSnapshotTaskId = (actualTaskId || activeWorkflowTaskIdRef.current || lastTaskIdRef.current)
                ? String(actualTaskId || activeWorkflowTaskIdRef.current || lastTaskIdRef.current)
                : '';
              const canUseFallbackExecutionSnapshot = msg.role === 'assistant' && !metadataExecutionSnapshot && (
                index === array.length - 1 ||
                index === array.length - 2 ||
                msg.content.startsWith('[AUTOMATION_RESULTS]') ||
                msg.content.startsWith('[TASK_EXECUTION]') ||
                isMultiAgentMessage(msg)
              );
              const fallbackExecutionSnapshot = canUseFallbackExecutionSnapshot
                ? ((resolvedSnapshotTaskId && executionSnapshotsByTaskRef.current[resolvedSnapshotTaskId]) || latestExecutionSnapshotRef.current)
                : null;
              const messageExecutionSnapshot = metadataExecutionSnapshot || fallbackExecutionSnapshot;
              const messageExecutionCards = Array.isArray(messageExecutionSnapshot?.cards) ? messageExecutionSnapshot.cards : [];
              const messageExecutionSteps = Array.isArray(messageExecutionSnapshot?.steps) ? messageExecutionSnapshot.steps : [];
              const messageExecutionUrls = Array.isArray(messageExecutionSnapshot?.visitedUrls) ? messageExecutionSnapshot.visitedUrls : [];
              const messageExecutionThought = typeof messageExecutionSnapshot?.thought === 'string' ? messageExecutionSnapshot.thought : '';
              return (
              <motion.div
                key={String(msg.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`message-container ${msg.role === "user" ? "user" : "agent"} group`}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div
                  className={`message-content ${msg.role}`}
                >
                  <div className="message-text">
                    <>
                      {msg.role === 'assistant' && (() => {
                        const summaryTaskId = actualTaskId;
                        const summary = summaryTaskId ? executionSummaryByTask[summaryTaskId] : null;
                        if (!summary) return null;
                        const secs = Math.floor(summary.durationMs / 1000);
                        const durationStr = secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`;
                        return (
                          <div className="flex items-center gap-2 mb-3 text-xs text-emerald-400">
                            <span>✓</span>
                            <span>Completed in {durationStr}</span>
                            {summary.stepsCompleted > 0 && <><span>·</span><span>{summary.stepsCompleted} steps</span></>}
                            {summary.urlsVisited > 0 && <><span>·</span><span>{summary.urlsVisited} sites</span></>}
                          </div>
                        );
                      })()}
                      {msg.role === 'assistant' && messageExecutionSnapshot && (
                        <div className="mb-4 space-y-3">
                          {messageExecutionCards.length > 0 && (() => {
                            const totalSteps = messageExecutionCards.length;
                            const runningIndex = messageExecutionCards.findIndex((card: any) => card.status === 'running');
                            const completedCount = messageExecutionCards.filter((card: any) => card.status === 'completed').length;
                            const hasRunning = runningIndex >= 0;
                            const stepNumber = hasRunning
                              ? runningIndex + 1
                              : Math.min(totalSteps, completedCount + (completedCount < totalSteps ? 1 : 0));
                            const progressRatio = hasRunning
                              ? (runningIndex + 1) / totalSteps
                              : completedCount / totalSteps;

                            return (
                              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs uppercase tracking-wide text-gray-400">Progress</div>
                                    <div className="text-xs text-gray-300">Step {Math.max(1, stepNumber)} of {totalSteps}</div>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <motion.div
                                      className="h-full bg-white/70"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.max(6, Math.min(100, progressRatio * 100))}%` }}
                                      transition={{ duration: 0.35, ease: 'easeOut' }}
                                    />
                                  </div>
                                </div>

                                <motion.div
                                  className="space-y-3"
                                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
                                  initial="hidden"
                                  animate="show"
                                >
                                  {messageExecutionCards.map((card: any) => (
                                    <motion.div
                                      key={String(card.id || `${card.toolName}-${card.stepNum}`)}
                                      variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' } } }}
                                    >
                                      <ToolActionCard
                                        toolName={String(card.toolName || 'tool')}
                                        status={(card.status as 'running' | 'completed' | 'failed') || 'completed'}
                                        details={card.details}
                                        thought={card.resultContent ? String(card.resultContent) : undefined}
                                        subtitle={card.status === 'completed' ? undefined : (card.description ? String(card.description) : undefined)}
                                        startedAt={typeof card.timestamp === 'string' ? card.timestamp : undefined}
                                        defaultExpanded={card.status === 'running'}
                                        retryCount={card.retryCount || 0}
                                        isBrowserTool={card.isBrowserTool === true}
                                      />
                                    </motion.div>
                                  ))}
                                </motion.div>
                              </div>
                            );
                          })()}

                          {messageExecutionUrls.length > 0 && (
                            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="text-xs uppercase tracking-wide text-gray-400">Websites Accessed</div>
                                <div className="text-xs text-gray-400">{messageExecutionUrls.length}</div>
                              </div>
                              <div className="max-h-52 overflow-auto space-y-2">
                                {messageExecutionUrls.map((u: any, idx: number) => {
                                  const statusIcon = u.status === 'complete'
                                    ? 'Γ£ô'
                                    : u.status === 'error'
                                      ? 'Γ£ù'
                                      : 'Γƒ│';
                                  const statusClass = u.status === 'complete'
                                    ? 'text-green-400'
                                    : u.status === 'error'
                                      ? 'text-red-400'
                                      : 'text-gray-400';
                                  const label = (() => {
                                    try {
                                      const urlObj = new URL(String(u.url || ''));
                                      const host = urlObj.hostname.replace(/^www\./, '');
                                      const path = urlObj.pathname && urlObj.pathname !== '/' ? urlObj.pathname : '';
                                      return `${host}${path}`;
                                    } catch {
                                      return String(u.url || '');
                                    }
                                  })();
                                  return (
                                    <div key={`${String(u.url || '')}-${idx}`} className="flex items-center gap-3">
                                      <span className={`text-xs w-4 text-center ${statusClass}`}>{statusIcon}</span>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm text-gray-200 truncate">{String(u.title || label)}</div>
                                        <div className="text-xs text-gray-400 truncate">{label}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                        {msg.role === 'assistant' && msg.content.startsWith('[AUTOMATION_PLAN]') ? (
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
                                  const sid = (typeof automationSessionId === 'string' && automationSessionId) ? automationSessionId : undefined;
                                  const url = (typeof automationStreamUrl === 'string' && /^https?:\/\//i.test(automationStreamUrl)) ? automationStreamUrl : undefined;
                                  window.dispatchEvent(new CustomEvent('automation:show', { detail: { force: true } })); 
                                  window.dispatchEvent(new CustomEvent('automation:start', { detail: { force: true, sessionId: sid, url } })); 
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
                                  <div className="stopped-header">ΓÜá∩╕Å Web Automation Stopped</div>
                                  <div className="stopped-reason">Reason: {stoppedData.reason || 'Unknown'}</div>
                                  <div className="stopped-context">Context: {stoppedData.context || 'No context available'}</div>
                                  <div className="stopped-progress">Progress: {stoppedData.completed_steps || 0} of {stoppedData.total_steps || 0} steps completed</div>
                                  <div className="stopped-last-action">Last Action: {stoppedData.last_action || 'Unknown'}</div>
                                </div>
                              );
                            })()} 
                          </div>
                        ) : msg.role === 'assistant' && msg.content.startsWith('[AUTOMATION_RESULTS]') ? (
                          activeWorkflowTaskId && !workflowCompleted[activeWorkflowTaskId] && showOkComputer ? (
                             <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-800/50 animate-pulse">
                               <Loader className="w-4 h-4 text-white/40" />
                               <span className="text-sm text-slate-400">Preparing results...</span>
                             </div>
                          ) : (
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
                              
                              const hasStructuredProducts = resultsData.structured_products && resultsData.structured_products.length > 0;
                              
                              return (
                                <div className="automation-results-info">
                                  <div className="results-header">≡ƒÄë Web Automation Results</div>
                                  <div className="results-score">Score: {resultsData.score || 0}% {(resultsData.score || 0) >= 95 ? 'Γ£à' : 'ΓÜá∩╕Å'}</div>
                                  <div className="results-success">Status: {resultsData.success ? 'Success' : 'Partial'}</div>
                                  <div className="results-explanation">{resultsData.explanation || 'No explanation available'}</div>
                                  
                                  {hasStructuredProducts && (
                                    <div className="mt-4">
                                      <button 
                                        onClick={() => setActiveSidePanelArtifact({
                                          title: `Top ${resultsData.structured_products.length} Results`,
                                          type: 'data',
                                          content: (
                                            <StructuredResultsTable 
                                              products={resultsData.structured_products}
                                              title={`Top ${resultsData.structured_products.length} Results`}
                                              sortedBy="price_ascending"
                                            />
                                          )
                                        })}
                                        className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl p-4 transition-all group text-left"
                                      >
                                        <div className="flex items-center gap-4">
                                          <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                            <Table className="w-6 h-6 text-purple-400" />
                                          </div>
                                          <div className="flex-1">
                                            <h3 className="font-semibold text-gray-100 flex items-center gap-2">
                                              Structured Product Data
                                              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                                                {resultsData.structured_products.length} Items
                                              </span>
                                            </h3>
                                            <p className="text-sm text-gray-400 mt-1">
                                              Click to view detailed price analysis and product comparison table
                                            </p>
                                          </div>
                                          <div className="p-2 text-gray-500 group-hover:text-purple-400 transition-colors">
                                            <Layout className="w-5 h-5" />
                                          </div>
                                        </div>
                                      </button>
                                    </div>
                                  )}
                                  
                                  {resultsData.task_completion && (
                                    <div className="results-task-completion">
                                      <div className="task-completion-header">Task Completion</div>
                                      <div className="task-completion-details">
                                        <span>Steps: {resultsData.task_completion.successful_steps || 0}/{resultsData.task_completion.total_planned_steps || 0}</span>
                                        <span>Rate: {resultsData.task_completion.completion_rate?.toFixed(1) || 0}%</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {!hasStructuredProducts && resultsData.extracted_data && Object.keys(resultsData.extracted_data).length > 0 && (
                                    <div className="results-data">
                                      <div className="data-header">Extracted Data:</div>
                                      <div className="data-items">
                                        {Object.entries(resultsData.extracted_data).slice(0, 5).map(([key, value]: [string, any], idx: number) => (
                                          <div key={idx} className="data-item">
                                            <span className="data-key">{key}:</span>
                                            <span className="data-value">{typeof value === 'string' ? value.substring(0, 100) : JSON.stringify(value).substring(0, 100)}...</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()} 
                          </div>
                          )
                        ) : msg.role === 'assistant' && msg.content.startsWith('[SEARCH_RESULTS]') ? (
                          <div className="search-result-message">
                            <span className="search-result-badge">≡ƒîÉ Search Result</span>
                           {(() => {
                             const lines = msg.content.split('\n');
                             let title = '', url = '', snippet = '';
                             lines.forEach(line => {
                               if (line.startsWith('Title:')) title = line.replace('Title:', '').trim();
                               else if (line.startsWith('URL:')) url = line.replace('URL:', '').trim();
                               else if (line.startsWith('Snippet:')) snippet = line.replace('Snippet:', '').trim();
                             });
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
                                   console.log('≡ƒöÑ Task completed with result:', result);
                                 }}
                               />
                             );
                           } catch (e) {
                             return <MessageFormatter content={msg.content} role={msg.role} />;
                           }
                         })()
                       ) : msg.role === 'user' && editingMessageId === msg.id ? (
                         <div className="w-full">
                           <textarea
                             value={editedContent}
                             onChange={(e) => setEditedContent(e.target.value)}
                             className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                             rows={3}
                             autoFocus
                           />
                           <div className="flex items-center gap-2 mt-2">
                             <button
                               onClick={() => {
                                 if (editedContent.trim() && currentChat?.id) {
                                   setMessage(editedContent);
                                   setEditingMessageId(null);
                                   handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                                 }
                               }}
                               className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg flex items-center gap-1"
                             >
                               <Check className="w-4 h-4" />
                               <span>Submit</span>
                             </button>
                             <button
                               onClick={() => setEditingMessageId(null)}
                               className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg"
                             >
                               Cancel
                             </button>
                           </div>
                         </div>
                       ) : (
                        msg.role === 'assistant' && messageArtifacts.length > 0 ? (
                          <MessageWithArtifact
                            messageContent={<MessageFormatter content={buildArtifactMessageSummary(msg.content, messageArtifacts)} role={msg.role} />}
                            artifacts={messageArtifacts}
                            activeArtifactId={activeArtifact?.id || null}
                            onArtifactClick={(artifactId) => {
                              if (activeArtifact && activeArtifact.id === artifactId) {
                                collapseArtifact(artifactId);
                                return;
                              }
                              setActiveSidePanelArtifact(null);
                              expandArtifact(artifactId);
                            }}
                          />
                        ) : (
                          <MessageFormatter content={msg.content} role={msg.role} />
                        )
                      )}
                      {msg.role === 'assistant' && messageGraphic && (
                        <div className="mt-4">
                          <GraphicsRenderer graphic={messageGraphic as any} />
                        </div>
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
                            isSearching={!showUnifiedStatus && (isSearching || false)}
                            onResultClick={(result) => {
                              window.open(result.url, '_blank', 'noopener,noreferrer');
                            }}
                          />
                        </div>
                      )}
                      {msg.role === 'assistant' && !msg.content.startsWith('[') && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <MessageReactions
                              messageId={msg.id}
                              messageContent={msg.content}
                              onReaction={(msgId, reactionType, value) => {
                                toast.success(`Feedback recorded: ${reactionType}`);
                              }}
                            />
                            <RegenerateOptions
                              onRegenerate={(mode) => {
                                const lastUserMessage = (() => {
                                  for (let i = index - 1; i >= 0; i--) {
                                    if (array[i]?.role === 'user' && typeof array[i]?.content === 'string') {
                                      return array[i].content;
                                    }
                                  }
                                  return '';
                                })();
                                const instruction = mode === 'shorter' ? 'Please provide a shorter version.' :
                                  mode === 'longer' ? 'Please provide a more detailed version.' :
                                  mode === 'simplify' ? 'Please explain in simpler terms.' :
                                  mode === 'technical' ? 'Please provide more technical depth.' : '';

                                const nextMessage = mode === 'default' ? lastUserMessage : instruction;
                                if (nextMessage) {
                                  handleSubmit({ preventDefault: () => {} } as React.FormEvent, nextMessage);
                                }
                              }}
                              disabled={isProcessing || isGenerating}
                            />
                          </div>
                          {suggestions.length > 0 && index === array.length - 1 && (
                            <SuggestionChips
                              suggestions={suggestions}
                              onSuggestionClick={(suggestion) => {
                                setMessage(suggestion.text);
                              }}
                            />
                          )}
                        </div>
                      )}
                    </>
                  </div>
                </div>
                {msg.role === 'user' && editingMessageId !== msg.id && (
                  <div className="flex items-center justify-end gap-1 mt-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(msg.content);
                          toast.success('Copied to clipboard');
                        } catch (err) {
                          toast.error('Failed to copy');
                        }
                      }}
                      className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
                      title="Copy message"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingMessageId(msg.id);
                        setEditedContent(msg.content);
                      }}
                      className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
                      title="Edit message"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className={`message-timestamp-wrapper ${msg.role === "user" ? "user" : "agent"}`}>
                  <span className="message-timestamp-text">
                    {(() => {
                      try {
                        const date = msg.timestamp instanceof Date 
                          ? msg.timestamp 
                          : new Date(msg.timestamp || msg.created_at || Date.now());
                        
                        if (isNaN(date.getTime())) {
                          return 'Invalid date';
                        }
                        
                        return format(date, "MMM d, yyyy HH:mm");
                      } catch (error) {
                        console.error('Error formatting date:', error);
                        return 'Unknown time';
                      }
                    })()}
                  </span>
                </div>
              </motion.div>
            );
            })}
            
            
            {Object.entries(clarificationRequests).map(([taskId, request]) => (
              <motion.div
                key={`clarification-${taskId}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="message-container agent group"
              >
                <div className="message-content assistant">
                  <div className="message-text">
                    <div className="text-sm text-gray-200 mb-3">{typeof request === 'string' ? request : (request as any)?.clarification_request || (request as any)?.question || 'The agent needs clarification.'}</div>
                    <div className="flex gap-2 items-end">
                      <textarea
                        value={clarificationDrafts[taskId] || ''}
                        onChange={e => setClarificationDrafts(prev => ({ ...prev, [taskId]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const v = clarificationDrafts[taskId]?.trim(); if (v) { handleClarificationResponse(taskId, v); setClarificationDrafts(prev => { const n = { ...prev }; delete n[taskId]; return n; }); } } }}
                        placeholder="Type your response…"
                        rows={2}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-cyan-500/50 placeholder-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => { const v = clarificationDrafts[taskId]?.trim(); if (v) { handleClarificationResponse(taskId, v); setClarificationDrafts(prev => { const n = { ...prev }; delete n[taskId]; return n; }); } }}
                        disabled={!clarificationDrafts[taskId]?.trim()}
                        className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {showUnifiedStatus && (
              <div className="message-container agent group">
              <div className="message-content assistant">
              <div className="space-y-3 w-full">
                {progressiveToolCards.length === 0 && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                      <div>
                        <Loader className="w-4 h-4 text-white/40" />
                      </div>
                      <span className="text-sm text-gray-400">{unifiedStatusText}</span>
                    </div>
                    {liveExecution.executionStartTime && (
                      <span className="text-xs text-gray-500 tabular-nums">{formatElapsed(elapsedSeconds)}</span>
                    )}
                  </div>
                )}

                {liveExecution.currentThought && liveExecution.currentThought.trim().length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Thinking</div>
                    <div className="text-sm text-gray-300">
                      <StreamingText text={liveExecution.currentThought} speed={12} />
                    </div>
                  </div>
                )}

                {combinedStepsList.filter((s: any) => !String(s.title || '').startsWith('[Trace]')).length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-400 mb-3">Steps</div>
                    <div className="space-y-2">
                      {combinedStepsList.filter((s: any) => !String(s.title || '').startsWith('[Trace]')).map((s: any) => {
                        const t = String(s.title || '').toLowerCase();
                        const icon = t.includes('navigat') || t.includes('http') ? (
                          <Globe className="w-4 h-4 text-cyan-300/80" />
                        ) : t.includes('extract') || t.includes('scrap') ? (
                          <Terminal className="w-4 h-4 text-white/50" />
                        ) : (
                          <Zap className="w-4 h-4 text-white/50" />
                        );
                        const dotClass = s.status === 'complete'
                          ? 'bg-green-400'
                          : s.status === 'error'
                            ? 'bg-red-400'
                            : 'bg-white/50';
                        return (
                          <div key={String(s.id)} className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotClass}`} />
                            <div className="flex-shrink-0 mt-0.5">{icon}</div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm text-gray-200 truncate">{String(s.title || '')}</div>
                              {s.details && (
                                <div className="text-xs text-gray-400 truncate">{String(s.details)}</div>
                              )}
                            </div>
                            <span className={`text-xs flex-shrink-0 ${s.status === 'complete' ? 'text-green-400' : s.status === 'error' ? 'text-red-400' : 'text-gray-500'}`}>
                              {s.status === 'complete' ? 'Completed' : s.status === 'error' ? 'Failed' : 'Running'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {taskExecutionError && activeWorkflowTaskId && taskExecutionError.taskId === activeWorkflowTaskId && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5">
                    <span className="text-red-400 text-base mt-0.5">⚠</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-red-300 font-medium mb-2">{taskExecutionError.message}</div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setTaskExecutionError(null); handleWorkflowRestart(); }}
                          className="text-xs px-3 py-1 rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskExecutionError(null)}
                          className="text-xs px-3 py-1 rounded-full border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {stalledExecution.isStalled && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 text-base">⏳</span>
                      <span className="text-sm text-amber-300">Still working… this is taking longer than expected</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setStalledExecution(prev => ({ ...prev, isStalled: false }))}
                        className="text-xs px-3 py-1 rounded-full border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        Keep waiting
                      </button>
                      <button
                        type="button"
                        onClick={handleWorkflowStop}
                        className="text-xs px-3 py-1 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline agent card — surfaces when intent detected */}
                {pendingAgentDraft && (
                  <div className="px-2 py-2">
                    <InlineAgentCard
                      draft={pendingAgentDraft}
                      onDismiss={() => setPendingAgentDraft(null)}
                    />
                  </div>
                )}

                <ChatStreamingSurface
                  streamingFormatterOutput={streamingFormatterOutput}
                  progressiveToolCards={progressiveToolCards}
                  activeLoopPhase={activeLoopPhase}
                  pendingApprovals={pendingApprovals}
                  showUnifiedStatus={showUnifiedStatus}
                  onApprovalResponse={handleApprovalResponse}
                />
            <div ref={messagesEndRef} />

          </>
        )}
      </div>

      {/* Jump to latest button — appears when user has scrolled up */}
      {!isAtBottom && (
        <div className="absolute bottom-[90px] left-1/2 -translate-x-1/2 z-20">
          <button
            type="button"
            aria-label="Jump to latest message"
            onClick={() => forceScrollToBottom(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-overlay border border-brand-cyan/30 text-brand-cyan text-xs font-medium shadow-glow-cyan hover:bg-brand-cyan/10 transition-all duration-base"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M6 9L1 4h10L6 9z"/>
            </svg>
            Jump to latest
          </button>
        </div>
      )}
      {/* Input Form - Using updated chat.css classes */}
      <div className="chat-input-wrapper" style={{maxWidth: '720px', margin: '0 auto', width: '100%', padding: '0 1rem'}}>
        <form onSubmit={handleSubmit} className="w-full">
          <AssetsThumbnailStrip
            uploads={uploadedImages.map((u): AssetEntry => ({ id: u.name, type: (u as any).type || 'image', name: u.name, url: u.url, thumbnail: (u as any).preview_url, origin: 'upload' }))}
            artifacts={floatingArtifacts.map((a: any): AssetEntry => ({ id: a.id, type: a.type || 'document', name: a.title || a.name, preview: a.content, origin: 'artifact', createdAt: a.createdAt }))}
            onSelect={(asset) => {
              if (asset.origin === 'artifact') {
                const a = floatingArtifacts.find((x: any) => x.id === asset.id);
                if (a) openFullscreenArtifact(a);
              }
            }}
          />
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
                ref={(el) => {
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
                  }
                }}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                }}
                onKeyDown={(e) => {
                  if (isSearchMode && e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim()) performSearch(message);
                  } else {
                    handleKeyDown(e);
                  }
                }}
                placeholder={isSearchMode ? 'Ask Karios AI…' : 'Ask Karios AI'}
                className="chat-textarea"
                rows={1}
                disabled={isProcessing}
                aria-label="Message input"
                style={{ minHeight: '44px', maxHeight: '200px', overflowY: 'auto', resize: 'none' }}
              />
              {devUiToggles.enableLegacyInputIndicators && automationActive && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-teal-500">Web Automation Active</span>
                  </div>
                </div>
              )}
              {devUiToggles.enableLegacyInputIndicators && isProcessing && !automationActive && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-sm font-medium text-cyan-500">Thinking...</span>
                </div>
              )}
            </div>
            
            <div className="chat-input-actions">
              {isGenerating ? (
                <button 
                  type="button"
                  onClick={stopGeneration}
                  className="chat-send-button"
                  style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
                  </div>
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="chat-send-button neon-btn-primary"
                  disabled={isProcessing || (!message.trim() && uploadedImages.length === 0)}
                >
                  <Send className="w-4 h-4 neon-icon" />
                </button>
              )}
            </div>
          </div>
          
          <div className="chat-input-bottom-section">
            <SearchLockTooltip show={currentChat?.chat_type === 'internet_search'}>
               <button 
                 type="button" 
                 className={`search-text-button neon-btn-secondary ${isSearchMode ? 'search-active' : ''}`}
                 onClick={() => {
                   if (currentChat?.chat_type === 'internet_search') return;
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
                sessionIdOverride={(typeof automationSessionId === 'string' && automationSessionId)
                  ? automationSessionId
                  : (activeWorkflowTaskId ? `session_${activeWorkflowTaskId}` : null)}
                onAutomationResult={async (result) => {
                  console.log('≡ƒÄ» Chat.tsx - Web automation result received:', result);
                  console.log('≡ƒÄ» Current automation state:', { automationActive, automationSessionId, automationChatId });
                  
                  if (result.strategy === 'gemini_computer_use' || result.use_gemini === true) {
                    setKariosBrowserTask(result.task_description || pendingAutomationTask || 'Web automation task');
                    setShowKariosBrowser(true);
                  }
                  
                  if (result.type === 'session_started') {
                    console.log('≡ƒÄ» Processing session_started result');
                    setAutomationActive(true);
                    setAutomationSessionId(result.sessionId);
                    if (typeof result.headless === 'boolean') {
                      setBrowserHeadlessMode(result.headless);
                    }
                    if (typeof result.visible === 'boolean') {
                      setBrowserHeadlessMode(!result.visible);
                    }
                    const shouldFallback = (typeof result.headless === 'boolean' && result.headless) || (typeof result.visible === 'boolean' && !result.visible);
                    if (shouldFallback) {
                      triggerHeadlessFallback();
                    }
                    if (result.chatId) {
                      setAutomationChatId(result.chatId);
                      console.log('≡ƒÄ» Set automationChatId to:', result.chatId);
                    }
                    console.log('≡ƒÄ» Automation session started (Chat)', { sessionId: result.sessionId, chatId: result.chatId });
                    
                    try {
                      await addMessage({
                        content: `Web automation session started: ${result.sessionId}`,
                        role: 'system',
                        chatId: result.chatId || automationChatId || undefined
                      });
                      console.log('≡ƒÄ» Session started message added to chat');
                    } catch (e) {
                      console.error('≡ƒÄ» Error adding session started message:', e);
                    }
                    if (pendingAutomationTask) {
                      console.log('≡ƒÄ» Processing pending automation task:', pendingAutomationTask);
                      try {
                        const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL;
                        const wfUrl = `${BACKEND_URL}/api/web-automation/execute-workflow`;
                        console.log('≡ƒÄ» Will execute workflow at:', wfUrl);

                        // Log the pending user task into the automation chat
                        try {
                          const targetChatId = result.chatId || automationChatId;
                          console.log('≡ƒÄ» Adding pending task to chat with ID:', targetChatId);
                          if (targetChatId) {
                            await addMessage({ role: 'user', content: pendingAutomationTask, chatId: targetChatId });
                            console.log('≡ƒÄ» Pending task added to automation chat');
                          } else {
                            console.log('≡ƒÄ» No target chat ID available for pending task');
                          }
                        } catch (e) {
                          console.error('≡ƒÄ» Error adding pending task to chat:', e);
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
                              const newLineIdx = msg.content.indexOf('\n');
                              const planJson = newLineIdx >= 0
                                ? msg.content.substring(newLineIdx + 1)
                                : (msg.content.split('[AUTOMATION_PLAN]')[1] || '');
                              const plan = JSON.parse(planJson);
                              if (plan.steps && Array.isArray(plan.steps)) {
                                workflowSteps = plan.steps;
                                break;
                              }
                            } catch {}
                          }
                        }
                        if (workflowSteps.length === 0) {
                          const currentChatPlanMessages = currentChat?.messages?.filter(m => m.role === 'assistant' && m.content.startsWith('[AUTOMATION_PLAN]')) || [];
                          for (const msg of currentChatPlanMessages.slice(-3)) {
                            try {
                              const newLineIdx = msg.content.indexOf('\n');
                              const planJson = newLineIdx >= 0
                                ? msg.content.substring(newLineIdx + 1)
                                : (msg.content.split('[AUTOMATION_PLAN]')[1] || '');
                              const plan = JSON.parse(planJson);
                              if (plan.steps && Array.isArray(plan.steps) && plan.steps.length > 0) {
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
                        console.log('≡ƒÄ» Executing workflow with steps:', workflowSteps.length, 'steps');
                        const workflowPayload = {
                          sessionId: result.sessionId,
                          workflow_steps: workflowSteps,
                          task_description: pendingAutomationTask
                        };
                        console.log('≡ƒÄ» Workflow payload:', workflowPayload);
                        
                        const workflowResponse = await fetch(wfUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(workflowPayload)
                        });
                        
                        console.log('≡ƒÄ» Workflow execution response status:', workflowResponse.status);
                        if (!workflowResponse.ok) {
                          const errorText = await workflowResponse.text().catch(() => 'Unknown error');
                          console.error('≡ƒÄ» Workflow execution failed:', errorText);
                        } else {
                          console.log('≡ƒÄ» Workflow execution started successfully');
                        }
                      } catch (e) {
                        console.error('≡ƒÄ» Error executing workflow:', e);
                      }
                      setPendingAutomationTask(null);
                      console.log('≡ƒÄ» Cleared pending automation task');
                    } else {
                      console.log('≡ƒÄ» No pending automation task to process');
                    }
                  } else if (result.type === 'workflow_status_update') {
                    try {
                      const rawStatus = typeof result.status === 'string' ? result.status : '';
                      setAutomationWsLogs((prev) => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'info', message: `Workflow status: ${rawStatus}` }]);
                    } catch {}
                  } else if (result.type === 'workflow_step_started') {
                    try {
                      const idx = typeof result.step_index === 'number' ? result.step_index : -1;
                      const sid = typeof result.sessionId === 'string' ? result.sessionId : null;
                      setAutomationWsLogs((prev) => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'task', message: `Step ${idx + 1} started` }]);
                      if (sid) {
                        setAutomationPlans((prev) => {
                          const keys = Object.keys(prev);
                          const targetKey = keys.find((k) => prev[k] && prev[k].session_id === sid) || keys[keys.length - 1];
                          if (!targetKey) return prev;
                          const plan = prev[targetKey];
                          const steps = plan && Array.isArray(plan.steps) ? plan.steps : null;
                          if (!steps || idx < 0 || idx >= steps.length) return prev;
                          const nextSteps = steps.map((s: any, sidx: number) => {
                            if (!s || typeof s !== 'object') return s;
                            if (sidx === idx) return { ...s, status: 'running' };
                            return s;
                          });
                          return { ...prev, [targetKey]: { ...plan, steps: nextSteps } };
                        });
                      }
                    } catch {}
                  } else if (result.type === 'workflow_step_completed') {
                    try {
                      const idx = typeof result.step_index === 'number' ? result.step_index : -1;
                      const sid = typeof result.sessionId === 'string' ? result.sessionId : null;
                      setAutomationWsLogs((prev) => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'success', message: `Step ${idx + 1} completed` }]);
                      if (sid) {
                        setAutomationPlans((prev) => {
                          const keys = Object.keys(prev);
                          const targetKey = keys.find((k) => prev[k] && prev[k].session_id === sid) || keys[keys.length - 1];
                          if (!targetKey) return prev;
                          const plan = prev[targetKey];
                          const steps = plan && Array.isArray(plan.steps) ? plan.steps : null;
                          if (!steps || idx < 0 || idx >= steps.length) return prev;
                          const nextSteps = steps.map((s: any, sidx: number) => {
                            if (!s || typeof s !== 'object') return s;
                            if (sidx === idx) return { ...s, status: 'completed' };
                            return s;
                          });
                          return { ...prev, [targetKey]: { ...plan, steps: nextSteps } };
                        });
                      }
                    } catch {}
                  } else if (result.type === 'workflow_step_failed') {
                    try {
                      const idx = typeof result.step_index === 'number' ? result.step_index : -1;
                      const sid = typeof result.sessionId === 'string' ? result.sessionId : null;
                      const err = typeof result.error === 'string' ? result.error : 'Step failed';
                      setAutomationWsLogs((prev) => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'error', message: `Step ${idx + 1} failed: ${err}` }]);
                      if (sid) {
                        setAutomationPlans((prev) => {
                          const keys = Object.keys(prev);
                          const targetKey = keys.find((k) => prev[k] && prev[k].session_id === sid) || keys[keys.length - 1];
                          if (!targetKey) return prev;
                          const plan = prev[targetKey];
                          const steps = plan && Array.isArray(plan.steps) ? plan.steps : null;
                          if (!steps || idx < 0 || idx >= steps.length) return prev;
                          const nextSteps = steps.map((s: any, sidx: number) => {
                            if (!s || typeof s !== 'object') return s;
                            if (sidx === idx) return { ...s, status: 'failed' };
                            return s;
                          });
                          return { ...prev, [targetKey]: { ...plan, steps: nextSteps } };
                        });
                      }
                    } catch {}
                  } else if (result.type === 'plan_created') {
                    console.log('≡ƒÄ» Processing plan_created result:', result.plan);
                    const id = `plan-${Date.now()}`;
                    setAutomationPlans((prev) => ({ ...prev, [id]: activeWorkflowTaskId ? { ...result.plan, taskId: activeWorkflowTaskId } : result.plan }));
                    console.log('≡ƒÄ» Added plan to automationPlans with ID:', id);
                    
                    try {
                      await addMessage({
                        content: `[AUTOMATION_PLAN]\n${JSON.stringify(result.plan)}`,
                        role: 'assistant',
                        chatId: automationChatId || undefined
                      });
                      console.log('≡ƒÄ» Plan message added to chat UI');
                    } catch (e) {
                      console.error('≡ƒÄ» Error adding plan message to chat:', e);
                    }
                  } else if (result.type === 'execution_started') {
                    console.log('≡ƒÄ» Processing execution_started result');
                    try {
                      await addMessage({
                        content: `[AUTOMATION_CONTROL]`,
                        role: 'system',
                        chatId: automationChatId || undefined
                      });
                      console.log('≡ƒÄ» Execution started message added to chat');
                    } catch (e) {
                      console.error('≡ƒÄ» Error adding execution started message:', e);
                    }
                  } else if (result.type === 'display_limitation') {
                    console.log('≡ƒÄ» Processing display_limitation result:', result.message);
                    triggerHeadlessFallback();
                    try {
                      await addMessage({
                        content: `ΓÜá∩╕Å ${result.message}`,
                        role: 'system',
                        chatId: automationChatId || undefined
                      });
                      toast(result.message, { 
                        icon: 'ΓÜá∩╕Å',
                        duration: 5000,
                        style: {
                          background: '#FFA500',
                          color: '#fff',
                        }
                      });
                      console.log('≡ƒÄ» Display limitation message added to chat');
                    } catch (e) {
                      console.error('≡ƒÄ» Error adding display limitation message:', e);
                    }
                  } else if (result.type === 'action_executed') {
                    console.log('≡ƒÄ» Processing action_executed result:', result.action);
                    try {
                      await addMessage({
                        content: `Web automation action: ${result.action.type} executed`,
                        role: 'system',
                        chatId: automationChatId || undefined
                      });
                      console.log('≡ƒÄ» Action executed message added to chat');
                    } catch (e) {
                      console.error('≡ƒÄ» Error adding action executed message:', e);
                    }
                  } else if (result.type === 'workflow_completed') {
                    console.log('≡ƒÄ» Processing workflow_completed result:', { result: result.result, score: result.score });
                    try {
                      const completionMessage = {
                        score: result.score,
                        success: result.result?.success || false,
                        explanation: result.result?.explanation || 'Automation completed',
                        extracted_data: result.result?.extracted_data || {},
                        task_completion: result.result?.task_completion || {},
                        structured_products: result.result?.structured_products || [],
                        products_count: result.result?.products_count || 0
                      };

                      setAutomationStructuredData({
                        ...completionMessage,
                        products: completionMessage.structured_products || []
                      });
                      
                      await addMessage({
                        content: `[AUTOMATION_RESULTS]\n${JSON.stringify(completionMessage)}`,
                        role: 'assistant',
                        chatId: automationChatId || undefined
                      });
                      console.log('≡ƒÄ» Workflow completed message added to chat with', completionMessage.products_count, 'products');
                      
                      setAvatarState('idle');
                      setAvatarMessage(completionMessage.products_count > 0 
                        ? `≡ƒÄë Found ${completionMessage.products_count} products!` 
                        : '≡ƒÄë Automation completed successfully!');
                    } catch (e) {
                      console.error('≡ƒÄ» Error adding workflow completed message:', e);
                    }
                  } else if (result.type === 'session_stopped') {
                    console.log('≡ƒÄ» Processing session_stopped result');
                    setAutomationActive(false);
                    setAutomationSessionId(null);
                    setHeadlessWorkflowActive(false);
                    setHeadlessPanelOpen(false);
                    setHeadlessSwitchMessage('');
                    setBrowserHeadlessMode(false);
                    setBrowserCurrentAction('');
                    console.log('≡ƒÄ» Automation session stopped (Chat)');
                    
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
                      console.log('≡ƒÄ» Session stopped message added to chat');
                    } catch (e) {
                      console.error('≡ƒÄ» Error adding session stopped message:', e);
                    }
                  } else if (result.type === 'session_updated') {
                    if (result.sessionId) {
                      setAutomationSessionId(result.sessionId);
                    }
                    if (result.session && typeof result.session.url === 'string' && result.session.url) {
                      setAutomationStreamUrl(result.session.url);
                    }
                    if (result.session && typeof result.session.status === 'string') {
                      setAutomationWsLogs((prev) => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), type: 'info', message: `Session status: ${result.session.status}` }]);
                    }
                  } else {
                    console.log('≡ƒÄ» Unknown automation result type:', result.type);
                  }
                }}
                showButton={chatFeatures.showWebAutomationButton}
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
        <div className="chat-ai-notice" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Karios AI</div>
        
        
        <AccessedWebsitesFloater
          isVisible={true}
        />
        
        {devUiToggles.enableLegacyModals && planPreview && (
          <PlanPreviewModal
            isOpen={planPreview.isOpen}
            plan={planPreview.plan}
            taskObjective={planPreview.taskObjective}
            onClose={() => setPlanPreview(null)}
            onApprove={handlePlanApprove}
            onReject={handlePlanReject}
          />
        )}

        {devUiToggles.enableLegacyModals && intentConfirmation && (
          <IntentConfirmationModal
            isOpen={intentConfirmation.isOpen}
            intentData={intentConfirmation.intentData}
            taskId={intentConfirmation.taskId}
            onApprove={handleIntentApprove}
            onReject={handleIntentReject}
          />
        )}

        <AgentSelectionModal
          isOpen={showAgentModal}
          onClose={() => setShowAgentModal(false)}
          onSelectAgent={async (selection: AgentSelectionResult) => {
            if ((selection as any)?.selection_type === 'workflow') {
              try {
                sessionStorage.setItem('builder_open_workflow_id', String((selection as any).workflow_id));
                sessionStorage.setItem('builder_open_workflow_chat', '1');
              } catch {}
              setShowAgentModal(false);
              navigate('/builder');
              return;
            }

            const chat = await createAgentChat(selection as any);
            if (chat) {
              setCurrentChat(chat);
            }
            setShowAgentModal(false);
          }}
          onCreateAgent={() => {
            setShowAgentModal(false);
            navigate('/builder');
          }}
        />
        
        {currentChat?.id && (
          <div className="absolute top-2 right-2 z-10">
            <PersonalizationIndicator 
              phase={1} 
              interactionCount={currentChat?.messages?.filter(m => m.role === 'user').length || 0}
              isActive={true}
            />
          </div>
        )}
        
      </div>
      
      </div>
    </div>
  );

  // Derived state for OK Karios Panel
  const activeWorkflow = activeWorkflowTaskId ? multiAgentWorkflows[activeWorkflowTaskId] : null;
  const activePlanKey = Object.keys(automationPlans).find(key => automationPlans[key].taskId === activeWorkflowTaskId) || Object.keys(automationPlans).pop();
  const activePlan = activePlanKey ? automationPlans[activePlanKey] : null;
  const activePlanSteps = (activePlan && Array.isArray(activePlan.steps)) ? activePlan.steps : [];
  const completedCount = activePlanSteps.filter((s: any) => s && (s.status === 'completed')).length;
  const runningIndex = activePlanSteps.findIndex((s: any) => s && (s.status === 'running'));
  const failedIndex = activePlanSteps.findIndex((s: any) => s && (s.status === 'failed'));
  const webAutomationWorkflowStatus = failedIndex >= 0 ? 'error' : (activePlanSteps.length > 0 && completedCount >= activePlanSteps.length ? 'complete' : (automationActive ? 'executing' : 'idle'));
  const webAutomationCurrentStep = runningIndex >= 0 ? (runningIndex + 1) : completedCount;

  const workflowStatus = activeWorkflow?.workflowStage?.toLowerCase().includes('completed') ? 'complete' :
                         activeWorkflow?.workflowStage?.toLowerCase().includes('error') ? 'error' :
                         activeWorkflow ? 'executing' : webAutomationWorkflowStatus;
  
  const okComputerLogs = activeWorkflow?.agentUpdates?.map((u: any) => ({
    timestamp: new Date(u.timestamp).toLocaleTimeString(),
    type: u.status === 'completed' ? 'success' : u.status === 'failed' ? 'error' : 'info',
    message: u.message
  })) || [];

  const mergedOkComputerLogs = [...okComputerLogs, ...automationWsLogs];

  const todoList = activePlanSteps.map((step: any, index: number) => {
    const raw = step && typeof step.status === 'string' ? step.status : '';
    const mapped = raw === 'completed' ? 'complete' : raw === 'running' ? 'in_progress' : raw === 'failed' ? 'error' : null;
    const fallback = (activeWorkflow?.currentStep || 0) > index ? 'complete' :
            (activeWorkflow?.currentStep || 0) === index && workflowStatus === 'executing' ? 'in_progress' : 'pending';
    return {
      id: `step-${index}`,
      text: step?.description || step?.instruction || `Step ${index + 1}`,
      status: (mapped || fallback) as any
    };
  });

  const artifactContent = showOkComputer ? (
    <OkComputerPanel
      isOpen={true}
      onClose={() => {
         setShowKariosBrowser(false);
         setAutomationActive(false);
      }}
      taskId={activeWorkflowTaskId}
      workflowStatus={workflowStatus}
      currentStep={activeWorkflow?.currentStep || webAutomationCurrentStep || 0}
      totalSteps={activePlanSteps.length || activeWorkflow?.totalSteps || 10}
      browserState={{
        url: automationStreamUrl || (kariosBrowserTask ? 'Executing Task...' : 'about:blank'),
        screenshot: automationStreamScreenshot || undefined,
        screenshotMime: automationStreamScreenshotMime || 'image/png',
        action: browserCurrentAction || activeWorkflow?.workflowStage || 'Ready',
        isLoading: isProcessing || workflowStatus === 'executing'
      }}
      logs={mergedOkComputerLogs}
      todoList={todoList} 
      structuredData={automationStructuredData}
      onStop={stopGeneration}
      isHeadless={browserHeadlessMode}
    />
  ) : activeSidePanelArtifact ? (
    <ArtifactSidePanel
      isOpen={true}
      onClose={() => setActiveSidePanelArtifact(null)}
      title={activeSidePanelArtifact.title}
      type={activeSidePanelArtifact.type}
      width="100%"
      mode="inline"
    >
      {activeSidePanelArtifact.content}
    </ArtifactSidePanel>
  ) : activeArtifact ? (
    <div ref={artifactScrollRef} onScroll={handleArtifactScroll} className="h-full">
      <ArtifactRenderer
        artifact={activeArtifact}
        onClose={() => collapseArtifact()}
        onExecute={async (artifact) => {
          console.log('Executing artifact:', artifact.id);
        }}
      />
    </div>
  ) : null;

  return (
    <>
      <CanvasLayout
        chatContent={chatMainContent}
        artifactContent={artifactContent}
        forceSplit={!!(showOkComputer || activeSidePanelArtifact)}
        centeredMode={!showOkComputer && !activeSidePanelArtifact && !activeArtifact}
        isChatFullscreen={isChatFullscreen}
        endlessCanvas={
          <EndlessCanvas
            artifacts={floatingArtifacts}
            onExpandArtifact={openFullscreenArtifact}
            showBackground
            liveSlot={
              showOkComputer ? (
                <BrowserSessionCard
                  title="Browser Session"
                  status="live"
                  size="medium"
                  url={typeof window !== 'undefined' ? window.location.host : undefined}
                />
              ) : null
            }
          />
        }
        topBar={
          <CanvasTopBar
            modelName="Opus 4.7"
            tokenCount={0}
            cost={0}
            isLive={false}
            isChatFullscreen={isChatFullscreen}
            onToggleFullscreen={toggleChatFullscreen}
            onNavigate={(path) => navigate(path)}
            onConfigChange={handleCanvasConfigChange}
            usageData={canvasUsageRows}
            toolsUsageData={canvasToolsRows}
          />
        }
        projectBadge={<CanvasProjectBadge name="Karios Labs" description="Project document for Karios Labs" />}
        bottomDock={<CanvasBottomDock />}
      />
      <ArtifactFullscreenModal
        artifact={fullscreenArtifact}
        open={!!fullscreenArtifact}
        onClose={closeFullscreenArtifact}
      />
    </>
  );
};

export default Chat;
