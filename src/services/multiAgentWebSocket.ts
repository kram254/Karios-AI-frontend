interface MultiAgentWSMessage {
  type: string;
  chatId: string;
  timestamp: string;
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
  onClarificationRequest?: (data: MultiAgentWSMessage) => void;
  onWorkflowUpdate?: (data: MultiAgentWSMessage) => void;
  onWorkflowStarted?: (data: MultiAgentWSMessage) => void;
  onClarificationResolved?: (data: MultiAgentWSMessage) => void;
  onConnectionEstablished?: (data: MultiAgentWSMessage) => void;
  onNewMessage?: (data: MultiAgentWSMessage) => void;
  onTaskCompleted?: (data: MultiAgentWSMessage) => void;
  onFormattingCompleted?: (data: MultiAgentWSMessage) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

class MultiAgentWebSocketService {
  private ws: WebSocket | null = null;
  private callbacksList: MultiAgentWSCallbacks[] = [];
  private chatId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private manualDisconnect = false;

  constructor() {
    console.log('📡 MULTI-AGENT WS - Service initialized');
  }

  connect(chatId: string, callbacks: MultiAgentWSCallbacks = {}) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.chatId === chatId) {
        this.callbacksList = [callbacks];
        console.log('🔥 DEBUG WS - Replaced callbacks for same chat, total handlers:', this.callbacksList.length);
        return;
      }
      this.disconnect();
    }
    this.chatId = chatId;
    this.callbacksList = [callbacks];
    this.manualDisconnect = false;
    console.log('🔥 DEBUG WS CONNECT - Storing callbacks:', {
      onAgentStatus: typeof callbacks.onAgentStatus,
      onClarificationRequest: typeof callbacks.onClarificationRequest,
      onWorkflowUpdate: typeof callbacks.onWorkflowUpdate,
      onWorkflowStarted: typeof callbacks.onWorkflowStarted,
      onClarificationResolved: typeof callbacks.onClarificationResolved
    });
    
    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + `/api/ws/multi-agent/${chatId}`;
      
      console.log('📡 MULTI-AGENT WS - Connecting to:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('📡 MULTI-AGENT WS - Connected successfully');
        this.reconnectAttempts = 0;
        this.manualDisconnect = false;
        this.startPingInterval();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data: MultiAgentWSMessage = JSON.parse(event.data);
          console.log('🔥 DEBUG WS RECEIVE - Raw message received:', event.data);
          console.log('🔥 DEBUG WS RECEIVE - Parsed data:', data);
          console.log('🔥 DEBUG WS RECEIVE - Message type:', data.type);
          this.handleMessage(data);
        } catch (error) {
          console.error('🔥 DEBUG WS RECEIVE - Parse error:', error, 'Raw data:', event.data);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('📡 MULTI-AGENT WS - Connection closed:', event.code, event.reason);
        this.stopPingInterval();
        this.ws = null;
        
        this.callbacksList.forEach(callbacks => {
          if (callbacks.onClose) {
            callbacks.onClose(event);
          }
        });
        
        if (!this.manualDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('📡 MULTI-AGENT WS - WebSocket error:', error);
        this.callbacksList.forEach(callbacks => {
          if (callbacks.onError) {
            callbacks.onError(error);
          }
        });
      };
      
    } catch (error) {
      console.error('📡 MULTI-AGENT WS - Connection failed:', error);
    }
  }

  private handleMessage(data: MultiAgentWSMessage) {
    console.log('🔥 DEBUG WS HANDLE - handleMessage called with type:', data.type);
    console.log('🔥 DEBUG WS HANDLE - Full data object:', data);
    switch (data.type) {
      case 'connection_established':
        console.log('📡 MULTI-AGENT WS - Connection established for chat:', data.chatId);
        this.callbacksList.forEach(callbacks => {
          if (callbacks.onConnectionEstablished) {
            callbacks.onConnectionEstablished(data);
          }
        });
        break;
        
      case 'workflow_update':
        console.log('📡 MULTI-AGENT WS - Workflow update:', data);
        this.callbacksList.forEach(callbacks => {
          if (callbacks.onWorkflowUpdate) {
            callbacks.onWorkflowUpdate(data);
          }
        });
        break;
        
      case 'workflow_started':
        console.log('🚀🚀🚀🚀 MULTI-AGENT WS - Workflow started:', data.task_id);
        console.log('🚀 DEBUG - callbacksList length:', this.callbacksList.length);
        this.callbacksList.forEach((callbacks, index) => {
          console.log(`🚀 DEBUG - Callback ${index} onWorkflowStarted:`, typeof callbacks.onWorkflowStarted);
          if (callbacks.onWorkflowStarted) {
            console.log('🚀🚀 CALLING onWorkflowStarted callback for callback', index);
            callbacks.onWorkflowStarted(data);
          } else {
            console.log('❌ onWorkflowStarted is undefined for callback', index);
          }
        });
        break;
      
      case 'agent_status':
        console.log('📡 MULTI-AGENT WS - Agent status:', data.agent_type, data.status);
        this.callbacksList.forEach(callbacks => {
          if (callbacks.onAgentStatus) {
            callbacks.onAgentStatus(data);
          }
        });
        break;
        
      case 'clarification_request':
        console.log('🔥 DEBUG WS SERVICE - Clarification request received:', {
          type: data.type,
          task_id: data.task_id,
          clarification_request: data.clarification_request,
          message: data.message,
          timestamp: data.timestamp,
          fullData: data
        });
        this.callbacksList.forEach(callbacks => {
          if (callbacks.onClarificationRequest) {
            console.log('🔥 DEBUG WS SERVICE - Calling onClarificationRequest callback');
            callbacks.onClarificationRequest(data);
          }
        });
        break;
        
      case 'clarification_resolved':
        console.log('📡 MULTI-AGENT WS - Clarification resolved');
        this.callbacksList.forEach(callbacks => {
          if (callbacks.onClarificationResolved) {
            callbacks.onClarificationResolved(data);
          }
        });
        break;
      
      case 'new_message':
        console.log('💬 MULTI-AGENT WS - New message received:', data);
        this.callbacksList.forEach(callbacks => {
          if (callbacks.onNewMessage) {
            callbacks.onNewMessage(data);
          }
        });
        break;
      
      case 'task_completed':
      case 'formatting_completed':
        console.log('✅ MULTI-AGENT WS - Task completed:', data.task_id);
        this.callbacksList.forEach(callbacks => {
          if (callbacks.onTaskCompleted) {
            callbacks.onTaskCompleted(data);
          }
          if (callbacks.onFormattingCompleted) {
            callbacks.onFormattingCompleted(data);
          }
        });
        break;
        
      case 'pong':
        console.log('📡 MULTI-AGENT WS - Pong received');
        break;
      
      case 'test_message':
        console.log('🔥 DEBUG WS TEST - Test message received:', data.message);
        break;
      
      case 'gemini_browser_start':
        console.log('🌟 MULTI-AGENT WS - Gemini browser start signal received:', data);
        break;
        
      default:
        console.error('🔥 DEBUG WS HANDLE - Unknown message type:', data.type, 'Full message:', data);
    }
  }

  sendClarificationResponse(taskId: string, clarificationResponse: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'clarification_response',
        task_id: taskId,
        clarification_response: clarificationResponse,
        timestamp: new Date().toISOString()
      };
      
      console.log('📡 MULTI-AGENT WS - Sending clarification response:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('📡 MULTI-AGENT WS - Cannot send clarification response: WebSocket not connected');
    }
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.manualDisconnect) {
      return;
    }
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    console.log(`📡 MULTI-AGENT WS - Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.chatId && this.callbacksList.length > 0) {
        console.log(`📡 MULTI-AGENT WS - Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect(this.chatId, this.callbacksList[0]);
      }
    }, delay);
  }

  disconnect() {
    console.log('📡 MULTI-AGENT WS - Disconnecting...');
    this.manualDisconnect = true;
    this.stopPingInterval();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.chatId = null;
    this.callbacksList = [];
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
const multiAgentWebSocketService = new MultiAgentWebSocketService();

export default multiAgentWebSocketService;
export type { MultiAgentWSMessage, MultiAgentWSCallbacks };
