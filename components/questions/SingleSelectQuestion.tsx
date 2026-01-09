'use client'

import { motion } from 'framer-motion'

interface Option {
  id: string
  label: string
}

interface SingleSelectQuestionProps {
  question: string
  options: Option[]
  questionId: string
  value?: string
  onChange: (value: string) => void
}

export default function SingleSelectQuestion({
  question,
  options,
  questionId,
  value,
  onChange,
}: SingleSelectQuestionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
        {question}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <motion.button
            key={option.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(option.id)}
            className={`py-3 px-4 rounded-xl border-2 text-left font-medium transition-all ${
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



