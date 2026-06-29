import { websocketStateManager } from './websocketStateManager.service';

interface MultiAgentWSMessage {
  type: string;
  chatId: string;
  timestamp: string;
  event_id?: string;
  event_seq?: number;
  eventId?: string;
  eventSeq?: number;
  agent_type?: string;
  status?: string;
  message?: string;
  data?: any;
  task_id?: string;
  clarification_request?: string;
  workflow_stage?: string;
}

interface MultiAgentWSCallbacks {
  onAgentStatus?: (data: MultiAgentWSMessage) => void;
  onFormatterTokenStream?: (data: MultiAgentWSMessage) => void;
  onClarificationRequest?: (data: MultiAgentWSMessage) => void;
  onWorkflowUpdate?: (data: MultiAgentWSMessage) => void;
  onWorkflowStarted?: (data: MultiAgentWSMessage) => void;
  onClarificationResolved?: (data: MultiAgentWSMessage) => void;
  onConnectionEstablished?: (data: MultiAgentWSMessage) => void;
  onNewMessage?: (data: MultiAgentWSMessage) => void;
  onTaskCompleted?: (data: MultiAgentWSMessage) => void;
  onFormattingCompleted?: (data: MultiAgentWSMessage) => void;
  onAgentThinking?: (data: MultiAgentWSMessage) => void;
  onStepProgress?: (data: MultiAgentWSMessage) => void;
  onApprovalRequired?: (data: MultiAgentWSMessage) => void;
  onApprovalReceived?: (data: MultiAgentWSMessage) => void;
  onAgentLoopState?: (data: MultiAgentWSMessage) => void;
  onTeamUpdate?: (data: MultiAgentWSMessage) => void;
  onTeamHeartbeatStatus?: (data: MultiAgentWSMessage) => void;
  onTeamBudgetAlert?: (data: MultiAgentWSMessage) => void;
  onTeamApprovalRequest?: (data: MultiAgentWSMessage) => void;
  onTeamTaskUpdate?: (data: MultiAgentWSMessage) => void;
  onTeamMemberStatus?: (data: MultiAgentWSMessage) => void;
  onQASessionUpdate?: (data: MultiAgentWSMessage) => void;
  onQAIssueFound?: (data: MultiAgentWSMessage) => void;
  onQAFixApplied?: (data: MultiAgentWSMessage) => void;
  onQAHealthScore?: (data: MultiAgentWSMessage) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

interface ChatConnection {
  ws: WebSocket;
  callbacks: MultiAgentWSCallbacks;
  pingInterval: NodeJS.Timeout | null;
  reconnectAttempts: number;
  manualDisconnect: boolean;
}

class MultiAgentWebSocketMultiService {
  private connections: Map<string, ChatConnection> = new Map();
  private activeChatId: string | null = null;
  private maxReconnectAttempts = 20;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectJitterRatio = 0.35;
  private seenEventsByChat: Map<string, { keys: string[]; set: Set<string> }> = new Map();
  private lastEventSeqByTaskByChat: Map<string, Map<string, number>> = new Map();
  private lastKnownSeqByChat: Map<string, number> = new Map();
  private localTokenSeqByChat: Map<string, number> = new Map();
  private maxSeenEventsPerChat = 2000;
  
  get chatId(): string | null {
    return this.activeChatId;
  }

  private calculateReconnectDelay(attempt: number): number {
    const normalizedAttempt = Math.max(1, Number(attempt || 1));
    const exponentialDelay = this.reconnectDelay * Math.pow(2, normalizedAttempt - 1);
    const cappedDelay = Math.min(this.maxReconnectDelay, exponentialDelay);
    const jitterSpan = cappedDelay * this.reconnectJitterRatio;
    const jitterOffset = (Math.random() * 2 - 1) * jitterSpan;
    const jitteredDelay = Math.round(cappedDelay + jitterOffset);
    return Math.max(500, jitteredDelay);
  }

