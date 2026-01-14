/**
 * Calculate Device Value Function
 */

import { Request, Response } from 'firebase-functions'
import { calculateRequestSchema } from './schemas'
import { validateSchema, createValidationErrorResponse } from './utils/validation'
import { checkRateLimit, getClientIdentifier } from './utils/rateLimit'
import { createLogger } from './utils/logger'

const logger = createLogger('Functions:Calculate')

// Base prices for different camera models
const BASE_PRICES: Record<string, Record<string, number>> = {
  canon: {
    'EOS R5': 2500,
    'EOS R6': 1800,
    'EOS 5D Mark IV': 1500,
    'EOS 90D': 800,
    'EOS M50': 400,
  },
  nikon: {
    'Z9': 3500,
    'Z7 II': 2200,
    'D850': 1800,
    'D7500': 600,
    'Z50': 500,
  },
  sony: {
    'A7 IV': 2000,
    'A7R V': 2800,
    'A6400': 700,
    'A7C': 1200,
    'FX3': 3200,
  },
  fujifilm: {
    'X-T5': 1400,
    'X-H2': 1600,
    'X-Pro3': 1200,
    'X-S10': 800,
    'GFX 100S': 4500,
  },
}

const CONDITION_MULTIPLIERS: Record<string, number> = {
  excellent: 1.0,
  good: 0.85,
  fair: 0.65,
  poor: 0.4,
}

const USAGE_MULTIPLIERS: Record<string, number> = {
  light: 1.0,
  moderate: 0.9,
  heavy: 0.75,
}

const ACCESSORY_PRICES: Record<string, number> = {
  box: 50,
  charger: 30,
  battery: 40,
  lens: 200,
}

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

    // Get base price
    const brandPrices = BASE_PRICES[brand.toLowerCase()]
    if (!brandPrices) {
      res.status(400).json({ error: 'Brand not found' })
      return
    }

    const basePrice = brandPrices[model] || 0
    if (basePrice === 0) {
      res.status(400).json({ error: 'Model not found' })
      return
    }

    // Calculate value
    let value = basePrice

    // Apply condition multiplier
    if (condition && CONDITION_MULTIPLIERS[condition]) {
      value *= CONDITION_MULTIPLIERS[condition]
    }

    // Apply usage multiplier
    if (usage && USAGE_MULTIPLIERS[usage]) {
      value *= USAGE_MULTIPLIERS[usage]
    }

    // Add accessories
    if (accessories && Array.isArray(accessories)) {
      const accessoryTotal = accessories.reduce((sum: number, acc: string) => {
        return sum + (ACCESSORY_PRICES[acc] || 0)
      }, 0)
      value += accessoryTotal
    }

    const estimatedValue = Math.round(value)

    res.json({
      success: true,
      basePrice,
      estimatedValue,
      breakdown: {
        basePrice,
        conditionMultiplier: condition ? CONDITION_MULTIPLIERS[condition] : 1,
        usageMultiplier: usage ? USAGE_MULTIPLIERS[usage] : 1,
        accessoriesTotal: accessories?.reduce((sum: number, acc: string) => {
          return sum + (ACCESSORY_PRICES[acc] || 0)
        }, 0) || 0,
      },
    })
  } catch (error) {
    logger.error('Error calculating value', error)
    res.status(500).json({ error: 'Failed to calculate value' })
  }
}
