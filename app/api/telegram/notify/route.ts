import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/utils/logger'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { getRequestBody } from '@/lib/middleware/request-limits'
import { z } from 'zod'

const logger = createLogger('API:Telegram')

const telegramNotifySchema = z.object({
  customer: z.object({
    name: z.string().min(1).max(200),
    phone: z.string().min(1).max(20),
    email: z.string().max(254).optional(),
    address: z.string().max(500).optional(),
  }).optional(),
  requestId: z.string().min(1).max(100),
  productName: z.string().max(200).optional(),
  price: z.number().min(0).max(10000000).optional(),
  pickupDate: z.string().max(50).optional(),
  pickupTime: z.string().max(50).optional(),
}).passthrough()

/**
 * Get Firebase Functions URL
 */
function getFunctionsUrl(): string {
  if (process.env.NEXT_PUBLIC_FUNCTIONS_URL) {
    return process.env.NEXT_PUBLIC_FUNCTIONS_URL
  }
  
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const region = process.env.NEXT_PUBLIC_FUNCTION_REGION || 'us-central1'
  
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID or NEXT_PUBLIC_FUNCTIONS_URL is required')
  }
  
  return `https://${region}-${projectId}.cloudfunctions.net`
}

/**
 * Telegram Notification API Route
 * 
 * This route acts as a proxy to Firebase Cloud Functions.
 * All notification logic is handled by Firebase Functions to ensure
 * server-side secrets (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) are secure.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (30 requests per minute per IP)
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 30, windowMs: 60000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
      )
    }

    // Validate request size
    const { body, error: bodyError } = await getRequestBody(request)
    if (bodyError) {
      return NextResponse.json({ error: bodyError }, { status: 413 })
    }

    // Validate request body
    const validation = telegramNotifySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const validatedBody = validation.data

    logger.info('Telegram notification request received, forwarding to Firebase Function', {
      requestId: validatedBody.requestId,
      hasCustomer: !!validatedBody.customer,
    })

    const functionsUrl = getFunctionsUrl()
    const functionUrl = `${functionsUrl}/telegramNotify`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedBody),
    })

    const responseData = await response.json().catch(() => ({}))
    
    if (!response.ok) {
      logger.error('Firebase Function error', {
        status: response.status,
        statusText: response.statusText,
      })
      return NextResponse.json(
        { error: 'Failed to send Telegram notification' },
        { status: 200 }
      )
    }

    logger.info('Telegram notification sent successfully via Firebase Function', {
      requestId: validatedBody.requestId,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error forwarding Telegram notification to Firebase Function', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 200 }
    )
  }
}
