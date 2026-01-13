import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('API:WhatsApp')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, price, customer, pickupDate, pickupTime, requestId } = body

    // Twilio Configuration
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
    const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      logger.warn('Twilio credentials not configured', {
        hasAccountSid: !!TWILIO_ACCOUNT_SID,
        hasAuthToken: !!TWILIO_AUTH_TOKEN,
        hasWhatsAppNumber: !!TWILIO_WHATSAPP_NUMBER,
      })
      return NextResponse.json(
        { error: 'Twilio not configured. WhatsApp notification skipped.' },
        { status: 200 } // Return 200 so it doesn't fail the request
      )
    }

    // Format customer phone number (ensure it starts with country code)
    let customerPhone = customer.phone
    if (!customerPhone.startsWith('+')) {
      // Assume Indian number, add +91
      customerPhone = `+91${customerPhone}`
    }

    // Format pickup date
    const date = new Date(pickupDate)
    const formattedDate = date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })

    // Format WhatsApp message (customer-friendly)
    const message = `✅ *Pickup Confirmed!*

Hi ${customer.name},

Your pickup for ${productName} has been scheduled.

📅 *Date:* ${formattedDate}
⏰ *Time:* ${pickupTime}
💰 *Quoted Price:* ₹${price.toLocaleString('en-IN')}

Our agent will contact you to confirm.

Thank you for choosing WorthyTen!`

    // Twilio WhatsApp API endpoint
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
    
    // Create basic auth header
    const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
    
    // Form data for Twilio API
    const formData = new URLSearchParams()
    formData.append('From', `whatsapp:${TWILIO_WHATSAPP_NUMBER}`)
    formData.append('To', `whatsapp:${customerPhone}`)
    formData.append('Body', message)

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = await response.text()
      }
      logger.error('Twilio API error', { 
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${customerPhone}`
      })
      // Log to console for debugging
      console.error('[WhatsApp Error]', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      return NextResponse.json(
        { error: 'Failed to send WhatsApp notification', details: errorData },
        { status: 200 } // Return 200 so it doesn't fail the request
      )
    }

    const result = await response.json()
    logger.debug('WhatsApp notification sent successfully', { messageSid: result.sid })
    return NextResponse.json({ success: true, messageSid: result.sid })
  } catch (error) {
    logger.error('Error sending WhatsApp notification', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 200 } // Return 200 so it doesn't fail the request
    )
  }
}
