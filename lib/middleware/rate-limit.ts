/**
 * Rate Limiting Middleware
 * 
 * Simple in-memory rate limiting for API routes.
 * For production, consider using Redis-based rate limiting.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Maximum entries to prevent memory leaks
const MAX_ENTRIES = 10000

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  let deletedCount = 0
  
  // Delete expired entries
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
      deletedCount++
    }
  }
  
  // If still over limit, remove oldest entries
  if (rateLimitStore.size > MAX_ENTRIES) {
    const entries = Array.from(rateLimitStore.entries())
      .sort((a, b) => a[1].resetTime - b[1].resetTime)
    
    const toDelete = rateLimitStore.size - MAX_ENTRIES
    for (let i = 0; i < toDelete; i++) {
      rateLimitStore.delete(entries[i][0])
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

/**
 * Rate limit check for API routes
 * 
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param options - Rate limit options
 * @returns Object with allowed boolean and reset time
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 100, windowMs: 60000 } // 100 requests per minute by default
): { allowed: boolean; resetTime: number; remaining: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
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

  // Increment count
  entry.count++
  rateLimitStore.set(identifier, entry)

  return {
    allowed: true,
    resetTime: entry.resetTime,
    remaining: options.maxRequests - entry.count,
  }
}

/**
 * Sanitize an IP address string to prevent injection
 * Only allows valid IPv4/IPv6 characters
 */
function sanitizeIp(ip: string): string {
  return ip.replace(/[^a-fA-F0-9.:]/g, '').slice(0, 45)
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const rawIp = forwarded?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'unknown'
  return rawIp === 'unknown' ? rawIp : sanitizeIp(rawIp)
}

/**
 * Create rate limit response
 */
export function rateLimitResponse(resetTime: number): Response {
  const resetSeconds = Math.ceil((resetTime - Date.now()) / 1000)
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': resetSeconds.toString(),
        'X-RateLimit-Reset': resetTime.toString(),
      },
    }
  )
}
