'use client'

import { motion } from 'framer-motion'
import { Battery, HardDrive, Volume2, Plug, MousePointer2, CheckCircle, Wifi, Camera, Cpu, Fan, Thermometer } from 'lucide-react'

interface LaptopIssueGridProps {
  value?: string[]
  onChange: (value: string[]) => void
}

const laptopIssues = [
  { id: 'batteryIssue', label: 'Battery weak or Not working', icon: Battery },
  { id: 'chargingPortIssue', label: 'Charging port not working', icon: Plug },
  { id: 'keyboardIssue', label: 'Keyboard not working', icon: MousePointer2 },
  { id: 'trackpadIssue', label: 'Trackpad not working', icon: MousePointer2 },
  { id: 'speakerIssue', label: 'Speaker not working', icon: Volume2 },
  { id: 'microphoneIssue', label: 'Microphone not working', icon: Volume2 },
  { id: 'webcamIssue', label: 'Webcam not working', icon: Camera },
  { id: 'wifiIssue', label: 'Wi-Fi/Bluetooth not working', icon: Wifi },
  { id: 'usbPortIssue', label: 'USB ports not working', icon: Plug },
  { id: 'overheatingIssue', label: 'Overheating issues', icon: Thermometer },
  { id: 'fanIssue', label: 'Fan noise or not working', icon: Fan },
  { id: 'performanceIssue', label: 'Performance/Slow issues', icon: Cpu },
  { id: 'hardDriveIssue', label: 'Hard drive/SSD issues', icon: HardDrive },
  { id: 'noIssues', label: '✓No Functional Issues', icon: CheckCircle },
]

export default function LaptopIssueGrid({ value = [], onChange }: LaptopIssueGridProps) {
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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
        Select all issues identified in your Device
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {laptopIssues.map((issue) => {
          const Icon = issue.icon
          return (
            <motion.button
              key={issue.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleToggle(issue.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected(issue.id)
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">{issue.label}</span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}


