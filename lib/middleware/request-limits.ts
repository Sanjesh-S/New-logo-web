/**
 * Request Size Limits Middleware
 * 
 * Validates request body size and structure to prevent DoS attacks
 */

const MAX_BODY_SIZE = 1024 * 1024 // 1MB
const MAX_JSON_DEPTH = 10

/**
 * Check if request body size is within limits
 */
export function validateRequestSize(contentLength: number | null): { valid: boolean; error?: string } {
  if (contentLength === null) {
    return { valid: true }
  }

  if (contentLength > MAX_BODY_SIZE) {
    return {
      valid: false,
      error: `Request body too large. Maximum size is ${MAX_BODY_SIZE / 1024}KB`,
    }
  }

  return { valid: true }
}

/**
 * Check JSON nesting depth to prevent DoS from deeply nested payloads
 */
function checkJsonDepth(obj: unknown, currentDepth: number = 0): boolean {
  if (currentDepth > MAX_JSON_DEPTH) {
    return false
  }
  if (obj !== null && typeof obj === 'object') {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      if (!checkJsonDepth(value, currentDepth + 1)) {
        return false
      }
    }
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (!checkJsonDepth(item, currentDepth + 1)) {
        return false
      }
    }
  }
  return true
}

/**
 * Get request body with size and depth validation
 */
export async function getRequestBody(request: Request): Promise<{ body: any; error?: string }> {
  const contentLength = request.headers.get('content-length')
  const sizeCheck = validateRequestSize(contentLength ? parseInt(contentLength, 10) : null)

  if (!sizeCheck.valid) {
    return { body: null, error: sizeCheck.error }
  }

  try {
    const body = await request.json()
    
    // Validate JSON depth to prevent DoS
    if (!checkJsonDepth(body)) {
      return { body: null, error: 'Request body too deeply nested' }
    }
    
    return { body }
  } catch (error) {
    if (error instanceof Error && error.message.includes('JSON')) {
      return { body: null, error: 'Invalid JSON body' }
    }
    return { body: null, error: 'Failed to parse request body' }
  }
}
