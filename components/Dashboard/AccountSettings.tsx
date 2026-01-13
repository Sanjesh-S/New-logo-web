'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { User, Phone, Mail, Save, Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AccountSettings() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  // Generate referral code from user ID
  const referralCode = user?.uid ? user.uid.substring(0, 8).toUpperCase() : 'N/A'

  const copyReferralCode = () => {
    if (referralCode !== 'N/A') {
      navigator.clipboard.writeText(referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO: Implement save functionality
    setTimeout(() => {
      setSaving(false)
      alert('Settings saved!')
    }, 1000)
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
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
              defaultChecked
              className="w-5 h-5 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive updates about your orders via email</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-500">Receive order updates via SMS</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">Marketing Emails</p>
              <p className="text-sm text-gray-500">Receive promotional offers and updates</p>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-lg font-semibold hover:bg-brand-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
