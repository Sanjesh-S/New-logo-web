/**
 * Rate Limiting Utility for Firebase Functions
 * 
 * Note: For production, consider using Firebase Extensions or Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000)

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 100, windowMs: 60000 }
): { allowed: boolean; resetTime: number; remaining: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetTime < now) {
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

export function getClientIdentifier(req: { headers: { [key: string]: string | string[] | undefined } }): string {
  const forwarded = Array.isArray(req.headers['x-forwarded-for']) 
    ? req.headers['x-forwarded-for'][0] 
    : req.headers['x-forwarded-for']
  const realIp = Array.isArray(req.headers['x-real-ip'])
    ? req.headers['x-real-ip'][0]
    : req.headers['x-real-ip']
  const cfConnectingIp = Array.isArray(req.headers['cf-connecting-ip'])
    ? req.headers['cf-connecting-ip'][0]
    : req.headers['cf-connecting-ip']
  
  const ip = forwarded?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'unknown'
  return ip
}
