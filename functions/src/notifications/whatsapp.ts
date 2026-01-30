/**
 * WhatsApp Notification Function
 */

import { Request, Response } from 'firebase-functions'
import { createLogger } from '../utils/logger'

const logger = createLogger('Functions:WhatsApp')

/**
 * Validate notification request body
 */
function validateNotificationRequest(body: unknown): { valid: true; data: { productName: string; price: number; customer: { name: string; phone: string }; pickupDate: string; pickupTime: string; requestId: string } } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }
  
  const { productName, price, customer, pickupDate, pickupTime, requestId } = body as Record<string, unknown>
  
  if (!productName || typeof productName !== 'string') {
    return { valid: false, error: 'Invalid productName' }
  }
  if (typeof price !== 'number' || isNaN(price)) {
    return { valid: false, error: 'Invalid price' }
  }
  if (!customer || typeof customer !== 'object') {
    return { valid: false, error: 'Invalid customer data' }
  }
  
  const c = customer as Record<string, unknown>
  if (!c.name || typeof c.name !== 'string') {
    return { valid: false, error: 'Invalid customer name' }
  }
  if (!c.phone || typeof c.phone !== 'string') {
    return { valid: false, error: 'Invalid customer phone' }
  }
  if (!pickupDate || typeof pickupDate !== 'string') {
    return { valid: false, error: 'Invalid pickupDate' }
  }
  if (!pickupTime || typeof pickupTime !== 'string') {
    return { valid: false, error: 'Invalid pickupTime' }
  }
  if (!requestId || typeof requestId !== 'string') {
    return { valid: false, error: 'Invalid requestId' }
  }
  
  return {
    valid: true,
    data: {
      productName,
      price,
      customer: {
        name: c.name as string,
        phone: c.phone as string,
      },
      pickupDate,
      pickupTime,
      requestId,
    }
  }
}

export async function sendWhatsAppNotification(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    const validation = validateNotificationRequest(req.body)
    if (!validation.valid) {
      res.status(400).json({ error: validation.error })
      return
    }
    
    const { productName, price, customer, pickupDate, pickupTime, requestId } = validation.data

    // Twilio Configuration - Use secrets from Firebase Functions
    // Secrets are automatically available as environment variables when using defineSecret
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
    const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER
    const WHATSAPP_CONTENT_SID = process.env.WHATSAPP_CONTENT_SID

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      logger.warn('Twilio credentials not configured', {
        hasAccountSid: !!TWILIO_ACCOUNT_SID,
        hasAuthToken: !!TWILIO_AUTH_TOKEN,
        hasWhatsAppNumber: !!TWILIO_WHATSAPP_NUMBER,
      })
      res.status(200).json({ error: 'Twilio not configured. WhatsApp notification skipped.' })
      return
    }

    // Format customer phone number
    let customerPhone = customer.phone.trim()
    if (!customerPhone.startsWith('+')) {
      // Remove any leading zeros or spaces
      customerPhone = customerPhone.replace(/^0+/, '')
      // Assume Indian number, add +91
      customerPhone = `+91${customerPhone}`
    }

    // Format pickup date to match template format: "Dec 20, 2024"
    const date = new Date(pickupDate)
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    // Format time slot
    let formattedTime = pickupTime
    if (!pickupTime.includes('-')) {
      formattedTime = pickupTime
    }

    // Format price
    const formattedPrice = price.toLocaleString('en-IN')

    // Prepare template variables matching the template structure:
    // {{1}} - Customer name
    // {{2}} - Product name
    // {{3}} - Date
    // {{4}} - Time
    // {{5}} - Price
    const contentVariables = JSON.stringify({
      '1': customer.name,
      '2': productName,
      '3': formattedDate,
      '4': formattedTime,
      '5': formattedPrice,
    })

    logger.info('Sending WhatsApp message', {
      from: TWILIO_WHATSAPP_NUMBER,
      to: customerPhone,
      requestId,
    })

    // Twilio WhatsApp API endpoint
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    // Create basic auth header
    const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')

    // Form data for Twilio API
    const formData = new URLSearchParams()
    formData.append('From', `whatsapp:${TWILIO_WHATSAPP_NUMBER}`)
    formData.append('To', `whatsapp:${customerPhone}`)
    
    // Use Content Template if ContentSid is available, otherwise use plain message
    if (WHATSAPP_CONTENT_SID) {
      formData.append('ContentSid', WHATSAPP_CONTENT_SID)
      formData.append('ContentVariables', contentVariables)
      logger.info('Using WhatsApp template', { contentSid: WHATSAPP_CONTENT_SID })
    } else {
      // Fallback to plain message matching template format
      const message = `✅ Pickup Confirmed!

Hi ${customer.name},

Your pickup for ${productName} has been scheduled.

📅 Date: ${formattedDate}
⏰ Time: ${formattedTime}
💰 Quoted Price: ₹${formattedPrice}

Our agent will contact you to confirm.

Thank you for choosing WorthyTen!`
      formData.append('Body', message)
      logger.info('Using plain WhatsApp message (template not configured)')
    }

    // Add timeout to fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let response: globalThis.Response
    try {
      response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: controller.signal,
      })
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        logger.error('Twilio API request timed out')
        res.status(200).json({ error: 'WhatsApp service timeout' })
        return
      }
      throw fetchError
    } finally {
      clearTimeout(timeoutId)
    }

    let responseData: unknown
    try {
      responseData = await response.json()
    } catch {
      try {
        responseData = await response.text()
      } catch {
        responseData = 'Unknown error'
      }
    }

    if (!response.ok) {
      logger.error('Twilio API error', {
        status: response.status,
        statusText: response.statusText,
        error: responseData,
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${customerPhone}`,
        requestId,
      })
      res.status(200).json({ error: 'Failed to send WhatsApp notification', details: responseData })
      return
    }

    // Type guard for responseData
    const responseObj = responseData as { sid?: string } | null
    const messageSid = responseObj?.sid || 'unknown'

    logger.info('WhatsApp notification sent successfully', { 
      messageSid,
      requestId,
      customerPhone,
    })
    res.json({ success: true, messageSid })
  } catch (error) {
    logger.error('Error sending WhatsApp notification', error)
    res.status(200).json({ error: 'Failed to send notification' })
  }
}
