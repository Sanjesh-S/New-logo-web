'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle, Power, Smartphone, Laptop, Camera, Wrench, Package, Calendar } from 'lucide-react'
import Image from 'next/image'
import { getProductById, type Product, getPricingRules, getProductPricingFromCollection, loadProductPricingData } from '@/lib/firebase/database'
import { calculatePrice, type AnswerMap } from '@/lib/pricing/modifiers'
import { PricingRules, ZERO_PRICING_RULES } from '@/lib/types/pricing'
import { useAuth } from '@/contexts/AuthContext'
import { getAssetPath } from '@/lib/utils'
import YesNoQuestion from './questions/YesNoQuestion'
import ProgressBar from './ProgressBar'
import TextQuestion, { validateImei, validateSerial } from './questions/TextQuestion'
import SingleSelectQuestion from './questions/SingleSelectQuestion'
import ConditionGrid from './questions/ConditionGrid'
import BodyConditionsGrid from './questions/BodyConditionsGrid'
import DeviceConditionGrid from './questions/DeviceConditionGrid'
import LaptopConditionGrid from './questions/LaptopConditionGrid'
import IssueGrid from './questions/IssueGrid'
import PhoneIssueGrid from './questions/PhoneIssueGrid'
import LaptopIssueGrid from './questions/LaptopIssueGrid'
import TabletIssueGrid from './questions/TabletIssueGrid'
import LensConditionGrid from './questions/LensConditionGrid'
import AccessoryGrid from './questions/AccessoryGrid'
import PhoneAccessoryGrid from './questions/PhoneAccessoryGrid'
import LaptopAccessoryGrid from './questions/LaptopAccessoryGrid'
import TabletAccessoryGrid from './questions/TabletAccessoryGrid'
import AgeQuestion from './questions/AgeQuestion'
import LensSelection from './questions/LensSelection'
import SamsungDeviceConditionStep from './SamsungDeviceConditionStep'
import AssessmentOTPModal from './AssessmentOTPModal'
import OrderConfirmation, { type AddressData } from './OrderConfirmation'

