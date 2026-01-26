import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { getFirestoreServer } from '@/lib/firebase/server'
import { pickupRequestSchema } from '@/lib/validations/schemas'
import { validateSchema, validationErrorResponse } from '@/lib/validations'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('API:PickupRequests')

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (50 requests per minute per IP for pickup requests)
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 50, windowMs: 60000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        }
      )
    }
    
    const body = await request.json()
    
    // Validate request body
    const validation = validateSchema(pickupRequestSchema, body)
    if (!validation.isValid) {
      return validationErrorResponse(validation.errors!)
    }
    
    const { productName, price, customer, pickupDate, pickupTime } = validation.data!

    // Initialize Firestore for server-side using centralized utility
    const db = getFirestoreServer()
    const pickupRequestsRef = collection(db, 'pickupRequests')
    const docRef = await addDoc(pickupRequestsRef, {
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
      createdAt: Timestamp.now(),
      status: 'pending',
    })

    // Send Telegram notification to admin - Call Telegram API directly
    try {
      // Telegram Bot Configuration
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8588484467:AAGgyZn5TNgz1LgmM0M5hQ_ZeQPk6JEzs6A'
      const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6493761091'

      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        // Format pickup date - Match the format: "Wednesday, Jan 14 at 06:00 AM - 08:00 AM"
        const date = new Date(pickupDate)
        const formattedDate = date.toLocaleDateString('en-IN', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
        
        // Format time slot
        let timeSlot = pickupTime
        if (!pickupTime.includes('-')) {
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
        
        const pickupSlot = `${formattedDate} at ${timeSlot}`
        const fullAddress = `${customer.address}${customer.landmark ? `, ${customer.landmark}` : ''}, ${customer.city}, ${customer.state} - ${customer.pincode}`

        const message = `🔔 <b>New Pickup Request</b>

📦 Device: ${productName}
💰 Price: ₹${price.toLocaleString('en-IN')}
👤 Customer Details:
• Name: ${customer.name}
• Phone: ${customer.phone}
• Email: <a href="mailto:${customer.email}">${customer.email}</a>
📍 Address: ${fullAddress}
📅 Pickup Slot: ${pickupSlot}
🆔 Request ID: ${docRef.id}
Status: Pending`

        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
        
        const telegramResponse = await fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
          }),
        })

        const responseData = await telegramResponse.json().catch(() => ({}))
        
        if (!telegramResponse.ok) {
          logger.error('Telegram API error', {
            status: telegramResponse.status,
            error: responseData,
            requestId: docRef.id,
          })
        } else {
          logger.info('Telegram notification sent successfully', {
            requestId: docRef.id,
            messageId: responseData.result?.message_id,
          })
        }
      } else {
        logger.warn('Telegram bot credentials not configured')
      }
    } catch (telegramError) {
      logger.error('Error sending Telegram notification', {
        error: telegramError instanceof Error ? telegramError.message : String(telegramError),
        requestId: docRef.id,
      })
      // Don't fail the request if Telegram fails
    }

    // Send WhatsApp notification to customer
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      const whatsappResponse = await fetch(`${baseUrl}/api/whatsapp/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName,
          price,
          customer,
          pickupDate,
          pickupTime,
          requestId: docRef.id,
        }),
      })

      if (!whatsappResponse.ok) {
        const errorText = await whatsappResponse.text()
        logger.warn('Failed to send WhatsApp notification', { errorText })
      } else {
        logger.debug('WhatsApp notification sent successfully')
      }
    } catch (whatsappError) {
      logger.warn('Error sending WhatsApp notification', whatsappError)
      // Don't fail the request if WhatsApp fails
    }

    // Send email confirmation to customer
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      const emailResponse = await fetch(`${baseUrl}/api/email/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName,
          price,
          customer,
          pickupDate,
          pickupTime,
          requestId: docRef.id,
        }),
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        logger.warn('Failed to send email confirmation', { errorText })
      } else {
        logger.debug('Email confirmation sent successfully')
      }
    } catch (emailError) {
      logger.warn('Error sending email confirmation', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      id: docRef.id,
    })
  } catch (error) {
    logger.error('Error creating pickup request', error)
    return NextResponse.json(
      { 
        error: 'Failed to create pickup request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
