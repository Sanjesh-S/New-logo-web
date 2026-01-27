'use client'

import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, XCircle, Camera, Monitor, Grip, Eye, AlertTriangle } from 'lucide-react'
import type { AnswerMap } from '@/lib/pricing/modifiers'

interface BodyConditionsGridProps {
  answers: AnswerMap
  onChange: (questionId: string, value: string | string[]) => void
}

export default function BodyConditionsGrid({ answers, onChange }: BodyConditionsGridProps) {
  const getIcon = (condition: string) => {
    if (condition.includes('likeNew') || condition.includes('good') || condition.includes('clean') || condition.includes('none')) {
      return <CheckCircle className="w-5 h-5" />
    } else if (condition.includes('average') || condition.includes('fair') || condition.includes('minor') || condition.includes('intermittent')) {
      return <AlertCircle className="w-5 h-5" />
    } else {
      return <XCircle className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Question 1: Physical condition of camera body */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          What is the physical condition of the camera body?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'likeNew', label: 'Like New: No scratches, dents, or cracks.', icon: <Camera className="w-5 h-5" /> },
            { id: 'average', label: 'Average: Minor scratches or normal wear.', icon: <AlertCircle className="w-5 h-5" /> },
            { id: 'worn', label: 'Worn: Visible dents or deep scratches.', icon: <XCircle className="w-5 h-5" /> },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('bodyPhysicalCondition', option.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                answers.bodyPhysicalCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {option.icon}
                </div>
                <div className="text-sm font-medium">{option.label}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Question 2: LCD Display condition */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          What is the condition of the LCD Display?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'good', label: 'Good: Clean screen with no issues.', icon: <Monitor className="w-5 h-5" /> },
            { id: 'fair', label: 'Fair: Minor scratches or marks.', icon: <AlertCircle className="w-5 h-5" /> },
            { id: 'poor', label: 'Poor: Cracked screen, dead pixels, or heavy discoloration.', icon: <XCircle className="w-5 h-5" /> },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('lcdDisplayCondition', option.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                answers.lcdDisplayCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {option.icon}
                </div>
                <div className="text-sm font-medium">{option.label}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Question 3: Rubber grips and covers */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          What is the condition of the rubber grips and covers?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'good', label: 'Good: All rubber is tight and intact.', icon: <Grip className="w-5 h-5" /> },
            { id: 'fair', label: 'Fair: USB/Port covers are missing.', icon: <AlertCircle className="w-5 h-5" /> },
            { id: 'poor', label: 'Poor: Handgrip rubber is loose, sticky, or expanding.', icon: <XCircle className="w-5 h-5" /> },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('rubberGripsCondition', option.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                answers.rubberGripsCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {option.icon}
                </div>
                <div className="text-sm font-medium">{option.label}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Question 4: Dust or fungus in Sensor/Viewfinder */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          Is there dust or fungus in the Sensor or Viewfinder?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'clean', label: 'Clean: No visible dust or fungus.', icon: <Eye className="w-5 h-5" /> },
            { id: 'minor', label: 'Minor: Light dust or small fungus spots.', icon: <AlertCircle className="w-5 h-5" /> },
            { id: 'major', label: 'Major: Heavy fungus, haze, or thick dust.', icon: <XCircle className="w-5 h-5" /> },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('sensorViewfinderCondition', option.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                answers.sensorViewfinderCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {option.icon}
                </div>
                <div className="text-sm font-medium">{option.label}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Question 5: Error codes */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          Does the camera show any error codes?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'none', label: 'None: The camera works perfectly without errors.', icon: <CheckCircle className="w-5 h-5" /> },
            { id: 'intermittent', label: 'Intermittent: Error messages appear occasionally.', icon: <AlertTriangle className="w-5 h-5" /> },
            { id: 'persistent', label: 'Persistent: Error messages appear frequently or constantly.', icon: <XCircle className="w-5 h-5" /> },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('errorCodesCondition', option.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                answers.errorCodesCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {option.icon}
                </div>
                <div className="text-sm font-medium">{option.label}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
