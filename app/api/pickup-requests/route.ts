import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { getFirestoreServer } from '@/lib/firebase/server'
import { pickupRequestSchema } from '@/lib/validations/schemas'
import { validateSchema, validationErrorResponse } from '@/lib/validations'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('API:PickupRequests')

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (50 requests per minute per IP for pickup requests)
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 50, windowMs: 60000 })
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
    
    const body = await request.json()
    
    // Validate request body
    const validation = validateSchema(pickupRequestSchema, body)
    if (!validation.isValid) {
      return validationErrorResponse(validation.errors!)
    }
    
    const { productName, price, customer, pickupDate, pickupTime } = validation.data!

    // Initialize Firestore for server-side using centralized utility
    const db = getFirestoreServer()
    const pickupRequestsRef = collection(db, 'pickupRequests')
    const docRef = await addDoc(pickupRequestsRef, {
      productName,
      price,
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        landmark: customer.landmark || '',
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
      },
      pickupDate,
      pickupTime,
      createdAt: Timestamp.now(),
      status: 'pending',
    })

    // Send notifications via Firebase Functions
    // All notification logic is handled by Firebase Functions to ensure server-side secrets are secure
    const requestId = docRef.id
    const notificationData = {
      productName,
      price,
      customer,
      pickupDate,
      pickupTime,
      requestId,
    }

    // Get Firebase Functions URL
    function getFunctionsUrl(): string {
      if (process.env.NEXT_PUBLIC_FUNCTIONS_URL) {
        return process.env.NEXT_PUBLIC_FUNCTIONS_URL
      }
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      const region = process.env.NEXT_PUBLIC_FUNCTION_REGION || 'us-central1'
      if (!projectId) {
        throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID or NEXT_PUBLIC_FUNCTIONS_URL is required')
      }
      return `https://${region}-${projectId}.cloudfunctions.net`
    }

    const functionsUrl = getFunctionsUrl()

    // Send Telegram notification to admin (via Firebase Function)
    try {
      await fetch(`${functionsUrl}/telegramNotify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      }).catch((error) => {
        logger.warn('Failed to send Telegram notification via Firebase Function', { error })
      })
    } catch (telegramError) {
      logger.error('Error sending Telegram notification', {
        error: telegramError instanceof Error ? telegramError.message : String(telegramError),
        requestId,
      })
      // Don't fail the request if Telegram fails
    }

    // Send WhatsApp notification to customer (via Firebase Function)
    try {
      await fetch(`${functionsUrl}/whatsappNotify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      }).catch((error) => {
        logger.warn('Failed to send WhatsApp notification via Firebase Function', { error })
      })
    } catch (whatsappError) {
      logger.warn('Error sending WhatsApp notification', whatsappError)
      // Don't fail the request if WhatsApp fails
    }

    // Send email confirmation to customer (via Firebase Function)
    try {
      await fetch(`${functionsUrl}/emailConfirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      }).catch((error) => {
        logger.warn('Failed to send email confirmation via Firebase Function', { error })
      })
    } catch (emailError) {
      logger.warn('Error sending email confirmation', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      id: docRef.id,
    })
  } catch (error) {
    logger.error('Error creating pickup request', error)
    return NextResponse.json(
      { 
        error: 'Failed to create pickup request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
