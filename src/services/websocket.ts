import { io, Socket } from 'socket.io-client';
import { notify } from './notifications';

export interface Message {
  id: string;
  content: string;
  type: 'user' | 'bot' | 'system';
  timestamp: Date;
  suggestions?: {
    links?: string[];
    documents?: string[];
  };
}

export interface ChatMessage {
  content: string;
  attachments: File[];
}

class WebSocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: Message) => void)[] = [];
  private responseResolver: ((value: Message) => void) | null = null;

  connect() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8000';
    console.log('Connecting to WebSocket:', wsUrl);
    
    // Don't specify the path in the options if it's already in the URL
    const hasPathInUrl = wsUrl.includes('/socket.io');
    
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true,
      reconnectionAttempts: 5,
      timeout: 10000,
      path: hasPathInUrl ? undefined : '/socket.io', // Only set path if not in URL
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket', this.socket?.id);
    });

    this.socket.on('connected', (data) => {
      console.log('Server confirmed connection:', data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      console.error('Connection details:', { 
        url: wsUrl, 
        transport: this.socket?.io?.engine?.transport?.name,
        protocol: window.location.protocol
      });
      notify.error(`Connection error: ${error.message}`);
    });

    this.socket.on('message', (message: Message | string) => {
      const parsedMessage: Message = typeof message === 'string' ? JSON.parse(message) : message;
      this.messageHandlers.forEach(handler => handler(parsedMessage));
      if (this.responseResolver) {
        this.responseResolver(parsedMessage);
        this.responseResolver = null;
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('typing', () => {
      this.messageHandlers.forEach(handler => handler({
        id: 'typing',
        content: 'AI is typing...',
        type: 'system',
        timestamp: new Date()
      }));
    });

    this.socket.on('error', (error: any) => {
      notify.error(`WebSocket error: ${error.message}`);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async sendMessage(message: ChatMessage): Promise<void> {
    if (!this.socket) {
      console.error('WebSocket is not connected');
      throw new Error('WebSocket is not connected');
    }
    console.log('Sending message:', message);
    this.socket.emit('message', message);
  }

  waitForResponse(): Promise<Message> {
    return new Promise((resolve) => {
      this.responseResolver = resolve;
    });
  }

  onMessage(handler: (message: Message) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }
}

export const websocketService = new WebSocketService();
