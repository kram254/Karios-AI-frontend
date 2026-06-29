import { API_BASE_URL } from '../config/api';

export interface Suggestion {
  type: 'action' | 'clarification' | 'related' | 'expansion';
  text: string;
  action: string;
}

export interface PersonalizationStatus {
  active: boolean;
  phase: number;
  interaction_count?: number;
  instructions?: string;
  preferences_summary?: {
    length: string;
    tone: string;
    technical: string;
  };
  top_interests?: string[];
}

export interface FeedbackPayload {
  message_id: string;
  feedback_type: string;
  value: any;
}

class UserLearningService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async submitFeedback(chatId: string, feedback: FeedbackPayload): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/${chatId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  }

  async getSuggestions(chatId: string, lastResponse: string): Promise<Suggestion[]> {
    try {
      const params = new URLSearchParams({ last_response: lastResponse });
      const response = await fetch(
        `${this.baseUrl}/chat/${chatId}/suggestions?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }
      
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  async getPersonalizationStatus(chatId: string): Promise<PersonalizationStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/chat/${chatId}/personalization`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get personalization status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting personalization:', error);
      return { active: false, phase: 0 };
    }
  }
}

export const userLearningService = new UserLearningService();
export default userLearningService;
