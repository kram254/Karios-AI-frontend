import { useCallback, useRef } from "react";
import { chatService } from "../services/api/chat.service";
import multiAgentWebSocketService from "../services/multiAgentWebSocket.multi";

export interface UseHttpFallbackPollingDeps {
  currentChatRef: React.MutableRefObject<any>;
  activeWorkflowTaskIdRef: React.MutableRefObject<string | null>;
  lastTaskIdRef: React.MutableRefObject<string | null>;
  workflowStateRef: React.MutableRefObject<any>;
  workflowCompletedRef: React.MutableRefObject<Record<string, boolean>>;
  lastWorkflowActivityAtRef: React.MutableRefObject<number>;
  lastWorkflowEventSeqByTaskRef: React.MutableRefObject<Map<string, number>>;
  wsConnectionState: { status: string;[k: string]: any };
  setCurrentChat: (updater: any) => void;
  setExecutionHistoryByChat: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  setStalledExecution: React.Dispatch<React.SetStateAction<any>>;
  setWorkflowCompleted: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setWorkflowState: React.Dispatch<React.SetStateAction<any>>;
  setLiveExecution: React.Dispatch<React.SetStateAction<any>>;
  setBrowserCurrentAction: React.Dispatch<React.SetStateAction<string>>;
  setMultiAgentWorkflows: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setClarificationRequests: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export function useHttpFallbackPolling(deps: UseHttpFallbackPollingDeps) {
  const depsRef = useRef(deps);
  depsRef.current = deps;

  const httpFallbackPollingRef = useRef<{
    chatId: string | null;
    chatIntervalId: number | null;
    taskIntervalId: number | null;
    enabled: boolean;
    lastTaskId: string | null;
    lastTaskStage: string | null;
    lastTaskFormattedOutput: string | null;
    lastClarificationRequest: string | null;
    consecutive404Count: number;
  }>({
    chatId: null,
    chatIntervalId: null,
    taskIntervalId: null,
    enabled: false,
    lastTaskId: null,
    lastTaskStage: null,
    lastTaskFormattedOutput: null,
    lastClarificationRequest: null,
    consecutive404Count: 0,
  });
  const httpFallbackInFlightRef = useRef({ chat: false, task: false });

  const stopHttpFallbackPolling = useCallback(() => {
    const state = httpFallbackPollingRef.current;
    state.chatId = null;
    state.enabled = false;
    if (state.chatIntervalId !== null) {
      window.clearInterval(state.chatIntervalId);
      state.chatIntervalId = null;
    }
    if (state.taskIntervalId !== null) {
      window.clearInterval(state.taskIntervalId);
      state.taskIntervalId = null;
    }
    state.lastTaskId = null;
    state.lastTaskStage = null;
    state.lastTaskFormattedOutput = null;
    state.lastClarificationRequest = null;
    state.consecutive404Count = 0;
  }, []);

  const withAuthHeaders = useCallback((baseHeaders: Record<string, string> = {}) => {
    const headers: Record<string, string> = { ...baseHeaders };
    try {
      const token = localStorage.getItem('token');
      if (typeof token === 'string' && token.trim().length > 0) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }
    } catch (e) {
    }
    return headers;
  }, []);

  const appendExecutionHistoryEvent = useCallback((chatId: string, event: any) => {
    if (!chatId) return;
    depsRef.current.setExecutionHistoryByChat(prev => {
      const current = Array.isArray(prev[chatId]) ? prev[chatId] : [];
      const next = [...current, event];
      const trimmed = next.length > 500 ? next.slice(next.length - 500) : next;
      return {
        ...prev,
        [chatId]: trimmed
      };
    });
  }, []);

  const markWorkflowActivity = useCallback((chatId?: string | null) => {
    if (!chatId) return;
    const d = depsRef.current;
    if (d.currentChatRef.current?.id !== chatId) return;
    d.lastWorkflowActivityAtRef.current = Date.now();
    d.setStalledExecution((prev: any) => prev.isStalled ? { isStalled: false, message: '', since: null } : prev);
  }, []);

