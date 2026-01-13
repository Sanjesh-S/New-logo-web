import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreServer } from '@/lib/firebase/server'
import { collection, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { createLogger } from '@/lib/utils/logger'
import { z } from 'zod'

const logger = createLogger('API:PickupSchedule')

const schedulePickupSchema = z.object({
  valuationId: z.string().min(1, 'Valuation ID is required'),
  pickupDate: z.string().min(1, 'Pickup date is required'),
  pickupTime: z.string().min(1, 'Pickup time is required'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 20, windowMs: 60000 })
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
    const validation = schedulePickupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { valuationId, pickupDate, pickupTime } = validation.data

    // Initialize Firestore
    const db = getFirestoreServer()
    const valuationRef = doc(db, 'valuations', valuationId)

    // Check if valuation exists
    const valuationDoc = await getDoc(valuationRef)
    if (!valuationDoc.exists()) {
      return NextResponse.json(
        { error: 'Valuation not found' },
        { status: 404 }
      )
    }

    // Update valuation with pickup schedule
    await updateDoc(valuationRef, {
      pickupDate: Timestamp.fromDate(new Date(pickupDate)),
      pickupTime,
      updatedAt: Timestamp.now(),
    })

    // Also update or create pickup request if it exists
    try {
      const pickupRequestsRef = collection(db, 'pickupRequests')
      // Try to find existing pickup request for this valuation
      // For now, we'll just update the valuation
      // In a full implementation, you might want to create/update a pickup request
    } catch (pickupError) {
      logger.warn('Could not update pickup request', pickupError)
      // Don't fail the request if pickup request update fails
    }

    logger.info('Pickup scheduled successfully', { valuationId, pickupDate, pickupTime })

    return NextResponse.json({
      success: true,
      message: 'Pickup scheduled successfully',
      data: {
        valuationId,
        pickupDate,
        pickupTime,
      },
    })
  } catch (error) {
    logger.error('Error scheduling pickup', error)
    return NextResponse.json(
      {
        error: 'Failed to schedule pickup',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
