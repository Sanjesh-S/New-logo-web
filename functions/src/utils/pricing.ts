/**
 * Pricing calculation utilities for Firebase Functions
 * Mirrors lib/pricing/modifiers.ts but uses admin.firestore()
 */

// Types matching lib/types/pricing.ts
export interface YesNoPrice {
  yes: number
  no: number
}

export interface PricingRules {
  questions: {
    powerOn: YesNoPrice
    cameraFunction: YesNoPrice
    buttonsWorking: YesNoPrice
    waterDamage: YesNoPrice
    flashWorking: YesNoPrice
    memoryCardSlotWorking: YesNoPrice
    speakerWorking: YesNoPrice
    hasLensToSell?: YesNoPrice
    batteryHealth?: YesNoPrice
    biometricWorking?: YesNoPrice
    cameraWorking?: YesNoPrice
    trueTone?: YesNoPrice
    screenCondition?: YesNoPrice
    keyboardWorking?: YesNoPrice
    batteryCycleCount?: YesNoPrice
    portsWorking?: YesNoPrice
    chargingWorking?: YesNoPrice
    batteryWorking?: YesNoPrice
    fingerprintWorking?: YesNoPrice
    faceRecognitionWorking?: YesNoPrice
    display120Hz?: YesNoPrice
    eyeComfortShield?: YesNoPrice
    sPenTipGood?: YesNoPrice
    sPenWriting?: YesNoPrice
    sPenAirActions?: YesNoPrice
    sPenCharging?: YesNoPrice
    bodyDamage?: YesNoPrice
    lcdWorking?: YesNoPrice
    lensScratches?: YesNoPrice
    autofocusWorking?: YesNoPrice
    additionalLens?: YesNoPrice
  }
  lensCondition: {
    withoutLens: number
    good: number
    autofocusIssue: number
    fungus: number
    scratches: number
  }
  displayCondition: {
    excellent: number
    good: number
    fair: number
    cracked: number
    goodWorking?: number
    screenLine?: number
    minorCrack?: number
    majorDamage?: number
    notWorking?: number
  }
  batteryHealthSamsung?: {
    normalGood: number
    actionRequired: number
  }
  bodyCondition: {
    excellent: number
    good: number
    fair: number
    poor: number
  }
  errorCondition: {
    noErrors: number
    minorErrors: number
    frequentErrors: number
  }
  bodyPhysicalCondition: {
    likeNew: number
    average: number
    worn: number
  }
  lcdDisplayCondition: {
    good: number
    fair: number
    poor: number
  }
  rubberGripsCondition: {
    good: number
    fair: number
    poor: number
  }
  sensorViewfinderCondition: {
    clean: number
    minor: number
    major: number
  }
  errorCodesCondition: {
    none: number
    intermittent: number
    persistent: number
  }
  fungusDustCondition: {
    clean: number
    minorFungus: number
    majorFungus: number
  }
  focusFunctionality: {
    goodFocus: number
    afIssue: number
    mfIssue: number
  }
  rubberRingCondition: {
    goodRubber: number
    minorRubber: number
    majorRubber: number
  }
  lensErrorStatus: {
    noErrors: number
    occasionalErrors: number
    frequentErrors: number
  }
  functionalIssues: {
    microphoneIssue: number
    speakerIssue: number
    chargingPortIssue: number
    touchScreenIssue: number
    wifiIssue: number
    buttonIssue: number
    frameDamageIssue: number
    bodyDamageIssue: number
    waterDamageIssue: number
    networkIssue: number
    noIssues: number
  }
  accessories: {
    battery: number
    charger: number
    box: number
    cable: number
    manual: number
    case: number
    bill: number
    warrantyCard: number
    superFastCharger?: number
    sPen?: number
    screenProtector?: number
  }
  age: {
    lessThan3Months: number
    fourToTwelveMonths: number
    aboveTwelveMonths: number
  }
  batteryHealthRange?: {
    battery90Above: number
    battery80to90: number
    battery50to80: number
    batteryBelow50: number
  }
  cameraCondition?: {
    cameraGood: number
    frontCameraNotWorking: number
    backCameraNotWorking: number
    backCameraNotFocusing?: number
    bothCamerasNotWorking: number
  }
}

