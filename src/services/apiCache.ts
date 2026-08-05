// Client-side API caching engine for instant navigation and data access
type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const memoryCache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes default cache duration

/**
 * Get cached data if valid and not expired
 */
export const getCachedData = <T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  const isExpired = Date.now() - entry.timestamp > ttlMs;
  if (isExpired) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
};

/**
 * Store data into in-memory cache
 */
export const setCachedData = <T>(key: string, data: T): T => {
  memoryCache.set(key, { data, timestamp: Date.now() });
  return data;
};

/**
 * Find an item inside a cached array list by ID
 */
export const findInCachedList = <T>(listKey: string, idValue: string, idField: string = 'id'): T | null => {
  const cachedList = getCachedData<T[]>(listKey);
  if (!Array.isArray(cachedList)) return null;
  const item = cachedList.find((x: any) => x && (x[idField] === idValue || x._id === idValue || x.id === idValue));
  return item ? (item as T) : null;
};

/**
 * Clear cached data by prefix or purge all
 */
export const clearApiCache = (keyPrefix?: string) => {
  if (!keyPrefix) {
    memoryCache.clear();
    return;
  }
  memoryCache.forEach((_, key) => {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key);
    }
  });
};
