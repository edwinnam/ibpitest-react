/**
 * Rate Limiter for API requests
 * Implements client-side rate limiting to prevent API abuse
 */

class RateLimiter {
  constructor() {
    this.requests = new Map(); // Store request timestamps by endpoint
    this.retryQueue = new Map(); // Store retry attempts
    this.config = {
      defaultLimit: 10, // Default requests per window
      defaultWindow: 60000, // Default window in ms (1 minute)
      retryDelay: 1000, // Initial retry delay in ms
      maxRetries: 3, // Maximum retry attempts
      backoffMultiplier: 2, // Exponential backoff multiplier
      // Endpoint-specific limits
      endpoints: {
        '/auth/login': { limit: 5, window: 300000 }, // 5 attempts per 5 minutes
        '/auth/reset-password': { limit: 3, window: 300000 }, // 3 attempts per 5 minutes
        '/auth/mfa/verify': { limit: 5, window: 60000 }, // 5 attempts per minute
        '/test_codes': { limit: 20, window: 60000 }, // 20 requests per minute
        '/test_results': { limit: 30, window: 60000 }, // 30 requests per minute
        '/reports': { limit: 10, window: 60000 }, // 10 requests per minute
        'default': { limit: 60, window: 60000 } // 60 requests per minute for others
      }
    };
  }

  /**
   * Get configuration for a specific endpoint
   * @param {string} endpoint - The API endpoint
   * @returns {Object} Rate limit configuration
   */
  getEndpointConfig(endpoint) {
    // Find matching endpoint pattern
    for (const [pattern, config] of Object.entries(this.config.endpoints)) {
      if (pattern === 'default') continue;
      if (endpoint.includes(pattern)) {
        return config;
      }
    }
    return this.config.endpoints.default;
  }

  /**
   * Check if request is allowed
   * @param {string} endpoint - The API endpoint
   * @returns {Object} { allowed: boolean, waitTime: number, reason: string }
   */
  checkLimit(endpoint) {
    const config = this.getEndpointConfig(endpoint);
    const now = Date.now();
    const windowStart = now - config.window;

    // Get or initialize request history for this endpoint
    if (!this.requests.has(endpoint)) {
      this.requests.set(endpoint, []);
    }

    const requestHistory = this.requests.get(endpoint);
    
    // Remove old requests outside the window
    const validRequests = requestHistory.filter(timestamp => timestamp > windowStart);
    this.requests.set(endpoint, validRequests);

    // Check if limit exceeded
    if (validRequests.length >= config.limit) {
      const oldestRequest = validRequests[0];
      const waitTime = oldestRequest + config.window - now;
      
      return {
        allowed: false,
        waitTime: Math.ceil(waitTime / 1000), // Convert to seconds
        reason: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
        retryAfter: new Date(now + waitTime).toISOString()
      };
    }

    return {
      allowed: true,
      remaining: config.limit - validRequests.length,
      resetAt: new Date(windowStart + config.window).toISOString()
    };
  }

  /**
   * Record a request
   * @param {string} endpoint - The API endpoint
   */
  recordRequest(endpoint) {
    const now = Date.now();
    
    if (!this.requests.has(endpoint)) {
      this.requests.set(endpoint, []);
    }
    
    this.requests.get(endpoint).push(now);
  }

  /**
   * Handle rate-limited request with retry logic
   * @param {string} endpoint - The API endpoint
   * @param {Function} requestFn - The function to execute the request
   * @param {Object} options - Additional options
   * @returns {Promise} The request result
   */
  async executeWithRetry(endpoint, requestFn, options = {}) {
    const { 
      maxRetries = this.config.maxRetries,
      onRetry = () => {},
      signal
    } = options;

    let retryCount = 0;
    let lastError = null;

    while (retryCount <= maxRetries) {
      // Check if request was aborted
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }

      // Check rate limit
      const limitCheck = this.checkLimit(endpoint);
      
      if (!limitCheck.allowed) {
        if (retryCount >= maxRetries) {
          throw new RateLimitError(
            `Rate limit exceeded after ${maxRetries} retries`,
            limitCheck.waitTime,
            limitCheck.retryAfter
          );
        }

        // Wait before retry
        const delay = limitCheck.waitTime * 1000;
        await this.delay(delay);
        retryCount++;
        onRetry(retryCount, delay);
        continue;
      }

      try {
        // Record request and execute
        this.recordRequest(endpoint);
        const result = await requestFn();
        
        // Clear retry count on success
        this.retryQueue.delete(endpoint);
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Check if error is rate limit from server
        if (error.status === 429) {
          const retryAfter = error.headers?.get('Retry-After');
          const delay = retryAfter 
            ? parseInt(retryAfter) * 1000 
            : this.config.retryDelay * Math.pow(this.config.backoffMultiplier, retryCount);
          
          if (retryCount >= maxRetries) {
            throw new RateLimitError(
              'Server rate limit exceeded',
              Math.ceil(delay / 1000),
              new Date(Date.now() + delay).toISOString()
            );
          }

          await this.delay(delay);
          retryCount++;
          onRetry(retryCount, delay);
          continue;
        }

        // For other errors, throw immediately
        throw error;
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset rate limits for an endpoint
   * @param {string} endpoint - The API endpoint
   */
  reset(endpoint) {
    if (endpoint) {
      this.requests.delete(endpoint);
      this.retryQueue.delete(endpoint);
    } else {
      this.requests.clear();
      this.retryQueue.clear();
    }
  }

  /**
   * Get current usage statistics
   * @returns {Object} Usage stats by endpoint
   */
  getStats() {
    const stats = {};
    
    for (const [endpoint, requests] of this.requests.entries()) {
      const config = this.getEndpointConfig(endpoint);
      const now = Date.now();
      const windowStart = now - config.window;
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      
      stats[endpoint] = {
        used: validRequests.length,
        limit: config.limit,
        remaining: config.limit - validRequests.length,
        resetAt: new Date(windowStart + config.window).toISOString()
      };
    }
    
    return stats;
  }
}

/**
 * Custom error class for rate limit errors
 */
class RateLimitError extends Error {
  constructor(message, waitTime, retryAfter) {
    super(message);
    this.name = 'RateLimitError';
    this.waitTime = waitTime;
    this.retryAfter = retryAfter;
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

export { rateLimiter, RateLimitError };