import { NextRequest, NextResponse } from 'next/server'
import { getValuation, updateValuation, getUserValuations } from '@/lib/firebase/database'
import { getFirestoreServer } from '@/lib/firebase/server'
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore'
import { valuationSchema, valuationUpdateSchema } from '@/lib/validations/schemas'
import { validateSchema, validationErrorResponse } from '@/lib/validations'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { getRequestBody } from '@/lib/middleware/request-limits'
import { verifyCSRFToken } from '@/lib/middleware/csrf'
import { createLogger } from '@/lib/utils/logger'
import { generateOrderId, getCategoryCode } from '@/lib/utils/orderId'

const logger = createLogger('API:Valuations')


export async function POST(request: NextRequest) {
  try {
    // Rate limiting (100 requests per minute per IP)
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 100, windowMs: 60000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        }
      )
    }
    
    // CSRF protection (optional for public endpoints, but recommended)
    // Skip for now since valuations can be created by unauthenticated users
    
    // Validate request size
    const { body, error: bodyError } = await getRequestBody(request)
    if (bodyError) {
      return NextResponse.json(
        { error: bodyError },
        { status: 413 }
      )
    }
    
    // Validate request body
    const validation = validateSchema(valuationSchema, body)
    if (!validation.isValid) {
      return validationErrorResponse(validation.errors!)
    }
    
    const { 
      category, 
      brand, 
      model, 
      condition, 
      usage, 
      accessories, 
      basePrice, 
      estimatedValue, 
      userId,
      productId,
      answers // New assessment answers structure
    } = validation.data!

    // For new assessment flow, extract condition/usage from answers if needed
    let finalCondition = condition
    let finalUsage = usage
    let finalAccessories = accessories || []

    if (answers) {
      // Map assessment answers to legacy format if needed
      // This allows backward compatibility
      if (!finalCondition && answers.bodyCondition) {
        const bodyCond = Array.isArray(answers.bodyCondition) 
          ? answers.bodyCondition[0] 
          : answers.bodyCondition
        finalCondition = bodyCond || 'good'
      }
      if (!finalUsage && answers.age) {
        // Map age to usage
        if (answers.age === 'lessThan3Months') finalUsage = 'light'
        else if (answers.age === 'fourToTwelveMonths') finalUsage = 'moderate'
        else finalUsage = 'heavy'
      }
      if (!finalAccessories.length && answers.accessories) {
        finalAccessories = Array.isArray(answers.accessories) 
          ? answers.accessories 
          : [answers.accessories]
      }
    }

    // Ensure we have condition and usage (use defaults if not provided)
    finalCondition = finalCondition || 'good'
    finalUsage = finalUsage || 'moderate'

    // Generate custom Order ID
    // Use provided address or defaults (Tamil Nadu, Coimbatore RTO 37)
    const state = body.state || 'Tamil Nadu'
    const pincode = body.pincode || '641004' // Default to Coimbatore pincode
    
    let orderId: string
    try {
      logger.info('Starting Order ID generation', { state, pincode, category, brand })
      orderId = await generateOrderId(state, pincode, category, brand)
      logger.info('Successfully generated Order ID', { orderId, state, pincode, category, brand })
    } catch (error: any) {
      logger.error('Error generating Order ID', {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        code: error?.code,
        state,
        pincode,
        category,
        brand,
      })
      // Don't use fallback - fail the request if Order ID generation fails
      // This ensures we always get sequential numbers
      return NextResponse.json(
        { error: 'Failed to generate Order ID' },
        { status: 500 }
      )
    }

    // Initialize Firestore for server-side using centralized utility
    const db = getFirestoreServer()
    const valuationDocRef = doc(db, 'valuations', orderId)
    
    const newValuation = {
      category,
      brand,
      model,
      condition: finalCondition,
      usage: finalUsage,
      accessories: finalAccessories,
      basePrice: basePrice || 0,
      estimatedValue: estimatedValue || 0,
      userId: userId || null,
      status: 'pending',
      orderId, // Store the custom Order ID
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Include address data if provided
      ...(body.pickupAddress && { pickupAddress: body.pickupAddress }),
      ...(body.userName && { userName: body.userName }),
      ...(body.userPhone && { userPhone: body.userPhone }),
      ...(body.state && { state: body.state }),
      ...(body.pincode && { pincode: body.pincode }),
      // Store full assessment answers for admin and reporting
      ...(body.answers && typeof body.answers === 'object' && { answers: body.answers }),
      ...(body.variantId && { variantId: body.variantId }),
      ...(body.variantLabel && { variantLabel: body.variantLabel }),
    }
    
    // Use setDoc with custom Order ID instead of addDoc
    await setDoc(valuationDocRef, newValuation)

    return NextResponse.json({ 
      success: true, 
      id: orderId,
      message: 'Valuation created successfully' 
    })
  } catch (error: any) {
    logger.error('Error creating valuation', {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      code: error?.code,
    })
    return NextResponse.json(
      { error: 'Failed to create valuation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting (200 requests per minute per IP for reads)
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 200, windowMs: 60000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    // Validate query parameter lengths to prevent abuse
    if (id && (id.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(id))) {
      return NextResponse.json({ error: 'Invalid id parameter' }, { status: 400 })
    }
    if (userId && (userId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(userId))) {
      return NextResponse.json({ error: 'Invalid userId parameter' }, { status: 400 })
    }

    if (id) {
      const valuation = await getValuation(id)
      if (!valuation) {
        return NextResponse.json(
          { error: 'Valuation not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ valuation })
    }

    if (userId) {
      const valuations = await getUserValuations(userId)
      return NextResponse.json({ valuations })
    }

    return NextResponse.json(
      { error: 'Missing id or userId parameter' },
      { status: 400 }
    )
  } catch (error) {
    logger.error('Error fetching valuation', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'Failed to fetch valuation' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting (50 requests per minute per IP for updates)
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 50, windowMs: 60000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
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
    const validation = validateSchema(valuationUpdateSchema, body)
    if (!validation.isValid) {
      return validationErrorResponse(validation.errors!)
    }
    
    const { id, ...updates } = validation.data!

    await updateValuation(id, updates)

    return NextResponse.json({ 
      success: true,
      message: 'Valuation updated successfully' 
    })
  } catch (error) {
    logger.error('Error updating valuation', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'Failed to update valuation' },
      { status: 500 }
    )
  }
}










