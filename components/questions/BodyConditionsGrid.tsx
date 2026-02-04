'use client'

import { motion } from 'framer-motion'
import { getAssetPath } from '@/lib/utils'
import type { AnswerMap } from '@/lib/pricing/modifiers'

const bodyConditionImages: Record<string, string> = {
  likeNew: getAssetPath('/images/conditions/camera-body-like-new.png'),
  average: getAssetPath('/images/conditions/camera-body-average.png'),
  worn: getAssetPath('/images/conditions/camera-body-worn.png'),
}

const lcdDisplayImages: Record<string, string> = {
  good: getAssetPath('/images/conditions/display-good.png'),
  fair: getAssetPath('/images/conditions/display-fair.png'),
  poor: getAssetPath('/images/conditions/display-poor.png'),
}

const rubberGripsImages: Record<string, string> = {
  good: getAssetPath('/images/conditions/rubber-good.png'),
  fair: getAssetPath('/images/conditions/rubber-fair.png'),
  poor: getAssetPath('/images/conditions/rubber-poor.png'),
}

const sensorViewfinderImages: Record<string, string> = {
  clean: getAssetPath('/images/conditions/sensor-clean.png'),
  minor: getAssetPath('/images/conditions/sensor-minor.png'),
  major: getAssetPath('/images/conditions/sensor-major.png'),
}

const errorCodesImages: Record<string, string> = {
  none: getAssetPath('/images/conditions/error-none.png'),
  intermittent: getAssetPath('/images/conditions/error-intermittent.png'),
  persistent: getAssetPath('/images/conditions/error-persistent.png'),
}

interface BodyConditionsGridProps {
  answers: AnswerMap
  onChange: (questionId: string, value: string | string[]) => void
}

export default function BodyConditionsGrid({ answers, onChange }: BodyConditionsGridProps) {
  return (
    <div className="space-y-5 md:space-y-8">
      {/* Question 1: Physical condition of camera body */}
      <div>
        <h3 className="text-base md:text-lg font-semibold text-brand-blue-900 mb-3 md:mb-4">
          What is the physical condition of the camera body?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
          {[
            { id: 'likeNew', label: 'Like New: No scratches, dents, or cracks.', imageKey: 'likeNew' },
            { id: 'average', label: 'Average: Minor scratches or normal wear.', imageKey: 'average' },
            { id: 'worn', label: 'Worn: Visible dents or deep scratches.', imageKey: 'worn' },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('bodyPhysicalCondition', option.id)}
              className={`p-3 md:p-4 rounded-xl border-2 text-left transition-all flex flex-col items-center text-center gap-2 md:gap-3 ${
                answers.bodyPhysicalCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 flex-shrink-0 flex items-center justify-center bg-transparent">
                <img
                  src={bodyConditionImages[option.imageKey]}
                  alt={`Camera body condition: ${option.label}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-medium leading-tight">{option.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Question 2: LCD Display condition */}
      <div>
        <h3 className="text-base md:text-lg font-semibold text-brand-blue-900 mb-3 md:mb-4">
          What is the condition of the LCD Display?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
          {[
            { id: 'good', label: 'Good: Clean screen with no issues.', imageKey: 'good' },
            { id: 'fair', label: 'Fair: Minor scratches or marks.', imageKey: 'fair' },
            { id: 'poor', label: 'Poor: Cracked screen or vintage.', imageKey: 'poor' },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('lcdDisplayCondition', option.id)}
              className={`p-3 md:p-4 rounded-xl border-2 text-left transition-all flex flex-col items-center text-center gap-2 md:gap-3 ${
                answers.lcdDisplayCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 flex-shrink-0 flex items-center justify-center bg-transparent">
                <img
                  src={lcdDisplayImages[option.imageKey]}
                  alt={`LCD display condition: ${option.label}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-medium leading-tight">{option.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Question 3: Rubber grips and covers */}
      <div>
        <h3 className="text-base md:text-lg font-semibold text-brand-blue-900 mb-3 md:mb-4">
          What is the condition of the rubber grips and covers?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
          {[
            { id: 'good', label: 'Good: All rubber is tight and intact.', imageKey: 'good' },
            { id: 'fair', label: 'Fair: USB/Port covers are missing.', imageKey: 'fair' },
            { id: 'poor', label: 'Poor: Handgrip rubber is loose or missing.', imageKey: 'poor' },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('rubberGripsCondition', option.id)}
              className={`p-3 md:p-4 rounded-xl border-2 text-left transition-all flex flex-col items-center text-center gap-2 md:gap-3 ${
                answers.rubberGripsCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 flex-shrink-0 flex items-center justify-center bg-transparent">
                <img
                  src={rubberGripsImages[option.imageKey]}
                  alt={`Rubber grips condition: ${option.label}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-medium leading-tight">{option.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Question 4: Dust or fungus in Sensor/Viewfinder */}
      <div>
        <h3 className="text-base md:text-lg font-semibold text-brand-blue-900 mb-3 md:mb-4">
          Is there dust or fungus in the Sensor or Viewfinder?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
          {[
            { id: 'clean', label: 'Clean: No visible dust or fungus.', imageKey: 'clean' },
            { id: 'minor', label: 'Minor: Light dust or small fungus spots.', imageKey: 'minor' },
            { id: 'major', label: 'Major: Heavy fungus, haze, or thick dust.', imageKey: 'major' },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('sensorViewfinderCondition', option.id)}
              className={`p-3 md:p-4 rounded-xl border-2 text-left transition-all flex flex-col items-center text-center gap-2 md:gap-3 ${
                answers.sensorViewfinderCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 flex-shrink-0 flex items-center justify-center bg-transparent">
                <img
                  src={sensorViewfinderImages[option.imageKey]}
                  alt={`Sensor or viewfinder: ${option.label}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-medium leading-tight">{option.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Question 5: Error codes */}
      <div>
        <h3 className="text-base md:text-lg font-semibold text-brand-blue-900 mb-3 md:mb-4">
          Does the camera show any error codes?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
          {[
            { id: 'none', label: 'None: The camera works perfectly without errors.', imageKey: 'none' },
            { id: 'intermittent', label: 'Intermittent: Error messages appear occasionally.', imageKey: 'intermittent' },
            { id: 'persistent', label: 'Persistent: Error messages appear frequently or constantly.', imageKey: 'persistent' },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('errorCodesCondition', option.id)}
              className={`p-3 md:p-4 rounded-xl border-2 text-left transition-all flex flex-col items-center text-center gap-2 md:gap-3 ${
                answers.errorCodesCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 flex-shrink-0 flex items-center justify-center bg-transparent">
                <img
                  src={errorCodesImages[option.imageKey]}
                  alt={`Error codes: ${option.label}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-medium leading-tight">{option.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
