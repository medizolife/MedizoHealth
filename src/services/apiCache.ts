// ─── Medizo High-Performance Zero-Latency Client-Side SWR Cache Engine ───

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const memoryCache = new Map<string, CacheEntry<any>>();
const listeners = new Map<string, Set<(data: any) => void>>();

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes default fresh TTL
const SESSION_STORAGE_PREFIX = 'medizo_cache_';

/**
 * Read from memory cache or sessionStorage
 */
export const getCachedData = <T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null => {
  // 1. Try memory cache (0ms)
  const memoryEntry = memoryCache.get(key);
  if (memoryEntry) {
    const isExpired = Date.now() - memoryEntry.timestamp > ttlMs;
    if (!isExpired) {
      return memoryEntry.data as T;
    }
  }

  // 2. Try sessionStorage fallback
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${key}`);
      if (stored) {
        const parsed: CacheEntry<T> = JSON.parse(stored);
        const isExpired = Date.now() - parsed.timestamp > ttlMs;
        if (!isExpired) {
          memoryCache.set(key, parsed);
          return parsed.data;
        } else {
          sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${key}`);
        }
      }
    } catch (e) {
      // ignore storage parsing errors
    }
  }

  return null;
};

/**
 * Store data into memory cache and sessionStorage
 */
export const setCachedData = <T>(key: string, data: T): T => {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${key}`, JSON.stringify(entry));
    } catch (e) {
      // ignore storage quota errors
    }
  }

  // Notify active subscribers
  const keyListeners = listeners.get(key);
  if (keyListeners) {
    keyListeners.forEach(listener => {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in cache listener:', err);
      }
    });
  }

  return data;
};

/**
 * Subscribe to cache updates for a key
 */
export const subscribeToCache = <T>(key: string, callback: (data: T) => void): (() => void) => {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(callback);

  // Return unsubscribe function
  return () => {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
      keyListeners.delete(callback);
      if (keyListeners.size === 0) {
        listeners.delete(key);
      }
    }
  };
};

/**
 * Clear cached data by key prefix or purge all
 */
export const clearApiCache = (keyPrefix?: string) => {
  if (!keyPrefix) {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      try {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith(SESSION_STORAGE_PREFIX)) {
            sessionStorage.removeItem(k);
          }
        });
      } catch (e) {}
    }
    return;
  }

  // Prefix match
  memoryCache.forEach((_, key) => {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key);
    }
  });

  if (typeof window !== 'undefined') {
    try {
      const fullPrefix = `${SESSION_STORAGE_PREFIX}${keyPrefix}`;
      Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith(fullPrefix)) {
          sessionStorage.removeItem(k);
        }
      });
    } catch (e) {}
  }
};

/**
 * Stale-While-Revalidate (SWR) Fetcher:
 * 1. Immediately returns cached data if available (0ms)
 * 2. Asynchronously fetches latest data in background and updates cache & subscribers
 */
export const fetchWithSWR = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttlMs?: number;
    forceRefresh?: boolean;
    onBackgroundUpdate?: (data: T) => void;
  } = {}
): Promise<T> => {
  const { ttlMs = DEFAULT_TTL_MS, forceRefresh = false, onBackgroundUpdate } = options;

  const cached = forceRefresh ? null : getCachedData<T>(key, ttlMs);

  // If we have cached data, revalidate silently in background
  if (cached !== null) {
    // Background revalidation
    (async () => {
      try {
        const fresh = await fetcher();
        setCachedData(key, fresh);
        if (onBackgroundUpdate) {
          onBackgroundUpdate(fresh);
        }
      } catch (err) {
        // Silent failure in background revalidation
      }
    })();

    return cached;
  }

  // Cold fetch if no cache
  const fresh = await fetcher();
  return setCachedData(key, fresh);
};

/**
 * Find an item by ID within a cached list
 */
export const findInCachedList = <T extends { id?: string }>(key: string, id: string): T | null => {
  const list = getCachedData<T[]>(key);
  if (!Array.isArray(list)) return null;
  return list.find(item => item.id === id) || null;
};
