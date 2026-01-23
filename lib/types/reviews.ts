import { Timestamp } from 'firebase/firestore'

export interface Review {
  id?: string
  userId: string
  userName?: string
  userPhone?: string
  valuationId: string
  productId: string
  productName: string
  brand: string
  category: string
  
  // Ratings (1-5 stars)
  overallRating: number
  priceRating: number // How fair was the price
  serviceRating: number // Quality of service
  conditionRating: number // Accuracy of condition assessment
  
  // Review content
  title?: string
  comment?: string
  photos?: string[] // URLs to review photos
  
  // Metadata
  verifiedPurchase: boolean // Whether this is from an actual trade-in
  helpfulCount: number // Number of helpful votes
  createdAt: Timestamp | Date
  updatedAt?: Timestamp | Date
  
  // Moderation
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  moderationNotes?: string
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  verifiedReviews: number
}

export interface Referral {
  id?: string
  referrerId: string // User who referred
  referredId?: string // User who was referred (optional, if they sign up)
  referralCode: string // Unique referral code
  status: 'pending' | 'completed' | 'rewarded'
  rewardAmount?: number
  rewardType?: 'credit' | 'cashback' | 'discount'
  createdAt: Timestamp | Date
  completedAt?: Timestamp | Date
}

export interface UserTrustBadge {
  userId: string
  verifiedPhone: boolean
  verifiedEmail: boolean
  tradeInCount: number
  successfulTrades: number
  averageRating?: number
  memberSince: Timestamp | Date
  responseTime?: number // Average response time in hours
  completionRate: number // Percentage of completed trades
}
