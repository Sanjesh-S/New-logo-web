'use client'

import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, XCircle, Camera, Target, Snowflake, Minus } from 'lucide-react'
import type { AnswerMap } from '@/lib/pricing/modifiers'

interface ConditionGridProps {
  answers: AnswerMap
  onChange: (questionId: string, value: string | string[]) => void
}

export default function ConditionGrid({ answers, onChange }: ConditionGridProps) {
  const getIcon = (condition: string, category?: string) => {
    // Lens Condition icons
    if (category === 'lens') {
      if (condition === 'good') {
        return <CheckCircle className="w-5 h-5" />
      } else if (condition === 'autofocusIssue') {
        return <Target className="w-5 h-5" />
      } else if (condition === 'fungus') {
        return <Snowflake className="w-5 h-5" />
      } else if (condition === 'scratches') {
        return <Minus className="w-5 h-5 rotate-45" />
      }
    }
    
    // Error Condition icons
    if (category === 'error') {
      if (condition === 'noErrors') {
        return <CheckCircle className="w-5 h-5" />
      } else if (condition === 'minorErrors') {
        return <AlertCircle className="w-5 h-5" />
      } else if (condition === 'frequentErrors') {
        return <XCircle className="w-5 h-5" />
      } else if (condition === 'withoutLensError') {
        return <Camera className="w-5 h-5" />
      }
    }
    
    // Display and Body Condition icons
    if (condition === 'excellent' || condition === 'noErrors' || condition === 'good') {
      return <CheckCircle className="w-5 h-5" />
    } else if (condition === 'minorErrors' || condition === 'autofocusIssue') {
      return <AlertCircle className="w-5 h-5" />
    } else if (condition === 'withoutLensError' || condition === 'fungus' || condition === 'scratches') {
      return <XCircle className="w-5 h-5" />
    } else {
      return <XCircle className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Display Condition */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          Display Condition
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'excellent', label: 'Excellent - No scratches' },
            { id: 'good', label: 'Good - Minor scratches' },
            { id: 'fair', label: 'Fair - Visible scratches' },
            { id: 'cracked', label: 'Cracked/Broken Display' },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('displayCondition', option.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                answers.displayCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="mb-2 flex justify-center">
                {getIcon(option.id)}
              </div>
              <div className="text-sm font-medium">{option.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Body Condition */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          Body Condition
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'excellent', label: 'Excellent - Like New' },
            { id: 'good', label: 'Good - Minor wear' },
            { id: 'fair', label: 'Fair - Visible scratches/dents' },
            { id: 'poor', label: 'Poor - Heavy damage' },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('bodyCondition', option.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                answers.bodyCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="mb-2 flex justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium">{option.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Error Condition */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          Error Condition
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { id: 'noErrors', label: 'No Error Messages', icon: 'check' },
            { id: 'minorErrors', label: 'Minor Errors (occasionally)', icon: 'warning' },
            { id: 'frequentErrors', label: 'Frequent Error Messages', icon: 'error' },
            { id: 'withoutLensError', label: 'Without Lens Error Condition', icon: 'lens' },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('errorCondition', option.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                answers.errorCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="mb-2 flex justify-center">
                {getIcon(option.id, 'error')}
              </div>
              <div className="text-sm font-medium">{option.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lens Condition */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          Lens Condition
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'good', label: 'Good Condition', icon: 'check' },
            { id: 'autofocusIssue', label: 'Auto Focus/ Manual Focus Issue', icon: 'target' },
            { id: 'fungus', label: 'Fungus issue', icon: 'fungus' },
            { id: 'scratches', label: 'Scratches', icon: 'scratches' },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('lensCondition', option.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                answers.lensCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="mb-2 flex justify-center">
                {getIcon(option.id, 'lens')}
              </div>
              <div className="text-sm font-medium">{option.label}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}


