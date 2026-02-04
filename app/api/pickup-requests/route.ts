import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, Timestamp, query, where, getDocs, limit } from 'firebase/firestore'
import { getFirestoreServer } from '@/lib/firebase/server'
import { pickupRequestSchema } from '@/lib/validations/schemas'
import { validateSchema, validationErrorResponse } from '@/lib/validations'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { getRequestBody } from '@/lib/middleware/request-limits'
import { verifyCSRFToken } from '@/lib/middleware/csrf'
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
    
    // CSRF protection
    const csrfCheck = verifyCSRFToken(request)
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: csrfCheck.error || 'CSRF validation failed' },
        { status: 403 }
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
    const validation = validateSchema(pickupRequestSchema, body)
    if (!validation.isValid) {
      return validationErrorResponse(validation.errors!)
    }
    
    const { productName, price, customer, pickupDate, pickupTime, userId, valuationId, assessmentAnswers } = validation.data!

    logger.info('Creating pickup request', { 
      productName, 
      price, 
      customerPhone: customer.phone,
      valuationId: valuationId || 'none'
    })

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
      userId: userId || null,
      valuationId: valuationId || null,
      ...(assessmentAnswers && typeof assessmentAnswers === 'object' && Object.keys(assessmentAnswers).length > 0 && { assessmentAnswers }),
      createdAt: Timestamp.now(),
      status: 'pending',
    })

    // Auto-save address if userId exists and address doesn't already exist
    if (userId) {
      try {
        const addressesRef = collection(db, 'savedAddresses')
        // Check if address already exists for this user
        const addressQuery = query(
          addressesRef,
          where('userId', '==', userId),
          where('address', '==', customer.address),
          where('pincode', '==', customer.pincode),
          where('phone', '==', customer.phone),
          limit(1)
        )
        const addressSnapshot = await getDocs(addressQuery)

        if (addressSnapshot.empty) {
          // Address doesn't exist, save it
          // Check if this will be the first address (set as default)
          const userAddressesQuery = query(
            addressesRef,
            where('userId', '==', userId),
            limit(1)
          )
          const userAddressesSnapshot = await getDocs(userAddressesQuery)
          const isFirstAddress = userAddressesSnapshot.empty

          await addDoc(addressesRef, {
            userId,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            landmark: customer.landmark || '',
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode,
            isDefault: isFirstAddress, // Set as default if it's the first address
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
          logger.info('Auto-saved address for user', { userId, address: customer.address })
        } else {
          logger.info('Address already exists for user', { userId })
        }
      } catch (addressError) {
        logger.error('Failed to auto-save address', { userId, error: addressError })
        // Don't fail the request - address saving is optional
      }
    }

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
      const telegramResponse = await fetch(`${functionsUrl}/telegramNotify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      })
      
      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text()
        logger.error('Telegram notification failed', {
          status: telegramResponse.status,
          statusText: telegramResponse.statusText,
          error: errorText,
          requestId,
        })
      } else {
        logger.info('Telegram notification sent successfully', { requestId })
      }
    } catch (telegramError) {
      logger.error('Error sending Telegram notification', {
        error: telegramError instanceof Error ? telegramError.message : String(telegramError),
        requestId,
        functionsUrl,
      })
      // Don't fail the request if Telegram fails
    }

    // Send WhatsApp notification to customer (via Firebase Function)
    try {
      const whatsappResponse = await fetch(`${functionsUrl}/whatsappNotify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      })
      
      if (!whatsappResponse.ok) {
        const errorText = await whatsappResponse.text()
        logger.error('WhatsApp notification failed', {
          status: whatsappResponse.status,
          statusText: whatsappResponse.statusText,
          error: errorText,
          requestId,
        })
      } else {
        logger.info('WhatsApp notification sent successfully', { requestId })
      }
    } catch (whatsappError) {
      logger.error('Error sending WhatsApp notification', {
        error: whatsappError instanceof Error ? whatsappError.message : String(whatsappError),
        requestId,
        functionsUrl,
      })
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
