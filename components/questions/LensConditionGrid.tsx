'use client'

import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, XCircle, Eye, Focus, Grip, AlertTriangle } from 'lucide-react'
import type { AnswerMap } from '@/lib/pricing/modifiers'
import YesNoQuestion from './YesNoQuestion'

interface LensConditionGridProps {
  answers: AnswerMap
  onChange: (questionId: string, value: string | string[]) => void
}

export default function LensConditionGrid({ answers, onChange }: LensConditionGridProps) {
  const hasLensToSell = answers.hasLensToSell === 'yes'
  
  // Define which options are "good" (mutually exclusive with others)
  const goodOptions: Record<string, string> = {
    fungusDustCondition: 'clean',
    focusFunctionality: 'goodFocus',
    rubberRingCondition: 'goodRubber',
    lensErrorStatus: 'noErrors',
  }

  const handleMultiSelect = (questionId: string, optionId: string, otherOptions: string[]) => {
    if (!hasLensToSell) return // Don't allow selection if no lens to sell
    
    const currentValue = (answers[questionId] as string[]) || []
    const goodOption = goodOptions[questionId]
    
    // If clicking the "good" option
    if (optionId === goodOption) {
      if (currentValue.includes(optionId)) {
        // Deselect if already selected
        onChange(questionId, [])
      } else {
        // Select only the good option, clear others
        onChange(questionId, [optionId])
      }
    } else {
      // If clicking a "bad" option
      if (currentValue.includes(optionId)) {
        // Deselect if already selected
        onChange(questionId, currentValue.filter((id) => id !== optionId))
      } else {
        // Remove good option if selected, then add the bad option
        const filtered = currentValue.filter((id) => id !== goodOption)
        onChange(questionId, [...filtered, optionId])
      }
    }
  }

  const isSelected = (questionId: string, optionId: string) => {
    const currentValue = (answers[questionId] as string[]) || []
    return currentValue.includes(optionId)
  }

  return (
    <div className="space-y-8">
      {/* Question 1: Do you have a lens to sell? */}
      <div>
        <YesNoQuestion
          question="Do you have a lens to sell?"
          helperText="Select Yes if you have a lens to trade in with your camera"
          questionId="hasLensToSell"
          value={answers.hasLensToSell as string}
          onChange={(value) => {
            onChange('hasLensToSell', value)
            // Clear all lens condition answers if switching to "No"
            if (value === 'no') {
              onChange('fungusDustCondition', [])
              onChange('focusFunctionality', [])
              onChange('rubberRingCondition', [])
              onChange('lensErrorStatus', [])
            }
          }}
        />
      </div>

      {/* Question 2: Fungus/Dust Condition */}
      <div className={hasLensToSell ? '' : 'opacity-50 pointer-events-none'}>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          Fungus/Dust Condition
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'clean', label: 'Clean / Good Condition', icon: <CheckCircle className="w-5 h-5" /> },
            { id: 'minorFungus', label: 'Minor Fungus or Dust', icon: <AlertCircle className="w-5 h-5" /> },
            { id: 'majorFungus', label: 'Major Fungus or Dust', icon: <XCircle className="w-5 h-5" /> },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={hasLensToSell ? { scale: 1.02 } : {}}
              whileTap={hasLensToSell ? { scale: 0.98 } : {}}
              onClick={() => handleMultiSelect('fungusDustCondition', option.id, ['minorFungus', 'majorFungus'])}
              disabled={!hasLensToSell}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected('fungusDustCondition', option.id)
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              } ${!hasLensToSell ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {option.icon}
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Question 3: Focus Functionality */}
      <div className={hasLensToSell ? '' : 'opacity-50 pointer-events-none'}>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          Focus Functionality
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'goodFocus', label: 'Good (AF & MF work)', icon: <Focus className="w-5 h-5" /> },
            { id: 'afIssue', label: 'AF Issue Only', icon: <AlertCircle className="w-5 h-5" /> },
            { id: 'mfIssue', label: 'MF Issue Only', icon: <XCircle className="w-5 h-5" /> },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={hasLensToSell ? { scale: 1.02 } : {}}
              whileTap={hasLensToSell ? { scale: 0.98 } : {}}
              onClick={() => handleMultiSelect('focusFunctionality', option.id, ['afIssue', 'mfIssue'])}
              disabled={!hasLensToSell}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected('focusFunctionality', option.id)
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              } ${!hasLensToSell ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {option.icon}
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Question 4: Rubber Ring Condition */}
      <div className={hasLensToSell ? '' : 'opacity-50 pointer-events-none'}>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          Rubber Ring Condition
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'goodRubber', label: 'Good Condition', icon: <Grip className="w-5 h-5" /> },
            { id: 'minorRubber', label: 'Minor Wear/Damage', icon: <AlertCircle className="w-5 h-5" /> },
            { id: 'majorRubber', label: 'Major Damage', icon: <XCircle className="w-5 h-5" /> },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={hasLensToSell ? { scale: 1.02 } : {}}
              whileTap={hasLensToSell ? { scale: 0.98 } : {}}
              onClick={() => handleMultiSelect('rubberRingCondition', option.id, ['minorRubber', 'majorRubber'])}
              disabled={!hasLensToSell}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected('rubberRingCondition', option.id)
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              } ${!hasLensToSell ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {option.icon}
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Question 5: Error Status */}
      <div className={hasLensToSell ? '' : 'opacity-50 pointer-events-none'}>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          Error Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'noErrors', label: 'No Errors', icon: <CheckCircle className="w-5 h-5" /> },
            { id: 'occasionalErrors', label: 'Occasional Errors', icon: <AlertTriangle className="w-5 h-5" /> },
            { id: 'frequentErrors', label: 'Frequent Errors', icon: <XCircle className="w-5 h-5" /> },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={hasLensToSell ? { scale: 1.02 } : {}}
              whileTap={hasLensToSell ? { scale: 0.98 } : {}}
              onClick={() => handleMultiSelect('lensErrorStatus', option.id, ['occasionalErrors', 'frequentErrors'])}
              disabled={!hasLensToSell}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected('lensErrorStatus', option.id)
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              } ${!hasLensToSell ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {option.icon}
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
