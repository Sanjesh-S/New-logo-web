/**
 * Global in-memory cache for faster data access
 * Data persists across navigations but not page refreshes
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private static instance: DataCache

  static getInstance(): DataCache {
    if (!DataCache.instance) {
      DataCache.instance = new DataCache()
    }
    return DataCache.instance
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Prefetch data in the background
  async prefetch<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key)
    if (cached) return cached

    const data = await fetcher()
    this.set(key, data, ttlMs)
    return data
  }
}

export const dataCache = DataCache.getInstance()

// Cache keys
export const CACHE_KEYS = {
  ALL_PRODUCTS: 'all_products',
  PRODUCTS_BY_CATEGORY: (category: string) => `products_${category}`,
  PRODUCTS_BY_BRAND: (category: string, brand: string) => `products_${category}_${brand}`,
  BRANDS_BY_CATEGORY: (category: string) => `brands_${category}`,
}

// TTL values
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,    // 2 minutes
  MEDIUM: 5 * 60 * 1000,   // 5 minutes
  LONG: 15 * 60 * 1000,    // 15 minutes
}

// Prefetch products for a category/brand combination
export async function prefetchProducts(category: string, brand: string): Promise<void> {
  const cacheKey = CACHE_KEYS.PRODUCTS_BY_BRAND(category, brand)
  
  // Don't refetch if already cached
  if (dataCache.has(cacheKey)) return

  try {
    const { getProductsByBrand } = await import('@/lib/firebase/database')
    const products = await getProductsByBrand(category, brand)
    dataCache.set(cacheKey, products, CACHE_TTL.MEDIUM)
  } catch (error) {
    console.warn('Prefetch failed:', error)
  }
}

// Prefetch all products (for search)
export async function prefetchAllProducts(): Promise<void> {
  if (dataCache.has(CACHE_KEYS.ALL_PRODUCTS)) return

  try {
    const { getAllProducts } = await import('@/lib/firebase/database')
    const products = await getAllProducts()
    dataCache.set(CACHE_KEYS.ALL_PRODUCTS, products, CACHE_TTL.MEDIUM)
  } catch (error) {
    console.warn('Prefetch failed:', error)
  }
}
