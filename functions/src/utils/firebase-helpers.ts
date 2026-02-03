/**
 * Firebase helper functions for Cloud Functions
 * Mirrors lib/firebase/database.ts but uses admin.firestore()
 */

import * as admin from 'firebase-admin'
import { PricingRules, ZERO_PRICING_RULES } from './pricing'

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

export interface Product {
  id: string
  brand: string
  category: string
  modelName: string
  basePrice: number
  imageUrl?: string
  pricingRules?: PricingRules
}

/**
 * Find a product by brand and model name
 */
export async function getProductByBrandAndModel(brand: string, model: string): Promise<Product | null> {
  try {
    const normalizedBrand = brand.trim()
    const normalizedModel = model.trim()
    
    // Query by brand
    const productsRef = db.collection('products')
    const brandQuery = productsRef.where('brand', '==', normalizedBrand)
    const brandSnapshot = await brandQuery.get()
    
    if (brandSnapshot.empty) {
      return null
    }
    
    // Find product with matching model name (case-insensitive)
    for (const docSnap of brandSnapshot.docs) {
      const data = docSnap.data()
      const modelName =
        data.modelName ??
        data['Model Name'] ??
        data.name ??
        ''
      
      if (modelName.toLowerCase().trim() === normalizedModel.toLowerCase().trim()) {
        const basePrice =
          data.basePrice ??
          data.price ??
          data['Price (₹)'] ??
          0
        
        const imageUrl = data.imageUrl ?? data.image
        const pricingRules = data.pricingRules as PricingRules | undefined
        
        return {
          id: docSnap.id,
          brand: data.brand,
          category: data.category,
          modelName,
          basePrice,
          imageUrl,
          pricingRules,
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error finding product by brand and model:', error)
    return null
  }
}

/**
 * Get product pricing from productPricing collection
 */
export async function getProductPricingFromCollection(productId: string): Promise<{ pricingRules: PricingRules } | null> {
  try {
    const productPricingRef = db.collection('productPricing')
    const q = productPricingRef.where('productId', '==', productId)
    const querySnapshot = await q.get()

    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data()
      if (docData.pricingRules) {
        return { pricingRules: docData.pricingRules as PricingRules }
      }
    }
    return null
  } catch (error) {
    console.error('Error getting product pricing from collection:', error)
    return null
  }
}

/**
 * Get global pricing rules from settings/pricing
 */
export async function getPricingRules(): Promise<PricingRules> {
  try {
    const docRef = db.collection('settings').doc('pricing')
    const docSnap = await docRef.get()

    if (docSnap.exists()) {
      return docSnap.data() as PricingRules
    }
    return ZERO_PRICING_RULES
  } catch (error) {
    console.error('Error fetching pricing rules:', error)
    return ZERO_PRICING_RULES
  }
}

/**
 * Load pricing rules for a product (same priority as AssessmentWizard)
 * Priority: productPricing collection > product.pricingRules > global settings > ZERO_PRICING_RULES
 */
export async function loadPricingRulesForProduct(productId: string, product?: Product): Promise<PricingRules> {
  try {
    // First: productPricing collection
    const productPricingData = await getProductPricingFromCollection(productId)
    if (productPricingData?.pricingRules) {
      return productPricingData.pricingRules
    }
    
    // Second: product document's pricingRules field
    if (product?.pricingRules) {
      return product.pricingRules
    }
    
    // Third: global rules from Firebase
    return await getPricingRules()
  } catch (error) {
    console.error('Error loading pricing rules for product:', error)
    return ZERO_PRICING_RULES
  }
}
