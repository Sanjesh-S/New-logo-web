import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { getFirestoreServer } from '@/lib/firebase/server'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('API:LaptopTabletInquiry')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { category, model, age, warranty, name, contact, location } = body

    // Basic validation
    if (!category || !model || !age || !warranty || !name || !contact || !location) {
      logger.error('Missing required fields', { body })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate contact number (10 digits)
    const cleanContact = contact.replace(/\D/g, '')
    if (cleanContact.length !== 10) {
      logger.error('Invalid contact number', { contact, cleanContact })
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
        { 
          error: 'Failed to initialize database',
          details: firebaseError?.message || 'Unknown Firebase error'
        },
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
        { 
          error: 'Failed to save inquiry',
          details: firestoreError?.message || 'Unknown Firestore error',
          code: firestoreError?.code
        },
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
      { 
        error: 'Failed to submit inquiry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
