'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import Link from 'next/link'
import { setupRecaptcha, sendOTP, verifyOTP } from '@/lib/firebase/auth'
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'

interface AssessmentOTPModalProps {
  isOpen: boolean
  onClose: () => void
  onVerified: (phoneNumber?: string) => void
}

export default function AssessmentOTPModal({ isOpen, onClose, onVerified }: AssessmentOTPModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('phone')
      setPhoneNumber('')
      setOtp(['', '', '', '', '', ''])
      setError('')
      setAgreedToTerms(false)
      setConfirmationResult(null)
      
      // Setup reCAPTCHA when modal opens (with a small delay to ensure DOM and Firebase are ready)
      const timer = setTimeout(async () => {
        try {
          // Ensure Firebase is initialized first
          const { getApp } = await import('@/lib/firebase/config')
          const app = getApp()
          if (!app) {
            throw new Error('Firebase app is not initialized')
          }
          
          console.log('Firebase app verified before reCAPTCHA setup:', {
            name: app.name,
            projectId: app.options.projectId,
            apiKey: app.options.apiKey?.substring(0, 10) + '...'
          })
          
          // Clear any existing verifier first
          if (recaptchaVerifierRef.current) {
            try {
              recaptchaVerifierRef.current.clear()
            } catch (e) {
              // Ignore errors during cleanup
            }
          }
          
          // Clear window reference too
          if ((window as any).recaptchaVerifier) {
            try {
              (window as any).recaptchaVerifier.clear()
            } catch (e) {
              // Ignore errors
            }
            delete (window as any).recaptchaVerifier
          }
          
          const verifier = setupRecaptcha('assessment-recaptcha-container')
          recaptchaVerifierRef.current = verifier
        } catch (error: any) {
          console.error('Error setting up reCAPTCHA:', error)
          const errorMessage = error?.message || 'Failed to initialize authentication'
          setError(`${errorMessage}. Please refresh the page and try again.`)
        }
      }, 300)

      return () => {
        clearTimeout(timer)
        // Cleanup reCAPTCHA when modal closes
        if (recaptchaVerifierRef.current) {
          try {
            recaptchaVerifierRef.current.clear()
          } catch (error) {
            console.error('Error clearing reCAPTCHA:', error)
          }
          recaptchaVerifierRef.current = null
        }
      }
    } else {
      // Cleanup reCAPTCHA when modal closes
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear()
        } catch (error) {
          console.error('Error clearing reCAPTCHA:', error)
        }
        recaptchaVerifierRef.current = null
      }
    }
  }, [isOpen])

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    // Limit to 10 digits
    return digits.slice(0, 10)
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Format phone number with country code
      const formattedPhone = `+91${phoneNumber}`

      // Ensure reCAPTCHA verifier exists and is ready
      if (!recaptchaVerifierRef.current) {
        try {
          // Clear any existing verifier first
          const existingVerifier = (window as any).recaptchaVerifier
          if (existingVerifier) {
            try {
              existingVerifier.clear()
            } catch (e) {
              // Ignore cleanup errors
            }
            delete (window as any).recaptchaVerifier
          }
          
          // Wait a bit to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const verifier = setupRecaptcha('assessment-recaptcha-container')
          recaptchaVerifierRef.current = verifier
          
          // Wait a bit more for reCAPTCHA to initialize
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (setupError: any) {
          console.error('Error setting up reCAPTCHA:', setupError)
          throw new Error('Failed to initialize authentication. Please refresh the page and try again.')
        }
      }

      // Verify verifier is still valid
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA verifier is not ready. Please try again.')
      }

      console.log('Attempting to send OTP to:', formattedPhone)
      const confirmation = await sendOTP(formattedPhone, recaptchaVerifierRef.current)
      setConfirmationResult(confirmation)
      setStep('otp')
      setError('')
    } catch (err: any) {
      console.error('OTP send error:', err)
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to send OTP. Please try again.'
      if (err.message) {
        if (err.message.includes('invalid-app-credential') || err.code === 'auth/invalid-app-credential') {
          errorMessage = 'Firebase configuration error. Please verify:\n1. API key matches Firebase project\n2. Phone Authentication is enabled\n3. Try refreshing the page'
        } else if (err.message.includes('too-many-requests') || err.code === 'auth/too-many-requests') {
          errorMessage = 'Too many requests. Please wait a moment and try again.'
        } else if (err.message.includes('invalid-phone-number') || err.code === 'auth/invalid-phone-number') {
          errorMessage = 'Invalid phone number. Please enter a valid 10-digit mobile number.'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    const digits = pastedData.split('').filter(char => /^\d$/.test(char))

    if (digits.length === 6) {
      setOtp(digits)
      otpInputRefs.current[5]?.focus()
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const code = otp.join('')
      if (code.length !== 6) {
        setError('Please enter 6-digit OTP')
        setLoading(false)
        return
      }

      if (!confirmationResult) {
        setError('Session expired. Please request OTP again.')
        setStep('phone')
        setLoading(false)
        return
      }

      await verifyOTP(confirmationResult, code)
      setError('')
      onVerified(phoneNumber)
    } catch (err: any) {
      // Show user-friendly error message
      const errorMessage = err.message?.includes('Wrong OTP') 
        ? 'Wrong OTP. Please try again.' 
        : err.message || 'Invalid OTP. Please try again.'
      setError(errorMessage)
      setOtp(['', '', '', '', '', ''])
      otpInputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setLoading(true)
    setOtp(['', '', '', '', '', ''])

    try {
      const formattedPhone = `+91${phoneNumber}`

      if (!recaptchaVerifierRef.current) {
        const verifier = setupRecaptcha('assessment-recaptcha-container')
        recaptchaVerifierRef.current = verifier
      }

      const confirmation = await sendOTP(formattedPhone, recaptchaVerifierRef.current)
      setConfirmationResult(confirmation)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* reCAPTCHA container (hidden) - must exist in DOM for Firebase */}
        <div id="assessment-recaptcha-container" style={{ display: 'none' }}></div>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-brand-blue-900 mb-2">
                    Login Required
                  </h2>
                  <p className="text-gray-600">
                    Please verify your phone number to see the final price.
                  </p>
                </div>

                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter mobile number
                    </label>
                    <div className="flex gap-2">
                      <div className="w-20 flex items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-700 font-medium">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                        placeholder="Enter 10-digit mobile"
                        className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                        required
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Terms and Conditions Checkbox */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agree-terms-assessment"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer accent-cyan-500"
                      style={{ accentColor: '#06b6d4' }}
                    />
                    <label htmlFor="agree-terms-assessment" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                      I agree to the{' '}
                      <Link href="/terms-conditions" target="_blank" className="text-cyan-600 hover:text-cyan-700 underline font-medium">
                        Terms and Conditions
                      </Link>
                      {' '}&{' '}
                      <Link href="/privacy-policy" target="_blank" className="text-cyan-600 hover:text-cyan-700 underline font-medium">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || phoneNumber.length !== 10 || !agreedToTerms}
                    className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                      agreedToTerms && phoneNumber.length === 10 && !loading
                        ? 'bg-gradient-to-r from-brand-blue-600 to-brand-lime text-white hover:shadow-lg'
                        : 'bg-gray-300 text-gray-700 cursor-not-allowed'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    whileHover={agreedToTerms && phoneNumber.length === 10 && !loading ? { scale: 1.02 } : {}}
                    whileTap={agreedToTerms && phoneNumber.length === 10 && !loading ? { scale: 0.98 } : {}}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Send OTP'
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-brand-blue-900 mb-2">
                    Enter OTP
                  </h2>
                  <p className="text-gray-600">
                    We sent a 6-digit code to
                    <br />
                    <span className="text-brand-blue-900 font-semibold">
                      +91 {phoneNumber}
                    </span>
                  </p>
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                      Enter 6-digit OTP
                    </label>
                    <div className="flex gap-2 md:gap-3 justify-center">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { otpInputRefs.current[index] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={index === 0 ? handleOtpPaste : undefined}
                          className="w-10 h-12 md:w-12 md:h-14 text-center text-xl md:text-2xl font-bold bg-white border-2 border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                        />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <motion.button
                      type="submit"
                      disabled={loading || otp.some(d => !d)}
                      className="w-full py-4 bg-gradient-to-r from-brand-blue-600 to-brand-lime text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                      ) : (
                        'Verify OTP'
                      )}
                    </motion.button>

                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="w-full py-3 text-brand-lime hover:text-brand-lime-400 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      Resend OTP
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep('phone')
                        setOtp(['', '', '', '', '', ''])
                        setError('')
                      }}
                      className="w-full py-3 text-gray-400 hover:text-gray-300 transition-colors text-sm"
                    >
                      Change Phone Number
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

