'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { setupRecaptcha, sendOTP, verifyOTP, signOut } from '@/lib/firebase/auth'
import { ConfirmationResult } from 'firebase/auth'

const ROLE_PORTALS: Record<string, { label: string; path: string; color: string; icon: string }> = {
  superadmin: { label: 'Admin Dashboard', path: '/admin/products', color: 'bg-purple-600 hover:bg-purple-700', icon: '🛡️' },
  manager: { label: 'Admin Dashboard', path: '/admin/products', color: 'bg-blue-600 hover:bg-blue-700', icon: '📊' },
  qc_team: { label: 'QC Dashboard', path: '/qc', color: 'bg-indigo-600 hover:bg-indigo-700', icon: '🔍' },
  showroom_staff: { label: 'Showroom Portal', path: '/showroom', color: 'bg-amber-600 hover:bg-amber-700', icon: '🏪' },
  pickup_agent: { label: 'Pickup Portal', path: '/pickup-agent', color: 'bg-teal-600 hover:bg-teal-700', icon: '🚗' },
}

export default function StaffLoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'routing'>('phone')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null)
  const [staffInfo, setStaffInfo] = useState<{ role: string; name: string } | null>(null)

  const checkExistingAuth = useCallback(async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/auth/staff-sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.synced && data.isActive) {
          setStaffInfo({ role: data.role, name: data.name })
          setStep('routing')
        }
      }
    } catch {
      // Not a staff member, stay on login
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && user) {
      checkExistingAuth()
    }
  }, [user, authLoading, checkExistingAuth])

  const handleSendOTP = async () => {
    setError('')
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setSending(true)
    try {
      const recaptcha = setupRecaptcha('staff-recaptcha')
      const fullPhone = `+91${cleaned}`
      const result = await sendOTP(fullPhone, recaptcha)
      setConfirmResult(result)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setSending(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!confirmResult) return
    setError('')
    setVerifying(true)
    try {
      const authUser = await verifyOTP(confirmResult, otp)
      const token = await authUser.getIdToken()
      const res = await fetch('/api/auth/staff-sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.synced && data.isActive) {
          setStaffInfo({ role: data.role, name: data.name })
          setStep('routing')
        } else {
          setError('Your account is inactive. Contact admin.')
        }
      } else {
        setError('This number is not registered as staff. Contact admin.')
        await signOut()
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setVerifying(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    setStep('phone')
    setPhone('')
    setOtp('')
    setStaffInfo(null)
    setConfirmResult(null)
    setError('')
  }

  const portal = staffInfo ? ROLE_PORTALS[staffInfo.role] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div id="staff-recaptcha" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Staff Portal</h1>
          <p className="text-slate-400 text-sm mt-1">WorthyTen Internal Access</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {step === 'phone' && (
            <div className="p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign In</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your registered mobile number</p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none text-lg tracking-wider"
                      onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={sending || phone.length !== 10}
                  className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Sending OTP...
                    </span>
                  ) : 'Get OTP'}
                </button>
              </div>
            </div>
          )}

          {step === 'otp' && (
            <div className="p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Verify OTP</h2>
              <p className="text-sm text-gray-500 mb-6">Enter the code sent to +91{phone}</p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">OTP Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                  />
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={verifying || otp.length !== 6}
                  className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Verifying...
                    </span>
                  ) : 'Verify & Sign In'}
                </button>

                <button
                  onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                  className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  Change number
                </button>
              </div>
            </div>
          )}

          {step === 'routing' && staffInfo && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-3">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Welcome, {staffInfo.name}</h2>
                <p className="text-sm text-gray-500 mt-1">Select your workspace</p>
              </div>

              <div className="space-y-3">
                {portal && (
                  <button
                    onClick={() => router.push(portal.path)}
                    className={`w-full py-4 text-white rounded-xl font-semibold text-lg transition-colors ${portal.color}`}
                  >
                    <span className="mr-2">{portal.icon}</span>
                    {portal.label}
                  </button>
                )}

                {(staffInfo.role === 'superadmin' || staffInfo.role === 'manager') && (
                  <>
                    <button
                      onClick={() => router.push('/qc')}
                      className="w-full py-3 border-2 border-indigo-200 text-indigo-700 rounded-xl font-medium hover:bg-indigo-50 transition-colors"
                    >
                      🔍 QC Dashboard
                    </button>
                    <button
                      onClick={() => router.push('/showroom')}
                      className="w-full py-3 border-2 border-amber-200 text-amber-700 rounded-xl font-medium hover:bg-amber-50 transition-colors"
                    >
                      🏪 Showroom Portal
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-6 py-2.5 text-gray-500 text-sm hover:text-red-600 transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Only authorized staff can access this portal.
          <br />Contact admin if you need access.
        </p>
      </div>
    </div>
  )
}
