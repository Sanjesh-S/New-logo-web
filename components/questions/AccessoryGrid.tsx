'use client'

import { motion } from 'framer-motion'
import { Zap, Battery, Box, ShoppingBag, Cable, Camera, FileText } from 'lucide-react'

interface AccessoryGridProps {
  value?: string[]
  onChange: (value: string[]) => void
}

const accessories = [
  { id: 'adapter', label: 'Original Adapter', icon: Zap },
  { id: 'battery', label: 'Original Battery', icon: Battery },
  { id: 'box', label: 'Original Box', icon: Box },
  { id: 'bag', label: 'Original Bag', icon: ShoppingBag },
  { id: 'cable', label: 'Original Cable', icon: Cable },
  { id: 'tripod', label: 'Original Tripod', icon: Camera },
  { id: 'manual', label: 'Original Manual', icon: FileText },
]

export default function AccessoryGrid({ value = [], onChange }: AccessoryGridProps) {
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
        {accessories.map((accessory) => {
          const Icon = accessory.icon
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
              <Icon className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm font-medium">{accessory.label}</div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}