  const reconcileChatFromApi = useCallback(async (chatId: string) => {
    if (!chatId) return;
    const d = depsRef.current;
    if (d.currentChatRef.current?.id !== chatId) return;
    if (httpFallbackInFlightRef.current.chat) return;
    httpFallbackInFlightRef.current.chat = true;
    try {
      let updatedChatResponse: any;
      try {
        updatedChatResponse = await chatService.getChat(chatId);
        httpFallbackPollingRef.current.consecutive404Count = 0;
      } catch (fetchErr: any) {
        const status = fetchErr?.response?.status ?? fetchErr?.status;
        if (status === 404) {
          httpFallbackPollingRef.current.consecutive404Count += 1;
          if (httpFallbackPollingRef.current.consecutive404Count >= 5) {
            const zombieTaskIds = Array.from(new Set([
              d.activeWorkflowTaskIdRef.current,
              d.lastTaskIdRef.current,
              ...Object.keys(d.workflowStateRef.current.multiAgentWorkflows || {})
            ].filter(Boolean) as string[]));
            if (zombieTaskIds.length > 0) {
              for (const tid of zombieTaskIds) {
                if (!d.workflowCompletedRef.current[tid]) {
                  d.setWorkflowCompleted(prev => ({ ...prev, [tid]: true }));
                }
              }
              d.setWorkflowState((prev: any) => ({ ...prev, isRunning: false, isPaused: false, canResume: false }));
              d.setLiveExecution((prev: any) => ({
                ...prev,
                isActive: false,
                tasks: prev.tasks.map((t: any) => t.status === 'running' ? { ...t, status: 'failed' as const } : t)
              }));
              d.setBrowserCurrentAction('');
              httpFallbackPollingRef.current.consecutive404Count = 0;
            }
          }
          return;
        }
        throw fetchErr;
      }
      if (!updatedChatResponse?.data) return;
      if (d.currentChatRef.current?.id !== chatId) return;

      d.setCurrentChat((prev: any) => {
        if (!prev) return updatedChatResponse.data;
        if (String((prev as any).id || '') !== String((updatedChatResponse.data as any).id || '')) {
          return prev;
        }
        const apiMessages = ((updatedChatResponse.data as any).messages || []) as any[];
        const apiById = new Map<string, any>();
        apiMessages.forEach((m: any) => {
          apiById.set(String(m.id), m);
        });
        let metadataUpdated = false;
        const existingIds = new Set<string>();
        const mergedExisting = ((prev as any).messages || []).map((m: any) => {
          const apiMatch = apiById.get(String(m.id));
          if (!apiMatch) return m;
          if (m.metadata === undefined && apiMatch.metadata !== undefined) {
            metadataUpdated = true;
            return { ...m, metadata: apiMatch.metadata };
          }
          return m;
        });
        mergedExisting.forEach((m: any) => existingIds.add(String(m.id)));
        const newFromApi = apiMessages.filter((m: any) => !existingIds.has(String(m.id)));
        if (!metadataUpdated && newFromApi.length === 0 && ((prev as any).messages || []).length >= apiMessages.length) {
          return prev;
        }
        const merged = [...mergedExisting];
        newFromApi.forEach((m: any) => merged.push(m));
        return { ...(updatedChatResponse.data as any), messages: merged };
      });
    } catch (e) {
    } finally {
      httpFallbackInFlightRef.current.chat = false;
    }
  }, []);

