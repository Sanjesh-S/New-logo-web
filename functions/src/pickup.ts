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

    const { productName, price, customer, pickupDate, pickupTime } = validation.data!

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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
    })

    const requestId = docRef.id

    // Send Telegram notification directly
    try {
      // Telegram Bot Configuration - Use provided bot token and chat ID
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
      const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        // Format pickup date - Match the format: "Wednesday, Jan 14 at 06:00 AM - 08:00 AM"
        const date = new Date(pickupDate)
        const formattedDate = date.toLocaleDateString('en-IN', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
        
        // Format time slot (assuming pickupTime is like "06:00 AM - 08:00 AM" or just "06:00 AM")
        let timeSlot = pickupTime
        if (!pickupTime.includes('-')) {
          // If only start time provided, create a 2-hour slot
          const [time, period] = pickupTime.split(' ')
          const [hours, minutes] = time.split(':')
          let endHour = parseInt(hours)
          if (period === 'PM' && endHour !== 12) endHour += 12
          if (period === 'AM' && endHour === 12) endHour = 0
          endHour = (endHour + 2) % 24
          const endPeriod = endHour >= 12 ? 'PM' : 'AM'
          const displayEndHour = endHour > 12 ? endHour - 12 : (endHour === 0 ? 12 : endHour)
          timeSlot = `${pickupTime} - ${displayEndHour}:${minutes} ${endPeriod}`
        }
        
        // Combine date and time slot in the exact format from image
        const pickupSlot = `${formattedDate} at ${timeSlot}`

        // Format address
        const fullAddress = `${customer.address}${customer.landmark ? `, ${customer.landmark}` : ''}, ${customer.city}, ${customer.state} - ${customer.pincode}`

        // Format message to match the exact format from the image
        // Using HTML parse mode for clickable email link
        const message = `🔔 <b>New Pickup Request</b>

📦 Device: ${productName}
💰 Price: ₹${price.toLocaleString('en-IN')}
👤 Customer Details:
• Name: ${customer.name}
• Phone: ${customer.phone}
• Email: <a href="mailto:${customer.email}">${customer.email}</a>
📍 Address: ${fullAddress}
📅 Pickup Slot: ${pickupSlot}
🆔 Request ID: ${requestId}
Status: Pending`

        // Send message to Telegram
        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
        
        const telegramResponse = await fetch(telegramApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML', // Use HTML for clickable email links
          }),
        })

        const responseData = await telegramResponse.json().catch(() => ({}))
        
        if (!telegramResponse.ok) {
          logger.error('Telegram API error', {
            status: telegramResponse.status,
            statusText: telegramResponse.statusText,
            error: responseData,
            requestId,
          })
        } else {
          logger.info('Telegram notification sent successfully', { 
            requestId,
            messageId: responseData.result?.message_id,
          })
        }
      } else {
        logger.warn('Telegram bot credentials not configured', {
          hasToken: !!TELEGRAM_BOT_TOKEN,
          hasChatId: !!TELEGRAM_CHAT_ID,
        })
      }
    } catch (error) {
      logger.error('Failed to send Telegram notification', {
        error: error instanceof Error ? error.message : String(error),
        requestId,
      })
      // Don't fail the request if Telegram fails
    }

    // Send notifications (don't fail if they fail)
    const functionsUrl = getFunctionsUrl()
    const notificationData = {
      productName,
      price,
      customer,
      pickupDate,
      pickupTime,
      requestId,
    }

    // Send WhatsApp notification
    try {
      await fetch(`${functionsUrl}/whatsappNotify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      }).catch(() => {}) // Ignore errors
    } catch (error) {
      logger.warn('Failed to send WhatsApp notification', error)
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
