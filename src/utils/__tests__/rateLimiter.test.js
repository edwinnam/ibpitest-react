import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import rateLimiter from '../rateLimiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear any existing entries
    rateLimiter.attempts.clear();
    rateLimiter.blocked.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkLimit', () => {
    it('should allow requests within limit', () => {
      const endpoint = '/auth/login';
      
      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.checkLimit(endpoint);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should block requests exceeding limit', () => {
      const endpoint = '/auth/login';
      
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(endpoint);
      }
      
      // 6th request should be blocked
      const result = rateLimiter.checkLimit(endpoint);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBe(300); // 5 minutes in seconds
    });

    it('should use default limits for unknown endpoints', () => {
      const endpoint = '/unknown/endpoint';
      
      // Should use default limit of 100
      for (let i = 0; i < 100; i++) {
        const result = rateLimiter.checkLimit(endpoint);
        expect(result.allowed).toBe(true);
      }
      
      const result = rateLimiter.checkLimit(endpoint);
      expect(result.allowed).toBe(false);
    });

    it('should reset attempts after time window', () => {
      const endpoint = '/auth/login';
      
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(endpoint);
      }
      
      // Should be blocked
      expect(rateLimiter.checkLimit(endpoint).allowed).toBe(false);
      
      // Advance time past the window
      vi.advanceTimersByTime(300001); // 5 minutes + 1ms
      
      // Should be allowed again
      const result = rateLimiter.checkLimit(endpoint);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should track different endpoints separately', () => {
      const endpoint1 = '/auth/login';
      const endpoint2 = '/auth/reset-password';
      
      // Max out endpoint1
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(endpoint1);
      }
      
      // endpoint2 should still be allowed
      const result = rateLimiter.checkLimit(endpoint2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // reset-password has limit of 3
    });
  });

  describe('reset', () => {
    it('should reset attempts for specific endpoint', () => {
      const endpoint = '/auth/login';
      
      // Make some requests
      for (let i = 0; i < 3; i++) {
        rateLimiter.checkLimit(endpoint);
      }
      
      // Reset
      rateLimiter.reset(endpoint);
      
      // Should have full limit available
      const result = rateLimiter.checkLimit(endpoint);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should unblock endpoint when reset', () => {
      const endpoint = '/auth/login';
      
      // Block the endpoint
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkLimit(endpoint);
      }
      
      expect(rateLimiter.isBlocked(endpoint)).toBe(true);
      
      // Reset
      rateLimiter.reset(endpoint);
      
      expect(rateLimiter.isBlocked(endpoint)).toBe(false);
    });
  });

  describe('isBlocked', () => {
    it('should return true for blocked endpoints', () => {
      const endpoint = '/auth/login';
      
      // Block the endpoint
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkLimit(endpoint);
      }
      
      expect(rateLimiter.isBlocked(endpoint)).toBe(true);
    });

    it('should return false for non-blocked endpoints', () => {
      const endpoint = '/auth/login';
      
      expect(rateLimiter.isBlocked(endpoint)).toBe(false);
      
      // Make some requests but don't exceed limit
      for (let i = 0; i < 3; i++) {
        rateLimiter.checkLimit(endpoint);
      }
      
      expect(rateLimiter.isBlocked(endpoint)).toBe(false);
    });

    it('should unblock after retry period', () => {
      const endpoint = '/auth/login';
      
      // Block the endpoint
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkLimit(endpoint);
      }
      
      expect(rateLimiter.isBlocked(endpoint)).toBe(true);
      
      // Advance time past retry period
      vi.advanceTimersByTime(300001);
      
      expect(rateLimiter.isBlocked(endpoint)).toBe(false);
    });
  });

  describe('getRemainingTime', () => {
    it('should return remaining block time', () => {
      const endpoint = '/auth/login';
      
      // Block the endpoint
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkLimit(endpoint);
      }
      
      const remaining = rateLimiter.getRemainingTime(endpoint);
      expect(remaining).toBeGreaterThan(299000); // Should be close to 5 minutes
      expect(remaining).toBeLessThanOrEqual(300000);
      
      // Advance time
      vi.advanceTimersByTime(100000); // 100 seconds
      
      const newRemaining = rateLimiter.getRemainingTime(endpoint);
      expect(newRemaining).toBeGreaterThan(199000);
      expect(newRemaining).toBeLessThanOrEqual(200000);
    });

    it('should return 0 for non-blocked endpoints', () => {
      const endpoint = '/auth/login';
      
      expect(rateLimiter.getRemainingTime(endpoint)).toBe(0);
      
      // Make some requests but don't exceed limit
      for (let i = 0; i < 3; i++) {
        rateLimiter.checkLimit(endpoint);
      }
      
      expect(rateLimiter.getRemainingTime(endpoint)).toBe(0);
    });
  });

  describe('middleware', () => {
    it('should allow requests within limit', async () => {
      const endpoint = '/auth/login';
      const request = { endpoint };
      const makeRequest = vi.fn().mockResolvedValue({ data: 'success' });
      
      const result = await rateLimiter.middleware(request, makeRequest);
      
      expect(makeRequest).toHaveBeenCalledWith(request);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry with exponential backoff when rate limited', async () => {
      const endpoint = '/auth/login';
      const request = { endpoint };
      const makeRequest = vi.fn()
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValue({ data: 'success' });
      
      const promise = rateLimiter.middleware(request, makeRequest);
      
      // First retry after 1 second
      await vi.advanceTimersByTimeAsync(1000);
      
      // Second retry after 2 seconds
      await vi.advanceTimersByTimeAsync(2000);
      
      const result = await promise;
      
      expect(makeRequest).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should throw error after max retries', async () => {
      const endpoint = '/auth/login';
      const request = { endpoint };
      const makeRequest = vi.fn().mockRejectedValue({ response: { status: 429 } });
      
      const promise = rateLimiter.middleware(request, makeRequest);
      
      // Advance through all retries
      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(Math.pow(2, i) * 1000);
      }
      
      await expect(promise).rejects.toThrow('Rate limit exceeded');
      expect(makeRequest).toHaveBeenCalledTimes(3);
    });

    it('should handle client-side rate limiting', async () => {
      const endpoint = '/auth/login';
      const request = { endpoint };
      const makeRequest = vi.fn();
      
      // Max out the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(endpoint);
      }
      
      await expect(rateLimiter.middleware(request, makeRequest))
        .rejects.toThrow('Rate limit exceeded');
      
      expect(makeRequest).not.toHaveBeenCalled();
    });

    it('should pass through non-429 errors', async () => {
      const endpoint = '/auth/login';
      const request = { endpoint };
      const error = { response: { status: 500 }, message: 'Server error' };
      const makeRequest = vi.fn().mockRejectedValue(error);
      
      await expect(rateLimiter.middleware(request, makeRequest))
        .rejects.toEqual(error);
      
      expect(makeRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('endpoint configuration', () => {
    it('should have correct limits for auth endpoints', () => {
      const loginResult = rateLimiter.checkLimit('/auth/login');
      expect(loginResult.remaining).toBe(4); // Limit is 5, so 4 remaining after 1 attempt

      const resetResult = rateLimiter.checkLimit('/auth/reset-password');
      expect(resetResult.remaining).toBe(2); // Limit is 3, so 2 remaining
    });

    it('should have correct limits for API endpoints', () => {
      const testResults = rateLimiter.checkLimit('/api/test-results');
      expect(testResults.remaining).toBe(29); // Limit is 30

      const generateCodes = rateLimiter.checkLimit('/api/generate-codes');
      expect(generateCodes.remaining).toBe(9); // Limit is 10
    });

    it('should have correct limits for report endpoints', () => {
      const generateReport = rateLimiter.checkLimit('/api/reports/generate');
      expect(generateReport.remaining).toBe(4); // Limit is 5

      const downloadReport = rateLimiter.checkLimit('/api/reports/download');
      expect(downloadReport.remaining).toBe(9); // Limit is 10
    });
  });
});