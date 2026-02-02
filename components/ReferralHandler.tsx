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
        localStorage.removeItem('pendingReferralCode')
      }
      // 404 = API not available (e.g. static export); keep pending code for when server is used
    } catch (error) {
      // Silently ignore network/404 so app works on static export; referral will apply when server is available
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('Referral API unavailable (e.g. static export). Code kept in localStorage.', error)
      }
    }
  }

  // This component doesn't render anything
  return null
}
