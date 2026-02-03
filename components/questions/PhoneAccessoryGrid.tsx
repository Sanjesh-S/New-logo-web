'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, Box, Cable, FileText, Smartphone, PenLine, Shield, X } from 'lucide-react'
import { getAssetPath } from '@/lib/utils'

interface PhoneAccessoryGridProps {
  value?: string[]
  onChange: (value: string[]) => void
  variant?: 'default' | 'samsung'
}

const defaultPhoneAccessories = [
  { id: 'charger', label: 'Original Charger', icon: Zap },
  { id: 'box', label: 'Original Box', icon: Box },
  { id: 'cable', label: 'Original Cable', icon: Cable },
  { id: 'manual', label: 'Original manual', icon: FileText },
  { id: 'case', label: 'Phone case', icon: Smartphone },
]

const samsungPhoneAccessories = [
  { id: 'superFastCharger', label: 'Original Super-Fast Charger', icon: Zap },
  { id: 'box', label: 'Original Box', icon: Box },
  { id: 'cable', label: 'Original Cable', icon: Cable },
  { id: 'sPen', label: 'Original S Pen (Replacement pens often lack Bluetooth/Air Actions)', icon: PenLine },
  { id: 'case', label: 'Phone case', icon: Smartphone },
  { id: 'screenProtector', label: 'Screen protector', icon: Shield },
]

export default function PhoneAccessoryGrid({ value, onChange, variant = 'default' }: PhoneAccessoryGridProps) {
  // Initialize with empty array if value is undefined, but track that it's not user interaction
  const accessoriesValue = value || []
  const [hasInteracted, setHasInteracted] = useState(false)
  const [explicitlyNoAccessories, setExplicitlyNoAccessories] = useState(false)
  
  const phoneAccessories = variant === 'samsung' ? samsungPhoneAccessories : defaultPhoneAccessories
  
  useEffect(() => {
    // Track if user has selected any accessories
    if (accessoriesValue.length > 0) {
      setHasInteracted(true)
      setExplicitlyNoAccessories(false)
    }
  }, [accessoriesValue])
  
  const getPhoneAccessoryImage = (accessoryId: string): string | null => {
    const imageMap: Record<string, string> = {
      'charger': getAssetPath('/images/conditions/phone-accessory-charger.webp'),
      'box': getAssetPath('/images/conditions/phone-accessory-box.webp'),
      'case': getAssetPath('/images/conditions/phone-accessory-case.webp'),
    }
    return imageMap[accessoryId] || null
  }

  const handleToggle = (accessoryId: string) => {
    setHasInteracted(true)
    setExplicitlyNoAccessories(false)
    if (accessoriesValue.includes(accessoryId)) {
      onChange(accessoriesValue.filter((id) => id !== accessoryId))
    } else {
      onChange([...accessoriesValue, accessoryId])
    }
  }

  const handleNoAccessories = () => {
    setHasInteracted(true)
    setExplicitlyNoAccessories(true)
    onChange([])
  }

  const isSelected = (accessoryId: string) => accessoriesValue.includes(accessoryId)
  const shouldHighlightNoAccessories = explicitlyNoAccessories && accessoriesValue.length === 0

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
        Add the items you have — each gives a bonus.
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {phoneAccessories.map((accessory) => {
          const Icon = accessory.icon
          const imagePath = getPhoneAccessoryImage(accessory.id)
          return (
            <motion.button
              key={accessory.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleToggle(accessory.id)}
              className={`p-6 rounded-xl border-2 text-center transition-all ${
                isSelected(accessory.id)
                  ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                  : 'bg-white border-gray-200 text-brand-blue-900 hover:border-brand-lime'
              }`}
            >
              {imagePath ? (
                <img
                  src={imagePath}
                  alt={accessory.label}
                  className="w-16 h-16 mx-auto mb-2 object-contain"
                />
              ) : (
                <Icon className="w-12 h-12 mx-auto mb-2" />
              )}
              <div className="text-xs font-medium">{accessory.label}</div>
            </motion.button>
          )
        })}
      </div>

      {/* No accessories button - Full width, below grid (same as DSLR) */}
      <div className="mt-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleNoAccessories}
          className={`w-full p-4 rounded-xl border-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            shouldHighlightNoAccessories
              ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
              : 'bg-white border-gray-200 text-gray-700 hover:border-brand-lime'
          }`}
        >
          <X className="w-4 h-4" />
          No accessories
        </motion.button>
      </div>
    </div>
  )
}


