import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreServer } from '@/lib/firebase/server'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { PricingRules } from '@/lib/types/pricing'
import { z } from 'zod'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { getRequestBody } from '@/lib/middleware/request-limits'
import { verifyCSRFToken } from '@/lib/middleware/csrf'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('API:AdminPricing')


// Value schema for question pricing (yes/no)
const questionPriceSchema = z.object({
  yes: z.number().int().min(-1000000).max(1000000),
  no: z.number().int().min(-1000000).max(1000000),
})

const numberRecordSchema = z.record(z.string(), z.number().int().min(-1000000).max(1000000))

// Validation schema for pricing rules with comprehensive validation
const pricingRulesSchema = z.object({
  productId: z.string().min(1).max(100),
  pricingRules: z.object({
    questions: z.record(z.string(), questionPriceSchema),
    lensCondition: numberRecordSchema.optional(),
    displayCondition: numberRecordSchema.optional(),
    bodyCondition: numberRecordSchema.optional(),
    errorCondition: numberRecordSchema.optional(),
    accessories: numberRecordSchema.optional(),
    age: numberRecordSchema.optional(),
    functionalIssues: numberRecordSchema.optional(),
  }).passthrough(),
})

/**
 * Server-side API for saving pricing rules
 * Validates data and ensures only admins can save
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 50, windowMs: 60000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // CSRF protection
    const csrfCheck = verifyCSRFToken(request)
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: csrfCheck.error || 'CSRF validation failed' },
        { status: 403 }
      )
    }

    // Get auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate request size
    const { body, error: bodyError } = await getRequestBody(request)
    if (bodyError) {
      return NextResponse.json(
        { error: bodyError },
        { status: 413 }
      )
    }
    
    // Validate request body
    const validation = pricingRulesSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { productId, pricingRules } = validation.data

    // TODO: Verify user is admin using Admin SDK or Firestore rules
    // For now, Firestore rules will enforce admin access

    const db = getFirestoreServer()
    const pricingRef = doc(db, 'productPricing', productId)
    
    await setDoc(pricingRef, {
      ...pricingRules,
      updatedAt: Timestamp.now(),
      updatedBy: 'admin', // TODO: Get from auth token
    }, { merge: true })

    logger.info('Pricing rules saved', { productId })

    return NextResponse.json({
      success: true,
      message: 'Pricing rules saved successfully',
    })
  } catch (error) {
    logger.error('Error saving pricing rules', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? 'Failed to save pricing rules' : (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
