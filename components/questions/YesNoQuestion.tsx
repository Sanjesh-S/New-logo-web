'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info } from 'lucide-react'

interface YesNoQuestionProps {
  question: string
  helperText?: string
  questionId: string
  value?: string
  onChange: (value: string) => void
  index?: number // For staggered animations
}

export default function YesNoQuestion({
  question,
  helperText,
  questionId,
  value,
  onChange,
  index = 0,
}: YesNoQuestionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="space-y-6"
    >
      {/* Question Header */}
      <div className="space-y-3">
        <motion.h3
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 + 0.1, duration: 0.3 }}
          className="text-xl md:text-2xl font-bold text-brand-blue-900 leading-tight"
        >
          {question}
        </motion.h3>
        
        {helperText && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
            className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50/80 to-brand-lime-50/50 border border-blue-200/50 rounded-xl backdrop-blur-sm"
          >
            <Info className="w-5 h-5 text-brand-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm md:text-base text-gray-700 leading-relaxed flex-1">
              {helperText}
            </p>
          </motion.div>
        )}
      </div>

      {/* Enhanced Yes/No Buttons with Staggered Animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
        className="flex gap-4 md:gap-6"
      >
        {/* Yes Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 + 0.4, duration: 0.3 }}
          whileHover={{ 
            scale: 1.03, 
            y: -3,
            boxShadow: value !== 'yes' ? '0 10px 25px rgba(59, 130, 246, 0.15)' : undefined
          }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange('yes')}
          className={`group relative flex-1 py-6 px-6 rounded-2xl border-2 font-bold text-lg transition-all duration-300 overflow-hidden ${
            value === 'yes'
              ? 'bg-gradient-to-br from-brand-blue-600 via-brand-blue-500 to-brand-lime text-white border-brand-lime shadow-xl shadow-brand-lime/40 ring-4 ring-brand-lime/20'
              : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime hover:bg-gradient-to-br hover:from-brand-blue-50 hover:to-brand-lime/10 hover:shadow-lg'
          }`}
        >
          {/* Animated gradient background */}
          {value === 'yes' && (
            <>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: 'easeInOut',
                }}
              />
              {/* Ripple effect on click */}
              <motion.div
                className="absolute inset-0 bg-white/30 rounded-full"
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            </>
          )}
          
          <div className="relative z-10 flex items-center justify-center gap-3">
            <motion.div
              animate={value === 'yes' ? { 
                scale: [1, 1.3, 1],
                rotate: [0, 15, -15, 0]
              } : {
                scale: 1,
                rotate: 0
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <CheckCircle2 className={`w-6 h-6 transition-colors ${value === 'yes' ? 'text-white' : 'text-brand-lime-600'}`} strokeWidth={2.5} />
            </motion.div>
            <motion.span
              animate={value === 'yes' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="font-bold"
            >
              Yes
            </motion.span>
          </div>
          
          {/* Success checkmark animation */}
          {value === 'yes' && (
            <motion.div
              className="absolute top-2 right-2"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </motion.div>
          )}
        </motion.button>

        {/* No Button */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 + 0.5, duration: 0.3 }}
          whileHover={{ 
            scale: 1.03, 
            y: -3,
            boxShadow: value !== 'no' ? '0 10px 25px rgba(239, 68, 68, 0.15)' : undefined
          }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange('no')}
          className={`group relative flex-1 py-6 px-6 rounded-2xl border-2 font-bold text-lg transition-all duration-300 overflow-hidden ${
            value === 'no'
              ? 'bg-gradient-to-br from-brand-blue-600 via-brand-blue-500 to-brand-lime text-white border-brand-lime shadow-xl shadow-brand-lime/40 ring-4 ring-brand-lime/20'
              : 'bg-white border-gray-200 text-brand-blue-900 hover:border-red-300 hover:bg-gradient-to-br hover:from-red-50 hover:to-red-50/50 hover:shadow-lg'
          }`}
        >
          {/* Animated gradient background */}
          {value === 'no' && (
            <>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: 'easeInOut',
                }}
              />
              {/* Ripple effect on click */}
              <motion.div
                className="absolute inset-0 bg-white/30 rounded-full"
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            </>
          )}
          
          <div className="relative z-10 flex items-center justify-center gap-3">
            <motion.div
              animate={value === 'no' ? { 
                scale: [1, 1.3, 1],
                rotate: [0, -15, 15, 0]
              } : {
                scale: 1,
                rotate: 0
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <XCircle className={`w-6 h-6 transition-colors ${value === 'no' ? 'text-white' : 'text-red-500'}`} strokeWidth={2.5} />
            </motion.div>
            <motion.span
              animate={value === 'no' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="font-bold"
            >
              No
            </motion.span>
          </div>
          
          {/* Warning indicator animation */}
          {value === 'no' && (
            <motion.div
              className="absolute top-2 right-2"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                <XCircle className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </motion.div>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}