  private withAuthHeaders(baseHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { ...baseHeaders };
    try {
      const token = localStorage.getItem('token');
      if (typeof token === 'string' && token.trim().length > 0) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }
    } catch (_) {
    }
    return headers;
  }

  dispatchMessage(chatId: string, data: MultiAgentWSMessage) {
    try {
      if (!chatId || !data) {
        return;
      }
      if (this.shouldSkipDuplicateEvent(chatId, data)) {
        return;
      }
      this.handleMessage(data, chatId);
    } catch (error) {
      console.error('🔥 WS MULTI DISPATCH - Error dispatching message:', error);
    }
  }

  constructor() {
    console.log('📡 MULTI-AGENT WS MULTI - Service initialized');
  }

  connect(chatId: string, callbacks: MultiAgentWSCallbacks = {}) {
    const existingConnection = this.connections.get(chatId);
    
    if (existingConnection) {
      const ws = existingConnection.ws;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        existingConnection.callbacks = callbacks;
        console.log('🔥 WS MULTI - Updated callbacks for chat:', chatId.slice(0, 8));
        this.activeChatId = chatId;
        return;
      } else {
        this.disconnectChat(chatId);
      }
    }
    
    this.activeChatId = chatId;
    console.log('🔥 WS MULTI - Creating connection for chat:', chatId.slice(0, 8));
    console.log('🔥 WS MULTI - Total connections:', this.connections.size);
    
    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + `/api/ws/multi-agent/${chatId}`;
      
      console.log('📡 WS MULTI - Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      const connection: ChatConnection = {
        ws,
        callbacks,
        pingInterval: null,
        reconnectAttempts: 0,
        manualDisconnect: false
      };
      
      this.connections.set(chatId, connection);
      
      ws.onopen = () => {
        console.log('📡 WS MULTI - Connected for chat:', chatId.slice(0, 8));
        const wasReconnect = connection.reconnectAttempts > 0;
        connection.reconnectAttempts = 0;
        connection.manualDisconnect = false;
        websocketStateManager.markConnected(chatId);
        this.startPingInterval(chatId);
        this.notifyConnectionStatus(chatId, 'connected');
        if (wasReconnect) {
          this.reconcileMissedEvents(chatId);
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data: MultiAgentWSMessage = JSON.parse(event.data);
          if (data && (data.type === 'pong' || data.type === 'ping' || (data as any).ephemeral === true)) {
            websocketStateManager.updateHeartbeat(chatId);
            if (data.type === 'ping') {
              this.sendPong(chatId);
            }
            return;
          }
          if (data.type === 'formatter_token_stream') {
            const next = (this.localTokenSeqByChat.get(chatId) || 0) + 1;
            this.localTokenSeqByChat.set(chatId, next);
            (data as any).event_seq = 900000000 + next;
          }
          if (this.shouldSkipDuplicateEvent(chatId, data)) {
            if (import.meta.env.DEV) {
              console.warn('🔥 WS MULTI RECEIVE - Duplicate skipped:', chatId.slice(0, 8), data.type, (data as any).event_id || (data as any).eventId || (data as any).event_seq || (data as any).eventSeq || 'fallback');
            }
            return;
          }
          const incomingSeq = Number((data as any).event_seq ?? (data as any).eventSeq);
          if (Number.isFinite(incomingSeq) && incomingSeq > (this.lastKnownSeqByChat.get(chatId) || 0)) {
            this.lastKnownSeqByChat.set(chatId, incomingSeq);
          }
          if (import.meta.env.DEV) {
            console.log('🔥 WS MULTI RECEIVE - Chat:', chatId.slice(0, 8), 'Type:', data.type);
          }
          this.handleMessage(data, chatId);
        } catch (error) {
          console.error('🔥 WS MULTI RECEIVE - Parse error:', error);
        }
      };
      
