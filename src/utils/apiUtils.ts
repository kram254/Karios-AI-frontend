/**
 * Utility functions for API interactions
 */

/**
 * Checks if an API endpoint is responsive
 * @param url The URL to check
 * @returns Promise resolving to boolean indicating if the endpoint is alive
 */
export const checkApiEndpoint = async (url: string): Promise<boolean> => {
  try {
    console.log(`🔍 Checking API endpoint status: ${url}`);
    
    // Use a simple GET request to the root of the API to check if it's alive
    // Add a random query param to prevent caching
    // The backend has a root endpoint (/) that returns status
    const checkUrl = `${url}?t=${Date.now()}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(checkUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Log the result
    console.log(`📡 API endpoint check result for ${url}: ${response.status} ${response.statusText}`);
    
    // Consider 2xx responses as successful
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    // If there's an error (network error, timeout, etc.), the API is not responsive
    console.warn(`⚠️ API endpoint check failed for ${url}:`, error);
    return false;
  }
};

/**
 * Helper function to determine the appropriate base URL for API requests
 * @returns The base URL to use for API requests
 */
export const getApiBaseUrl = (): string => {
  // Always read from the typed env config — no hardcoded URLs here.
  // Set VITE_BACKEND_URL in .env.development / .env.production.
  return import.meta.env.VITE_BACKEND_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '');
};
