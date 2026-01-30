/**
 * CSRF Protection Middleware
 * 
 * Implements double-submit cookie pattern for CSRF protection
 */

import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'

const CSRF_TOKEN_HEADER = 'X-CSRF-Token'
const CSRF_COOKIE_NAME = 'csrf-token'

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Verify CSRF token from request
 */
export function verifyCSRFToken(request: NextRequest): { valid: boolean; error?: string } {
  // Skip CSRF check for GET/HEAD/OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true }
  }

  const tokenFromHeader = request.headers.get(CSRF_TOKEN_HEADER)
  const tokenFromCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value

  if (!tokenFromHeader || !tokenFromCookie) {
    return {
      valid: false,
      error: 'CSRF token missing',
    }
  }

  if (tokenFromHeader !== tokenFromCookie) {
    return {
      valid: false,
      error: 'CSRF token mismatch',
    }
  }

  return { valid: true }
}

/**
 * Create CSRF token response headers
 */
export function getCSRFHeaders(token: string): Record<string, string> {
  return {
    'Set-Cookie': `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Secure`,
  }
}
