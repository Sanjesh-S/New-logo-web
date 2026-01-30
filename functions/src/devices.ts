/**
 * Devices API Functions
 */

import { Request, Response } from 'firebase-functions'
import * as admin from 'firebase-admin'
import { createLogger } from './utils/logger'

const logger = createLogger('Functions:Devices')

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

// Maximum number of devices to return
const MAX_DEVICES_LIMIT = 500

/**
 * Validate and sanitize query parameter
 */
function sanitizeQueryParam(param: unknown): string | null {
  if (typeof param !== 'string') return null
  const sanitized = param.trim().slice(0, 100) // Limit length
  if (sanitized.length === 0) return null
  return sanitized
}

export async function getDevices(req: Request, res: Response): Promise<void> {
  try {
    // Validate and sanitize query parameters
    const category = sanitizeQueryParam(req.query.category)
    const brand = sanitizeQueryParam(req.query.brand)
    const model = sanitizeQueryParam(req.query.model)

    if (brand && model) {
      // Get specific device
      const snapshot = await db.collection('devices')
        .where('brand', '==', brand.toLowerCase())
        .where('model', '==', model)
        .limit(1)
        .get()

      if (snapshot.empty) {
        res.status(404).json({ error: 'Device not found' })
        return
      }

      const doc = snapshot.docs[0]
      res.json({ device: { id: doc.id, ...doc.data() } })
      return
    }

    if (category) {
      // Normalize category
      const normalizedCategory = category.toLowerCase().trim()
      let dbCategory = normalizedCategory

      if (normalizedCategory.includes('phone') || normalizedCategory.includes('iphone')) {
        dbCategory = 'Phone'
      } else if (normalizedCategory.includes('laptop')) {
        dbCategory = 'Laptop'
      } else if (normalizedCategory.includes('tablet') || normalizedCategory.includes('ipad')) {
        dbCategory = 'iPad'
      } else if (normalizedCategory.includes('camera')) {
        dbCategory = 'DSLR'
      }

      let query: admin.firestore.Query = db.collection('devices')
        .where('category', '==', dbCategory)
        .limit(MAX_DEVICES_LIMIT)

      if (brand) {
        query = db.collection('devices')
          .where('category', '==', dbCategory)
          .where('brand', '==', brand.trim())
          .limit(MAX_DEVICES_LIMIT)
      }

      const snapshot = await query.get()

      // If no results, try alternative categories
      if (snapshot.empty && normalizedCategory.includes('camera')) {
        const altCategories = ['Lens', 'Camera']
        for (const altCat of altCategories) {
          let altQuery: admin.firestore.Query = db.collection('devices')
            .where('category', '==', altCat)
            .limit(MAX_DEVICES_LIMIT)
          if (brand) {
            altQuery = db.collection('devices')
              .where('category', '==', altCat)
              .where('brand', '==', brand.trim())
              .limit(MAX_DEVICES_LIMIT)
          }
          const altSnapshot = await altQuery.get()
          if (!altSnapshot.empty) {
            const devices = altSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }))
            res.json({ devices })
            return
          }
        }
      }

      const devices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))

      res.json({ devices })
      return
    }

    res.status(400).json({ error: 'Missing category, or brand and model parameters' })
  } catch (error) {
    logger.error('Error fetching devices', error)
    res.status(500).json({ error: 'Failed to fetch devices' })
  }
}

export async function getDevice(req: Request, res: Response): Promise<void> {
  await getDevices(req, res)
}
