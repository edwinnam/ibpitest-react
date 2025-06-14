import { useState, useEffect, useCallback } from 'react';
import cacheService from '../core/services/cacheService';

/**
 * React hook for cache management
 * @param {string} key - Cache key
 * @param {Function} fetcher - Function to fetch data if not cached
 * @param {Object} options - Cache options
 */
export const useCache = (key, fetcher, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    ttl,
    namespace,
    persistent = false,
    dependencies = [],
    enabled = true,
    onSuccess,
    onError,
    forceRefresh = false
  } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cachedData = await cacheService.get(key, {
        fallback: async () => {
          const result = await fetcher();
          return result;
        },
        ttl,
        namespace,
        persistent,
        forceRefresh
      });

      setData(cachedData);
      if (onSuccess) {
        onSuccess(cachedData);
      }
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [key, enabled, forceRefresh, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    cacheService.delete(key);
    return fetchData();
  }, [key, fetchData]);

  const update = useCallback(async (newData) => {
    await cacheService.set(key, newData, { ttl, namespace, persistent });
    setData(newData);
  }, [key, ttl, namespace, persistent]);

  return {
    data,
    loading,
    error,
    refresh,
    update,
    isStale: false // Could implement staleness checking
  };
};

/**
 * Hook for prefetching data into cache
 */
export const usePrefetch = () => {
  const prefetch = useCallback(async (key, fetcher, options = {}) => {
    try {
      const data = await fetcher();
      await cacheService.set(key, data, options);
      return data;
    } catch (error) {
      console.error('Prefetch failed:', error);
      throw error;
    }
  }, []);

  return prefetch;
};

/**
 * Hook for cache invalidation
 */
export const useCacheInvalidation = () => {
  const invalidate = useCallback((pattern) => {
    cacheService.clear(pattern);
  }, []);

  const invalidateAll = useCallback(() => {
    cacheService.clear();
  }, []);

  return {
    invalidate,
    invalidateAll
  };
};

/**
 * Hook for monitoring cache statistics
 */
export const useCacheStats = () => {
  const [stats, setStats] = useState(null);

  const updateStats = useCallback(() => {
    setStats(cacheService.getStats());
  }, []);

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  return stats;
};