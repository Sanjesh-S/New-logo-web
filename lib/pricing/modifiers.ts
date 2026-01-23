import { PricingRules, DEFAULT_PRICING_RULES } from '@/lib/types/pricing'

export type AnswerMap = Record<string, string | string[]> & {
  hasAdditionalLens?: string // yes/no
  additionalLenses?: string[] // array of lens model names or IDs
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
  rules: PricingRules = DEFAULT_PRICING_RULES
): number {
  let totalModifier = 0

  // Basic Functionality Questions (Yes/No)
  if (answers.powerOn) {
    totalModifier += rules.questions.powerOn[answers.powerOn as 'yes' | 'no'] || 0
  }
  if (answers.bodyDamage) {
    totalModifier += rules.questions.bodyDamage[answers.bodyDamage as 'yes' | 'no'] || 0
  }
  if (answers.lcdWorking) {
    totalModifier += rules.questions.lcdWorking[answers.lcdWorking as 'yes' | 'no'] || 0
  }
  if (answers.lensScratches) {
    totalModifier += rules.questions.lensScratches[answers.lensScratches as 'yes' | 'no'] || 0
  }
  if (answers.autofocusWorking) {
    totalModifier += rules.questions.autofocusWorking[answers.autofocusWorking as 'yes' | 'no'] || 0
  }
  // Check both hasAdditionalLens (new) and additionalLens (legacy) for backward compatibility
  const additionalLensAnswer = answers.hasAdditionalLens || answers.additionalLens
  if (additionalLensAnswer) {
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