  const pollTaskStatusFromApi = useCallback(async (chatId: string) => {
    if (!chatId) return;
    const d = depsRef.current;
    if (d.currentChatRef.current?.id !== chatId) return;
    if (httpFallbackInFlightRef.current.task) return;
    const trackedWorkflowIds = Object.keys(d.workflowStateRef.current.multiAgentWorkflows || {});
    const completedWorkflowIds = Object.keys(d.workflowCompletedRef.current || {});
    const candidateTaskIds = Array.from(new Set([
      d.activeWorkflowTaskIdRef.current,
      d.lastTaskIdRef.current,
      ...trackedWorkflowIds,
      ...completedWorkflowIds
    ]
      .map(id => (id === null || id === undefined ? '' : String(id).trim()))
      .filter(id => id.length > 0)));
    if (candidateTaskIds.length === 0) return;
    httpFallbackInFlightRef.current.task = true;
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      for (const taskId of candidateTaskIds) {
        if (d.currentChatRef.current?.id !== chatId) {
          break;
        }
        try {
          const response = await fetch(`${BACKEND_URL}/api/multi-agent/task/${taskId}/status`, {
            headers: withAuthHeaders({ 'Accept': 'application/json' })
          });
          if (!response.ok) continue;
          const result = await response.json();
          if (!result || !result.success) continue;
          if (d.currentChatRef.current?.id !== chatId) break;

          const normalizedTaskId = String(result.task_id || taskId).trim();
          if (!normalizedTaskId) continue;
          const workflowStage = typeof result.workflow_stage === 'string' ? result.workflow_stage : '';
          const formattedOutput = typeof result.formatted_output === 'string' ? result.formatted_output.trim() : '';
          const clarificationRequest = typeof result.clarification_request === 'string' ? result.clarification_request : '';
          const state = httpFallbackPollingRef.current;
          state.lastTaskId = normalizedTaskId;
          markWorkflowActivity(chatId);
          appendExecutionHistoryEvent(chatId, {
            type: 'task_status',
            task_id: normalizedTaskId,
            workflow_stage: workflowStage,
            timestamp: new Date().toISOString(),
          });

          try {
            const sinceSeq = d.lastWorkflowEventSeqByTaskRef.current.get(normalizedTaskId) || 0;
            const eventsUrl = new URL(`${BACKEND_URL}/api/multi-agent/task/${normalizedTaskId}/events`);
            if (sinceSeq > 0) {
              eventsUrl.searchParams.set('since_seq', String(sinceSeq));
            }
            const eventsResponse = await fetch(eventsUrl.toString(), {
              headers: withAuthHeaders({ 'Accept': 'application/json' })
            });
            if (eventsResponse.ok) {
              const eventsResult = await eventsResponse.json();
              if (eventsResult && eventsResult.success) {
                const events = Array.isArray(eventsResult.events) ? eventsResult.events : [];
                for (const event of events) {
                  if (!event) {
                    continue;
                  }
                  if (!(event as any).chatId) {
                    (event as any).chatId = chatId;
                  }
                  if (!(event as any).timestamp) {
                    (event as any).timestamp = new Date().toISOString();
                  }
                  markWorkflowActivity(chatId);
                  appendExecutionHistoryEvent(chatId, event);
                  multiAgentWebSocketService.dispatchMessage(chatId, event as any);
                }

                const latestSeq = Number(eventsResult.latest_event_seq);
                if (Number.isFinite(latestSeq) && latestSeq > 0) {
                  const currentLatest = d.lastWorkflowEventSeqByTaskRef.current.get(normalizedTaskId) || 0;
                  if (latestSeq > currentLatest) {
                    d.lastWorkflowEventSeqByTaskRef.current.set(normalizedTaskId, latestSeq);
                  }
                }
              }
            }
          } catch (e) {
          }

          const workflowStageKey = workflowStage ? `${normalizedTaskId}::${workflowStage}` : '';
          if (workflowStageKey && workflowStageKey !== state.lastTaskStage) {
            state.lastTaskStage = workflowStageKey;
            appendExecutionHistoryEvent(chatId, {
              type: 'workflow_stage_change',
              task_id: normalizedTaskId,
              workflow_stage: workflowStage,
              timestamp: new Date().toISOString(),
            });
            d.setMultiAgentWorkflows(prev => {
              const currentWorkflow = prev[normalizedTaskId] || {};
              return {
                ...prev,
                [normalizedTaskId]: {
                  ...currentWorkflow,
                  taskId: currentWorkflow.taskId || normalizedTaskId,
                  workflowStage,
                  lastUpdate: new Date().toISOString(),
                }
              };
            });
          }

          if (result.requires_clarification && clarificationRequest) {
            const clarificationKey = `${normalizedTaskId}::${clarificationRequest}`;
            if (clarificationKey !== state.lastClarificationRequest) {
              state.lastClarificationRequest = clarificationKey;
              const payload = {
                type: 'clarification_request',
                chatId,
                timestamp: new Date().toISOString(),
                task_id: normalizedTaskId,
                clarification_request: clarificationRequest,
                workflow_stage: workflowStage || undefined,
              } as any;
              d.setClarificationRequests(prev => {
                const existing = (prev as any)[normalizedTaskId];
                if (existing && String(existing.clarification_request || '') === clarificationRequest) {
                  return prev;
                }
                return {
                  ...prev,
                  [normalizedTaskId]: payload,
                };
              });
              d.setMultiAgentWorkflows(prev => {
                const currentWorkflow = prev[normalizedTaskId] || {};
                return {
                  ...prev,
                  [normalizedTaskId]: {
                    ...currentWorkflow,
                    taskId: normalizedTaskId,
                    workflowStage: 'Waiting for Clarification',
                    lastUpdate: new Date().toISOString(),
                    clarificationNeeded: true,
                  }
                };
              });
            }
          }

          if (workflowStage === 'completed') {
            if (!d.workflowCompletedRef.current[normalizedTaskId]) {
              d.setWorkflowCompleted(prev => ({ ...prev, [normalizedTaskId]: true }));
              d.setWorkflowState((prev: any) => ({ ...prev, isRunning: false, isPaused: false, canResume: false }));
              d.setLiveExecution((prev: any) => ({
                ...prev,
                isActive: false,
                tasks: prev.tasks.map((t: any) => ({ ...t, status: 'completed' as const }))
              }));
              d.setBrowserCurrentAction('');
            }
            const completionSyncKey = `${normalizedTaskId}::completed::${formattedOutput}`;
            if (completionSyncKey !== state.lastTaskFormattedOutput) {
              state.lastTaskFormattedOutput = completionSyncKey;
              await reconcileChatFromApi(chatId);
            }
          }

          if (workflowStage === 'failed') {
            if (!d.workflowCompletedRef.current[normalizedTaskId]) {
              d.setWorkflowCompleted(prev => ({ ...prev, [normalizedTaskId]: true }));
              d.setWorkflowState((prev: any) => ({ ...prev, isRunning: false, isPaused: false, canResume: false }));
              d.setLiveExecution((prev: any) => ({
                ...prev,
                isActive: false,
                tasks: prev.tasks.map((t: any) => t.status === 'running' ? { ...t, status: 'failed' as const } : t)
              }));
              d.setBrowserCurrentAction('');
            }
          }
        } catch (e) {
        }
      }
    } catch (e) {
    } finally {
      httpFallbackInFlightRef.current.task = false;
    }
  }, [appendExecutionHistoryEvent, markWorkflowActivity, reconcileChatFromApi, withAuthHeaders]);

  const startHttpFallbackPolling = useCallback((chatId: string, fastMode = false) => {
    if (!chatId) return;
    const d = depsRef.current;
    if (d.currentChatRef.current?.id !== chatId) return;
    const state = httpFallbackPollingRef.current;
    if (state.enabled && state.chatId === chatId && state.chatIntervalId) {
      return;
    }
    stopHttpFallbackPolling();
    state.chatId = chatId;
    state.enabled = true;

    const getAdaptiveInterval = () => {
      const latestDeps = depsRef.current;
      const secondsSinceActivity = Math.floor((Date.now() - latestDeps.lastWorkflowActivityAtRef.current) / 1000);
      const isWsHealthy = latestDeps.wsConnectionState.status === 'connected';
      if (isWsHealthy) return 30000;
      if (fastMode || secondsSinceActivity < 10) return 1000;
      if (secondsSinceActivity < 30) return 2000;
      if (secondsSinceActivity < 60) return 5000;
      return 15000;
    };

    const adaptivePoll = () => {
      if (depsRef.current.currentChatRef.current?.id !== chatId) {
        stopHttpFallbackPolling();
        return;
      }
      const interval = getAdaptiveInterval();
      if (interval < 30000) {
        void reconcileChatFromApi(chatId);
        void pollTaskStatusFromApi(chatId);
      }
      if (state.chatIntervalId) clearTimeout(state.chatIntervalId);
      state.chatIntervalId = window.setTimeout(adaptivePoll, interval);
    };

    adaptivePoll();
    state.lastTaskStage = null;
    state.lastTaskFormattedOutput = null;
    state.lastClarificationRequest = null;
  }, [pollTaskStatusFromApi, reconcileChatFromApi, stopHttpFallbackPolling]);

  return {
    httpFallbackPollingRef,
    httpFallbackInFlightRef,
    stopHttpFallbackPolling,
    withAuthHeaders,
    appendExecutionHistoryEvent,
    markWorkflowActivity,
    reconcileChatFromApi,
    pollTaskStatusFromApi,
    startHttpFallbackPolling,
  };
}
