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
    this.socket = io('http://localhost:8000', {
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: true,
      reconnectionAttempts: 3,
      timeout: 5000
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('message', (message: Message | string) => {
      const parsedMessage: Message = typeof message === 'string' ? JSON.parse(message) : message;
      this.messageHandlers.forEach(handler => handler(parsedMessage));
      if (this.responseResolver) {
        this.responseResolver(parsedMessage);
        this.responseResolver = null;
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
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
      throw new Error('WebSocket is not connected');
    }
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
