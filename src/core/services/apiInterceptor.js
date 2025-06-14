import { rateLimiter, RateLimitError } from '../../utils/rateLimiter';

/**
 * API Interceptor for Supabase requests
 * Applies rate limiting and error handling
 */

/**
 * Create an intercepted fetch function
 * @param {Function} originalFetch - The original fetch function
 * @returns {Function} Intercepted fetch function
 */
export function createInterceptedFetch(originalFetch = fetch) {
  return async function interceptedFetch(url, options = {}) {
    // Extract endpoint from URL
    const endpoint = extractEndpoint(url);
    
    // Skip rate limiting for non-API requests
    if (!isApiRequest(url)) {
      return originalFetch(url, options);
    }

    // Apply rate limiting
    try {
      const response = await rateLimiter.executeWithRetry(
        endpoint,
        async () => {
          const response = await originalFetch(url, options);
          
          // Handle rate limit response from server
          if (response.status === 429) {
            const error = new Error('Rate limit exceeded');
            error.status = 429;
            error.headers = response.headers;
            throw error;
          }
          
          return response;
        },
        {
          signal: options.signal,
          onRetry: (attempt, delay) => {
            console.warn(`Rate limit retry ${attempt} for ${endpoint}, waiting ${delay}ms`);
          }
        }
      );
      
      return response;
    } catch (error) {
      if (error instanceof RateLimitError) {
        // Create a rate limit response
        return new Response(
          JSON.stringify({
            error: error.message,
            waitTime: error.waitTime,
            retryAfter: error.retryAfter
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': error.waitTime.toString()
            }
          }
        );
      }
      
      throw error;
    }
  };
}

/**
 * Extract endpoint from URL
 * @param {string} url - The full URL
 * @returns {string} The endpoint path
 */
function extractEndpoint(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove API version prefix
    const endpoint = pathname.replace(/^\/rest\/v\d+/, '');
    
    return endpoint || '/';
  } catch {
    return '/';
  }
}

/**
 * Check if URL is an API request
 * @param {string} url - The URL to check
 * @returns {boolean}
 */
function isApiRequest(url) {
  try {
    const urlObj = new URL(url);
    // Check if it's a Supabase API request
    return urlObj.pathname.includes('/rest/') || 
           urlObj.pathname.includes('/auth/') ||
           urlObj.pathname.includes('/storage/');
  } catch {
    return false;
  }
}

/**
 * Apply rate limiting to Supabase client
 * @param {Object} supabaseClient - The Supabase client instance
 */
export function applyRateLimiting(supabaseClient) {
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Replace global fetch with intercepted version
  window.fetch = createInterceptedFetch(originalFetch);
  
  // Return cleanup function
  return () => {
    window.fetch = originalFetch;
  };
}

/**
 * Rate limit middleware for custom API calls
 * @param {Function} apiCall - The API call function
 * @param {string} endpoint - The endpoint identifier
 * @returns {Function} Wrapped API call with rate limiting
 */
export function withRateLimit(apiCall, endpoint) {
  return async (...args) => {
    return rateLimiter.executeWithRetry(
      endpoint,
      () => apiCall(...args),
      {
        onRetry: (attempt, delay) => {
          console.warn(`API retry ${attempt} for ${endpoint}, waiting ${delay}ms`);
        }
      }
    );
  };
}

/**
 * Hook to monitor rate limit status
 * @returns {Object} Rate limit statistics
 */
export function useRateLimitStatus() {
  return rateLimiter.getStats();
}