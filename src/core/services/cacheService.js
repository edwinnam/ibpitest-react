/**
 * Cache Service for managing application-wide caching
 * Implements multiple caching strategies for optimal performance
 */

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheConfig = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100, // Maximum number of entries
      strategies: {
        // API response caching
        api: {
          organizations: { ttl: 10 * 60 * 1000 }, // 10 minutes
          customers: { ttl: 5 * 60 * 1000 }, // 5 minutes
          testCodes: { ttl: 2 * 60 * 1000 }, // 2 minutes
          testResults: { ttl: 30 * 60 * 1000 }, // 30 minutes
          reports: { ttl: 60 * 60 * 1000 }, // 1 hour
          scores: { ttl: 30 * 60 * 1000 }, // 30 minutes
        },
        // Static resource caching
        static: {
          images: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
          fonts: { ttl: 30 * 24 * 60 * 60 * 1000 }, // 30 days
          styles: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
        }
      }
    };
    
    // Initialize cache cleanup interval
    this.startCacheCleanup();
    
    // Check for localStorage support
    this.hasLocalStorage = this.checkLocalStorageSupport();
    
    // Check for IndexedDB support
    this.hasIndexedDB = 'indexedDB' in window;
    
    // Initialize IndexedDB for large data
    if (this.hasIndexedDB) {
      this.initIndexedDB();
    }
  }

  /**
   * Check localStorage support
   */
  checkLocalStorageSupport() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize IndexedDB for large data caching
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('IBPICacheDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores for different data types
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('largeData')) {
          db.createObjectStore('largeData', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Generate cache key
   */
  generateKey(namespace, ...params) {
    return `${namespace}:${params.join(':')}`;
  }

  /**
   * Get TTL for a specific namespace
   */
  getTTL(namespace) {
    const parts = namespace.split('.');
    let config = this.cacheConfig.strategies;
    
    for (const part of parts) {
      config = config[part];
      if (!config) break;
    }
    
    return config?.ttl || this.cacheConfig.defaultTTL;
  }

  /**
   * Set item in cache with TTL
   */
  async set(key, value, options = {}) {
    const { ttl, namespace, persistent = false } = options;
    const finalTTL = ttl || (namespace ? this.getTTL(namespace) : this.cacheConfig.defaultTTL);
    const expiresAt = Date.now() + finalTTL;

    const cacheEntry = {
      value,
      expiresAt,
      createdAt: Date.now(),
      hits: 0
    };

    // Memory cache (always)
    this.memoryCache.set(key, cacheEntry);
    this.enforceMaxSize();

    // Persistent storage
    if (persistent && this.hasLocalStorage) {
      try {
        const serialized = JSON.stringify(cacheEntry);
        // Check size before storing
        if (serialized.length < 1024 * 1024) { // 1MB limit for localStorage
          localStorage.setItem(key, serialized);
        } else if (this.hasIndexedDB) {
          // Use IndexedDB for large data
          await this.setIndexedDB('largeData', { key, ...cacheEntry });
        }
      } catch (error) {
        console.warn('Failed to persist cache:', error);
      }
    }

    return value;
  }

  /**
   * Get item from cache
   */
  async get(key, options = {}) {
    const { fallback, forceRefresh = false } = options;

    if (forceRefresh) {
      this.delete(key);
      return fallback ? await fallback() : null;
    }

    // Check memory cache first
    let cacheEntry = this.memoryCache.get(key);

    // Check persistent storage if not in memory
    if (!cacheEntry && this.hasLocalStorage) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          cacheEntry = JSON.parse(stored);
          // Restore to memory cache
          this.memoryCache.set(key, cacheEntry);
        }
      } catch {
        // Try IndexedDB for large data
        if (this.hasIndexedDB) {
          cacheEntry = await this.getIndexedDB('largeData', key);
        }
      }
    }

    // Check if entry exists and is valid
    if (cacheEntry) {
      if (Date.now() < cacheEntry.expiresAt) {
        // Update hit count
        cacheEntry.hits++;
        return cacheEntry.value;
      } else {
        // Entry expired, remove it
        this.delete(key);
      }
    }

    // Cache miss - execute fallback if provided
    if (fallback) {
      const value = await fallback();
      if (value !== undefined) {
        await this.set(key, value, options);
      }
      return value;
    }

    return null;
  }

  /**
   * Delete item from cache
   */
  delete(key) {
    this.memoryCache.delete(key);
    
    if (this.hasLocalStorage) {
      localStorage.removeItem(key);
    }
    
    if (this.hasIndexedDB) {
      this.deleteIndexedDB('largeData', key);
    }
  }

  /**
   * Clear cache by pattern or entirely
   */
  clear(pattern) {
    if (pattern) {
      // Clear by pattern
      const regex = new RegExp(pattern);
      
      // Memory cache
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }
      
      // LocalStorage
      if (this.hasLocalStorage) {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (regex.test(key)) {
            localStorage.removeItem(key);
          }
        }
      }
    } else {
      // Clear all
      this.memoryCache.clear();
      
      if (this.hasLocalStorage) {
        localStorage.clear();
      }
      
      if (this.hasIndexedDB) {
        this.clearIndexedDB();
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {
      memoryCache: {
        size: this.memoryCache.size,
        entries: []
      },
      localStorage: {
        size: 0,
        entries: []
      },
      totalHits: 0,
      totalSize: 0
    };

    // Memory cache stats
    for (const [key, entry] of this.memoryCache.entries()) {
      const entryStats = {
        key,
        size: JSON.stringify(entry.value).length,
        hits: entry.hits,
        age: Date.now() - entry.createdAt,
        ttl: entry.expiresAt - Date.now()
      };
      stats.memoryCache.entries.push(entryStats);
      stats.totalHits += entry.hits;
      stats.totalSize += entryStats.size;
    }

    // LocalStorage stats
    if (this.hasLocalStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (value) {
          stats.localStorage.size += value.length;
          stats.totalSize += value.length;
        }
      }
    }

    return stats;
  }

  /**
   * Enforce maximum cache size
   */
  enforceMaxSize() {
    if (this.memoryCache.size <= this.cacheConfig.maxSize) return;

    // Sort by least recently used (combination of hits and age)
    const entries = Array.from(this.memoryCache.entries())
      .map(([key, entry]) => ({
        key,
        score: entry.hits / (Date.now() - entry.createdAt)
      }))
      .sort((a, b) => a.score - b.score);

    // Remove least valuable entries
    const toRemove = entries.slice(0, this.memoryCache.size - this.cacheConfig.maxSize);
    for (const { key } of toRemove) {
      this.delete(key);
    }
  }

  /**
   * Start periodic cache cleanup
   */
  startCacheCleanup() {
    setInterval(() => {
      for (const [key, entry] of this.memoryCache.entries()) {
        if (Date.now() > entry.expiresAt) {
          this.delete(key);
        }
      }
    }, 60 * 1000); // Run every minute
  }

  /**
   * IndexedDB operations
   */
  async setIndexedDB(store, data) {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getIndexedDB(store, key) {
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteIndexedDB(store, key) {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearIndexedDB() {
    if (!this.db) return;
    
    const stores = ['reports', 'largeData'];
    for (const store of stores) {
      const transaction = this.db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      objectStore.clear();
    }
  }

  /**
   * Create a cached version of an async function
   */
  memoize(fn, options = {}) {
    return async (...args) => {
      const key = options.keyGenerator 
        ? options.keyGenerator(...args)
        : `memoized:${fn.name}:${JSON.stringify(args)}`;
      
      return this.get(key, {
        ...options,
        fallback: () => fn(...args)
      });
    };
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;