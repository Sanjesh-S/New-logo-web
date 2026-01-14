'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Check, Camera } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getDevices as getDevicesFromDb, getDevice as getDeviceFromDb, createValuation } from '@/lib/firebase/database'
import OTPLogin from '@/components/OTPLogin'

interface Device {
  id: string
  brand: string
  model: string
  category: string
  basePrice: number
}

const conditionOptions = [
  { value: 'excellent', label: 'Excellent', desc: 'Like new, no scratches' },
  { value: 'good', label: 'Good', desc: 'Minor wear, fully functional' },
  { value: 'fair', label: 'Fair', desc: 'Visible wear, works well' },
  { value: 'poor', label: 'Poor', desc: 'Heavy wear, some issues' },
]

const usageOptions = [
  { value: 'light', label: 'Light Use', desc: 'Rarely used' },
  { value: 'moderate', label: 'Moderate Use', desc: 'Regular use' },
  { value: 'heavy', label: 'Heavy Use', desc: 'Frequent use' },
]

const accessoriesOptions = [
  { value: 'box', label: 'Original Box', price: 50 },
  { value: 'charger', label: 'Charger', price: 30 },
  { value: 'battery', label: 'Extra Battery', price: 40 },
  { value: 'lens', label: 'Lens Included', price: 200 },
]

interface ValuationData {
  brand: string
  model: string
  condition: string
  usage: string
  accessories: string[]
}

