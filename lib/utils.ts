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
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Detect basePath from current location
    const pathname = window.location.pathname
    if (pathname.startsWith('/New-logo-web')) {
      return `/New-logo-web${path}`
    }
  }
  // For server-side or when basePath is not detected, use environment variable
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return `${basePath}${path}`
}












