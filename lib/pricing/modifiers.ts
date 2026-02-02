import { PricingRules, ZERO_PRICING_RULES } from '@/lib/types/pricing'

export type AnswerMap = Record<string, string | string[]> & {
  hasAdditionalLens?: string // yes/no
  additionalLenses?: string[] // array of lens model names or IDs
  hasLensToSell?: string // yes/no
  fungusDustCondition?: string | string[] // single or multiple selections
  focusFunctionality?: string | string[] // single or multiple selections
  rubberRingCondition?: string | string[] // single or multiple selections
  lensErrorStatus?: string | string[] // single or multiple selections
}

/**
 * Calculate final price based on internal base price and user answers
 * @param internalBasePrice - The internal base price (not display price)
 * @param answers - Object mapping question IDs to answer IDs or arrays of answer IDs
 * @param rules - Optional pricing rules. Defaults to hardcoded values if not provided.
 * @returns Final calculated price (never below 0)
 */
export function calculatePrice(
  internalBasePrice: number,
  answers: AnswerMap,
  rules: PricingRules = ZERO_PRICING_RULES
): number {
  let totalModifier = 0

  // All pricing values come from Firebase (Admin Pricing Calculator: per-product or global)
  // ZERO_PRICING_RULES used only when no rules passed (e.g. default param)
  if (answers.powerOn && rules.questions.powerOn) {
    totalModifier += rules.questions.powerOn[answers.powerOn as 'yes' | 'no'] || 0
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
  
  // Legacy fields for backward compatibility (phones, laptops, tablets)
  if (answers.bodyDamage && rules.questions.bodyDamage) {
    totalModifier += rules.questions.bodyDamage[answers.bodyDamage as 'yes' | 'no'] || 0
  }
  if (answers.lcdWorking && rules.questions.lcdWorking) {
    totalModifier += rules.questions.lcdWorking[answers.lcdWorking as 'yes' | 'no'] || 0
  }
  if (answers.batteryHealth && rules.questions.batteryHealth) {
    totalModifier += rules.questions.batteryHealth[answers.batteryHealth as 'yes' | 'no'] || 0
  }
  if (answers.biometricWorking && rules.questions.biometricWorking) {
    totalModifier += rules.questions.biometricWorking[answers.biometricWorking as 'yes' | 'no'] || 0
  }
  if (answers.cameraWorking && rules.questions.cameraWorking) {
    totalModifier += rules.questions.cameraWorking[answers.cameraWorking as 'yes' | 'no'] || 0
  }
  if (answers.trueTone && rules.questions.trueTone) {
    totalModifier += rules.questions.trueTone[answers.trueTone as 'yes' | 'no'] || 0
  }
  // Samsung phone-specific questions
  if (answers.fingerprintWorking && rules.questions.fingerprintWorking) {
    totalModifier += rules.questions.fingerprintWorking[answers.fingerprintWorking as 'yes' | 'no'] || 0
  }
  if (answers.faceRecognitionWorking && rules.questions.faceRecognitionWorking) {
    totalModifier += rules.questions.faceRecognitionWorking[answers.faceRecognitionWorking as 'yes' | 'no'] || 0
  }
  if (answers.display120Hz && rules.questions.display120Hz) {
    totalModifier += rules.questions.display120Hz[answers.display120Hz as 'yes' | 'no'] || 0
  }
  if (answers.eyeComfortShield && rules.questions.eyeComfortShield) {
    totalModifier += rules.questions.eyeComfortShield[answers.eyeComfortShield as 'yes' | 'no'] || 0
  }
  if (answers.sPenTipGood && rules.questions.sPenTipGood) {
    totalModifier += rules.questions.sPenTipGood[answers.sPenTipGood as 'yes' | 'no'] || 0
  }
  if (answers.sPenWriting && rules.questions.sPenWriting) {
    totalModifier += rules.questions.sPenWriting[answers.sPenWriting as 'yes' | 'no'] || 0
  }
  if (answers.sPenAirActions && rules.questions.sPenAirActions) {
    totalModifier += rules.questions.sPenAirActions[answers.sPenAirActions as 'yes' | 'no'] || 0
  }
  if (answers.sPenCharging && rules.questions.sPenCharging) {
    totalModifier += rules.questions.sPenCharging[answers.sPenCharging as 'yes' | 'no'] || 0
  }
  if (answers.lensScratches && rules.questions.lensScratches) {
    totalModifier += rules.questions.lensScratches[answers.lensScratches as 'yes' | 'no'] || 0
  }
  if (answers.autofocusWorking && rules.questions.autofocusWorking) {
    totalModifier += rules.questions.autofocusWorking[answers.autofocusWorking as 'yes' | 'no'] || 0
  }
  // Check both hasAdditionalLens (new) and additionalLens (legacy) for backward compatibility
  const additionalLensAnswer = answers.hasAdditionalLens || answers.additionalLens
  if (additionalLensAnswer && rules.questions.additionalLens) {
    totalModifier += rules.questions.additionalLens[additionalLensAnswer as 'yes' | 'no'] || 0
  }

  // Lens Condition (Single selection)
  if (answers.lensCondition) {
    const condition = answers.lensCondition as string
    totalModifier += rules.lensCondition[condition as keyof typeof rules.lensCondition] || 0
  }

  // Physical Condition (Multiple selections - additive)
  if (Array.isArray(answers.displayCondition)) {
    answers.displayCondition.forEach((condition) => {
      totalModifier += rules.displayCondition[condition as keyof typeof rules.displayCondition] || 0
    })
  } else if (answers.displayCondition) {
    totalModifier += rules.displayCondition[answers.displayCondition as keyof typeof rules.displayCondition] || 0
  }

  if (Array.isArray(answers.bodyCondition)) {
    answers.bodyCondition.forEach((condition) => {
      totalModifier += rules.bodyCondition[condition as keyof typeof rules.bodyCondition] || 0
    })
  } else if (answers.bodyCondition) {
    totalModifier += rules.bodyCondition[answers.bodyCondition as keyof typeof rules.bodyCondition] || 0
  }

  if (answers.errorCondition) {
    totalModifier += rules.errorCondition[answers.errorCondition as keyof typeof rules.errorCondition] || 0
  }

  // Phone condition ranges
  if (answers.batteryHealthRange && rules.batteryHealthRange) {
    totalModifier += rules.batteryHealthRange[answers.batteryHealthRange as keyof typeof rules.batteryHealthRange] || 0
  }
  // Samsung battery health (Normal/Good vs Action Required)
  if (answers.batteryHealthSamsung && rules.batteryHealthSamsung) {
    totalModifier += rules.batteryHealthSamsung[answers.batteryHealthSamsung as keyof typeof rules.batteryHealthSamsung] || 0
  }
  if (answers.cameraCondition && rules.cameraCondition) {
    totalModifier += rules.cameraCondition[answers.cameraCondition as keyof typeof rules.cameraCondition] || 0
  }

  // New Body Conditions (Camera-specific)
  if (answers.bodyPhysicalCondition && rules.bodyPhysicalCondition) {
    totalModifier += rules.bodyPhysicalCondition[answers.bodyPhysicalCondition as keyof typeof rules.bodyPhysicalCondition] || 0
  }
  if (answers.lcdDisplayCondition && rules.lcdDisplayCondition) {
    totalModifier += rules.lcdDisplayCondition[answers.lcdDisplayCondition as keyof typeof rules.lcdDisplayCondition] || 0
  }
  if (answers.rubberGripsCondition && rules.rubberGripsCondition) {
    totalModifier += rules.rubberGripsCondition[answers.rubberGripsCondition as keyof typeof rules.rubberGripsCondition] || 0
  }
  if (answers.sensorViewfinderCondition && rules.sensorViewfinderCondition) {
    totalModifier += rules.sensorViewfinderCondition[answers.sensorViewfinderCondition as keyof typeof rules.sensorViewfinderCondition] || 0
  }
  if (answers.errorCodesCondition && rules.errorCodesCondition) {
    totalModifier += rules.errorCodesCondition[answers.errorCodesCondition as keyof typeof rules.errorCodesCondition] || 0
  }

  // Lens Condition Questions (Camera-specific)
  // Has Lens to Sell (Yes/No)
  if (answers.hasLensToSell && rules.questions.hasLensToSell) {
    totalModifier += rules.questions.hasLensToSell[answers.hasLensToSell as 'yes' | 'no'] || 0
  }

  // Fungus/Dust Condition (Multiple selection - additive)
  if (answers.fungusDustCondition && rules.fungusDustCondition) {
    const conditions = Array.isArray(answers.fungusDustCondition) ? answers.fungusDustCondition : [answers.fungusDustCondition]
    conditions.forEach((condition) => {
      totalModifier += rules.fungusDustCondition[condition as keyof typeof rules.fungusDustCondition] || 0
    })
  }

  // Focus Functionality (Multiple selection - additive)
  if (answers.focusFunctionality && rules.focusFunctionality) {
    const functionalities = Array.isArray(answers.focusFunctionality) ? answers.focusFunctionality : [answers.focusFunctionality]
    functionalities.forEach((functionality) => {
      totalModifier += rules.focusFunctionality[functionality as keyof typeof rules.focusFunctionality] || 0
    })
  }

  // Rubber Ring Condition (Multiple selection - additive)
  if (answers.rubberRingCondition && rules.rubberRingCondition) {
    const conditions = Array.isArray(answers.rubberRingCondition) ? answers.rubberRingCondition : [answers.rubberRingCondition]
    conditions.forEach((condition) => {
      totalModifier += rules.rubberRingCondition[condition as keyof typeof rules.rubberRingCondition] || 0
    })
  }

  // Lens Error Status (Multiple selection - additive)
  if (answers.lensErrorStatus && rules.lensErrorStatus) {
    const errors = Array.isArray(answers.lensErrorStatus) ? answers.lensErrorStatus : [answers.lensErrorStatus]
    errors.forEach((error) => {
      totalModifier += rules.lensErrorStatus[error as keyof typeof rules.lensErrorStatus] || 0
    })
  }

  // Functional Issues (Multiple selection - but "No Issues" overrides)
  if (answers.functionalIssues) {
    const issues = Array.isArray(answers.functionalIssues) ? answers.functionalIssues : [answers.functionalIssues]

    // If "noIssues" is selected, ignore all other issues
    if (issues.includes('noIssues')) {
      totalModifier += rules.functionalIssues.noIssues
    } else {
      issues.forEach((issue) => {
        totalModifier += rules.functionalIssues[issue as keyof typeof rules.functionalIssues] || 0
      })
    }
  }

  // Accessories (Multiple selection - additive bonuses)
  if (answers.accessories) {
    const accessoryList = Array.isArray(answers.accessories) ? answers.accessories : [answers.accessories]
    accessoryList.forEach((accessory) => {
      totalModifier += rules.accessories[accessory as keyof typeof rules.accessories] || 0
    })
  }

  // Device Age (Single selection)
  if (answers.age) {
    totalModifier += rules.age[answers.age as keyof typeof rules.age] || 0
  }

  const finalPrice = internalBasePrice + totalModifier
  return Math.max(0, finalPrice) // Ensure price never goes below 0
}



