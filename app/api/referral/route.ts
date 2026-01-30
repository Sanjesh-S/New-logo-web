import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreServer } from '@/lib/firebase/server'
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { createLogger } from '@/lib/utils/logger'
import { z } from 'zod'

const logger = createLogger('API:Referral')

// Validation schema
const referralSchema = z.object({
  referralCode: z.string().min(1).max(50),
  userId: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 20, windowMs: 60000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // CSRF protection
    const csrfCheck = verifyCSRFToken(request)
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: csrfCheck.error || 'CSRF validation failed' },
        { status: 403 }
      )
    }

    // Get auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to use referral codes.' },
        { status: 401 }
      )
    }

    // Validate request size
    const { body, error: bodyError } = await getRequestBody(request)
    if (bodyError) {
      return NextResponse.json(
        { error: bodyError },
        { status: 413 }
      )
    }
    
    // Validate request body
    const validation = referralSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { referralCode, userId } = validation.data

    // TODO: Verify userId matches authenticated user's ID
    // For now, Firestore rules should enforce this, but we should verify server-side
    // const token = await verifyIdToken(authHeader.substring(7))
    // if (token.uid !== userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    const db = getFirestoreServer()
    const referralsRef = collection(db, 'referrals')
    const q = query(
      referralsRef, 
      where('referralCode', '==', referralCode), 
      where('status', '==', 'pending'),
      where('referredId', '==', null) // Ensure not already claimed
    )
    
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid or already used referral code' },
        { status: 404 }
      )
    }

    const referralDoc = querySnapshot.docs[0]
    const referralData = referralDoc.data()
    
    // Additional validation: check if user is trying to use their own referral code
    if (referralData.referrerId === userId) {
      return NextResponse.json(
        { error: 'Cannot use your own referral code' },
        { status: 400 }
      )
    }

    const referralRef = doc(db, 'referrals', referralDoc.id)
    
    await updateDoc(referralRef, {
      referredId: userId,
      status: 'completed',
      completedAt: Timestamp.now(),
    })

    logger.info('Referral code applied', { referralCode, userId })

    return NextResponse.json({
      success: true,
      message: 'Referral code applied successfully',
    })
  } catch (error) {
    logger.error('Error processing referral', error)
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    )
  }
}
