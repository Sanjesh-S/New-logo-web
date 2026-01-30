/**
 * Rate Limiting Utility for Firebase Functions
 * 
 * IMPORTANT: This in-memory rate limiting has limitations:
 * - State is lost on cold starts
 * - Does not share state across function instances
 * 
 * For production at scale, consider:
 * - Firebase Realtime Database rate limiting
 * - Redis-based rate limiting (e.g., with Upstash)
 * - Google Cloud Armor
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Use a size-limited Map to prevent unbounded memory growth
const MAX_ENTRIES = 10000
const rateLimitStore = new Map<string, RateLimitEntry>()

// Track cleanup interval to allow proper shutdown
let cleanupInterval: ReturnType<typeof setInterval> | null = null

/**
 * Start the cleanup interval if not already running
 */
function ensureCleanupRunning(): void {
  if (cleanupInterval === null) {
    cleanupInterval = setInterval(() => {
      const now = Date.now()
      let deletedCount = 0
      
      for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
          rateLimitStore.delete(key)
          deletedCount++
        }
      }
      
      // If store is still too large, remove oldest entries
      if (rateLimitStore.size > MAX_ENTRIES) {
        const entries = Array.from(rateLimitStore.entries())
          .sort((a, b) => a[1].resetTime - b[1].resetTime)
        
        const toDelete = entries.slice(0, rateLimitStore.size - MAX_ENTRIES)
        for (const [key] of toDelete) {
          rateLimitStore.delete(key)
        }
      }
    }, 60000)
    
    // Prevent interval from keeping the process alive
    if (cleanupInterval.unref) {
      cleanupInterval.unref()
    }
  }
}

// Start cleanup on module load
ensureCleanupRunning()

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  resetTime: number
  remaining: number
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 100, windowMs: 60000 }
): RateLimitResult {
  // Validate inputs
  if (!identifier || typeof identifier !== 'string') {
    return { allowed: false, resetTime: Date.now() + options.windowMs, remaining: 0 }
  }
  
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetTime < now) {
    // Enforce max entries limit
    if (rateLimitStore.size >= MAX_ENTRIES) {
      // Find and delete oldest entry
      let oldestKey: string | null = null
      let oldestTime = Infinity
      
      for (const [key, e] of rateLimitStore.entries()) {
        if (e.resetTime < oldestTime) {
          oldestTime = e.resetTime
          oldestKey = key
        }
      }
      
      if (oldestKey) {
        rateLimitStore.delete(oldestKey)
      }
    }
    
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    })
    
    return {
      allowed: true,
      resetTime: now + options.windowMs,
      remaining: options.maxRequests - 1,
    }
  }

  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      resetTime: entry.resetTime,
      remaining: 0,
    }
  }

  entry.count++
  rateLimitStore.set(identifier, entry)

  return {
    allowed: true,
    resetTime: entry.resetTime,
    remaining: options.maxRequests - entry.count,
  }
}

/**
 * Get client identifier from request headers
 * Note: Headers can be spoofed; this is for rate limiting, not security
 */
export function getClientIdentifier(req: { headers: { [key: string]: string | string[] | undefined } }): string {
  // Try multiple header sources in order of reliability
  const headers = req.headers || {}
  
  // Cloudflare's connecting IP (most reliable if using Cloudflare)
  const cfConnectingIp = getHeaderValue(headers['cf-connecting-ip'])
  if (cfConnectingIp && cfConnectingIp !== 'unknown') {
    return sanitizeIp(cfConnectingIp)
  }
  
  // X-Real-IP (common in nginx setups)
  const realIp = getHeaderValue(headers['x-real-ip'])
  if (realIp && realIp !== 'unknown') {
    return sanitizeIp(realIp)
  }
  
  // X-Forwarded-For (take first IP, which should be the client)
  const forwarded = getHeaderValue(headers['x-forwarded-for'])
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim()
    if (firstIp && firstIp !== 'unknown') {
      return sanitizeIp(firstIp)
    }
  }
  
  return 'unknown'
}

/**
 * Helper to get header value from string or array
 */
function getHeaderValue(header: string | string[] | undefined): string | undefined {
  if (Array.isArray(header)) {
    return header[0]
  }
  return header
}

/**
 * Sanitize IP address to prevent injection
 */
function sanitizeIp(ip: string): string {
  // Remove any non-IP characters and limit length
  return ip.replace(/[^a-fA-F0-9.:]/g, '').slice(0, 45)
}

/**
 * Clear rate limit store (useful for testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear()
}

/**
 * Get current store size (useful for monitoring)
 */
export function getRateLimitStoreSize(): number {
  return rateLimitStore.size
}
