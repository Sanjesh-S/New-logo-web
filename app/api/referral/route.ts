import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreServer } from '@/lib/firebase/server'
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 20, windowMs: 60000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { referralCode, userId } = body

    if (!referralCode || !userId) {
      return NextResponse.json(
        { error: 'Referral code and user ID are required' },
        { status: 400 }
      )
    }

    const db = getFirestoreServer()
    const referralsRef = collection(db, 'referrals')
    const q = query(referralsRef, where('referralCode', '==', referralCode), where('status', '==', 'pending'))
    
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid or already used referral code' },
        { status: 404 }
      )
    }

    const referralDoc = querySnapshot.docs[0]
    const referralRef = doc(db, 'referrals', referralDoc.id)
    
    await updateDoc(referralRef, {
      referredId: userId,
      status: 'completed',
      completedAt: Timestamp.now(),
    })

    return NextResponse.json({
      success: true,
      message: 'Referral code applied successfully',
    })
  } catch (error) {
    console.error('Error processing referral:', error)
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    )
  }
}