export type AnswerMap = Record<string, string | string[]>

/**
 * Create a complete PricingRules structure with all zeros.
 * This is used as a fallback when no pricing rules exist in Firebase.
 * All prices MUST be set in Firebase through the admin dashboard.
 */
function createZeroPricingRules(): PricingRules {
  // Create a minimal structure to ensure all required fields exist
  const structure: PricingRules = {
    questions: {
      powerOn: { yes: 0, no: 0 },
      cameraFunction: { yes: 0, no: 0 },
      buttonsWorking: { yes: 0, no: 0 },
      waterDamage: { yes: 0, no: 0 },
      flashWorking: { yes: 0, no: 0 },
      memoryCardSlotWorking: { yes: 0, no: 0 },
      speakerWorking: { yes: 0, no: 0 },
    },
    lensCondition: {
      withoutLens: 0,
      good: 0,
      autofocusIssue: 0,
      fungus: 0,
      scratches: 0,
    },
    displayCondition: {
      excellent: 0,
      good: 0,
      fair: 0,
      cracked: 0,
    },
    bodyCondition: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    },
    errorCondition: {
      noErrors: 0,
      minorErrors: 0,
      frequentErrors: 0,
    },
    bodyPhysicalCondition: {
      likeNew: 0,
      average: 0,
      worn: 0,
    },
    lcdDisplayCondition: {
      good: 0,
      fair: 0,
      poor: 0,
    },
    rubberGripsCondition: {
      good: 0,
      fair: 0,
      poor: 0,
    },
    sensorViewfinderCondition: {
      clean: 0,
      minor: 0,
      major: 0,
    },
    errorCodesCondition: {
      none: 0,
      intermittent: 0,
      persistent: 0,
    },
    fungusDustCondition: {
      clean: 0,
      minorFungus: 0,
      majorFungus: 0,
    },
    focusFunctionality: {
      goodFocus: 0,
      afIssue: 0,
      mfIssue: 0,
    },
    rubberRingCondition: {
      goodRubber: 0,
      minorRubber: 0,
      majorRubber: 0,
    },
    lensErrorStatus: {
      noErrors: 0,
      occasionalErrors: 0,
      frequentErrors: 0,
    },
    functionalIssues: {
      microphoneIssue: 0,
      speakerIssue: 0,
      chargingPortIssue: 0,
      touchScreenIssue: 0,
      wifiIssue: 0,
      buttonIssue: 0,
      frameDamageIssue: 0,
      bodyDamageIssue: 0,
      waterDamageIssue: 0,
      networkIssue: 0,
      noIssues: 0,
    },
    accessories: {
      battery: 0,
      charger: 0,
      box: 0,
      cable: 0,
      manual: 0,
      case: 0,
      bill: 0,
      warrantyCard: 0,
    },
    age: {
      lessThan3Months: 0,
      fourToTwelveMonths: 0,
      aboveTwelveMonths: 0,
    },
  }
  return structure
}

/**
 * ZERO_PRICING_RULES - All modifiers are 0.
 * Used when no pricing rules exist in Firebase.
 * All prices MUST be configured in Firebase through the admin dashboard.
 */
export const ZERO_PRICING_RULES: PricingRules = createZeroPricingRules()

/**
 * Calculate final price based on base price and user answers
 * Mirrors lib/pricing/modifiers.ts calculatePrice function
 * @param basePrice - The base price for the product/variant
 * @param answers - Object mapping question IDs to answer IDs or arrays of answer IDs
 * @param rules - Optional pricing rules. Defaults to ZERO_PRICING_RULES if not provided.
 * @param brand - Optional brand name (e.g., "iPhone", "Samsung") for brand-specific pricing logic
 * @param powerOnPercentage - Optional percentage for powerOn deduction (60-95). If set, overrides fixed amount and iPhone/Samsung 75% logic
 * @returns Final calculated price (never below 0)
 */
