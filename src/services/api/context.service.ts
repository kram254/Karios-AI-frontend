import { api } from './index';
import { AxiosResponse } from 'axios';

export interface ContextLayer {
  id: string;
  type: 'domain' | 'industry' | 'knowledge' | 'memory' | 'session' | 'template';
  name: string;
  content: string;
  tokenCount?: number;
  score?: number;
}

export interface ContextState {
  quality: {
    score: number;
    state: 'initial' | 'information_gathering' | 'clarification' | 'solution_providing' | 'follow_up';
    hasMemory: boolean;
    tokenCount: number;
  };
  layers: ContextLayer[];
}

export interface ContextValidation {
  valid: boolean;
  score: number;
  suggestions: string[];
  tokenCount: number;
}

export interface ContextTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

class ContextService {
  /**
   * Get the current context state for a specific chat session
   */
  getContextState(chatId: string): Promise<AxiosResponse<ContextState>> {
    return api.get(`/api/v1/context/${chatId}/state`);
  }

  /**
   * Validate a context template or content
   */
  validateContext(content: string): Promise<AxiosResponse<ContextValidation>> {
    return api.post('/api/v1/context/validate', { content });
  }

  /**
   * Get available context templates
   */
  getTemplates(): Promise<AxiosResponse<ContextTemplate[]>> {
    return api.get('/api/v1/context/templates');
  }

  /**
   * Get a specific template by ID
   */
  getTemplate(templateId: string): Promise<AxiosResponse<ContextTemplate>> {
    return api.get(`/api/v1/context/templates/${templateId}`);
  }

  /**
   * Create a new context template
   */
  createTemplate(template: Omit<ContextTemplate, 'id'>): Promise<AxiosResponse<ContextTemplate>> {
    return api.post('/api/v1/context/templates', template);
  }

  /**
   * Update an existing context template
   */
  updateTemplate(templateId: string, template: Partial<ContextTemplate>): Promise<AxiosResponse<ContextTemplate>> {
    return api.put(`/api/v1/context/templates/${templateId}`, template);
  }

  /**
   * Delete a context template
   */
  deleteTemplate(templateId: string): Promise<AxiosResponse<void>> {
    return api.delete(`/api/v1/context/templates/${templateId}`);
  }
  
  /**
   * Get context analysis for a specific message in a chat
   */
  getMessageContextAnalysis(chatId: string, messageId: string): Promise<AxiosResponse<ContextState>> {
    return api.get(`/api/v1/context/${chatId}/messages/${messageId}/analysis`);
  }
}

export const contextService = new ContextService();
