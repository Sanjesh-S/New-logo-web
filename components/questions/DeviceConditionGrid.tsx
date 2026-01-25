'use client'

import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, XCircle, Camera } from 'lucide-react'
import { getAssetPath } from '@/lib/utils'
import type { AnswerMap } from '@/lib/pricing/modifiers'

interface DeviceConditionGridProps {
  answers: AnswerMap
  onChange: (questionId: string, value: string | string[]) => void
  showFrameCondition?: boolean
}

export default function DeviceConditionGrid({ answers, onChange, showFrameCondition = false }: DeviceConditionGridProps) {
  const getPhoneDisplayConditionImage = (condition: string): string | null => {
    const imageMap: Record<string, string> = {
      'flawless': getAssetPath('/images/conditions/phone-flawless.webp'),
      'minor': getAssetPath('/images/conditions/phone-minor.webp'),
      'visible': getAssetPath('/images/conditions/phone-visible.webp'),
      'cracked': getAssetPath('/images/conditions/phone-cracked.webp'),
    }
    return imageMap[condition] || null
  }

  const getPhoneBodyConditionImage = (condition: string): string | null => {
    const imageMap: Record<string, string> = {
      'pristine': getAssetPath('/images/conditions/phone-body-pristine.webp'),
      'light': getAssetPath('/images/conditions/phone-body-light.webp'),
      'moderate': getAssetPath('/images/conditions/phone-body-moderate.webp'),
      'heavy': getAssetPath('/images/conditions/phone-body-heavy.webp'),
    }
    return imageMap[condition] || null
  }

  const getPhoneFrameConditionImage = (condition: string): string | null => {
    const imageMap: Record<string, string> = {
      'perfect': getAssetPath('/images/conditions/phone-frame-perfect.webp'),
      'scuffs': getAssetPath('/images/conditions/phone-frame-scuffs.webp'),
      'visible': getAssetPath('/images/conditions/phone-frame-visible.webp'),
      'bent': getAssetPath('/images/conditions/phone-frame-bent.webp'),
    }
    return imageMap[condition] || null
  }

  const getIcon = (condition: string, category?: string) => {
    if (condition === 'excellent' || condition === 'flawless' || condition === 'pristine' || condition === 'perfect') {
      return <CheckCircle className="w-5 h-5" />
    } else if (condition === 'minor' || condition === 'light' || condition === 'scuffs') {
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
          {(showFrameCondition ? [
            { id: 'flawless', label: 'Flawless - No scratches' },
            { id: 'minor', label: 'Minor scratches' },
            { id: 'visible', label: 'Visible scratches' },
            { id: 'cracked', label: 'Cracked screen' },
          ] : [
            { id: 'excellent', label: 'Excellent - No scratches' },
            { id: 'good', label: 'Good - Minor scratches' },
            { id: 'fair', label: 'Fair - Visible scratches' },
            { id: 'cracked', label: 'Cracked/Broken Display' },
          ]).map((option) => {
            const imagePath = showFrameCondition ? getPhoneDisplayConditionImage(option.id) : null
            return (
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
                  {imagePath ? (
                    <img
                      src={imagePath}
                      alt={option.label}
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    getIcon(option.id)
                  )}
                </div>
                <div className="text-xs font-medium">{option.label}</div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Body Condition */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
          Body Condition
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(showFrameCondition ? [
            { id: 'pristine', label: 'Pristine - Like new' },
            { id: 'light', label: 'Light wear/scratches' },
            { id: 'moderate', label: 'Moderate scratches/dents' },
            { id: 'heavy', label: 'Heavy damage/dents' },
          ] : [
            { id: 'excellent', label: 'Excellent - Like New' },
            { id: 'good', label: 'Good - Minor wear' },
            { id: 'fair', label: 'Fair - Visible scratches/dents' },
            { id: 'poor', label: 'Poor - Heavy damage' },
          ]).map((option) => {
            const imagePath = showFrameCondition ? getPhoneBodyConditionImage(option.id) : null
            return (
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
                  {imagePath ? (
                    <img
                      src={imagePath}
                      alt={option.label}
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </div>
                <div className="text-xs font-medium">{option.label}</div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Frame Condition - Only for phones */}
      {showFrameCondition && (
        <div>
          <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
            Frame Condition
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'perfect', label: 'Perfect condition' },
              { id: 'scuffs', label: 'Minor scuffs' },
              { id: 'visible', label: 'Visible scratches' },
              { id: 'bent', label: 'Bent/Damaged frame' },
            ].map((option) => {
              const imagePath = getPhoneFrameConditionImage(option.id)
              return (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onChange('frameCondition', option.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    answers.frameCondition === option.id
                      ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                      : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
                  }`}
                >
                  <div className="mb-2 flex justify-center">
                    {imagePath ? (
                      <img
                        src={imagePath}
                        alt={option.label}
                        className="w-20 h-20 object-contain"
                      />
                    ) : (
                      getIcon(option.id)
                    )}
                  </div>
                  <div className="text-xs font-medium">{option.label}</div>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

