/**
 * Calculate Device Value Function
 */

import { Request, Response } from 'firebase-functions'
import { calculateRequestSchema } from './schemas'
import { validateSchema, createValidationErrorResponse } from './utils/validation'
import { checkRateLimit, getClientIdentifier } from './utils/rateLimit'
import { createLogger } from './utils/logger'
import { getProductByBrandAndModel, loadPricingRulesForProduct } from './utils/firebase-helpers'
import { calculatePrice as calculatePriceFromAnswers, AnswerMap } from './utils/pricing'

const logger = createLogger('Functions:Calculate')

export async function calculatePrice(req: Request, res: Response): Promise<void> {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 200, windowMs: 60000 })
    if (!rateLimit.allowed) {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      })
      res.set('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString())
      res.set('X-RateLimit-Reset', rateLimit.resetTime.toString())
      return
    }

    const body = req.body

    // Validate request body
    const validation = validateSchema(calculateRequestSchema, body)
    if (!validation.isValid) {
      const errorResponse = createValidationErrorResponse(validation.errors!)
      res.status(errorResponse.status).json(errorResponse.body)
      return
    }

    const { brand, model, condition, usage, accessories } = validation.data!

    // Find product in Firebase
    const product = await getProductByBrandAndModel(brand, model)
    if (!product) {
      res.status(404).json({ error: 'Product not found. Please check brand and model name.' })
      return
    }

    // Load pricing rules from Firebase
    const pricingRules = await loadPricingRulesForProduct(product.id, product)

    // Get base price
    const basePrice = product.basePrice

    // Map legacy API inputs to assessment answer format
    const answers: AnswerMap = {}

    // Map condition to bodyCondition
    if (condition) {
      const conditionMap: Record<string, string> = {
        excellent: 'excellent',
        good: 'good',
        fair: 'fair',
        poor: 'poor',
      }
      if (conditionMap[condition]) {
        answers.bodyCondition = conditionMap[condition]
      }
    }

    // Map usage to age
    if (usage) {
      const usageMap: Record<string, string> = {
        light: 'lessThan3Months',
        moderate: 'fourToTwelveMonths',
        heavy: 'aboveTwelveMonths',
      }
      if (usageMap[usage]) {
        answers.age = usageMap[usage]
      }
    }

    // Map accessories (already in correct format)
    if (accessories && Array.isArray(accessories) && accessories.length > 0) {
      answers.accessories = accessories
    }

    // Calculate price using the same system as Assessment Wizard
    const estimatedValue = calculatePriceFromAnswers(basePrice, answers, pricingRules, product.brand)

    res.json({
      success: true,
      basePrice,
      estimatedValue,
      breakdown: {
        basePrice,
        condition: condition || null,
        usage: usage || null,
        accessoriesTotal: accessories?.length || 0,
      },
    })
  } catch (error) {
    logger.error('Error calculating value', error)
    res.status(500).json({ error: 'Failed to calculate value' })
  }
}
