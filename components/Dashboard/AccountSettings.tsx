'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { User, Phone, Mail, Save, Copy, Check, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getUserPreferences, saveUserPreferences } from '@/lib/firebase/database'

export default function AccountSettings() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    emailNotifications: true,
    smsNotifications: true,
    marketingEmails: false,
  })

  // Generate referral code from user ID
  const referralCode = user?.uid ? user.uid.substring(0, 8).toUpperCase() : 'N/A'

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const preferences = await getUserPreferences(user.uid)
        if (preferences) {
          setFormData({
            email: preferences.email || '',
            emailNotifications: preferences.emailNotifications ?? true,
            smsNotifications: preferences.smsNotifications ?? true,
            marketingEmails: preferences.marketingEmails ?? false,
          })
        }
      } catch (error) {
        console.error('Error loading preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [user?.uid])

  const copyReferralCode = () => {
    if (referralCode !== 'N/A') {
      navigator.clipboard.writeText(referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSave = async () => {
    if (!user?.uid) return

    try {
      setSaving(true)
      setSaveError(null)
      setSaveSuccess(false)

      await saveUserPreferences(user.uid, {
        email: formData.email || undefined,
        emailNotifications: formData.emailNotifications,
        smsNotifications: formData.smsNotifications,
        marketingEmails: formData.marketingEmails,
      })

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings')
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Account Settings</h2>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      {/* Profile Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={user?.phoneNumber || ''}
                disabled
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Referral Program */}
      <div className="bg-gradient-to-br from-brand-blue-50 to-brand-lime-50 border-2 border-brand-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Referral Program</h3>
        <p className="text-sm text-gray-600 mb-4">
          Share your referral code with friends and earn rewards when they complete a trade-in!
        </p>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Your Referral Code</p>
              <p className="text-2xl font-bold text-brand-blue-900 font-mono">{referralCode}</p>
            </div>
            <button
              onClick={copyReferralCode}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-semibold mb-1">How it works:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Share your code with friends</li>
            <li>They use it during checkout</li>
            <li>You both earn rewards!</li>
          </ul>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.emailNotifications}
              onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
              disabled={loading}
              className="w-5 h-5 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500 disabled:cursor-not-allowed"
            />
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive updates about your orders via email</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.smsNotifications}
              onChange={(e) => setFormData({ ...formData, smsNotifications: e.target.checked })}
              disabled={loading}
              className="w-5 h-5 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500 disabled:cursor-not-allowed"
            />
            <div>
              <p className="font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-500">Receive order updates via SMS</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.marketingEmails}
              onChange={(e) => setFormData({ ...formData, marketingEmails: e.target.checked })}
              disabled={loading}
              className="w-5 h-5 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500 disabled:cursor-not-allowed"
            />
            <div>
              <p className="font-medium text-gray-900">Marketing Emails</p>
              <p className="text-sm text-gray-500">Receive promotional offers and updates</p>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button & Status Messages */}
      <div className="space-y-4">
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Settings saved successfully!</span>
            </motion.div>
          )}
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
            >
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{saveError}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-lg font-semibold hover:bg-brand-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
