import { websocketStateManager } from './websocketStateManager.service';

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
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  get chatId(): string | null {
    return this.activeChatId;
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
        connection.reconnectAttempts = 0;
        connection.manualDisconnect = false;
        websocketStateManager.markConnected(chatId);
        this.startPingInterval(chatId);
      };
      
      ws.onmessage = (event) => {
        try {
          const data: MultiAgentWSMessage = JSON.parse(event.data);
          console.log('🔥 WS MULTI RECEIVE - Chat:', chatId.slice(0, 8), 'Type:', data.type);
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
          this.scheduleReconnect(chatId);
        } else {
          this.connections.delete(chatId);
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

  private handleMessage(data: MultiAgentWSMessage, chatId: string) {
    console.log('🔥 DEBUG WS HANDLE - handleMessage called with type:', data.type);
    console.log('🔥 DEBUG WS HANDLE - Full data object:', data);
    
    const connection = this.connections.get(chatId);
    if (!connection) {
      console.warn('🔥 WS MULTI - No connection found for chat:', chatId.slice(0, 8));
      return;
    }
    
    const callbacks = connection.callbacks;
    
    switch (data.type) {
      case 'workflow_started':
        console.log('🚀🚀🚀🚀 MULTI-AGENT WS - Workflow started:', data.task_id);
        if (callbacks.onWorkflowStarted) {
          callbacks.onWorkflowStarted(data);
        }
        break;
        
      case 'agent_status':
        console.log('📡 MULTI-AGENT WS - Agent status:', data.agent_type, data.status);
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
        console.log('📡 MULTI-AGENT WS - Pong received');
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
    console.log('🔥 WS MULTI - Remaining connections:', this.connections.size);
  }

  disconnect() {
    console.log('📡 WS MULTI - Disconnecting all connections');
    this.connections.forEach((connection, chatId) => {
      this.disconnectChat(chatId);
    });
  }

  private scheduleReconnect(chatId: string) {
    const connection = this.connections.get(chatId);
    if (!connection) return;
    
    connection.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, connection.reconnectAttempts - 1);
    
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
}

const multiAgentWebSocketMultiService = new MultiAgentWebSocketMultiService();
export default multiAgentWebSocketMultiService;
export type { MultiAgentWSMessage, MultiAgentWSCallbacks };
