import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('API:WhatsApp')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, price, customer, pickupDate, pickupTime, requestId } = body

    // Twilio Configuration - Use provided credentials
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'ACbfb8f7ec2babdb65904df53965039ff3'
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '08d1368c1aaf9489469ae9c5d87a8f'
    const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+919843010869'
    const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || 'PICKUP confirmed!'

    logger.info('WhatsApp notification request received', {
      customerName: customer.name,
      customerPhone: customer.phone,
      productName,
      requestId,
    })

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
      year: 'numeric'
    })

    // Format time slot (handle both formats)
    let formattedTime = pickupTime
    if (!pickupTime.includes('-')) {
      // If only start time provided, keep as is
      formattedTime = pickupTime
    }

    // Format price
    const formattedPrice = price.toLocaleString('en-IN')

    // Get ContentSid from template name (or use provided ContentSid)
    const WHATSAPP_CONTENT_SID = process.env.WHATSAPP_CONTENT_SID
    let contentSid = WHATSAPP_CONTENT_SID

    // If ContentSid not provided, try to fetch it from template name
    if (!contentSid) {
      try {
        const contentApiUrl = `https://content.twilio.com/v1/Content`
        const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
        
        const contentResponse = await fetch(contentApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${credentials}`,
          },
        })

        if (contentResponse.ok) {
          const contentData = await contentResponse.json()
          const template = contentData.contents?.find((c: any) => 
            c.friendly_name === WHATSAPP_TEMPLATE_NAME || 
            c.friendly_name?.toLowerCase().includes('pickup')
          )
          if (template) {
            contentSid = template.sid
            logger.info('Found ContentSid from template name', { 
              templateName: WHATSAPP_TEMPLATE_NAME,
              contentSid,
            })
          }
        }
      } catch (error) {
        logger.warn('Could not fetch ContentSid, will use plain message', error)
      }
    }

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
      template: WHATSAPP_TEMPLATE_NAME,
      contentSid: contentSid || 'Using plain message',
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
    if (contentSid) {
      formData.append('ContentSid', contentSid)
      formData.append('ContentVariables', contentVariables)
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
    }

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const responseData = await response.json().catch(async () => {
      try {
        return await response.text()
      } catch {
        return 'Unknown error'
      }
    })

    if (!response.ok) {
      logger.error('Twilio API error', { 
        status: response.status,
        statusText: response.statusText,
        error: responseData,
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${customerPhone}`,
        requestId,
      })
      return NextResponse.json(
        { error: 'Failed to send WhatsApp notification', details: responseData },
        { status: 200 } // Return 200 so it doesn't fail the request
      )
    }

    logger.info('WhatsApp notification sent successfully', { 
      messageSid: responseData.sid,
      requestId,
      customerPhone,
    })
    return NextResponse.json({ success: true, messageSid: responseData.sid })
  } catch (error) {
    logger.error('Error sending WhatsApp notification', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 200 } // Return 200 so it doesn't fail the request
    )
  }
}
