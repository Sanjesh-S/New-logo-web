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

    // Send Telegram notification to admin
    try {
      // For server-side, use localhost or environment variable
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      const telegramResponse = await fetch(`${baseUrl}/api/telegram/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName,
          price,
          customer,
          pickupDate,
          pickupTime,
          requestId: docRef.id,
        }),
      })

      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text()
        logger.warn('Failed to send Telegram notification', { errorText })
      } else {
        logger.debug('Telegram notification sent successfully')
      }
    } catch (telegramError) {
      logger.warn('Error sending Telegram notification', telegramError)
      // Don't fail the request if Telegram fails
    }

    // Send WhatsApp notification to customer
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      const whatsappResponse = await fetch(`${baseUrl}/api/whatsapp/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName,
          price,
          customer,
          pickupDate,
          pickupTime,
          requestId: docRef.id,
        }),
      })

      if (!whatsappResponse.ok) {
        const errorText = await whatsappResponse.text()
        logger.warn('Failed to send WhatsApp notification', { errorText })
      } else {
        logger.debug('WhatsApp notification sent successfully')
      }
    } catch (whatsappError) {
      logger.warn('Error sending WhatsApp notification', whatsappError)
      // Don't fail the request if WhatsApp fails
    }

    // Send email confirmation to customer
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      const emailResponse = await fetch(`${baseUrl}/api/email/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName,
          price,
          customer,
          pickupDate,
          pickupTime,
          requestId: docRef.id,
        }),
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        logger.warn('Failed to send email confirmation', { errorText })
      } else {
        logger.debug('Email confirmation sent successfully')
      }
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
