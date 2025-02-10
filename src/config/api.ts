// API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// API Endpoints
export const API_ENDPOINTS = {
  CHATS: `${BACKEND_URL}/chat/chats`,
  MESSAGES: `${BACKEND_URL}/chat/message`,
  SYSTEM_MESSAGE: `${BACKEND_URL}/chat/system-message`,
} as const;

// Helper function to construct full API URLs
export const getApiUrl = (endpoint: string): string => {
  return `${BACKEND_URL}${endpoint}`;
};

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (error.response) {
    return error.response.data?.message || 'Server error occurred';
  } else if (error.request) {
    return 'Unable to connect to server';
  } else {
    return error.message || 'An error occurred';
  }
};
