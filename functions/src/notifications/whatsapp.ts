/**
 * WhatsApp Notification Function
 */

import { Request, Response } from 'firebase-functions'
import { createLogger } from '../utils/logger'

const logger = createLogger('Functions:WhatsApp')

export async function sendWhatsAppNotification(req: Request, res: Response): Promise<void> {
  try {
    const { productName, price, customer, pickupDate, pickupTime } = req.body

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
      res.status(200).json({ error: 'Twilio not configured. WhatsApp notification skipped.' })
      return
    }

    // Format customer phone number
    let customerPhone = customer.phone
    if (!customerPhone.startsWith('+')) {
      customerPhone = `+91${customerPhone}`
    }

    // Format pickup date
    const date = new Date(pickupDate)
    const formattedDate = date.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    // Format WhatsApp message
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
      })
      res.status(200).json({ error: 'Failed to send WhatsApp notification', details: errorData })
      return
    }

    const result = await response.json()
    logger.debug('WhatsApp notification sent successfully', { messageSid: result.sid })
    res.json({ success: true, messageSid: result.sid })
  } catch (error) {
    logger.error('Error sending WhatsApp notification', error)
    res.status(200).json({ error: 'Failed to send notification' })
  }
}
