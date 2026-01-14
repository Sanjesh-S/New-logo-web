/**
 * Telegram Notification Function
 */

import { Request, Response } from 'firebase-functions'
import { createLogger } from '../utils/logger'

const logger = createLogger('Functions:Telegram')

export async function sendTelegramNotification(req: Request, res: Response): Promise<void> {
  try {
    const { productName, price, customer, pickupDate, pickupTime, requestId } = req.body

    // Telegram Bot Configuration
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

    // Format pickup date
    const date = new Date(pickupDate)
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })

    // Format message
    const message = `🔔 *New Pickup Request*

📦 *Device:* ${productName}
💰 *Price:* ₹${price.toLocaleString('en-IN')}

👤 *Customer Details:*
• Name: ${customer.name}
• Phone: ${customer.phone}
• Email: ${customer.email}

📍 *Address:*
${customer.address}${customer.landmark ? ` (Near: ${customer.landmark})` : ''}
${customer.city}, ${customer.state} - ${customer.pincode}

📅 *Pickup Slot:*
${formattedDate} at ${pickupTime}

🆔 *Request ID:* ${requestId}

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
        parse_mode: 'Markdown',
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
