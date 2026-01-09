'use client'

import { motion } from 'framer-motion'

interface YesNoQuestionProps {
  question: string
  helperText?: string
  questionId: string
  value?: string
  onChange: (value: string) => void
}

export default function YesNoQuestion({
  question,
  helperText,
  questionId,
  value,
  onChange,
}: YesNoQuestionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-1">
          {question}
        </h3>
        {helperText && (
          <p className="text-sm text-gray-600">{helperText}</p>
        )}
      </div>

      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange('yes')}
          className={`flex-1 py-4 px-6 rounded-xl border-2 font-semibold transition-all ${
            value === 'yes'
              ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
              : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
          }`}
        >
          Yes
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange('no')}
          className={`flex-1 py-4 px-6 rounded-xl border-2 font-semibold transition-all ${
            value === 'no'
              ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
              : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
          }`}
        >
          No
        </motion.button>
      </div>
    </div>
  )
}



