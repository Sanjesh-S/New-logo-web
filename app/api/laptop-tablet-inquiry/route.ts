import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { getFirestoreServer } from '@/lib/firebase/server'
import { createLogger } from '@/lib/utils/logger'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { getRequestBody } from '@/lib/middleware/request-limits'
import { z } from 'zod'

const logger = createLogger('API:LaptopTabletInquiry')

const inquirySchema = z.object({
  category: z.string().min(1).max(100),
  model: z.string().min(1).max(200),
  age: z.string().min(1).max(100),
  warranty: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  contact: z.string().min(1).max(20),
  location: z.string().min(1).max(500),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (20 requests per minute per IP)
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 20, windowMs: 60000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
      )
    }

    // Validate request size
    const { body, error: bodyError } = await getRequestBody(request)
    if (bodyError) {
      return NextResponse.json({ error: bodyError }, { status: 413 })
    }

    // Validate request body with schema
    const validation = inquirySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues.map(i => i.message) },
        { status: 400 }
      )
    }

    const { category, model, age, warranty, name, contact, location } = validation.data

    // Validate contact number (10 digits)
    const cleanContact = contact.replace(/\D/g, '')
    if (cleanContact.length !== 10) {
      return NextResponse.json(
        { error: 'Invalid contact number. Must be 10 digits.' },
        { status: 400 }
      )
    }

    logger.info('Creating laptop/tablet inquiry', { 
      category,
      model,
      contact: cleanContact
    })

    // Initialize Firestore
    let db
    try {
      db = getFirestoreServer()
      logger.info('Firestore initialized successfully')
    } catch (firebaseError: any) {
      logger.error('Failed to initialize Firestore', {
        error: firebaseError?.message,
        stack: firebaseError?.stack,
      })
      return NextResponse.json(
        { error: 'Failed to initialize database' },
        { status: 500 }
      )
    }

    // Save to Firestore
    let inquiryId: string
    try {
      const inquiriesRef = collection(db, 'laptopTabletInquiries')
      const docRef = await addDoc(inquiriesRef, {
        category,
        model,
        age,
        warranty,
        name,
        contact: cleanContact,
        location,
        createdAt: Timestamp.now(),
        status: 'pending',
      })
      inquiryId = docRef.id
      logger.info('Inquiry saved to Firestore', { inquiryId })
    } catch (firestoreError: any) {
      logger.error('Failed to save inquiry to Firestore', {
        error: firestoreError?.message,
        code: firestoreError?.code,
        stack: firestoreError?.stack,
      })
      return NextResponse.json(
        { error: 'Failed to save inquiry' },
        { status: 500 }
      )
    }

    // Send Telegram notification to admin (non-blocking but with error logging)
    try {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      const region = process.env.NEXT_PUBLIC_FUNCTION_REGION || 'us-central1'
      const functionsUrl = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 
        (projectId ? `https://${region}-${projectId}.cloudfunctions.net` : null)

      if (functionsUrl) {
        const notificationData = {
          category,
          model,
          age,
          warranty,
          customer: {
            name,
            phone: cleanContact,
            location,
          },
          inquiryId,
        }

        const notificationUrl = `${functionsUrl}/telegramNotifyLaptopTablet`
        logger.info('Sending Telegram notification', { notificationUrl, inquiryId })

        // Await the response to catch errors, but don't fail the request if it fails
        try {
          const telegramResponse = await fetch(notificationUrl, {
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
              inquiryId,
              notificationUrl,
            })
          } else {
            const responseData = await telegramResponse.json().catch(() => ({}))
            logger.info('Telegram notification sent successfully', { 
              inquiryId,
              response: responseData 
            })
          }
        } catch (fetchError) {
          logger.error('Telegram notification fetch failed', {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            inquiryId,
            notificationUrl,
          })
        }
      } else {
        logger.warn('Firebase Functions URL not configured, skipping Telegram notification', { 
          inquiryId,
          projectId,
          region 
        })
      }
    } catch (notificationError) {
      logger.error('Error preparing Telegram notification', {
        error: notificationError instanceof Error ? notificationError.message : String(notificationError),
        stack: notificationError instanceof Error ? notificationError.stack : undefined,
        inquiryId,
      })
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      id: inquiryId,
      message: 'Inquiry submitted successfully' 
    })
  } catch (error: any) {
    logger.error('Error creating laptop/tablet inquiry', {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
    })
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    )
  }
}
