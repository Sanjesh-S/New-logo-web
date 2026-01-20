import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the correct asset path for static exports with basePath
 * Handles both development (no basePath) and production (with basePath)
 * Works in both server and client components
 */
export function getAssetPath(path: string): string {
  // In production, Next.js sets basePath to '/New-logo-web' for GitHub Pages
  // Check if we're in production build
  const isProduction = process.env.NODE_ENV === 'production'
  
  // For client-side, detect from current location
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname
    if (pathname.startsWith('/New-logo-web')) {
      return `/New-logo-web${path}`
    }
    // If not on GitHub Pages domain, return path as-is
    return path
  }
  
  // For server-side/build time, use production basePath
  if (isProduction) {
    return `/New-logo-web${path}`
  }
  
  return path
}












