'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, ArrowRight, CheckCircle, X } from 'lucide-react'
import { setupRecaptcha, sendOTP, verifyOTP } from '@/lib/firebase/auth'
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'

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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Setup reCAPTCHA when component mounts
    try {
      const verifier = setupRecaptcha('recaptcha-container')
      recaptchaVerifierRef.current = verifier
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error)
    }

    return () => {
      // Cleanup reCAPTCHA on unmount
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear()
        } catch (error) {
          console.error('Error clearing reCAPTCHA:', error)
        }
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
      setError(err.message || 'Invalid OTP. Please try again.')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 md:p-8">
          {/* reCAPTCHA container (hidden) */}
          <div id="recaptcha-container"></div>

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
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-16 h-16 bg-gradient-to-br from-brand-blue-600 to-brand-lime rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Phone className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-bold text-brand-blue-900 mb-2">
                    Login with OTP
                  </h2>
                  <p className="text-gray-600">
                    Enter your phone number to receive OTP
                  </p>
                </div>

                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                        placeholder="Enter your phone number"
                        className="w-full pl-16 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
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

                  <motion.button
                    type="submit"
                    disabled={loading || phoneNumber.length !== 10}
                    className="w-full py-4 bg-brand-lime text-brand-blue-900 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-brand-lime-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Send OTP
                        <ArrowRight className="w-5 h-5" />
                      </>
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
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-16 h-16 bg-gradient-to-br from-brand-lime to-brand-lime-600 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="w-8 h-8 text-white" />
                  </motion.div>
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
                      className="w-full py-4 bg-brand-lime text-brand-blue-900 rounded-xl font-semibold hover:bg-brand-lime-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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


