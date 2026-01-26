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

// Define secrets for Firebase Functions
const telegramBotToken = defineSecret('TELEGRAM_BOT_TOKEN')
const telegramChatId = defineSecret('TELEGRAM_CHAT_ID')
const twilioAccountSid = defineSecret('TWILIO_ACCOUNT_SID')
const twilioAuthToken = defineSecret('TWILIO_AUTH_TOKEN')
const twilioWhatsAppNumber = defineSecret('TWILIO_WHATSAPP_NUMBER')
// WHATSAPP_CONTENT_SID is optional - only define if it exists in Secret Manager
// const whatsappContentSid = defineSecret('WHATSAPP_CONTENT_SID')

// Calculate API
export const calculate = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await calculatePrice(req, res)
})

// Valuations API
export const valuations = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

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
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

// Pickup Requests API
export const pickupRequests = functions
  .runWith({ secrets: [telegramBotToken, telegramChatId, twilioAccountSid, twilioAuthToken, twilioWhatsAppNumber] })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method === 'POST') {
      await createPickupRequest(req, res)
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  })

// Pickup Schedule API
export const schedulePickup = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method === 'POST') {
    await schedulePickupHandler(req, res)
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
})

// Devices API
export const devices = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method === 'GET') {
    await getDevices(req, res)
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
})

// Telegram Notification API
export const telegramNotify = functions
  .runWith({ secrets: [telegramBotToken, telegramChatId] })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method === 'POST') {
      await sendTelegramNotification(req, res)
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  })

// WhatsApp Notification API
export const whatsappNotify = functions
  .runWith({ secrets: [twilioAccountSid, twilioAuthToken, twilioWhatsAppNumber] })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method === 'POST') {
      await sendWhatsAppNotification(req, res)
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  })

// Email Confirmation API
export const emailConfirm = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method === 'POST') {
    await sendEmailConfirmation(req, res)
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
})
