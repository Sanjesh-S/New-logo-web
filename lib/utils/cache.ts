/**
 * API Response Caching Utility
 * 
 * Simple in-memory cache for API responses.
 * For production, consider using Redis or Next.js built-in caching.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key)
    }
  }
}, 60000) // Clean up every minute

/**
 * Get cached data
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  
  if (!entry) {
    return null
  }
  
  if (entry.expiresAt < Date.now()) {
    cache.delete(key)
    return null
  }
  
  return entry.data
}

/**
 * Set cache data
 * 
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlMs - Time to live in milliseconds (default: 5 minutes)
 */
export function setCache<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  })
}

/**
 * Delete cache entry
 */
export function deleteCache(key: string): void {
  cache.delete(key)
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Generate cache key from URL and query parameters
 */
export function generateCacheKey(path: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) {
    return path
  }
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  return `${path}?${sortedParams}`
}
