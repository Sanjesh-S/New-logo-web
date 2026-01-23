import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  Timestamp,
  increment,
} from 'firebase/firestore'
import { getDb } from './config'
import type { Review, ReviewStats, Referral, UserTrustBadge } from '@/lib/types/reviews'

// Re-export types for convenience
export type { Review, ReviewStats, Referral, UserTrustBadge } from '@/lib/types/reviews'

// Helper function to get db instance
function getDbInstance() {
  const db = getDb()
  if (!db) throw new Error('Firestore not initialized')
  return db
}

// Reviews Collection Operations
export async function createReview(review: Omit<Review, 'id' | 'createdAt' | 'helpfulCount' | 'status'>): Promise<string> {
  const db = getDbInstance()
  const reviewsRef = collection(db, 'reviews')
  const newReview = {
    ...review,
    helpfulCount: 0,
    status: 'pending' as const, // Auto-moderate or set to pending
    createdAt: Timestamp.now(),
  }
  const docRef = await addDoc(reviewsRef, newReview)
  return docRef.id
}

export async function getReview(reviewId: string): Promise<Review | null> {
  const db = getDbInstance()
  const reviewRef = doc(db, 'reviews', reviewId)
  const reviewSnap = await getDoc(reviewRef)
  
  if (reviewSnap.exists()) {
    return { id: reviewSnap.id, ...reviewSnap.data() } as Review
  }
  return null
}

export async function getReviewsByProduct(
  productId: string,
  options: { limit?: number; approvedOnly?: boolean } = {}
): Promise<Review[]> {
  const db = getDbInstance()
  const { limit: limitCount = 50, approvedOnly = true } = options
  const reviewsRef = collection(db, 'reviews')
  
  let q = query(
    reviewsRef,
    where('productId', '==', productId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  
  if (approvedOnly) {
    q = query(
      reviewsRef,
      where('productId', '==', productId),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
  }
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Review[]
}

export async function getReviewsByUser(userId: string): Promise<Review[]> {
  const db = getDbInstance()
  const reviewsRef = collection(db, 'reviews')
  const q = query(
    reviewsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Review[]
}

export async function getReviewStats(productId: string): Promise<ReviewStats> {
  const db = getDbInstance()
  const reviewsRef = collection(db, 'reviews')
  const q = query(
    reviewsRef,
    where('productId', '==', productId),
    where('status', '==', 'approved')
  )
  
  const querySnapshot = await getDocs(q)
  const reviews = querySnapshot.docs.map(doc => doc.data()) as Review[]
  
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      verifiedReviews: 0,
    }
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0)
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  
  reviews.forEach(review => {
    const rating = Math.round(review.overallRating) as 1 | 2 | 3 | 4 | 5
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating]++
    }
  })
  
  return {
    averageRating: totalRating / reviews.length,
    totalReviews: reviews.length,
    ratingDistribution,
    verifiedReviews: reviews.filter(r => r.verifiedPurchase).length,
  }
}

export async function markReviewHelpful(reviewId: string): Promise<void> {
  const db = getDbInstance()
  const reviewRef = doc(db, 'reviews', reviewId)
  await updateDoc(reviewRef, {
    helpfulCount: increment(1),
  })
}

export async function updateReviewStatus(
  reviewId: string,
  status: Review['status'],
  moderationNotes?: string
): Promise<void> {
  const db = getDbInstance()
  const reviewRef = doc(db, 'reviews', reviewId)
  await updateDoc(reviewRef, {
    status,
    moderationNotes,
    updatedAt: Timestamp.now(),
  })
}

// Referrals Collection Operations
export async function createReferral(referrerId: string): Promise<Referral> {
  const db = getDbInstance()
  const referralsRef = collection(db, 'referrals')
  
  // Generate unique referral code
  const referralCode = generateReferralCode(referrerId)
  
  const newReferral: Omit<Referral, 'id'> = {
    referrerId,
    referralCode,
    status: 'pending',
    createdAt: Timestamp.now(),
  }
  
  const docRef = await addDoc(referralsRef, newReferral)
  return { id: docRef.id, ...newReferral } as Referral
}

export async function getReferralByCode(referralCode: string): Promise<Referral | null> {
  const db = getDbInstance()
  const referralsRef = collection(db, 'referrals')
  const q = query(referralsRef, where('referralCode', '==', referralCode), limit(1))
  
  const querySnapshot = await getDocs(q)
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Referral
  }
  return null
}

export async function getReferralsByUser(userId: string): Promise<Referral[]> {
  const db = getDbInstance()
  const referralsRef = collection(db, 'referrals')
  const q = query(
    referralsRef,
    where('referrerId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Referral[]
}

export async function completeReferral(
  referralCode: string,
  referredUserId: string
): Promise<void> {
  const db = getDbInstance()
  const referral = await getReferralByCode(referralCode)
  if (!referral || referral.status !== 'pending') {
    throw new Error('Invalid or already used referral code')
  }
  
  const referralRef = doc(db, 'referrals', referral.id!)
  await updateDoc(referralRef, {
    referredId: referredUserId,
    status: 'completed',
    completedAt: Timestamp.now(),
  })
}

export async function rewardReferral(referralId: string, rewardAmount: number): Promise<void> {
  const db = getDbInstance()
  const referralRef = doc(db, 'referrals', referralId)
  await updateDoc(referralRef, {
    status: 'rewarded',
    rewardAmount,
    rewardType: 'credit',
  })
}

// Generate unique referral code
function generateReferralCode(userId: string): string {
  // Use first 4 chars of userId + random 4 alphanumeric
  const prefix = userId.substring(0, 4).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${random}`
}

// Trust Badges Operations
export async function getUserTrustBadge(userId: string): Promise<UserTrustBadge | null> {
  const db = getDbInstance()
  const trustBadgesRef = collection(db, 'trustBadges')
  const q = query(trustBadgesRef, where('userId', '==', userId), limit(1))
  
  const querySnapshot = await getDocs(q)
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]
    return { ...doc.data() } as UserTrustBadge
  }
  
  // If no badge exists, create a default one
  const defaultBadge: Omit<UserTrustBadge, 'memberSince'> = {
    userId,
    verifiedPhone: false,
    verifiedEmail: false,
    tradeInCount: 0,
    successfulTrades: 0,
    completionRate: 0,
  }
  
  return {
    ...defaultBadge,
    memberSince: Timestamp.now(),
  } as UserTrustBadge
}

export async function updateUserTrustBadge(
  userId: string,
  updates: Partial<UserTrustBadge>
): Promise<void> {
  const db = getDbInstance()
  const trustBadgesRef = collection(db, 'trustBadges')
  const q = query(trustBadgesRef, where('userId', '==', userId), limit(1))
  
  const querySnapshot = await getDocs(q)
  if (!querySnapshot.empty) {
    const badgeRef = doc(db, 'trustBadges', querySnapshot.docs[0].id)
    await updateDoc(badgeRef, updates)
  } else {
    // Create new badge
    const newBadge: UserTrustBadge = {
      userId,
      verifiedPhone: false,
      verifiedEmail: false,
      tradeInCount: 0,
      successfulTrades: 0,
      completionRate: 0,
      memberSince: Timestamp.now(),
      ...updates,
    }
    await addDoc(trustBadgesRef, newBadge)
  }
}
