'use client'

import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, XCircle, Keyboard } from 'lucide-react'
import type { AnswerMap } from '@/lib/pricing/modifiers'

interface LaptopConditionGridProps {
  answers: AnswerMap
  onChange: (questionId: string, value: string | string[]) => void
}

export default function LaptopConditionGrid({ answers, onChange }: LaptopConditionGridProps) {
  const getIcon = (condition: string) => {
    if (condition === 'perfect' || condition === 'mint' || condition === 'allKeysPerfect') {
      return <CheckCircle className="w-5 h-5" />
    } else if (condition === 'minor' || condition === 'light' || condition === 'keyShine') {
      return <AlertCircle className="w-5 h-5" />
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
            { id: 'perfect', label: 'Perfect - No issues' },
            { id: 'minor', label: 'Minor scratches/marks' },
            { id: 'deadPixels', label: 'Dead pixels/bright spots' },
            { id: 'cracked', label: 'Cracked/Damaged screen' },
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
            { id: 'mint', label: 'Mint condition' },
            { id: 'light', label: 'Light wear' },
            { id: 'moderate', label: 'Moderate scratches/dents' },
            { id: 'heavy', label: 'Heavy damage/dents' },
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
                {getIcon(option.id)}
              </div>
              <div className="text-sm font-medium">{option.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Keyboard Condition */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          Keyboard Condition
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'allKeysPerfect', label: 'All keys perfect' },
            { id: 'keyShine', label: 'Key shine/wear' },
            { id: 'stickyKeys', label: 'Some sticky/loose keys' },
            { id: 'brokenKeys', label: 'Broken/missing keys' },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('keyboardCondition', option.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                answers.keyboardCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="mb-2 flex justify-center">
                <Keyboard className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium">{option.label}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}


