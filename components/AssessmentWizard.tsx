'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getProductById, type Product } from '@/lib/firebase/database'
import { calculatePrice, type AnswerMap } from '@/lib/pricing/modifiers'
import YesNoQuestion from './questions/YesNoQuestion'
import SingleSelectQuestion from './questions/SingleSelectQuestion'
import ConditionGrid from './questions/ConditionGrid'
import DeviceConditionGrid from './questions/DeviceConditionGrid'
import LaptopConditionGrid from './questions/LaptopConditionGrid'
import IssueGrid from './questions/IssueGrid'
import PhoneIssueGrid from './questions/PhoneIssueGrid'
import LaptopIssueGrid from './questions/LaptopIssueGrid'
import TabletIssueGrid from './questions/TabletIssueGrid'
import AccessoryGrid from './questions/AccessoryGrid'
import PhoneAccessoryGrid from './questions/PhoneAccessoryGrid'
import LaptopAccessoryGrid from './questions/LaptopAccessoryGrid'
import TabletAccessoryGrid from './questions/TabletAccessoryGrid'
import AgeQuestion from './questions/AgeQuestion'
import AssessmentOTPModal from './AssessmentOTPModal'

interface AssessmentWizardProps {
  productId: string
  category: string
  brand: string
  model: string
}

interface Step {
  id: string
  title: string
  component: React.ReactNode
  required?: boolean
}

