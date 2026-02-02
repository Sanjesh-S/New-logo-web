'use client'

import { motion } from 'framer-motion'
import { Volume2, Plug, CheckCircle, Wifi, Mic, Circle, Hand, WifiOff, Droplets, Box, Smartphone } from 'lucide-react'

interface PhoneIssueGridProps {
  value?: string[]
  onChange: (value: string[]) => void
  variant?: 'default' | 'samsung'
}

const defaultPhoneIssues = [
  { id: 'microphoneIssue', label: 'Microphone not working', icon: Mic },
  { id: 'speakerIssue', label: 'Speaker not working', icon: Volume2 },
  { id: 'chargingPortIssue', label: 'Charging port issue', icon: Plug },
  { id: 'touchScreenIssue', label: 'Touch screen unresponsive', icon: Hand },
  { id: 'wifiIssue', label: 'WiFi / Bluetooth issue', icon: Wifi },
  { id: 'buttonIssue', label: 'Buttons not working', icon: Circle },
  { id: 'frameDamageIssue', label: 'Frame damage', icon: Smartphone },
  { id: 'bodyDamageIssue', label: 'Body damage', icon: Box },
  { id: 'waterDamageIssue', label: 'Water damage', icon: Droplets },
  { id: 'networkIssue', label: 'Network issue', icon: WifiOff },
  { id: 'noIssues', label: '✓ No Functional Issues', icon: CheckCircle },
]

const samsungPhoneIssues = [
  { id: 'microphoneIssue', label: 'Microphone / Speaker issues', icon: Mic },
  { id: 'chargingPortIssue', label: 'Charging port / Wireless Charging issues', icon: Plug },
  { id: 'touchScreenIssue', label: 'Touch screen unresponsive', icon: Hand },
  { id: 'wifiIssue', label: 'WIFI / Bluetooth / NFC issues', icon: Wifi },
  { id: 'buttonIssue', label: 'Buttons (Power/Volume)', icon: Circle },
  { id: 'frameDamageIssue', label: 'Frame / Body / Water damage', icon: Smartphone },
  { id: 'networkIssue', label: 'Network / SIM card issue', icon: WifiOff },
  { id: 'noIssues', label: '✓ No Functional Issues', icon: CheckCircle },
]

export default function PhoneIssueGrid({ value = [], onChange, variant = 'default' }: PhoneIssueGridProps) {
  const phoneIssues = variant === 'samsung' ? samsungPhoneIssues : defaultPhoneIssues
  const handleToggle = (issueId: string) => {
    if (issueId === 'noIssues') {
      onChange(['noIssues'])
    } else {
      const filtered = value.filter((id) => id !== 'noIssues')
      if (filtered.includes(issueId)) {
        onChange(filtered.filter((id) => id !== issueId))
      } else {
        onChange([...filtered, issueId])
      }
    }
  }

  const isSelected = (issueId: string) => value.includes(issueId)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
        Select all issues identified in your Device
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {phoneIssues.filter(issue => issue.id !== 'noIssues').map((issue) => {
          const Icon = issue.icon
          return (
            <motion.button
              key={issue.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleToggle(issue.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                isSelected(issue.id)
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="mb-2 flex justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium">{issue.label}</div>
            </motion.button>
          )
        })}
      </div>

      <div className="mt-6">
        {phoneIssues.filter(issue => issue.id === 'noIssues').map((issue) => {
          const Icon = issue.icon
          return (
            <motion.button
              key={issue.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleToggle(issue.id)}
              className={`w-full p-4 rounded-xl border-2 text-center transition-all ${
                isSelected(issue.id)
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="mb-2 flex justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium">{issue.label}</div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

