import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('API:Telegram')

/**
 * Get Firebase Functions URL
 */
function getFunctionsUrl(): string {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_FUNCTIONS_URL) {
    return process.env.NEXT_PUBLIC_FUNCTIONS_URL
  }
  
  // Construct URL from Firebase project ID
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
    const body = await request.json()
    
    logger.info('Telegram notification request received, forwarding to Firebase Function', {
      requestId: body.requestId,
      hasCustomer: !!body.customer,
    })

    // Forward request to Firebase Cloud Function
    const functionsUrl = getFunctionsUrl()
    const functionUrl = `${functionsUrl}/telegramNotify`
    
    logger.info('Calling Firebase Function', {
      functionUrl: functionUrl.replace(/\/([^/]+)$/, '/***'), // Mask function name in logs
    })
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const responseData = await response.json().catch(() => ({}))
    
    if (!response.ok) {
      logger.error('Firebase Function error', {
        status: response.status,
        statusText: response.statusText,
        error: responseData,
      })
      return NextResponse.json(
        { 
          error: 'Failed to send Telegram notification',
          details: responseData,
        },
        { status: 200 } // Return 200 so it doesn't fail the request
      )
    }

    logger.info('Telegram notification sent successfully via Firebase Function', {
      requestId: body.requestId,
    })
    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('Error forwarding Telegram notification to Firebase Function', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 200 } // Return 200 so it doesn't fail the request
    )
  }
}
