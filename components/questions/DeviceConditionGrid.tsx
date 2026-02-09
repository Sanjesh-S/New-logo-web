'use client'

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
      'goodWorking': getAssetPath(encodeURI('/Icons/Phone_ Perfect Display.svg')),
      'minorCrack': getAssetPath(encodeURI('/Icons/Phone_Minor Scratch Display.svg')),
      'majorDamage': getAssetPath(encodeURI('/Icons/Phone_Major Scratch Display.svg')),
      // notWorking: left empty for now – add image path here when ready
    }
    return imageMap[condition] || null
  }

  const getBatteryHealthImage = (optionId: string): string => {
    const imageMap: Record<string, string> = {
      'battery90Above': getAssetPath(encodeURI('/Icons/Battery Health_Health 90% & above.svg')),
      'battery80to90': getAssetPath(encodeURI('/Icons/Battery Health_80% & above.svg')),
      'battery50to80': getAssetPath(encodeURI('/Icons/Battery Health_50% to 80%.svg')),
      'batteryBelow50': getAssetPath(encodeURI('/Icons/Battery Health_50% & Below.svg')),
    }
    return imageMap[optionId] ?? ''
  }

  const getCameraConditionImage = (optionId: string): string => {
    const imageMap: Record<string, string> = {
      'cameraGood': getAssetPath(encodeURI('/Icons/Camera Issue_Good.svg')),
      'frontCameraNotWorking': getAssetPath(encodeURI('/Icons/Camera Issue_Front Cam Issue.svg')),
      'backCameraNotWorking': getAssetPath(encodeURI('/Icons/Camera Issue_Back Camera.svg')),
      'bothCamerasNotWorking': getAssetPath(encodeURI('/Icons/Camera Issue_Front & Back Issue.svg')),
    }
    return imageMap[optionId] ?? ''
  }

  const getIcon = (condition: string) => {
    if (condition === 'excellent' || condition === 'flawless' || condition === 'pristine' || condition === 'perfect' || condition === 'goodWorking' || condition === 'cameraGood' || condition === 'battery90Above' || condition === 'battery80to90') {
      return <CheckCircle className="w-8 h-8" />
    } else if (condition === 'minor' || condition === 'light' || condition === 'scuffs' || condition === 'minorCrack' || condition === 'battery50to80') {
      return <AlertCircle className="w-8 h-8" />
    } else {
      return <XCircle className="w-8 h-8" />
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
            { id: 'goodWorking', label: 'Good Working' },
            { id: 'minorCrack', label: 'Minor crack' },
            { id: 'majorDamage', label: 'Major damage' },
            { id: 'notWorking', label: 'Not Working' },
          ] : [
            { id: 'excellent', label: 'Excellent - No scratches' },
            { id: 'good', label: 'Good - Minor scratches' },
            { id: 'fair', label: 'Fair - Visible scratches' },
            { id: 'cracked', label: 'Cracked/Broken Display' },
          ]).map((option) => {
            const imagePath = showFrameCondition ? getPhoneDisplayConditionImage(option.id) : null
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange('displayCondition', option.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                  answers.displayCondition === option.id
                    ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                    : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
                }`}
              >
                <div className="mb-2 flex justify-center min-h-[6rem]">
                  {imagePath ? (
                    <img
                      src={imagePath}
                      alt={option.label}
                      className="w-24 h-24 object-contain"
                    />
                  ) : showFrameCondition && option.id === 'notWorking' ? (
                    null
                  ) : (
                    getIcon(option.id)
                  )}
                </div>
                <div className="text-xs font-medium">{option.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Battery health - phones only */}
      {showFrameCondition && (
        <div>
          <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
            Battery health
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'battery90Above', label: '90% above' },
              { id: 'battery80to90', label: '90% to 80%' },
              { id: 'battery50to80', label: '80% to 50%' },
              { id: 'batteryBelow50', label: 'Below 50%' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange('batteryHealthRange', option.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                  answers.batteryHealthRange === option.id
                    ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                    : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
                }`}
              >
                <div className="mb-2 flex justify-center">
                  <img
                    src={getBatteryHealthImage(option.id)}
                    alt={option.label}
                    className="w-16 h-16 object-contain mx-auto"
                  />
                </div>
                <div className="text-xs font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera condition - phones only */}
      {showFrameCondition && (
        <div>
          <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
            Camera condition
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'cameraGood', label: 'Good Condition' },
              { id: 'frontCameraNotWorking', label: 'Front camera not working properly' },
              { id: 'backCameraNotWorking', label: 'Back camera not working properly' },
              { id: 'bothCamerasNotWorking', label: 'Both not working' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange('cameraCondition', option.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                  answers.cameraCondition === option.id
                    ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                    : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
                }`}
              >
                <div className="mb-2 flex justify-center">
                  <img
                    src={getCameraConditionImage(option.id)}
                    alt={option.label}
                    className="w-16 h-16 object-contain mx-auto"
                  />
                </div>
                <div className="text-xs font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Body Condition - tablets/laptops only (hidden for phones) */}
      {!showFrameCondition && (
        <div>
          <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
            Body Condition
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'excellent', label: 'Excellent - Like New' },
              { id: 'good', label: 'Good - Minor wear' },
              { id: 'fair', label: 'Fair - Visible scratches/dents' },
              { id: 'poor', label: 'Poor - Heavy damage' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange('bodyCondition', option.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                  answers.bodyCondition === option.id
                    ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                    : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
                }`}
              >
                <div className="mb-2 flex justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-xs font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