export function calculatePrice(
  basePrice: number,
  answers: AnswerMap,
  rules: PricingRules = ZERO_PRICING_RULES,
  brand?: string,
  powerOnPercentage?: number | null
): number {
  let totalModifier = 0
  const normalizedBrand = brand?.toLowerCase().trim() || ''

  // Handle powerOn deduction
  if (answers.powerOn === 'no') {
    // If powerOnPercentage is set, use percentage-based deduction
    if (powerOnPercentage !== undefined && powerOnPercentage !== null) {
      totalModifier -= basePrice * (powerOnPercentage / 100)
    } else {
      // iPhone (Apple) and Samsung specific logic: If powerOn is "no", subtract 75% of base price
      const isIPhoneOrSamsung = normalizedBrand === 'iphone' || normalizedBrand === 'apple' || normalizedBrand === 'samsung'
      
      if (isIPhoneOrSamsung) {
        // Subtract 75% of base price
        totalModifier -= basePrice * 0.75
      } else if (rules.questions.powerOn) {
        // For other brands, use the regular pricing rules
        totalModifier += rules.questions.powerOn.no || 0
      }
    }
  } else if (answers.powerOn === 'yes' && rules.questions.powerOn) {
    // If powerOn is "yes", use the regular pricing rules
    totalModifier += rules.questions.powerOn.yes || 0
  }
  if (answers.cameraFunction && rules.questions.cameraFunction) {
    totalModifier += (rules.questions.cameraFunction[answers.cameraFunction as 'yes' | 'no'] || 0)
  }
  if (answers.buttonsWorking && rules.questions.buttonsWorking) {
    totalModifier += (rules.questions.buttonsWorking[answers.buttonsWorking as 'yes' | 'no'] || 0)
  }
  if (answers.waterDamage && rules.questions.waterDamage) {
    totalModifier += (rules.questions.waterDamage[answers.waterDamage as 'yes' | 'no'] || 0)
  }
  if (answers.flashWorking && rules.questions.flashWorking) {
    totalModifier += (rules.questions.flashWorking[answers.flashWorking as 'yes' | 'no'] || 0)
  }
  if (answers.memoryCardSlotWorking && rules.questions.memoryCardSlotWorking) {
    totalModifier += (rules.questions.memoryCardSlotWorking[answers.memoryCardSlotWorking as 'yes' | 'no'] || 0)
  }
  if (answers.speakerWorking && rules.questions.speakerWorking) {
    totalModifier += (rules.questions.speakerWorking[answers.speakerWorking as 'yes' | 'no'] || 0)
  }

  // Body condition (single or multiple)
  if (Array.isArray(answers.bodyCondition)) {
    answers.bodyCondition.forEach((condition) => {
      totalModifier += rules.bodyCondition[condition as keyof typeof rules.bodyCondition] || 0
    })
  } else if (answers.bodyCondition) {
    totalModifier += rules.bodyCondition[answers.bodyCondition as keyof typeof rules.bodyCondition] || 0
  }

  // Age
  if (answers.age) {
    totalModifier += rules.age[answers.age as keyof typeof rules.age] || 0
  }

  // Accessories (multiple selection - additive bonuses)
  if (answers.accessories) {
    const accessoryList = Array.isArray(answers.accessories) ? answers.accessories : [answers.accessories]
    accessoryList.forEach((accessory) => {
      totalModifier += rules.accessories[accessory as keyof typeof rules.accessories] || 0
    })
  }

  const finalPrice = basePrice + totalModifier
  return Math.max(0, finalPrice) // Ensure price never goes below 0
}
