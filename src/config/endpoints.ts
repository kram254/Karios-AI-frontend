export enum Environment {
  PRODUCTION = 'PRODUCTION',
  DEV = 'DEV',
  TEST = 'TEST'
}

export class Endpoints {
  static environment: Environment = Environment.DEV;

  static get SOCKET_PATH() {
    switch (this.environment) {
      case Environment.PRODUCTION:
        return '/socket.io';
      case Environment.DEV:
        return '/socket.io';
      case Environment.TEST:
        return '/socket.io';
      default:
        throw new Error('Unknown environment');
    }
  }

  static get BASE_URL() {
    switch (this.environment) {
      case Environment.PRODUCTION:
        return 'https://agentando-ai-backend.onrender.com';
      case Environment.DEV:
        return 'https://agentando-ai-backend-updated.onrender.com';
      case Environment.TEST:
        return 'http://localhost:8000';
      default:
        throw new Error('Unknown environment');
    }
  }

  static get SOCKET_URL() {
    return this.BASE_URL;
  }

  // Log configuration for debugging
  static logConfig() {
    console.log('=== API Configuration ===');
    console.log('Environment:', this.environment);
    console.log('Base URL:', this.BASE_URL);
    console.log('Socket URL:', this.SOCKET_URL);
    console.log('Socket Path:', this.SOCKET_PATH);
    console.log('=======================');
  }

  // Chat Endpoints
  static get CHAT_ENDPOINTS() {
    return {
      CREATE_CHAT: `${this.BASE_URL}/api/chat/chats`,
      GET_ALL_CHATS: `${this.BASE_URL}/api/chat/chats`,
      GET_CHAT: (chatId: string) => `${this.BASE_URL}/api/chat/chats/${chatId}`,
      DELETE_CHAT: (chatId: string) => `${this.BASE_URL}/api/chat/chats/${chatId}`,
      UPDATE_CHAT_TITLE: (chatId: string) => `${this.BASE_URL}/api/chat/chats/${chatId}/title`,
      ADD_MESSAGE: (chatId: string) => `${this.BASE_URL}/api/chat/chats/${chatId}/messages`,
      GET_CHAT_STATUS: `${this.BASE_URL}/api/chat/status`,
      GET_SYSTEM_MESSAGE: `${this.BASE_URL}/api/chat/system-message`,
      UPDATE_SYSTEM_MESSAGE: `${this.BASE_URL}/api/chat/system-message`
    };
  }

  // Admin Endpoints
  static get ADMIN_ENDPOINTS() {
    return {
      CREATE_AGENT: `${this.BASE_URL}/api/admin/agents`,
      GET_ALL_AGENTS: `${this.BASE_URL}/api/admin/agents`,
      GET_AGENT: (agentId: string) => `${this.BASE_URL}/api/admin/agents/${agentId}`,
      UPDATE_AGENT: (agentId: string) => `${this.BASE_URL}/api/admin/agents/${agentId}`,
      DELETE_AGENT: (agentId: string) => `${this.BASE_URL}/api/admin/agents/${agentId}`
    };
  }

  // Retrieve Endpoints
  static get RETRIEVE_ENDPOINTS() {
    return {
      SEARCH_KNOWLEDGE: `${this.BASE_URL}/api/retrieve/search`,
      UPDATE_KNOWLEDGE: `${this.BASE_URL}/api/retrieve/update`,
      GET_KNOWLEDGE_STATUS: `${this.BASE_URL}/api/retrieve/status`
    };
  }

  // Helper method to switch environments
  static setEnvironment(env: Environment) {
    this.environment = env;
    this.logConfig();
  }
}
