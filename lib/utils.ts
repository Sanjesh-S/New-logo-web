import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * BasePath for GitHub Pages deployment
 * This matches the basePath in next.config.js
 */
const BASE_PATH = '/New-logo-web'

/**
 * Get the correct asset path for static exports with basePath
 * For GitHub Pages deployment, always prepend /New-logo-web
 */
export function getAssetPath(path: string): string {
  // Runtime check: if we're in browser, check the current URL
  if (typeof window !== 'undefined') {
    // Always use basePath when on GitHub Pages domain
    if (window.location.hostname.includes('github.io')) {
      return `${BASE_PATH}${path}`
    }
    // Also check if pathname already starts with basePath
    if (window.location.pathname.startsWith(BASE_PATH)) {
      return `${BASE_PATH}${path}`
    }
  }
  
  // Build-time: use basePath in production
  // This ensures correct paths in the generated HTML
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return `${BASE_PATH}${path}`
  }
  
  // Development: no basePath
  return path
}












