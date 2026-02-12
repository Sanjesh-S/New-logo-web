'use client'

import { motion } from 'framer-motion'

interface AgeQuestionProps {
  value?: string
  onChange: (value: string) => void
}

export default function AgeQuestion({ value, onChange }: AgeQuestionProps) {
  const options = [
    { id: 'lessThan3Months', label: 'Less than 3 months' },
    { id: 'fourToTwelveMonths', label: '4 to 12 months' },
    { id: 'aboveTwelveMonths', label: 'Above 12 months' },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-brand-blue-900 mb-6">
        Age of the Device
      </h3>

      <div className="space-y-3">
        {options.map((option) => (
          <motion.button
            key={option.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(value === option.id ? '' : option.id)}
            className={`w-full py-4 px-6 rounded-xl border-2 text-left font-medium transition-all ${
              value === option.id
                ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
            }`}
          >
            {option.label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}



