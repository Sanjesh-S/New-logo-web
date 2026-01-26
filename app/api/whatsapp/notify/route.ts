import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('API:WhatsApp')

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
 * WhatsApp Notification API Route
 * 
 * This route acts as a proxy to Firebase Cloud Functions.
 * All notification logic is handled by Firebase Functions to ensure
 * server-side secrets (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, etc.) are secure.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    logger.info('WhatsApp notification request received, forwarding to Firebase Function', {
      customerName: body.customer?.name,
      customerPhone: body.customer?.phone,
      requestId: body.requestId,
    })

    // Forward request to Firebase Cloud Function
    const functionsUrl = getFunctionsUrl()
    const functionUrl = `${functionsUrl}/whatsappNotify`
    
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
          error: 'Failed to send WhatsApp notification',
          details: responseData,
        },
        { status: 200 } // Return 200 so it doesn't fail the request
      )
    }

    logger.info('WhatsApp notification sent successfully via Firebase Function', {
      requestId: body.requestId,
      messageSid: responseData.messageSid,
    })
    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('Error forwarding WhatsApp notification to Firebase Function', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 200 } // Return 200 so it doesn't fail the request
    )
  }
}
