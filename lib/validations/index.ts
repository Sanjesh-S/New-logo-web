/**
 * Validation Utilities
 * 
 * Helper functions for validating API requests using Zod schemas.
 */

import { NextResponse } from 'next/server'
import { ZodError, ZodSchema } from 'zod'

/**
 * Validate request body against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with isValid boolean and errors/validated data
 */
export function validateSchema<T>(
  schema: ZodSchema<T>,
  data: unknown
): { isValid: boolean; data?: T; errors?: ZodError['errors'] } {
  try {
    const validatedData = schema.parse(data)
    return { isValid: true, data: validatedData }
  } catch (error) {
    if (error instanceof ZodError) {
      return { isValid: false, errors: error.errors }
    }
    throw error
  }
}

/**
 * Create a validation error response
 * 
 * @param errors - Zod validation errors
 * @returns NextResponse with 400 status and error details
 */
export function validationErrorResponse(errors: ZodError['errors']): NextResponse {
  const formattedErrors = errors.map((error) => ({
    path: error.path.join('.'),
    message: error.message,
  }))

  return NextResponse.json(
    {
      error: 'Validation failed',
      details: formattedErrors,
    },
    { status: 400 }
  )
}
