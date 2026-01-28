/**
 * Pickup Request Functions
 */

import { Request, Response } from 'firebase-functions'
import * as admin from 'firebase-admin'
import { pickupRequestSchema, schedulePickupSchema } from './schemas'
import { validateSchema, createValidationErrorResponse } from './utils/validation'
import { checkRateLimit, getClientIdentifier } from './utils/rateLimit'
import { createLogger } from './utils/logger'
// Notifications are called via HTTP requests to other functions

const logger = createLogger('Functions:Pickup')

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

// Get Functions URL for calling other functions
function getFunctionsUrl(): string {
  const projectId = process.env.GCLOUD_PROJECT || admin.app().options.projectId
  const region = process.env.FUNCTION_REGION || 'us-central1'
  return `https://${region}-${projectId}.cloudfunctions.net`
}

export async function createPickupRequest(req: Request, res: Response): Promise<void> {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 50, windowMs: 60000 })
    if (!rateLimit.allowed) {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      })
      res.set('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString())
      res.set('X-RateLimit-Reset', rateLimit.resetTime.toString())
      return
    }

    const body = req.body

    // Validate request body
    const validation = validateSchema(pickupRequestSchema, body)
    if (!validation.isValid) {
      const errorResponse = createValidationErrorResponse(validation.errors!)
      res.status(errorResponse.status).json(errorResponse.body)
      return
    }

    const { productName, price, customer, pickupDate, pickupTime, userId } = validation.data!

    const docRef = await db.collection('pickupRequests').add({
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
    })

    const requestId = docRef.id

    // Send notifications via Firebase Functions (don't fail if they fail)
    const functionsUrl = getFunctionsUrl()
    const notificationData = {
      productName,
      price,
      customer,
      pickupDate,
      pickupTime,
      requestId,
    }

    // Send Telegram notification to admin (via Firebase Function)
    try {
      const telegramResponse = await fetch(`${functionsUrl}/telegramNotify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      })
      
      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text().catch(() => 'Unknown error')
        logger.error('Telegram notification failed', {
          status: telegramResponse.status,
          statusText: telegramResponse.statusText,
          error: errorText,
          requestId,
          functionsUrl: `${functionsUrl}/telegramNotify`,
        })
      } else {
        logger.info('Telegram notification sent successfully', { requestId })
      }
    } catch (error) {
      logger.error('Failed to send Telegram notification', {
        error: error instanceof Error ? error.message : String(error),
        requestId,
        functionsUrl: `${functionsUrl}/telegramNotify`,
      })
    }

    // Send WhatsApp notification to customer (via Firebase Function)
    try {
      const whatsappResponse = await fetch(`${functionsUrl}/whatsappNotify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      })
      
      if (!whatsappResponse.ok) {
        const errorText = await whatsappResponse.text().catch(() => 'Unknown error')
        logger.error('WhatsApp notification failed', {
          status: whatsappResponse.status,
          statusText: whatsappResponse.statusText,
          error: errorText,
          requestId,
          functionsUrl: `${functionsUrl}/whatsappNotify`,
        })
      } else {
        logger.info('WhatsApp notification sent successfully', { requestId })
      }
    } catch (error) {
      logger.error('Failed to send WhatsApp notification', {
        error: error instanceof Error ? error.message : String(error),
        requestId,
        functionsUrl: `${functionsUrl}/whatsappNotify`,
      })
    }

    // Send email confirmation
    try {
      await fetch(`${functionsUrl}/emailConfirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      }).catch(() => {}) // Ignore errors
    } catch (error) {
      logger.warn('Failed to send email confirmation', error)
    }

    res.json({
      success: true,
      id: requestId,
    })
  } catch (error) {
    logger.error('Error creating pickup request', error)
    res.status(500).json({
      error: 'Failed to create pickup request',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export async function schedulePickup(req: Request, res: Response): Promise<void> {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 20, windowMs: 60000 })
    if (!rateLimit.allowed) {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      })
      res.set('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString())
      res.set('X-RateLimit-Reset', rateLimit.resetTime.toString())
      return
    }

    const body = req.body

    // Validate request body
    const validation = validateSchema(schedulePickupSchema, body)
    if (!validation.isValid) {
      const errorResponse = createValidationErrorResponse(validation.errors!)
      res.status(errorResponse.status).json(errorResponse.body)
      return
    }

    if (!validation.data) {
      const errorResponse = createValidationErrorResponse(validation.errors!)
      res.status(errorResponse.status).json(errorResponse.body)
      return
    }

    const { valuationId, pickupDate, pickupTime } = validation.data

    const valuationRef = db.collection('valuations').doc(valuationId)

    // Check if valuation exists
    const valuationDoc = await valuationRef.get()
    if (!valuationDoc.exists) {
      res.status(404).json({ error: 'Valuation not found' })
      return
    }

    // Update valuation with pickup schedule
    await valuationRef.update({
      pickupDate: admin.firestore.Timestamp.fromDate(new Date(pickupDate)),
      pickupTime,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    logger.info('Pickup scheduled successfully', { valuationId, pickupDate, pickupTime })

    res.json({
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
    res.status(500).json({
      error: 'Failed to schedule pickup',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
