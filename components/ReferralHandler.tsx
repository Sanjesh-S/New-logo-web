'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function ReferralHandler() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const referralCode = searchParams.get('ref')

  useEffect(() => {
    if (referralCode) {
      // Store referral code in localStorage for later use
      localStorage.setItem('pendingReferralCode', referralCode)
      
      // If user is already logged in, apply referral immediately
      if (user) {
        applyReferralCode(referralCode, user.uid)
      }
    }
  }, [referralCode, user])

  const applyReferralCode = async (code: string, userId: string) => {
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralCode: code,
          userId,
        }),
      })

      if (response.ok) {
        // Remove from localStorage after successful application
        localStorage.removeItem('pendingReferralCode')
      }
    } catch (error) {
      console.error('Error applying referral code:', error)
    }
  }

  // This component doesn't render anything
  return null
}