      ws.onclose = (event) => {
        console.log('📡 WS MULTI - Connection closed for chat:', chatId.slice(0, 8));
        this.stopPingInterval(chatId);
        
        websocketStateManager.markDisconnected(chatId);

        if (connection.callbacks.onClose) {
          connection.callbacks.onClose(event);
        }
        
        if (!connection.manualDisconnect && connection.reconnectAttempts < this.maxReconnectAttempts) {
          websocketStateManager.incrementReconnectCount(chatId);
          this.notifyConnectionStatus(chatId, 'reconnecting', {
            attempt: connection.reconnectAttempts + 1,
            maxAttempts: this.maxReconnectAttempts,
            nextRetryMs: this.calculateReconnectDelay(connection.reconnectAttempts + 1)
          });
          this.scheduleReconnect(chatId);
        } else {
          this.notifyConnectionStatus(chatId, 'disconnected', {
            attempt: connection.reconnectAttempts,
            maxAttempts: this.maxReconnectAttempts
          });
          this.connections.delete(chatId);
          this.seenEventsByChat.delete(chatId);
          this.lastEventSeqByTaskByChat.delete(chatId);
          this.localTokenSeqByChat.delete(chatId);
          console.log('🔥 WS MULTI - Removed connection, remaining:', this.connections.size);
        }
      };
      
