'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, ChevronDown } from 'lucide-react'
import { getLensesByBrand, type Product } from '@/lib/firebase/database'

interface LensSelectionProps {
  brand: string
  value?: string[]
  onChange: (value: string[]) => void
}

export default function LensSelection({
  brand,
  value = [],
  onChange,
}: LensSelectionProps) {
  const [lenses, setLenses] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchLenses = async () => {
      try {
        setLoading(true)
        // Fetch lenses from the same brand
        const lensProducts = await getLensesByBrand(brand)
        setLenses(lensProducts)
      } catch (error) {
        console.error('Error fetching lenses:', error)
      } finally {
        setLoading(false)
      }
    }

    if (brand) {
      fetchLenses()
    }
  }, [brand])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleAddLens = () => {
    setIsDropdownOpen(true)
  }

  const handleSelectLens = (lens: Product) => {
    const lensModel = lens.modelName || lens.id
    if (!value.includes(lensModel)) {
      const newLenses = [...value, lensModel]
      onChange(newLenses)
    }
    setIsDropdownOpen(false)
  }

  const handleRemoveLens = (index: number) => {
    const newLenses = value.filter((_, i) => i !== index)
    onChange(newLenses)
  }

  const availableLenses = lenses.filter(
    (lens) => !value.includes(lens.modelName || lens.id)
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-brand-blue-900 mb-1">
          Additional Lens
        </h3>
        <p className="text-sm text-gray-600">
          Select your device additional lens
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-brand-lime border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Selected Lenses */}
          {value.length > 0 && (
            <div className="space-y-3">
              {value.map((lensModel, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl"
                >
                  <span className="text-brand-blue-900 font-medium">
                    {lensModel}
                  </span>
                  <button
                    onClick={() => handleRemoveLens(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove lens"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Dropdown for selecting lens */}
          <div className="relative" ref={dropdownRef}>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DSLR Camera Lens
              </label>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-4 text-left bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-lime focus:ring-4 focus:ring-brand-lime/20 text-brand-blue-900 flex items-center justify-between"
              >
                <span className="text-gray-400">
                  Select a lens
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isDropdownOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                >
                  {availableLenses.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {value.length > 0
                        ? 'All available lenses have been selected'
                        : 'No lenses available for this brand'}
                    </div>
                  ) : (
                    availableLenses.map((lens) => (
                      <button
                        key={lens.id}
                        type="button"
                        onClick={() => handleSelectLens(lens)}
                        className="w-full px-4 py-3 text-left hover:bg-brand-lime/10 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-brand-blue-900">
                          {lens.modelName || lens.id}
                        </span>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Add Another Lens Button */}
          {availableLenses.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddLens}
              className="w-full py-3 px-4 bg-white border-2 border-brand-lime text-brand-lime rounded-xl font-semibold hover:bg-brand-lime/10 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Lens
            </motion.button>
          )}
        </>
      )}
    </div>
  )
}
