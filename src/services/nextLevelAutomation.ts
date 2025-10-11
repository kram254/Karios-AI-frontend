const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AutomationCapabilities {
  gemini_available: boolean;
  stagehand_available: boolean;
  claude_available: boolean;
  orchestrator_available: boolean;
  recommended_strategy?: string;
}

export interface AutomationStrategy {
  name: string;
  description: string;
  best_for: string[];
  cost: string;
}

export interface WorkflowRequest {
  user_instruction: string;
  workflow_steps?: any[];
  strategy?: string;
  context?: Record<string, any>;
}

export interface WorkflowResult {
  success: boolean;
  strategy?: string;
  data?: any;
  error?: string;
  steps?: any[];
}

class NextLevelAutomationService {
  async getCapabilities(): Promise<AutomationCapabilities> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/next-level-automation/capabilities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch capabilities');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching capabilities:', error);
      return {
        gemini_available: false,
        stagehand_available: false,
        claude_available: false,
        orchestrator_available: false,
      };
    }
  }

  async getAvailableStrategies(): Promise<AutomationStrategy[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/next-level-automation/strategies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch strategies');
      }
      
      const data = await response.json();
      return data.strategies || [];
    } catch (error) {
      console.error('Error fetching strategies:', error);
      return [];
    }
  }

  async executeWorkflow(request: WorkflowRequest): Promise<WorkflowResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/next-level-automation/unified/execute-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Workflow execution failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error executing workflow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async executeGeminiAction(instruction: string, screenshot: string, url?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/next-level-automation/gemini/execute-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction,
          screenshot_base64: screenshot,
          current_url: url,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Gemini action execution failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error executing Gemini action:', error);
      throw error;
    }
  }

  async executeStagehandAction(instruction: string, actionType: string, schema?: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/next-level-automation/stagehand/execute-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction,
          action_type: actionType,
          schema,
          headless: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Stagehand action execution failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error executing Stagehand action:', error);
      throw error;
    }
  }

  async executeClaudeTask(instruction: string, tools?: string[], maxIterations: number = 10): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/next-level-automation/claude/execute-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction,
          task_type: 'general',
          tools: tools || ['bash', 'file_read', 'file_write', 'web_search'],
          max_iterations: maxIterations,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Claude task execution failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error executing Claude task:', error);
      throw error;
    }
  }

  async testGeminiConnection(): Promise<{ available: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/next-level-automation/test-gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Test failed');
      }
      
      return await response.json();
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testClaudeConnection(): Promise<{ available: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/next-level-automation/test-claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Test failed');
      }
      
      return await response.json();
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testStagehandConnection(): Promise<{ available: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/next-level-automation/test-stagehand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Test failed');
      }
      
      return await response.json();
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const nextLevelAutomationService = new NextLevelAutomationService();