interface AssessmentWizardProps {
  productId: string
  category: string
  brand: string
  model: string
  variantId?: string
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
  variantId,
}: AssessmentWizardProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [showPrice, setShowPrice] = useState(false)
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pricingRules, setPricingRules] = useState<PricingRules>(ZERO_PRICING_RULES)
  const [powerOnPercentage, setPowerOnPercentage] = useState<number | null>(null)
  const [valuationId, setValuationId] = useState<string | null>(null)
  const [stepBeforeSkip, setStepBeforeSkip] = useState<number | null>(null) // Track step before skipping to accessories

  // Fetch product data and pricing rules
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load product data first
        const productData = await getProductById(productId)

        if (!productData) {
          setError('Product not found')
          return
        }

        setProduct(productData)

        // Load pricing rules and powerOnPercentage from Firebase
        let rulesToUse: PricingRules = ZERO_PRICING_RULES
        let powerOnPercent: number | null = null

        try {
          // Use the new function that loads variant-specific rules if variantId is provided
          const pricingData = await loadProductPricingData(productId, variantId || undefined)
          rulesToUse = pricingData.rules
          powerOnPercent = pricingData.powerOnPercentage || null
        } catch (rulesError) {
          // Fallback: try old method
          try {
            const productPricingData = await getProductPricingFromCollection(productId)
            if (productPricingData?.pricingRules) {
              rulesToUse = productPricingData.pricingRules
              powerOnPercent = productPricingData.powerOnPercentage || null
            } else if (productData.pricingRules) {
              rulesToUse = productData.pricingRules
            } else {
              rulesToUse = await getPricingRules()
            }
          } catch (e) {
            // Error loading: use zeros so price = basePrice until rules are set in Firebase
            rulesToUse = ZERO_PRICING_RULES
          }
        }

        setPricingRules(rulesToUse)
        setPowerOnPercentage(powerOnPercent)
        const selectedVariant = productData.variants && variantId
          ? productData.variants.find((v) => v.id === variantId)
          : undefined
        const basePrice = selectedVariant
          ? selectedVariant.basePrice
          : productData.basePrice
        setCalculatedPrice(basePrice)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      loadData()
    }
  }, [productId, variantId])

  // Recalculate price when answers change (use variant price when variantId set)
  useEffect(() => {
    if (product) {
      const selectedVariant = product.variants && variantId
        ? product.variants.find((v) => v.id === variantId)
        : undefined
      const basePrice = selectedVariant
        ? selectedVariant.basePrice
        : product.basePrice
      const newPrice = calculatePrice(basePrice, answers, pricingRules, product.brand, powerOnPercentage)
      setCalculatedPrice(newPrice)
    }
  }, [answers, product, pricingRules, variantId, powerOnPercentage])

  // Reset step and answers when category changes
  useEffect(() => {
    if (product) {
      setCurrentStep(0)
      setAnswers({})
    }
  }, [category, product?.category])

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  const handleAnswer = useCallback((questionId: string, value: string | string[]) => {
    startTransition(() => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: value,
      }))
    })
  }, [])

  // Skip to accessories step if powerOn is "no" for DSLR or Phone
  useEffect(() => {
    if (answers.powerOn === 'no' && product && currentStep !== undefined) {
      const cat = (category?.toLowerCase() || product.category?.toLowerCase() || '').trim()
      const isDSLR = cat === 'cameras' || cat === 'camera' || cat === 'dslr'
      const isPhone = cat === 'phones' || cat === 'phone' || cat === 'iphone' || cat.includes('phone')
      
      if (isDSLR || isPhone) {
        // Calculate steps with current answers to find accessories step
        const steps = getSteps()
        const accessoriesStepIndex = steps.findIndex(step => step.id === 'accessories')
        const currentStepId = steps[currentStep]?.id
        
        // Only skip if we're on the basic-functionality step (step 0) and accessories step exists
        // and we haven't already skipped (check if we're not already at or past accessories)
        if (currentStepId === 'basic-functionality' && currentStep === 0 && accessoriesStepIndex !== -1 && currentStep < accessoriesStepIndex) {
          // Store the current step before skipping
          setStepBeforeSkip(currentStep)
          // Use setTimeout to ensure this happens after state updates
          setTimeout(() => {
            setCurrentStep(accessoriesStepIndex)
          }, 100)
        }
      }
    } else if (answers.powerOn === 'yes' && stepBeforeSkip !== null) {
      // If user changes powerOn back to "yes", clear the skip tracking
      setStepBeforeSkip(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.powerOn, currentStep])

  const handleNext = (stepsLength: number) => {
    if (currentStep < stepsLength - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    const steps = getSteps()
    const currentStepId = steps[currentStep]?.id
    const cat = (category?.toLowerCase() || product?.category?.toLowerCase() || '').trim()
    const isPhone = cat === 'phones' || cat === 'phone' || cat === 'iphone' || cat.includes('phone')
    const isDSLR = cat === 'cameras' || cat === 'camera' || cat === 'dslr'
    
    // If we're on accessories step and we skipped here (either via stepBeforeSkip or powerOn === 'no'), go back to basic-functionality (step 0)
    if (currentStepId === 'accessories' && (isPhone || isDSLR)) {
      // Check if we skipped here by checking powerOn or stepBeforeSkip
      if (answers.powerOn === 'no' || stepBeforeSkip !== null) {
        // Find basic-functionality step index (should be 0)
        const basicFunctionalityIndex = steps.findIndex(step => step.id === 'basic-functionality')
        if (basicFunctionalityIndex !== -1) {
          setCurrentStep(basicFunctionalityIndex)
        } else {
          // Fallback: go to step 0
          setCurrentStep(0)
        }
        // Clear stepBeforeSkip after navigating back
        if (stepBeforeSkip !== null) {
          setStepBeforeSkip(null)
        }
        return // Exit early to prevent further navigation
      }
    }
    
    // Normal back navigation
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const submitAssessment = async (addressData?: AddressData) => {
    if (!product) return

    try {
      // Submit assessment with address data if provided
      const { createValuation } = await import('@/lib/api/client')
      const selectedVariant = product.variants && variantId
        ? product.variants.find((v) => v.id === variantId)
        : undefined
      const basePrice = selectedVariant ? selectedVariant.basePrice : product.basePrice
      
      const data = await createValuation({
        category: (category || product.category) as 'cameras' | 'phones' | 'laptops',
        brand: brand || product.brand,
        model: model || product.modelName,
        productId: product.id,
        basePrice: basePrice,
        estimatedValue: calculatedPrice,
        answers,
        userId: user?.uid || undefined,
        ...(variantId && { variantId }),
        ...(selectedVariant && { variantLabel: selectedVariant.label }),
        // Include address data if provided
        ...(addressData && {
          pickupAddress: `${addressData.address}, ${addressData.landmark ? addressData.landmark + ', ' : ''}${addressData.city}, ${addressData.state} - ${addressData.pincode}`,
          userName: addressData.name,
          userPhone: addressData.phone,
        }),
      })

      if (data.success) {
        const deductions = calculatedPrice - basePrice
        const productParams = `productId=${encodeURIComponent(product.id)}&brand=${encodeURIComponent(product.brand)}&model=${encodeURIComponent(product.modelName)}&category=${encodeURIComponent(product.category)}${variantId ? `&variantId=${encodeURIComponent(variantId)}` : ''}${selectedVariant ? `&variantLabel=${encodeURIComponent(selectedVariant.label)}` : ''}`
        router.push(`/order-summary?id=${data.id}&price=${calculatedPrice}&basePrice=${basePrice}&deductions=${deductions}&${productParams}`)
      } else {
        const deductions = calculatedPrice - basePrice
        const productParams = `productId=${encodeURIComponent(product.id)}&brand=${encodeURIComponent(product.brand)}&model=${encodeURIComponent(product.modelName)}&category=${encodeURIComponent(product.category)}${variantId ? `&variantId=${encodeURIComponent(variantId)}` : ''}${selectedVariant ? `&variantLabel=${encodeURIComponent(selectedVariant.label)}` : ''}`
        router.push(`/order-summary?price=${calculatedPrice}&basePrice=${basePrice}&deductions=${deductions}&${productParams}`)
      }
    } catch (error) {
      console.error('Error submitting assessment:', error)
      const selectedVariant = product.variants && variantId
        ? product.variants.find((v) => v.id === variantId)
        : undefined
      const basePrice = selectedVariant ? selectedVariant.basePrice : product.basePrice
      const deductions = calculatedPrice - basePrice
      const productParams = `productId=${encodeURIComponent(product.id)}&brand=${encodeURIComponent(product.brand)}&model=${encodeURIComponent(product.modelName)}&category=${encodeURIComponent(product.category)}${variantId ? `&variantId=${encodeURIComponent(variantId)}` : ''}${selectedVariant ? `&variantLabel=${encodeURIComponent(selectedVariant.label)}` : ''}`
      router.push(`/order-summary?price=${calculatedPrice}&basePrice=${basePrice}&deductions=${deductions}&${productParams}`)
    }
  }

  const handleFinish = () => {
    // If user is already authenticated, show price first
    // Otherwise, show OTP modal for new users
    if (isAuthenticated && user) {
      // Get phone number from user if available
      const userPhone = user.phoneNumber?.replace('+91', '') || ''
      setPhoneNumber(userPhone)
      setShowPrice(true)
      // Don't show order confirmation yet - wait for "Confirm Order" button click
    } else {
      // Show OTP modal for new/unauthenticated users
      setShowOTPModal(true)
    }
  }

  const handleOTPVerified = async (verifiedPhoneNumber?: string) => {
    // After OTP verification, show price first
    if (verifiedPhoneNumber) {
      setPhoneNumber(verifiedPhoneNumber.replace('+91', ''))
    }
    setShowOTPModal(false)
    setShowPrice(true)
    // Don't show order confirmation yet - wait for "Confirm Order" button click
  }

  const handleConfirmOrder = async () => {
    // Show the pickup form immediately for better UX
    if (!product) return
    
    // Show modal immediately - don't wait for API
    setShowOrderConfirmation(true)
    
    // Create valuation in background
    try {
      const { createValuation } = await import('@/lib/api/client')
      const selectedVariant = product.variants && variantId
        ? product.variants.find((v) => v.id === variantId)
        : undefined
      const basePrice = selectedVariant ? selectedVariant.basePrice : product.basePrice
      
      const data = await createValuation({
        category: (category || product.category) as 'cameras' | 'phones' | 'laptops',
        brand: brand || product.brand,
        model: model || product.modelName,
        productId: product.id,
        basePrice: basePrice,
        estimatedValue: calculatedPrice,
        answers,
        userId: user?.uid || undefined,
        ...(variantId && { variantId }),
        ...(selectedVariant && { variantLabel: selectedVariant.label }),
      })

      if (data.success && data.id) {
        setValuationId(data.id)
      } else {
        console.error('Failed to create valuation:', data)
        // Don't close modal - let user continue filling form
        // Valuation will be created when pickup is confirmed if needed
      }
    } catch (error: any) {
      console.error('Error creating valuation:', error)
      // Don't close modal - let user continue filling form
    }
  }

  const handleOrderConfirm = async (addressData: AddressData) => {
    if (!product) return
    const selectedVariant = product.variants && variantId
      ? product.variants.find((v) => v.id === variantId)
      : undefined
    const basePrice = selectedVariant ? selectedVariant.basePrice : product.basePrice
    const deductions = calculatedPrice - basePrice
    const productParams = `productId=${encodeURIComponent(product.id)}&brand=${encodeURIComponent(product.brand)}&model=${encodeURIComponent(product.modelName)}&category=${encodeURIComponent(product.category)}${variantId ? `&variantId=${encodeURIComponent(variantId)}` : ''}${selectedVariant ? `&variantLabel=${encodeURIComponent(selectedVariant.label)}` : ''}`
    const orderId = addressData.orderId || valuationId
    if (orderId) {
      router.push(`/order-summary?id=${orderId}&price=${calculatedPrice}&basePrice=${basePrice}&deductions=${deductions}&${productParams}`)
    } else {
      router.push(`/order-summary?price=${calculatedPrice}&basePrice=${basePrice}&deductions=${deductions}&${productParams}`)
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

  const selectedVariant = product.variants && variantId
    ? product.variants.find((v) => v.id === variantId)
    : undefined
  const basePrice = selectedVariant ? selectedVariant.basePrice : product.basePrice

  // Fixed lens camera detection
  const FIXED_LENS_KEYWORDS = [
    'powershot', 'cyber-shot', 'coolpix', 'finepix',
    'lumix', 'ixus', 'elph', 'point and shoot'
  ]

  const isFixedLensCamera = (brand: string, model: string): boolean => {
    const modelLower = model.toLowerCase()
    return FIXED_LENS_KEYWORDS.some(keyword => modelLower.includes(keyword))
  }

  // Samsung Ultra/Note models have S Pen – show S Pen questions only for these
  const isSamsungSPenModel = (modelName: string): boolean => {
    const m = (modelName || '').toLowerCase()
    return m.includes('note') || m.includes('ultra')
  }

  // Get category-specific steps (branch phones by brand: Apple → iPhone flow, Samsung → Samsung flow)
  // Get icon for section type
  const getSectionIcon = (stepId: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'basic-functionality': <Power className="w-4 h-4" />,
      'condition': <Smartphone className="w-4 h-4" />,
      'device-condition': <Smartphone className="w-4 h-4" />,
      'functional-issues': <Wrench className="w-4 h-4" />,
      'accessories': <Package className="w-4 h-4" />,
      'age': <Calendar className="w-4 h-4" />,
    }
    
    // Category-specific icons
    if (product) {
      const cat = (category?.toLowerCase() || product.category?.toLowerCase() || '').trim()
      if (cat === 'cameras' || cat === 'camera' || cat === 'dslr') {
        iconMap['condition'] = <Camera className="w-4 h-4" />
        iconMap['device-condition'] = <Camera className="w-4 h-4" />
      } else if (cat === 'laptops' || cat === 'laptop') {
        iconMap['condition'] = <Laptop className="w-4 h-4" />
        iconMap['device-condition'] = <Laptop className="w-4 h-4" />
      }
    }
    
    return iconMap[stepId] || <Power className="w-4 h-4" />
  }

  const getSteps = (): Step[] => {
    // Prioritize URL category parameter over product category
    const urlCategory = category?.toLowerCase()?.trim()
    const productCategory = product?.category?.toLowerCase()?.trim()
    const cat = urlCategory || productCategory || 'cameras'
    const brandNorm = (brand || product?.brand || '').toLowerCase().trim()

    // Handle variations in category names - check for phone/iphone first
    if (cat.includes('phone') || cat.includes('iphone')) {
      if (brandNorm.includes('samsung')) return getSamsungPhoneSteps()
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

  const getCameraSteps = (): Step[] => {
    const steps: Step[] = [
      {
        id: 'basic-functionality',
        title: 'Basic Functionality',
        component: (
          <div className="space-y-6">
            <YesNoQuestion
              question="Does the camera power on?"
              helperText="Ensure the device turns on without being plugged into a charger."
              questionId="powerOn"
              value={answers.powerOn as string}
              onChange={(value) => handleAnswer('powerOn', value)}
              index={0}
            />
            <YesNoQuestion
              question="Does the camera function properly (photo/video)?"
              helperText="Test that the shutter fires and video records without glitches."
              questionId="cameraFunction"
              value={answers.cameraFunction as string}
              onChange={(value) => handleAnswer('cameraFunction', value)}
              index={1}
            />
            <YesNoQuestion
              question="Are all buttons working properly?"
              helperText="Press every dial and button to confirm they respond immediately."
              questionId="buttonsWorking"
              value={answers.buttonsWorking as string}
              onChange={(value) => handleAnswer('buttonsWorking', value)}
              index={2}
            />
            <YesNoQuestion
              question="Is the device free from water damage?"
              helperText="Check for fog inside the lens or red indicators in the battery slot."
              questionId="waterDamage"
              value={answers.waterDamage as string}
              onChange={(value) => handleAnswer('waterDamage', value)}
              index={3}
            />
            <YesNoQuestion
              question="Is the flash working properly?"
              helperText="Test the pop-up flash."
              questionId="flashWorking"
              value={answers.flashWorking as string}
              onChange={(value) => handleAnswer('flashWorking', value)}
              index={4}
            />
            <YesNoQuestion
              question="Is the memory card slot working properly?"
              helperText="Insert a card and confirm the camera can save an image."
              questionId="memoryCardSlotWorking"
              value={answers.memoryCardSlotWorking as string}
              onChange={(value) => handleAnswer('memoryCardSlotWorking', value)}
              index={5}
            />
            <YesNoQuestion
              question="Is the speaker working properly?"
              helperText="Record a short video and play it back to test sound."
              questionId="speakerWorking"
              value={answers.speakerWorking as string}
              onChange={(value) => handleAnswer('speakerWorking', value)}
              index={6}
            />
          </div>
        ),
        required: true,
      },
    ]

    // Add lens selection step if user answered yes to additional lens question
    if (answers.hasAdditionalLens === 'yes' && !isFixedLensCamera(brand, model)) {
      steps.push({
        id: 'additional-lens-selection',
        title: 'Additional Lens',
        component: (
          <LensSelection
            brand={brand}
            value={answers.additionalLenses as string[]}
            onChange={(value) => handleAnswer('additionalLenses', value)}
          />
        ),
      })
    }

    // Add remaining steps
    steps.push(
      {
        id: 'body-conditions',
        title: 'Body Conditions',
        component: (
          <BodyConditionsGrid
            answers={answers}
            onChange={handleAnswer}
          />
        ),
        required: true,
      },
      {
        id: 'lens-condition',
        title: 'Lens Condition',
        component: (
          <LensConditionGrid
            answers={answers}
            onChange={handleAnswer}
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
      }
    )

    return steps
  }

  const getPhoneSteps = (): Step[] => [
    {
      id: 'basic-functionality',
      title: 'Basic Functionality',
      component: (
        <div className="space-y-6">
          <YesNoQuestion
            question="Does the phone Power on?"
            helperText="Verify the device power on without being plugged in to the charger"
            questionId="powerOn"
            value={answers.powerOn as string}
            onChange={(value) => handleAnswer('powerOn', value)}
            index={0}
          />
          <YesNoQuestion
            question="Does the phone function properly?"
            helperText="Ensure the device is fully responsive without lag"
            questionId="cameraWorking"
            value={answers.cameraWorking as string}
            onChange={(value) => handleAnswer('cameraWorking', value)}
            index={1}
          />
          <YesNoQuestion
            question="Face ID working properly?"
            helperText='Go to Settings to ensure Face ID can successfully scan a face without "Hardware Issue" alerts'
            questionId="biometricWorking"
            value={answers.biometricWorking as string}
            onChange={(value) => handleAnswer('biometricWorking', value)}
            index={2}
          />
          <YesNoQuestion
            question="Is True Tone available in the Control Center?"
            helperText="Long-press the brightness slider, check the true tone is there"
            questionId="trueTone"
            value={answers.trueTone as string}
            onChange={(value) => handleAnswer('trueTone', value)}
            index={3}
          />
          <TextQuestion
            question="IMEI number"
            helperText="Dial *#06# on your phone to get the IMEI"
            questionId="imeiNumber"
            value={(answers.imeiNumber as string) ?? ''}
            onChange={(value) => handleAnswer('imeiNumber', value)}
            placeholder="Enter 15-digit IMEI"
            validation="imei"
          />
          <TextQuestion
            question="Serial Number"
            helperText="Found in Settings > General > About"
            questionId="serialNumber"
            value={(answers.serialNumber as string) ?? ''}
            onChange={(value) => handleAnswer('serialNumber', value)}
            placeholder="Enter serial number"
            validation="serial"
            maxLength={30}
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

  const getSamsungPhoneSteps = (): Step[] => [
    {
      id: 'basic-functionality',
      title: 'Basic Functionality',
      component: (
        <div className="space-y-6">
          <YesNoQuestion
            question="Does the phone Power on?"
            helperText="Verify the device power on without being plugged in to the charger"
            questionId="powerOn"
            value={answers.powerOn as string}
            onChange={(value) => handleAnswer('powerOn', value)}
          />
          <YesNoQuestion
            question="Does the phone Function properly?"
            helperText="Ensure the device is fully responsive without lag"
            questionId="cameraWorking"
            value={answers.cameraWorking as string}
            onChange={(value) => handleAnswer('cameraWorking', value)}
          />
          <div>
            <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">Biometrics</h3>
            <div className="space-y-4">
              <YesNoQuestion
                question="Fingerprint working properly (In-display sensor)"
                questionId="fingerprintWorking"
                value={answers.fingerprintWorking as string}
                onChange={(value) => handleAnswer('fingerprintWorking', value)}
              />
              <YesNoQuestion
                question="Face Recognition working"
                questionId="faceRecognitionWorking"
                value={answers.faceRecognitionWorking as string}
                onChange={(value) => handleAnswer('faceRecognitionWorking', value)}
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">Display Features</h3>
            <div className="space-y-4">
              <YesNoQuestion
                question="120Hz / High Refresh Rate available and smooth"
                questionId="display120Hz"
                value={answers.display120Hz as string}
                onChange={(value) => handleAnswer('display120Hz', value)}
              />
              <YesNoQuestion
                question="Eye Comfort Shield (Blue light filter) working"
                questionId="eyeComfortShield"
                value={answers.eyeComfortShield as string}
                onChange={(value) => handleAnswer('eyeComfortShield', value)}
              />
            </div>
          </div>
          <TextQuestion
            question="IMEI number"
            helperText="Dial *#06# on your phone to get the IMEI"
            questionId="imeiNumber"
            value={(answers.imeiNumber as string) ?? ''}
            onChange={(value) => handleAnswer('imeiNumber', value)}
            placeholder="Enter 15-digit IMEI"
            validation="imei"
          />
          <TextQuestion
            question="Serial Number"
            helperText="Found in Settings > About phone > Status"
            questionId="serialNumber"
            value={(answers.serialNumber as string) ?? ''}
            onChange={(value) => handleAnswer('serialNumber', value)}
            placeholder="Enter serial number"
            validation="serial"
            maxLength={30}
          />
        </div>
      ),
      required: true,
    },
    {
      id: 'condition',
      title: 'Device Condition',
      component: (
        <SamsungDeviceConditionStep
          answers={answers}
          onChange={handleAnswer}
          showSPen={isSamsungSPenModel(model)}
        />
      ),
      required: true,
    },
    {
      id: 'functional-issues',
      title: 'Functional Issues',
      component: (
        <PhoneIssueGrid
          value={answers.functionalIssues as string[]}
          onChange={(value) => handleAnswer('functionalIssues', value)}
          variant="samsung"
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
          variant="samsung"
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
    const cat = (category?.toLowerCase() || product.category?.toLowerCase() || '').trim()
    const isPhone = cat === 'phones' || cat === 'phone' || cat === 'iphone' || cat.includes('phone')
    
    if (step.required) {
      // Check if required questions are answered
      if (step.id === 'basic-functionality') {
        // Handle variations in category names
        if (cat === 'cameras' || cat === 'camera') {
          const basicAnswers =
            answers.powerOn &&
            answers.cameraFunction &&
            answers.buttonsWorking &&
            answers.waterDamage &&
            answers.flashWorking &&
            answers.memoryCardSlotWorking &&
            answers.speakerWorking
          return basicAnswers
        } else if (isPhone) {
          const brandNorm = (brand || product?.brand || '').toLowerCase().trim()
          if (brandNorm.includes('samsung')) {
            const imeiValid = !validateImei((answers.imeiNumber as string) || '')
            const serialValid = !validateSerial((answers.serialNumber as string) || '')
            return (
              answers.powerOn &&
              answers.cameraWorking &&
              answers.fingerprintWorking &&
              answers.faceRecognitionWorking &&
              answers.display120Hz &&
              answers.eyeComfortShield &&
              imeiValid &&
              serialValid
            )
          }
          const imeiValid = !validateImei((answers.imeiNumber as string) || '')
          const serialValid = !validateSerial((answers.serialNumber as string) || '')
          return answers.powerOn && answers.cameraWorking && answers.biometricWorking && answers.trueTone && imeiValid && serialValid
        } else if (cat === 'tablets' || cat === 'tablet' || cat.includes('tablet')) {
          return answers.powerOn && answers.bodyDamage && answers.lcdWorking && answers.batteryWorking && answers.cameraWorking
        } else if (cat === 'laptops' || cat === 'laptop' || cat.includes('laptop')) {
          return answers.powerOn && answers.screenCondition && answers.keyboardWorking && answers.bodyDamage && answers.batteryCycleCount && answers.portsWorking && answers.chargingWorking
        }
      }
      // Check if body conditions step is complete (for cameras)
      if (step.id === 'body-conditions') {
        if (cat === 'cameras' || cat === 'camera') {
          return answers.bodyPhysicalCondition !== undefined &&
            answers.lcdDisplayCondition !== undefined &&
            answers.rubberGripsCondition !== undefined &&
            answers.sensorViewfinderCondition !== undefined &&
            answers.errorCodesCondition !== undefined
        }
      }
      // Check if Samsung device condition step is complete
      if (step.id === 'condition') {
        const brandNorm = (brand || product?.brand || '').toLowerCase().trim()
        if (isPhone && brandNorm.includes('samsung')) {
          const conditionBase =
            answers.displayCondition &&
            answers.batteryHealthSamsung &&
            answers.cameraCondition
          if (!conditionBase) return false
          if (isSamsungSPenModel(model)) {
            return (
              answers.sPenTipGood &&
              answers.sPenWriting &&
              answers.sPenAirActions &&
              answers.sPenCharging
            )
          }
          return true
        }
      }
    }
    
    // Phone-specific step validations (require selection before proceeding)
    if (isPhone) {
      // Device Condition step - require displayCondition, batteryHealthRange, and cameraCondition
      if (step.id === 'condition') {
        const brandNorm = (brand || product?.brand || '').toLowerCase().trim()
        // Skip validation for Samsung phones (handled above)
        if (!brandNorm.includes('samsung')) {
          return (
            answers.displayCondition &&
            answers.batteryHealthRange &&
            answers.cameraCondition
          )
        }
      }
      
      // Functional Issues step - require at least one selection (including "noIssues")
      if (step.id === 'functional-issues') {
        const functionalIssues = answers.functionalIssues as string[] | undefined
        return functionalIssues && functionalIssues.length > 0
      }
      
      // Accessories step - require explicit interaction (either selection or "No accessories" click)
      if (step.id === 'accessories') {
        // Check if accessories key exists in answers object (means user has interacted)
        return 'accessories' in answers
      }
      
      // Device Age step - require explicit selection
      if (step.id === 'age') {
        const ageValue = answers.age as string | undefined
        const validAgeOptions = ['lessThan3Months', 'fourToTwelveMonths', 'aboveTwelveMonths']
        return ageValue !== undefined && ageValue !== null && ageValue !== '' && validAgeOptions.includes(ageValue)
      }
    }
    
    // Camera-specific validations
    if (cat === 'cameras' || cat === 'camera') {
      // Accessories step - require explicit interaction (either selection or "No accessories" click)
      if (step.id === 'accessories') {
        return 'accessories' in answers
      }
      
      // Age step - require explicit selection
      if (step.id === 'age') {
        const ageValue = answers.age as string | undefined
        const validAgeOptions = ['lessThan3Months', 'fourToTwelveMonths', 'aboveTwelveMonths']
        return ageValue !== undefined && ageValue !== null && ageValue !== '' && validAgeOptions.includes(ageValue)
      }
      
      // Lens condition step - require at least one selection
      if (step.id === 'lens-condition') {
        return answers.lensCondition !== undefined && answers.lensCondition !== null && answers.lensCondition !== ''
      }
    }
    
    // Laptop-specific validations
    if (cat === 'laptops' || cat === 'laptop') {
      // Condition step - require at least one condition field
      if (step.id === 'condition') {
        return answers.screenCondition !== undefined || answers.bodyCondition !== undefined || answers.keyboardCondition !== undefined
      }
      
      // Functional Issues step - require at least one selection (including "noIssues")
      if (step.id === 'functional-issues') {
        const functionalIssues = answers.functionalIssues as string[] | undefined
        return functionalIssues && functionalIssues.length > 0
      }
      
      // Accessories step - require explicit interaction (either selection or "No accessories" click)
      if (step.id === 'accessories') {
        return 'accessories' in answers
      }
      
      // Age step - require explicit selection
      if (step.id === 'age') {
        const ageValue = answers.age as string | undefined
        const validAgeOptions = ['lessThan3Months', 'fourToTwelveMonths', 'aboveTwelveMonths']
        return ageValue !== undefined && ageValue !== null && ageValue !== '' && validAgeOptions.includes(ageValue)
      }
    }
    
    // Tablet-specific validations
    if (cat === 'tablets' || cat === 'tablet') {
      // Condition step - require at least one condition field
      if (step.id === 'condition') {
        return answers.displayCondition !== undefined || answers.bodyCondition !== undefined
      }
      
      // Functional Issues step - require at least one selection (including "noIssues")
      if (step.id === 'functional-issues') {
        const functionalIssues = answers.functionalIssues as string[] | undefined
        return functionalIssues && functionalIssues.length > 0
      }
      
      // Accessories step - require explicit interaction (either selection or "No accessories" click)
      if (step.id === 'accessories') {
        return 'accessories' in answers
      }
      
      // Age step - require explicit selection
      if (step.id === 'age') {
        const ageValue = answers.age as string | undefined
        const validAgeOptions = ['lessThan3Months', 'fourToTwelveMonths', 'aboveTwelveMonths']
        return ageValue !== undefined && ageValue !== null && ageValue !== '' && validAgeOptions.includes(ageValue)
      }
    }
    
    // General validations for all categories
    // Accessories step - require explicit interaction for any category not handled above
    if (step.id === 'accessories') {
      return 'accessories' in answers
    }
    
    // Age step - require explicit selection for any category not handled above
    if (step.id === 'age') {
      const ageValue = answers.age as string | undefined
      const validAgeOptions = ['lessThan3Months', 'fourToTwelveMonths', 'aboveTwelveMonths']
      return ageValue !== undefined && ageValue !== null && ageValue !== '' && validAgeOptions.includes(ageValue)
    }
    
    // Functional Issues step - require at least one selection for any category not handled above
    if (step.id === 'functional-issues') {
      const functionalIssues = answers.functionalIssues as string[] | undefined
      return functionalIssues && functionalIssues.length > 0
    }
    
    // For lens selection step, at least one lens should be selected if user answered yes
    if (step.id === 'additional-lens-selection') {
      const additionalLenses = answers.additionalLenses as string[] | undefined
      return additionalLenses && additionalLenses.length > 0
    }
    
    // General validation: If step has any question that requires an answer, check if it's answered
    // This catches any other question types that might not be explicitly handled above
    // For Yes/No questions, they're already handled by step.required
    // For grid-based questions (condition, issues, accessories), they're handled above
    // For single-select questions, check if the answer exists
    
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pt-20 md:pt-24 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute top-20 right-10 w-96 h-96 bg-brand-blue-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-80 h-80 bg-brand-lime/10 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        {/* Floating dots */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-brand-blue-300/20 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Progress Bar - At the Top */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
            <ProgressBar
              currentStep={currentStep}
              totalSteps={steps.length}
              steps={steps.map(s => ({ id: s.id, title: s.title }))}
            />
          </div>
        </motion.div>

        {/* Questions Section - Full Width */}
        <div className="w-full max-w-4xl mx-auto">

            {/* Main Content Card with Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-10 lg:p-12 mb-6 relative overflow-hidden"
            >
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-transparent pointer-events-none" />
              
              {/* Section Badge */}
              <div className="relative z-10 mb-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-blue-100 to-brand-lime-100 rounded-full border border-brand-blue-200 shadow-sm"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-brand-blue-700"
                  >
                    {getSectionIcon(steps[currentStep].id)}
                  </motion.div>
                  <div className="w-2 h-2 bg-brand-lime rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-brand-blue-900 uppercase tracking-wider">
                    {steps[currentStep].title}
                  </span>
                </motion.div>
              </div>

              {/* Question Content */}
              <div className="relative z-10">

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.95 }}
                transition={{ 
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1] // Custom easing for smoother motion
                }}
                className="relative"
              >
                {/* Page transition overlay effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-brand-blue-600/0 via-brand-lime/0 to-brand-blue-600/0 pointer-events-none"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                />
                {steps[currentStep].component}
              </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

            {/* Enhanced Navigation - Hide when price is shown */}
            {!showOrderConfirmation && !showPrice && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-between gap-4 mt-6"
              >
                <motion.button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  whileHover={currentStep > 0 ? { scale: 1.02, x: -2 } : {}}
                  whileTap={currentStep > 0 ? { scale: 0.98 } : {}}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 border-2 ${
                    currentStep === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : 'bg-white border-gray-300 text-brand-blue-900 hover:border-brand-lime hover:bg-gradient-to-r hover:from-brand-blue-50 hover:to-brand-lime/10 hover:shadow-md'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </motion.button>

                {currentStep < steps.length - 1 ? (
                  <motion.button
                    onClick={() => handleNext(steps.length)}
                    disabled={!canProceed()}
                    whileHover={canProceed() ? { scale: 1.02, x: 2 } : {}}
                    whileTap={canProceed() ? { scale: 0.98 } : {}}
                    className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${
                      !canProceed()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-brand-lime to-brand-lime-400 text-brand-blue-900 hover:from-brand-lime-400 hover:to-brand-lime-500 hover:shadow-xl'
                    }`}
                  >
                    Next
                    <motion.div
                      animate={canProceed() ? { x: [0, 4, 0] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleFinish}
                    disabled={!canProceed()}
                    whileHover={canProceed() ? { scale: 1.05, boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)' } : {}}
                    whileTap={canProceed() ? { scale: 0.95 } : {}}
                    className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-xl ${
                      !canProceed()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-brand-blue-600 via-brand-blue-500 to-brand-lime text-white hover:shadow-2xl relative overflow-hidden'
                    }`}
                  >
                    {/* Animated gradient overlay */}
                    {canProceed() && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Finish Assessment
                    </span>
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>

        {/* Price Display - Show after OTP verification or Finish */}
        {showPrice && !showOrderConfirmation && product && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue-700 via-brand-blue-600 to-brand-lime-600 p-8 md:p-10 text-white shadow-2xl max-w-3xl mx-auto"
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                  Your Estimated Trade-In Value
                </div>
                <p className="text-white/80 text-sm md:text-base mb-2">
                  Based on your device condition assessment
                </p>
                <div className="text-5xl md:text-6xl lg:text-7xl font-bold mb-2 tracking-tight">
                  ₹{calculatedPrice.toLocaleString('en-IN')}
                </div>
                <p className="text-white/60 text-xs mt-2">
                  Amount subject to revision upon direct assessment.
                </p>
              </div>
              
              <motion.button
                onClick={handleConfirmOrder}
                className="w-full px-8 py-4 bg-white text-brand-blue-900 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle className="w-6 h-6" />
                Confirm Order
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Order Confirmation Modal - Show when "Confirm Order" is clicked */}
        {showOrderConfirmation && product && (
          <OrderConfirmation
            isOpen={showOrderConfirmation}
            price={calculatedPrice}
            productName={product.modelName}
            phoneNumber={phoneNumber}
            valuationId={valuationId || undefined}
            category={category || product.category}
            brand={brand || product.brand}
            assessmentAnswers={answers}
            onConfirm={handleOrderConfirm}
            onClose={() => setShowOrderConfirmation(false)}
          />
        )}

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
