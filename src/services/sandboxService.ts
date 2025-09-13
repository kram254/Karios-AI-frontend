interface SandboxSession {
  session_id: string;
  automation_type: string;
  capabilities: string[];
  services: Record<string, boolean>;
  live_view_url?: string;
  status?: string;
  created_at?: number;
}

interface WorkflowStep {
  type: string;
  target?: string;
  description?: string;
  text?: string;
  value?: string;
  key?: string;
  coordinates?: { x: number; y: number };
  direction?: string;
  duration?: number;
}

interface WorkflowResult {
  step: number;
  type: string;
  result: any;
  success: boolean;
  service_used: string;
}

interface CreateSessionRequest {
  automation_type?: string;
  context_name?: string;
  proxy_enabled?: boolean;
  record_session?: boolean;
}

interface ExecuteWorkflowRequest {
  session_id: string;
  workflow_steps: WorkflowStep[];
  execution_strategy?: string;
}

interface CreateWorkflowRequest {
  session_id: string;
  user_goal: string;
}

interface WorkflowSummary {
  total_steps: number;
  successful_steps: number;
  failed_steps: number;
  success_rate: number;
}

interface ExecutionResult {
  success: boolean;
  session_id: string;
  execution_strategy: string;
  results: WorkflowResult[];
  screenshots: Array<{
    step: number;
    screenshot: string;
    description: string;
  }>;
  summary: WorkflowSummary;
  capabilities_used: string[];
}

