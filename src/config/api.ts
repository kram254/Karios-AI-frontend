// API Configuration
export const API_BASE_URL = 'https://agentando-ai-backend.onrender.com';

// API Endpoints
export const API_ENDPOINTS = {
  CHATS: '/api/chat/chats',
  MESSAGES: '/api/chat/message',
  SYSTEM_MESSAGE: '/api/chat/system-message',
} as const;

// Helper function to construct full API URLs
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with a status code outside the 2xx range
    return error.response.data.message || 'Server error occurred';
  } else if (error.request) {
    // Request was made but no response received
    return 'No response from server';
  } else {
    // Something happened in setting up the request
    return error.message || 'An error occurred';
  }
};
