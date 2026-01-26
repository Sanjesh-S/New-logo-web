'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Gift, Copy, Check, Share2, Users, TrendingUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  createReferral,
  getReferralsByUser,
  type Referral,
} from '@/lib/firebase/reviews'

export default function ReferralProgram() {
  const { user } = useAuth()
  const [referral, setReferral] = useState<Referral | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user) {
      loadReferralData()
    }
  }, [user])

  const loadReferralData = async () => {
    if (!user) return

    try {
      setLoading(true)
      const userReferrals = await getReferralsByUser(user.uid)
      
      if (userReferrals.length > 0) {
        setReferral(userReferrals[0]) // Use first referral or most recent
        setReferrals(userReferrals)
      } else {
        // Create new referral code
        const newReferral = await createReferral(user.uid)
        setReferral(newReferral)
        setReferrals([newReferral])
      }
    } catch (error) {
      console.error('Error loading referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = () => {
    if (!referral) return

    const referralLink = `${window.location.origin}?ref=${referral.referralCode}`
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareReferral = async () => {
    if (!referral) return

    const referralLink = `${window.location.origin}?ref=${referral.referralCode}`
    const text = `Join WorthyTen and get the best prices for your devices! Use my referral code: ${referral.referralCode}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join WorthyTen',
          text,
          url: referralLink,
        })
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${text}\n${referralLink}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!user) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-gray-600">Please login to access the referral program</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-brand-lime border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const completedReferrals = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded')
  const pendingReferrals = referrals.filter(r => r.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Main Referral Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-blue-600 to-brand-lime-600 rounded-2xl shadow-xl p-8 text-white"
      >
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Referral Program</h2>
        </div>

        <p className="text-white/90 mb-6">
          Share your referral code and earn rewards when your friends trade in their devices!
        </p>

        {referral && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Your Referral Code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 font-mono text-lg font-bold">
                  {referral.referralCode}
                </div>
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-3 bg-white text-brand-blue-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Referral Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${referral.referralCode}`}
                  className="flex-1 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 text-sm"
                />
                <button
                  onClick={shareReferral}
                  className="px-4 py-3 bg-white text-brand-blue-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-brand-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Total Referrals</h3>
          </div>
          <p className="text-3xl font-bold text-brand-blue-900">
            {completedReferrals.length}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {pendingReferrals.length} pending
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-brand-lime-600" />
            <h3 className="text-lg font-semibold text-gray-900">Rewards Earned</h3>
          </div>
          <p className="text-3xl font-bold text-brand-lime-600">
            ₹{referrals
              .filter(r => r.rewardAmount)
              .reduce((sum, r) => sum + (r.rewardAmount || 0), 0)
              .toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-gray-600 mt-1">Credits & cashback</p>
        </motion.div>
      </div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">How It Works</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-brand-lime rounded-full flex items-center justify-center text-brand-blue-900 font-bold">
              1
            </div>
            <div>
              <p className="font-semibold text-gray-900">Share your referral code</p>
              <p className="text-sm text-gray-600">Send your unique code to friends and family</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-brand-lime rounded-full flex items-center justify-center text-brand-blue-900 font-bold">
              2
            </div>
            <div>
              <p className="font-semibold text-gray-900">They trade in their device</p>
              <p className="text-sm text-gray-600">Your friend uses your code when trading in</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-brand-lime rounded-full flex items-center justify-center text-brand-blue-900 font-bold">
              3
            </div>
            <div>
              <p className="font-semibold text-gray-900">You both get rewarded</p>
              <p className="text-sm text-gray-600">Earn credits when their trade-in is completed</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