      ws.onerror = (error) => {
        console.error('📡 WS MULTI - Error for chat:', chatId.slice(0, 8), error);
        if (connection.callbacks.onError) {
          connection.callbacks.onError(error);
        }
      };
      
    } catch (error) {
      console.error('📡 WS MULTI - Connection failed:', error);
      websocketStateManager.markDisconnected(chatId);
    }
  }

  private normalizeEventValue(value: any): any {
    if (Array.isArray(value)) {
      return value.map(item => this.normalizeEventValue(item));
    }
    if (value && typeof value === 'object') {
      const normalized: Record<string, any> = {};
      Object.keys(value)
        .sort()
        .forEach(key => {
          if (key === 'event_id' || key === 'eventId' || key === 'event_seq' || key === 'eventSeq' || key === 'ephemeral') {
            return;
          }
          normalized[key] = this.normalizeEventValue(value[key]);
        });
      return normalized;
    }
    if (value === undefined) {
      return null;
    }
    return value;
  }

  private resolveEventTaskId(data: MultiAgentWSMessage): string {
    const directTaskId = data.task_id || (data as any).taskId;
    if (directTaskId !== undefined && directTaskId !== null && `${directTaskId}`.trim().length > 0) {
      return `${directTaskId}`;
    }
    const nestedDataTaskId = data.data?.task_id || data.data?.taskId;
    if (nestedDataTaskId !== undefined && nestedDataTaskId !== null && `${nestedDataTaskId}`.trim().length > 0) {
      return `${nestedDataTaskId}`;
    }
    const nestedMessageTaskId = (data as any).message?.task_id || (data as any).message?.taskId;
    if (nestedMessageTaskId !== undefined && nestedMessageTaskId !== null && `${nestedMessageTaskId}`.trim().length > 0) {
      return `${nestedMessageTaskId}`;
    }
    const nestedMetadataTaskId = (data as any).metadata?.task_id || (data as any).metadata?.taskId || (data as any).metadata?.workflow_task_id;
    if (nestedMetadataTaskId !== undefined && nestedMetadataTaskId !== null && `${nestedMetadataTaskId}`.trim().length > 0) {
      return `${nestedMetadataTaskId}`;
    }
    return '';
  }

  private buildFallbackEventSignature(chatId: string, data: MultiAgentWSMessage): string {
    const payload = {
      chatId,
      type: data.type,
      timestamp: data.timestamp,
      task_id: this.resolveEventTaskId(data),
      agent_type: data.agent_type,
      status: data.status,
      message: (data as any).message,
      data: data.data,
      clarification_request: data.clarification_request,
      workflow_stage: data.workflow_stage,
      agent: (data as any).agent,
      thought: (data as any).thought,
      step_number: (data as any).step_number,
      total_steps: (data as any).total_steps,
      description: (data as any).description,
      tool_name: (data as any).tool_name,
      approval_id: (data as any).approval_id || data.data?.approval_id,
      message_id: (data as any).message?.id,
      message_role: (data as any).message?.role,
      message_content: (data as any).message?.content,
      message_timestamp: (data as any).message?.timestamp
    };
    return JSON.stringify(this.normalizeEventValue(payload));
  }

  private getOrCreateEventStore(chatId: string): { keys: string[]; set: Set<string> } {
    const existing = this.seenEventsByChat.get(chatId);
    if (existing) {
      return existing;
    }
    const created = { keys: [] as string[], set: new Set<string>() };
    this.seenEventsByChat.set(chatId, created);
    return created;
  }

  private getOrCreateEventSeqStore(chatId: string): Map<string, number> {
    const existing = this.lastEventSeqByTaskByChat.get(chatId);
    if (existing) {
      return existing;
    }
    const created = new Map<string, number>();
    this.lastEventSeqByTaskByChat.set(chatId, created);
    return created;
  }

  private shouldSkipDuplicateEvent(chatId: string, data: MultiAgentWSMessage): boolean {
    const taskId = this.resolveEventTaskId(data) || 'global';
    const rawEventId = (data as any).event_id ?? (data as any).eventId;
    const normalizedEventId = rawEventId === undefined || rawEventId === null ? '' : `${rawEventId}`.trim();
    const rawEventSeq = (data as any).event_seq ?? (data as any).eventSeq;
    const normalizedEventSeq = rawEventSeq === undefined || rawEventSeq === null ? NaN : Number(rawEventSeq);
    const hasEventSeq = Number.isFinite(normalizedEventSeq) && normalizedEventSeq > 0;

    if (hasEventSeq) {
      const eventSeqStore = this.getOrCreateEventSeqStore(chatId);
      const lastEventSeq = eventSeqStore.get(taskId) || 0;
      if (normalizedEventSeq <= lastEventSeq) {
        return true;
      }
    }

    let dedupKey = '';
    if (normalizedEventId.length > 0) {
      dedupKey = `${taskId}::id::${normalizedEventId}`;
    } else if (hasEventSeq) {
      dedupKey = `${taskId}::seq::${normalizedEventSeq}`;
    } else {
      dedupKey = `${taskId}::fallback::${this.buildFallbackEventSignature(chatId, data)}`;
    }

    const store = this.getOrCreateEventStore(chatId);
    if (store.set.has(dedupKey)) {
      return true;
    }

    store.set.add(dedupKey);
    store.keys.push(dedupKey);

    if (hasEventSeq) {
      const eventSeqStore = this.getOrCreateEventSeqStore(chatId);
      eventSeqStore.set(taskId, normalizedEventSeq);
    }

    while (store.keys.length > this.maxSeenEventsPerChat) {
      const evicted = store.keys.shift();
      if (evicted) {
        store.set.delete(evicted);
      }
    }

    return false;
  }

  private handleMessage(data: MultiAgentWSMessage, chatId: string) {
    if (import.meta.env.DEV) {
      console.log('🔥 DEBUG WS HANDLE - handleMessage called with type:', data.type);
      console.log('🔥 DEBUG WS HANDLE - Full data object:', data);
    }
    
    const connection = this.connections.get(chatId);
    if (!connection) {
      console.warn('🔥 WS MULTI - No connection found for chat:', chatId.slice(0, 8));
      return;
    }
    
    const callbacks = connection.callbacks;
    
    switch (data.type) {
      case 'connection_established':
        console.log('📡 MULTI-AGENT WS - Connection established for chat:', data.chatId);
        if (callbacks.onConnectionEstablished) {
          callbacks.onConnectionEstablished(data);
        }
        break;
      case 'workflow_started':
        console.log('🚀🚀🚀🚀 MULTI-AGENT WS - Workflow started:', data.task_id);
        if (callbacks.onWorkflowStarted) {
          callbacks.onWorkflowStarted(data);
        }
        if (callbacks.onAgentStatus) {
          callbacks.onAgentStatus(data);
        }
        break;

      case 'workflow_completed':
        console.log('✅ MULTI-AGENT WS - Workflow completed:', data.task_id);
        if (callbacks.onTaskCompleted) {
          callbacks.onTaskCompleted(data);
        }
        if (callbacks.onAgentStatus) {
          callbacks.onAgentStatus(data);
        }
        break;

      case 'workflow_failed':
        console.log('❌ MULTI-AGENT WS - Workflow failed:', data.task_id);
        if (callbacks.onAgentStatus) {
          callbacks.onAgentStatus(data);
        }
        break;
        
      case 'agent_status':
        console.log('📡 MULTI-AGENT WS - Agent status:', data.agent_type, data.status);
        if (callbacks.onAgentStatus) {
          callbacks.onAgentStatus(data);
        }
        break;

      case 'plan_ready':
        if (callbacks.onAgentStatus) {
          callbacks.onAgentStatus(data);
        }
        break;

      case 'context_update':
        if (callbacks.onAgentStatus) {
          callbacks.onAgentStatus(data);
        }
        break;

      case 'approval_required':
        if (callbacks.onApprovalRequired) {
          callbacks.onApprovalRequired(data);
        }
        if (callbacks.onAgentStatus) {
          callbacks.onAgentStatus(data);
        }
        break;

      case 'approval_received':
        if (callbacks.onApprovalReceived) {
          callbacks.onApprovalReceived(data);
        }
        if (callbacks.onAgentStatus) {
          callbacks.onAgentStatus(data);
        }
        break;

      case 'quality_metrics':
        if (callbacks.onAgentStatus) {
          callbacks.onAgentStatus(data);
        }
        break;

      case 'parallel_steps':
        if (callbacks.onAgentStatus) {
          callbacks.onAgentStatus(data);
        }
        break;
        
      case 'clarification_request':
        console.log('📡 MULTI-AGENT WS - Clarification request');
        if (callbacks.onClarificationRequest) {
          callbacks.onClarificationRequest(data);
        }
        break;
        
      case 'clarification_resolved':
        console.log('📡 MULTI-AGENT WS - Clarification resolved');
        if (callbacks.onClarificationResolved) {
          callbacks.onClarificationResolved(data);
        }
        break;
        
      case 'workflow_update':
        console.log('📡 MULTI-AGENT WS - Workflow update');
        if (callbacks.onWorkflowUpdate) {
          callbacks.onWorkflowUpdate(data);
        }
        break;
        
      case 'new_message':
        console.log('📡 MULTI-AGENT WS - New message');
        if (callbacks.onNewMessage) {
          callbacks.onNewMessage(data);
        }
        break;
        
      case 'task_completed':
        console.log('📡 MULTI-AGENT WS - Task completed');
        if (callbacks.onTaskCompleted) {
          callbacks.onTaskCompleted(data);
        }
        break;
        
      case 'formatting_completed':
        console.log('📡 MULTI-AGENT WS - Formatting completed');
        if (callbacks.onFormattingCompleted) {
          callbacks.onFormattingCompleted(data);
        }
        break;
        
      case 'gemini_browser_start':
        console.log('🌟 MULTI-AGENT WS - Gemini browser start signal received:', data);
        break;
        
      case 'ping':
        this.sendPong(chatId);
        break;
        
      case 'pong':
        if (!(data as any).ephemeral) {
          console.log('📡 MULTI-AGENT WS - Pong received');
        }
        break;

      case 'agent_thinking':
        if (callbacks.onAgentThinking) {
          callbacks.onAgentThinking(data);
        }
        break;
        
      case 'step_progress':
        if (callbacks.onStepProgress) {
          callbacks.onStepProgress(data);
        }
        break;

      case 'agent_loop_state':
        if (callbacks.onAgentLoopState) {
          callbacks.onAgentLoopState(data);
        }
        break;
      
      case 'team_update':
        if (callbacks.onTeamUpdate) {
          callbacks.onTeamUpdate(data);
        }
        break;

      case 'team_heartbeat_status':
        if (callbacks.onTeamHeartbeatStatus) {
          callbacks.onTeamHeartbeatStatus(data);
        }
        break;

      case 'team_budget_alert':
        if (callbacks.onTeamBudgetAlert) {
          callbacks.onTeamBudgetAlert(data);
        }
        break;

      case 'team_approval_request':
        if (callbacks.onTeamApprovalRequest) {
          callbacks.onTeamApprovalRequest(data);
        }
        break;

      case 'team_task_update':
        if (callbacks.onTeamTaskUpdate) {
          callbacks.onTeamTaskUpdate(data);
        }
        break;

      case 'team_member_status':
        if (callbacks.onTeamMemberStatus) {
          callbacks.onTeamMemberStatus(data);
        }
        break;

      case 'qa_session_update':
        if (callbacks.onQASessionUpdate) {
          callbacks.onQASessionUpdate(data);
        }
        break;

      case 'qa_issue_found':
        if (callbacks.onQAIssueFound) {
          callbacks.onQAIssueFound(data);
        }
        break;

      case 'qa_fix_applied':
        if (callbacks.onQAFixApplied) {
          callbacks.onQAFixApplied(data);
        }
        break;

      case 'qa_health_score':
        if (callbacks.onQAHealthScore) {
          callbacks.onQAHealthScore(data);
        }
        break;

      case 'test_message':
        console.log('🔥 DEBUG WS TEST - Test message received:', data.message);
        break;
        
      case 'formatter_token_stream':
        if (callbacks.onFormatterTokenStream) {
          callbacks.onFormatterTokenStream(data);
        }
        break;
      default:
        console.error('🔥 DEBUG WS HANDLE - Unknown message type:', data.type, 'Full message:', data);
    }
  }

  private startPingInterval(chatId: string) {
    const connection = this.connections.get(chatId);
    if (!connection) return;
    
    if (connection.pingInterval) {
      clearInterval(connection.pingInterval);
    }
    
    connection.pingInterval = setInterval(() => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        const pingMessage = {
          type: 'ping',
          timestamp: new Date().toISOString()
        };
        connection.ws.send(JSON.stringify(pingMessage));
      }
    }, 30000);
  }

  private stopPingInterval(chatId: string) {
    const connection = this.connections.get(chatId);
    if (connection && connection.pingInterval) {
      clearInterval(connection.pingInterval);
      connection.pingInterval = null;
    }
  }

  sendRawMessage(chatId: string, payload: Record<string, any>): boolean {
    const connection = this.connections.get(chatId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  private sendPong(chatId: string) {
    const connection = this.connections.get(chatId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      const pongMessage = {
        type: 'pong',
        timestamp: new Date().toISOString(),
        ephemeral: true
      };
      connection.ws.send(JSON.stringify(pongMessage));
    }
  }

  disconnectChat(chatId: string) {
    const connection = this.connections.get(chatId);
    if (!connection) return;
    
    console.log('📡 WS MULTI - Manually disconnecting chat:', chatId.slice(0, 8));
    connection.manualDisconnect = true;
    this.stopPingInterval(chatId);
    
    if (connection.ws.readyState === WebSocket.OPEN || connection.ws.readyState === WebSocket.CONNECTING) {
      connection.ws.close();
    }
    
    this.connections.delete(chatId);
    this.seenEventsByChat.delete(chatId);
    this.lastEventSeqByTaskByChat.delete(chatId);
    this.localTokenSeqByChat.delete(chatId);
    console.log('🔥 WS MULTI - Remaining connections:', this.connections.size);
  }

  disconnect() {
    console.log('📡 WS MULTI - Disconnecting all connections');
    this.connections.forEach((connection, chatId) => {
      this.disconnectChat(chatId);
    });
  }

  private async reconcileMissedEvents(chatId: string) {
    try {
      const sinceSeq = this.lastKnownSeqByChat.get(chatId) || 0;
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const resp = await fetch(`${BACKEND_URL}/api/multi-agent/chat/${chatId}/events?since_seq=${sinceSeq}&limit=200`, {
        headers: this.withAuthHeaders({ Accept: 'application/json' })
      });
      if (!resp.ok) return;
      const json = await resp.json();
      const events: any[] = Array.isArray(json.events) ? json.events : [];
      for (const evt of events) {
        if (!evt || !evt.type) continue;
        if (this.shouldSkipDuplicateEvent(chatId, evt as MultiAgentWSMessage)) continue;
        this.handleMessage(evt as MultiAgentWSMessage, chatId);
        const seq = Number(evt.event_seq);
        if (Number.isFinite(seq) && seq > (this.lastKnownSeqByChat.get(chatId) || 0)) {
          this.lastKnownSeqByChat.set(chatId, seq);
        }
      }
    } catch (_) {
    }
  }

  private scheduleReconnect(chatId: string) {
    const connection = this.connections.get(chatId);
    if (!connection) return;
    
    connection.reconnectAttempts++;
    const delay = this.calculateReconnectDelay(connection.reconnectAttempts);
    
    console.log(`📡 WS MULTI - Scheduling reconnect for chat ${chatId.slice(0, 8)} in ${delay}ms (attempt ${connection.reconnectAttempts})`);
    
    setTimeout(() => {
      console.log(`📡 WS MULTI - Attempting reconnect for chat ${chatId.slice(0, 8)}`);
      const callbacks = connection.callbacks;
      this.connections.delete(chatId);
      this.connect(chatId, callbacks);
    }, delay);
  }

  isConnected(chatId?: string): boolean {
    if (chatId) {
      const connection = this.connections.get(chatId);
      return connection ? connection.ws.readyState === WebSocket.OPEN : false;
    }
    return Array.from(this.connections.values()).some(c => c.ws.readyState === WebSocket.OPEN);
  }

  getActiveConnections(): number {
    return this.connections.size;
  }
  
  sendClarificationResponse(taskId: string, response: string) {
    const chatId = this.activeChatId;
    if (!chatId) {
      console.error('📡 WS MULTI - No active chat for clarification response');
      return;
    }
    
    const connection = this.connections.get(chatId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      console.error('📡 WS MULTI - No open connection for clarification response');
      return;
    }
    
    const message = {
      type: 'clarification_response',
      task_id: taskId,
      response: response,
      timestamp: new Date().toISOString()
    };
    
    console.log('📡 WS MULTI - Sending clarification response:', message);
    connection.ws.send(JSON.stringify(message));
  }

  startWorkflowExecution(taskObjective: string, actions: string[], chatIdOverride?: string) {
    const chatId = chatIdOverride || this.activeChatId;
    if (!chatId) {
      console.error('📡 WS MULTI - No active chat for workflow execution');
      return false;
    }
    
    const connection = this.connections.get(chatId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      console.error('📡 WS MULTI - No open connection for workflow execution');
      return false;
    }
    
    const message = {
      type: 'start_workflow',
      task_objective: taskObjective,
      actions: actions,
      chat_id: chatId,
      timestamp: new Date().toISOString()
    };
    
    console.log('📡 WS MULTI - Starting workflow execution:', message);
    connection.ws.send(JSON.stringify(message));
    return true;
  }

  private notifyConnectionStatus(
    chatId: string,
    status: 'connected' | 'disconnected' | 'reconnecting',
    detailOverrides: Record<string, any> = {}
  ) {
    window.dispatchEvent(new CustomEvent('ws:connection-status', {
      detail: { chatId, status, timestamp: Date.now(), ...detailOverrides }
    }));
  }
}

const multiAgentWebSocketMultiService = new MultiAgentWebSocketMultiService();
export default multiAgentWebSocketMultiService;
export type { MultiAgentWSMessage, MultiAgentWSCallbacks };
