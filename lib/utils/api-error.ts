/**
 * API Error Handling Utilities
 * 
 * Standardized error handling and response formats for API routes.
 */

import { NextResponse } from 'next/server'
import { logger } from './logger'

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string
  message: string
  code?: string
  details?: unknown
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: unknown): NextResponse<ErrorResponse> {
  // Handle known ApiError instances
  if (error instanceof ApiError) {
    logger.error(`API Error [${error.statusCode}]: ${error.message}`, {
      code: error.code,
      details: error.details,
    })

    return NextResponse.json<ErrorResponse>(
      {
        error: error.name,
        message: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    logger.error('Unhandled error', error)

    return NextResponse.json<ErrorResponse>(
      {
        error: 'InternalServerError',
        message: process.env.NODE_ENV === 'production' 
          ? 'An internal error occurred' 
          : error.message,
      },
      { status: 500 }
    )
  }

  // Handle unknown error types
  logger.error('Unknown error type', { error })

  return NextResponse.json<ErrorResponse>(
    {
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
    },
    { status: 500 }
  )
}

/**
 * Common error constructors
 */
export const ApiErrors = {
  badRequest: (message: string, details?: unknown) =>
    new ApiError(400, message, 'BAD_REQUEST', details),

  unauthorized: (message: string = 'Unauthorized') =>
    new ApiError(401, message, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Forbidden') =>
    new ApiError(403, message, 'FORBIDDEN'),

  notFound: (message: string = 'Resource not found') =>
    new ApiError(404, message, 'NOT_FOUND'),

  conflict: (message: string, details?: unknown) =>
    new ApiError(409, message, 'CONFLICT', details),

  tooManyRequests: (message: string = 'Too many requests', resetTime?: number) =>
    new ApiError(429, message, 'TOO_MANY_REQUESTS', resetTime ? { resetTime } : undefined),

  internalServerError: (message: string = 'Internal server error', details?: unknown) =>
    new ApiError(500, message, 'INTERNAL_SERVER_ERROR', details),

  serviceUnavailable: (message: string = 'Service temporarily unavailable') =>
    new ApiError(503, message, 'SERVICE_UNAVAILABLE'),
}

/**
 * Async error handler wrapper for API routes
 * 
 * Usage:
 * ```typescript
 * export const POST = handleApiError(async (request) => {
 *   // Your route handler code
 * })
 * ```
 */
export function handleApiError<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (error) {
      return createErrorResponse(error)
    }
  }) as T
}
