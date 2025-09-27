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
}

interface MultiAgentWSCallbacks {
  onAgentStatus?: (data: MultiAgentWSMessage) => void;
  onClarificationRequest?: (data: MultiAgentWSMessage) => void;
  onWorkflowUpdate?: (data: MultiAgentWSMessage) => void;
  onClarificationResolved?: (data: MultiAgentWSMessage) => void;
  onConnectionEstablished?: (data: MultiAgentWSMessage) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

class MultiAgentWebSocketService {
  private ws: WebSocket | null = null;
  private callbacks: MultiAgentWSCallbacks = {};
  private chatId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    console.log('📡 MULTI-AGENT WS - Service initialized');
  }

  connect(chatId: string, callbacks: MultiAgentWSCallbacks = {}) {
    this.chatId = chatId;
    this.callbacks = callbacks;
    
    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + `/api/ws/multi-agent/${chatId}`;
      
      console.log('📡 MULTI-AGENT WS - Connecting to:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = (event) => {
        console.log('📡 MULTI-AGENT WS - Connected successfully');
        this.reconnectAttempts = 0;
        this.startPingInterval();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data: MultiAgentWSMessage = JSON.parse(event.data);
          console.log('📡 MULTI-AGENT WS - Received:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('📡 MULTI-AGENT WS - Parse error:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('📡 MULTI-AGENT WS - Connection closed:', event.code, event.reason);
        this.stopPingInterval();
        
        if (this.callbacks.onClose) {
          this.callbacks.onClose(event);
        }
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('📡 MULTI-AGENT WS - WebSocket error:', error);
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
      };
      
    } catch (error) {
      console.error('📡 MULTI-AGENT WS - Connection failed:', error);
    }
  }

  private handleMessage(data: MultiAgentWSMessage) {
    switch (data.type) {
      case 'connection_established':
        console.log('📡 MULTI-AGENT WS - Connection established for chat:', data.chatId);
        if (this.callbacks.onConnectionEstablished) {
          this.callbacks.onConnectionEstablished(data);
        }
        break;
        
      case 'workflow_update':
        console.log('📡 MULTI-AGENT WS - Workflow update:', data);
        if (this.callbacks.onWorkflowUpdate) {
          this.callbacks.onWorkflowUpdate(data);
        }
        
        // Handle specific workflow update types
        if (data.agent_type && this.callbacks.onAgentStatus) {
          this.callbacks.onAgentStatus(data);
        }
        break;
        
      case 'agent_status':
        console.log('📡 MULTI-AGENT WS - Agent status:', data.agent_type, data.status);
        if (this.callbacks.onAgentStatus) {
          this.callbacks.onAgentStatus(data);
        }
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
        console.log('🔥 DEBUG WS SERVICE - onClarificationRequest callback exists:', !!this.callbacks.onClarificationRequest);
        if (this.callbacks.onClarificationRequest) {
          console.log('🔥 DEBUG WS SERVICE - Calling onClarificationRequest callback');
          this.callbacks.onClarificationRequest(data);
          console.log('🔥 DEBUG WS SERVICE - onClarificationRequest callback completed');
        } else {
          console.error('🔥 DEBUG WS SERVICE - No onClarificationRequest callback registered!');
        }
        break;
        
      case 'clarification_resolved':
        console.log('📡 MULTI-AGENT WS - Clarification resolved');
        if (this.callbacks.onClarificationResolved) {
          this.callbacks.onClarificationResolved(data);
        }
        break;
        
      case 'pong':
        console.log('📡 MULTI-AGENT WS - Pong received');
        break;
        
      default:
        console.log('📡 MULTI-AGENT WS - Unknown message type:', data.type);
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
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    console.log(`📡 MULTI-AGENT WS - Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.chatId) {
        console.log(`📡 MULTI-AGENT WS - Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect(this.chatId, this.callbacks);
      }
    }, delay);
  }

  disconnect() {
    console.log('📡 MULTI-AGENT WS - Disconnecting...');
    this.stopPingInterval();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.chatId = null;
    this.callbacks = {};
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
