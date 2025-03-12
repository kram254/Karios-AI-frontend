// Configuration of endpoints for different environments
interface ChatEndpoints {
  GET_ALL_CHATS: string;
  CREATE_CHAT: string;
  GET_CHAT: (id: string) => string;
  DELETE_CHAT: (id: string) => string;
  UPDATE_CHAT_TITLE: (id: string) => string;
  ADD_MESSAGE: (id: string) => string;
}

interface AdminEndpoints {
  GET_ALL_AGENTS: string;
  CREATE_AGENT: string;
  GET_AGENT: (id: string) => string;
  UPDATE_AGENT: (id: string) => string;
  DELETE_AGENT: (id: string) => string;
}

interface RetrieveEndpoints {
  SEARCH: string;
}

interface EndpointsConfig {
  API_BASE_URL: string;
  CHAT_ENDPOINTS: ChatEndpoints;
  ADMIN_ENDPOINTS: AdminEndpoints;
  RETRIEVE_ENDPOINTS: RetrieveEndpoints;
}

// Environment types
export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

export class Endpoints {
  // Current environment
  public static environment: Environment = Environment.DEVELOPMENT;

  // Endpoint configurations for each environment
  private static configs: Record<Environment, EndpointsConfig> = {
    [Environment.DEVELOPMENT]: {
      API_BASE_URL: 'http://127.0.0.1:8000',
      CHAT_ENDPOINTS: {
        GET_ALL_CHATS: '/api/chat/chats',
        CREATE_CHAT: '/api/chat/chats',
        GET_CHAT: (id: string) => `/api/chat/chats/${id}`,
        DELETE_CHAT: (id: string) => `/api/chat/chats/${id}`,
        UPDATE_CHAT_TITLE: (id: string) => `/api/chat/chats/${id}/title`,
        ADD_MESSAGE: (id: string) => `/api/chat/chats/${id}/messages`,
      },
      ADMIN_ENDPOINTS: {
        GET_ALL_AGENTS: '/api/v1/agents',
        CREATE_AGENT: '/api/v1/agents',
        GET_AGENT: (id: string) => `/api/v1/agents/${id}`,
        UPDATE_AGENT: (id: string) => `/api/v1/agents/${id}`,
        DELETE_AGENT: (id: string) => `/api/v1/agents/${id}`,
      },
      RETRIEVE_ENDPOINTS: {
        SEARCH: '/api/retrieve/search',
      },
    },
    [Environment.PRODUCTION]: {
      API_BASE_URL: 'https://agentando-ai-backend-updated.onrender.com',
      CHAT_ENDPOINTS: {
        GET_ALL_CHATS: '/api/chat/chats',
        CREATE_CHAT: '/api/chat/chats',
        GET_CHAT: (id: string) => `/api/chat/chats/${id}`,
        DELETE_CHAT: (id: string) => `/api/chat/chats/${id}`,
        UPDATE_CHAT_TITLE: (id: string) => `/api/chat/chats/${id}/title`,
        ADD_MESSAGE: (id: string) => `/api/chat/chats/${id}/messages`,
      },
      ADMIN_ENDPOINTS: {
        GET_ALL_AGENTS: '/api/v1/agents',
        CREATE_AGENT: '/api/v1/agents',
        GET_AGENT: (id: string) => `/api/v1/agents/${id}`,
        UPDATE_AGENT: (id: string) => `/api/v1/agents/${id}`,
        DELETE_AGENT: (id: string) => `/api/v1/agents/${id}`,
      },
      RETRIEVE_ENDPOINTS: {
        SEARCH: '/api/retrieve/search',
      },
    },
  };

  // Get current config
  public static get currentConfig(): EndpointsConfig {
    return this.configs[this.environment];
  }

  // Set environment
  public static setEnvironment(env: Environment): void {
    this.environment = env;
    console.log(`Environment set to ${env}`);
  }

  // Get API base URL
  public static get API_BASE_URL(): string {
    return this.currentConfig.API_BASE_URL;
  }

  // Get chat endpoints
  public static get CHAT_ENDPOINTS(): ChatEndpoints {
    return this.currentConfig.CHAT_ENDPOINTS;
  }

  // Get admin endpoints
  public static get ADMIN_ENDPOINTS(): AdminEndpoints {
    return this.currentConfig.ADMIN_ENDPOINTS;
  }

  // Get retrieve endpoints
  public static get RETRIEVE_ENDPOINTS(): RetrieveEndpoints {
    return this.currentConfig.RETRIEVE_ENDPOINTS;
  }
}
