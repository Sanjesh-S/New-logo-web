'use client'

import { motion } from 'framer-motion'
import { Battery, Flashlight, HardDrive, Volume2, Plug, MousePointer2, CheckCircle } from 'lucide-react'

interface IssueGridProps {
  value?: string[]
  onChange: (value: string[]) => void
}

const issues = [
  { id: 'batteryIssue', label: 'Battery weak or Not working or Duplicate', icon: Battery },
  { id: 'flashlightIssue', label: 'Flashlight not Working', icon: Flashlight },
  { id: 'memoryCardIssue', label: 'Memory Card Slot issue', icon: HardDrive },
  { id: 'speakerIssue', label: 'Speaker not working', icon: Volume2 },
  { id: 'connectorIssue', label: 'Connectors not working', icon: Plug },
  { id: 'buttonIssue', label: 'Buttons not working', icon: MousePointer2 },
  { id: 'noIssues', label: '✓No Functional Issues', icon: CheckCircle },
]

export default function IssueGrid({ value = [], onChange }: IssueGridProps) {
  const handleToggle = (issueId: string) => {
    if (issueId === 'noIssues') {
      // If "No Issues" is selected, clear all others
      onChange(['noIssues'])
    } else {
      // Remove "noIssues" if it exists, then toggle the selected issue
      const filtered = value.filter((id) => id !== 'noIssues')
      if (filtered.includes(issueId)) {
        onChange(filtered.filter((id) => id !== issueId))
      } else {
        onChange([...filtered, issueId])
      }
    }
  }

  const isSelected = (issueId: string) => value.includes(issueId)

  const regularIssues = issues.filter((issue) => issue.id !== 'noIssues')
  const noIssuesOption = issues.find((issue) => issue.id === 'noIssues')

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
        Select all issues identified in your Device
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {regularIssues.map((issue) => {
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

      {/* No Functional Issues - Full Width */}
      {noIssuesOption && (
        <div className="mt-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handleToggle(noIssuesOption.id)}
            className={`w-full p-4 rounded-xl border-2 transition-all ${
              isSelected(noIssuesOption.id)
                ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <noIssuesOption.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{noIssuesOption.label}</span>
            </div>
          </motion.button>
        </div>
      )}
    </div>
  )
}



