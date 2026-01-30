/**
 * Firebase Cloud Functions Entry Point
 * 
 * This file exports all Cloud Functions for the WorthyTen API.
 */

import * as functions from 'firebase-functions'
import { defineSecret } from 'firebase-functions/params'
import { calculatePrice } from './calculate'
import { createValuation, getValuation, updateValuation } from './valuations'
import { createPickupRequest, schedulePickup as schedulePickupHandler } from './pickup'
import { getDevices } from './devices'
import { sendTelegramNotification } from './notifications/telegram'
import { sendWhatsAppNotification } from './notifications/whatsapp'
import { sendEmailConfirmation } from './notifications/email'
import { createLogger } from './utils/logger'

const logger = createLogger('Functions:Index')

// Define secrets for Firebase Functions
const telegramBotToken = defineSecret('TELEGRAM_BOT_TOKEN')
const telegramChatId = defineSecret('TELEGRAM_CHAT_ID')
const twilioAccountSid = defineSecret('TWILIO_ACCOUNT_SID')
const twilioAuthToken = defineSecret('TWILIO_AUTH_TOKEN')
const twilioWhatsAppNumber = defineSecret('TWILIO_WHATSAPP_NUMBER')
// WHATSAPP_CONTENT_SID is optional - only define if it exists in Secret Manager
// const whatsappContentSid = defineSecret('WHATSAPP_CONTENT_SID')

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://worthyten.com',
  'https://www.worthyten.com',
  'http://localhost:3000',
  'http://localhost:3001',
  // Add your GitHub Pages domain
  'https://your-username.github.io',
]

/**
 * Set CORS headers based on origin
 */
function setCorsHeaders(req: functions.https.Request, res: functions.Response): boolean {
  const origin = req.headers.origin || ''
  
  // In development, allow all origins; in production, check against allowed list
  const isAllowed = process.env.NODE_ENV !== 'production' || 
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.worthyten.com') ||
    origin.endsWith('.github.io')
  
  if (isAllowed && origin) {
    res.set('Access-Control-Allow-Origin', origin)
  } else {
    // Fallback for requests without origin (e.g., server-to-server)
    res.set('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0])
  }
  
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.set('Access-Control-Max-Age', '86400') // 24 hours
  
  return isAllowed
}

// Calculate API
export const calculate = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    await calculatePrice(req, res)
  } catch (error) {
    logger.error('Unhandled error in calculate', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

// Valuations API
export const valuations = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  try {
    switch (req.method) {
      case 'POST':
        await createValuation(req, res)
        break
      case 'GET':
        // getValuation handles both single valuation and user valuations
        await getValuation(req, res)
        break
      case 'PATCH':
        await updateValuation(req, res)
        break
      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    logger.error('Unhandled error in valuations', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

// Pickup Requests API
export const pickupRequests = functions
  .runWith({ secrets: [telegramBotToken, telegramChatId, twilioAccountSid, twilioAuthToken, twilioWhatsAppNumber] })
  .https.onRequest(async (req, res) => {
    setCorsHeaders(req, res)

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method === 'POST') {
      try {
        await createPickupRequest(req, res)
      } catch (error) {
        logger.error('Unhandled error in pickupRequests', error)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' })
        }
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  })

// Pickup Schedule API
export const schedulePickup = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method === 'POST') {
    try {
      await schedulePickupHandler(req, res)
    } catch (error) {
      logger.error('Unhandled error in schedulePickup', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
})

// Devices API
export const devices = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method === 'GET') {
    try {
      await getDevices(req, res)
    } catch (error) {
      logger.error('Unhandled error in devices', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
})

// Telegram Notification API
export const telegramNotify = functions
  .runWith({ secrets: [telegramBotToken, telegramChatId] })
  .https.onRequest(async (req, res) => {
    setCorsHeaders(req, res)

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method === 'POST') {
      try {
        await sendTelegramNotification(req, res)
      } catch (error) {
        logger.error('Unhandled error in telegramNotify', error)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' })
        }
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  })

// WhatsApp Notification API
export const whatsappNotify = functions
  .runWith({ secrets: [twilioAccountSid, twilioAuthToken, twilioWhatsAppNumber] })
  .https.onRequest(async (req, res) => {
    setCorsHeaders(req, res)

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method === 'POST') {
      try {
        await sendWhatsAppNotification(req, res)
      } catch (error) {
        logger.error('Unhandled error in whatsappNotify', error)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' })
        }
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  })

// Email Confirmation API
export const emailConfirm = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method === 'POST') {
    try {
      await sendEmailConfirmation(req, res)
    } catch (error) {
      logger.error('Unhandled error in emailConfirm', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
})
