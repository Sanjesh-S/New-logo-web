import type { Product } from '@/lib/firebase/database'

/**
 * Extract numeric model number from product model name
 * Handles iPhone models like "iPhone 13 mini", "iPhone 14 Pro Max", etc.
 */
function extractModelNumber(modelName: string): number {
  // Match patterns like "iPhone 13", "iPhone 14 Pro", "13 mini", etc.
  const match = modelName.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Get sort priority for model variants
 * Lower number = higher priority (appears first)
 */
function getVariantPriority(modelName: string): number {
  const lower = modelName.toLowerCase()
  
  // Order: Pro Max > Pro > Plus > (base) > mini > SE
  if (lower.includes('pro max')) return 1
  if (lower.includes('pro')) return 2
  if (lower.includes('plus')) return 3
  if (lower.includes('mini')) return 5
  if (lower.includes('se')) return 6
  // Base model (no variant) gets priority 4
  return 4
}

/**
 * Sort products by model name in a logical order
 * For iPhone: Sorts by model number (descending), then by variant priority
 * For other brands: Alphabetical by model name
 */
export function sortProducts(products: Product[], brand: string): Product[] {
  const sorted = [...products]
  
  // Special handling for Apple iPhone products
  if (brand.toLowerCase() === 'apple') {
    sorted.sort((a, b) => {
      const aModelNum = extractModelNumber(a.modelName)
      const bModelNum = extractModelNumber(b.modelName)
      
      // First sort by model number (descending - newest first)
      if (aModelNum !== bModelNum) {
        return bModelNum - aModelNum
      }
      
      // If same model number, sort by variant priority
      const aPriority = getVariantPriority(a.modelName)
      const bPriority = getVariantPriority(b.modelName)
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // If same variant, sort alphabetically
      return a.modelName.localeCompare(b.modelName)
    })
  } else {
    // For other brands, sort alphabetically
    sorted.sort((a, b) => {
      // Try to extract numbers first for better sorting
      const aModelNum = extractModelNumber(a.modelName)
      const bModelNum = extractModelNumber(b.modelName)
      
      if (aModelNum !== 0 && bModelNum !== 0 && aModelNum !== bModelNum) {
        // Both have numbers, sort by number (descending)
        return bModelNum - aModelNum
      }
      
      // Otherwise, sort alphabetically
      return a.modelName.localeCompare(b.modelName)
    })
  }
  
  return sorted
}
