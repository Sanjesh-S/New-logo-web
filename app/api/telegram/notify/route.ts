import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('API:Telegram')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, price, customer, pickupDate, pickupTime, requestId } = body

    // Telegram Bot Configuration
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      logger.warn('Telegram bot credentials not configured', {
        hasToken: !!TELEGRAM_BOT_TOKEN,
        hasChatId: !!TELEGRAM_CHAT_ID,
      })
      return NextResponse.json(
        { error: 'Telegram bot not configured. Notification skipped.' },
        { status: 200 } // Return 200 so it doesn't fail the request
      )
    }

    // Format pickup date
    const date = new Date(pickupDate)
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
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
      return NextResponse.json(
        { error: 'Failed to send Telegram notification' },
        { status: 200 } // Return 200 so it doesn't fail the request
      )
    }

    logger.debug('Telegram notification sent successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error sending Telegram notification', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 200 } // Return 200 so it doesn't fail the request
    )
  }
}
