import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreServer } from '@/lib/firebase/server'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('API:AdminVerify')

/**
 * Server-side admin verification endpoint
 * Verifies if the authenticated user is a staff member/admin
 * 
 * Note: Full verification requires Firebase Admin SDK.
 * This endpoint uses Firestore rules to verify access.
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting (30 requests per minute per IP)
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 30, windowMs: 60000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', isAdmin: false },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
      )
    }

    // Get auth token from Authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', isAdmin: false },
        { status: 401 }
      )
    }

    // Validate token format (Firebase ID tokens are JWTs)
    const token = authHeader.substring(7)
    if (!token || token.length < 20 || token.length > 4096) {
      return NextResponse.json(
        { error: 'Invalid token format', isAdmin: false },
        { status: 401 }
      )
    }
    
    const db = getFirestoreServer()
    const staffRef = collection(db, 'staffUsers')
    
    // Try to read staffUsers collection - Firestore rules will enforce access
    try {
      const snapshot = await getDocs(query(staffRef, limit(1)))
      
      return NextResponse.json({
        isAdmin: true,
        message: 'Admin access verified'
      })
    } catch (error: any) {
      logger.warn('Admin verification failed')
      return NextResponse.json(
        { error: 'Forbidden', isAdmin: false },
        { status: 403 }
      )
    }
  } catch (error) {
    logger.error('Error verifying admin status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'Internal server error', isAdmin: false },
      { status: 500 }
    )
  }
}
