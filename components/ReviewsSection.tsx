'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, ThumbsUp, CheckCircle, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { getReviewsByProduct, getReviewStats, createReview, markReviewHelpful, type Review, type ReviewStats } from '@/lib/firebase/reviews'
import { useAuth } from '@/contexts/AuthContext'

interface ReviewsSectionProps {
  productId: string
  productName: string
  brand: string
  category: string
  valuationId?: string
}

export default function ReviewsSection({
  productId,
  productName,
  brand,
  category,
  valuationId,
}: ReviewsSectionProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Review form state
  const [formData, setFormData] = useState({
    overallRating: 5,
    priceRating: 5,
    serviceRating: 5,
    conditionRating: 5,
    title: '',
    comment: '',
  })

  useEffect(() => {
    loadReviews()
  }, [productId])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const [reviewsData, statsData] = await Promise.all([
        getReviewsByProduct(productId, { limit: 10, approvedOnly: true }),
        getReviewStats(productId),
      ])
      setReviews(reviewsData)
      setStats(statsData)
    } catch (error) {
      // Error loading reviews
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please login to submit a review')
      return
    }

    try {
      setSubmitting(true)
      await createReview({
        userId: user.uid,
        userName: user.displayName || undefined,
        userPhone: user.phoneNumber || undefined,
        valuationId: valuationId || '',
        productId,
        productName,
        brand,
        category,
        overallRating: formData.overallRating,
        priceRating: formData.priceRating,
        serviceRating: formData.serviceRating,
        conditionRating: formData.conditionRating,
        title: formData.title || undefined,
        comment: formData.comment || undefined,
        verifiedPurchase: !!valuationId,
      })
      
      // Reset form
      setFormData({
        overallRating: 5,
        priceRating: 5,
        serviceRating: 5,
        conditionRating: 5,
        title: '',
        comment: '',
      })
      setShowReviewForm(false)
      
      // Reload reviews
      await loadReviews()
    } catch (error) {
      // Error submitting review
      alert('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleHelpful = async (reviewId: string) => {
    try {
      await markReviewHelpful(reviewId)
      // Update local state
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
      ))
    } catch (error) {
      // Error marking review helpful
    }
  }

  const StarRating = ({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    }
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      {stats && stats.totalReviews > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats.averageRating.toFixed(1)}
              </h3>
              <StarRating rating={Math.round(stats.averageRating)} size="lg" />
              <p className="text-sm text-gray-600 mt-2">
                Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            <div className="flex-1 max-w-xs">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
                return (
                  <div key={rating} className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-600 w-8">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Write Review Button */}
      {user && !showReviewForm && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="w-full px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-xl font-semibold hover:bg-brand-lime-400 transition-colors"
        >
          Write a Review
        </button>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleSubmitReview}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Write Your Review</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, overallRating: rating })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        rating <= formData.overallRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title (Optional)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Summarize your experience"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-lime"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Share your experience trading in this device..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-lime resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-xl font-semibold hover:bg-brand-lime-400 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {/* Reviews List */}
      {reviews.length === 0 && !showReviewForm ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-600 mb-6">Be the first to share your experience with this product!</p>
          {!user && (
            <p className="text-sm text-gray-500">Please login to write a review</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {review.userName || 'Anonymous'}
                    </h4>
                    {review.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <StarRating rating={review.overallRating} />
                </div>
                <span className="text-sm text-gray-500">
                  {review.createdAt instanceof Date
                    ? review.createdAt.toLocaleDateString()
                    : new Date((review.createdAt as any)?.toDate?.() || Date.now()).toLocaleDateString()}
                </span>
              </div>

              {review.title && (
                <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>
              )}

              {review.comment && (
                <p className="text-gray-700 mb-4">{review.comment}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <button
                  onClick={() => review.id && handleHelpful(review.id)}
                  className="flex items-center gap-1 hover:text-brand-blue-600 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({review.helpfulCount || 0})
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
