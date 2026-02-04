import { NextRequest, NextResponse } from 'next/server'
import { calculateRequestSchema } from '@/lib/validations/schemas'
import { validateSchema, validationErrorResponse } from '@/lib/validations'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'
import { getRequestBody } from '@/lib/middleware/request-limits'
import { createLogger } from '@/lib/utils/logger'
import { getProductByBrandAndModel, loadPricingRulesForProduct } from '@/lib/firebase/database'
import { calculatePrice, type AnswerMap } from '@/lib/pricing/modifiers'

const logger = createLogger('API:Calculate')


export async function POST(request: NextRequest) {
  try {
    // Rate limiting (200 requests per minute per IP for calculations)
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 200, windowMs: 60000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        }
      )
    }
    
    // Validate request size
    const { body, error: bodyError } = await getRequestBody(request)
    if (bodyError) {
      return NextResponse.json(
        { error: bodyError },
        { status: 413 }
      )
    }
    
    // Validate request body
    const validation = validateSchema(calculateRequestSchema, body)
    if (!validation.isValid) {
      return validationErrorResponse(validation.errors!)
    }
    
    const { brand, model, condition, usage, accessories } = validation.data!

    // Find product in Firebase
    const product = await getProductByBrandAndModel(brand, model)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found. Please check brand and model name.' },
        { status: 404 }
      )
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
    const estimatedValue = calculatePrice(basePrice, answers, pricingRules, product.brand)

    return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Failed to calculate value' },
      { status: 500 }
    )
  }
}












