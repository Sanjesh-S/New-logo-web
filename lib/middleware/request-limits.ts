/**
 * Request Size Limits Middleware
 * 
 * Validates request body size to prevent DoS attacks
 */

const MAX_BODY_SIZE = 1024 * 1024 // 1MB

/**
 * Check if request body size is within limits
 */
export function validateRequestSize(contentLength: number | null): { valid: boolean; error?: string } {
  if (contentLength === null) {
    return { valid: true } // Unknown size, let it through (will fail on parse if too large)
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
 * Get request body with size validation
 */
export async function getRequestBody(request: Request): Promise<{ body: any; error?: string }> {
  const contentLength = request.headers.get('content-length')
  const sizeCheck = validateRequestSize(contentLength ? parseInt(contentLength, 10) : null)

  if (!sizeCheck.valid) {
    return { body: null, error: sizeCheck.error }
  }

  try {
    const body = await request.json()
    return { body }
  } catch (error) {
    if (error instanceof Error && error.message.includes('JSON')) {
      return { body: null, error: 'Invalid JSON body' }
    }
    return { body: null, error: 'Failed to parse request body' }
  }
}
