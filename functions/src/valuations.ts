/**
 * Valuations API Functions
 */

import { Request, Response } from 'firebase-functions'
import * as admin from 'firebase-admin'
import { valuationSchema, valuationUpdateSchema } from './schemas'
import { validateSchema, createValidationErrorResponse } from './utils/validation'
import { checkRateLimit, getClientIdentifier } from './utils/rateLimit'
import { createLogger } from './utils/logger'
// generateOrderId is now only used in pickup.ts when the user provides their pincode

const logger = createLogger('Functions:Valuations')

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

export async function createValuation(req: Request, res: Response): Promise<void> {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 100, windowMs: 60000 })
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
    const validation = validateSchema(valuationSchema, body)
    if (!validation.isValid) {
      const errorResponse = createValidationErrorResponse(validation.errors!)
      res.status(errorResponse.status).json(errorResponse.body)
      return
    }

    const {
      category,
      brand,
      model,
      condition,
      usage,
      accessories,
      basePrice,
      estimatedValue,
      userId,
      answers,
      state,
      pincode,
    } = validation.data!

    // Extract condition/usage from answers if needed
    let finalCondition = condition
    let finalUsage = usage
    let finalAccessories = accessories || []

    if (answers) {
      if (!finalCondition && answers.bodyCondition) {
        const bodyCond = Array.isArray(answers.bodyCondition)
          ? answers.bodyCondition[0]
          : answers.bodyCondition
        finalCondition = bodyCond || 'good'
      }
      if (!finalUsage && answers.age) {
        if (answers.age === 'lessThan3Months') finalUsage = 'light'
        else if (answers.age === 'fourToTwelveMonths') finalUsage = 'moderate'
        else finalUsage = 'heavy'
      }
      if (!finalAccessories.length && answers.accessories) {
        finalAccessories = Array.isArray(answers.accessories)
          ? answers.accessories
          : [answers.accessories]
      }
    }

    finalCondition = finalCondition || 'good'
    finalUsage = finalUsage || 'moderate'

    // NOTE: Order ID is generated when pickup request is created (with correct pincode)
    // The valuation will be updated with the Order ID at that time
    // For now, we just create the valuation with auto-generated document ID

    const newValuation = {
      category,
      brand,
      model,
      condition: finalCondition,
      usage: finalUsage,
      accessories: finalAccessories,
      basePrice: basePrice || 0,
      estimatedValue: estimatedValue || 0,
      userId: userId || null,
      status: 'pending',
      // orderId will be set when pickup request is created with correct pincode
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(body.pickupAddress && { pickupAddress: body.pickupAddress }),
      ...(body.userName && { userName: body.userName }),
      ...(body.userPhone && { userPhone: body.userPhone }),
      ...(state && { state }),
      ...(pincode && { pincode }),
      ...(answers && typeof answers === 'object' && Object.keys(answers).length > 0 && { answers }),
    }

    // Use auto-generated document ID
    const docRef = await db.collection('valuations').add(newValuation)
    const valuationId = docRef.id
    
    logger.info('Created valuation', { valuationId, category, brand, model })

    res.json({
      success: true,
      id: valuationId,
      message: 'Valuation created successfully',
    })
  } catch (error) {
    logger.error('Error creating valuation', error)
    res.status(500).json({
      error: 'Failed to create valuation',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export async function getValuation(req: Request, res: Response): Promise<void> {
  try {
    const id = req.query.id as string
    const userId = req.query.userId as string

    if (id) {
      const docRef = db.collection('valuations').doc(id)
      const docSnap = await docRef.get()

      if (!docSnap.exists) {
        res.status(404).json({ error: 'Valuation not found' })
        return
      }

      res.json({ valuation: { id: docSnap.id, ...docSnap.data() } })
      return
    }

    if (userId) {
      const snapshot = await db.collection('valuations')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get()

      const valuations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))

      res.json({ valuations })
      return
    }

    res.status(400).json({ error: 'Missing id or userId parameter' })
  } catch (error) {
    logger.error('Error fetching valuation', error)
    res.status(500).json({ error: 'Failed to fetch valuation' })
  }
}

export async function updateValuation(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body

    // Validate request body
    const validation = validateSchema(valuationUpdateSchema, body)
    if (!validation.isValid) {
      const errorResponse = createValidationErrorResponse(validation.errors!)
      res.status(errorResponse.status).json(errorResponse.body)
      return
    }

    const { id, ...updates } = validation.data!

    await db.collection('valuations').doc(id).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    res.json({
      success: true,
      message: 'Valuation updated successfully',
    })
  } catch (error) {
    logger.error('Error updating valuation', error)
    res.status(500).json({ error: 'Failed to update valuation' })
  }
}
