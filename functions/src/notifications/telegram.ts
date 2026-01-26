/**
 * Telegram Notification Function
 */

import { Request, Response } from 'firebase-functions'
import { createLogger } from '../utils/logger'

const logger = createLogger('Functions:Telegram')

export async function sendTelegramNotification(req: Request, res: Response): Promise<void> {
  try {
    const { productName, price, customer, pickupDate, pickupTime, requestId } = req.body

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

    const response = await fetch(telegramApiUrl, {
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

    if (!response.ok) {
      const errorData = await response.json()
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