class SandboxService {
  private baseUrl: string;
  private sessions: Map<string, SandboxSession> = new Map();

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000';
  }

  async createSession(request: CreateSessionRequest = {}): Promise<SandboxSession> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sandbox/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          automation_type: request.automation_type || 'hybrid',
          context_name: request.context_name,
          proxy_enabled: request.proxy_enabled || false,
          record_session: request.record_session !== false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create sandbox session');
      }

      const sessionData = await response.json();
      
      const session: SandboxSession = {
        session_id: sessionData.session_id,
        automation_type: sessionData.automation_type,
        capabilities: sessionData.capabilities || [],
        services: sessionData.services || {},
        live_view_url: sessionData.live_view_url,
        status: 'active',
        created_at: Date.now(),
      };

      this.sessions.set(session.session_id, session);
      return session;
    } catch (error) {
      console.error('Failed to create sandbox session:', error);
      throw error;
    }
  }

  async executeWorkflow(request: ExecuteWorkflowRequest): Promise<ExecutionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sandbox/execute-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: request.session_id,
          workflow_steps: request.workflow_steps,
          execution_strategy: request.execution_strategy || 'adaptive',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to execute sandbox workflow');
      }

      const result = await response.json();
      return result as ExecutionResult;
    } catch (error) {
      console.error('Failed to execute sandbox workflow:', error);
      throw error;
    }
  }

  async createAdaptiveWorkflow(request: CreateWorkflowRequest): Promise<{
    success: boolean;
    session_id: string;
    user_goal: string;
    workflow: {
      goal: string;
      steps: WorkflowStep[];
      capabilities: string[];
      strategy: string;
    };
    step_count: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sandbox/create-adaptive-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: request.session_id,
          user_goal: request.user_goal,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create adaptive workflow');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create adaptive workflow:', error);
      throw error;
    }
  }

  async getSessionInfo(sessionId: string): Promise<SandboxSession> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sandbox/session/${sessionId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get session info');
      }

      const sessionData = await response.json();
      
      const session: SandboxSession = {
        session_id: sessionData.session_id,
        automation_type: sessionData.type,
        capabilities: sessionData.capabilities || [],
        services: sessionData.services || {},
        live_view_url: sessionData.live_view_url,
        status: sessionData.status,
        created_at: sessionData.created_at,
      };

      this.sessions.set(session.session_id, session);
      return session;
    } catch (error) {
      console.error('Failed to get session info:', error);
      throw error;
    }
  }

  async getActiveSessions(): Promise<{
    active_sessions: string[];
    session_count: number;
    sessions: Record<string, {
      id: string;
      type: string;
      status: string;
      capabilities: string[];
      created_at: number;
    }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sandbox/sessions`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get active sessions');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      throw error;
    }
  }

  async getLiveViewUrl(sessionId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sandbox/session/${sessionId}/live-view-url`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get live view URL');
      }

      const result = await response.json();
      return result.live_view_url;
    } catch (error) {
      console.error('Failed to get live view URL:', error);
      return null;
    }
  }

  async terminateSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sandbox/session/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to terminate session');
      }

      this.sessions.delete(sessionId);
      return true;
    } catch (error) {
      console.error('Failed to terminate session:', error);
      throw error;
    }
  }

  async cleanupAllSessions(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sandbox/cleanup-all`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to cleanup all sessions');
      }

      this.sessions.clear();
      return true;
    } catch (error) {
      console.error('Failed to cleanup all sessions:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{
    success: boolean;
    sandbox_manager_initialized: boolean;
    active_sessions: number;
    capabilities: string[];
    status: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sandbox/health`);
      return await response.json();
    } catch (error) {
      console.error('Sandbox health check failed:', error);
      return {
        success: false,
        sandbox_manager_initialized: false,
        active_sessions: 0,
        capabilities: [],
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getLocalSession(sessionId: string): SandboxSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllLocalSessions(): SandboxSession[] {
    return Array.from(this.sessions.values());
  }

  createWorkflowFromGoal(userGoal: string): WorkflowStep[] {
    const goal = userGoal.toLowerCase();
    const steps: WorkflowStep[] = [];

    steps.push({
      type: 'screenshot',
      description: 'Take initial screenshot to analyze the page'
    });

    if (goal.includes('search')) {
      const searchTerm = this.extractSearchTerm(userGoal);
      steps.push(
        {
          type: 'smart_click',
          target: 'search input field',
          description: 'Click on search input field'
        },
        {
          type: 'smart_fill',
          target: 'search input field',
          text: searchTerm,
          description: `Enter search term: ${searchTerm}`
        },
        {
          type: 'key',
          key: 'Return',
          description: 'Press Enter to submit search'
        },
        {
          type: 'wait',
          duration: 3,
          description: 'Wait for search results to load'
        }
      );
    } else if (goal.includes('click')) {
      const target = this.extractClickTarget(userGoal);
      steps.push({
        type: 'smart_click',
        target: target,
        description: `Click on ${target}`
      });
    } else if (goal.includes('fill') || goal.includes('enter')) {
      const text = this.extractText(userGoal);
      const field = this.extractField(userGoal);
      steps.push(
        {
          type: 'smart_click',
          target: field,
          description: `Click on ${field} field`
        },
        {
          type: 'smart_fill',
          target: field,
          text: text,
          description: `Enter text: ${text}`
        }
      );
    } else if (goal.includes('scroll')) {
      const direction = goal.includes('up') ? 'up' : 'down';
      steps.push({
        type: 'scroll',
        direction: direction,
        coordinates: { x: 960, y: 540 },
        description: `Scroll ${direction}`
      });
    }

    steps.push({
      type: 'screenshot',
      description: 'Take final screenshot to capture results'
    });

    return steps;
  }

  private extractSearchTerm(goal: string): string {
    const searchPatterns = [
      /search for (.+)/i,
      /find (.+)/i,
      /look for (.+)/i
    ];

    for (const pattern of searchPatterns) {
      const match = goal.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return goal.split(' ').slice(-3).join(' ');
  }

  private extractClickTarget(goal: string): string {
    const clickPatterns = [
      /click (?:on )?(.+)/i,
      /press (.+)/i,
      /tap (.+)/i
    ];

    for (const pattern of clickPatterns) {
      const match = goal.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'button';
  }

  private extractText(goal: string): string {
    const textPatterns = [
      /enter "(.+)"/i,
      /type "(.+)"/i,
      /fill with "(.+)"/i,
      /input "(.+)"/i
    ];

    for (const pattern of textPatterns) {
      const match = goal.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return goal.split(' ').slice(-2).join(' ');
  }

  private extractField(goal: string): string {
    const fieldPatterns = [
      /(?:in|into) (?:the )?(.+) (?:field|input|box)/i,
      /fill (.+) (?:field|input|box)/i
    ];

    for (const pattern of fieldPatterns) {
      const match = goal.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    if (goal.includes('email')) return 'email field';
    if (goal.includes('password')) return 'password field';
    if (goal.includes('username')) return 'username field';
    if (goal.includes('name')) return 'name field';

    return 'input field';
  }
}

export const sandboxService = new SandboxService();

export type {
  SandboxSession,
  WorkflowStep,
  WorkflowResult,
  CreateSessionRequest,
  ExecuteWorkflowRequest,
  CreateWorkflowRequest,
  ExecutionResult,
  WorkflowSummary,
};
