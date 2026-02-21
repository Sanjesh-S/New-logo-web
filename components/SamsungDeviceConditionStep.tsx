'use client'

import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, XCircle, Camera } from 'lucide-react'
import { getAssetPath } from '@/lib/utils'
import type { AnswerMap } from '@/lib/pricing/modifiers'
import YesNoQuestion from './questions/YesNoQuestion'

interface SamsungDeviceConditionStepProps {
  answers: AnswerMap
  onChange: (questionId: string, value: string | string[]) => void
  showSPen: boolean
}

const displayConditionImage = (condition: string): string | null => {
  const imageMap: Record<string, string> = {
    goodWorking: getAssetPath('/Icons/Mobile Display_Perfect.svg'),
    screenLine: getAssetPath('/Icons/Mobile Display_Scratch.svg'),
    minorCrack: getAssetPath('/Icons/Mobile Display_Scratch.svg'),
    majorDamage: getAssetPath('/Icons/Mobile Display_Major.svg'),
  }
  return imageMap[condition] || null
}

const getIcon = (condition: string) => {
  if (condition === 'goodWorking' || condition === 'cameraGood' || condition === 'normalGood') {
    return <CheckCircle className="w-5 h-5" />
  }
  if (condition === 'screenLine' || condition === 'minorCrack' || condition === 'actionRequired') {
    return <AlertCircle className="w-5 h-5" />
  }
  return <XCircle className="w-5 h-5" />
}

export default function SamsungDeviceConditionStep({
  answers,
  onChange,
  showSPen,
}: SamsungDeviceConditionStepProps) {
  return (
    <div className="space-y-8">
      {/* Display Condition */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">Display condition</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'goodWorking', label: 'Good Working' },
            { id: 'screenLine', label: 'Screen Line' },
            { id: 'minorCrack', label: 'Minor crack' },
            { id: 'majorDamage', label: 'Major damage / Dead pixels' },
          ].map((option) => {
            const imagePath = displayConditionImage(option.id)
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
                    <img src={imagePath} alt={option.label} className="w-20 h-20 object-contain" />
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

      {/* S Pen (only for Ultra/Note) */}
      {showSPen && (
        <div>
          <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">S Pen Specifics</h3>
          <div className="space-y-4">
            <YesNoQuestion
              question="Physical condition: Tip (nib) not worn out or broken."
              questionId="sPenTipGood"
              value={answers.sPenTipGood as string}
              onChange={(value) => onChange('sPenTipGood', value)}
            />
            <YesNoQuestion
              question="Writing/Touch: Does it write smoothly across the entire screen?"
              questionId="sPenWriting"
              value={answers.sPenWriting as string}
              onChange={(value) => onChange('sPenWriting', value)}
            />
            <YesNoQuestion
              question="Air Actions: Does the S Pen button work as a remote (e.g., to take a photo)?"
              questionId="sPenAirActions"
              value={answers.sPenAirActions as string}
              onChange={(value) => onChange('sPenAirActions', value)}
            />
            <YesNoQuestion
              question="Charging/Connectivity: Does it show as &quot;Connected&quot; and &quot;Charging&quot; when docked?"
              questionId="sPenCharging"
              value={answers.sPenCharging as string}
              onChange={(value) => onChange('sPenCharging', value)}
            />
          </div>
        </div>
      )}

      {/* Camera condition */}
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">Camera condition</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'cameraGood', label: 'Good Condition' },
            { id: 'frontCameraNotWorking', label: 'Front camera not working properly' },
            { id: 'backCameraNotFocusing', label: 'Back camera / 100x Zoom not focusing' },
          ].map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('cameraCondition', option.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                answers.cameraCondition === option.id
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              <div className="mb-2 flex justify-center">
                {option.id === 'cameraGood' ? <Camera className="w-5 h-5" /> : getIcon(option.id)}
              </div>
              <div className="text-xs font-medium">{option.label}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
