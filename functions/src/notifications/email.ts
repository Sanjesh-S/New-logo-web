/**
 * Email Confirmation Function
 */

import { Request, Response } from 'firebase-functions'
import * as admin from 'firebase-admin'
import { createLogger } from '../utils/logger'

const logger = createLogger('Functions:Email')

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

/**
 * Sanitize string to prevent XSS in HTML emails
 */
function sanitizeHtml(str: string | undefined | null): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Validate email request body
 */
function validateEmailRequest(body: unknown): { valid: true; data: { productName: string; price: number; customer: { name: string; email: string; phone: string; address: string; landmark?: string; city: string; state: string; pincode: string }; pickupDate: string; pickupTime: string; requestId: string } } | { valid: false; error: string } {
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
  if (!c.email || typeof c.email !== 'string' || !c.email.includes('@')) {
    return { valid: false, error: 'Invalid customer email' }
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
        phone: (c.phone as string) || '',
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

export async function sendEmailConfirmation(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    const validation = validateEmailRequest(req.body)
    if (!validation.valid) {
      res.status(400).json({ error: validation.error })
      return
    }
    
    const { productName, price, customer, pickupDate, pickupTime, requestId } = validation.data

    // Email service configuration
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const FROM_EMAIL = process.env.FROM_EMAIL || 'WorthyTen <noreply@worthyten.com>'

    if (!RESEND_API_KEY) {
      logger.warn('Resend API key not configured')
      res.status(200).json({ error: 'Email service not configured. Email confirmation skipped.' })
      return
    }

    // Format pickup date
    const date = new Date(pickupDate)
    const formattedDate = date.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    // Sanitize all user inputs for HTML email
    const safeCustomerName = sanitizeHtml(customer.name)
    const safeProductName = sanitizeHtml(productName)
    const safeAddress = sanitizeHtml(customer.address)
    const safeLandmark = sanitizeHtml(customer.landmark)
    const safeCity = sanitizeHtml(customer.city)
    const safeState = sanitizeHtml(customer.state)
    const safePincode = sanitizeHtml(customer.pincode)
    const safeRequestId = sanitizeHtml(requestId)
    const safePickupTime = sanitizeHtml(pickupTime)

    // Format email content
    const emailSubject = `Order Confirmation - ${safeProductName}`
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✅ Order Confirmed!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${safeCustomerName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for choosing WorthyTen! Your pickup request has been confirmed.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h2 style="color: #667eea; margin-top: 0;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666;">Device:</td>
                  <td style="padding: 8px 0;">${safeProductName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666;">Quoted Price:</td>
                  <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #28a745;">₹${price.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666;">Pickup Date:</td>
                  <td style="padding: 8px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666;">Pickup Time:</td>
                  <td style="padding: 8px 0;">${safePickupTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666;">Request ID:</td>
                  <td style="padding: 8px 0; font-family: monospace; font-size: 14px;">${safeRequestId}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Pickup Address</h3>
              <p style="margin: 5px 0;">
                ${safeAddress}${safeLandmark ? ` (Near: ${safeLandmark})` : ''}<br>
                ${safeCity}, ${safeState} - ${safePincode}
              </p>
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">
              Our agent will contact you shortly to confirm the pickup. If you have any questions, please don't hesitate to reach out to us.
            </p>
            
            <p style="font-size: 16px; margin-top: 20px;">
              Best regards,<br>
              <strong>The WorthyTen Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This is an automated confirmation email. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `

    const emailText = `
Order Confirmation

Hi ${customer.name},

Thank you for choosing WorthyTen! Your pickup request has been confirmed.

Order Details:
- Device: ${productName}
- Quoted Price: ₹${price.toLocaleString('en-IN')}
- Pickup Date: ${formattedDate}
- Pickup Time: ${pickupTime}
- Request ID: ${requestId}

Pickup Address:
${customer.address}${customer.landmark ? ` (Near: ${customer.landmark})` : ''}
${customer.city}, ${customer.state} - ${customer.pincode}

Our agent will contact you shortly to confirm the pickup.

Best regards,
The WorthyTen Team
    `.trim()

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    // Store email log in Firestore before sending
    let emailLogId: string | undefined
    try {
      const logDocRef = await db.collection('emailLogs').add({
        to: customer.email,
        subject: emailSubject,
        requestId: requestId,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      emailLogId = logDocRef.id
    } catch (logError) {
      logger.warn('Failed to create email log in Firestore', logError)
    }

    // Send email using Resend API
    const resendUrl = 'https://api.resend.com/emails'

    let response: globalThis.Response
    try {
      response = await fetch(resendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: customer.email,
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
        }),
        signal: controller.signal,
      })
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        logger.error('Email API request timed out')
        res.status(200).json({ error: 'Email service timeout' })
        return
      }
      throw fetchError
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const errorData = await response.text()
      logger.error('Resend API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      // Update email log with error status
      if (emailLogId) {
        try {
          await db.collection('emailLogs').doc(emailLogId).update({
            status: 'failed',
            error: errorData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        } catch (updateError) {
          logger.warn('Failed to update email log', updateError)
        }
      }

      res.status(200).json({ error: 'Failed to send email confirmation' })
      return
    }

    const result = await response.json()

    // Update email log with success status
    if (emailLogId) {
      try {
        await db.collection('emailLogs').doc(emailLogId).update({
          status: 'sent',
          emailId: result.id,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      } catch (updateError) {
        logger.warn('Failed to update email log', updateError)
      }
    }

    logger.debug('Email confirmation sent successfully', { emailId: result.id })
    res.json({ success: true, emailId: result.id })
  } catch (error) {
    logger.error('Error sending email confirmation', error)
    res.status(200).json({ error: 'Failed to send email confirmation' })
  }
}
