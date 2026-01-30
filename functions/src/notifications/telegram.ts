/**
 * Telegram Notification Function
 */

import { Request, Response } from 'firebase-functions'
import { createLogger } from '../utils/logger'

const logger = createLogger('Functions:Telegram')

/**
 * Sanitize string for Telegram HTML to prevent injection
 */
function sanitizeTelegramHtml(str: string | undefined | null): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Validate notification request body
 */
function validateNotificationRequest(body: unknown): { valid: true; data: { productName: string; price: number; customer: { name: string; email: string; phone: string; address: string; landmark?: string; city: string; state: string; pincode: string }; pickupDate: string; pickupTime: string; requestId: string } } | { valid: false; error: string } {
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
  if (!c.email || typeof c.email !== 'string') {
    return { valid: false, error: 'Invalid customer email' }
  }
  if (!c.phone || typeof c.phone !== 'string') {
    return { valid: false, error: 'Invalid customer phone' }
  }
  if (!c.address || typeof c.address !== 'string') {
    return { valid: false, error: 'Invalid customer address' }
  }
  if (!c.city || typeof c.city !== 'string') {
    return { valid: false, error: 'Invalid customer city' }
  }
  if (!c.state || typeof c.state !== 'string') {
    return { valid: false, error: 'Invalid customer state' }
  }
  if (!c.pincode || typeof c.pincode !== 'string') {
    return { valid: false, error: 'Invalid customer pincode' }
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
        email: c.email as string,
        phone: c.phone as string,
        address: c.address as string,
        landmark: c.landmark as string | undefined,
        city: c.city as string,
        state: c.state as string,
        pincode: c.pincode as string,
      },
      pickupDate,
      pickupTime,
      requestId,
    }
  }
}

export async function sendTelegramNotification(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    const validation = validateNotificationRequest(req.body)
    if (!validation.valid) {
      res.status(400).json({ error: validation.error })
      return
    }
    
    const { productName, price, customer, pickupDate, pickupTime, requestId } = validation.data

    // Telegram Bot Configuration - Use secrets from Firebase Functions
    // Secrets are automatically available as environment variables when using defineSecret
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      logger.warn('Telegram bot credentials not configured', {
        hasToken: !!TELEGRAM_BOT_TOKEN,
        hasChatId: !!TELEGRAM_CHAT_ID,
      })
      res.status(200).json({ error: 'Telegram bot not configured. Notification skipped.' })
      return
    }

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

    // Sanitize all user inputs for Telegram HTML
    const safeProductName = sanitizeTelegramHtml(productName)
    const safeCustomerName = sanitizeTelegramHtml(customer.name)
    const safeCustomerPhone = sanitizeTelegramHtml(customer.phone)
    const safeCustomerEmail = sanitizeTelegramHtml(customer.email)
    const safeAddress = sanitizeTelegramHtml(customer.address)
    const safeLandmark = sanitizeTelegramHtml(customer.landmark)
    const safeCity = sanitizeTelegramHtml(customer.city)
    const safeState = sanitizeTelegramHtml(customer.state)
    const safePincode = sanitizeTelegramHtml(customer.pincode)
    const safeRequestId = sanitizeTelegramHtml(requestId)

    // Format address
    const fullAddress = `${safeAddress}${safeLandmark ? `, ${safeLandmark}` : ''}, ${safeCity}, ${safeState} - ${safePincode}`

    // Format message to match the exact format from the image
    // Using HTML parse mode for clickable email link
    const message = `🔔 <b>New Pickup Request</b>

📦 Device: ${safeProductName}
💰 Price: ₹${price.toLocaleString('en-IN')}
👤 Customer Details:
• Name: ${safeCustomerName}
• Phone: ${safeCustomerPhone}
• Email: <a href="mailto:${safeCustomerEmail}">${safeCustomerEmail}</a>
📍 Address: ${fullAddress}
📅 Pickup Slot: ${pickupSlot}
🆔 Request ID: ${safeRequestId}
Status: Pending`

    // Send message to Telegram with timeout
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let response: globalThis.Response
    try {
      response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML', // Use HTML for clickable email links
        }),
        signal: controller.signal,
      })
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        logger.error('Telegram API request timed out')
        res.status(200).json({ error: 'Telegram service timeout' })
        return
      }
      throw fetchError
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      let errorData: unknown
      try {
        errorData = await response.json()
      } catch {
        errorData = await response.text()
      }
      logger.error('Telegram API error', errorData)
      res.status(200).json({ error: 'Failed to send Telegram notification' })
      return
    }

    logger.debug('Telegram notification sent successfully')
    res.json({ success: true })
  } catch (error) {
    logger.error('Error sending Telegram notification', error)
    res.status(200).json({ error: 'Failed to send notification' })
  }
}
