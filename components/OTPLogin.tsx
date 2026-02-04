'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, ArrowRight, CheckCircle, X } from 'lucide-react'
import Link from 'next/link'
import { setupRecaptcha, sendOTP, verifyOTP } from '@/lib/firebase/auth'
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { getAssetPath } from '@/lib/utils'
import { useFocusTrap } from '@/lib/utils/useFocusTrap'

interface OTPLoginProps {
  onSuccess?: () => void
  onClose?: () => void
}

export default function OTPLogin({ onSuccess, onClose }: OTPLoginProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap for modal
  useFocusTrap(true, modalRef)

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    
    // Setup reCAPTCHA when component mounts (with delay to ensure Firebase is ready)
    const timer = setTimeout(() => {
      try {
        // Clear any existing verifier first
        if ((window as any).recaptchaVerifier) {
          try {
            const existing = (window as any).recaptchaVerifier
            if (existing && typeof existing.clear === 'function') {
              existing.clear()
            }
          } catch (e) {
            // Ignore cleanup errors
          }
          delete (window as any).recaptchaVerifier
        }

        const verifier = setupRecaptcha('recaptcha-container')
        recaptchaVerifierRef.current = verifier
      } catch (error) {
        console.error('Error setting up reCAPTCHA:', error)
      }
    }, 300)

    return () => {
      // Restore body scroll when modal closes
      document.body.style.overflow = ''
      
      clearTimeout(timer)
      // Cleanup reCAPTCHA on unmount
      if (recaptchaVerifierRef.current) {
        try {
          if (typeof recaptchaVerifierRef.current.clear === 'function') {
            recaptchaVerifierRef.current.clear()
          }
        } catch (error: any) {
          // Ignore errors - verifier might already be cleared
          if (error?.code !== 'auth/internal-error') {
            console.error('Error clearing reCAPTCHA:', error)
          }
        }
        recaptchaVerifierRef.current = null
      }
      // Also clear window reference
      if ((window as any).recaptchaVerifier) {
        delete (window as any).recaptchaVerifier
      }
    }
  }, [])

  // If user is already authenticated, show success
  useEffect(() => {
    if (user) {
      setStep('otp')
      setError('')
    }
  }, [user])

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')

    // Format as +91XXXXXXXXXX
    if (digits.length <= 10) {
      return digits
    }
    return digits
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Format phone number with country code
      const formattedPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : `+91${phoneNumber}`

      if (!recaptchaVerifierRef.current) {
        const verifier = setupRecaptcha('recaptcha-container')
        recaptchaVerifierRef.current = verifier
      }

      const confirmation = await sendOTP(formattedPhone, recaptchaVerifierRef.current)
      setConfirmationResult(confirmation)
      setStep('otp')
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.')
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
      if (onSuccess) {
        onSuccess()
      }
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
      const formattedPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : `+91${phoneNumber}`

      if (!recaptchaVerifierRef.current) {
        const verifier = setupRecaptcha('recaptcha-container')
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

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-start p-4 bg-black/50 backdrop-blur-sm md:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: -50 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: -50 }}
        className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors z-10"
            aria-label="Close login modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[450px]">
          {/* Left Panel - Illustration */}
          <div className="flex flex-col justify-center items-center bg-white p-6 md:p-8 border-r-0 md:border-r border-gray-200">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-md"
            >
              <div className="relative w-full aspect-square max-h-[350px] md:max-h-[400px] flex items-center justify-center">
                <img
                  src={getAssetPath("/images/login-illustration-2.webp")}
                  alt="Secure login illustration"
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
          </div>

          {/* Right Panel - Form */}
          <div className="flex flex-col justify-center p-6 md:p-8 lg:p-10">
            {/* reCAPTCHA container (hidden) */}
            <div id="recaptcha-container"></div>

            <AnimatePresence mode="wait">
              {step === 'phone' ? (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 id="login-modal-title" className="text-3xl md:text-4xl font-bold text-brand-blue-900 mb-2">
                      Login/Signup
                    </h1>
                    <p className="text-gray-600 mb-6">
                      Enter your phone number to receive OTP
                    </p>
                  </div>

                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="phone-number-input" className="block text-sm font-medium text-gray-700 mb-2">
                        Enter your phone number
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          +91
                        </div>
                        <input
                          type="tel"
                          id="phone-number-input"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                          placeholder="Enter your Mobile"
                          className="w-full pl-16 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                          required
                          maxLength={10}
                          aria-required="true"
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
                        id="agree-terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer accent-cyan-500"
                        style={{ accentColor: '#06b6d4' }}
                      />
                      <label htmlFor="agree-terms" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
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
                      className={`w-full py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                        agreedToTerms && phoneNumber.length === 10 && !loading
                          ? 'bg-brand-lime text-brand-blue-900 hover:bg-brand-lime-400'
                          : 'bg-gray-300 text-gray-700 cursor-not-allowed'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      whileHover={agreedToTerms && phoneNumber.length === 10 && !loading ? { scale: 1.02 } : {}}
                      whileTap={agreedToTerms && phoneNumber.length === 10 && !loading ? { scale: 0.98 } : {}}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-gray-500/30 border-t-gray-700 rounded-full animate-spin" />
                      ) : (
                        'CONTINUE'
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
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-brand-blue-900 mb-2">
                      Enter OTP
                    </h2>
                    <p className="text-gray-600">
                      We sent a 6-digit code to
                    </p>
                    {/* Phone Number with Edit Button */}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-brand-blue-900 font-semibold text-lg">
                        +91 {phoneNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('phone')
                          setOtp(['', '', '', '', '', ''])
                          setError('')
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 bg-brand-blue-50 hover:bg-brand-blue-100 rounded-full transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="otp-input-0" className="block text-sm font-medium text-gray-700 mb-3">
                        Enter 6-digit OTP
                      </label>
                      <div className="flex gap-2 md:gap-3 justify-start" role="group" aria-label="OTP code">
                        {otp.map((digit, index) => (
                          <input
                            id={index === 0 ? "otp-input-0" : undefined}
                            aria-label={`OTP digit ${index + 1}`}
                            key={index}
                            ref={(el) => { otpInputRefs.current[index] = el }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={index === 0 ? handleOtpPaste : undefined}
                            className="w-11 h-13 md:w-12 md:h-14 text-center text-xl md:text-2xl font-bold bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 transition-all"
                          />
                        ))}
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                      </motion.div>
                    )}

                    <div className="space-y-3 pt-2">
                      <motion.button
                        type="submit"
                        disabled={loading || otp.some(d => !d)}
                        className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                          otp.every(d => d) && !loading
                            ? 'bg-brand-lime text-brand-blue-900 hover:bg-brand-lime-400 shadow-md hover:shadow-lg'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                        whileHover={otp.every(d => d) && !loading ? { scale: 1.02 } : {}}
                        whileTap={otp.every(d => d) && !loading ? { scale: 0.98 } : {}}
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            VERIFY OTP
                          </>
                        )}
                      </motion.button>

                      {/* Resend OTP Section */}
                      <div className="flex items-center justify-center gap-1 pt-2">
                        <span className="text-gray-500 text-sm">Didn't receive the code?</span>
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={loading}
                          className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold disabled:opacity-50 transition-colors"
                        >
                          Resend OTP
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


