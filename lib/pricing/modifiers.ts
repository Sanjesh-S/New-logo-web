/**
 * Price modifiers for assessment questions
 * All values are in ₹ (Indian Rupees) - fixed amounts, not percentages
 */

export const PRICE_MODIFIERS = {
  // Basic Functionality Questions (Yes/No)
  powerOn: {
    yes: 0,
    no: -5000, // Fixed deduction if device doesn't power on
  },
  bodyDamage: {
    yes: -2000, // Fixed deduction for body damage
    no: 0,
  },
  lcdWorking: {
    yes: 0,
    no: -3000, // Fixed deduction if LCD not working
  },
  lensScratches: {
    yes: -1500, // Fixed deduction if lens has scratches/fungus
    no: 0,
  },
  autofocusWorking: {
    yes: 0,
    no: -2500, // Fixed deduction if autofocus/zoom not working
  },
  additionalLens: {
    yes: 1500, // Fixed bonus if additional lens included
    no: 0,
  },

  // Lens Condition (Single selection)
  lensCondition: {
    withoutLens: -2000, // Fixed deduction
    good: 0, // No change
    autofocusIssue: -3000, // Fixed deduction
    fungus: -5000, // Fixed deduction
    scratches: -2000, // Fixed deduction
  },

  // Physical Condition (Multiple selections per category - additive)
  displayCondition: {
    excellent: 0, // No change
    good: -1000, // Fixed deduction
    fair: -2500, // Fixed deduction
    cracked: -8000, // Fixed deduction
  },

  bodyCondition: {
    excellent: 0, // No change
    good: -1500, // Fixed deduction
    fair: -3000, // Fixed deduction
    poor: -6000, // Fixed deduction
  },

  errorCondition: {
    noErrors: 0, // No change
    minorErrors: -2000, // Fixed deduction
    frequentErrors: -5000, // Fixed deduction
  },

  // Functional Issues (Multiple selection - additive, but "No Issues" overrides)
  functionalIssues: {
    batteryIssue: -2000, // Fixed deduction
    flashlightIssue: -1000, // Fixed deduction
    memoryCardIssue: -1500, // Fixed deduction
    speakerIssue: -800, // Fixed deduction
    connectorIssue: -1200, // Fixed deduction
    buttonIssue: -1500, // Fixed deduction
    noIssues: 0, // If selected, ignore all other issues
  },

  // Accessories (Multiple selection - additive bonuses)
  accessories: {
    adapter: 500, // Fixed bonus
    battery: 800, // Fixed bonus
    box: 1000, // Fixed bonus
    bag: 600, // Fixed bonus
    cable: 400, // Fixed bonus
    tripod: 2000, // Fixed bonus
    manual: 300, // Fixed bonus
  },

  // Device Age (Single selection)
  age: {
    lessThan3Months: 0, // No change
    fourToTwelveMonths: -2000, // Fixed deduction
    aboveTwelveMonths: -4000, // Fixed deduction
  },
} as const

export type AnswerMap = Record<string, string | string[]>

/**
 * Calculate final price based on internal base price and user answers
 * @param internalBasePrice - The internal base price (not display price)
 * @param answers - Object mapping question IDs to answer IDs or arrays of answer IDs
 * @returns Final calculated price (never below 0)
 */
export function calculatePrice(
  internalBasePrice: number,
  answers: AnswerMap
): number {
  let totalModifier = 0

  // Basic Functionality Questions (Yes/No)
  if (answers.powerOn) {
    totalModifier += PRICE_MODIFIERS.powerOn[answers.powerOn as 'yes' | 'no'] || 0
  }
  if (answers.bodyDamage) {
    totalModifier += PRICE_MODIFIERS.bodyDamage[answers.bodyDamage as 'yes' | 'no'] || 0
  }
  if (answers.lcdWorking) {
    totalModifier += PRICE_MODIFIERS.lcdWorking[answers.lcdWorking as 'yes' | 'no'] || 0
  }
  if (answers.lensScratches) {
    totalModifier += PRICE_MODIFIERS.lensScratches[answers.lensScratches as 'yes' | 'no'] || 0
  }
  if (answers.autofocusWorking) {
    totalModifier += PRICE_MODIFIERS.autofocusWorking[answers.autofocusWorking as 'yes' | 'no'] || 0
  }
  if (answers.additionalLens) {
    totalModifier += PRICE_MODIFIERS.additionalLens[answers.additionalLens as 'yes' | 'no'] || 0
  }

  // Lens Condition (Single selection)
  if (answers.lensCondition) {
    const condition = answers.lensCondition as string
    totalModifier += PRICE_MODIFIERS.lensCondition[condition as keyof typeof PRICE_MODIFIERS.lensCondition] || 0
  }

  // Physical Condition (Multiple selections - additive)
  if (Array.isArray(answers.displayCondition)) {
    answers.displayCondition.forEach((condition) => {
      totalModifier += PRICE_MODIFIERS.displayCondition[condition as keyof typeof PRICE_MODIFIERS.displayCondition] || 0
    })
  } else if (answers.displayCondition) {
    totalModifier += PRICE_MODIFIERS.displayCondition[answers.displayCondition as keyof typeof PRICE_MODIFIERS.displayCondition] || 0
  }

  if (Array.isArray(answers.bodyCondition)) {
    answers.bodyCondition.forEach((condition) => {
      totalModifier += PRICE_MODIFIERS.bodyCondition[condition as keyof typeof PRICE_MODIFIERS.bodyCondition] || 0
    })
  } else if (answers.bodyCondition) {
    totalModifier += PRICE_MODIFIERS.bodyCondition[answers.bodyCondition as keyof typeof PRICE_MODIFIERS.bodyCondition] || 0
  }

  if (answers.errorCondition) {
    totalModifier += PRICE_MODIFIERS.errorCondition[answers.errorCondition as keyof typeof PRICE_MODIFIERS.errorCondition] || 0
  }

  // Functional Issues (Multiple selection - but "No Issues" overrides)
  if (answers.functionalIssues) {
    const issues = Array.isArray(answers.functionalIssues) ? answers.functionalIssues : [answers.functionalIssues]
    
    // If "noIssues" is selected, ignore all other issues
    if (issues.includes('noIssues')) {
      totalModifier += PRICE_MODIFIERS.functionalIssues.noIssues
    } else {
      issues.forEach((issue) => {
        totalModifier += PRICE_MODIFIERS.functionalIssues[issue as keyof typeof PRICE_MODIFIERS.functionalIssues] || 0
      })
    }
  }

  // Accessories (Multiple selection - additive bonuses)
  if (answers.accessories) {
    const accessoryList = Array.isArray(answers.accessories) ? answers.accessories : [answers.accessories]
    accessoryList.forEach((accessory) => {
      totalModifier += PRICE_MODIFIERS.accessories[accessory as keyof typeof PRICE_MODIFIERS.accessories] || 0
    })
  }

  // Device Age (Single selection)
  if (answers.age) {
    totalModifier += PRICE_MODIFIERS.age[answers.age as keyof typeof PRICE_MODIFIERS.age] || 0
  }

  const finalPrice = internalBasePrice + totalModifier
  return Math.max(0, finalPrice) // Ensure price never goes below 0
}