export default function AssessmentWizard({
  productId,
  category,
  brand,
  model,
}: AssessmentWizardProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [showPrice, setShowPrice] = useState(false)

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getProductById(productId)
        if (!data) {
          setError('Product not found')
          return
        }
        setProduct(data)
        const internalBasePrice = data.internalBasePrice || data.basePrice * 0.5
        setCalculatedPrice(internalBasePrice)
      } catch (err: any) {
        setError(err.message || 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  // Recalculate price when answers change
  useEffect(() => {
    if (product) {
      const internalBasePrice = product.internalBasePrice || product.basePrice * 0.5
      const newPrice = calculatePrice(internalBasePrice, answers)
      setCalculatedPrice(newPrice)
    }
  }, [answers, product])

  // Reset step and answers when category changes
  useEffect(() => {
    if (product) {
      setCurrentStep(0)
      setAnswers({})
    }
  }, [category, product?.category])

  const handleAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleNext = (stepsLength: number) => {
    if (currentStep < stepsLength - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = () => {
    // Show OTP modal instead of directly submitting
    setShowOTPModal(true)
  }

  const handleOTPVerified = async () => {
    if (!product) return

    try {
      // Submit assessment after OTP verification
      const response = await fetch('/api/valuations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: category || product.category,
          brand: brand || product.brand,
          model: model || product.modelName,
          productId: product.id,
          basePrice: product.basePrice,
          internalBasePrice: product.internalBasePrice || product.basePrice * 0.5,
          estimatedValue: calculatedPrice,
          answers,
          status: 'pending',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Close modal and show price
        setShowOTPModal(false)
        setShowPrice(true)
      } else {
        alert('Failed to submit assessment. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting assessment:', error)
      alert('An error occurred. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-brand-blue-900 mb-4">
            {error || 'Product Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'The product you are looking for does not exist.'}
          </p>
        </div>
      </div>
    )
  }

  const internalBasePrice = product.internalBasePrice || product.basePrice * 0.5
  const displayPrice = product.basePrice

  // Get category-specific steps
  const getSteps = (): Step[] => {
    // Prioritize URL category parameter over product category
    const urlCategory = category?.toLowerCase()?.trim()
    const productCategory = product?.category?.toLowerCase()?.trim()
    const cat = urlCategory || productCategory || 'cameras'
    
    // Handle variations in category names - check for phone/iphone first
    if (cat.includes('phone') || cat.includes('iphone')) {
      return getPhoneSteps()
    } else if (cat.includes('laptop')) {
      return getLaptopSteps()
    } else if (cat.includes('tablet')) {
      return getTabletSteps()
    } else if (cat.includes('camera')) {
      return getCameraSteps()
    }
    
    // Fallback to exact matches
    if (cat === 'phones' || cat === 'phone' || cat === 'iphone') {
      return getPhoneSteps()
    } else if (cat === 'laptops' || cat === 'laptop') {
      return getLaptopSteps()
    } else if (cat === 'tablets' || cat === 'tablet') {
      return getTabletSteps()
    } else if (cat === 'cameras' || cat === 'camera') {
      return getCameraSteps()
    }
    
    return getCameraSteps() // Default to cameras
  }

  const getCameraSteps = (): Step[] => [
    {
      id: 'basic-functionality',
      title: 'Basic Functionality',
      component: (
        <div className="space-y-6">
          <YesNoQuestion
            question="Does your camera power on and function properly?"
            helperText="We currently only accept devices that switch on"
            questionId="powerOn"
            value={answers.powerOn as string}
            onChange={(value) => handleAnswer('powerOn', value)}
          />
          <YesNoQuestion
            question="Is the camera body free from major damage (cracks, dents, water damage)?"
            helperText="Check your device's body or buttons condition carefully"
            questionId="bodyDamage"
            value={answers.bodyDamage as string}
            onChange={(value) => handleAnswer('bodyDamage', value)}
          />
          <YesNoQuestion
            question="Is the LCD/Touchscreen working without cracks or display issues?"
            helperText="Check your device's display condition carefully"
            questionId="lcdWorking"
            value={answers.lcdWorking as string}
            onChange={(value) => handleAnswer('lcdWorking', value)}
          />
          <YesNoQuestion
            question="Is the lens (if included) free from scratches, fungus, or dust?"
            helperText="Check your lens condition carefully"
            questionId="lensScratches"
            value={answers.lensScratches as string}
            onChange={(value) => handleAnswer('lensScratches', value)}
          />
          <YesNoQuestion
            question="Does autofocus and zoom work properly on your camera/lens?"
            helperText="Check your device's autofocus and zoom functionality carefully"
            questionId="autofocusWorking"
            value={answers.autofocusWorking as string}
            onChange={(value) => handleAnswer('autofocusWorking', value)}
          />
        </div>
      ),
      required: true,
    },
    {
      id: 'lens-questions',
      title: 'Lens Condition',
      component: (
        <ConditionGrid
          answers={answers}
          onChange={handleAnswer}
        />
      ),
    },
    {
      id: 'functional-issues',
      title: 'Functional Issues',
      component: (
        <IssueGrid
          value={answers.functionalIssues as string[]}
          onChange={(value) => handleAnswer('functionalIssues', value)}
        />
      ),
    },
    {
      id: 'accessories',
      title: 'Accessories',
      component: (
        <AccessoryGrid
          value={answers.accessories as string[]}
          onChange={(value) => handleAnswer('accessories', value)}
        />
      ),
    },
    {
      id: 'age',
      title: 'Device Age',
      component: (
        <AgeQuestion
          value={answers.age as string}
          onChange={(value) => handleAnswer('age', value)}
        />
      ),
    },
  ]

  const getPhoneSteps = (): Step[] => [
    {
      id: 'basic-functionality',
      title: 'Basic Functionality',
      component: (
        <div className="space-y-6">
          <YesNoQuestion
            question="Does your phone power on and function properly?"
            helperText="We currently only accept devices that switch on"
            questionId="powerOn"
            value={answers.powerOn as string}
            onChange={(value) => handleAnswer('powerOn', value)}
          />
          <YesNoQuestion
            question="Is the screen working without cracks or touch issues?"
            helperText="Check for any cracks, dead spots, or unresponsive areas"
            questionId="lcdWorking"
            value={answers.lcdWorking as string}
            onChange={(value) => handleAnswer('lcdWorking', value)}
          />
          <YesNoQuestion
            question="Is the phone body/frame free from major damage or bending?"
            helperText="Check the frame, back panel, and edges carefully"
            questionId="bodyDamage"
            value={answers.bodyDamage as string}
            onChange={(value) => handleAnswer('bodyDamage', value)}
          />
          <YesNoQuestion
            question="Is the battery health above 80%?"
            helperText="Check Settings > Battery > Battery Health (iPhone)"
            questionId="batteryHealth"
            value={answers.batteryHealth as string}
            onChange={(value) => handleAnswer('batteryHealth', value)}
          />
          <YesNoQuestion
            question="Is Face ID / Touch ID working properly?"
            helperText="Test Face ID or Touch ID functionality"
            questionId="biometricWorking"
            value={answers.biometricWorking as string}
            onChange={(value) => handleAnswer('biometricWorking', value)}
          />
          <YesNoQuestion
            question="Are all cameras (front and back) working properly?"
            helperText="Test all camera lenses for clarity and focus"
            questionId="cameraWorking"
            value={answers.cameraWorking as string}
            onChange={(value) => handleAnswer('cameraWorking', value)}
          />
          <YesNoQuestion
            question="Is the phone free from water damage?"
            helperText="Check water damage indicators (usually in SIM tray)"
            questionId="waterDamage"
            value={answers.waterDamage as string}
            onChange={(value) => handleAnswer('waterDamage', value)}
          />
        </div>
      ),
      required: true,
    },
    {
      id: 'condition',
      title: 'Device Condition',
      component: (
        <DeviceConditionGrid
          answers={answers}
          onChange={handleAnswer}
          showFrameCondition={true}
        />
      ),
    },
    {
      id: 'functional-issues',
      title: 'Functional Issues',
      component: (
        <PhoneIssueGrid
          value={answers.functionalIssues as string[]}
          onChange={(value) => handleAnswer('functionalIssues', value)}
        />
      ),
    },
    {
      id: 'accessories',
      title: 'Accessories',
      component: (
        <PhoneAccessoryGrid
          value={answers.accessories as string[]}
          onChange={(value) => handleAnswer('accessories', value)}
        />
      ),
    },
    {
      id: 'age',
      title: 'Device Age',
      component: (
        <AgeQuestion
          value={answers.age as string}
          onChange={(value) => handleAnswer('age', value)}
        />
      ),
    },
  ]

  const getLaptopSteps = (): Step[] => [
    {
      id: 'basic-functionality',
      title: 'Basic Functionality',
      component: (
        <div className="space-y-6">
          <YesNoQuestion
            question="Does your laptop power on and boot properly?"
            helperText="We currently only accept devices that switch on"
            questionId="powerOn"
            value={answers.powerOn as string}
            onChange={(value) => handleAnswer('powerOn', value)}
          />
          <YesNoQuestion
            question="Is the screen free from dead pixels, backlight issues, or cracks?"
            helperText="Check the display carefully under different backgrounds"
            questionId="screenCondition"
            value={answers.screenCondition as string}
            onChange={(value) => handleAnswer('screenCondition', value)}
          />
          <YesNoQuestion
            question="Are the keyboard and trackpad fully functional?"
            helperText="Test all keys and trackpad gestures"
            questionId="keyboardWorking"
            value={answers.keyboardWorking as string}
            onChange={(value) => handleAnswer('keyboardWorking', value)}
          />
          <YesNoQuestion
            question="Is the laptop body/chassis free from major damage or dents?"
            helperText="Check the lid, base, and hinges carefully"
            questionId="bodyDamage"
            value={answers.bodyDamage as string}
            onChange={(value) => handleAnswer('bodyDamage', value)}
          />
          <YesNoQuestion
            question="Is the battery cycle count under 300?"
            helperText="Check About This Mac > System Report > Power (Mac)"
            questionId="batteryCycleCount"
            value={answers.batteryCycleCount as string}
            onChange={(value) => handleAnswer('batteryCycleCount', value)}
          />
          <YesNoQuestion
            question="Are all ports (USB, Thunderbolt, etc.) working properly?"
            helperText="Test all available ports with accessories"
            questionId="portsWorking"
            value={answers.portsWorking as string}
            onChange={(value) => handleAnswer('portsWorking', value)}
          />
          <YesNoQuestion
            question="Does the laptop charge properly?"
            helperText="Test charging functionality"
            questionId="chargingWorking"
            value={answers.chargingWorking as string}
            onChange={(value) => handleAnswer('chargingWorking', value)}
          />
        </div>
      ),
      required: true,
    },
    {
      id: 'condition',
      title: 'Device Condition',
      component: (
        <LaptopConditionGrid
          answers={answers}
          onChange={handleAnswer}
        />
      ),
    },
    {
      id: 'functional-issues',
      title: 'Functional Issues',
      component: (
        <LaptopIssueGrid
          value={answers.functionalIssues as string[]}
          onChange={(value) => handleAnswer('functionalIssues', value)}
        />
      ),
    },
    {
      id: 'accessories',
      title: 'Accessories',
      component: (
        <LaptopAccessoryGrid
          value={answers.accessories as string[]}
          onChange={(value) => handleAnswer('accessories', value)}
        />
      ),
    },
    {
      id: 'age',
      title: 'Device Age',
      component: (
        <AgeQuestion
          value={answers.age as string}
          onChange={(value) => handleAnswer('age', value)}
        />
      ),
    },
  ]

  const getTabletSteps = (): Step[] => [
    {
      id: 'basic-functionality',
      title: 'Basic Functionality',
      component: (
        <div className="space-y-6">
          <YesNoQuestion
            question="Does your tablet power on and function properly?"
            helperText="We currently only accept devices that switch on"
            questionId="powerOn"
            value={answers.powerOn as string}
            onChange={(value) => handleAnswer('powerOn', value)}
          />
          <YesNoQuestion
            question="Is the tablet body free from major damage (cracks, dents, water damage)?"
            helperText="Check your device's body condition carefully"
            questionId="bodyDamage"
            value={answers.bodyDamage as string}
            onChange={(value) => handleAnswer('bodyDamage', value)}
          />
          <YesNoQuestion
            question="Is the screen/touchscreen working without cracks or display issues?"
            helperText="Check your device's display condition carefully"
            questionId="lcdWorking"
            value={answers.lcdWorking as string}
            onChange={(value) => handleAnswer('lcdWorking', value)}
          />
          <YesNoQuestion
            question="Is the battery holding charge properly?"
            helperText="Check your device's battery backup and charging"
            questionId="batteryWorking"
            value={answers.batteryWorking as string}
            onChange={(value) => handleAnswer('batteryWorking', value)}
          />
          <YesNoQuestion
            question="Are the cameras (front and rear) working properly?"
            helperText="Check your device's camera functionality carefully"
            questionId="cameraWorking"
            value={answers.cameraWorking as string}
            onChange={(value) => handleAnswer('cameraWorking', value)}
          />
        </div>
      ),
      required: true,
    },
    {
      id: 'condition',
      title: 'Device Condition',
      component: (
        <DeviceConditionGrid
          answers={answers}
          onChange={handleAnswer}
        />
      ),
    },
    {
      id: 'functional-issues',
      title: 'Functional Issues',
      component: (
        <TabletIssueGrid
          value={answers.functionalIssues as string[]}
          onChange={(value) => handleAnswer('functionalIssues', value)}
        />
      ),
    },
    {
      id: 'accessories',
      title: 'Accessories',
      component: (
        <TabletAccessoryGrid
          value={answers.accessories as string[]}
          onChange={(value) => handleAnswer('accessories', value)}
        />
      ),
    },
    {
      id: 'age',
      title: 'Device Age',
      component: (
        <AgeQuestion
          value={answers.age as string}
          onChange={(value) => handleAnswer('age', value)}
        />
      ),
    },
  ]

  const steps = getSteps()

  const canProceed = () => {
    const step = steps[currentStep]
    if (step.required) {
      // Check if required questions are answered
      if (step.id === 'basic-functionality') {
        const cat = (category?.toLowerCase() || product.category?.toLowerCase() || 'cameras').trim()
        // Handle variations in category names
        if (cat === 'cameras' || cat === 'camera') {
          return answers.powerOn && answers.bodyDamage && answers.lcdWorking && answers.lensScratches && answers.autofocusWorking
        } else if (cat === 'phones' || cat === 'phone' || cat === 'iphone' || cat.includes('phone')) {
          return answers.powerOn && answers.lcdWorking && answers.bodyDamage && answers.batteryHealth && answers.biometricWorking && answers.cameraWorking && answers.waterDamage
        } else if (cat === 'tablets' || cat === 'tablet' || cat.includes('tablet')) {
          return answers.powerOn && answers.bodyDamage && answers.lcdWorking && answers.batteryWorking && answers.cameraWorking
        } else if (cat === 'laptops' || cat === 'laptop' || cat.includes('laptop')) {
          return answers.powerOn && answers.screenCondition && answers.keyboardWorking && answers.bodyDamage && answers.batteryCycleCount && answers.portsWorking && answers.chargingWorking
        }
      }
    }
    return true
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 md:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-blue-900">
              {product.modelName}
            </h1>
            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-blue-600 to-brand-lime"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-brand-blue-900 mb-6">
            {steps[currentStep].title}
          </h2>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {steps[currentStep].component}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Price Display - Show after OTP verification */}
        {showPrice && product && (
          <div className="bg-gradient-to-br from-brand-blue-700 to-brand-lime-600 rounded-xl p-6 mb-6 text-white shadow-lg">
            <div className="text-sm opacity-90 mb-1">Current Estimated Value</div>
            <div className="text-3xl md:text-4xl font-bold">
              ₹{calculatedPrice.toLocaleString('en-IN')}
            </div>
            <div className="text-xs opacity-75 mt-2">
              Base: ₹{(product.internalBasePrice || product.basePrice * 0.5).toLocaleString('en-IN')} | Display: ₹{product.basePrice.toLocaleString('en-IN')}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              currentStep === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-2 border-gray-300 text-brand-blue-900 hover:border-brand-lime'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => handleNext(steps.length)}
              disabled={!canProceed()}
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                !canProceed()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-brand-lime text-brand-blue-900 hover:bg-brand-lime-400'
              }`}
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-brand-blue-600 to-brand-lime text-white hover:shadow-lg transition-all flex items-center gap-2"
            >
              Finish
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* OTP Modal */}
      <AssessmentOTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerified={handleOTPVerified}
      />
    </div>
  )
}


