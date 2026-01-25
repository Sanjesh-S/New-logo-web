'use client'

import { motion } from 'framer-motion'
import { Zap, Box, Cable, FileText, Briefcase, Mouse } from 'lucide-react'
import { getAssetPath } from '@/lib/utils'

interface LaptopAccessoryGridProps {
  value?: string[]
  onChange: (value: string[]) => void
}

const laptopAccessories = [
  { id: 'charger', label: 'Original Charger', icon: Zap },
  { id: 'box', label: 'Original Box', icon: Box },
  { id: 'cable', label: 'Original Cable', icon: Cable },
  { id: 'manual', label: 'Original Manual', icon: FileText },
  { id: 'bag', label: 'Laptop Bag', icon: Briefcase },
  { id: 'mouse', label: 'Mouse', icon: Mouse },
]

export default function LaptopAccessoryGrid({ value = [], onChange }: LaptopAccessoryGridProps) {
  const getLaptopAccessoryImage = (accessoryId: string): string | null => {
    const imageMap: Record<string, string> = {
      'charger': getAssetPath('/images/conditions/laptop-accessory-charger.webp'),
      'box': getAssetPath('/images/conditions/laptop-accessory-box.webp'),
      'cable': getAssetPath('/images/conditions/laptop-accessory-cable.webp'),
      'bag': getAssetPath('/images/conditions/laptop-accessory-bag.webp'),
    }
    return imageMap[accessoryId] || null
  }

  const handleToggle = (accessoryId: string) => {
    if (value.includes(accessoryId)) {
      onChange(value.filter((id) => id !== accessoryId))
    } else {
      onChange([...value, accessoryId])
    }
  }

  const isSelected = (accessoryId: string) => value.includes(accessoryId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-brand-blue-900">
          Add the items you have — each gives a bonus.
        </h3>
        <button
          onClick={() => onChange([])}
          className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 hover:border-brand-lime transition-colors"
        >
          No accessories
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {laptopAccessories.map((accessory) => {
          const Icon = accessory.icon
          const imagePath = getLaptopAccessoryImage(accessory.id)
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
    </div>
  )
}