export default function TradeInFlow() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || 'cameras'
  const brandFromUrl = searchParams.get('brand') || ''
  const { user, isAuthenticated } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [valuation, setValuation] = useState<ValuationData>({
    brand: brandFromUrl,
    model: '',
    condition: '',
    usage: '',
    accessories: [],
  })
  const [estimatedValue, setEstimatedValue] = useState(0)
  const [basePrice, setBasePrice] = useState(0)
  const [brands, setBrands] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const totalSteps = 5

  // Fetch brands for the category
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true)
        // Use Firebase directly instead of API routes (for static export)
        const fetchedDevices = await getDevicesFromDb(category)
        // Handle both array and paginated result formats
        const devicesArray = Array.isArray(fetchedDevices) 
          ? fetchedDevices 
          : (fetchedDevices?.data || [])
        setDevices(devicesArray as Device[])
        const uniqueBrands = Array.from(
          new Set(devicesArray.map((d) => d.brand))
        ).sort() as string[]
        setBrands(uniqueBrands)
      } catch (error) {
        console.error('Error fetching brands:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBrands()
  }, [category])

  // Pre-select brand from URL and advance to step 2
  useEffect(() => {
    if (brandFromUrl && brands.length > 0) {
      setValuation(prev => ({ ...prev, brand: brandFromUrl }))
      setCurrentStep(2)
      fetchModelsForBrand(brandFromUrl)
    }
  }, [brandFromUrl, brands.length])

  // Fetch models when brand is selected
  const fetchModelsForBrand = async (brand: string) => {
    try {
      // Use Firebase directly instead of API routes (for static export)
      const fetchedDevices = await getDevicesFromDb(category, brand)
      // Handle both array and paginated result formats
      const devicesArray = Array.isArray(fetchedDevices) 
        ? fetchedDevices 
        : (fetchedDevices?.data || [])
      const uniqueModels = Array.from(
        new Set(devicesArray.map((d) => d.model))
      ).sort() as string[]
      setModels(uniqueModels)
    } catch (error) {
      console.error('Error fetching models:', error)
    }
  }

  // Calculate base price when brand/model selected - fetch from Firestore
  useEffect(() => {
    if (valuation.brand && valuation.model) {
      const device = devices.find(
        d => d.brand.toLowerCase() === valuation.brand.toLowerCase() &&
          d.model === valuation.model
      )
      if (device) {
        setBasePrice(device.basePrice)
      } else {
        // Fallback: try to fetch directly from Firebase
        getDeviceFromDb(valuation.brand, valuation.model)
          .then(deviceData => {
            if (deviceData) {
              setBasePrice(deviceData.basePrice)
            }
          })
          .catch(err => console.error('Error fetching device price:', err))
      }
    }
  }, [valuation.brand, valuation.model, devices, category])

  // Calculate final value based on all factors
  useEffect(() => {
    let value = basePrice

    // Condition multiplier
    const conditionMultipliers: Record<string, number> = {
      excellent: 1.0,
      good: 0.85,
      fair: 0.65,
      poor: 0.4,
    }
    if (valuation.condition) {
      value *= conditionMultipliers[valuation.condition] || 1
    }

    // Usage multiplier
    const usageMultipliers: Record<string, number> = {
      light: 1.0,
      moderate: 0.9,
      heavy: 0.75,
    }
    if (valuation.usage) {
      value *= usageMultipliers[valuation.usage] || 1
    }

    // Add accessories
    const accessoryTotal = valuation.accessories.reduce((sum, acc) => {
      const accessory = accessoriesOptions.find(a => a.value === acc)
      return sum + (accessory?.price || 0)
    }, 0)
    value += accessoryTotal

    setEstimatedValue(Math.round(value))
  }, [basePrice, valuation.condition, valuation.usage, valuation.accessories])

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleBrandSelect = async (brand: string) => {
    setValuation({ ...valuation, brand, model: '' })
    await fetchModelsForBrand(brand)
    if (currentStep === 1) handleNext()
  }

  const handleModelSelect = (model: string) => {
    setValuation({ ...valuation, model })
    if (currentStep === 2) handleNext()
  }

  const handleConditionSelect = (condition: string) => {
    setValuation({ ...valuation, condition })
    if (currentStep === 3) handleNext()
  }

  const handleUsageSelect = (usage: string) => {
    setValuation({ ...valuation, usage })
    if (currentStep === 4) handleNext()
  }

  const toggleAccessory = (accessory: string) => {
    setValuation({
      ...valuation,
      accessories: valuation.accessories.includes(accessory)
        ? valuation.accessories.filter(a => a !== accessory)
        : [...valuation.accessories, accessory],
    })
  }

  const steps = [
    {
      id: 1,
      title: 'Select Brand',
      component: loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {brands.map((brand) => (
            <motion.button
              key={brand}
              onClick={() => handleBrandSelect(brand)}
              className={`p-4 md:p-6 rounded-xl border-2 text-brand-blue-900 font-semibold capitalize transition-all ${valuation.brand.toLowerCase() === brand.toLowerCase()
                ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime scale-105'
                : 'bg-white border-gray-200 hover:border-brand-lime'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {brand.charAt(0).toUpperCase() + brand.slice(1)}
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      id: 2,
      title: 'Select Model',
      component: !valuation.brand ? (
        <div className="text-center py-12 text-gray-600">Please select a brand first</div>
      ) : models.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((model) => (
            <motion.button
              key={model}
              onClick={() => handleModelSelect(model)}
              className={`p-4 rounded-xl border-2 text-brand-blue-900 text-left transition-all ${valuation.model === model
                ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                : 'bg-white border-gray-200 hover:border-brand-lime'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {model}
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      id: 3,
      title: 'Condition',
      component: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conditionOptions.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => handleConditionSelect(option.value)}
              className={`p-4 md:p-6 rounded-xl border-2 text-brand-blue-900 text-left transition-all ${valuation.condition === option.value
                ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                : 'bg-white border-gray-200 hover:border-brand-lime'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="font-semibold text-lg mb-1">{option.label}</div>
              <div className={`text-sm ${valuation.condition === option.value ? 'text-white/90' : 'text-gray-600'}`}>{option.desc}</div>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      id: 4,
      title: 'Usage',
      component: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {usageOptions.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => handleUsageSelect(option.value)}
              className={`p-4 md:p-6 rounded-xl border-2 text-brand-blue-900 text-center transition-all ${valuation.usage === option.value
                ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                : 'bg-white border-gray-200 hover:border-brand-lime'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="font-semibold text-lg mb-1">{option.label}</div>
              <div className={`text-sm ${valuation.usage === option.value ? 'text-white/90' : 'text-gray-600'}`}>{option.desc}</div>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      id: 5,
      title: 'Accessories',
      component: (
        <div className="space-y-4">
          {accessoriesOptions.map((accessory) => (
            <motion.button
              key={accessory.value}
              onClick={() => toggleAccessory(accessory.value)}
              className={`w-full p-4 rounded-xl border-2 text-brand-blue-900 flex items-center justify-between transition-all ${valuation.accessories.includes(accessory.value)
                ? 'bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white border-brand-lime'
                : 'bg-white border-gray-200 hover:border-brand-lime'
                }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                {valuation.accessories.includes(accessory.value) && (
                  <Check className="w-5 h-5" />
                )}
                <span className="font-semibold">{accessory.label}</span>
              </div>
              <span className="text-brand-lime">+${accessory.price}</span>
            </motion.button>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 pt-20 md:pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-blue-900">
              Trade-In Valuation
            </h1>
            <div className="text-gray-600 text-sm md:text-base">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-blue-600 to-brand-lime"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Current Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-xl md:text-2xl font-semibold text-brand-blue-900 mb-6 md:mb-8">
              {steps[currentStep - 1].title}
            </h2>
            {steps[currentStep - 1].component}
          </motion.div>
        </AnimatePresence>

        {/* Estimated Value Display */}
        {(basePrice > 0 || estimatedValue > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50"
          >
            <div className="bg-gradient-to-br from-brand-blue-700 to-brand-lime-600 rounded-xl p-4 md:p-6 shadow-xl">
              <div className="text-white/90 text-sm mb-1">Estimated Value</div>
              {isAuthenticated ? (
                <>
                  <motion.div
                    key={estimatedValue}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-3xl md:text-4xl font-bold text-white"
                  >
                    ${estimatedValue.toLocaleString()}
                  </motion.div>
                  {basePrice > 0 && (
                    <div className="text-white/80 text-xs mt-2">
                      Base: ${basePrice.toLocaleString()}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full mt-2 py-2 bg-white text-brand-blue-900 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  Login to View Price
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4 mt-8">
          <motion.button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all text-sm md:text-base ${currentStep === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white border-2 border-gray-300 text-brand-blue-900 hover:border-brand-lime'
              }`}
            whileHover={currentStep > 1 ? { scale: 1.05 } : {}}
            whileTap={currentStep > 1 ? { scale: 0.95 } : {}}
          >
            Back
          </motion.button>

          {currentStep < totalSteps && (
            <motion.button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !valuation.brand) ||
                (currentStep === 2 && !valuation.model) ||
                (currentStep === 3 && !valuation.condition) ||
                (currentStep === 4 && !valuation.usage)
              }
              className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold flex items-center gap-2 transition-all text-sm md:text-base ${(currentStep === 1 && !valuation.brand) ||
                (currentStep === 2 && !valuation.model) ||
                (currentStep === 3 && !valuation.condition) ||
                (currentStep === 4 && !valuation.usage)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-brand-lime text-brand-blue-900 hover:bg-brand-lime-400'
                }`}
              whileHover={
                !(
                  (currentStep === 1 && !valuation.brand) ||
                  (currentStep === 2 && !valuation.model) ||
                  (currentStep === 3 && !valuation.condition) ||
                  (currentStep === 4 && !valuation.usage)
                )
                  ? { scale: 1.05 }
                  : {}
              }
              whileTap={
                !(
                  (currentStep === 1 && !valuation.brand) ||
                  (currentStep === 2 && !valuation.model) ||
                  (currentStep === 3 && !valuation.condition) ||
                  (currentStep === 4 && !valuation.usage)
                )
                  ? { scale: 0.95 }
                  : {}
              }
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}

          {currentStep === totalSteps && (
            <motion.button
              onClick={async () => {
                try {
                  // Use Firebase directly instead of API routes (for static export)
                  const valuationId = await createValuation({
                    category: category as 'cameras' | 'phones' | 'laptops',
                    brand: valuation.brand,
                    model: valuation.model,
                    condition: valuation.condition as 'excellent' | 'good' | 'fair' | 'poor',
                    usage: valuation.usage as 'light' | 'moderate' | 'heavy',
                    accessories: valuation.accessories,
                    basePrice,
                    estimatedValue,
                    status: 'pending',
                    userId: user?.uid || undefined,
                  })

                  // Redirect to success page
                  window.location.href = `/success?id=${valuationId}&value=${estimatedValue}`
                } catch (error) {
                  console.error('Error submitting valuation:', error)
                  alert('An error occurred. Please try again.')
                }
              }}
              className="px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold bg-brand-lime text-brand-blue-900 hover:bg-brand-lime-400 text-sm md:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Submit & Continue
            </motion.button>
          )}
        </div>
      </div>
      {showLoginModal && (
        <OTPLogin
          onSuccess={() => setShowLoginModal(false)}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  )
}
