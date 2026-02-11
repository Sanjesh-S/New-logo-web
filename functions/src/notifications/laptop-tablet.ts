import { Request, Response } from 'firebase-functions'
import { createLogger } from '../utils/logger'

const logger = createLogger('Notifications:LaptopTablet')

/**
 * Sanitize text for Telegram HTML
 */
function sanitizeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendLaptopTabletNotification(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body
    
    // Validate required fields
    if (!body.category || !body.model || !body.customer || !body.inquiryId) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }
    
    const { category, model, age, warranty, customer, inquiryId } = body

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

    // Sanitize all user inputs for Telegram HTML
    const safeCategory = sanitizeTelegramHtml(category === 'laptops' ? 'Laptop' : 'Tablet')
    const safeModel = sanitizeTelegramHtml(model)
    const safeAge = sanitizeTelegramHtml(age || 'Not specified')
    const safeWarranty = sanitizeTelegramHtml(warranty || 'Not specified')
    const safeCustomerName = sanitizeTelegramHtml(customer.name)
    const safeCustomerPhone = sanitizeTelegramHtml(customer.phone)
    const safeCustomerLocation = sanitizeTelegramHtml(customer.location || 'Not specified')
    const safeInquiryId = sanitizeTelegramHtml(inquiryId)

    // Format warranty status
    const warrantyStatus = warranty === 'active' ? '✅ Active' : 
                          warranty === 'expired' ? '⏰ Expired' : 
                          warranty === 'none' ? '❌ No Warranty' : safeWarranty

    // Format message
    const message = `🔔 <b>New ${safeCategory} Inquiry</b>

📱 Device: ${safeModel}
⏳ Age: ${safeAge}
🛡️ Warranty: ${warrantyStatus}
👤 Customer Details:
• Name: ${safeCustomerName}
• Phone: ${safeCustomerPhone}
• Location: ${safeCustomerLocation}
🆔 Inquiry ID: ${safeInquiryId}
Status: Pending

Please contact the customer to provide exact pricing.`

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
          parse_mode: 'HTML',
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
