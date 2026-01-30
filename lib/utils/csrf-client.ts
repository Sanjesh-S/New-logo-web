/**
 * Client-side CSRF Token Utility
 * 
 * Generates and manages CSRF tokens for API requests
 */

/**
 * Get CSRF token from cookie
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf-token') {
      return decodeURIComponent(value)
    }
  }
  return null
}

/**
 * Set CSRF token in cookie (called by server)
 */
export function setCSRFToken(token: string): void {
  if (typeof document === 'undefined') return
  
  document.cookie = `csrf-token=${encodeURIComponent(token)}; Path=/; SameSite=Strict; Secure`
}

/**
 * Get CSRF token for API request headers
 */
export function getCSRFHeader(): Record<string, string> {
  const token = getCSRFToken()
  if (!token) {
    return {}
  }
  return {
    'X-CSRF-Token': token,
  }
}
