'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  steps?: Array<{ id: string; title: string }>
}

export default function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="w-full space-y-2 md:space-y-4">
      {/* Progress Bar */}
      <div className="relative h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-blue-600 via-brand-blue-500 to-brand-lime rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Glow effect */}
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-brand-blue-600/50 via-brand-lime/50 to-brand-lime/30 blur-sm" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Indicators */}
      {steps && steps.length > 0 && (
        <div className="flex items-center justify-between gap-1 md:gap-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep
            const isUpcoming = index > currentStep

            return (
              <div
                key={step.id}
                className="flex flex-col items-center flex-1"
              >
                <div className="relative flex items-center justify-center w-full">
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute top-3 md:top-4 left-1/2 w-full h-0.5 ${
                        isCompleted ? 'bg-brand-lime' : 'bg-gray-200'
                      }`}
                      style={{ transform: 'translateX(50%)' }}
                    />
                  )}

                  {/* Step Circle */}
                  <motion.div
                    className={`relative z-10 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold text-xs md:text-sm transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white shadow-lg shadow-brand-lime/30'
                        : isCurrent
                        ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white shadow-lg shadow-brand-lime/30 ring-2 md:ring-4 ring-brand-lime/20'
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                    }`}
                    animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </motion.div>
                </div>

                {/* Step Label (hidden on mobile, shown on larger screens) */}
                <div className="mt-1 md:mt-2 hidden md:block">
                  <p
                    className={`text-xs font-medium text-center ${
                      isCurrent
                        ? 'text-brand-blue-900 font-bold'
                        : isCompleted
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.title.length > 15 ? `${step.title.slice(0, 15)}...` : step.title}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Progress Percentage (Mobile) */}
      <div className="md:hidden text-center">
        <span className="text-xs md:text-sm font-semibold text-brand-blue-900">
          {Math.round(progress)}% Complete
        </span>
      </div>
    </div>
  )
}
