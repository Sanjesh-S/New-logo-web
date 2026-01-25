import { getAssetPath } from '@/lib/utils'

/**
 * Brand logo mapping
 * Maps brand names to their logo file paths in the public/images/brands/ directory
 */
const brandLogoMap: Record<string, string> = {
  'Canon': getAssetPath('/images/brands/canon.webp'),
  'Fujifilm': getAssetPath('/images/brands/fujifilm.webp'),
  'Gopro': getAssetPath('/images/brands/gopro.webp'),
  'Nikon': getAssetPath('/images/brands/nikon.webp'),
  'Sony': getAssetPath('/images/brands/sony.webp'),
  // Add more brand logos here as they become available
  // 'Apple': getAssetPath('/images/brands/apple.webp'),
  // 'Samsung': getAssetPath('/images/brands/samsung.webp'),
}

/**
 * Get the logo path for a brand name
 * @param brandName - The brand name (case-insensitive)
 * @returns The logo path if available, null otherwise
 */
export function getBrandLogo(brandName: string): string | null {
  if (!brandName) return null
  
  // Normalize brand name (capitalize first letter, rest lowercase)
  const normalized = brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase()
  
  return brandLogoMap[normalized] || null
}

/**
 * Check if a brand has a logo available
 * @param brandName - The brand name (case-insensitive)
 * @returns True if logo is available, false otherwise
 */
export function hasBrandLogo(brandName: string): boolean {
  return getBrandLogo(brandName) !== null
}
