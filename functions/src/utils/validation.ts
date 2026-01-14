/**
 * Validation Utilities for Firebase Functions
 */

import { ZodError, ZodSchema } from 'zod'

export interface ValidationResult<T> {
  isValid: boolean
  data?: T
  errors?: ZodError['issues']
}

export function validateSchema<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data)
    return { isValid: true, data: validatedData }
  } catch (error) {
    if (error instanceof ZodError) {
      return { isValid: false, errors: error.issues }
    }
    throw error
  }
}

export function createValidationErrorResponse(errors: ZodError['issues']) {
  const formattedErrors = errors.map((error) => ({
    path: error.path.join('.'),
    message: error.message,
  }))

  return {
    status: 400,
    body: {
      error: 'Validation failed',
      details: formattedErrors,
    },
  }
}
